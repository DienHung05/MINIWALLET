const engine = require('../../services/engine');

module.exports = async function confirm(req, res) {
  const { transRefId } = req.allParams();
  if (!transRefId) return res.fail(400, 'Thiếu transRefId');
  try {
    const data = await engine.processConfirm(transRefId, { userId: req.info.user.id, user: req.info.user });
    return res.ok(data);
  } catch (e) {
    return res.fail(e.errCode || 500, e.message || 'Lỗi xử lý confirm');
  }
};
