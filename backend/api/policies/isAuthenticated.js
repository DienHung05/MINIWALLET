module.exports = async function (req, res, proceed) {
  const jwt = require('jsonwebtoken');
  const header =req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.json({ err: 401, message: 'Thiếu token đăng nhập'}); 

  let payload;
  try {
    payload = jwt.verify(token, sails.config.custom.jwtSecret);
  } catch (e) {
    return res.json({ err: 401, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  const user = payload.role === 'customer' 
  ? await Customer.findOne({ id: payload.sub }) 
  : await Officer.findOne({ id: payload.sub });
  if(!user) return res.json({ err: 401, message: 'Tài khoản không tồn tại' });

  req.info = req.info || {};
  req.info.user = user;
  req.info.role = payload.role;
  return proceed();
};