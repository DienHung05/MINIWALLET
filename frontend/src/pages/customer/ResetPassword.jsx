import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      if (password !== confirmPassword) throw new Error('Mật khẩu nhập lại chưa khớp');
      await api.post('/customer/reset-password', { resetToken: token, password });
      setDone(true);
      setTimeout(() => nav('/login'), 900);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Bảo mật"
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã đặt lại và mật khẩu mới cho tài khoản của bạn."
      footer={<Link to="/login">Quay lại đăng nhập</Link>}
    >
      <form onSubmit={submit}>
        <Field label="Mã đặt lại">
          <input placeholder="Dán mã đặt lại mật khẩu" value={token} onChange={(e) => setToken(e.target.value)} />
        </Field>
        <Field label="Mật khẩu mới">
          <input placeholder="Ít nhất 6 ký tự" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Nhập lại mật khẩu mới">
          <input placeholder="Nhập lại mật khẩu mới" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </Field>
        <Button className="full-width" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</Button>
      </form>

      <Alert tone="success">{done ? 'Mật khẩu đã được cập nhật. Đang chuyển về đăng nhập...' : ''}</Alert>
      <Alert tone="error">{err}</Alert>
    </AuthLayout>
  );
}
