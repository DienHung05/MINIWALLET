module.exports = {
  attributes: {
    service: { type: 'string', required: true },
    inputMessage: { type: 'json', defaultsTo: {} },
    outputMessage: { type: 'json', defaultsTo: {} },  
    transStepLog: { type: 'json', defaultsTo: [] },
    status: { type: 'string', isIn: ['init','pending','processing','done','failed','reversed','expired'], defaultsTo: 'init' },
  },
};
