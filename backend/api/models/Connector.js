module.exports = {
    code: { type: String, required: true, unique: true },
    name: { type: String, defaultsTo: '' },
    kind: { type: String, defaultsTo: '' },
    baseUrl: { type: String, required: true },
    auth: { type: 'json', defaultsTo: {} },
    operations: { type: 'json', defaultsTo: {} },
    timeoutMs: { type: 'number', defaultsTo: 8000 },
    maxRetries: { type: 'number', defaultsTo: 0 },
    enabled: { type: 'boolean', defaultsTo: true },
}