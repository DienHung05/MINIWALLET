import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function CustomerLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await api.post('/customer/login', { identifier, password });
      auth.login({ token: res.token, user: Object.assign({ role: 'customer' }, res.customer || {}) });
      nav('/app');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <p className="eyebrow">Khách hàng</p>
        <h2>Đăng nhập ví</h2>
        <p className="muted">Dùng username hoặc số điện thoại đã đăng ký.</p>
      </div>
      <form onSubmit={submit}>
        <label>
          Username hoặc số điện thoại
          <input placeholder="Ví dụ: linh.nguyen hoặc 0912345678" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </label>
        <label>
          Mật khẩu
          <input placeholder="Nhập mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="primary-action" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      {err && <p className="alert error">{err}</p>}
      <div className="auth-links">
        <Link to="/forgot-password">Quên mật khẩu?</Link>
        <span>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></span>
      </div>
    </div>
  );
}
