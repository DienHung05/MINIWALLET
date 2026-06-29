function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function renderMap(map, args) {
    const out = {};
    for (const k of Object.keys(map || {})) {
        const v = map[k];
        out[k] = typeof v === 'string' && v.startsWith('$.') ? getPath(args, v.slice(2)) : v;
    }
    return out;
}

function extractMap(map, json) {
    const out = {};
    for (const k of Object.keys(map || {})) {
        const v = map[k];
        out[k] = typeof v === 'string' && v.startsWith('$.') ? getPath(json, v.slice(2)) : v;
    }
    return out;
}

module.exports = {
    friendlyName: 'Call Connector',
    description: 'Gọi 1 operation của connector theo cấu hình',
    inputs: {
        connectorCode: { type: 'string', required: true },
        operation: { type: 'string', required: true },
        args: { type: 'ref', defaultsTo: {} },
        idempotencyKey: { type: 'string' },
    },
    exits: { success: { outputType: 'ref' } },

    fn: async function (inputs, exits) {
        const c = await Connector.findOne({ code: inputs.connectorCode });
        if(!c || !c.enabled) { const e = new Error('Connector không khả dụng: ' + inputs.connectorCode); e.errorType = 'config'; throw e; }
        const op = (c.operations || {})[inputs.operation];
        if(!op) { const e = new Error('Operation không có: ' + inputs.operation); e.errorType = 'config'; throw e; }

        const url = c.baseUrl + (op.path || '');
        const headers = { 'Content-Type': 'application/json' };
        if (inputs.idempotencyKey) headers['Idempotency-Key'] = inputs.idempotencyKey;

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), c.timeoutMs || 8000);
        let res, json;
        try {
            res = await fetch(url, {
                method: op.method || 'POST', headers,
                body: JSON.stringify(renderMap(op.request, inputs.args || {})),
                signal: ctrl.signal,
            });
            json = await res.json();
        } catch (e) {
            clearTimeout(timer);
            const err = new Error('Lỗi gọi connector: ' + e.message); 
            err.errorType = (e.name === 'AbortError' ? 'timeout' : 'network');
            throw err;
        }
        clearTimeout(timer);

        const okBusiness = (json.err === undefined || json.err === 200);
        return exits.success({
            ok: res.ok, okBusiness,
            status: res.status,
            data: extractMap(op.data, json),
            raw: json,
        }); 
    },
};