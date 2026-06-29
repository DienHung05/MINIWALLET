const engine = require('../../services/engine');

module.exports = async function request(req, res) {
  const { serviceCode, parameters } = req.allParams();
  if (!serviceCode) return res.fail(400, 'Thiếu serviceCode');
  try {
    const data = await engine.processRequest(serviceCode, parameters || {}, { userId: req.info.user.id, user: req.info.user });
    return res.ok(data);
  } catch (e) {
    return res.fail(e.errCode || 500, e.message || 'Lỗi xử lý request');
  }
};
