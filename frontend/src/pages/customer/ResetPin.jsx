import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

export default function ResetPin() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      if (pin !== confirmPin) throw new Error('PIN nhập lại chưa khớp');
      await api.post('/customer/reset-pin', { resetToken: token, pin });
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
      title="Đặt lại PIN"
      subtitle="Nhập mã đặt lại và PIN mới cho ví của bạn."
      footer={<Link to="/login">Quay lại đăng nhập</Link>}
    >
      <form onSubmit={submit}>
        <Field label="Mã đặt lại">
          <input placeholder="Dán mã đặt lại PIN" value={token} onChange={(e) => setToken(e.target.value)} />
        </Field>
        <Field label="PIN mới">
          <input placeholder="4-6 chữ số" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" />
        </Field>
        <Field label="Nhập lại PIN mới">
          <input placeholder="Nhập lại PIN mới" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" />
        </Field>
        <Button className="full-width" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Đặt lại PIN'}</Button>
      </form>

      <Alert tone="success">{done ? 'PIN đã được cập nhật. Đang chuyển về đăng nhập...' : ''}</Alert>
      <Alert tone="error">{err}</Alert>
    </AuthLayout>
  );
}
