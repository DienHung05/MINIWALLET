import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mw_token') || null);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('mw_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Gọi sau khi đăng nhập thành công (nhận token + user từ API)
  function login({ token, user }) {
    localStorage.setItem('mw_token', token);
    localStorage.setItem('mw_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('mw_token');
    localStorage.removeItem('mw_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>');
  return ctx;
}
