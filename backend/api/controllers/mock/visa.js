module.exports = async function visa(req, res) {
  const b = req.allParams();
  if (req.params.op === 'tokenize') {
    if (`${b.challenge || ''}` !== '123456') return res.json({ err: 401, message: '3DS không đúng' });
    const cardNo = `${b.cardNo || ''}`.replace(/\D/g, '');
    if (!/^\d{12,19}$/.test(cardNo)) return res.json({ err: 400, message: 'Số thẻ không hợp lệ' });
    return res.json({
      err: 200,
      data: {
        token: 'tok_card_' + cardNo.slice(-4) + '_' + Date.now(),
        masked: '****' + cardNo.slice(-4),
        name: b.holderName || 'CARD HOLDER',
        brand: cardNo.startsWith('4') ? 'VISA' : 'CARD',
      },
    });
  }
  if (req.params.op === 'charge') {
    if (`${b.challenge || ''}` !== '123456') return res.json({ err: 401, message: '3DS không đúng' });
    if (!b.token) return res.json({ err: 400, message: 'Thiếu token thẻ' });
    if (Number(b.amount) > 0) return res.json({ err: 200, data: { authCode: 'AUTH' + Date.now() } });
    return res.json({ err: 400, message: 'Số tiền không hợp lệ' });
  }
  return res.json({ err: 404, message: 'op không hỗ trợ' });
};
