module.exports = {
  friendlyName: 'Integrity check',
  description: 'Kiểm tổng số dư + checksum + số dư nostro.',
  exits: { success: { outputType: 'ref' } },

  fn: async function (inputs, exits) {
    const pockets = await Pocket.find();
    let totalBalance = 0;
    const checksumMismatch = [];
    const nostro = {};
    for (const p of pockets) {
      totalBalance += p.balance;
      const expect = await sails.helpers.computeChecksum(p.balance, p.ownerType, p.ownerRef, p.currency || 'VND');
      if (expect !== p.checksum) checksumMismatch.push({ id: p.id, ownerType: p.ownerType, ownerRef: p.ownerRef });
      if (p.ownerType === 'nostro') nostro[p.ownerRef] = p.balance;
    }
    return exits.success({
      pocketCount: pockets.length,
      totalBalance,
      checksumOk: checksumMismatch.length === 0,
      checksumMismatch,
      nostro,
    });
  },
};
