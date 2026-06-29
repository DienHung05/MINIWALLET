module.exports = async function visa(req, res) {
  const b = req.allParams();
  if (req.params.op === 'charge') {
    if (Number(b.amount) > 0) return res.json({ err: 200, data: { authCode: 'AUTH' + Date.now() } });
    return res.json({ err: 400, message: 'Số tiền không hợp lệ' });
  }
  return res.json({ err: 404, message: 'op không hỗ trợ' });
};