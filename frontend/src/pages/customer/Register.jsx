import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';

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
            if (password !== confirmPassword) throw new Error('Mật khẩu nhập lại chưa khớp');
            await api.post('/customer/register', { name, username, phone, password });
            const res = await api.post('/customer/login', { identifier: username || phone, password });
            auth.login({ token: res.token, user: Object.assign({ role: 'customer' }, res.customer || {}) });
            nav('/app');
        } catch (e) { setErr(e.message); } finally { setLoading(false); }
    }

    return (
        <div className="auth-card">
            <div className="auth-header">
                <p className="eyebrow">Tạo tài khoản</p>
                <h2>Đăng ký Mini Wallet</h2>
                <p className="muted">Tạo ví mới với số dư khởi tạo để thử các luồng giao dịch.</p>
            </div>
            <form onSubmit={submit}>
                <label>
                    Họ tên
                    <input placeholder="Nguyễn Linh" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                    Username
                    <input placeholder="linh.nguyen" value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <label>
                    Số điện thoại
                    <input placeholder="0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label>
                    Mật khẩu
                    <input placeholder="Ít nhất 6 ký tự" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <label>
                    Nhập lại mật khẩu
                    <input placeholder="Nhập lại mật khẩu" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </label>
                <button className="primary-action" disabled={loading}>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</button>
            </form>
            {err && <p className="alert error">{err}</p>}
            <p className="muted">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
        </div>
    );
}
