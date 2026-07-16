module.exports = async function register(req, res) {
  const params = req.allParams();
  const phone = `${params.phone || ''}`.replace(/\s/g, '');
  const pin = `${params.pin || ''}`;
  const name = `${params.name || ''}`.trim();

  if (!phone || !pin) return res.fail(400, 'Thiếu số điện thoại hoặc PIN');
  if (!/^0\d{9}$/.test(phone)) return res.fail(400, 'Số điện thoại không hợp lệ');
  if (!/^\d{4,6}$/.test(pin)) return res.fail(400, 'PIN phải gồm 4-6 chữ số');

  if (await Customer.findOne({ phone })) return res.fail(409, 'Số điện thoại đã đăng ký');

  const pinHash = await sails.helpers.hashPin(pin);
  const customer = await Customer.create({
    username: phone,
    phone,
    pinHash,
    name: name || phone,
  }).fetch();

  const balance = 0;
  const checksum = await sails.helpers.computeChecksum(balance, 'customer', customer.id, 'VND');
  const pocket = await Pocket.create({ ownerType: 'customer', ownerRef: customer.id, balance, checksum }).fetch();
  await Customer.updateOne(customer.id).set({ pocket: pocket.id });

  return res.ok({
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    },
    balance,
  });
};
