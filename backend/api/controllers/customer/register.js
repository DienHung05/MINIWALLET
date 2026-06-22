module.exports = async function (req, res) { 
    const { phone, pin } = req.allParams();
    if (!phone || !pin) return res.json({ err: 400, message: 'Thiếu phone hoặc pin' });

    const existed = await Customer.findOne({ phone });
    if (existed) return res.json({ err: 409, message: 'Số điện thoại đã được đăng ký' });

    const pinHash = await sails.helpers.hashPin(pin);
    const customer = await Customer.create({ phone, pinHash }).fetch();

    return res.json({ err: 200, message: 'Đăng ký thành công', data: { id: customer.id, phone: customer.phone } });
};