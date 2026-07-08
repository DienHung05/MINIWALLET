import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

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
    <AuthLayout eyebrow="Quản trị" title="Đăng nhập admin" subtitle="Khu vực vận hành dành cho quản trị viên.">
      <form onSubmit={submit}>
        <Field label="Tên đăng nhập">
          <input placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Mật khẩu">
          <input placeholder="admin123" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button className="full-width" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
      </form>
      <Alert tone="error">{err}</Alert>
    </AuthLayout>
  );
}
