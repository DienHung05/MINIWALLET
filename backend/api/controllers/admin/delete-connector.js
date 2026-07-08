module.exports = async function deleteConnector(req, res) {
  const code = `${req.param('code') || ''}`.trim().toUpperCase();
  if (!code) return res.fail(400, 'Thiếu mã connector');

  const connector = await Connector.destroyOne({ code });
  if (!connector) return res.fail(404, 'Không tìm thấy connector');

  return res.ok({ deleted: true, connector });
};
