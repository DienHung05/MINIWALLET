module.exports = async function visa(req, res) {
  const b = req.allParams();
  if (req.params.op === 'tokenize') {
    const cardNumber = `${b.cardNumber || ''}`.replace(/\s+/g, '');
    if (!/^\d{12,19}$/.test(cardNumber)) return res.json({ err: 400, message: 'Số thẻ không hợp lệ' });
    if (`${b.threeDsCode || ''}` !== '123456') return res.json({ err: 400, message: '3DS sai' });
    return res.json({
      err: 200,
      data: {
        token: 'tok_visa_' + Math.random().toString(36).slice(2, 10),
        masked: '**** **** **** ' + cardNumber.slice(-4),
        name: b.holderName || 'CARD HOLDER',
      },
    });
  }
  if (req.params.op === 'charge') {
    if (Number(b.amount) > 0) return res.json({ err: 200, data: { authCode: 'AUTH' + Date.now() } });
    return res.json({ err: 400, message: 'Số tiền không hợp lệ' });
  }
  return res.json({ err: 404, message: 'op không hỗ trợ' });
};
