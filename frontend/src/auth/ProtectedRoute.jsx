import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Chặn route nếu chưa đăng nhập (hoặc sai vai trò).
export default function ProtectedRoute({ children, role }) {
  const { isAuthed, user } = useAuth();
  if (!isAuthed) return <Navigate to={role === 'officer' ? '/admin/login' : '/login'} replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
