import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, Field } from '../../components/ui.jsx';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
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
      const res = await api.post('/customer/forgot-password', { identifier });
      if (!res.resetToken) {
        setErr('Không tìm thấy tài khoản đang hoạt động với thông tin này');
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
      title="Quên mật khẩu"
      subtitle="Nhập username hoặc số điện thoại để tạo mã đặt lại mật khẩu."
      footer={<Link to="/login">Quay lại đăng nhập</Link>}
    >
      <form onSubmit={submit}>
        <Field label="Username hoặc số điện thoại">
          <input placeholder="linh.nguyen hoặc 0912345678" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </Field>
        <Button className="full-width" disabled={loading}>{loading ? 'Đang tạo mã...' : 'Tạo mã đặt lại'}</Button>
      </form>

      <Alert tone="error">{err}</Alert>
      {resetToken && (
        <div className="reset-token-box">
          <p className="muted">Mã đặt lại mật khẩu:</p>
          <code>{resetToken}</code>
          <p className="muted">Hết hạn: {expiresAt ? new Date(expiresAt).toLocaleString('vi-VN') : '15 phút'}</p>
          <Link className="button-link" to={`/reset-password?token=${encodeURIComponent(resetToken)}`}>Đặt lại mật khẩu</Link>
        </div>
      )}
    </AuthLayout>
  );
}
