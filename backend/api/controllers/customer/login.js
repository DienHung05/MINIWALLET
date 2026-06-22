module.exports = async function login(req, res) {
    const { phone, pin } = req.allParams();
    if (!phone || !pin) return res.json({ err: 400, message: 'Thiếu phone hoặc pin' });

    const customer = await Customer.findOne({ phone });
    if (!customer) return res.json({ err: 401, message: 'Sai SĐT hoặc PIN' });

    const ok = await sails.helpers.checkPin(pin, customer.pinHash);
    if (!ok) return res.json({ err: 401, message: 'Sai SĐT hoặc PIN' });

    const token = await sails.helpers.issueToken(customer.id, 'customer');
    return res.json({ err: 200, message: 'Đăng nhập thành công', data: { token, user: { id: customer.id, phone: customer.phone } } });
};