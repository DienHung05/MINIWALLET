module.exports = {
  attributes: {
    code: { type: 'string', defaultsTo: '' },
    transRefId: { type: 'string', required: true },
    service: { type: 'string', required: true },
    sender: { type: 'string', defaultsTo: '' },
    receiver: { type: 'string', defaultsTo: '' },
    amount: { type: 'number', defaultsTo: 0 },
    fee: { type: 'number', defaultsTo: 0 },
    totalAmount: { type: 'number', defaultsTo: 0 },
    status: { type: 'string', isIn: ['done','failed','reversed'], defaultsTo: 'done' },
    billerRefId: { type: 'string', defaultsTo: '' },
    partnerRef: { type: 'string', defaultsTo: '' },
  },
};