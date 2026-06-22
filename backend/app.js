/**
 * app.js — bộ khởi chạy Sails khi chạy `node app.js` (production).
 * Khi phát triển, dùng `npm run dev` (= `sails lift`).
 */
process.chdir(__dirname);

var sails;
var rc;
try {
  sails = require('sails');
  rc = require('sails/accessible/rc');
} catch (err) {
  console.error('Không tìm thấy package `sails` (hoặc `sails/accessible/rc`).');
  console.error('Hãy chạy `npm install` trong thư mục backend trước.');
  console.error('Chi tiết lỗi:');
  console.error(err.stack);
  return;
}

sails.lift(rc());
