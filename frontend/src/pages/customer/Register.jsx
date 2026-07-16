import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

export default function Register() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);
    const auth = useAuth(); const nav = useNavigate();

    async function submit(e) {
        e.preventDefault(); setErr(''); setLoading(true);
        try {
            const cleanPhone = phone.replace(/\s/g, '');
            if (pin !== confirmPin) throw new Error('PIN nhập lại chưa khớp');
            await api.post('/customer/register', { name: name.trim(), phone: cleanPhone, pin });
            const res = await api.post('/customer/login', { phone: cleanPhone, pin });
            auth.login({ token: res.token, user: Object.assign({ role: 'customer' }, res.customer || {}) });
            nav('/app');
        } catch (e) { setErr(e.message); } finally { setLoading(false); }
    }

    return (
        <AuthLayout
            eyebrow="Tạo tài khoản"
            title="Đăng ký Mini Wallet"
            subtitle="Tạo ví bằng số điện thoại và mã PIN bảo mật."
            footer={<span>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></span>}
        >
            <form onSubmit={submit}>
                <Field label="Họ tên">
                    <input placeholder="Nguyễn Linh" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </Field>
                <Field label="Số điện thoại">
                    <input placeholder="0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" required />
                </Field>
                <Field label="PIN">
                    <input placeholder="4-6 chữ số" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="new-password" inputMode="numeric" required />
                </Field>
                <Field label="Nhập lại PIN">
                    <input placeholder="Nhập lại PIN" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="new-password" inputMode="numeric" required />
                </Field>
                <Button className="full-width" disabled={loading}>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</Button>
            </form>
            <Alert tone="error">{err}</Alert>
        </AuthLayout>
    );
}
