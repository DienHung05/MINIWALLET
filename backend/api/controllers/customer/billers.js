module.exports = async function billers(req, res) {
  const rows = await Biller.find({ status: 'active' }).sort('code ASC');
  return res.ok({
    billers: rows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      category: b.category,
    })),
  });
};
