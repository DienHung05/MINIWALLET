import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

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
      const res = await api.post('/customer/login', { phone: phone.replace(/\s/g, ''), pin });
      auth.login({ token: res.token, user: Object.assign({ role: 'customer' }, res.customer || {}) });
      nav('/app');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <AuthLayout
      eyebrow="Khách hàng"
      title="Đăng nhập ví"
      subtitle="Dùng số điện thoại và mã PIN đã đăng ký."
      footer={<span>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></span>}
    >
      <form onSubmit={submit}>
        <Field label="Số điện thoại">
          <input placeholder="0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" required />
        </Field>
        <Field label="PIN">
          <input placeholder="Nhập PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="current-password" inputMode="numeric" required />
        </Field>
        <Button className="full-width" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
      </form>
      <Alert tone="error">{err}</Alert>
      <p className="form-note"><Link to="/forgot-pin">Quên PIN?</Link></p>
    </AuthLayout>
  );
}
