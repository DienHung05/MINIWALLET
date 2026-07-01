module.exports.bootstrap = async function () {
  if (!sails.models) {
    sails.log.error('sails.models undefined — sails-hook-orm chưa được nạp?');
    return;
  }
  Object.keys(sails.models).forEach(function (identity) {
    const model = sails.models[identity];
    global[model.globalId || identity] = model;
  });
  sails.log.info('Globalized models: ' + Object.keys(sails.models).join(', '));

  // Unique index 
  try {
    const db = sails.getDatastore().manager;
    await db.collection('transaction').createIndex({ transRefId: 1 }, { unique: true });
    await db.collection('pocketentry').createIndex({ transRefId: 1, stepOrder: 1 }, { unique: true });
    sails.log.info('Index: transaction.transRefId + pocketentry(transRefId,stepOrder) [unique]');
  } catch (e) {
    sails.log.warn('Không tạo được unique index (có thể do dữ liệu trùng cũ): ' + e.message);
  }

  if (!(await Currency.findOne({ code: 'VND' }))) {
    await Currency.create({ code: 'VND', name: 'Vietnam Dong', decimal: 0 });
    sails.log.info('Seed: Currency VND');
  }

  if (!(await Officer.findOne({ username: 'admin' }))) {
    const passwordHash = await sails.helpers.hashPin('admin123');
    await Officer.create({ username: 'admin', passwordHash });
    sails.log.info('Seed: Officer admin/admin123');
  }

  if (!(await Pocket.findOne({ ownerType: 'system', ownerRef: 'SYSTEM_FEE' }))) {
    const checksum = await sails.helpers.computeChecksum(0, 'system', 'SYSTEM_FEE', 'VND');
    await Pocket.create({ ownerType: 'system', ownerRef: 'SYSTEM_FEE', balance: 0, checksum });
    sails.log.info('Seed: System pocket SYSTEM_FEE');
  }

  // Config P2P 
  let p2p = await Service.findOne({ code: 'P2P' });
  if (!p2p) {
    p2p = await Service.create({
      code: 'P2P', name: 'Chuyển tiền nội bộ', serviceType: 'transfer', currency: 'VND',
      fieldBuilder: [
        { name: 'CURRENCY', source: 'fixed', value: 'VND' },
        { name: 'RECEIVERPHONE', source: 'mapping', from: 'receiverPhone' },
        { name: 'AMOUNT', source: 'mapping', from: 'amount' },
        { name: 'SENDERID', source: 'query', fn: 'queryPocketByUserId', arg: 'USERID' },
        { name: 'RECEIVERID', source: 'query', fn: 'queryPocketByPhone', arg: 'RECEIVERPHONE' },
      ],
      feeConfig: { type: 'fixed', value: 1000 },
      auth: { method: 'PIN' },
      enabled: true,
    }).fetch();

    const sid = String(p2p.id);
    await TransField.createEach([
      { service: sid, fieldName: 'RECEIVERPHONE', fieldFormat: 'string', regex: '^0\\d{9}$', isRequired: true, order: 1, errorCode: 400 },
      { service: sid, fieldName: 'AMOUNT', fieldFormat: 'number', isRequired: true, order: 2, errorCode: 400 },
    ]);
    await TransValidation.createEach([
      { service: sid, validateFunc: 'validateReceiverIsNotSender', validateFields: 'SENDERID:RECEIVERID', order: 1, errorCode: 400 },
      { service: sid, validateFunc: 'validateSenderAccountSufficiency', validateFields: 'SENDERID:AMOUNT:DEBITFEE', order: 2, errorCode: 4001 },
    ]);
    await TransDefinition.create({
      service: sid,
      glSteps: [
        { order: 0, amount: 'AMOUNT', debit: { level: 'productLevel', target: 'SENDERID' }, credit: { level: 'productLevel', target: 'RECEIVERID' } },
        { order: 1, amount: 'DEBITFEE', debit: { level: 'productLevel', target: 'SENDERID' }, credit: { level: 'systemAccount', target: 'SYSTEM_FEE' } },
      ],
    });
    sails.log.info('Seed: Service P2P + TransField + TransValidation + TransDefinition');
  }

  const BASE = 'http://127.0.0.1:1337/mock';
  const connectors = [
    { code: 'VCB', name: 'Mock Vietcombank', kind: 'bank', baseUrl: BASE + '/vcb', operations: {
      sendOtp: { method: 'POST', path: '/sendOtp', request: { account: '$.account'}, response: { otpRef: '$.data.otpRef' } },
      verifyOtp: { method: 'POST', path: '/verify-otp', request: { otpRef: '$.otpRef', otp: '$.otp', account: '$.account' }, response: { token: '$.data.token', name: '$.data.name' } },
    } },
    { code: 'VISA', name: 'Mock VISA acquirer', kind: 'card', baseUrl: BASE + '/visa', operations: {
      charge: { method: 'POST', path: '/charge', request: { token: '$.token', amount: '$.amount', refId: '$.refId' }, response: { authCode: '$.data.authCode' }, idempotent: true },
    } },
    { code: 'NAPAS', name: 'Mock NAPAS payout', kind: 'payout', baseUrl: BASE + '/napas', operations: {
      validateAccount: { method: 'POST', path: '/validate', request: { account: '$.account', bankCode: '$.bankCode' }, response: { name: '$.data.name' } },
      payout: { method: 'POST', path: '/payout', request: { account: '$.account', amount: '$.amount', refId: '$.refId' }, response: { ref: '$.data.ref', state: '$.data.state' }, idempotent: true },
      status: { method: 'POST', path: '/status', request: { refId: '$.refId' }, response: { state: '$.data.state' } },
    } },
  ];
  for (const c of connectors) {
    if (!(await Connector.findOne({ code: c.code }))) { await Connector.create(c); sails.log.info('Seed: Connector ' + c.code); }
  }

  // Config LINK_BANK
  if (!(await Service.findOne({ code: 'LINK_BANK' }))) {
    const s = await Service.create({
      code: 'LINK_BANK', name: 'Liên kết ngân hàng', serviceType: 'link', currency: 'VND',
      fieldBuilder: [
        { name: 'BANKCODE', source: 'mapping', from: 'bankCode' },
        { name: 'ACCOUNTNO', source: 'mapping', from: 'accountNo' },
      ],
      feeConfig: { type: 'fixed', value: 0 },
      auth: { method: 'OTP' },
      hooks: [
        { phase: 'onConfirm',   connector: 'VCB', operation: 'sendOtp',   inputMap: { account: 'ACCOUNTNO' }, outputMap: { OTPREF: 'otpRef' } },
        { phase: 'onPreVerify', connector: 'VCB', operation: 'verifyOtp', inputMap: { otpRef: 'OTPREF', otp: 'OTP', account: 'ACCOUNTNO' }, outputMap: { INSTRTOKEN: 'token', HOLDERNAME: 'name' }, onFailure: 'abort' },
      ],
      effects: [{ type: 'createInstrument', with: { type: 'bankAccount', connector: 'VCB', tokenVar: 'INSTRTOKEN', nameVar: 'HOLDERNAME', maskedVar: 'ACCOUNTNO' } }],
      enabled: true,
    }).fetch();
    const sid = String(s.id);
    await TransField.createEach([
      { service: sid, fieldName: 'BANKCODE', fieldFormat: 'string', isRequired: true, order: 1, errorCode: 400 },
      { service: sid, fieldName: 'ACCOUNTNO', fieldFormat: 'string', regex: '^\\d{6,19}$', isRequired: true, order: 2, errorCode: 400 },
    ]);
    await TransDefinition.create({ service: sid, glSteps: [] });  // ⟵ rỗng = không chuyển tiền
    sails.log.info('Seed: Service LINK_BANK');
  }

  // ── 7) Ví suspense (giữ tiền in-flight) + nostro (gương tiền đối tác) ──
  for (const w of [
    { ownerType: 'suspense', ownerRef: 'SUSPENSE_PAYOUT' },
    { ownerType: 'nostro', ownerRef: 'NOSTRO_NAPAS' },
  ]) {
    if (!(await Pocket.findOne(w))) {
      const checksum = await sails.helpers.computeChecksum(0, w.ownerType, w.ownerRef, 'VND');
      await Pocket.create({ ownerType: w.ownerType, ownerRef: w.ownerRef, balance: 0, checksum });
      sails.log.info('Seed: Pocket ' + w.ownerRef);
    }
  }

  // ── 8) Config INTERBANK_OUT (chuyển liên ngân hàng — BẤT ĐỒNG BỘ) ──
  if (!(await Service.findOne({ code: 'INTERBANK_OUT' }))) {
    const s = await Service.create({
      code: 'INTERBANK_OUT', name: 'Chuyển tiền liên ngân hàng', serviceType: 'transfer_out', currency: 'VND',
      fieldBuilder: [
        { name: 'CURRENCY', source: 'fixed', value: 'VND' },
        { name: 'AMOUNT', source: 'mapping', from: 'amount' },
        { name: 'DESTBANK', source: 'mapping', from: 'destBank' },
        { name: 'DESTACCOUNT', source: 'mapping', from: 'destAccount' },
        { name: 'SENDERID', source: 'query', fn: 'queryPocketByUserId', arg: 'USERID' },
      ],
      feeConfig: { type: 'percent', value: 0.5, min: 2000, cap: 15000 },
      auth: { method: 'PIN' },
      hooks: [
        { phase: 'onPreVerify', connector: 'NAPAS', operation: 'validateAccount', inputMap: { account: 'DESTACCOUNT', bankCode: 'DESTBANK' }, outputMap: { DESTNAME: 'name' }, onFailure: 'abort' },
        { phase: 'onSettle', connector: 'NAPAS', operation: 'payout', inputMap: { account: 'DESTACCOUNT', amount: 'AMOUNT', refId: 'TRANSREFID' }, outputMap: { PARTNERREF: 'ref', PARTNERSTATE: 'state' } },
      ],
      settlement: {
        mode: 'async',
        // chốt khi đối tác SUCCESS: tiền rời SUSPENSE -> NOSTRO
        settleSteps: [{ amount: 'AMOUNT', debit: { level: 'systemAccount', target: 'SUSPENSE_PAYOUT' }, credit: { level: 'systemAccount', target: 'NOSTRO_NAPAS' } }],
        // hoàn khi FAILED/timeout: SUSPENSE -> trả lại ví khách
        reverseSteps: [{ amount: 'AMOUNT', debit: { level: 'systemAccount', target: 'SUSPENSE_PAYOUT' }, credit: { level: 'productLevel', target: 'SENDERID' } }],
      },
      enabled: true,
    }).fetch();
    const sid = String(s.id);
    await TransField.createEach([
      { service: sid, fieldName: 'AMOUNT', fieldFormat: 'number', isRequired: true, order: 1, errorCode: 400 },
      { service: sid, fieldName: 'DESTBANK', fieldFormat: 'string', isRequired: true, order: 2, errorCode: 400 },
      { service: sid, fieldName: 'DESTACCOUNT', fieldFormat: 'string', regex: '^\\d{6,19}$', isRequired: true, order: 3, errorCode: 400 },
    ]);
    await TransValidation.create({ service: sid, validateFunc: 'validateSenderAccountSufficiency', validateFields: 'SENDERID:AMOUNT:DEBITFEE', order: 1, errorCode: 4001 });
    // glSteps @ verify = GIỮ tiền: khách -> SUSPENSE (amount) + khách -> SYSTEM_FEE (phí)
    await TransDefinition.create({
      service: sid,
      glSteps: [
        { order: 0, amount: 'AMOUNT', debit: { level: 'productLevel', target: 'SENDERID' }, credit: { level: 'systemAccount', target: 'SUSPENSE_PAYOUT' } },
        { order: 1, amount: 'DEBITFEE', debit: { level: 'productLevel', target: 'SENDERID' }, credit: { level: 'systemAccount', target: 'SYSTEM_FEE' } },
      ],
    });
    sails.log.info('Seed: Service INTERBANK_OUT (async)');
  }

  // ── 9) Janitor recovery: chạy 1 lần lúc lift + định kỳ mỗi 60s ──
  try { await sails.helpers.recover(); } catch (e) { sails.log.warn('Recover lúc lift lỗi: ' + e.message); }
  if (!global.__recoverTimer) {
    global.__recoverTimer = setInterval(() => {
      sails.helpers.recover().catch((e) => sails.log.warn('Recover định kỳ lỗi: ' + e.message));
    }, 60 * 1000);
  }
};
