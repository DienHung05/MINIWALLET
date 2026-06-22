module.exports = {
    attributes: {
        pocket: { model: 'pocket' },
        transRefId: { type: 'string', required: true },
        direction: { type: 'string', isIn: ['debit', 'credit'], required: true },
        amount: { type: 'number', required: true },
        balanceAfter: { type: 'number', required: true },
    },
};