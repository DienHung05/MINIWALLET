import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Home() {
  const [status, setStatus] = useState('Đang kết nối');
  const { isAuthed, user } = useAuth();
  const customerPath = isAuthed && user?.role === 'customer' ? '/app' : '/login';
  const adminPath = isAuthed && user?.role === 'officer' ? '/admin' : '/admin/login';

  useEffect(() => {
    api
      .get('/health')
      .then(() => setStatus('Sẵn sàng'))
      .catch((e) => setStatus(e.message));
  }, []);

  return (
    <section className="home-panel">
      <div className="home-copy">
        <p className="eyebrow">Mini Wallet</p>
        <h1>Ví điện tử cho chuyển tiền, nạp tiền và quản lý nguồn tiền liên kết.</h1>
        <p>Trạng thái hệ thống: <b>{status}</b></p>
      </div>
      <div className="home-actions">
        <Link className="btn btn-primary" to={customerPath}>
          {isAuthed && user?.role === 'customer' ? 'Vào ví của tôi' : 'Đăng nhập khách hàng'}
        </Link>
        <Link className="btn btn-secondary" to="/register">Tạo tài khoản</Link>
        <Link to={adminPath}>{isAuthed && user?.role === 'officer' ? 'Vào trang admin' : 'Trang admin'}</Link>
      </div>
    </section>
  );
}
