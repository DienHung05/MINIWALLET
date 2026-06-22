/**
 * Datastores — kết nối database.
 * Dùng MongoDB ở chế độ replica set (xem docker-compose.yml) để bật transaction.
 */
module.exports.datastores = {
  default: {
    adapter: 'sails-mongo',
    url:
      process.env.DATABASE_URL ||
      'mongodb://127.0.0.1:27017/miniwallet?replicaSet=rs0',
  },
};
