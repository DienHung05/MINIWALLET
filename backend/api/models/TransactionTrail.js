module.exports = {
    attributes: {
        service: { type: 'string' },
        inputMessage: { type: 'json' },
        outputMessage: { type: 'json' },
        transSteplog: { type: 'json', defaultsTo: [] },
        status: { type: 'string', isIn: ['init', 'pending', 'done', 'failed'], defaultsTo: 'init' },
    }
};