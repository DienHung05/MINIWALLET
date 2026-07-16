const crypto = require('crypto');

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = async function resetPin(req, res) {
  const token = `${req.param('resetToken') || req.param('token') || ''}`.trim();
  const pin = `${req.param('pin') || ''}`;

  if (!token || !pin) return res.fail(400, 'Thiếu token hoặc PIN mới');
  if (!/^\d{4,6}$/.test(pin)) return res.fail(400, 'PIN phải gồm 4-6 chữ số');

  const customer = await Customer.findOne({
    pinResetTokenHash: hashResetToken(token),
  });

  if (!customer || Number(customer.pinResetExpiresAt || 0) < Date.now()) {
    return res.fail(400, 'Token đặt lại PIN không hợp lệ hoặc đã hết hạn');
  }

  const pinHash = await sails.helpers.hashPin(pin);
  await Customer.updateOne(customer.id).set({
    pinHash,
    pinResetTokenHash: '',
    pinResetExpiresAt: 0,
  });

  return res.ok({
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    },
  });
};
