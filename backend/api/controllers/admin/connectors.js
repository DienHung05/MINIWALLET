module.exports = async function connectors(req, res) {
  const rows = await Connector.find().sort('code ASC');
  return res.ok({
    connectors: rows.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      kind: c.kind,
      baseUrl: c.baseUrl,
      enabled: c.enabled,
      timeoutMs: c.timeoutMs,
      maxRetries: c.maxRetries,
      operations: Object.keys(c.operations || {}),
      operationSpecs: c.operations || {},
    })),
  });
};
