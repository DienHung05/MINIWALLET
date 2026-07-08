import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Home() {
  const [status, setStatus] = useState('Đang kết nối');

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
        <Link className="btn btn-primary" to="/login">Đăng nhập khách hàng</Link>
        <Link className="btn btn-secondary" to="/register">Tạo tài khoản</Link>
        <Link to="/admin/login">Trang admin</Link>
      </div>
    </section>
  );
}
