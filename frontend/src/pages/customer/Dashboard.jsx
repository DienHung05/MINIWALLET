import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Alert, DataTable, EmptyState, SectionHeader, StatusBadge } from "../../components/ui.jsx";
import { formatMoney, serviceLabel, sourceTypeLabel, statusLabel } from "../../utils/format.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [bal, setBal] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [history, setHistory] = useState([]);
  const [transferService, setTransferService] = useState('P2P');
  const [sourceService, setSourceService] = useState('LINK_BANK');
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
          <h1>Xin chào {user?.name || user?.phone}</h1>
          <p className="balance-text">{bal ? formatMoney(bal.balance, bal.currency) : '...'}</p>
        </div>
      </section>

      <Alert tone="error">{err}</Alert>

      <section className="panel">
        <SectionHeader eyebrow="Thao tác chính" title="Bạn muốn làm gì?" />
        <div className="action-group-grid customer-actions">
          <div className="action-group-card">
            <span>Chuyển tiền</span>
            <p>Gửi tiền tới số điện thoại của khách hàng khác trong Mini Wallet.</p>
            <Link className="btn btn-primary btn-compact" to="/app/new?service=P2P">Chuyển tiền</Link>
          </div>
          <div className="action-group-card">
            <span>Thanh toán hoá đơn</span>
            <p>Chọn nhà cung cấp, nhập mã hoá đơn và xem số tiền hệ thống tra cứu.</p>
            <Link className="btn btn-secondary btn-compact" to="/app/new?service=BILL_PAYMENT">Thanh toán</Link>
          </div>
          <div className="action-group-card">
            <span>Lịch sử</span>
            <p>Xem các giao dịch gần đây và mã biên lai sau khi hoàn tất.</p>
            <a className="btn btn-secondary btn-compact" href="#history">Xem lịch sử</a>
          </div>
        </div>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Tiện ích mở rộng" title="Nguồn tiền và chuyển ngoài hệ thống" />
        <div className="action-group-grid">
          <div className="action-group-card">
            <span>Chuyển liên ngân hàng</span>
            <p>Gửi tiền ra tài khoản ngân hàng ngoài hệ thống qua NAPAS.</p>
            <Link className="btn btn-secondary btn-compact" to="/app/new?service=INTERBANK_OUT">Tiếp tục</Link>
          </div>
          <div className="action-group-card">
            <span>Liên kết nguồn tiền</span>
            <p>Thêm tài khoản ngân hàng hoặc thẻ để dùng cho ví.</p>
            <div className="action-select-row">
              <select aria-label="Chọn nguồn tiền cần liên kết" value={sourceService} onChange={(e) => setSourceService(e.target.value)}>
                <option value="LINK_BANK">Liên kết ngân hàng</option>
                <option value="LINK_CARD">Liên kết thẻ</option>
              </select>
              <Link className="btn btn-secondary btn-compact" to={`/app/new?service=${sourceService}`}>Tiếp tục</Link>
            </div>
          </div>
          <div className="action-group-card">
            <span>Nạp tiền từ thẻ</span>
            <p>Tiện ích demo ngoài nghiệp vụ Cash-in do quản trị viên thực hiện.</p>
            <Link className="btn btn-secondary btn-compact" to="/app/new?service=CARD_TOPUP">Nạp từ thẻ</Link>
          </div>
        </div>
      </section>

      <section className="panel" id="history">
        <SectionHeader
          eyebrow="Nguồn tiền"
          title="Nguồn tiền đã liên kết"
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
