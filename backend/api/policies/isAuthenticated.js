/**
 * Policy: isAuthenticated  (CÀI Ở NGÀY 3)
 *
 * Mục tiêu: đọc header 'Authorization: Bearer <token>', verify JWT,
 * tra ra user, gắn vào req.info.user rồi cho qua (proceed).
 *
 * Tài liệu: MINIWALLET §10 — "Policy / req.info" (bearer* gắn req.info.user).
 */
module.exports = async function isAuthenticated(req, res, proceed) {
  // ──────────────────────────────────────────────────────────────
  // TODO Ngày 3:
  //   const jwt = require('jsonwebtoken');
  //   const header = req.headers.authorization || '';
  //   const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  //   if (!token) return res.json({ err: 401, message: 'Thiếu token' });
  //   try {
  //     const payload = jwt.verify(token, sails.config.custom.jwtSecret);
  //     const user = await Customer.findOne(payload.sub) // hoặc Officer, tuỳ payload.role
  //     if (!user) return res.json({ err: 401, message: 'Token không hợp lệ' });
  //     req.info = req.info || {};
  //     req.info.user = user;
  //     req.info.role = payload.role; // 'customer' | 'officer'
  //     return proceed();
  //   } catch (e) {
  //     return res.json({ err: 401, message: 'Token hết hạn/không hợp lệ' });
  //   }
  // ──────────────────────────────────────────────────────────────

  return res.json({ err: 401, message: 'isAuthenticated chưa cài (làm ở Ngày 3)' });
};
