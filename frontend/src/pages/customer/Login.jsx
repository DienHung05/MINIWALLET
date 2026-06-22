import { useState } from 'react';

/**
 * CustomerLogin — STUB (cài đầy đủ ở Ngày 11).
 * Mục tiêu: gọi POST /api/customer/login { phone, pin } -> nhận token -> auth.login(...).
 */
export default function CustomerLogin() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    // TODO Ngày 11:
    //   const res = await api.post('/customer/login', { phone, pin });
    //   auth.login({ token: res.data.token, user: res.data.user });
    alert('Chưa cài đăng nhập (làm ở Ngày 11).');
  }

  return (
    <div className="card">
      <h2>Đăng nhập Customer</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input placeholder="Mã PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}
