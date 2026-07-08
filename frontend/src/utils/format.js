export function formatMoney(value, currency = 'VND') {
  const amount = Number(value || 0).toLocaleString('vi-VN');
  return currency ? `${amount} ${currency}` : amount;
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}

export function serviceLabel(code) {
  const map = {
    P2P: 'Chuyển tiền nội bộ',
    INTERBANK_OUT: 'Chuyển liên ngân hàng',
    LINK_BANK: 'Liên kết ngân hàng',
    LINK_CARD: 'Liên kết thẻ',
    CARD_TOPUP: 'Nạp tiền từ thẻ',
  };
  return map[code] || code || '-';
}

export function statusLabel(status) {
  const map = {
    active: 'Đang dùng',
    disabled: 'Đã tắt',
    pending: 'Chờ xác nhận',
    processing: 'Đang xử lý',
    done: 'Thành công',
    failed: 'Thất bại',
    reversed: 'Đã hoàn tiền',
    expired: 'Hết hạn',
    all: 'Tất cả',
  };
  return map[status] || status || '-';
}

export function sourceTypeLabel(type) {
  const map = {
    card: 'Thẻ',
    bankAccount: 'Tài khoản ngân hàng',
  };
  return map[type] || 'Nguồn tiền';
}
