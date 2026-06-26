module.exports = async function (req, res, proceed) {
  if (req.info && req.info.role === 'officer') return proceed();
  return res.json({ err: 403, message: 'Chỉ Officer mới được phép truy cập' });
};