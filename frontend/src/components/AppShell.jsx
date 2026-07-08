import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function AppShell({ children }) {
  const { isAuthed, user, logout } = useAuth();
  const nav = useNavigate();

  function onLogout(e) {
    e.preventDefault();
    logout();
    nav('/');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">Mini Wallet</Link>
        <nav className="topnav">
          <Link to="/">Trang chủ</Link>
          {!isAuthed && <Link to="/login">Khách hàng</Link>}
          {!isAuthed && <Link to="/admin/login">Admin</Link>}
          {isAuthed && user?.role === 'customer' && <Link to="/app">Ví của tôi</Link>}
          {isAuthed && user?.role === 'officer' && <Link to="/admin">Vận hành</Link>}
          {isAuthed && <a href="#" onClick={onLogout}>Đăng xuất</a>}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
