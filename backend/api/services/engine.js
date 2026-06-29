const { ObjectId } = require('mongodb');

function fail(errCode, message) {
  const e = new Error(message);
  e.errCode = errCode;
  e.isBusiness = true;
  return e;
}

function nativeDb() {
  const ds = sails.getDatastore();
  return { db: ds.manager, client: ds.manager.client };
}
function oid(idStr) { return new ObjectId(String(idStr)); }

async function checksumOf(pocketDoc) {
  return await sails.helpers.computeChecksum(
    pocketDoc.balance, pocketDoc.ownerType, pocketDoc.ownerRef, pocketDoc.currency || 'VND'
  );
}

const QUERY_FNS = {
  // trả id ví của 1 customer theo userId
  queryPocketByUserId: async (userId) => {
    const c = await Customer.findOne(userId);
    if (!c || !c.pocket) throw fail(404, 'Không tìm thấy ví người gửi');
    return c.pocket;
  },
  // trả id ví của customer theo số điện thoại
  queryPocketByPhone: async (phone) => {
    const c = await Customer.findOne({ phone: `${phone}` });
    if (!c || !c.pocket) throw fail(404, 'Không tìm thấy ví người nhận (sai SĐT?)');
    return c.pocket;
  },
};

async function buildFields(service, ctx) {
  const body = {};
  body.SERVICEID = String(service.id);
  body.USERID = ctx.userId;
  const params = ctx.parameters || {};

  for (const f of (service.fieldBuilder || [])) {
    if (f.source === 'fixed') {
      body[f.name] = f.value;
    } else if (f.source === 'mapping') {
      body[f.name] = params[f.from];
    } else if (f.source === 'context') {
      body[f.name] = ctx[f.from] !== undefined ? ctx[f.from] : body[f.from];
    } else if (f.source === 'query') {
      const fn = QUERY_FNS[f.fn];
      if (!fn) throw fail(500, 'Query function chưa hỗ trợ: ' + f.fn);
      const argVal = body[f.arg] !== undefined ? body[f.arg] : params[f.arg];
      body[f.name] = await fn(argVal);
    } else {
      throw fail(500, 'Nguồn fieldBuilder chưa hỗ trợ: ' + f.source);
    }
  }
  return body;
}

// ───────────────────────── validate định dạng ─────────────────────────
async function validateFields(service, body) {
  const fields = await TransField.find({ service: String(service.id), status: 'active' });
  for (const f of fields) {
    const v = body[f.fieldName];
    if (f.isRequired && (v === undefined || v === null || v === '')) {
      throw fail(f.errorCode || 400, `Thiếu trường ${f.fieldName}`);
    }
    if (v === undefined || v === null || v === '') continue;
    if (f.fieldFormat === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) throw fail(f.errorCode || 400, `${f.fieldName} phải là số`);
      if (n <= 0) throw fail(f.errorCode || 400, `${f.fieldName} phải > 0`);
      body[f.fieldName] = n;
    }
    if (f.regex) {
      const re = new RegExp(f.regex);
      if (!re.test(`${v}`)) throw fail(f.errorCode || 400, `${f.fieldName} sai định dạng`);
    }
  }
}

// ───────────────────────── tính phí ─────────────────────────
function computeFee(service, body) {
  const fee = service.feeConfig || { type: 'fixed', value: 0 };
  let debitFee = 0;
  const amount = Number(body.AMOUNT || 0);
  if (fee.type === 'fixed') debitFee = Number(fee.value || 0);
  else if (fee.type === 'percent') {
    debitFee = Math.round((amount * Number(fee.value || 0)) / 100);
    if (fee.min) debitFee = Math.max(debitFee, Number(fee.min));
    if (fee.cap) debitFee = Math.min(debitFee, Number(fee.cap));
  }
  body.DEBITFEE = debitFee;
  body.TOTALAMOUNT = amount + debitFee;
}

// ───────────────────────── validate nghiệp vụ ─────────────────────────
const VALIDATORS = {
  validateReceiverIsNotSender: async ([senderId, receiverId]) => {
    if (String(senderId) === String(receiverId)) throw fail(400, 'Không thể tự chuyển cho chính mình');
  },
  validateSenderAccountSufficiency: async ([senderId, amount, fee]) => {
    const p = await Pocket.findOne(senderId);
    if (!p) throw fail(404, 'Không tìm thấy ví người gửi');
    const need = Number(amount || 0) + Number(fee || 0);
    if (p.balance < need) throw fail(4001, 'Số dư không đủ');
  },
};

async function validateBusiness(service, body) {
  const rules = await TransValidation.find({ service: String(service.id), status: 'active' }).sort('order ASC');
  for (const r of rules) {
    const fn = VALIDATORS[r.validateFunc];
    if (!fn) throw fail(500, 'Validator chưa hỗ trợ: ' + r.validateFunc);
    const args = (r.validateFields || '').split(':').filter(Boolean).map((name) => body[name]);
    await fn(args);
  }
}

// ───────────────────────── resolve target ví của glStep ─────────────────────────
async function resolveTarget(spec, body) {
  if (!spec) throw fail(500, 'glStep thiếu target');
  if (spec.level === 'productLevel') return body[spec.target];
  if (spec.level === 'wallet') return spec.target;
  if (spec.level === 'systemAccount') {
    const p = await Pocket.findOne({ ownerType: 'system', ownerRef: spec.target });
    if (!p) throw fail(500, 'Chưa seed ví hệ thống vai trò: ' + spec.target);
    return p.id;
  }
  throw fail(500, 'glStep level chưa hỗ trợ: ' + spec.level);
}

// ───────────────────────── ghi sổ (executeLedger) ─────────────────────────
async function moveMoney(db, debitId, creditId, amount, refId, stepOrder, session) {
  const pockets = db.collection('pocket');
  const entries = db.collection('pocketentry');
  const opt = session ? { session } : {};

  // 1) trừ ví debit (nguyên tử, chặn âm)
  const dDoc = await pockets.findOneAndUpdate(
    { _id: oid(debitId), balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    Object.assign({ returnDocument: 'after' }, opt)
  );
  if (!dDoc) throw fail(4001, 'Số dư không đủ khi ghi sổ');
  await pockets.updateOne({ _id: dDoc._id },
    { $set: { checksum: await checksumOf(dDoc), updatedAt: Date.now() } }, opt);

  // 2) cộng ví credit
  const cDoc = await pockets.findOneAndUpdate(
    { _id: oid(creditId) },
    { $inc: { balance: amount } },
    Object.assign({ returnDocument: 'after' }, opt)
  );
  if (!cDoc) throw fail(404, 'Không tìm thấy ví nhận khi ghi sổ');
  await pockets.updateOne({ _id: cDoc._id },
    { $set: { checksum: await checksumOf(cDoc), updatedAt: Date.now() } }, opt);

  // 3) ghi bút toán
  await entries.insertOne({
    _id: new ObjectId(), transRefId: refId, stepOrder, debit: debitId, credit: creditId,
    amount, status: 'settled', createdAt: Date.now(), updatedAt: Date.now(),
  }, opt);
}

// Chạy toàn bộ glSteps + tạo Transaction + lật Trail=done. Best-effort transaction.
async function executeLedger(service, body, trailId) {
  const { db, client } = nativeDb();
  const def = await TransDefinition.findOne({ service: String(service.id) });
  const steps = (def && def.glSteps) || [];

  // pre-resolve để bắt lỗi config trước khi đụng tiền
  const resolved = [];
  for (const s of steps) {
    resolved.push({
      order: s.order,
      amount: Number(body[s.amount] !== undefined ? body[s.amount] : s.amount),
      debitId: await resolveTarget(s.debit, body),
      creditId: await resolveTarget(s.credit, body),
    });
  }

  const txnDoc = {
    _id: new ObjectId(),
    code: 'TXN' + Date.now(),
    transRefId: trailId,
    service: String(service.id),
    sender: body.SENDERID || '',
    receiver: body.RECEIVERID || '',
    amount: Number(body.AMOUNT || 0),
    fee: Number(body.DEBITFEE || 0),
    totalAmount: Number(body.TOTALAMOUNT || 0),
    status: 'done', billerRefId: '', partnerRef: '',
    createdAt: Date.now(), updatedAt: Date.now(),
  };

  const apply = async (session) => {
    for (const r of resolved) {
      await moveMoney(db, r.debitId, r.creditId, r.amount, trailId, r.order, session);
    }
    await db.collection('transaction').insertOne(txnDoc, session ? { session } : {});
    await db.collection('transactiontrail').updateOne(
      { _id: oid(trailId) },
      { $set: { status: 'done', updatedAt: Date.now() } },
      session ? { session } : {}
    );
  };

  // thử transaction; nếu Mongo không hỗ trợ (topology single) → fallback ghi thẳng
  const session = client.startSession();
  try {
    await session.withTransaction(async () => { await apply(session); });
  } catch (e) {
    await session.endSession();
    if (e && e.isBusiness) throw e;           // lỗi nghiệp vụ (đủ tiền...) → KHÔNG fallback
    sails.log.warn('Transaction không khả dụng, ghi sổ không-transaction: ' + e.message);
    await apply(undefined);                   // withTransaction đã rollback → chạy lại an toàn
    return txnDoc;
  }
  await session.endSession();
  return txnDoc;
}

// ───────────────────────── 3 RUNTIME ─────────────────────────
async function loadEnabledService(serviceCode) {
  const service = await Service.findOne({ code: serviceCode });
  if (!service) throw fail(404, 'Không tìm thấy service: ' + serviceCode);
  if (!service.enabled) throw fail(403, 'Service đang tắt: ' + serviceCode);
  return service;
}

// BƯỚC 1 — Request: dựng field, validate, tính phí, validate nghiệp vụ → Trail pending → preview
async function processRequest(serviceCode, parameters, ctx) {
  const service = await loadEnabledService(serviceCode);
  const body = await buildFields(service, { userId: ctx.userId, parameters });
  await validateFields(service, body);
  computeFee(service, body);
  await validateBusiness(service, body);

  const trail = await TransactionTrail.create({
    service: String(service.id),
    inputMessage: { serviceCode, parameters, userId: ctx.userId },
    outputMessage: { TRANSBODY: body },
    transStepLog: [{ step: 'request', at: Date.now() }],
    status: 'pending',
  }).fetch();

  body.TRANSREFID = trail.id;
  await TransactionTrail.updateOne(trail.id).set({ outputMessage: { TRANSBODY: body } });

  return { transRefId: trail.id, amount: body.AMOUNT, fee: body.DEBITFEE, total: body.TOTALAMOUNT };
}

// BƯỚC 2 — Confirm: trả phương thức xác thực
async function processConfirm(transRefId, ctx) {
  const trail = await TransactionTrail.findOne(transRefId);
  if (!trail) throw fail(404, 'Không tìm thấy giao dịch');
  if (trail.status !== 'pending') throw fail(409, 'Giao dịch không ở trạng thái chờ xác nhận');
  const service = await Service.findOne(trail.service);
  const authMethod = (service.auth && service.auth.method) || 'NONE';
  return { transRefId, authMethod };
}

// BƯỚC 3 — Verify: khoá ví → kiểm PIN → validate lại → ghi sổ ACID → mở khoá
async function processVerify(transRefId, pin, ctx) {
  const trail = await TransactionTrail.findOne(transRefId);
  if (!trail) throw fail(404, 'Không tìm thấy giao dịch');
  if (trail.status !== 'pending') throw fail(409, 'Giao dịch đã xử lý hoặc không hợp lệ');
  if (String(trail.inputMessage.userId) !== String(ctx.userId)) throw fail(403, 'Không phải giao dịch của bạn');

  const service = await Service.findOne(trail.service);

  // dựng lại từ đầu (không tin số cũ)
  const body = await buildFields(service, { userId: trail.inputMessage.userId, parameters: trail.inputMessage.parameters });
  body.TRANSREFID = transRefId;
  await validateFields(service, body);
  computeFee(service, body);

  const senderId = body.SENDERID;
  let locked = false;
  try {
    // KHOÁ ví nguồn (nếu có) — chống double-submit
    if (senderId) {
      const lockRes = await Pocket.updateOne({ id: senderId, state: 'idle' }).set({ state: 'inProgress' });
      if (!lockRes) throw fail(409, 'Ví đang có giao dịch khác, thử lại sau');
      locked = true;
    }

    // Xác thực PIN
    const authMethod = (service.auth && service.auth.method) || 'NONE';
    if (authMethod === 'PIN') {
      const bcrypt = require('bcryptjs');
      if (!pin) throw fail(401, 'Thiếu PIN');
      if (!(await bcrypt.compare(`${pin}`, ctx.user.pinHash))) throw fail(401, 'PIN không đúng');
    }

    await validateBusiness(service, body);          // kiểm lại luật (số dư có thể đã đổi)
    const txn = await executeLedger(service, body, transRefId);   // ★ tiền chạy ở đây

    return {
      transRefId, status: 'done',
      transaction: { code: txn.code, amount: txn.amount, fee: txn.fee, total: txn.totalAmount },
    };
  } catch (e) {
    // lỗi trước/khi ghi sổ → đánh dấu Trail failed (executeLedger đã rollback nếu lỗi giữa chừng)
    if (trail.status === 'pending') await TransactionTrail.updateOne(transRefId).set({ status: 'failed' });
    throw e;
  } finally {
    if (locked) await Pocket.updateOne({ id: senderId }).set({ state: 'idle' });  // MỞ KHOÁ ở mọi lối ra
  }
}

module.exports = { processRequest, processConfirm, processVerify };
