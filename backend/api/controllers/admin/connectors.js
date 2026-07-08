module.exports = async function connectors(req, res) {
  const rows = await Connector.find().sort('code ASC');
  return res.ok({
    connectors: rows.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      kind: c.kind,
      baseUrl: c.baseUrl,
      auth: c.auth || {},
      enabled: c.enabled,
      timeoutMs: c.timeoutMs,
      maxRetries: c.maxRetries,
      operations: Object.keys(c.operations || {}),
      operationsSpec: c.operations || {},
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
};
