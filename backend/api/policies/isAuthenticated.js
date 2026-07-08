module.exports = async function isAuthenticated(req, res, proceed) {
  const jwt = require('jsonwebtoken');
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.fail(401, 'Thiếu token');
  try {
    const p = jwt.verify(token, sails.config.custom.jwtSecret);
    const user = p.role === 'officer' ? await Officer.findOne(p.sub) : await Customer.findOne(p.sub);
    if (!user) return res.fail(401, 'Token không hợp lệ');
    if (user.status && user.status !== 'active') return res.fail(403, 'Tài khoản đang bị khoá');
    req.info = req.info || {};
    req.info.user = user;
    req.info.role = p.role;
    return proceed();
  } catch (e) {
    return res.fail(401, 'Token hết hạn/không hợp lệ');
  }
};
