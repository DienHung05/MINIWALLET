module.exports = async function me(req, res) {
  const u = req.info.user;
  if (req.info.role === 'customer') {
    return res.ok({
      user: {
        id: u.id,
        role: 'customer',
        phone: u.phone,
        name: u.name,
        status: u.status,
      },
    });
  }

  return res.ok({
    user: {
      id: u.id,
      role: 'officer',
      username: u.username,
      status: u.status,
    },
  });
};
