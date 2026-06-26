module.exports = async function login(req, res) {
  const { username, password } = req.allParams();
  const officer = await Officer.findOne({ username });
  if (!officer) return res.fail(401, 'Sai thông tin đăng nhập');

  const bcrypt = require('bcryptjs');
  if (!(await bcrypt.compare(`${password}`, officer.passwordHash))) return res.fail(401, 'Sai thông tin đăng nhập');

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ sub: officer.id, role: 'officer' },
    sails.config.custom.jwtSecret, { expiresIn: sails.config.custom.jwtTtl });
  return res.ok({ token, role: 'officer' });
};