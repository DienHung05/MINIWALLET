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
    <div className="card">
      <h2>Đăng nhập Officer</h2>
      <form onSubmit={submit}>
        <input placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading}>{loading ? 'Đang...' : 'Đăng nhập'}</button>
      </form>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
    </div>
  );
}