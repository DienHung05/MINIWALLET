const engine = require('../../services/engine');

module.exports = async function callback(req, res) {
  try {
    const data = await engine.processCallback(req.params.connector, req.allParams());
    return res.ok(data);
  } catch (e) {
    return res.fail(e.errCode || 500, e.message || 'Lỗi xử lý callback');
  }
};
