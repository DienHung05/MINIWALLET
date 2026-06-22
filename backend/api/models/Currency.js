module.exports = {
  attributes: {
    code: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true }, 
    decimal: { type: 'number', defaultsTo: 0 }, 
  },
};
