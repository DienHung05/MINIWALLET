const engine = require('../../services/engine');

module.exports = async function cashIn(req, res) {
  const customerPhone = `${req.param('customerPhone') || req.param('phone') || ''}`.replace(/\s/g, '');
  const amount = Number(req.param('amount') || 0);
  if (!/^0\d{9}$/.test(customerPhone)) return res.fail(400, 'Số điện thoại khách hàng không hợp lệ');
  if (!amount || amount <= 0) return res.fail(400, 'Số tiền nạp phải lớn hơn 0');

  try {
    const preview = await engine.processRequest('CASH_IN', { customerPhone, amount }, { userId: req.info.user.id, user: req.info.user });
    const result = await engine.processVerify(preview.transRefId, '', { userId: req.info.user.id, user: req.info.user });
    return res.ok({ preview, result });
  } catch (e) {
    return res.fail(e.errCode || 500, e.message || 'Không nạp được tiền cho khách');
  }
};
