module.exports = {
    attributes: {
        serviceCode: { type: 'string', required: true },
        rule: { type: 'string', required: true }, 
        params: { type: 'json' },
    },
};