module.exports = {
  attributes: {
    service: { type: 'string', required: true },  
    fieldName: { type: 'string', required: true },
    fieldFormat: { type: 'string', defaultsTo: 'string' }, 
    minLength: { type: 'number', defaultsTo: 0 },
    maxLength: { type: 'number', defaultsTo: 0 },
    regex: { type: 'string', defaultsTo: '' },
    isRequired: { type: 'boolean', defaultsTo: false },
    needSecured: { type: 'boolean', defaultsTo: false },
    order: { type: 'number', defaultsTo: 0 },
    errorCode: { type: 'number', defaultsTo: 400 },
    status: { type: 'string', defaultsTo: 'active' },
  },
};