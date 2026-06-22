/**
 * GET /api/health  (action standalone)
 * Route công khai để kiểm tra server sống. Trả đúng "phong bì" chuẩn của dự án.
 *
 * Phong bì: { err, message, ...data } — HTTP luôn 200, err === 200 nghĩa là OK.
 */
module.exports = async function health(req, res) {
  return res.json({
    err: 200,
    message: 'ok',
    data: {
      service: 'miniwallet-backend',
      time: new Date().toISOString(),
    },
  });
};
