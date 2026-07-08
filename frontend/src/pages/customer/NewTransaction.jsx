import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';

const SERVICES = {
  P2P: {
    label: 'Chuyển tiền nội bộ',
    help: 'Gửi tiền đến số điện thoại đã đăng ký Mini Wallet.',
    fields: [
      { name: 'receiverPhone', label: 'Số điện thoại người nhận' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
  INTERBANK_OUT: {
    label: 'Chuyển tiền liên ngân hàng',
    help: 'Chuyển tiền ra tài khoản ngân hàng qua NAPAS.',
    fields: [
      { name: 'destBank', label: 'Mã ngân hàng' },
      { name: 'destAccount', label: 'Số tài khoản' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
  LINK_BANK: {
    label: 'Liên kết ngân hàng',
    help: 'Liên kết tài khoản ngân hàng bằng OTP demo 123456.',
    fields: [
      { name: 'bankCode', label: 'Mã ngân hàng' },
      { name: 'accountNo', label: 'Số tài khoản' },
    ],
  },
  LINK_CARD: {
    label: 'Liên kết thẻ',
    help: 'Liên kết thẻ bằng xác thực 3DS demo 123456.',
    fields: [
      { name: 'cardNo', label: 'Số thẻ' },
      { name: 'expiry', label: 'Ngày hết hạn', placeholder: 'MM/YY' },
      { name: 'holderName', label: 'Tên in trên thẻ' },
    ],
  },
  CARD_TOPUP: {
    label: 'Nạp tiền từ thẻ',
    help: 'Chọn thẻ đã liên kết và nạp tiền vào ví.',
    fields: [
      { name: 'instrumentId', label: 'Thẻ đã liên kết', type: 'cardInstrument' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
};

function authPlaceholder(method) {
  if (method === 'OTP') return 'OTP demo: 123456';
  if (method === '3DS') return 'Mã 3DS demo: 123456';
  if (method === 'PIN') return 'Mật khẩu/PIN xác nhận';
  return 'Mã xác nhận';
}

function authPayload(method, credential) {
  if (method === 'OTP') return { otp: credential };
  if (method === '3DS') return { threeDs: credential };
  if (method === 'PIN') return { pin: credential };
  return { password: credential };
}

export default function NewTransaction() {
  const [searchParams] = useSearchParams();
  const initialService = SERVICES[searchParams.get('service')] ? searchParams.get('service') : 'P2P';
  const [serviceCode, setServiceCode] = useState(initialService);
  const [params, setParams] = useState({});
  const [step, setStep] = useState('form');
  const [preview, setPreview] = useState(null);
  const [authMethod, setAuthMethod] = useState('PIN');
  const [cred, setCred] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [instruments, setInstruments] = useState([]);

  const cardInstruments = useMemo(
    () => instruments.filter((x) => x.type === 'card' && x.status === 'active'),
    [instruments]
  );

  useEffect(() => {
    api.get('/customer/instruments')
      .then((res) => setInstruments(res.instruments || []))
      .catch(() => setInstruments([]));
  }, []);

  function setValue(k, v) {
    setParams((p) => ({ ...p, [k]: v }));
  }

  function switchService(next) {
    setServiceCode(next);
    setParams({});
    setErr('');
  }

  async function doRequest(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (serviceCode === 'CARD_TOPUP' && cardInstruments.length === 0) {
        throw new Error('Bạn cần liên kết thẻ trước khi nạp tiền');
      }
      const pv = await api.post('/txn/request', { serviceCode, parameters: params });
      const cf = await api.post('/txn/confirm', { transRefId: pv.transRefId });
      setPreview(pv);
      setAuthMethod(cf.authMethod);
      setStep('confirm');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doVerify(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api.post('/txn/verify', {
        transRefId: preview.transRefId,
        ...authPayload(authMethod, cred),
      });
      setResult(r);
      setStep('result');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep('form');
    setParams({});
    setCred('');
    setPreview(null);
    setResult(null);
    setErr('');
  }

  function renderField(field) {
    if (field.type === 'cardInstrument') {
      return (
        <label key={field.name}>
          {field.label}
          <select value={params[field.name] || ''} onChange={(e) => setValue(field.name, e.target.value)}>
            <option value="">Chọn thẻ</option>
            {cardInstruments.map((x) => (
              <option key={x.id} value={x.id}>
                {x.maskedNumber} · {x.holderName || 'Thẻ đã liên kết'}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label key={field.name}>
        {field.label}
        <input
          placeholder={field.placeholder || field.label}
          type={field.type || 'text'}
          value={params[field.name] || ''}
          onChange={(e) => setValue(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
        />
      </label>
    );
  }

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Giao dịch</p>
          <h2>Tạo giao dịch mới</h2>
        </div>
        <Link to="/app">Về ví của tôi</Link>
      </div>

      {step === 'form' && (
        <form onSubmit={doRequest}>
          <label>
            Chọn dịch vụ
            <select value={serviceCode} onChange={(e) => switchService(e.target.value)}>
              {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <p className="muted">{SERVICES[serviceCode].help}</p>
          {SERVICES[serviceCode].fields.map(renderField)}
          {serviceCode === 'CARD_TOPUP' && cardInstruments.length === 0 && (
            <p className="alert error">Bạn chưa có thẻ liên kết. Hãy chọn “Liên kết thẻ” trước.</p>
          )}
          <button className="primary-action" disabled={busy}>{busy ? 'Đang xử lý...' : 'Tiếp tục'}</button>
        </form>
      )}

      {step === 'confirm' && (
        <form onSubmit={doVerify}>
          <p className="muted">Mã giao dịch: <code>{preview?.transRefId}</code></p>
          {preview.amount != null && (
            <p>
              Số tiền: <b>{Number(preview.amount).toLocaleString('vi-VN')}</b> · Phí:{' '}
              <b>{Number(preview.fee).toLocaleString('vi-VN')}</b> · Tổng:{' '}
              <b>{Number(preview.total).toLocaleString('vi-VN')}</b>
            </p>
          )}
          <label>
            Xác nhận {authMethod}
            <input placeholder={authPlaceholder(authMethod)} type="password" value={cred} onChange={(e) => setCred(e.target.value)} />
          </label>
          <button disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác nhận'}</button>{' '}
          <button type="button" className="secondary-button" onClick={reset}>Huỷ</button>
        </form>
      )}

      {step === 'result' && (
        <div>
          {result.status === 'done' && <p className="alert success">Thành công {result.transaction ? `· ${result.transaction.code}` : ''}</p>}
          {result.status === 'processing' && <p className="alert">Đang xử lý, chờ cập nhật từ ngân hàng đối tác.</p>}
          {result.effects?.length > 0 && <p className="alert success">Đã liên kết: {result.effects[0].masked}</p>}
          <button onClick={reset}>Giao dịch khác</button>{' '}
          <Link to="/app"><button type="button" className="secondary-button">Về ví của tôi</button></Link>
        </div>
      )}

      {err && <p className="alert error">{err}</p>}
    </div>
  );
}
