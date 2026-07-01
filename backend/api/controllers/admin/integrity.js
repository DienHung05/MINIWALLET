// Officer xem báo cáo toàn vẹn tiền tệ. GET /api/admin/integrity
module.exports = async function integrity(req, res) {
  const report = await sails.helpers.integrityCheck();
  return res.ok({ report });
};
