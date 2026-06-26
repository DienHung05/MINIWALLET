/**
 * custom.js — hằng số / cấu hình riêng của app.
 * Đọc qua sails.config.custom.* ở bất kỳ đâu.
 */
module.exports.custom = {
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-doi-truoc-khi-deploy',
  jwtTtl: '7d',

  // Checksum ví (Ngày 4) — đổi ở production
  checksumSecret: process.env.CHECKSUM_SECRET || 'dev-checksum-secret',

  // Nghiệp vụ
  defaultCurrency: 'VND',

  // bcrypt cost — số vòng hash PIN (10 là hợp lý cho dev)
  bcryptRounds: 10,

  // Mã lỗi tập trung 
  errCodes: {
    OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
    NOT_FOUND: 404, CONFLICT: 409, INSUFFICIENT: 4001, CHECKSUM: 5001,
  },
};
