import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import { Alert, Button, EmptyState, Field, SectionHeader } from '../../components/ui.jsx';
import { formatMoney } from '../../utils/format.js';

const SERVICES = {
  P2P: {
    label: 'Chuyển tiền nội bộ',
    group: 'Chuyển tiền',
    fields: [
      { name: 'receiverPhone', label: 'Số điện thoại người nhận' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
  INTERBANK_OUT: {
    label: 'Chuyển liên ngân hàng',
    group: 'Chuyển tiền',
    fields: [
      { name: 'destBank', label: 'Mã ngân hàng' },
      { name: 'destAccount', label: 'Số tài khoản' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
  LINK_BANK: {
    label: 'Liên kết ngân hàng',
    group: 'Nguồn tiền',
    fields: [
      { name: 'bankCode', label: 'Mã ngân hàng' },
      { name: 'accountNo', label: 'Số tài khoản' },
    ],
  },
  LINK_CARD: {
    label: 'Liên kết thẻ',
    group: 'Nguồn tiền',
    fields: [
      { name: 'cardNo', label: 'Số thẻ' },
      { name: 'expiry', label: 'Ngày hết hạn', placeholder: 'MM/YY' },
      { name: 'holderName', label: 'Tên in trên thẻ' },
    ],
  },
  CARD_TOPUP: {
    label: 'Nạp tiền từ thẻ',
    group: 'Nạp tiền',
    fields: [
      { name: 'instrumentId', label: 'Thẻ đã liên kết', type: 'cardInstrument' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
};

function authPlaceholder(method) {
  if (method === 'PIN') return 'Nhập mật khẩu/PIN xác nhận';
  if (method === 'OTP') return 'Nhập mã OTP';
  if (method === '3DS') return 'Nhập mã xác thực thẻ';
  return 'Nhập mã xác nhận';
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
        <Field key={field.name} label={field.label}>
          <select value={params[field.name] || ''} onChange={(e) => setValue(field.name, e.target.value)}>
            <option value="">Chọn thẻ</option>
            {cardInstruments.map((x) => (
              <option key={x.id} value={x.id}>
                {x.maskedNumber} · {x.holderName || 'Thẻ đã liên kết'}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    return (
      <Field key={field.name} label={field.label}>
        <input
          placeholder={field.placeholder || field.label}
          type={field.type || 'text'}
          value={params[field.name] || ''}
          onChange={(e) => setValue(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
        />
      </Field>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionHeader
          eyebrow="Giao dịch"
          title="Tạo giao dịch mới"
          action={<Link to="/app">Về ví của tôi</Link>}
        />

        <div className="stepper">
          <span className={step === 'form' ? 'active' : ''}>Nhập thông tin</span>
          <span className={step === 'confirm' ? 'active' : ''}>Xác nhận</span>
          <span className={step === 'result' ? 'active' : ''}>Hoàn tất</span>
        </div>

        {step === 'form' && (
          <form onSubmit={doRequest} className="form-grid">
            <Field label="Dịch vụ">
              <select value={serviceCode} onChange={(e) => switchService(e.target.value)}>
                {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v.group} · {v.label}</option>)}
              </select>
            </Field>
            {SERVICES[serviceCode].fields.map(renderField)}
            {serviceCode === 'CARD_TOPUP' && cardInstruments.length === 0 && (
              <EmptyState
                title="Bạn chưa có thẻ liên kết"
                action={<Button type="button" onClick={() => switchService('LINK_CARD')}>Liên kết thẻ</Button>}
              />
            )}
            <Button className="form-submit" disabled={busy}>{busy ? 'Đang xử lý...' : 'Tiếp tục'}</Button>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={doVerify} className="form-grid">
            <div className="receipt-preview">
              <span>Mã giao dịch</span>
              <code>{preview?.transRefId}</code>
              {preview.amount != null && (
                <p>
                  Số tiền <b>{formatMoney(preview.amount, '')}</b> · Phí <b>{formatMoney(preview.fee, '')}</b> · Tổng{' '}
                  <b>{formatMoney(preview.total, '')}</b>
                </p>
              )}
            </div>
            <Field label={`Xác nhận ${authMethod}`}>
              <input placeholder={authPlaceholder(authMethod)} type="password" value={cred} onChange={(e) => setCred(e.target.value)} />
            </Field>
            <div className="button-row">
              <Button disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác nhận'}</Button>
              <Button type="button" variant="secondary" onClick={reset}>Huỷ</Button>
            </div>
          </form>
        )}

        {step === 'result' && (
          <div className="result-panel">
            {result.status === 'done' && <Alert tone="success">Giao dịch thành công {result.transaction ? `· ${result.transaction.code}` : ''}</Alert>}
            {result.status === 'processing' && <Alert>Giao dịch đang xử lý, hệ thống sẽ cập nhật khi đối tác phản hồi.</Alert>}
            {result.effects?.length > 0 && <Alert tone="success">Đã liên kết nguồn tiền {result.effects[0].masked}</Alert>}
          <div className="button-row">
            <Button onClick={reset}>Giao dịch khác</Button>
              <Link className="btn btn-secondary" to="/app">Về ví của tôi</Link>
          </div>
          </div>
        )}

        <Alert tone="error">{err}</Alert>
      </section>
    </div>
  );
}
