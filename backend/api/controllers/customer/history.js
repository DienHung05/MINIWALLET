function safeBody(body) {
  const out = Object.assign({}, body || {});
  for (const key of Object.keys(out)) {
    if (['OTP', 'CREDENTIAL', 'CARDNO', 'CVV'].includes(key) || key.includes('TOKEN')) delete out[key];
  }
  return out;
}

module.exports = async function history(req, res) {
  const page = Math.max(Number(req.param('page') || 1), 1);
  const limit = Math.min(Math.max(Number(req.param('limit') || 5), 1), 50);
  const query = { 'inputMessage.userId': req.info.user.id };
  const db = sails.getDatastore().manager;
  const collection = db.collection('transactiontrail');
  const [total, trails] = await Promise.all([
    collection.countDocuments(query),
    collection.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
  ]);

  const items = [];
  for (const t of trails) {
    const service = await Service.findOne(t.service);
    const txn = await Transaction.findOne({ transRefId: String(t._id) });
    const body = safeBody(t.outputMessage && t.outputMessage.TRANSBODY);
    items.push({
      transRefId: String(t._id),
      serviceCode: service ? service.code : '',
      serviceName: service ? service.name : '',
      status: t.status,
      amount: body.AMOUNT || (txn && txn.amount) || 0,
      fee: body.DEBITFEE || (txn && txn.fee) || 0,
      total: body.TOTALAMOUNT || (txn && txn.totalAmount) || 0,
      partnerRef: body.PARTNERREF || (txn && txn.partnerRef) || '',
      body,
      transaction: txn ? {
        code: txn.code,
        status: txn.status,
        amount: txn.amount,
        fee: txn.fee,
        totalAmount: txn.totalAmount,
      } : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    });
  }

  return res.ok({
    history: items,
    pagination: {
      page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};
