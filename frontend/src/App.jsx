import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import CustomerLogin from './pages/customer/Login.jsx';
import Register from './pages/customer/Register.jsx';
import Dashboard from './pages/customer/Dashboard.jsx';
import NewTransaction from './pages/customer/NewTransaction.jsx';
import OfficerLogin from './pages/admin/Login.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';

export default function App() {
  const { isAuthed, user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="container">
      <header>
        <h1>🪙 Mini Wallet</h1>
        <nav>
          <Link to="/">Trang chủ</Link>
          {!isAuthed && <><Link to="/login">Customer</Link><Link to="/admin/login">Officer</Link></>}
          {isAuthed && user?.role === 'customer' && <Link to="/app">Ví của tôi</Link>}
          {isAuthed && user?.role === 'officer' && <Link to="/admin">Vận hành</Link>}
          {isAuthed && <a href="#" onClick={(e) => { e.preventDefault(); logout(); nav('/'); }}>Đăng xuất</a>}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={<ProtectedRoute role="customer"><Dashboard /></ProtectedRoute>} />
        <Route path="/app/new" element={<ProtectedRoute role="customer"><NewTransaction /></ProtectedRoute>} />
        <Route path="/admin/login" element={<OfficerLogin />} />
        <Route path="/admin" element={<ProtectedRoute role="officer"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<p>Không tìm thấy trang.</p>} />
      </Routes>
    </div>
  );
}