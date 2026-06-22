/**
 * bootstrap.js — chạy MỘT LẦN mỗi khi `sails lift`, trước khi nhận request.
 * Dùng để seed dữ liệu khởi tạo. Luôn viết theo kiểu IDEMPOTENT
 * (kiểm tra tồn tại trước khi tạo) để chạy lại nhiều lần không bị trùng.
 */
module.exports.bootstrap = async function () {
  // TODO Ngày 2+: seed Currency mặc định khi đã có model Currency:
  //
  // const count = await Currency.count();
  // if (count === 0) {
  //   await Currency.create({ code: 'VND', name: 'Vietnam Dong', decimal: 0 });
  //   sails.log.info('Seeded Currency VND');
  // }
  //
  // TODO Ngày 3+: seed 1 officer mặc định để đăng nhập admin lần đầu.
  // TODO Ngày 4+: seed ví System & Bank (hoặc tạo qua UI).

  return;
};
