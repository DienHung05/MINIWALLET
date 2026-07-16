module.exports = async function billers(req, res) {
  const rows = await Biller.find().sort('code ASC');
  return res.ok({ billers: rows });
};
