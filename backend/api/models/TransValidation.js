module.exports = {
    attributes: {
        service: { type: 'string', required: true },
        validateFunc: { type: 'string', required: true },
        validateFields: { type: 'string', required: true },
        order: { type: 'number', defaultsTo: 0 },
        errorCode: { type: 'string' },
        status: { type: 'string', defaultsTo: 'active' },
    },
};