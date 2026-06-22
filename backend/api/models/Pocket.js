module.exports = {
    attributes: {
        ownerType: { type: 'string', required: true, isIn: ['customer', 'system', 'bank', 'biller'] },
        ownerRef: { type: 'string', required: true },
        balance: { type: 'number', defaultsTo: 0 },
        checksum: { type: 'string', defaultsTo: '' },
        currency: { type: 'string', defaultsTo: 'VND' },
        locked: { type: 'boolean', defaultsTo: false }, 
    },
};