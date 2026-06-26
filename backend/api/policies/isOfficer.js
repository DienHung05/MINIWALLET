module.exports = async function isOfficer(req, res, proceed) {
  if (req.info && req.info.role === 'officer') return proceed();
  return res.fail(403, 'Chỉ Officer mới được phép');
};