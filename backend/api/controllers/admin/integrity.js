module.exports = async function integrity(req, res) {
  const report = await sails.helpers.integrityCheck();
  return res.ok({ report });
};
