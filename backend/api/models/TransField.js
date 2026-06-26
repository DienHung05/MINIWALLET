module.exports = {
    attributes: {
        service: { type: 'string', required: true },
        fieldName: {type: 'string', required: true },
        fieldFormat: { type: 'string', defaultsTo: 'string' },
        minLength: { type: 'number' },
        maxLength: { type: 'number' },
        regex: { type: 'string' },
        isRequired: { type: 'boolean', defaultsTo: true },
        needSecured: { type: 'boolean', defaultsTo: false },
        order: { type: 'number', defaultsTo: 0 },
        errorCode: { type: 'string' },
        status: { type: 'string', defaultsTo: 'active' },
    },
};