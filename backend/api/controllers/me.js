module.exports = async function (req, res) {
    const u = req.info.user;
    return res.json({ err: 200, message: 'ok', data: { role: req.info.role, id: u.id, name: u.phone || u.username } });
};