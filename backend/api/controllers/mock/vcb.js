module.exports = async function vcb(req, res) {
    const b = req.allParams();
    if (req.params.op === 'send-otp') return res.json({ err: 200, data: { otpRef: 'OTPREF-' + Date.now() } });
    if (req.params.op === 'verify-otp') {
        if (`${b.otp}` === '123456') return res.json({ err: 200, data: { token: 'tok_vcb' + Math.random().toString(36).slice(2, 8), name: 'NGUYEN VAN A' } });
        return res.json({ err: 400, message: 'Mã OTP không hợp lệ' });
    }
    return res.json({ err: 404, message: 'op không hỗ trợ' });
};