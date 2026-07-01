import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [bal, setBal] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {const res = await api.get('/customer/balance'); setBal(res); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="card">
        <h2>Xin chào {user?.phone}</h2>
        {err && <p style={{ color: 'crimson' }}>{err}</p>}
        <p style={{ fontSize: 28, fontWeight: 700}}>
            {bal ? `${bal.balance.toLocaleString('vi-VN')} ${bal.currency}` : '...'}
        </p>
        <button onClick={load}>Làm mới số dư</button>{' '}
        <Link to="/app/new"><button>Tạo giao dịch mới</button></Link>
    </div>
  )
}