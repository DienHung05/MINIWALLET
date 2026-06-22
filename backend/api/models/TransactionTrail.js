module.exports = {
    attributes: {
        transRefId: { type: 'string', required: true, unique: true },
        service: { model: 'service' },
        inputMessage: { type: 'json' },
        outputMessage: { type: 'json' },
        transSteplog: { type: 'json', defaultsTo: [] },
        status: { type: 'string', isIn: ['init', 'pending', 'done', 'failed'], defaultsTo: 'init' },
    }
};