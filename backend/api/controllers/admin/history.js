module.exports = async function history(req, res) {
  const page = Math.max(Number(req.param('page') || 1), 1);
  const limit = Math.min(Math.max(Number(req.param('limit') || 5), 1), 100);
  const serviceCode = `${req.param('serviceCode') || ''}`.trim().toUpperCase();
  const filter = {};
  if (serviceCode) {
    const service = await Service.findOne({ code: serviceCode });
    if (!service) return res.ok({ history: [], pagination: { page, pageSize: limit, total: 0, totalPages: 0 } });
    filter.service = String(service.id);
  }

  const [total, rows] = await Promise.all([
    Transaction.count(filter),
    Transaction.find(filter)
      .sort('createdAt DESC')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  const history = [];
  for (const txn of rows) {
    const service = await Service.findOne(txn.service);
    history.push({
      id: txn.id,
      code: txn.code,
      transRefId: txn.transRefId,
      serviceCode: service ? service.code : '',
      serviceName: service ? service.name : '',
      sender: txn.sender,
      receiver: txn.receiver,
      amount: txn.amount,
      fee: txn.fee,
      totalAmount: txn.totalAmount,
      status: txn.status,
      billerRefId: txn.billerRefId,
      partnerRef: txn.partnerRef,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    });
  }
  return res.ok({
    history,
    pagination: {
      page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};
