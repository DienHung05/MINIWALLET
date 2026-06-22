import { useState } from 'react';

/**
 * OfficerLogin — STUB (cài đầy đủ ở Ngày 11).
 * Mục tiêu: gọi POST /api/officer/login { username, password } -> token -> vào khu admin.
 */
export default function OfficerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    // TODO Ngày 11
    alert('Chưa cài đăng nhập Officer (làm ở Ngày 11).');
  }

  return (
    <div className="card">
      <h2>Đăng nhập Officer (Admin)</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}
