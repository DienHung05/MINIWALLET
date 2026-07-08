module.exports = {
  attributes: {
    username: { type: 'string', required: true, unique: true },
    phone: { type: 'string', required: true, unique: true },
    passwordHash: { type: 'string', required: true },
    pinHash: { type: 'string', defaultsTo: '' },
    name: { type: 'string', defaultsTo: '' },
    pocket: { model: 'pocket' },
    status: { type: 'string', isIn: ['active', 'frozen'], defaultsTo: 'active' },
    passwordResetTokenHash: { type: 'string', defaultsTo: '' },
    passwordResetExpiresAt: { type: 'number', defaultsTo: 0 },
  },
};
