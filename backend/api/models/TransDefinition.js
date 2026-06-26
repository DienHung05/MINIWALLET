module.exports = {
  attributes: {
    service: { type: 'string', required: true, unique: true },
    glSteps: { type: 'json', defaultsTo: [] }, 
  },
};