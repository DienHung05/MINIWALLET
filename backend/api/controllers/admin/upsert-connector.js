function parseJson(value, fieldName) {
  if (value === undefined || value === null || value === '') return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    const err = new Error(`${fieldName} phải là JSON hợp lệ`);
    err.errCode = 400;
    throw err;
  }
}

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(`${value}`.toLowerCase());
}

function positiveNumber(value, fallback, min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(n, min);
}

module.exports = async function upsertConnector(req, res) {
  try {
    const params = req.allParams();
    const code = `${params.code || ''}`.trim().toUpperCase();
    const name = `${params.name || ''}`.trim();
    const kind = `${params.kind || ''}`.trim();
    const baseUrl = `${params.baseUrl || ''}`.trim();

    if (!/^[A-Z0-9_-]{2,32}$/.test(code)) return res.fail(400, 'Mã connector không hợp lệ');
    if (!baseUrl || !/^https?:\/\/.+/.test(baseUrl)) return res.fail(400, 'Base URL phải bắt đầu bằng http:// hoặc https://');

    const operations = parseJson(params.operations || params.operationsSpec, 'operations');
    const auth = parseJson(params.auth, 'auth');
    const timeoutMs = positiveNumber(params.timeoutMs, 8000, 100);
    const maxRetries = positiveNumber(params.maxRetries, 0, 0);
    const enabled = parseBool(params.enabled, true);

    const payload = { code, name, kind, baseUrl, auth, operations, timeoutMs, maxRetries, enabled };
    const existing = await Connector.findOne({ code });
    const connector = existing
      ? await Connector.updateOne({ code }).set(payload)
      : await Connector.create(payload).fetch();

    return res.ok({ connector });
  } catch (e) {
    return res.fail(e.errCode || 500, e.message || 'Không lưu được connector');
  }
};
