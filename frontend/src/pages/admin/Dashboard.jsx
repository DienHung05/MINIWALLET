import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import { Alert, Button, DataTable, Field, Metric, SectionHeader, StatusBadge } from '../../components/ui.jsx';
import { formatMoney, statusLabel } from '../../utils/format.js';

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
  ['transactions', 'Giao dịch'],
  ['reconcile', 'Đối soát'],
  ['connectors', 'Kết nối'],
  ['tools', 'Công cụ kỹ thuật'],
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [report, setReport] = useState(null);
  const [reconcile, setReconcile] = useState(null);
  const [out, setOut] = useState('');
  const [err, setErr] = useState('');
  const [refId, setRefId] = useState('');
  const [state, setState] = useState('SUCCESS');
  const [trails, setTrails] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [trailStatus, setTrailStatus] = useState('processing');
  const [trailService, setTrailService] = useState('');
  const [trailConnector, setTrailConnector] = useState('');
  const [trailRef, setTrailRef] = useState('');
  const [connectorCode, setConnectorCode] = useState('VCB');
  const [operation, setOperation] = useState('sendOtp');
  const [args, setArgs] = useState('{"account":"0123456789"}');
  const [partnerBalance, setPartnerBalance] = useState('');
  const [connectorForm, setConnectorForm] = useState(EMPTY_CONNECTOR);

  const processingCount = useMemo(
    () => trails.filter((t) => t.status === 'processing').length,
    [trails]
  );

  async function loadIntegrity() {
    setErr('');
    try {
      const r = await api.get('/admin/integrity');
      setReport(r.report);
    } catch (e) { setErr(e.message); }
  }

  async function loadReconcile() {
    setErr('');
    try {
      const query = partnerBalance === '' ? '' : `?partnerBalance=${encodeURIComponent(partnerBalance)}`;
      const r = await api.get(`/admin/reconcile${query}`);
      setReconcile(r.report);
    } catch (e) { setErr(e.message); }
  }

  async function loadTrails(status = trailStatus) {
    setErr('');
    try {
      const params = new URLSearchParams({ status, limit: '30' });
      if (trailService) params.set('serviceCode', trailService);
      if (trailConnector) params.set('connector', trailConnector);
      if (trailRef) params.set('transRefId', trailRef);
      const r = await api.get(`/admin/trails?${params.toString()}`);
      setTrails(r.trails || []);
      setSelectedTrail(null);
    } catch (e) { setErr(e.message); }
  }

  async function loadConnectors() {
    setErr('');
    try {
      const r = await api.get('/admin/connectors');
      const rows = r.connectors || [];
      setConnectors(rows);
      if (rows.length > 0 && !rows.some((c) => c.code === connectorCode)) setConnectorCode(rows[0].code);
    } catch (e) { setErr(e.message); }
  }

  async function refreshAll() {
    await Promise.all([loadIntegrity(), loadReconcile(), loadTrails(), loadConnectors()]);
  }

  useEffect(() => { refreshAll(); }, []);

  async function runRecover() {
    try {
      const r = await api.post('/admin/recover');
      setOut(JSON.stringify(r.summary, null, 2));
      await refreshAll();
    } catch (e) { setErr(e.message); }
  }

  async function mockCallback() {
    try {
      const r = await api.post('/txn/callback/NAPAS', { refId, state });
      setOut(JSON.stringify(r, null, 2));
      await refreshAll();
    } catch (e) { setErr(e.message); }
  }

  async function testConnector() {
    setErr('');
    try {
      const parsedArgs = args.trim() ? JSON.parse(args) : {};
      const r = await api.post('/admin/connector/test', { connectorCode, operation, args: parsedArgs });
      setOut(JSON.stringify(r.result, null, 2));
    } catch (e) {
      setErr(e.message || 'JSON args không hợp lệ');
    }
  }

  function chooseForCallback(t) {
    setRefId(t.transRefId);
    setState('SUCCESS');
    setTab('tools');
    setOut(`Đã chọn giao dịch ${t.transRefId} cho callback NAPAS.\nChọn trạng thái đối tác rồi bấm "Gửi callback".`);
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
    setErr('');
    try {
      await api.post('/admin/connectors/toggle', { code, enabled });
      await loadConnectors();
    } catch (e) { setErr(e.message); }
  }

  async function deleteConnector(code) {
    setErr('');
    try {
      await api.post('/admin/connectors/delete', { code });
      await loadConnectors();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionHeader
          eyebrow="Admin"
          title="Vận hành hệ thống"
        />
        <div className="tabs">
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        <Alert tone="error">{err}</Alert>
      </section>

      {tab === 'overview' && (
        <section className="panel">
          <SectionHeader title="Tổng quan" action={<Button variant="secondary" onClick={runRecover}>Recover</Button>} />
          <div className="metric-grid">
            <Metric label="Tổng số dư" value={formatMoney(report?.totalBalance || 0)} />
            <Metric label="Số ví" value={report?.pocketCount || 0} />
            <Metric label="Checksum" value={report?.checksumOk ? 'Khớp' : 'Cần kiểm tra'} />
            <Metric label="Đang xử lý" value={processingCount} />
            <Metric label="Kết nối đang bật" value={connectors.filter((c) => c.enabled).length} />
            <Metric label="Tiền treo" value={formatMoney(reconcile?.suspenseBalance || 0)} />
          </div>
        </section>
      )}

      {tab === 'transactions' && (
        <section className="panel">
          <SectionHeader title="Giao dịch" action={<Button onClick={() => loadTrails()}>Tải nhật ký</Button>} />
          <div className="grid four">
            <Field label="Trạng thái">
              <select value={trailStatus} onChange={(e) => { setTrailStatus(e.target.value); loadTrails(e.target.value); }}>
                <option value="processing">Đang xử lý</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="done">Thành công</option>
                <option value="failed">Thất bại</option>
                <option value="reversed">Đã hoàn tiền</option>
                <option value="expired">Hết hạn</option>
                <option value="all">Tất cả</option>
              </select>
            </Field>
            <Field label="Dịch vụ"><input placeholder="CARD_TOPUP" value={trailService} onChange={(e) => setTrailService(e.target.value.toUpperCase())} /></Field>
            <Field label="Đối tác"><input placeholder="NAPAS" value={trailConnector} onChange={(e) => setTrailConnector(e.target.value.toUpperCase())} /></Field>
            <Field label="Mã giao dịch"><input value={trailRef} onChange={(e) => setTrailRef(e.target.value)} /></Field>
          </div>
          <DataTable
            rows={trails}
            emptyText="Không có giao dịch phù hợp"
            columns={[
              { key: 'serviceName', label: 'Dịch vụ', render: (t) => t.serviceName || t.serviceCode },
              { key: 'status', label: 'Trạng thái', render: (t) => <StatusBadge status={t.status}>{statusLabel(t.status)}</StatusBadge> },
              { key: 'amount', label: 'Số tiền', render: (t) => formatMoney(t.amount, '') },
              { key: 'partnerRef', label: 'Đối tác', render: (t) => t.partnerRef || t.partnerState || '-' },
              { key: 'transRefId', label: 'Mã giao dịch', render: (t) => <code>{t.transRefId}</code> },
              {
                key: 'actions',
                label: '',
                render: (t) => (
                  <div className="row-actions">
                    <Button variant="secondary" onClick={() => chooseForCallback(t)}>Chọn</Button>
                    <Button variant="ghost" onClick={() => setSelectedTrail(t)}>Chi tiết</Button>
                  </div>
                ),
              },
            ]}
          />
          {selectedTrail && <pre className="output-box">{JSON.stringify(selectedTrail, null, 2)}</pre>}
        </section>
      )}

      {tab === 'reconcile' && (
        <section className="panel">
          <SectionHeader title="Đối soát NAPAS" action={<Button onClick={loadReconcile}>Chạy đối soát</Button>} />
          <Field label="Số dư sao kê đối tác">
            <input placeholder="Để trống nếu chưa có sao kê" type="number" value={partnerBalance} onChange={(e) => setPartnerBalance(e.target.value)} />
          </Field>
          <div className="metric-grid">
            <Metric label="Trạng thái" value={reconcile?.matched ? 'Khớp' : 'Lệch'} />
            <Metric label="Sổ ví" value={formatMoney(reconcile?.ledgerBalance || 0)} />
            <Metric label="Đối tác" value={formatMoney(reconcile?.partnerBalance || 0)} />
            <Metric label="Chênh lệch" value={formatMoney(reconcile?.difference || 0)} />
            <Metric label="Tiền treo" value={formatMoney(reconcile?.suspenseBalance || 0)} />
            <Metric label="Cần chú ý" value={reconcile?.unsettledCount || 0} />
          </div>
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

      {tab === 'tools' && (
        <section className="panel">
          <SectionHeader title="Công cụ kỹ thuật" />
          <div className="grid two">
            <Field label="Kết nối">
              <select value={connectorCode} onChange={(e) => setConnectorCode(e.target.value)}>
                {connectors.length > 0 ? connectors.map((c) => <option key={c.code}>{c.code}</option>) : <><option>VCB</option><option>VISA</option><option>NAPAS</option></>}
              </select>
            </Field>
            <Field label="Thao tác hỗ trợ">
              <input placeholder="sendOtp" value={operation} onChange={(e) => setOperation(e.target.value)} />
            </Field>
          </div>
          <Field label="Tham số JSON">
            <textarea rows="4" value={args} onChange={(e) => setArgs(e.target.value)} />
          </Field>
          <Button onClick={testConnector}>Gọi thử kết nối</Button>

          <div className="tool-block">
            <h3>Callback NAPAS</h3>
            <div className="grid two">
              <Field label="Mã giao dịch"><input value={refId} onChange={(e) => setRefId(e.target.value)} /></Field>
              <Field label="Trạng thái đối tác"><select value={state} onChange={(e) => setState(e.target.value)}><option>SUCCESS</option><option>FAILED</option></select></Field>
            </div>
            <Button onClick={mockCallback}>Gửi callback</Button>
          </div>
          {out && <pre className="output-box">{out}</pre>}
        </section>
      )}
    </div>
  );
}
