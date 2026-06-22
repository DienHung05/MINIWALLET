module.exports = {
    attributes: {
        transRefId: { type: 'string', required: true, unique: true },
        service: { model: 'service' },
        amount: { type: 'number', required: true },
        fee: { type: 'number', defaultsTo: 0 },
        total: { type: 'number', required: true },
        glEntries: { type: 'json', },
        status: { type: 'string', isIn: ['done', 'failed'], defaultsTo: 'done' },
        billerRefId: { type: 'string' },
    },
};