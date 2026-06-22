module.exports = {
    friendlyName: 'Check pin',
    description: 'So khớp chuỗi thô với hash bcrypt',
    inputs: {
        secret: { type: 'string', required: true },
        hash: { type: 'string', required: true },
    },
    exits: { success: { outputType: 'boolean' } },
    fn: async function (inputs, exits) {
        const bcrypt = require('bcryptjs');
        return exits.success(await bcrypt.compare(inputs.secret, inputs.hash));
    },
};