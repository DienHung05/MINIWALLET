const DEFAULT_BILLS = {
  EVN: {
    EVN001: { amount: 58000, description: 'Tiền điện tháng này' },
    EVN002: { amount: 124000, description: 'Tiền điện hộ gia đình' },
  },
  WATER: {
    WTR001: { amount: 36000, description: 'Tiền nước tháng này' },
  },
  NET: {
    NET001: { amount: 99000, description: 'Cước Internet tháng này' },
  },
};

module.exports = async function biller(req, res) {
  const op = req.params.op;
  const body = req.allParams();
  const billerCode = `${body.billerCode || 'EVN'}`.trim().toUpperCase();
  const billCode = `${body.billCode || ''}`.trim().toUpperCase();
  const bill = DEFAULT_BILLS[billerCode] && DEFAULT_BILLS[billerCode][billCode];

  global.__mockBillerPayments = global.__mockBillerPayments || {};

  if (op === 'inquiry') {
    if (!bill) return res.json({ err: 404, message: 'Không tìm thấy hoá đơn hoặc hoá đơn đã thanh toán' });
    return res.json({
      err: 200,
      data: {
        amount: bill.amount,
        description: bill.description,
        billerRef: `${billerCode}-${billCode}`,
      },
    });
  }

  if (op === 'payment') {
    if (!bill) return res.json({ err: 404, message: 'Không tìm thấy hoá đơn' });
    if (Number(body.amount) !== Number(bill.amount)) return res.json({ err: 400, message: 'Số tiền thanh toán không khớp hoá đơn' });
    const refId = `${body.refId || billerCode + '-' + billCode}`;
    if (!global.__mockBillerPayments[refId]) {
      global.__mockBillerPayments[refId] = 'BILLPAY' + Date.now();
    }
    return res.json({ err: 200, data: { billerRefId: global.__mockBillerPayments[refId] } });
  }

  return res.json({ err: 404, message: 'op không hỗ trợ' });
};
