module.exports = {
  attributes: {
    transRefId: { type: 'string', required: true },
    stepOrder: { type: 'number', defaultsTo: 0 },
    debit: { type: 'string', required: true },   // pocketId bị trừ
    credit: { type: 'string', required: true },  // pocketId được cộng
    amount: { type: 'number', required: true },
    status: { type: 'string', defaultsTo: 'settled' },
  },
};