const crypto = require('crypto');

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = async function forgotPassword(req, res) {
  const identifier = `${req.param('identifier') || req.param('username') || req.param('phone') || ''}`.trim().toLowerCase();
  if (!identifier) return res.fail(400, 'Thiếu username hoặc số điện thoại');

  const customer = await Customer.findOne({ or: [{ username: identifier }, { phone: identifier }] });
  if (!customer || customer.status !== 'active') {
    return res.ok({ resetToken: null, expiresAt: 0 });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;

  await Customer.updateOne(customer.id).set({
    passwordResetTokenHash: hashResetToken(resetToken),
    passwordResetExpiresAt: expiresAt,
  });

  return res.ok({
    resetToken,
    expiresAt,
    customer: {
      username: customer.username,
      phone: customer.phone,
    },
  });
};
