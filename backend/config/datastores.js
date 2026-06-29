/**
 * Datastores — kết nối database.
 * MongoDB chạy chế độ replica set (xem docker-compose.yml) để bật transaction.
 * Chuỗi kết nối để TRỐNG tham số replicaSet: nối trực tiếp tới node, tránh bước
 * "replica set discovery" (hay timeout khi chạy localhost qua Docker).
 * Mongod vẫn là thành viên rs0 nên multi-document transaction (S5) vẫn dùng được.
 */
module.exports.datastores = {
  default: {
    adapter: 'sails-mongo',
    url:
      process.env.DATABASE_URL ||
      'mongodb://127.0.0.1:27017/miniwallet',
  },
};
