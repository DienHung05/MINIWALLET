module.exports = async function vcb(req, res) {
  const b = req.allParams(), op = req.params.op;
  if (op === 'send-otp' || op === 'sendOtp') return res.json({ err: 200, data: { otpRef: 'OTPREF-' + Date.now() } });
  if (op === 'verify-otp' || op === 'verifyOtp') {
    if (`${b.otp}` === '123456') return res.json({ err: 200, data: { token: 'tok_vcb_' + Math.random().toString(36).slice(2, 8), name: 'NGUYEN VAN A' } });
    return res.json({ err: 400, message: 'OTP sai' });
  }
  return res.json({ err: 404, message: 'op không hỗ trợ' });
};