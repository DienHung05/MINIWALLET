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
    const crypto = require('crypto');
    const secret = sails.config.custom.checksumSecret;
    const raw = [inputs.balance, inputs.ownerType, inputs.ownerRef, inputs.currency, secret].join('|');
    return exits.success(crypto.createHash('sha256').update(raw).digest('hex'));
  },
};
