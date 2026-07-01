import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function CustomerLogin() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await api.post('/customer/login', { phone, pin });
      localStorage.setItem('mw_token', res.token);        
      const me = await api.get('/me');
      auth.login({ token: res.token, user: { id: me.user.id, role: me.user.role, phone } });
      nav('/app');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="card">
      <h2>Đăng nhập Customer</h2>
      <form onSubmit={submit}>
        <input placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input placeholder="Mã PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
        <button disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <p className="muted">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
    </div>
  );
}
