const crypto = require('crypto');

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = async function resetPassword(req, res) {
  const token = `${req.param('resetToken') || req.param('token') || ''}`.trim();
  const password = req.param('password');

  if (!token || !password) return res.fail(400, 'Thiếu token hoặc mật khẩu mới');
  if (`${password}`.length < 6) return res.fail(400, 'Mật khẩu phải có ít nhất 6 ký tự');

  const customer = await Customer.findOne({
    passwordResetTokenHash: hashResetToken(token),
  });

  if (!customer || Number(customer.passwordResetExpiresAt || 0) < Date.now()) {
    return res.fail(400, 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  const passwordHash = await sails.helpers.hashPin(`${password}`);
  await Customer.updateOne(customer.id).set({
    passwordHash,
    pinHash: passwordHash,
    passwordResetTokenHash: '',
    passwordResetExpiresAt: 0,
  });

  return res.ok({
    customer: {
      id: customer.id,
      username: customer.username,
      phone: customer.phone,
    },
  });
};
