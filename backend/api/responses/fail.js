module.exports = function fail(err, message, data) {
  return this.res.json(Object.assign({ err: err || 500, message: message || 'error' }, data || {}));
};