async function toRow(pocket) {
  const checksum = await sails.helpers.computeChecksum(pocket.balance, pocket.ownerType, pocket.ownerRef, pocket.currency || 'VND');
  let ownerName = pocket.ownerRef;
  if (pocket.ownerType === 'customer') {
    const customer = await Customer.findOne(pocket.ownerRef);
    ownerName = customer ? customer.name || customer.phone : pocket.ownerRef;
  }
  if (pocket.ownerType === 'biller') {
    const biller = await Biller.findOne(pocket.ownerRef);
    ownerName = biller ? biller.name : pocket.ownerRef;
  }
  return {
    id: pocket.id,
    ownerType: pocket.ownerType,
    ownerRef: pocket.ownerRef,
    ownerName,
    currency: pocket.currency,
    balance: pocket.balance,
    checksumOk: pocket.checksum === checksum,
    state: pocket.state,
    status: pocket.status,
    updatedAt: pocket.updatedAt,
  };
}

module.exports = async function wallets(req, res) {
  const rows = await Pocket.find().sort('ownerType ASC');
  const wallets = [];
  for (const p of rows) wallets.push(await toRow(p));
  return res.ok({ wallets });
};
