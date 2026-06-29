const engine = require('../../services/engine');
module.exports = async function verify(req, res) {
  const { transRefId, pin, otp } = req.allParams();
  if (!transRefId) return res.fail(400, 'Thiếu transRefId');
  try {
    const data = await engine.processVerify(transRefId, pin || otp, { userId: req.info.user.id, user: req.info.user });
    return res.ok(data);
  } catch (e) { return res.fail(e.errCode || 500, e.message || 'Lỗi xử lý verify'); }
};