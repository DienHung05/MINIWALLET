module.exports = {
    attributes: {
        code: { type: 'string', required: true, unique: true },
        name: { type: 'string', required: true },
        pocket: { model: 'pocket' },
        inquiryUrl: { type: 'string', required: true },
        paymentUrl: { type: 'string', required: true },
    },
};