module.exports = {
    attributes: {
        customer: { type: 'string', required: true },
        type: { type: 'string', defaultsTo: 'bankAccount' },
        connector: { type: 'string', defaultsTo: '' },
        token: { type: 'string', defaultsTo: '' },
        maskedNumber: { type: 'string', defaultsTo: '' },
        holderName: { type: 'string', defaultsTo: '' },
        meta: { type: 'json', defaultsTo: {} },
        status: { type: 'string', isIn: ['pending', 'active', 'disabled'], defaultsTo: 'active' },
    },
};