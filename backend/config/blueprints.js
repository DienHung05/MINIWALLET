/**
 * Tắt blueprints tự động.
 * Lý do: ta muốn tự khai báo route + action rõ ràng (config/routes.js),
 * không để Sails tự sinh CRUD API ngầm (dễ rò rỉ, khó kiểm soát phân quyền).
 */
module.exports.blueprints = {
  actions: false,
  rest: false,
  shortcuts: false,
};
