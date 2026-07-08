module.exports = {
  friendlyName: 'Hash pin',
  description: 'Băm một chuỗi bí mật bằng bcrypt trước khi lưu DB',
  inputs: {
    secret: { type: 'string', required: true },
  },
  exits: { success: { outputType: 'string' } },
  fn: async function (inputs, exits) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(inputs.secret, sails.config.custom.bcryptRounds);
    return exits.success(hash);
  },
};
