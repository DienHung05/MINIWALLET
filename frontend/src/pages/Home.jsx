import { useEffect, useState } from 'react';
import api from '../api/client.js';

/**
 * Home — kiểm tra kết nối tới backend qua /api/health.
 * Nếu thấy "Backend OK" nghĩa là Vite proxy + Sails đang chạy đúng.
 */
export default function Home() {
  const [status, setStatus] = useState('Đang kiểm tra kết nối backend...');

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setStatus(`✅ Backend OK · ${res.data.time}`))
      .catch((e) => setStatus(`❌ ${e.message}`));
  }, []);

  return (
    <div className="card">
      <h2>Chào mừng 👋</h2>
      <p className="muted">{status}</p>
      <p>
        Đây là khung khởi đầu. Đọc <code>KE-HOACH-3-TUAN.md</code> để biết làm gì mỗi ngày.
      </p>
    </div>
  );
}
