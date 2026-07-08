import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Alert, Button, DataTable, EmptyState, SectionHeader, StatusBadge } from "../../components/ui.jsx";
import { formatMoney, serviceLabel, sourceTypeLabel, statusLabel } from "../../utils/format.js";

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
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="page-stack">
      <section className="wallet-summary">
        <div>
          <p className="eyebrow">Ví của tôi</p>
          <h1>Xin chào {user?.name || user?.username || user?.phone}</h1>
          <p className="balance-text">{bal ? formatMoney(bal.balance, bal.currency) : '...'}</p>
        </div>
        <div className="quick-actions">
          <Button onClick={load}>Làm mới</Button>
          <Link className="btn btn-primary" to="/app/new?service=P2P">Chuyển tiền</Link>
          <Link className="btn btn-secondary" to="/app/new?service=CARD_TOPUP">Nạp từ thẻ</Link>
          <Link className="btn btn-secondary" to="/app/new?service=LINK_CARD">Liên kết thẻ</Link>
        </div>
      </section>

      <Alert tone="error">{err}</Alert>

      <section className="panel">
        <SectionHeader
          eyebrow="Nguồn tiền"
          title="Nguồn tiền đã liên kết"
          action={<Link className="btn btn-secondary" to="/app/new?service=LINK_BANK">Liên kết ngân hàng</Link>}
        />
        <DataTable
          rows={instruments}
          emptyText="Bạn chưa có nguồn tiền liên kết"
          columns={[
            { key: 'type', label: 'Loại', render: (x) => sourceTypeLabel(x.type) },
            { key: 'connector', label: 'Đối tác' },
            { key: 'maskedNumber', label: 'Số đã che' },
            { key: 'holderName', label: 'Chủ tài khoản', render: (x) => x.holderName || '-' },
            { key: 'status', label: 'Trạng thái', render: (x) => <StatusBadge status={x.status}>{statusLabel(x.status)}</StatusBadge> },
          ]}
        />
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Lịch sử"
          title="Giao dịch gần đây"
          action={<Link className="btn btn-secondary" to="/app/new">Tạo giao dịch</Link>}
        />
        {history.length === 0 ? (
          <EmptyState title="Chưa có giao dịch" />
        ) : (
          <DataTable
            rows={history}
            columns={[
              { key: 'serviceCode', label: 'Dịch vụ', render: (x) => serviceLabel(x.serviceCode) },
              { key: 'amount', label: 'Số tiền', render: (x) => formatMoney(x.amount, '') },
              { key: 'fee', label: 'Phí', render: (x) => formatMoney(x.fee, '') },
              { key: 'status', label: 'Trạng thái', render: (x) => <StatusBadge status={x.status}>{statusLabel(x.status)}</StatusBadge> },
              { key: 'transRefId', label: 'Mã giao dịch', render: (x) => <code>{x.transRefId}</code> },
            ]}
          />
        )}
      </section>
    </div>
  )
}
