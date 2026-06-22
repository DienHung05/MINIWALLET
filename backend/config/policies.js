/**
 * Policies — "lính gác" chạy TRƯỚC action.
 *
 * Nguyên tắc DENY-BY-DEFAULT: mặc định khoá hết ('*': false), chỉ mở ra những gì
 * cố ý cho phép. Ai không phải officer thì không vào được API admin.
 *
 * Cú pháp:
 *   'health': true                         -> cho qua tự do
 *   'customer/login': true                 -> route công khai
 *   'admin/*': ['isAuthenticated', 'isOfficer']  -> phải đăng nhập VÀ là officer
 */
module.exports.policies = {
  '*': false,

  // Công khai
  health: true,

  // --- Mở dần theo kế hoạch ---
  // 'customer/login': true,
  // 'customer/register': true,
  // 'officer/login': true,
  // 'customer/*': ['isAuthenticated'],
  // 'txn/*': ['isAuthenticated'],
  // 'admin/*': ['isAuthenticated', 'isOfficer'],
};
