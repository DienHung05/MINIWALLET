import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [bal, setBal] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const [balanceRes, instrumentRes, historyRes] = await Promise.all([
        api.get('/customer/balance'),
        api.get('/customer/instruments'),
        api.get('/customer/history?limit=10'),
      ]);
      setBal(balanceRes);
      setInstruments(instrumentRes.instruments || []);
      setHistory(historyRes.history || []);
    }
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

        <h3>Instrument đã liên kết</h3>
        {instruments.length === 0 ? (
          <p className="muted">Chưa có ngân hàng/thẻ liên kết.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Loại</th><th>Đối tác</th><th>Số masked</th><th>Chủ tài khoản</th><th>Trạng thái</th><th>Mã nguồn liên kết của thẻ</th></tr></thead>
              <tbody>
                {instruments.map((x) => (
                  <tr key={x.id}>
                    <td>{x.type}</td>
                    <td>{x.connector}</td>
                    <td>{x.maskedNumber}</td>
                    <td>{x.holderName || '-'}</td>
                    <td><span className={`badge ${x.status}`}>{x.status}</span></td>
                    <td><code>{x.id}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3>Lịch sử gần đây</h3>
        {history.length === 0 ? (
          <p className="muted">Chưa có giao dịch.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Dịch vụ</th><th>Số tiền</th><th>Phí</th><th>Trạng thái</th><th>Mã tham chiếu</th></tr></thead>
              <tbody>
                {history.map((x) => (
                  <tr key={x.transRefId}>
                    <td>{x.serviceCode}</td>
                    <td>{Number(x.amount || 0).toLocaleString('vi-VN')}</td>
                    <td>{Number(x.fee || 0).toLocaleString('vi-VN')}</td>
                    <td><span className={`badge ${x.status}`}>{x.status}</span></td>
                    <td><code>{x.transRefId}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
