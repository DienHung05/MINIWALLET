import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import { Alert, Button, EmptyState, Field, SectionHeader } from '../../components/ui.jsx';
import { formatMoney } from '../../utils/format.js';

const SERVICES = {
  P2P: {
    label: 'Chuyển nội bộ',
    description: 'Gửi tiền tới số điện thoại trong Mini Wallet.',
    fields: [
      { name: 'receiverPhone', label: 'Số điện thoại người nhận' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
  BILL_PAYMENT: {
    label: 'Thanh toán hoá đơn',
    description: 'Tra cứu số tiền từ nhà cung cấp rồi thanh toán bằng ví.',
    fields: [
      { name: 'billerCode', label: 'Nhà cung cấp', type: 'biller' },
      { name: 'billCode', label: 'Mã hoá đơn', placeholder: 'Ví dụ: EVN001' },
    ],
  },
  INTERBANK_OUT: {
    label: 'Chuyển liên ngân hàng',
    description: 'Chuyển tiền tới tài khoản ngân hàng ngoài hệ thống.',
    fields: [
      { name: 'destBank', label: 'Mã ngân hàng' },
      { name: 'destAccount', label: 'Số tài khoản' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
  LINK_BANK: {
    label: 'Liên kết ngân hàng',
    description: 'Kết nối tài khoản ngân hàng bằng OTP.',
    fields: [
      { name: 'bankCode', label: 'Mã ngân hàng' },
      { name: 'accountNo', label: 'Số tài khoản' },
    ],
  },
  LINK_CARD: {
    label: 'Liên kết thẻ',
    description: 'Thêm thẻ và lưu dưới dạng số đã che.',
    fields: [
      { name: 'cardNo', label: 'Số thẻ' },
      { name: 'expiry', label: 'Ngày hết hạn', placeholder: 'MM/YY' },
      { name: 'holderName', label: 'Tên in trên thẻ' },
    ],
  },
  CARD_TOPUP: {
    label: 'Nạp tiền từ thẻ',
    description: 'Nạp tiền vào ví từ thẻ đã liên kết.',
    fields: [
      { name: 'instrumentId', label: 'Thẻ đã liên kết', type: 'cardInstrument' },
      { name: 'amount', label: 'Số tiền', type: 'number' },
    ],
  },
};

const SERVICE_GROUPS = {
  CORE: {
    eyebrow: 'Giao dịch',
    title: 'Giao dịch chính',
    description: 'Các nghiệp vụ lõi theo Mini Wallet.',
    services: ['P2P', 'BILL_PAYMENT'],
  },
  TRANSFER: {
    eyebrow: 'Mở rộng',
    title: 'Chuyển ngoài hệ thống',
    description: 'Luồng chuyển liên ngân hàng qua đối tác.',
    services: ['INTERBANK_OUT'],
  },
  LINK_SOURCE: {
    eyebrow: 'Nguồn tiền',
    title: 'Liên kết nguồn tiền',
    description: 'Chỉ gồm liên kết ngân hàng và liên kết thẻ.',
    services: ['LINK_BANK', 'LINK_CARD'],
  },
  TOPUP: {
    eyebrow: 'Nạp tiền',
    title: 'Nạp tiền từ thẻ',
    description: 'Luồng nạp tiền được tách riêng khỏi chuyển tiền và liên kết.',
    services: ['CARD_TOPUP'],
  },
};

const SERVICE_GROUP_ORDER = ['CORE', 'TRANSFER', 'LINK_SOURCE', 'TOPUP'];

function groupForService(serviceCode) {
  return SERVICE_GROUP_ORDER.find((key) => SERVICE_GROUPS[key].services.includes(serviceCode)) || 'TRANSFER';
}

function authPlaceholder(method) {
  if (method === 'PIN') return 'Nhập PIN xác nhận';
  if (method === 'OTP') return 'Nhập mã OTP';
  if (method === '3DS') return 'Nhập mã xác thực thẻ';
  return 'Nhập mã xác nhận';
}

function authLabel(method) {
  if (method === 'PIN') return 'Xác nhận bằng PIN';
  if (method === 'OTP') return 'Xác nhận OTP';
  if (method === '3DS') return 'Xác thực thẻ';
  return 'Xác nhận giao dịch';
}

function authPayload(method, credential) {
  if (method === 'PIN') return { pin: credential };
  if (method === 'OTP') return { otp: credential };
  if (method === '3DS') return { threeDs: credential };
  return { pin: credential };
}

function normalizeAuthMethod(method) {
  return method || 'NONE';
}

export default function NewTransaction() {
  const [searchParams] = useSearchParams();
  const initialService = SERVICES[searchParams.get('service')] ? searchParams.get('service') : 'P2P';
  const [groupKey, setGroupKey] = useState(groupForService(initialService));
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
  const [billers, setBillers] = useState([]);

  const cardInstruments = useMemo(
    () => instruments.filter((x) => x.type === 'card' && x.status === 'active'),
    [instruments]
  );

  useEffect(() => {
    api.get('/customer/instruments')
      .then((res) => setInstruments(res.instruments || []))
      .catch(() => setInstruments([]));
    api.get('/customer/billers')
      .then((res) => setBillers(res.billers || []))
      .catch(() => setBillers([]));
  }, []);

  function setValue(k, v) {
    setParams((p) => ({ ...p, [k]: v }));
  }

  function switchService(next) {
    setServiceCode(next);
    setGroupKey(groupForService(next));
    setParams({});
    setErr('');
  }

  function switchGroup(nextGroup) {
    const nextService = SERVICE_GROUPS[nextGroup].services[0];
    setGroupKey(nextGroup);
    setServiceCode(nextService);
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
      setAuthMethod(normalizeAuthMethod(cf.authMethod));
      setStep('confirm');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const activeGroup = SERVICE_GROUPS[groupKey];

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

    if (field.type === 'biller') {
      return (
        <Field key={field.name} label={field.label}>
          <select value={params[field.name] || ''} onChange={(e) => setValue(field.name, e.target.value)}>
            <option value="">Chọn nhà cung cấp</option>
            {billers.map((x) => (
              <option key={x.code} value={x.code}>{x.name}</option>
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
          eyebrow={activeGroup.eyebrow}
          title={activeGroup.title}
          action={<Link to="/app">Về ví của tôi</Link>}
        />

        <div className="stepper">
          <span className={step === 'form' ? 'active' : ''}>Nhập thông tin</span>
          <span className={step === 'confirm' ? 'active' : ''}>Xác nhận</span>
          <span className={step === 'result' ? 'active' : ''}>Hoàn tất</span>
        </div>

        {step === 'form' && (
          <form onSubmit={doRequest} className="form-grid">
            <div className="service-group-tabs" role="tablist" aria-label="Nhóm thao tác">
              {SERVICE_GROUP_ORDER.map((key) => (
                <button
                  type="button"
                  key={key}
                  className={groupKey === key ? 'active' : ''}
                  onClick={() => switchGroup(key)}
                >
                  {SERVICE_GROUPS[key].title}
                </button>
              ))}
            </div>
            <p className="muted service-group-description">{activeGroup.description}</p>
            {activeGroup.services.length > 1 ? (
              <Field label="Chọn loại thao tác">
                <select value={serviceCode} onChange={(e) => switchService(e.target.value)}>
                  {activeGroup.services.map((code) => (
                    <option key={code} value={code}>{SERVICES[code].label}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <div className="single-service-card">
                <b>{SERVICES[serviceCode].label}</b>
                <span>{SERVICES[serviceCode].description}</span>
              </div>
            )}
            {SERVICES[serviceCode].fields.map(renderField)}
            {serviceCode === 'CARD_TOPUP' && cardInstruments.length === 0 && (
              <EmptyState
                title="Bạn chưa có thẻ liên kết"
                action={<Button type="button" onClick={() => switchService('LINK_CARD')}>Liên kết thẻ</Button>}
              />
            )}
            {serviceCode === 'BILL_PAYMENT' && billers.length === 0 && (
              <EmptyState title="Chưa có nhà cung cấp hoá đơn đang bật" />
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
              {serviceCode === 'BILL_PAYMENT' && (
                <p className="muted">Số tiền được hệ thống tra cứu từ nhà cung cấp, bạn không cần tự nhập.</p>
              )}
            </div>
            <Field label={authLabel(authMethod)}>
              <input placeholder={authPlaceholder(authMethod)} type="password" value={cred} onChange={(e) => setCred(e.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="current-password" inputMode="numeric" required />
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
