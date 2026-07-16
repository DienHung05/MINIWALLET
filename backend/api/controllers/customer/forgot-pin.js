const crypto = require('crypto');

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = async function forgotPin(req, res) {
  const phone = `${req.param('phone') || ''}`.replace(/\s/g, '');
  if (!phone) return res.fail(400, 'Thiếu số điện thoại');

  const customer = await Customer.findOne({ phone });
  if (!customer || customer.status !== 'active') {
    return res.ok({ resetToken: null, expiresAt: 0 });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;

  await Customer.updateOne(customer.id).set({
    pinResetTokenHash: hashResetToken(resetToken),
    pinResetExpiresAt: expiresAt,
  });

  return res.ok({
    resetToken,
    expiresAt,
    customer: {
      phone: customer.phone,
      name: customer.name,
    },
  });
};
