module.exports = {
  attributes: {
    service: { type: 'string', required: true },
    validateFunc: { type: 'string', required: true },     
    validateFields: { type: 'string', defaultsTo: '' },   
    order: { type: 'number', defaultsTo: 0 },
    errorCode: { type: 'number', defaultsTo: 400 },
    status: { type: 'string', defaultsTo: 'active' },
  },
};