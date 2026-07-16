module.exports = async function customers(req, res) {
  const q = `${req.param('q') || ''}`.trim();
  const limit = Math.min(Math.max(Number(req.param('limit') || 50), 1), 100);
  const filter = q ? { or: [{ phone: { contains: q } }, { name: { contains: q } }] } : {};
  const rows = await Customer.find(filter).limit(limit).sort('createdAt DESC');
  const customers = [];

  for (const c of rows) {
    const pocket = c.pocket ? await Pocket.findOne(c.pocket) : null;
    customers.push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      status: c.status,
      balance: pocket ? pocket.balance : 0,
      pocket: pocket ? pocket.id : '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  }

  return res.ok({ customers });
};
