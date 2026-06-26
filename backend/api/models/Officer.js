module.exports = {
  attributes: {
    username: { type: 'string', required: true, unique: true },
    passwordHash: { type: 'string', required: true },
    status: { type: 'string', isIn: ['active', 'frozen'], defaultsTo: 'active' },
  },
};