module.exports = {
    attributes: {
        code: { type: 'string', required: true, unique: true },
        name: { type: 'string', required: true },
        category: { type: 'string', defaultsTo: 'utility' },
        pocket: { model: 'pocket' },
        inquiryUrl: { type: 'string', required: true },
        paymentUrl: { type: 'string', required: true },
        status: { type: 'string', isIn: ['active', 'disabled'], defaultsTo: 'active' },
    },
};
