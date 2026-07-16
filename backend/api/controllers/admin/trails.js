const { ObjectId } = require('mongodb');

function safeBody(body) {
  const out = Object.assign({}, body || {});
  for (const key of Object.keys(out)) {
    if (['OTP', 'CREDENTIAL', 'CARDNO', 'CVV'].includes(key) || key.includes('TOKEN')) delete out[key];
  }
  return out;
}

function safeInput(input) {
  const out = Object.assign({}, input || {});
  out.parameters = safeBody(out.parameters || {});
  return out;
}

function iso(ms) {
  return ms ? new Date(ms).toISOString() : '';
}

module.exports = async function trails(req, res) {
  const status = req.param('status') || 'processing';
  const page = Math.max(Number(req.param('page') || 1), 1);
  const limit = Math.min(Math.max(Number(req.param('limit') || 5), 1), 100);
  const transRefId = `${req.param('transRefId') || ''}`.trim();
  const serviceCode = `${req.param('serviceCode') || ''}`.trim().toUpperCase();
  const connector = `${req.param('connector') || ''}`.trim().toUpperCase();
  const filter = status === 'all' ? {} : { status };

  if (transRefId) {
    if (!ObjectId.isValid(transRefId)) return res.fail(400, 'transRefId không hợp lệ');
    filter._id = new ObjectId(transRefId);
  }

  if (serviceCode) {
    const service = await Service.findOne({ code: serviceCode });
    if (!service) return res.ok({ trails: [], pagination: { page, pageSize: limit, total: 0, totalPages: 0 } });
    filter.service = String(service.id);
  }

  if (connector) {
    filter.$or = [
      { 'transStepLog.connector': connector },
      { 'outputMessage.TRANSBODY.PARTNERREF': { $exists: true } },
      { 'outputMessage.TRANSBODY.PARTNERSTATE': { $exists: true } },
    ];
  }

  const db = sails.getDatastore().manager;
  const collection = db.collection('transactiontrail');
  const [total, rows] = await Promise.all([
    collection.countDocuments(filter),
    collection.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
  ]);

  const trails = [];
  for (const t of rows) {
    const service = await Service.findOne(t.service);
    const body = safeBody(t.outputMessage && t.outputMessage.TRANSBODY);
    trails.push({
      transRefId: String(t._id),
      serviceCode: service ? service.code : '',
      serviceName: service ? service.name : '',
      status: t.status,
      amount: body.AMOUNT || 0,
      fee: body.DEBITFEE || 0,
      partnerRef: body.PARTNERREF || '',
      partnerState: body.PARTNERSTATE || '',
      input: safeInput(t.inputMessage || {}),
      body,
      stepLog: t.transStepLog || [],
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      durationMs: t.createdAt && t.updatedAt ? Number(t.updatedAt) - Number(t.createdAt) : 0,
      createdAtText: iso(t.createdAt),
      updatedAtText: iso(t.updatedAt),
    });
  }

  return res.ok({
    trails,
    pagination: {
      page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};
