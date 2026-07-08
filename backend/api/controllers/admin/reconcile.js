module.exports = async function reconcile(req, res) {
  const partnerBalanceParam = req.param('partnerBalance');
  const partnerBalance = partnerBalanceParam === undefined || partnerBalanceParam === ''
    ? null
    : Number(partnerBalanceParam);

  if (partnerBalance !== null && Number.isNaN(partnerBalance)) {
    return res.fail(400, 'partnerBalance phải là số');
  }

  const report = await sails.helpers.reconcileNapas(partnerBalance);
  return res.ok({ report });
};
