module.exports = {
    attributes: {
        code: { type: 'string', required: true, unique: true },
        name: { type: 'string', required: true },
        serviceType: { type: 'string', isIn: ['P2P', "CASHIN", "BILL"] },
        fieldBuilder: { type: 'json', defaultsTo: [] },
        amountFormula: { type: 'string' },
        action: { type: 'string', isIn: ['none', 'billerTrans'], defaultsTo: 'none' },
        actionParams: { type: 'json' },
        fee: { type: 'json' },
        auth: { type: 'json' },
        enabled: { type: 'boolean', defaultsTo: false },
    },
};