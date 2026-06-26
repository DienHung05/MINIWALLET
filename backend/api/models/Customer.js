module.exports = {
  attributes: {
    phone: { type: 'string', required: true, unique: true },
    pinHash: { type: 'string', required: true },
    name: { type: 'string', defaultsTo: '' },
    pocket: { model: 'pocket' },
    status: { type: 'string', isIn: ['active', 'frozen'], defaultsTo: 'active' },
  },
};