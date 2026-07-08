import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';

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
    <div className="auth-card">
      <div className="auth-header">
        <p className="eyebrow">Bảo mật</p>
        <h2>Đặt lại mật khẩu</h2>
        <p className="muted">Nhập mã đặt lại và mật khẩu mới cho tài khoản của bạn.</p>
      </div>
      <form onSubmit={submit}>
        <label>
          Mã đặt lại
          <input placeholder="Dán mã đặt lại mật khẩu" value={token} onChange={(e) => setToken(e.target.value)} />
        </label>
        <label>
          Mật khẩu mới
          <input placeholder="Ít nhất 6 ký tự" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Nhập lại mật khẩu mới
          <input placeholder="Nhập lại mật khẩu mới" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>
        <button className="primary-action" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</button>
      </form>

      {done && <p className="alert success">Mật khẩu đã được cập nhật. Đang chuyển về đăng nhập...</p>}
      {err && <p className="alert error">{err}</p>}
      <p className="muted"><Link to="/login">Quay lại đăng nhập</Link></p>
    </div>
  );
}
