module.exports = async function login(req, res) {
    const { username, password } = req.allParams();
    if (!username || !password) return res.json({ err: 400, message: 'Thiếu username hoặc password' });

    const officer = await Officer.findOne({ username });
    if (!officer) return res.json({ err: 401, message: 'Sai tài khoản hoặc mật khẩu' });

    const ok = await sails.helpers.checkPin(password, officer.passwordHash);
    if (!ok) return res.json({ err: 401, message: 'Sai tài khoản hoặc mật khẩu' });

    const token = await sails.helpers.issueToken(officer.id, 'officer');
    return res.json({ err: 200, message: 'Đăng nhập thành công', data: { token, user: { id: officer.id, username: officer.username } } });
};