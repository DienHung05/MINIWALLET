/**
 * Helper: computeChecksum  (CÀI Ở NGÀY 4)
 * Tính "dấu vân tay" cho một ví để phát hiện sửa balance trái phép (MINIWALLET §3.3).
 * Gọi: await sails.helpers.computeChecksum(balance, ownerType, ownerRef)
 *
 * Quy tắc vàng: MỌI nơi đổi balance đều phải tính lại checksum ngay sau đó.
 */
module.exports = {
  friendlyName: 'Compute checksum',
  description: 'Tính checksum (sha256) cho một ví.',

  inputs: {
    balance: { type: 'number', required: true },
    ownerType: { type: 'string', required: true, description: 'customer | system | bank | biller' },
    ownerRef: { type: 'string', required: true, description: 'id chủ ví' },
    currency: { type: 'string', defaultsTo: 'VND' },
  },

  exits: {
    success: { outputType: 'string' },
  },

  fn: async function (inputs, exits) {
    // TODO Ngày 4:
    //   const crypto = require('crypto');
    //   const secret = sails.config.custom.checksumSecret;
    //   const raw = [inputs.balance, inputs.ownerType, inputs.ownerRef, inputs.currency, secret].join('|');
    //   const checksum = crypto.createHash('sha256').update(raw).digest('hex');
    //   return exits.success(checksum);
    return exits.success('TODO-checksum');
  },
};
