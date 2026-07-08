const engine = require('../../services/engine');
module.exports = async function verify(req, res) {
  const { transRefId, pin, otp, threeDs, challenge, password } = req.allParams();
  if (!transRefId) return res.fail(400, 'Thiếu transRefId');
  try {
    const credential = pin || otp || threeDs || challenge || password;
    const data = await engine.processVerify(transRefId, credential, { userId: req.info.user.id, user: req.info.user });
    return res.ok(data);
  } catch (e) { return res.fail(e.errCode || 500, e.message || 'Lỗi xử lý verify'); }
};
