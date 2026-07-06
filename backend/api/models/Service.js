module.exports = {
  attributes: {
    code: { type: 'string', required: true, unique: true },
    name: { type: 'string', defaultsTo: '' },
    serviceType: { type: 'string', defaultsTo: '' },
    currency: { type: 'string', defaultsTo: 'VND' },
    fieldBuilder: { type: 'json', defaultsTo: [] },
    feeConfig: { type: 'json', defaultsTo: { type: 'fixed', value: 0 } },
    auth: { type: 'json', defaultsTo: { method: 'NONE' } },
    hooks: { type: 'json', defaultsTo: [] },           
    effects: { type: 'json', defaultsTo: [] },       
    settlement: { type: 'json', defaultsTo: { mode: 'sync' } }, 
    concurrency: { type: 'string', isIn: ['locked', 'optimistic'], defaultsTo: 'locked' },
    enabled: { type: 'boolean', defaultsTo: true },
  },
};
