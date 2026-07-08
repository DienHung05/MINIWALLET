import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";

function sourceTypeLabel(type) {
  if (type === 'card') return 'Thẻ';
  if (type === 'bankAccount') return 'Tài khoản ngân hàng';
  return 'Nguồn tiền';
}

function serviceLabel(code) {
  const map = {
    P2P: 'Chuyển tiền nội bộ',
    INTERBANK_OUT: 'Chuyển liên ngân hàng',
    LINK_BANK: 'Liên kết ngân hàng',
    LINK_CARD: 'Liên kết thẻ',
    CARD_TOPUP: 'Nạp tiền từ thẻ',
  };
  return map[code] || code;
}

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
    <div className="stack">
      <section className="card wallet-hero">
        <div>
          <p className="eyebrow">Ví của tôi</p>
          <h2>Xin chào {user?.name || user?.username || user?.phone}</h2>
          <p className="balance-text">
            {bal ? `${bal.balance.toLocaleString('vi-VN')} ${bal.currency}` : '...'}
          </p>
        </div>
        <div className="quick-actions">
          <button onClick={load}>Làm mới</button>
          <Link className="button-link" to="/app/new?service=P2P">Chuyển tiền</Link>
          <Link className="button-link secondary" to="/app/new?service=LINK_CARD">Liên kết thẻ</Link>
          <Link className="button-link secondary" to="/app/new?service=CARD_TOPUP">Nạp từ thẻ</Link>
        </div>
      </section>

      {err && <p className="alert error">{err}</p>}

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Nguồn tiền</p>
            <h3>Nguồn tiền đã liên kết</h3>
          </div>
          <Link to="/app/new?service=LINK_BANK">Liên kết ngân hàng</Link>
        </div>
        {instruments.length === 0 ? (
          <p className="muted">Bạn chưa có ngân hàng hoặc thẻ liên kết.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Loại</th><th>Đối tác</th><th>Số đã che</th><th>Chủ tài khoản</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {instruments.map((x) => (
                  <tr key={x.id}>
                    <td>{sourceTypeLabel(x.type)}</td>
                    <td>{x.connector}</td>
                    <td>{x.maskedNumber}</td>
                    <td>{x.holderName || '-'}</td>
                    <td><span className={`badge ${x.status}`}>{x.status === 'active' ? 'Đang dùng' : x.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Lịch sử</p>
            <h3>Giao dịch gần đây</h3>
          </div>
          <Link to="/app/new">Tạo giao dịch</Link>
        </div>
        {history.length === 0 ? (
          <p className="muted">Chưa có giao dịch.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Dịch vụ</th><th>Số tiền</th><th>Phí</th><th>Trạng thái</th><th>Mã giao dịch</th></tr></thead>
              <tbody>
                {history.map((x) => (
                  <tr key={x.transRefId}>
                    <td>{serviceLabel(x.serviceCode)}</td>
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
      </section>
    </div>
  )
}
