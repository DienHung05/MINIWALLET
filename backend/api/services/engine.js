const { ObjectId } = require('mongodb');

function fail(errCode, message) { const e = new Error(message); e.errCode = errCode; e.isBusiness = true; return e; }
function nativeDb() { const ds = sails.getDatastore(); return { db: ds.manager, client: ds.manager.client }; }
function oid(idStr) { return new ObjectId(String(idStr)); }
function mask(s) { s = `${s || ''}`; return '****' + s.slice(-4); }

async function checksumOf(p) {
  return await sails.helpers.computeChecksum(p.balance, p.ownerType, p.ownerRef, p.currency || 'VND');
}

const QUERY_FNS = {
  queryPocketByUserId: async (userId) => {
    const c = await Customer.findOne(userId);
    if (!c || !c.pocket) throw fail(404, 'Không tìm thấy ví người gửi');
    return c.pocket;
  },
  queryPocketByPhone: async (phone) => {
    const c = await Customer.findOne({ phone: `${phone}` });
    if (!c || !c.pocket) throw fail(404, 'Không tìm thấy ví người nhận (sai SĐT?)');
    return c.pocket;
  },
};

async function buildFields(service, ctx) {
  const body = {}; body.SERVICEID = String(service.id); body.USERID = ctx.userId;
  const params = ctx.parameters || {};
  for (const f of (service.fieldBuilder || [])) {
    if (f.source === 'fixed') body[f.name] = f.value;
    else if (f.source === 'mapping') body[f.name] = params[f.from];
    else if (f.source === 'context') body[f.name] = ctx[f.from] !== undefined ? ctx[f.from] : body[f.from];
    else if (f.source === 'query') {
      const fn = QUERY_FNS[f.fn]; if (!fn) throw fail(500, 'Query fn chưa hỗ trợ: ' + f.fn);
      body[f.name] = await fn(body[f.arg] !== undefined ? body[f.arg] : params[f.arg]);
    } else throw fail(500, 'Nguồn fieldBuilder chưa hỗ trợ: ' + f.source);
  }
  return body;
}

async function validateFields(service, body) {
  const fields = await TransField.find({ service: String(service.id), status: 'active' });
  for (const f of fields) {
    const v = body[f.fieldName];
    if (f.isRequired && (v === undefined || v === null || v === '')) throw fail(f.errorCode || 400, `Thiếu trường ${f.fieldName}`);
    if (v === undefined || v === null || v === '') continue;
    if (f.fieldFormat === 'number') {
      const n = Number(v); if (Number.isNaN(n)) throw fail(f.errorCode || 400, `${f.fieldName} phải là số`);
      if (n <= 0) throw fail(f.errorCode || 400, `${f.fieldName} phải > 0`); body[f.fieldName] = n;
    }
    if (f.regex && !(new RegExp(f.regex)).test(`${v}`)) throw fail(f.errorCode || 400, `${f.fieldName} sai định dạng`);
  }
}

function computeFee(service, body) {
  const fee = service.feeConfig || { type: 'fixed', value: 0 };
  const amount = Number(body.AMOUNT || 0); let d = 0;
  if (fee.type === 'fixed') d = Number(fee.value || 0);
  else if (fee.type === 'percent') {
    d = Math.round((amount * Number(fee.value || 0)) / 100);
    if (fee.min) d = Math.max(d, Number(fee.min)); if (fee.cap) d = Math.min(d, Number(fee.cap));
  }
  body.DEBITFEE = d; body.TOTALAMOUNT = amount + d;
}

const VALIDATORS = {
  validateReceiverIsNotSender: async ([s, r]) => { if (String(s) === String(r)) throw fail(400, 'Không thể tự chuyển cho chính mình'); },
  validateSenderAccountSufficiency: async ([s, a, f]) => {
    const p = await Pocket.findOne(s); if (!p) throw fail(404, 'Không tìm thấy ví người gửi');
    if (p.balance < Number(a || 0) + Number(f || 0)) throw fail(4001, 'Số dư không đủ');
  },
};
async function validateBusiness(service, body) {
  const rules = await TransValidation.find({ service: String(service.id), status: 'active' }).sort('order ASC');
  for (const r of rules) {
    const fn = VALIDATORS[r.validateFunc]; if (!fn) throw fail(500, 'Validator chưa hỗ trợ: ' + r.validateFunc);
    await fn((r.validateFields || '').split(':').filter(Boolean).map((n) => body[n]));
  }
}

// ── HOOK: gọi connector theo pha (onRequest/onConfirm/onPreVerify) ──
async function runHooks(service, phase, body) {
  for (const h of (service.hooks || []).filter((x) => x.phase === phase)) {
    const args = {};
    for (const k of Object.keys(h.inputMap || {})) args[k] = body[h.inputMap[k]];
    let out;
    try { out = await sails.helpers.callConnector(h.connector, h.operation, args, body.TRANSREFID); }
    catch (e) { throw fail(502, `Lỗi gọi ${h.connector}.${h.operation}: ${e.message}`); }  // network/timeout (S10 xử lý in-doubt)
    if (!out.ok) {
      if ((h.onFailure || 'abort') === 'ignore') continue;
      throw fail(400, `${h.connector}.${h.operation}: ${(out.raw && out.raw.message) || 'đối tác từ chối'}`);
    }
    for (const k of Object.keys(h.outputMap || {})) body[k] = out.data[h.outputMap[k]];
  }
}

// ── EFFECT: side-effect phi tiền tệ (tạo Instrument) ──
async function applyEffects(service, body, db, session) {
  if (!db) db = nativeDb().db;
  const results = [];
  const opt = session ? { session } : {};
  for (const eff of (service.effects || [])) {
    if (eff.type === 'createInstrument') {
      const w = eff.with || {};
      const doc = {
        _id: new ObjectId(),
        customer: body.USERID, type: w.type || 'bankAccount', connector: w.connector || '',
        token: body[w.tokenVar] || '', holderName: body[w.nameVar] || '',
        maskedNumber: mask(body[w.maskedVar]), status: 'active',
        meta: { bankCode: body.BANKCODE },
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      await db.collection('instrument').insertOne(doc, opt);
      results.push({ instrumentId: String(doc._id), masked: doc.maskedNumber, type: doc.type, connector: doc.connector });
    }
  }
  return results;
}

async function resolveTarget(spec, body) {
  if (!spec) throw fail(500, 'glStep thiếu target');
  if (spec.level === 'productLevel') return body[spec.target];
  if (spec.level === 'wallet') return spec.target;
  if (spec.level === 'systemAccount') {
    const p = await Pocket.findOne({ ownerRef: spec.target, ownerType: ['system', 'suspense', 'nostro', 'bank'] });
    if (!p) throw fail(500, 'Chưa seed ví vai trò: ' + spec.target); return p.id;
  }
  throw fail(500, 'glStep level chưa hỗ trợ: ' + spec.level);
}

async function moveMoney(db, debitId, creditId, amount, refId, stepOrder, session) {
  const pockets = db.collection('pocket'), entries = db.collection('pocketentry'), opt = session ? { session } : {};
  const dDoc = await pockets.findOneAndUpdate({ _id: oid(debitId), balance: { $gte: amount } }, { $inc: { balance: -amount } }, Object.assign({ returnDocument: 'after' }, opt));
  if (!dDoc) throw fail(4001, 'Số dư không đủ khi ghi sổ');
  await pockets.updateOne({ _id: dDoc._id }, { $set: { checksum: await checksumOf(dDoc), updatedAt: Date.now() } }, opt);
  const cDoc = await pockets.findOneAndUpdate({ _id: oid(creditId) }, { $inc: { balance: amount } }, Object.assign({ returnDocument: 'after' }, opt));
  if (!cDoc) throw fail(404, 'Không tìm thấy ví nhận khi ghi sổ');
  await pockets.updateOne({ _id: cDoc._id }, { $set: { checksum: await checksumOf(cDoc), updatedAt: Date.now() } }, opt);
  await entries.insertOne({ _id: new ObjectId(), transRefId: refId, stepOrder, debit: debitId, credit: creditId, amount, status: 'settled', createdAt: Date.now(), updatedAt: Date.now() }, opt);
}

// Ghi sổ generic: chạy `steps`, (tuỳ chọn) tạo Transaction, lật Trail sang finalStatus — ACID best-effort.
// opts: { serviceId, finalStatus, makeTxn, txnStatus, baseOrder, effectsService }
async function runLedger(steps, body, trailId, opts) {
  const { db, client } = nativeDb();
  let order = opts.baseOrder || 0;
  const resolved = [];
  for (const s of (steps || [])) resolved.push({
    order: (s.order != null ? s.order : order++),
    amount: Number(body[s.amount] !== undefined ? body[s.amount] : s.amount),
    debitId: await resolveTarget(s.debit, body), creditId: await resolveTarget(s.credit, body),
  });

  const txnDoc = opts.makeTxn ? {
    _id: new ObjectId(), code: 'TXN' + Date.now(), transRefId: trailId, service: String(opts.serviceId),
    sender: body.SENDERID || '', receiver: body.RECEIVERID || body.DESTACCOUNT || '', amount: Number(body.AMOUNT || 0),
    fee: Number(body.DEBITFEE || 0), totalAmount: Number(body.TOTALAMOUNT || 0),
    status: opts.txnStatus || 'done', billerRefId: '', partnerRef: body.PARTNERREF || '', createdAt: Date.now(), updatedAt: Date.now(),
  } : null;

  let effects = [];
  const apply = async (session) => {
    for (const r of resolved) await moveMoney(db, r.debitId, r.creditId, r.amount, trailId, r.order, session);
    if (txnDoc) await db.collection('transaction').insertOne(txnDoc, session ? { session } : {});
    if (opts.effectsService) effects = await applyEffects(opts.effectsService, body, db, session);
    await db.collection('transactiontrail').updateOne({ _id: oid(trailId) }, { $set: { status: opts.finalStatus, updatedAt: Date.now() } }, session ? { session } : {});
  };
  const session = client.startSession();
  try { await session.withTransaction(async () => { await apply(session); }); }
  catch (e) {
    await session.endSession();
    if (e && (e.isBusiness || e.code === 11000)) {
      if (e.code === 11000) throw fail(409, 'Giao dịch đã được ghi sổ (trùng transRefId/bút toán)');
      throw e;
    }
    sails.log.warn('Transaction không khả dụng, ghi sổ không-transaction: ' + e.message);
    await apply(undefined); return { txn: txnDoc, effects };
  }
  await session.endSession(); return { txn: txnDoc, effects };
}

// Ghi sổ đồng bộ: đọc glSteps từ TransDefinition, tạo Transaction, lật Trail=done.
async function executeLedger(service, body, trailId) {
  const def = await TransDefinition.findOne({ service: String(service.id) });
  return await runLedger((def && def.glSteps) || [], body, trailId,
    { serviceId: service.id, finalStatus: 'done', makeTxn: true, txnStatus: 'done', baseOrder: 0, effectsService: service });
}

async function loadEnabledService(code) {
  const s = await Service.findOne({ code }); if (!s) throw fail(404, 'Không tìm thấy service: ' + code);
  if (!s.enabled) throw fail(403, 'Service đang tắt: ' + code); return s;
}

async function processRequest(serviceCode, parameters, ctx) {
  const service = await loadEnabledService(serviceCode);
  const body = await buildFields(service, { userId: ctx.userId, parameters });
  await validateFields(service, body);
  await runHooks(service, 'onRequest', body);     // vd Bill: inquiry
  computeFee(service, body);
  await validateBusiness(service, body);
  const trail = await TransactionTrail.create({
    service: String(service.id), inputMessage: { serviceCode, parameters, userId: ctx.userId },
    outputMessage: { TRANSBODY: body }, transStepLog: [{ step: 'request', at: Date.now() }], status: 'pending',
  }).fetch();
  body.TRANSREFID = trail.id;
  await TransactionTrail.updateOne(trail.id).set({ outputMessage: { TRANSBODY: body } });
  return { transRefId: trail.id, amount: body.AMOUNT, fee: body.DEBITFEE, total: body.TOTALAMOUNT };
}

async function processConfirm(transRefId, ctx) {
  const trail = await TransactionTrail.findOne(transRefId);
  if (!trail) throw fail(404, 'Không tìm thấy giao dịch');
  if (trail.status !== 'pending') throw fail(409, 'Giao dịch không ở trạng thái chờ');
  const service = await Service.findOne(trail.service);
  const body = (trail.outputMessage && trail.outputMessage.TRANSBODY) || {}; body.TRANSREFID = transRefId;
  await runHooks(service, 'onConfirm', body);      // vd Link bank: sendOtp -> OTPREF
  await TransactionTrail.updateOne(transRefId).set({ outputMessage: { TRANSBODY: body } });
  return { transRefId, authMethod: (service.auth && service.auth.method) || 'NONE' };
}

// Trả lại biên lai của 1 giao dịch đã kết thúc (replay idempotent)
async function finalResultOf(trail) {
  if (trail.status === 'done') {
    const txn = await Transaction.findOne({ transRefId: trail.id });
    return { transRefId: trail.id, status: 'done', replay: true,
      transaction: txn ? { code: txn.code, amount: txn.amount, fee: txn.fee, total: txn.totalAmount } : null };
  }
  return { transRefId: trail.id, status: trail.status, replay: true };
}

async function processVerify(transRefId, credential, ctx) {
  const trail0 = await TransactionTrail.findOne(transRefId);
  if (!trail0) throw fail(404, 'Không tìm thấy giao dịch');
  if (String(trail0.inputMessage.userId) !== String(ctx.userId)) throw fail(403, 'Không phải giao dịch của bạn');

  // L1 — CAS CLAIM: chỉ MỘT request đổi được pending -> processing (chống double-submit)
  const claimed = await TransactionTrail.updateOne({ id: transRefId, status: 'pending' }).set({ status: 'processing' });
  if (!claimed) {
    const t = await TransactionTrail.findOne(transRefId);
    // L4 — Replay idempotent: đã done/failed/reversed -> trả lại kết quả cũ, KHÔNG xử lý lần 2
    if (t && ['done', 'failed', 'reversed', 'expired'].includes(t.status)) return await finalResultOf(t);
    throw fail(409, 'Giao dịch đang được xử lý, vui lòng đợi');
  }

  const service = await Service.findOne(trail0.service);
  const stored = (trail0.outputMessage && trail0.outputMessage.TRANSBODY) || {};
  const fresh = await buildFields(service, { userId: trail0.inputMessage.userId, parameters: trail0.inputMessage.parameters });
  const body = Object.assign({}, stored, fresh);   // giữ OTPREF từ confirm
  body.TRANSREFID = transRefId; body.OTP = credential; body.CREDENTIAL = credential;
  await validateFields(service, body);
  computeFee(service, body);

  // Cờ đồng thời: 'optimistic' -> KHÔNG khoá ví (cho fan-out chạy song song, dựa $inc atomic)
  const optimistic = service.concurrency === 'optimistic';
  const senderId = body.SENDERID; let locked = false;
  try {
    if (senderId && !optimistic) {
      const lockRes = await Pocket.updateOne({ id: senderId, state: 'idle' }).set({ state: 'inProgress' });
      if (!lockRes) throw fail(409, 'Ví đang có giao dịch khác, thử lại sau'); locked = true;
    }
    const method = (service.auth && service.auth.method) || 'NONE';
    if (method === 'PIN') {
      const bcrypt = require('bcryptjs');
      if (!credential) throw fail(401, 'Thiếu PIN');
      if (!(await bcrypt.compare(`${credential}`, ctx.user.pinHash))) throw fail(401, 'PIN không đúng');
    }
    await validateBusiness(service, body);
    await runHooks(service, 'onPreVerify', body);   // vd validateAccount / verifyOtp / charge thẻ

    const settlement = service.settlement || { mode: 'sync' };
    if (settlement.mode === 'async') {
      // GIỮ tiền: ghi glSteps (khách -> SUSPENSE + phí -> SYSTEM), Trail -> processing, CHƯA tạo biên lai
      const def = await TransDefinition.findOne({ service: String(service.id) });
      await runLedger((def && def.glSteps) || [], body, transRefId,
        { serviceId: service.id, finalStatus: 'processing', makeTxn: false, baseOrder: 0 });
      await TransactionTrail.updateOne(transRefId).set({ outputMessage: { TRANSBODY: body } });
      // Gửi lệnh ra đối tác (onSettle). Timeout/lỗi mạng -> GIỮ processing để đối soát (không kết luận)
      try {
        await runHooks(service, 'onSettle', body);
        await TransactionTrail.updateOne(transRefId).set({ outputMessage: { TRANSBODY: body } });
      }
      catch (e) { sails.log.warn('onSettle lỗi (giữ processing để đối soát): ' + e.message); }
      return { transRefId, status: 'processing', destName: body.DESTNAME || null, partnerRef: body.PARTNERREF || null };
    }

    const ledger = await executeLedger(service, body, transRefId);   // flip processing -> done (+unique index chống ghi trùng)
    const txn = ledger.txn;
    return { transRefId, status: 'done', transaction: { code: txn.code, amount: txn.amount, fee: txn.fee, total: txn.totalAmount }, effects: ledger.effects };
  } catch (e) {
    await TransactionTrail.updateOne({ id: transRefId, status: 'processing' }).set({ status: 'failed' });
    throw e;
  } finally {
    if (locked) await Pocket.updateOne({ id: senderId }).set({ state: 'idle' });
  }
}

// RUNTIME 4 — Callback: đối tác báo kết quả giao dịch async -> chốt (done) hoặc hoàn (reversed).
// Idempotent: chỉ xử lý khi Trail đang 'processing'; gọi trùng -> trả trạng thái hiện tại.
async function processCallback(connectorCode, payload) {
  const refId = payload.refId || payload.transRefId;
  if (!refId) throw fail(400, 'Thiếu refId');
  const trail = await TransactionTrail.findOne(refId);
  if (!trail) throw fail(404, 'Không tìm thấy giao dịch');
  if (trail.status !== 'processing') return await finalResultOf(trail);   // đã chốt rồi -> idempotent

  const service = await Service.findOne(trail.service);
  const settlement = service.settlement || {};
  const body = (trail.outputMessage && trail.outputMessage.TRANSBODY) || {};
  body.TRANSREFID = refId;
  const state = `${payload.state || ''}`.toUpperCase();

  if (state === 'SUCCESS') {
    // chốt: SUSPENSE -> NOSTRO (tiền thực sự rời hệ thống), tạo biên lai, Trail -> done
    await runLedger(settlement.settleSteps || [], body, refId,
      { serviceId: service.id, finalStatus: 'done', makeTxn: true, txnStatus: 'done', baseOrder: 10 });
    return { transRefId: refId, status: 'done' };
  }
  if (state === 'FAILED') {
    // hoàn: SUSPENSE -> SENDER (hoàn tiền), Trail -> reversed
    await runLedger(settlement.reverseSteps || [], body, refId,
      { serviceId: service.id, finalStatus: 'reversed', makeTxn: true, txnStatus: 'reversed', baseOrder: 20 });
    return { transRefId: refId, status: 'reversed' };
  }
  return { transRefId: refId, status: 'processing', note: 'state chưa rõ — giữ processing để đối soát' };
}

module.exports = { processRequest, processConfirm, processVerify, processCallback };
