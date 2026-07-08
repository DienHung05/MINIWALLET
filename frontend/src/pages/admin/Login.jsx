import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function OfficerLogin() {
  const [username, setUsername] = useState('admin'); const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);
  const auth = useAuth(); const nav = useNavigate();

  async function submit(e) {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const res = await api.post('/officer/login', { username, password });
      auth.login({ token: res.token, user: { role: 'officer', username } });
      nav('/admin');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <p className="eyebrow">Quản trị</p>
        <h2>Đăng nhập admin</h2>
        <p className="muted">Tài khoản mặc định cho MVP: admin/admin123.</p>
      </div>
      <form onSubmit={submit}>
        <label>
          Tên đăng nhập
          <input placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Mật khẩu
          <input placeholder="admin123" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="primary-action" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      {err && <p className="alert error">{err}</p>}
    </div>
  );
}
