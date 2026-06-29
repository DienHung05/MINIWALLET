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
};
