module.exports = async function balance(req, res) {
  const customer = req.info.user;
  const pocket = await Pocket.findOne(customer.pocket);
  if (!pocket) return res.fail(404, 'Chưa có ví');
  const expect = await sails.helpers.computeChecksum(pocket.balance, 'customer', customer.id, pocket.currency);
  if (expect !== pocket.checksum) return res.fail(5001, 'Checksum ví không khớp — nghi ngờ can thiệp');
  return res.ok({ balance: pocket.balance, currency: pocket.currency });
};