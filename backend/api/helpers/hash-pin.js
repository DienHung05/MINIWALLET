/**
 * Helper: hashPin  (CÀI Ở NGÀY 3)
 * Hash PIN/mật khẩu trước khi lưu DB. Gọi: await sails.helpers.hashPin('1234')
 *
 * Đây là MẪU cấu trúc một Sails helper — hãy theo format này cho các helper khác.
 */
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
    // TODO Ngày 3:
    //   const bcrypt = require('bcryptjs');
    //   const rounds = sails.config.custom.bcryptRounds;
    //   const hash = await bcrypt.hash(inputs.pin, rounds);
    //   return exits.success(hash);
    return exits.success('TODO-hash');
  },
};
