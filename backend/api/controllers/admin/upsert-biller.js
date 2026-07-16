module.exports = async function upsertBiller(req, res) {
  const p = req.allParams();
  const code = `${p.code || ''}`.trim().toUpperCase();
  if (!code) return res.fail(400, 'Thiếu mã biller');
  if (!p.name) return res.fail(400, 'Thiếu tên biller');
  if (!p.inquiryUrl || !p.paymentUrl) return res.fail(400, 'Thiếu URL tra cứu hoặc thanh toán');

  let biller = await Biller.findOne({ code });
  const values = {
    code,
    name: `${p.name}`.trim(),
    category: `${p.category || 'utility'}`.trim(),
    inquiryUrl: `${p.inquiryUrl}`.trim(),
    paymentUrl: `${p.paymentUrl}`.trim(),
    status: p.status === 'disabled' ? 'disabled' : 'active',
  };

  if (biller) {
    biller = await Biller.updateOne(biller.id).set(values);
  } else {
    biller = await Biller.create(values).fetch();
  }

  if (!biller.pocket) {
    const checksum = await sails.helpers.computeChecksum(0, 'biller', biller.id, 'VND');
    const pocket = await Pocket.create({ ownerType: 'biller', ownerRef: biller.id, balance: 0, checksum }).fetch();
    biller = await Biller.updateOne(biller.id).set({ pocket: pocket.id });
  }

  return res.ok({ biller });
};
