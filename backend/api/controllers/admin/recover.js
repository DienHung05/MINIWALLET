module.exports = async function recover(req, res) {
  const summary = await sails.helpers.recover();
  return res.ok({ summary });
};
