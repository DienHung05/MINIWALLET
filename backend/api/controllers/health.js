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
