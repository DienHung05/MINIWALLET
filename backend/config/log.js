/**
 * Log — mức log khi dev.
 * ⚠️ Quan trọng (MINIWALLET §8.1): KHÔNG BAO GIỜ log PIN/mật khẩu dạng thô.
 * Khi log dữ liệu request, hãy che các field nhạy cảm (pin, password) thành '***'.
 */
module.exports.log = {
  level: 'info',
};
