import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

const SERVICES = {
    P2P: { label: 'Chuyển tiền P2P', fields: [['receiverPhone', 'SĐT người nhận'], ['amount', 'Số tiền', 'number']] },
    INTERBANK_OUT: { label: 'Chuyển tiền liên ngân hàng', fields: [['destBank', 'Mã ngân hàng'], ['destAccount', 'Số tài khoản'], ['amount', 'Số tiền', 'number']] },
    LINK_BANK: { label: 'Liên kết ngân hàng', fields: [['bankCode', 'Mã ngân hàng'], ['accountNo', 'Số tài khoản']] },
    LINK_CARD: { label: 'Liên kết thẻ', fields: [['cardNumber', 'Số thẻ'], ['holderName', 'Tên chủ thẻ']] },
    CARD_TOPUP: { label: 'Nạp tiền từ thẻ', fields: [['instrumentId', 'Mã nguồn liên kết của thẻ'], ['amount', 'Số tiền', 'number']], hint: 'Mã này lấy ở bảng nguồn liên kết trong trang ví của tôi.' },
};

function credentialPlaceholder(authMethod) {
    if (authMethod === 'OTP') return 'OTP';
    if (authMethod === '3DS') return '3DS';
    if (authMethod === 'NONE') return 'Không cần xác thực';
    return 'Nhập PIN';
}

export default function NewTransaction() {
    const [serviceCode, setServiceCode] = useState('P2P');
    const [params, setParams] = useState({});
    const [step, setStep] = useState('form');
    const [preview, setPreview] = useState(null);
    const [authMethod, setAuthMethod] = useState('PIN');
    const [cred, setCred] = useState('');
    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const set = (k, v) => setParams((p) => ({ ...p, [k]: v }));

    async function doRequest(e) {
        e.preventDefault();
        setErr(''); setBusy(true);
        try {
            const pv = await api.post('/txn/request', { serviceCode, parameters: params });
            const cf = await api.post('/txn/confirm', { transRefId: pv.transRefId });
            setPreview(pv); setAuthMethod(cf.authMethod); setStep('confirm');
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    }

    async function doVerify(e) {
        e.preventDefault();
        setErr(''); setBusy(true);
        try {
            const r = await api.post('/txn/verify', { transRefId: preview.transRefId, pin: cred, otp: cred });
            setResult(r); setStep('result');
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    }

    function reset() { setStep('form'); setParams({}); setCred(''); setPreview(null); setCred(''); setResult(null); setErr(''); }

    return (
        <div className="card">
            <h2>Tạo giao dịch mới</h2>
            {step === 'form' && (
                <form onSubmit={doRequest}>
                    <select value={serviceCode} onChange={(e) => { setServiceCode(e.target.value); setParams({}); }}>
                        {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {SERVICES[serviceCode].fields.map(([name, label, type]) => (
                        <input key={name} placeholder={label} type={type || 'text'} 
                        value={params[name] || ''} onChange={(e) => set(name, type === 'number' ? Number(e.target.value) : e.target.value)} />
                    ))}
                    {SERVICES[serviceCode].hint && <p className="muted">{SERVICES[serviceCode].hint}</p>}
                    <button disabled={busy}>{busy ? '...' : 'Tiếp tục'}</button>
                </form>
            )}

            {step === 'confirm' && (
                <form onSubmit={doVerify}>
                    <p className="muted">Mã giao dịch: {preview?.transRefId}</p>
                    {preview.amount != null && <p>Số tiền: <b>{Number(preview.amount).toLocaleString('vi-VN')}</b> · Phí: <b>{Number(preview.fee).toLocaleString('vi-VN')}</b> · Tổng: <b>{Number(preview.total).toLocaleString('vi-VN')}</b></p>}
                    <input placeholder={credentialPlaceholder(authMethod)} type="password" value={cred} onChange={(e) => setCred(e.target.value)} />
                    <button disabled={busy}>{busy ? 'Đang xử lý...' : `Xác nhận (${authMethod})`}</button>{' '}
                    <button type="button" onClick={reset}>Huỷ</button>
                </form>
            )}

            {step === 'result' && (
                <div>
                {result.status === 'done' && <p style={{ color: 'green' }}>✅ Thành công {result.transaction ? `· ${result.transaction.code}` : ''}</p>}
                {result.status === 'processing' && <p style={{ color: '#b45309' }}>⏳ Đang xử lý (chờ ngân hàng đối tác). Officer sẽ thấy ở mục đối soát.</p>}
                {result.effects?.length > 0 && <p style={{ color: 'green' }}>✅ Đã liên kết: {result.effects[0].masked}</p>}
                <button onClick={reset}>Giao dịch khác</button>{' '}
                <Link to="/app"><button type="button">Về trang chủ</button></Link>
                </div>
            )}

            {err && <p style={{ color: 'crimson' }}>{err}</p>}
        </div>
    );
}
