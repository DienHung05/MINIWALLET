module.exports = {
    attributes: {
        service: { model: 'service', required: true },
        glSteps: { type: 'json', defaultsTo: []},
    },
};