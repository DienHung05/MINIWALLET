module.exports = function ok(data) {
  return this.res.json(Object.assign({ err: 200, message: 'ok' }, data || {}));
};