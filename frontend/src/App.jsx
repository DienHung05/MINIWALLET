import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import CustomerLogin from './pages/customer/Login.jsx';
import OfficerLogin from './pages/admin/Login.jsx';

/**
 * App — khung router. Thêm route dần theo kế hoạch (Tuần 3).
 * - /                -> Home (kiểm tra kết nối backend)
 * - /login           -> Customer đăng nhập
 * - /admin/login     -> Officer đăng nhập
 * (Ngày 11+ thêm: ProtectedRoute, /admin/*, /wallet, /transfer, /bill, ...)
 */
export default function App() {
  return (
    <div className="container">
      <header>
        <h1>🪙 Mini Wallet</h1>
        <nav>
          <Link to="/">Trang chủ</Link>
          <Link to="/login">Customer</Link>
          <Link to="/admin/login">Officer</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/admin/login" element={<OfficerLogin />} />
        <Route path="*" element={<p>Không tìm thấy trang.</p>} />
      </Routes>
    </div>
  );
}
