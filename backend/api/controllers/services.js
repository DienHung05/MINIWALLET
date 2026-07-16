module.exports = async function services(req, res) {
  const rows = await Service.find({ enabled: true }).sort('code ASC');
  return res.ok({
    services: rows.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      serviceType: s.serviceType,
      currency: s.currency,
      feeConfig: s.feeConfig,
      auth: s.auth,
    })),
  });
};
