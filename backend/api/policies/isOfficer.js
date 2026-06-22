/**
 * Policy: isOfficer  (CÀI Ở NGÀY 3)
 *
 * Chạy SAU isAuthenticated (đã có req.info.user). Chỉ cho qua nếu user là officer.
 * Sản phẩm KHÔNG có RBAC giữa các officer — mọi officer quyền ngang nhau,
 * nên ở đây chỉ cần kiểm "có phải officer không" (MINIWALLET §7).
 */
module.exports = async function isOfficer(req, res, proceed) {
  // TODO Ngày 3:
  //   if (req.info && req.info.role === 'officer') return proceed();
  //   return res.json({ err: 403, message: 'Chỉ Officer mới được phép' });

  return res.json({ err: 403, message: 'isOfficer chưa cài (làm ở Ngày 3)' });
};
