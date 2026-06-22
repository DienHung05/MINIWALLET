module.exports = {
    attributes: {
        service: { model: 'service', required: true },
        name: { type: 'string', required: true },
        dataType: { type: 'string', isIn: ['string', 'number', 'boolean'], defaultsTo: 'string' },
        required: { type: 'boolean', defaultsTo: true },
        constraints: { type: 'json' },
    },
};