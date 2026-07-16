import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

export default function ForgotPin() {
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setResetToken('');
    setLoading(true);
    try {
      const res = await api.post('/customer/forgot-pin', { phone: phone.replace(/\s/g, '') });
      if (!res.resetToken) {
        setErr('Không tìm thấy tài khoản đang hoạt động với số điện thoại này');
        return;
      }
      setResetToken(res.resetToken);
      setExpiresAt(res.expiresAt || 0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Khôi phục"
      title="Quên PIN"
      subtitle="Nhập số điện thoại để tạo mã đặt lại PIN."
      footer={<Link to="/login">Quay lại đăng nhập</Link>}
    >
      <form onSubmit={submit}>
        <Field label="Số điện thoại">
          <input placeholder="0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
        </Field>
        <Button className="full-width" disabled={loading}>{loading ? 'Đang tạo mã...' : 'Tạo mã đặt lại'}</Button>
      </form>

      <Alert tone="error">{err}</Alert>
      {resetToken && (
        <div className="reset-token-box">
          <p className="muted">Mã đặt lại PIN:</p>
          <code>{resetToken}</code>
          <p className="muted">Hết hạn: {expiresAt ? new Date(expiresAt).toLocaleString('vi-VN') : '15 phút'}</p>
          <Link className="button-link" to={`/reset-pin?token=${encodeURIComponent(resetToken)}`}>Đặt lại PIN</Link>
        </div>
      )}
    </AuthLayout>
  );
}
