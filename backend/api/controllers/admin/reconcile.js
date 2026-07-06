module.exports = async function reconcile(req, res) {
  const statementBalance = req.param('statementBalance');
  try {
    const report = await sails.helpers.reconcileNapas(
      statementBalance === undefined || statementBalance === '' ? undefined : Number(statementBalance)
    );
    return res.ok({ report });
  } catch (e) {
    return res.fail(500, e.message || 'Đối soát lỗi');
  }
};
