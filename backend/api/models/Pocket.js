module.exports = {
    attributes: {
        ownerType: { type: 'string', required: true, isIn: ['customer', 'system', 'bank', 'biller'] },
        ownerRef: { type: 'string', required: true },
        currency: { type: 'string', defaultsTo: 'VND' },
        balance: { type: 'number', defaultsTo: 0 },
        checksum: { type: 'string', defaultsTo: '' },
        state: { type: 'string', isIn: ['idle', 'inProgress'], defaultsTo: 'idle' },
        status: { type: 'string', isIn: ['active', 'frozen'], defaultsTo: 'active' },
    },
};