import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import AppShell from './components/AppShell.jsx';
import Home from './pages/Home.jsx';
import CustomerLogin from './pages/customer/Login.jsx';
import Register from './pages/customer/Register.jsx';
import ForgotPassword from './pages/customer/ForgotPassword.jsx';
import ResetPassword from './pages/customer/ResetPassword.jsx';
import Dashboard from './pages/customer/Dashboard.jsx';
import NewTransaction from './pages/customer/NewTransaction.jsx';
import OfficerLogin from './pages/admin/Login.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/app" element={<ProtectedRoute role="customer"><Dashboard /></ProtectedRoute>} />
        <Route path="/app/new" element={<ProtectedRoute role="customer"><NewTransaction /></ProtectedRoute>} />
        <Route path="/admin/login" element={<OfficerLogin />} />
        <Route path="/admin" element={<ProtectedRoute role="officer"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<p>Không tìm thấy trang.</p>} />
      </Routes>
    </AppShell>
  );
}
