import { useEffect, useState } from 'react';
import api from '../../api/client.js';

export default function AdminDashboard() {
  const [report, setReport] = useState(null);
  const [out, setOut] = useState(''); const [err, setErr] = useState('');
  const [refId, setRefId] = useState(''); const [state, setState] = useState('SUCCESS');
  const [trails, setTrails] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [trailStatus, setTrailStatus] = useState('processing');
  const [connectorCode, setConnectorCode] = useState('VCB');
  const [operation, setOperation] = useState('sendOtp');
  const [args, setArgs] = useState('{"account":"0123456789"}');

  async function loadIntegrity() {
    setErr('');
    try { const r = await api.get('/admin/integrity'); setReport(r.report); } catch (e) { setErr(e.message); }
  }
  async function loadTrails(status = trailStatus) {
    setErr('');
    try { const r = await api.get(`/admin/trails?status=${encodeURIComponent(status)}&limit=30`); setTrails(r.trails || []); }
    catch (e) { setErr(e.message); }
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
  useEffect(() => { loadIntegrity(); loadTrails(); loadConnectors(); }, []);

  async function runRecover() {
    try { const r = await api.post('/admin/recover'); setOut('Recover: ' + JSON.stringify(r.summary)); loadIntegrity(); loadTrails(); }
    catch (e) { setErr(e.message); }
  }
  async function mockCallback() {
    try { const r = await api.post(`/txn/callback/NAPAS`, { refId, state }); setOut('Callback: ' + JSON.stringify(r)); loadIntegrity(); loadTrails(); }
    catch (e) { setErr(e.message); }
  }
  async function testConnector() {
    setErr('');
    try {
      const parsedArgs = args.trim() ? JSON.parse(args) : {};
      const r = await api.post('/admin/connector/test', { connectorCode, operation, args: parsedArgs });
      setOut('Connector: ' + JSON.stringify(r.result, null, 2));
    } catch (e) {
      setErr(e.message || 'JSON args không hợp lệ');
    }
  }

  return (
    <div className="card">
      <h2>Officer · Vận hành</h2>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}

      <h3>Toàn vẹn tiền tệ</h3>
      {report && (
        <p>
          Tổng số dư: <b>{report.totalBalance.toLocaleString('vi-VN')}</b> · Số ví: {report.pocketCount} ·{' '}
          Checksum: {report.checksumOk ? '✅ khớp' : '❌ LỆCH'} · Nostro: {JSON.stringify(report.nostro)}
        </p>
      )}
      <button onClick={loadIntegrity}>Làm mới</button>{' '}
      <button onClick={runRecover}>Chạy Janitor (recover)</button>

      <h3 style={{ marginTop: 20 }}>Test connector</h3>
      {connectors.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Loại</th><th>Base URL</th><th>Thao tác hỗ trợ</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.kind}</td>
                  <td><code>{c.baseUrl}</code></td>
                  <td>{(c.operations || []).join(', ')}</td>
                  <td><span className={`badge ${c.enabled ? 'active' : 'failed'}`}>{c.enabled ? 'enabled' : 'disabled'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid two">
        <select value={connectorCode} onChange={(e) => setConnectorCode(e.target.value)}>
          {connectors.length > 0 ? connectors.map((c) => <option key={c.code}>{c.code}</option>) : <><option>VCB</option><option>VISA</option><option>NAPAS</option></>}
        </select>
        <input placeholder="Tên thao tác" value={operation} onChange={(e) => setOperation(e.target.value)} />
      </div>
      <textarea rows="4" value={args} onChange={(e) => setArgs(e.target.value)} />
      <button onClick={testConnector}>Gọi thử thao tác</button>

      <h3 style={{ marginTop: 20 }}>Mock callback NAPAS (cho giao dịch async)</h3>
      <input placeholder="transRefId (đang processing)" value={refId} onChange={(e) => setRefId(e.target.value)} />
      <select value={state} onChange={(e) => setState(e.target.value)}>
        <option>SUCCESS</option><option>FAILED</option>
      </select>
      <button onClick={mockCallback}>Gửi callback</button>

      <h3 style={{ marginTop: 20 }}>Trail vận hành</h3>
      <div className="inline-actions">
        <select value={trailStatus} onChange={(e) => { setTrailStatus(e.target.value); loadTrails(e.target.value); }}>
          <option value="processing">processing</option>
          <option value="pending">pending</option>
          <option value="done">done</option>
          <option value="failed">failed</option>
          <option value="reversed">reversed</option>
          <option value="expired">expired</option>
          <option value="all">all</option>
        </select>
        <button onClick={() => loadTrails()}>Tải trail</button>
      </div>
      {trails.length === 0 ? (
        <p className="muted">Không có trail phù hợp.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Dịch vụ</th><th>Trạng thái</th><th>Số tiền</th><th>Partner</th><th>Ref</th><th></th></tr></thead>
            <tbody>
              {trails.map((t) => (
                <tr key={t.transRefId}>
                  <td>{t.serviceCode}</td>
                  <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                  <td>{Number(t.amount || 0).toLocaleString('vi-VN')}</td>
                  <td>{t.partnerRef || t.partnerState || '-'}</td>
                  <td><code>{t.transRefId}</code></td>
                  <td>
                    <button type="button" onClick={() => setRefId(t.transRefId)}>Chọn</button>{' '}
                    <button type="button" onClick={() => setSelectedTrail(t)}>Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTrail && (
        <>
          <h3 style={{ marginTop: 20 }}>Chi tiết trail</h3>
          <pre style={{ background: '#f1f5f9', padding: 10, borderRadius: 6, marginTop: 12 }}>
            {JSON.stringify(selectedTrail, null, 2)}
          </pre>
        </>
      )}

      {out && <pre style={{ background: '#f1f5f9', padding: 10, borderRadius: 6, marginTop: 12 }}>{out}</pre>}
    </div>
  );
}
