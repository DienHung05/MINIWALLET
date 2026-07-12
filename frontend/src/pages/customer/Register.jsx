import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

export default function Register() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);
    const auth = useAuth(); const nav = useNavigate();

    async function submit(e) {
        e.preventDefault(); setErr(''); setLoading(true);
        try {
            const cleanUsername = username.trim().toLowerCase();
            const cleanPhone = phone.replace(/\s/g, '');
            if (password !== confirmPassword) throw new Error('Mật khẩu nhập lại chưa khớp');
            await api.post('/customer/register', { name: name.trim(), username: cleanUsername, phone: cleanPhone, password });
            const res = await api.post('/customer/login', { identifier: cleanUsername || cleanPhone, password });
            auth.login({ token: res.token, user: Object.assign({ role: 'customer' }, res.customer || {}) });
            nav('/app');
        } catch (e) { setErr(e.message); } finally { setLoading(false); }
    }

    return (
        <AuthLayout
            eyebrow="Tạo tài khoản"
            title="Đăng ký Mini Wallet"
            subtitle="Tạo ví mới và bắt đầu giao dịch trong vài bước."
            footer={<span>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></span>}
        >
            <form onSubmit={submit}>
                <Field label="Họ tên">
                    <input placeholder="Nguyễn Linh" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </Field>
                <Field label="Username">
                    <input placeholder="linh.nguyen" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} autoComplete="username" required />
                </Field>
                <Field label="Số điện thoại">
                    <input placeholder="0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" required />
                </Field>
                <Field label="Mật khẩu">
                    <input placeholder="Ít nhất 6 ký tự" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                </Field>
                <Field label="Nhập lại mật khẩu">
                    <input placeholder="Nhập lại mật khẩu" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                </Field>
                <Button className="full-width" disabled={loading}>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</Button>
            </form>
            <Alert tone="error">{err}</Alert>
        </AuthLayout>
    );
}
