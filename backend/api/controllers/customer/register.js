module.exports = async function register(req, res) {
  const params = req.allParams();
  const phone = `${params.phone || ''}`.trim();
  const username = `${params.username || phone}`.trim().toLowerCase();
  const password = params.password || params.pin;
  const name = `${params.name || ''}`.trim();

  if (!phone || !password) return res.fail(400, 'Thiếu số điện thoại hoặc mật khẩu');
  if (!/^0\d{9}$/.test(phone)) return res.fail(400, 'Số điện thoại không hợp lệ');
  if (params.username && !/^[a-z0-9._-]{3,32}$/.test(username)) {
    return res.fail(400, 'Username chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang');
  }
  if (`${password}`.length < 6) return res.fail(400, 'Mật khẩu phải có ít nhất 6 ký tự');

  if (await Customer.findOne({ phone })) return res.fail(409, 'Số điện thoại đã đăng ký');
  if (await Customer.findOne({ username })) return res.fail(409, 'Username đã được sử dụng');

  const passwordHash = await sails.helpers.hashPin(`${password}`);
  const customer = await Customer.create({
    username,
    phone,
    passwordHash,
    pinHash: passwordHash,
    name: name || username,
  }).fetch();

  const balance = 1000000; 
  const checksum = await sails.helpers.computeChecksum(balance, 'customer', customer.id, 'VND');
  const pocket = await Pocket.create({ ownerType: 'customer', ownerRef: customer.id, balance, checksum }).fetch();
  await Customer.updateOne(customer.id).set({ pocket: pocket.id });

  return res.ok({
    customer: {
      id: customer.id,
      username: customer.username,
      phone: customer.phone,
      name: customer.name,
    },
    balance,
  });
};
