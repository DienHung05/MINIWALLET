import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

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
    <div className="auth-card">
      <div className="auth-header">
        <p className="eyebrow">Khôi phục</p>
        <h2>Quên mật khẩu</h2>
        <p className="muted">Nhập username hoặc số điện thoại để nhận mã đặt lại mật khẩu.</p>
      </div>
      <form onSubmit={submit}>
        <label>
          Username hoặc số điện thoại
          <input placeholder="linh.nguyen hoặc 0912345678" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </label>
        <button className="primary-action" disabled={loading}>{loading ? 'Đang tạo mã...' : 'Tạo mã đặt lại'}</button>
      </form>

      {err && <p className="alert error">{err}</p>}
      {resetToken && (
        <div className="reset-token-box">
          <p className="muted">Mã đặt lại mật khẩu dùng cho bản demo:</p>
          <code>{resetToken}</code>
          <p className="muted">Hết hạn: {expiresAt ? new Date(expiresAt).toLocaleString('vi-VN') : '15 phút'}</p>
          <Link className="button-link" to={`/reset-password?token=${encodeURIComponent(resetToken)}`}>Đặt lại mật khẩu</Link>
        </div>
      )}
      <p className="muted"><Link to="/login">Quay lại đăng nhập</Link></p>
    </div>
  );
}
