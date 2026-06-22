module.exports = {
    attributes: {
        code: { type: 'string', required: true, unique: true },
        name: { type: 'string', required: true },
        serviceType: { type: 'string', isIn: ['P2P', "CASHIN", "BILL"] },
        authType: { type: 'string', isIn: ['PIN', 'NONE'], defaultsTo: 'PIN' },
        enabled: { type: 'boolean', defaultsTo: false },
        feeConfig: { type: 'json' },
        fieldBuilder: { type: 'json' },
    },
};