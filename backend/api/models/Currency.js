/**
 * Currency.js — MẪU MODEL HOÀN CHỈNH (tham khảo để viết các model khác ở Ngày 2).
 * Một loại tiền tệ. Sản phẩm này chỉ dùng 1 loại (VND).
 */
module.exports = {
  attributes: {
    code: { type: 'string', required: true, unique: true }, // 'VND'
    name: { type: 'string', required: true }, // 'Vietnam Dong'
    decimal: { type: 'number', defaultsTo: 0 }, // số chữ số thập phân
  },
};
