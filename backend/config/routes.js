/**
 * Routes — ánh xạ HTTP request -> action.
 *
 * Quy ước: mọi API đặt dưới tiền tố /api và trả "phong bì" { err, message, ...data }.
 * Action dạng standalone đặt trong api/controllers/. Đường dẫn action dùng dấu '/'
 * cho thư mục con, ví dụ action api/controllers/customer/register.js -> 'customer/register'.
 */
module.exports.routes = {
  // --- Công khai (Ngày 1) ---
  'GET /api/health': { action: 'health' },

  // --- Sẽ thêm dần theo kế hoạch (đang để mẫu, mở khi tới ngày tương ứng) ---
  // Ngày 3 — Auth:
  // 'POST /api/customer/register': { action: 'customer/register' },
  // 'POST /api/customer/login':    { action: 'customer/login' },
  // 'POST /api/officer/login':     { action: 'officer/login' },

  // Ngày 4 — Ví & số dư:
  // 'GET  /api/customer/balance':  { action: 'customer/balance' },
  // 'POST /api/admin/wallet':      { action: 'admin/create-wallet' },

  // Ngày 6–10 — Engine (dùng chung cho mọi service):
  // 'POST /api/txn/request': { action: 'txn/request' },
  // 'POST /api/txn/confirm': { action: 'txn/confirm' },
  // 'POST /api/txn/verify':  { action: 'txn/verify' },
  // 'POST /api/admin/cashin': { action: 'admin/cashin' },
};
