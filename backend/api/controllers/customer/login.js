module.exports = async function login(req, res) {
  const params = req.allParams();
  const identifier = `${params.identifier || params.username || params.phone || ''}`.trim().toLowerCase();
  const password = params.password;

  if (!identifier || !password) return res.fail(400, 'Thiếu tên đăng nhập/số điện thoại hoặc mật khẩu');

  const customer = await Customer.findOne({ or: [{ username: identifier }, { phone: identifier }] });
  if (!customer) return res.fail(401, 'Sai thông tin đăng nhập');
  if (customer.status !== 'active') return res.fail(403, 'Tài khoản đang bị khoá');

  const bcrypt = require('bcryptjs');
  const hash = customer.passwordHash || customer.pinHash;
  if (!hash || !(await bcrypt.compare(`${password}`, hash))) return res.fail(401, 'Sai thông tin đăng nhập');

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ sub: customer.id, role: 'customer' },
    sails.config.custom.jwtSecret, { expiresIn: sails.config.custom.jwtTtl });
  return res.ok({
    token,
    role: 'customer',
    customer: {
      id: customer.id,
      username: customer.username,
      phone: customer.phone,
      name: customer.name,
    },
  });
};
