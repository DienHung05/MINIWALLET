module.exports = {
  friendlyName: 'Reconcile Napas',
  description: 'Đối soát ví nostro NAPAS với sao kê mock NAPAS.',
  inputs: {
    statementBalance: { type: 'number' },
  },
  exits: { success: { outputType: 'ref' } },

  fn: async function (inputs, exits) {
    const nostro = await Pocket.findOne({ ownerType: 'nostro', ownerRef: 'NOSTRO_NAPAS' });
    if (!nostro) {
      return exits.success({
        ok: false,
        connector: 'NAPAS',
        message: 'Chưa có ví NOSTRO_NAPAS',
      });
    }

    const statement = await sails.helpers.callConnector(
      'NAPAS',
      'statement',
      { balance: inputs.statementBalance != null ? inputs.statementBalance : nostro.balance },
      'reconcile-' + Date.now()
    );
    const partnerBalance = Number(statement.data && statement.data.balance || 0);
    const ledgerBalance = Number(nostro.balance || 0);
    const difference = ledgerBalance - partnerBalance;

    return exits.success({
      ok: statement.ok && difference === 0,
      connector: 'NAPAS',
      currency: (statement.data && statement.data.currency) || nostro.currency || 'VND',
      nostroPocketId: nostro.id,
      ledgerBalance,
      partnerBalance,
      difference,
      raw: statement.raw,
    });
  },
};
