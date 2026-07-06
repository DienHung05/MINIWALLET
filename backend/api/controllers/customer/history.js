function safeBody(body) {
  const out = Object.assign({}, body || {});
  delete out.OTP;
  delete out.CREDENTIAL;
  delete out.INSTRTOKEN;
  return out;
}

module.exports = async function history(req, res) {
  const limit = Math.min(Math.max(Number(req.param('limit') || 20), 1), 50);
  const db = sails.getDatastore().manager;
  const trails = await db.collection('transactiontrail')
    .find({ 'inputMessage.userId': req.info.user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

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

  return res.ok({ history: items });
};
