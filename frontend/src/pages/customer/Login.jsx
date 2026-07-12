import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

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
      const res = await api.post('/customer/login', { identifier: identifier.trim(), password });
      auth.login({ token: res.token, user: Object.assign({ role: 'customer' }, res.customer || {}) });
      nav('/app');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <AuthLayout
      eyebrow="Khách hàng"
      title="Đăng nhập ví"
      subtitle="Dùng username hoặc số điện thoại đã đăng ký."
      footer={<span>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></span>}
    >
      <form onSubmit={submit}>
        <Field label="Username hoặc số điện thoại">
          <input placeholder="Ví dụ: linh.nguyen hoặc 0912345678" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
        </Field>
        <Field label="Mật khẩu">
          <input placeholder="Nhập mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Button className="full-width" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
      </form>
      <Alert tone="error">{err}</Alert>
      <p className="form-note"><Link to="/forgot-password">Quên mật khẩu?</Link></p>
    </AuthLayout>
  );
}
