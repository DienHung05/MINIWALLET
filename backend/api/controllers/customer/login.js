module.exports = async function login(req, res) {
  const params = req.allParams();
  const phone = `${params.phone || ''}`.replace(/\s/g, '');
  const pin = `${params.pin || ''}`;

  if (!phone || !pin) return res.fail(400, 'Thiếu số điện thoại hoặc PIN');

  const customer = await Customer.findOne({ phone });
  if (!customer) return res.fail(401, 'Sai thông tin đăng nhập');
  if (customer.status !== 'active') return res.fail(403, 'Tài khoản đang bị khoá');

  const bcrypt = require('bcryptjs');
  if (!customer.pinHash || !(await bcrypt.compare(pin, customer.pinHash))) return res.fail(401, 'Sai thông tin đăng nhập');

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ sub: customer.id, role: 'customer' },
    sails.config.custom.jwtSecret, { expiresIn: sails.config.custom.jwtTtl });
  return res.ok({
    token,
    role: 'customer',
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    },
  });
};
