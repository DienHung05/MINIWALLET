module.exports = {
  attributes: {
    code: { type: 'string', required: true, unique: true },
    name: { type: 'string', defaultsTo: '' },
    kind: { type: 'string', defaultsTo: '' },
    baseUrl: { type: 'string', required: true },
    auth: { type: 'json', defaultsTo: {} },
    operations: { type: 'json', defaultsTo: {} },
    timeoutMs: { type: 'number', defaultsTo: 8000 },
    maxRetries: { type: 'number', defaultsTo: 0 },
    enabled: { type: 'boolean', defaultsTo: true },
  },
};
