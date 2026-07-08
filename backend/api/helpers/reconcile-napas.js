function iso(ms) {
  return ms ? new Date(ms).toISOString() : '';
}

function bodyOf(trail) {
  return (trail.outputMessage && trail.outputMessage.TRANSBODY) || {};
}

module.exports = {
  friendlyName: 'Reconcile napas',
  description: 'Đối soát số dư nostro NAPAS với số dư/sao kê đối tác mô phỏng.',
  inputs: {
    partnerBalance: { type: 'number', allowNull: true },
  },
  exits: { success: { outputType: 'ref' } },

  fn: async function (inputs, exits) {
    const service = await Service.findOne({ code: 'INTERBANK_OUT' });
    const nostro = await Pocket.findOne({ ownerType: 'nostro', ownerRef: 'NOSTRO_NAPAS' });
    const suspense = await Pocket.findOne({ ownerType: 'suspense', ownerRef: 'SUSPENSE_PAYOUT' });

    const ledgerBalance = Number((nostro && nostro.balance) || 0);
    const partnerBalance = Number.isFinite(inputs.partnerBalance)
      ? Number(inputs.partnerBalance)
      : ledgerBalance;
    const difference = ledgerBalance - partnerBalance;

    const creditEntries = nostro ? await PocketEntry.find({ credit: String(nostro.id), status: 'settled' }) : [];
    const debitEntries = nostro ? await PocketEntry.find({ debit: String(nostro.id), status: 'settled' }) : [];
    const creditToNostro = creditEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const debitFromNostro = debitEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const processing = service
      ? await TransactionTrail.find({ service: String(service.id), status: 'processing' }).sort('updatedAt DESC').limit(50)
      : [];
    const unsettled = processing.map((t) => {
      const body = bodyOf(t);
      return {
        transRefId: t.id,
        amount: Number(body.AMOUNT || 0),
        partnerRef: body.PARTNERREF || '',
        partnerState: body.PARTNERSTATE || '',
        updatedAt: t.updatedAt,
        updatedAtText: iso(t.updatedAt),
      };
    });

    const recentDone = service
      ? await Transaction.find({ service: String(service.id), status: 'done' }).sort('updatedAt DESC').limit(20)
      : [];

    return exits.success({
      connector: 'NAPAS',
      nostroRef: 'NOSTRO_NAPAS',
      suspenseRef: 'SUSPENSE_PAYOUT',
      matched: difference === 0,
      ledgerBalance,
      partnerBalance,
      partnerSource: Number.isFinite(inputs.partnerBalance) ? 'manual' : 'mock_equal_to_ledger',
      difference,
      suspenseBalance: Number((suspense && suspense.balance) || 0),
      unsettledCount: unsettled.length,
      unsettledAmount: unsettled.reduce((sum, t) => sum + t.amount, 0),
      unsettled,
      ledger: {
        creditToNostro,
        debitFromNostro,
        netNostroMovement: creditToNostro - debitFromNostro,
        entryCount: creditEntries.length + debitEntries.length,
      },
      recentStatement: recentDone.map((t) => ({
        transRefId: t.transRefId,
        partnerRef: t.partnerRef,
        amount: t.amount,
        status: t.status,
        updatedAt: t.updatedAt,
        updatedAtText: iso(t.updatedAt),
      })),
    });
  },
};
