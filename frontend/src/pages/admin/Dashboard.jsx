import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import { Alert, Button, DataTable, Field, Metric, SectionHeader, StatusBadge } from '../../components/ui.jsx';
import { formatDateTime, formatMoney, serviceLabel, statusLabel } from '../../utils/format.js';

const ADMIN_PAGE_SIZE = 5;

const EMPTY_CONNECTOR = {
  code: '',
  name: '',
  kind: '',
  baseUrl: '',
  timeoutMs: 8000,
  maxRetries: 0,
  enabled: true,
  operations: '{}',
};

const TABS = [
  ['overview', 'Tổng quan'],
  ['services', 'Service'],
  ['design', 'Thiết kế'],
  ['wallets', 'Ví'],
  ['billers', 'Biller'],
  ['customers', 'Khách hàng'],
  ['cashin', 'Cash-in'],
  ['trails', 'Trail'],
  ['history', 'History'],
  ['connectors', 'Kết nối'],
];

function pretty(value) {
  return JSON.stringify(value || [], null, 2);
}

function parseJson(text, fallback) {
  return text.trim() ? JSON.parse(text) : fallback;
}

function getPageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 3) return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
  if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', page - 1, page, page + 1, '...', totalPages];
}

function PagePagination({ page, pagination, loading, label, onChange }) {
  if (pagination.totalPages < 1) return null;
  return (
    <nav className="pagination" aria-label={label}>
      <div className="pagination-pages">
        {getPageItems(page, pagination.totalPages).map((item, index) => item === '...'
          ? <span className="pagination-ellipsis" key={`ellipsis-${index}`}>...</span>
          : (
            <button
              className={`page-number ${page === item ? 'active' : ''}`}
              disabled={loading || page === item}
              key={item}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ))}
      </div>
      <span className="pagination-status">
        Trang {page} / {pagination.totalPages}
      </span>
    </nav>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [report, setReport] = useState(null);
  const [services, setServices] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [billers, setBillers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, pageSize: ADMIN_PAGE_SIZE, total: 0, totalPages: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [trails, setTrails] = useState([]);
  const [trailPage, setTrailPage] = useState(1);
  const [trailPagination, setTrailPagination] = useState({ page: 1, pageSize: ADMIN_PAGE_SIZE, total: 0, totalPages: 0 });
  const [trailLoading, setTrailLoading] = useState(false);
  const [connectors, setConnectors] = useState([]);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');

  const [selectedTrail, setSelectedTrail] = useState(null);
  const [trailStatus, setTrailStatus] = useState('processing');
  const [trailService, setTrailService] = useState('');
  const [trailRef, setTrailRef] = useState('');

  const [cashInForm, setCashInForm] = useState({ customerPhone: '', amount: '' });
  const [walletForm, setWalletForm] = useState({ ownerType: 'bank', ownerRef: '', balance: '' });
  const [billerForm, setBillerForm] = useState({
    code: '',
    name: '',
    category: 'utility',
    inquiryUrl: 'http://127.0.0.1:1337/mock/biller/inquiry',
    paymentUrl: 'http://127.0.0.1:1337/mock/biller/payment',
    status: 'active',
  });

  const [designCode, setDesignCode] = useState('');
  const [designForm, setDesignForm] = useState({
    name: '',
    serviceType: '',
    enabled: true,
    fieldBuilder: '[]',
    fields: '[]',
    validations: '[]',
    feeConfig: '{}',
    auth: '{}',
    hooks: '[]',
    glSteps: '[]',
  });

  const [connectorForm, setConnectorForm] = useState(EMPTY_CONNECTOR);

  const processingCount = useMemo(
    () => trails.filter((t) => t.status === 'processing').length,
    [trails]
  );

  const selectedService = useMemo(
    () => services.find((s) => s.code === designCode) || services[0],
    [services, designCode]
  );

  async function loadIntegrity() {
    const r = await api.get('/admin/integrity');
    setReport(r.report);
  }

  async function loadServices() {
    const r = await api.get('/admin/services');
    setServices(r.services || []);
    if (!designCode && r.services?.length) setDesignCode(r.services[0].code);
  }

  async function loadWallets() {
    const r = await api.get('/admin/wallets');
    setWallets(r.wallets || []);
  }

  async function loadBillers() {
    const r = await api.get('/admin/billers');
    setBillers(r.billers || []);
  }

  async function loadCustomers() {
    const r = await api.get('/admin/customers');
    setCustomers(r.customers || []);
  }

  async function loadHistory(page = 1) {
    setHistoryLoading(true);
    try {
      const r = await api.get(`/admin/history?page=${page}&limit=${ADMIN_PAGE_SIZE}`);
      setHistory(r.history || []);
      setHistoryPagination(r.pagination || {
        page,
        pageSize: ADMIN_PAGE_SIZE,
        total: r.history?.length || 0,
        totalPages: r.history?.length ? 1 : 0,
      });
      setHistoryPage(page);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadTrails(status = trailStatus, page = 1) {
    setTrailLoading(true);
    const params = new URLSearchParams({ status, page: `${page}`, limit: `${ADMIN_PAGE_SIZE}` });
    if (trailService) params.set('serviceCode', trailService);
    if (trailRef) params.set('transRefId', trailRef);
    try {
      const r = await api.get(`/admin/trails?${params.toString()}`);
      setTrails(r.trails || []);
      setTrailPagination(r.pagination || {
        page,
        pageSize: ADMIN_PAGE_SIZE,
        total: r.trails?.length || 0,
        totalPages: r.trails?.length ? 1 : 0,
      });
      setTrailPage(page);
      setSelectedTrail(null);
    } finally {
      setTrailLoading(false);
    }
  }

  async function loadConnectors() {
    const r = await api.get('/admin/connectors');
    const rows = r.connectors || [];
    setConnectors(rows);
  }

  async function refreshAll() {
    setErr('');
    try {
      await Promise.all([
        loadIntegrity(),
        loadServices(),
        loadWallets(),
        loadBillers(),
        loadCustomers(),
        loadHistory(),
        loadTrails(),
        loadConnectors(),
      ]);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { refreshAll(); }, []);

  useEffect(() => {
    if (!selectedService) return;
    setDesignForm({
      name: selectedService.name || '',
      serviceType: selectedService.serviceType || '',
      enabled: selectedService.enabled !== false,
      fieldBuilder: pretty(selectedService.fieldBuilder || []),
      fields: pretty(selectedService.fields || []),
      validations: pretty(selectedService.validations || []),
      feeConfig: JSON.stringify(selectedService.feeConfig || {}, null, 2),
      auth: JSON.stringify(selectedService.auth || {}, null, 2),
      hooks: pretty(selectedService.hooks || []),
      glSteps: pretty(selectedService.glSteps || []),
    });
  }, [selectedService?.code]);

  async function toggleService(code, enabled) {
    try {
      await api.post('/admin/services/toggle', { code, enabled });
      await loadServices();
    } catch (e) { setErr(e.message); }
  }

  async function saveDesign(e) {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/admin/services/upsert', {
        code: selectedService.code,
        name: designForm.name,
        serviceType: designForm.serviceType,
        enabled: designForm.enabled,
        fieldBuilder: parseJson(designForm.fieldBuilder, []),
        fields: parseJson(designForm.fields, []),
        validations: parseJson(designForm.validations, []),
        feeConfig: parseJson(designForm.feeConfig, {}),
        auth: parseJson(designForm.auth, {}),
        hooks: parseJson(designForm.hooks, []),
        glSteps: parseJson(designForm.glSteps, []),
      });
      await loadServices();
      setNotice('Đã lưu cấu hình service ' + selectedService.code);
    } catch (e) {
      setErr(e.message || 'JSON cấu hình không hợp lệ');
    }
  }

  async function createWallet(e) {
    e.preventDefault();
    try {
      await api.post('/admin/wallets/create', {
        ownerType: walletForm.ownerType,
        ownerRef: walletForm.ownerRef,
        balance: Number(walletForm.balance || 0),
      });
      setWalletForm({ ownerType: 'bank', ownerRef: '', balance: '' });
      await loadWallets();
    } catch (e) { setErr(e.message); }
  }

  async function saveBiller(e) {
    e.preventDefault();
    try {
      await api.post('/admin/billers/upsert', billerForm);
      setBillerForm({
        code: '',
        name: '',
        category: 'utility',
        inquiryUrl: 'http://127.0.0.1:1337/mock/biller/inquiry',
        paymentUrl: 'http://127.0.0.1:1337/mock/biller/payment',
        status: 'active',
      });
      await loadBillers();
    } catch (e) { setErr(e.message); }
  }

  async function runCashIn(e) {
    e.preventDefault();
    try {
      await api.post('/admin/cash-in', {
        customerPhone: cashInForm.customerPhone,
        amount: Number(cashInForm.amount || 0),
      });
      setNotice('Đã nạp tiền cho khách hàng.');
      setCashInForm({ customerPhone: '', amount: '' });
      await Promise.all([loadWallets(), loadCustomers(), loadHistory(1), loadTrails('all', 1), loadIntegrity()]);
    } catch (e) { setErr(e.message); }
  }

  function editConnector(c) {
    setConnectorForm({
      code: c.code,
      name: c.name || '',
      kind: c.kind || '',
      baseUrl: c.baseUrl || '',
      timeoutMs: c.timeoutMs || 8000,
      maxRetries: c.maxRetries || 0,
      enabled: !!c.enabled,
      operations: JSON.stringify(c.operationsSpec || {}, null, 2),
    });
  }

  async function saveConnector(e) {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/admin/connectors/upsert', {
        code: connectorForm.code,
        name: connectorForm.name,
        kind: connectorForm.kind,
        baseUrl: connectorForm.baseUrl,
        timeoutMs: Number(connectorForm.timeoutMs),
        maxRetries: Number(connectorForm.maxRetries),
        enabled: connectorForm.enabled,
        operations: JSON.parse(connectorForm.operations || '{}'),
      });
      setConnectorForm(EMPTY_CONNECTOR);
      await loadConnectors();
    } catch (e) {
      setErr(e.message || 'Không lưu được kết nối đối tác');
    }
  }

  async function toggleConnector(code, enabled) {
    try {
      await api.post('/admin/connectors/toggle', { code, enabled });
      await loadConnectors();
    } catch (e) { setErr(e.message); }
  }

  async function deleteConnector(code) {
    try {
      await api.post('/admin/connectors/delete', { code });
      await loadConnectors();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionHeader eyebrow="Admin" title="Vận hành Mini Wallet" />
        <div className="tabs">
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        <Alert tone="error">{err}</Alert>
        <Alert tone="success">{notice}</Alert>
      </section>

      {tab === 'overview' && (
        <section className="panel">
          <SectionHeader title="Tổng quan" />
          <div className="metric-grid">
            <Metric label="Tổng số dư" value={formatMoney(report?.totalBalance || 0)} />
            <Metric label="Số ví" value={wallets.length || report?.pocketCount || 0} />
            <Metric label="Checksum" value={report?.checksumOk ? 'Khớp' : 'Cần kiểm tra'} />
            <Metric label="Service đang bật" value={services.filter((s) => s.enabled).length} />
            <Metric label="Khách hàng" value={customers.length} />
            <Metric label="Biller" value={billers.filter((b) => b.status !== 'disabled').length} />
            <Metric label="Đang xử lý" value={processingCount} />
          </div>
        </section>
      )}

      {tab === 'services' && (
        <section className="panel">
          <SectionHeader title="Quản lý Service" />
          <DataTable
            rows={services}
            columns={[
              { key: 'code', label: 'Mã' },
              { key: 'name', label: 'Tên' },
              { key: 'serviceType', label: 'Loại' },
              { key: 'auth', label: 'Xác thực', render: (s) => s.auth?.method || 'NONE' },
              { key: 'fee', label: 'Phí', render: (s) => s.feeConfig?.type === 'percent' ? `${s.feeConfig.value}%` : formatMoney(s.feeConfig?.value || 0) },
              { key: 'enabled', label: 'Trạng thái', render: (s) => <StatusBadge status={s.enabled ? 'active' : 'disabled'}>{s.enabled ? 'Đang bật' : 'Đang tắt'}</StatusBadge> },
              {
                key: 'actions',
                label: '',
                render: (s) => (
                  <div className="row-actions">
                    <Button variant="secondary" onClick={() => { setDesignCode(s.code); setTab('design'); }}>Thiết kế</Button>
                    <Button variant="ghost" onClick={() => toggleService(s.code, !s.enabled)}>{s.enabled ? 'Tắt' : 'Bật'}</Button>
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      {tab === 'design' && selectedService && (
        <section className="panel">
          <SectionHeader eyebrow="Transaction Design" title="Cấu hình 5 khối nghiệp vụ" />
          <form onSubmit={saveDesign} className="form-grid">
            <div className="grid two">
              <Field label="Chọn Service">
                <select value={selectedService.code} onChange={(e) => setDesignCode(e.target.value)}>
                  {services.map((s) => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
                </select>
              </Field>
              <Field label="Tên hiển thị"><input value={designForm.name} onChange={(e) => setDesignForm((f) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Loại nghiệp vụ"><input value={designForm.serviceType} onChange={(e) => setDesignForm((f) => ({ ...f, serviceType: e.target.value }))} /></Field>
              <label className="checkbox-line">
                <input type="checkbox" checked={designForm.enabled} onChange={(e) => setDesignForm((f) => ({ ...f, enabled: e.target.checked }))} />
                Đang bật
              </label>
            </div>
            <div className="grid two design-grid">
              <Field label="1. fieldBuilder"><textarea rows="12" value={designForm.fieldBuilder} onChange={(e) => setDesignForm((f) => ({ ...f, fieldBuilder: e.target.value }))} /></Field>
              <Field label="2. TransField"><textarea rows="12" value={designForm.fields} onChange={(e) => setDesignForm((f) => ({ ...f, fields: e.target.value }))} /></Field>
              <Field label="3. TransValidation"><textarea rows="10" value={designForm.validations} onChange={(e) => setDesignForm((f) => ({ ...f, validations: e.target.value }))} /></Field>
              <Field label="4. Fee"><textarea rows="10" value={designForm.feeConfig} onChange={(e) => setDesignForm((f) => ({ ...f, feeConfig: e.target.value }))} /></Field>
              <Field label="Auth + Hooks"><textarea rows="12" value={`${designForm.auth}\n\nHooks:\n${designForm.hooks}`} readOnly /></Field>
              <Field label="5. TransDefinition / glSteps"><textarea rows="12" value={designForm.glSteps} onChange={(e) => setDesignForm((f) => ({ ...f, glSteps: e.target.value }))} /></Field>
            </div>
            <Button>Lưu cấu hình</Button>
          </form>
        </section>
      )}

      {tab === 'wallets' && (
        <section className="panel">
          <SectionHeader title="Quản lý Ví" />
          <form onSubmit={createWallet} className="inline-form">
            <Field label="Loại ví">
              <select value={walletForm.ownerType} onChange={(e) => setWalletForm((f) => ({ ...f, ownerType: e.target.value }))}>
                <option value="bank">Bank</option>
                <option value="system">System</option>
              </select>
            </Field>
            <Field label="Mã ví"><input placeholder="BANK_EXTRA" value={walletForm.ownerRef} onChange={(e) => setWalletForm((f) => ({ ...f, ownerRef: e.target.value.toUpperCase() }))} /></Field>
            <Field label="Số dư ban đầu"><input type="number" value={walletForm.balance} onChange={(e) => setWalletForm((f) => ({ ...f, balance: e.target.value }))} /></Field>
            <Button>Tạo ví</Button>
          </form>
          <DataTable
            rows={wallets}
            columns={[
              { key: 'ownerType', label: 'Loại' },
              { key: 'ownerName', label: 'Chủ ví' },
              { key: 'balance', label: 'Số dư', render: (w) => formatMoney(w.balance) },
              { key: 'checksumOk', label: 'Checksum', render: (w) => w.checksumOk ? 'Khớp' : 'Lệch' },
              { key: 'state', label: 'Khoá' },
              { key: 'status', label: 'Trạng thái', render: (w) => <StatusBadge status={w.status}>{statusLabel(w.status)}</StatusBadge> },
            ]}
          />
        </section>
      )}

      {tab === 'billers' && (
        <section className="panel">
          <SectionHeader title="Quản lý Biller" />
          <form onSubmit={saveBiller} className="connector-form">
            <div className="grid two">
              <Field label="Mã"><input value={billerForm.code} onChange={(e) => setBillerForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></Field>
              <Field label="Tên"><input value={billerForm.name} onChange={(e) => setBillerForm((f) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Nhóm"><input value={billerForm.category} onChange={(e) => setBillerForm((f) => ({ ...f, category: e.target.value }))} /></Field>
              <Field label="Trạng thái">
                <select value={billerForm.status} onChange={(e) => setBillerForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="active">Đang bật</option>
                  <option value="disabled">Đang tắt</option>
                </select>
              </Field>
              <Field label="Inquiry URL"><input value={billerForm.inquiryUrl} onChange={(e) => setBillerForm((f) => ({ ...f, inquiryUrl: e.target.value }))} /></Field>
              <Field label="Payment URL"><input value={billerForm.paymentUrl} onChange={(e) => setBillerForm((f) => ({ ...f, paymentUrl: e.target.value }))} /></Field>
            </div>
            <Button>Lưu biller</Button>
          </form>
          <DataTable
            rows={billers}
            columns={[
              { key: 'code', label: 'Mã' },
              { key: 'name', label: 'Tên' },
              { key: 'category', label: 'Nhóm' },
              { key: 'status', label: 'Trạng thái', render: (b) => <StatusBadge status={b.status}>{statusLabel(b.status)}</StatusBadge> },
              { key: 'pocket', label: 'Ví biller', render: (b) => b.pocket || '-' },
              { key: 'actions', label: '', render: (b) => <Button variant="secondary" onClick={() => setBillerForm(b)}>Sửa</Button> },
            ]}
          />
        </section>
      )}

      {tab === 'customers' && (
        <section className="panel">
          <SectionHeader title="Quản lý Customer" />
          <DataTable
            rows={customers}
            columns={[
              { key: 'name', label: 'Họ tên' },
              { key: 'phone', label: 'Số điện thoại' },
              { key: 'balance', label: 'Số dư', render: (c) => formatMoney(c.balance) },
              { key: 'status', label: 'Trạng thái', render: (c) => <StatusBadge status={c.status}>{statusLabel(c.status)}</StatusBadge> },
              { key: 'createdAt', label: 'Ngày tạo', render: (c) => formatDateTime(c.createdAt) },
              { key: 'actions', label: '', render: (c) => <Button variant="secondary" onClick={() => { setCashInForm({ customerPhone: c.phone, amount: '' }); setTab('cashin'); }}>Cash-in</Button> },
            ]}
          />
        </section>
      )}

      {tab === 'cashin' && (
        <section className="panel">
          <SectionHeader eyebrow="Officer trigger" title="Nạp tiền cho khách" />
          <form onSubmit={runCashIn} className="grid two">
            <Field label="Số điện thoại khách"><input value={cashInForm.customerPhone} onChange={(e) => setCashInForm((f) => ({ ...f, customerPhone: e.target.value }))} /></Field>
            <Field label="Số tiền"><input type="number" value={cashInForm.amount} onChange={(e) => setCashInForm((f) => ({ ...f, amount: e.target.value }))} /></Field>
            <Button>Nạp tiền</Button>
          </form>
        </section>
      )}

      {tab === 'trails' && (
        <section className="panel">
          <SectionHeader title="Transaction Trail" action={<Button onClick={() => loadTrails(trailStatus, 1)}>Tải nhật ký</Button>} />
          <div className="grid three">
            <Field label="Trạng thái">
              <select value={trailStatus} onChange={(e) => { setTrailStatus(e.target.value); loadTrails(e.target.value, 1); }}>
                <option value="processing">Đang xử lý</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="done">Thành công</option>
                <option value="failed">Thất bại</option>
                <option value="reversed">Đã hoàn tiền</option>
                <option value="expired">Hết hạn</option>
                <option value="all">Tất cả</option>
              </select>
            </Field>
            <Field label="Dịch vụ"><input placeholder="BILL_PAYMENT" value={trailService} onChange={(e) => setTrailService(e.target.value.toUpperCase())} /></Field>
            <Field label="Mã giao dịch"><input value={trailRef} onChange={(e) => setTrailRef(e.target.value)} /></Field>
          </div>
          <DataTable
            rows={trails}
            emptyText="Không có giao dịch phù hợp"
            columns={[
              { key: 'serviceName', label: 'Dịch vụ', render: (t) => t.serviceName || t.serviceCode },
              { key: 'status', label: 'Trạng thái', render: (t) => <StatusBadge status={t.status}>{statusLabel(t.status)}</StatusBadge> },
              { key: 'amount', label: 'Số tiền', render: (t) => formatMoney(t.amount, '') },
              { key: 'transRefId', label: 'Mã giao dịch', render: (t) => <code>{t.transRefId}</code> },
              {
                key: 'actions',
                label: '',
                render: (t) => (
                  <div className="row-actions">
                    <Button className="btn-compact" variant="secondary" onClick={() => setSelectedTrail(t)}>Log</Button>
                  </div>
                ),
              },
            ]}
          />
          <PagePagination
            label="Phân trang transaction trail"
            loading={trailLoading}
            onChange={(nextPage) => loadTrails(trailStatus, nextPage)}
            page={trailPage}
            pagination={trailPagination}
          />
          {selectedTrail && (
            <div className="trail-log-panel">
              <SectionHeader
                eyebrow="Trace / Debug"
                title={`Step log · ${selectedTrail.transRefId}`}
                action={<Button variant="ghost" onClick={() => setSelectedTrail(null)}>Đóng</Button>}
              />
              <pre className="output-box">{JSON.stringify(selectedTrail.stepLog || [], null, 2)}</pre>
            </div>
          )}
        </section>
      )}

      {tab === 'history' && (
        <section className="panel">
          <SectionHeader title="Transaction History" />
          <DataTable
            rows={history}
            emptyText="Chưa có biên lai"
            columns={[
              { key: 'code', label: 'Biên lai' },
              { key: 'serviceName', label: 'Dịch vụ', render: (h) => h.serviceName || serviceLabel(h.serviceCode) },
              { key: 'amount', label: 'Số tiền', render: (h) => formatMoney(h.amount, '') },
              { key: 'fee', label: 'Phí', render: (h) => formatMoney(h.fee, '') },
              { key: 'status', label: 'Trạng thái', render: (h) => <StatusBadge status={h.status}>{statusLabel(h.status)}</StatusBadge> },
              { key: 'createdAt', label: 'Thời gian', render: (h) => formatDateTime(h.createdAt) },
            ]}
          />
          <PagePagination
            label="Phân trang transaction history"
            loading={historyLoading}
            onChange={loadHistory}
            page={historyPage}
            pagination={historyPagination}
          />
        </section>
      )}

      {tab === 'connectors' && (
        <section className="panel">
          <SectionHeader title="Kết nối đối tác" action={<Button variant="secondary" onClick={() => setConnectorForm(EMPTY_CONNECTOR)}>Tạo mới</Button>} />
          <DataTable
            rows={connectors}
            emptyText="Chưa có kết nối đối tác"
            columns={[
              { key: 'code', label: 'Mã' },
              { key: 'kind', label: 'Loại' },
              { key: 'baseUrl', label: 'Base URL', render: (c) => <code>{c.baseUrl}</code> },
              { key: 'operations', label: 'Thao tác hỗ trợ', render: (c) => (c.operations || []).join(', ') },
              { key: 'enabled', label: 'Trạng thái', render: (c) => <StatusBadge status={c.enabled ? 'active' : 'failed'}>{c.enabled ? 'Đang bật' : 'Đang tắt'}</StatusBadge> },
              {
                key: 'actions',
                label: '',
                render: (c) => (
                  <div className="row-actions">
                    <Button variant="secondary" onClick={() => editConnector(c)}>Sửa</Button>
                    <Button variant="ghost" onClick={() => toggleConnector(c.code, !c.enabled)}>{c.enabled ? 'Tắt' : 'Bật'}</Button>
                    <Button variant="danger" onClick={() => deleteConnector(c.code)}>Xoá</Button>
                  </div>
                ),
              },
            ]}
          />
          <form className="connector-form" onSubmit={saveConnector}>
            <div className="grid two">
              <Field label="Mã kết nối"><input value={connectorForm.code} onChange={(e) => setConnectorForm((f) => ({ ...f, code: e.target.value }))} /></Field>
              <Field label="Tên"><input value={connectorForm.name} onChange={(e) => setConnectorForm((f) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Loại"><input value={connectorForm.kind} onChange={(e) => setConnectorForm((f) => ({ ...f, kind: e.target.value }))} /></Field>
              <Field label="Base URL"><input value={connectorForm.baseUrl} onChange={(e) => setConnectorForm((f) => ({ ...f, baseUrl: e.target.value }))} /></Field>
              <Field label="Timeout ms"><input type="number" value={connectorForm.timeoutMs} onChange={(e) => setConnectorForm((f) => ({ ...f, timeoutMs: e.target.value }))} /></Field>
              <Field label="Số lần thử lại"><input type="number" value={connectorForm.maxRetries} onChange={(e) => setConnectorForm((f) => ({ ...f, maxRetries: e.target.value }))} /></Field>
            </div>
            <label className="checkbox-line">
              <input type="checkbox" checked={connectorForm.enabled} onChange={(e) => setConnectorForm((f) => ({ ...f, enabled: e.target.checked }))} />
              Đang bật
            </label>
            <Field label="Cấu hình thao tác">
              <textarea rows="7" value={connectorForm.operations} onChange={(e) => setConnectorForm((f) => ({ ...f, operations: e.target.value }))} />
            </Field>
            <Button>Lưu kết nối</Button>
          </form>
        </section>
      )}

    </div>
  );
}
