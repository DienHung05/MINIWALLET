module.exports = async function instruments(req, res) {
  const rows = await Instrument.find({ customer: req.info.user.id }).sort('createdAt DESC');
  return res.ok({
    instruments: rows.map((x) => ({
      id: x.id,
      type: x.type,
      connector: x.connector,
      maskedNumber: x.maskedNumber,
      holderName: x.holderName,
      status: x.status,
      meta: x.meta || {},
      createdAt: x.createdAt,
    })),
  });
};
