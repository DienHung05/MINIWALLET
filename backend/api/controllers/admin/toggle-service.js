module.exports = async function toggleService(req, res) {
  const code = `${req.param('code') || ''}`.trim().toUpperCase();
  if (!code) return res.fail(400, 'Thiếu mã service');
  const service = await Service.updateOne({ code }).set({ enabled: req.param('enabled') !== false });
  if (!service) return res.fail(404, 'Không tìm thấy service');
  return res.ok({ service });
};
