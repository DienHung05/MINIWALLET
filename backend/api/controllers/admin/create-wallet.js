module.exports = async function createWallet(req, res) {
  const ownerType = `${req.param('ownerType') || ''}`.trim();
  const ownerRef = `${req.param('ownerRef') || ''}`.trim();
  const balance = Number(req.param('balance') || 0);

  if (!['system', 'bank'].includes(ownerType)) return res.fail(400, 'Chỉ tạo tay ví System hoặc Bank');
  if (!ownerRef) return res.fail(400, 'Thiếu mã ví');
  if (await Pocket.findOne({ ownerType, ownerRef })) return res.fail(409, 'Ví đã tồn tại');

  const checksum = await sails.helpers.computeChecksum(balance, ownerType, ownerRef, 'VND');
  const wallet = await Pocket.create({ ownerType, ownerRef, balance, checksum }).fetch();
  return res.ok({ wallet });
};
