module.exports = async function toggleConnector(req, res) {
  const code = `${req.param('code') || ''}`.trim().toUpperCase();
  if (!code) return res.fail(400, 'Thiếu mã connector');

  const current = await Connector.findOne({ code });
  if (!current) return res.fail(404, 'Không tìm thấy connector');

  const raw = req.param('enabled');
  const enabled = raw === undefined ? !current.enabled : ['1', 'true', 'yes', 'on', 'enabled'].includes(`${raw}`.toLowerCase());
  const connector = await Connector.updateOne({ code }).set({ enabled });
  return res.ok({ connector });
};
