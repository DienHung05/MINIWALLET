/**
 * Mặc định áp cho MỌI model.
 * - datastore 'default' (MongoDB).
 * - migrate 'safe': Sails KHÔNG tự đổi schema (Mongo không cần). Bạn tự quản lý dữ liệu.
 * - id ánh xạ sang `_id` của Mongo (kiểu string).
 */
module.exports.models = {
  datastore: 'default',
  migrate: 'safe',
  schema: true,
  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true },
    updatedAt: { type: 'number', autoUpdatedAt: true },
    id: { type: 'string', columnName: '_id' },
  },
};
