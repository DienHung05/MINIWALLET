module.exports = {
  attributes: {
    ownerType: { type: 'string', isIn: ['customer','system','bank','biller','nostro','suspense'], required: true },
    ownerRef: { type: 'string', defaultsTo: '' },   // id chủ ví (hoặc role với system/nostro)
    currency: { type: 'string', defaultsTo: 'VND' },
    balance: { type: 'number', defaultsTo: 0 },
    checksum: { type: 'string', defaultsTo: '' },
    state: { type: 'string', isIn: ['idle','inProgress'], defaultsTo: 'idle' }, // khoá tx
    status: { type: 'string', isIn: ['active','frozen'], defaultsTo: 'active' },
  },
};