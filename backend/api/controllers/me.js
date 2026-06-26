module.exports = async function me(req, res) {
  return res.ok({ user: { id: req.info.user.id, role: req.info.role } });
};