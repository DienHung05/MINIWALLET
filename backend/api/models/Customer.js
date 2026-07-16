module.exports = {
  attributes: {
    username: { type: 'string', unique: true, allowNull: true },
    phone: { type: 'string', required: true, unique: true },
    pinHash: { type: 'string', required: true },
    name: { type: 'string', defaultsTo: '' },
    pocket: { model: 'pocket' },
    status: { type: 'string', isIn: ['active', 'frozen'], defaultsTo: 'active' },
    pinResetTokenHash: { type: 'string', defaultsTo: '' },
    pinResetExpiresAt: { type: 'number', defaultsTo: 0 },
  },
};
