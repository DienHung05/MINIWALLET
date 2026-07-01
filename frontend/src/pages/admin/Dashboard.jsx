import { useEffect, useState } from 'react';
import api from '../../api/client.js';

export default function AdminDashboard() {
  const [report, setReport] = useState(null);
  const [out, setOut] = useState(''); const [err, setErr] = useState('');
  const [refId, setRefId] = useState(''); const [state, setState] = useState('SUCCESS');

  async function loadIntegrity() {
    setErr('');
    try { const r = await api.get('/admin/integrity'); setReport(r.report); } catch (e) { setErr(e.message); }
  }
  useEffect(() => { loadIntegrity(); }, []);

  async function runRecover() {
    try { const r = await api.post('/admin/recover'); setOut('Recover: ' + JSON.stringify(r.summary)); loadIntegrity(); }
    catch (e) { setErr(e.message); }
  }
  async function mockCallback() {
    try { const r = await api.post(`/txn/callback/NAPAS`, { refId, state }); setOut('Callback: ' + JSON.stringify(r)); loadIntegrity(); }
    catch (e) { setErr(e.message); }
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

      <h3 style={{ marginTop: 20 }}>Mock callback NAPAS (cho giao dịch async)</h3>
      <input placeholder="transRefId (đang processing)" value={refId} onChange={(e) => setRefId(e.target.value)} />
      <select value={state} onChange={(e) => setState(e.target.value)}>
        <option>SUCCESS</option><option>FAILED</option>
      </select>
      <button onClick={mockCallback}>Gửi callback</button>

      {out && <pre style={{ background: '#f1f5f9', padding: 10, borderRadius: 6, marginTop: 12 }}>{out}</pre>}
    </div>
  );
}