module.exports = {
    attributes: {
        code: { type: 'string', required: true, unique: true },
        transRefId: { type: 'string', required: true},
        service: { type: 'string' },
        sender: { type: 'string'},
        receiver: { type: 'string'},
        amount: { type: 'number', required: true },
        fee: { type: 'number', defaultsTo: 0 },
        totalAmount: { type: 'number', required: true },
        status: { type: 'string', isIn: ['done', 'failed'], defaultsTo: 'done' },
        billerRefId: { type: 'string' },
    },
};