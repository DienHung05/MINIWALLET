module.exports = async function health(req, res) {
  return res.ok({
    data: {
      service: 'miniwallet-backend',
      time: new Date().toISOString(),
    },
  });
};
