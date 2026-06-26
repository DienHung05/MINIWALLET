module.exports = async function login(req, res) {
  const { phone, pin } = req.allParams();
  const customer = await Customer.findOne({ phone });
  if (!customer) return res.fail(401, 'Sai thông tin đăng nhập');

  const bcrypt = require('bcryptjs');
  if (!(await bcrypt.compare(`${pin}`, customer.pinHash))) return res.fail(401, 'Sai thông tin đăng nhập');

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ sub: customer.id, role: 'customer' },
    sails.config.custom.jwtSecret, { expiresIn: sails.config.custom.jwtTtl });
  return res.ok({ token, role: 'customer' });
};