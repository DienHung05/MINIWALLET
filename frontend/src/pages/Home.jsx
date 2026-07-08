import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Home() {
  const [status, setStatus] = useState('Đang kiểm tra kết nối backend...');

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setStatus(`Backend sẵn sàng · ${res.data.time}`))
      .catch((e) => setStatus(e.message));
  }, []);

  return (
    <div className="home-panel">
      <div>
        <p className="eyebrow">Ví điện tử demo</p>
        <h1>Quản lý ví, chuyển tiền và theo dõi giao dịch trong một nơi.</h1>
        <p className="muted">{status}</p>
      </div>
      <div className="home-actions">
        <Link className="button-link" to="/login">Đăng nhập khách hàng</Link>
        <Link className="button-link secondary" to="/register">Tạo tài khoản</Link>
        <Link to="/admin/login">Vào trang admin</Link>
      </div>
    </div>
  );
}
