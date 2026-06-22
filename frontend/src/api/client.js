import axios from 'axios';

/**
 * Client gọi API — gói xử lý "phong bì" { err, message, ...data } ở MỘT chỗ.
 * Quy ước: HTTP luôn 200; err === 200 là OK, khác đi là lỗi nghiệp vụ.
 *
 * Dùng: const res = await api.get('/health');  // res = { err, message, data }
 */
const api = axios.create({ baseURL: '/api' });

// Tự gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bóc phong bì: err !== 200 -> ném lỗi có .message để UI hiển thị
api.interceptors.response.use(
  (response) => {
    const body = response.data || {};
    if (body.err !== undefined && body.err !== 200) {
      const error = new Error(body.message || 'Có lỗi xảy ra');
      error.err = body.err;
      error.body = body;
      return Promise.reject(error);
    }
    return body; // trả thẳng phong bì cho gọn
  },
  (err) => {
    // Lỗi mạng / HTTP thật sự (không phải lỗi nghiệp vụ)
    return Promise.reject(new Error('Không kết nối được máy chủ. Đã chạy backend chưa?'));
  }
);

export default api;
