module.exports = async function register(req, res) {
  const { phone, pin, name } = req.allParams();
  if (!phone || !pin) return res.fail(400, 'Thiếu phone hoặc pin');
  if (await Customer.findOne({ phone })) return res.fail(409, 'Số điện thoại đã đăng ký');

  const pinHash = await sails.helpers.hashPin(`${pin}`);
  const customer = await Customer.create({ phone, pinHash, name: name || phone }).fetch();

  const balance = 1000000; 
  const checksum = await sails.helpers.computeChecksum(balance, 'customer', customer.id, 'VND');
  const pocket = await Pocket.create({ ownerType: 'customer', ownerRef: customer.id, balance, checksum }).fetch();
  await Customer.updateOne(customer.id).set({ pocket: pocket.id });

  return res.ok({ customer: { id: customer.id, phone, name: customer.name }, balance });
};