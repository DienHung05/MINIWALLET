module.exports = {
    attributes: {
        transRefId: { type: 'string', required: true },
        stepOrder: { type: 'number', required: true },
        debit: { model: 'pocket', required: true },
        credit: { model: 'pocket', required: true },
        amount: { type: 'number', required: true },
        status: { type: 'string', isIn: ['settled', 'reversed'], defaultsTo: 'settled' },
    },
};