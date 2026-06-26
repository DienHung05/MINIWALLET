module.exports = {
  friendlyName: 'Hash pin',
  description: 'Băm (hash) PIN bằng bcrypt trước khi lưu.',

  inputs: {
    pin: { type: 'string', required: true, description: 'PIN/mật khẩu dạng thô' },
  },

  exits: {
    success: { outputType: 'string' },
  },

  fn: async function (inputs, exits) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(inputs.pin, sails.config.custom.bcryptRounds);
    return exits.success(hash);
  },
};
