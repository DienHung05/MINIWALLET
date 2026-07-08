import { useEffect, useState } from 'react';
import api from '../../api/client.js';

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

function statusText(status) {
  const map = {
    processing: 'Đang xử lý',
    pending: 'Chờ xác nhận',
    done: 'Thành công',
    failed: 'Thất bại',
    reversed: 'Đã hoàn tiền',
    expired: 'Hết hạn',
    all: 'Tất cả',
  };
  return map[status] || status;
}

export default function AdminDashboard() {
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

  useEffect(() => { loadIntegrity(); loadReconcile(); loadTrails(); loadConnectors(); }, []);

  async function runRecover() {
    try {
      const r = await api.post('/admin/recover');
      setOut('Recover: ' + JSON.stringify(r.summary, null, 2));
      loadIntegrity();
      loadReconcile();
      loadTrails();
    } catch (e) { setErr(e.message); }
  }

  async function mockCallback() {
    try {
      const r = await api.post('/txn/callback/NAPAS', { refId, state });
      setOut('Callback: ' + JSON.stringify(r, null, 2));
      loadIntegrity();
      loadReconcile();
      loadTrails();
    } catch (e) { setErr(e.message); }
  }

  async function testConnector() {
    setErr('');
    try {
      const parsedArgs = args.trim() ? JSON.parse(args) : {};
      const r = await api.post('/admin/connector/test', { connectorCode, operation, args: parsedArgs });
      setOut('Kết nối đối tác: ' + JSON.stringify(r.result, null, 2));
    } catch (e) {
      setErr(e.message || 'JSON args không hợp lệ');
    }
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
    <div className="stack">
      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Vận hành hệ thống</h2>
          </div>
          <button onClick={() => { loadIntegrity(); loadReconcile(); loadTrails(); loadConnectors(); }}>Làm mới tất cả</button>
        </div>
        {err && <p className="alert error">{err}</p>}
      </section>

      <section className="card">
        <div className="section-header">
          <h3>Toàn vẹn tiền tệ</h3>
          <button onClick={runRecover}>Chạy recover</button>
        </div>
        {report && (
          <div className="metric-grid">
            <div><span>Tổng số dư</span><b>{report.totalBalance.toLocaleString('vi-VN')}</b></div>
            <div><span>Số ví</span><b>{report.pocketCount}</b></div>
            <div><span>Checksum</span><b>{report.checksumOk ? 'Khớp' : 'Lệch'}</b></div>
            <div><span>Nostro</span><b>{JSON.stringify(report.nostro)}</b></div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <h3>Đối soát NAPAS</h3>
          <button onClick={loadReconcile}>Chạy đối soát</button>
        </div>
        <label>
          Số dư sao kê đối tác
          <input placeholder="Để trống = mock khớp sổ" type="number" value={partnerBalance} onChange={(e) => setPartnerBalance(e.target.value)} />
        </label>
        {reconcile && (
          <div className="metric-grid">
            <div><span>Trạng thái</span><b>{reconcile.matched ? 'Khớp' : 'Lệch'}</b></div>
            <div><span>Sổ ví</span><b>{Number(reconcile.ledgerBalance || 0).toLocaleString('vi-VN')}</b></div>
            <div><span>Đối tác</span><b>{Number(reconcile.partnerBalance || 0).toLocaleString('vi-VN')}</b></div>
            <div><span>Chênh lệch</span><b>{Number(reconcile.difference || 0).toLocaleString('vi-VN')}</b></div>
            <div><span>Tiền treo</span><b>{Number(reconcile.suspenseBalance || 0).toLocaleString('vi-VN')}</b></div>
            <div><span>Giao dịch cần chú ý</span><b>{reconcile.unsettledCount}</b></div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <h3>Kết nối đối tác</h3>
          <button onClick={() => setConnectorForm(EMPTY_CONNECTOR)}>Tạo mới</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Loại</th><th>Base URL</th><th>Thao tác hỗ trợ</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.kind}</td>
                  <td><code>{c.baseUrl}</code></td>
                  <td>{(c.operations || []).join(', ')}</td>
                  <td><span className={`badge ${c.enabled ? 'active' : 'failed'}`}>{c.enabled ? 'Đang bật' : 'Đang tắt'}</span></td>
                  <td className="row-actions">
                    <button type="button" onClick={() => editConnector(c)}>Sửa</button>
                    <button type="button" className="secondary-button" onClick={() => toggleConnector(c.code, !c.enabled)}>{c.enabled ? 'Tắt' : 'Bật'}</button>
                    <button type="button" className="danger-button" onClick={() => deleteConnector(c.code)}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="connector-form" onSubmit={saveConnector}>
          <div className="grid two">
            <label>Mã kết nối<input value={connectorForm.code} onChange={(e) => setConnectorForm((f) => ({ ...f, code: e.target.value }))} /></label>
            <label>Tên<input value={connectorForm.name} onChange={(e) => setConnectorForm((f) => ({ ...f, name: e.target.value }))} /></label>
            <label>Loại<input value={connectorForm.kind} onChange={(e) => setConnectorForm((f) => ({ ...f, kind: e.target.value }))} /></label>
            <label>Base URL<input value={connectorForm.baseUrl} onChange={(e) => setConnectorForm((f) => ({ ...f, baseUrl: e.target.value }))} /></label>
            <label>Timeout ms<input type="number" value={connectorForm.timeoutMs} onChange={(e) => setConnectorForm((f) => ({ ...f, timeoutMs: e.target.value }))} /></label>
            <label>Số lần thử lại<input type="number" value={connectorForm.maxRetries} onChange={(e) => setConnectorForm((f) => ({ ...f, maxRetries: e.target.value }))} /></label>
          </div>
          <label className="checkbox-line">
            <input type="checkbox" checked={connectorForm.enabled} onChange={(e) => setConnectorForm((f) => ({ ...f, enabled: e.target.checked }))} />
            Đang bật
          </label>
          <label>Operations JSON<textarea rows="7" value={connectorForm.operations} onChange={(e) => setConnectorForm((f) => ({ ...f, operations: e.target.value }))} /></label>
          <button>Lưu kết nối</button>
        </form>
      </section>

      <section className="card">
        <h3>Công cụ kỹ thuật</h3>
        <div className="grid two">
          <label>
            Kết nối
            <select value={connectorCode} onChange={(e) => setConnectorCode(e.target.value)}>
              {connectors.length > 0 ? connectors.map((c) => <option key={c.code}>{c.code}</option>) : <><option>VCB</option><option>VISA</option><option>NAPAS</option></>}
            </select>
          </label>
          <label>
            Thao tác hỗ trợ
            <input placeholder="sendOtp" value={operation} onChange={(e) => setOperation(e.target.value)} />
          </label>
        </div>
        <label>Tham số JSON<textarea rows="4" value={args} onChange={(e) => setArgs(e.target.value)} /></label>
        <button onClick={testConnector}>Gọi thử kết nối</button>

        <h4>Callback NAPAS</h4>
        <div className="grid two">
          <label>Mã giao dịch<input placeholder="transRefId đang xử lý" value={refId} onChange={(e) => setRefId(e.target.value)} /></label>
          <label>Trạng thái đối tác<select value={state} onChange={(e) => setState(e.target.value)}><option>SUCCESS</option><option>FAILED</option></select></label>
        </div>
        <button onClick={mockCallback}>Gửi callback</button>
      </section>

      <section className="card">
        <div className="section-header">
          <h3>Nhật ký giao dịch</h3>
          <button onClick={() => loadTrails()}>Tải nhật ký</button>
        </div>
        <div className="grid four">
          <label>
            Trạng thái
            <select value={trailStatus} onChange={(e) => { setTrailStatus(e.target.value); loadTrails(e.target.value); }}>
              <option value="processing">Đang xử lý</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="done">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="reversed">Đã hoàn tiền</option>
              <option value="expired">Hết hạn</option>
              <option value="all">Tất cả</option>
            </select>
          </label>
          <label>Dịch vụ<input placeholder="CARD_TOPUP" value={trailService} onChange={(e) => setTrailService(e.target.value.toUpperCase())} /></label>
          <label>Đối tác<input placeholder="NAPAS" value={trailConnector} onChange={(e) => setTrailConnector(e.target.value.toUpperCase())} /></label>
          <label>Mã giao dịch<input value={trailRef} onChange={(e) => setTrailRef(e.target.value)} /></label>
        </div>
        {trails.length === 0 ? (
          <p className="muted">Không có nhật ký phù hợp.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Dịch vụ</th><th>Trạng thái</th><th>Số tiền</th><th>Partner</th><th>Mã giao dịch</th><th></th></tr></thead>
              <tbody>
                {trails.map((t) => (
                  <tr key={t.transRefId}>
                    <td>{t.serviceName || t.serviceCode}</td>
                    <td><span className={`badge ${t.status}`}>{statusText(t.status)}</span></td>
                    <td>{Number(t.amount || 0).toLocaleString('vi-VN')}</td>
                    <td>{t.partnerRef || t.partnerState || '-'}</td>
                    <td><code>{t.transRefId}</code></td>
                    <td className="row-actions">
                      <button type="button" onClick={() => setRefId(t.transRefId)}>Chọn</button>
                      <button type="button" className="secondary-button" onClick={() => setSelectedTrail(t)}>Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selectedTrail && (
          <pre className="output-box">{JSON.stringify(selectedTrail, null, 2)}</pre>
        )}
      </section>

      {out && <pre className="output-box">{out}</pre>}
    </div>
  );
}
