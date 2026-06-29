module.exports = async function napas(req, res) {
  const b = req.allParams();
  if (req.params.op === 'validate') return res.json({ err: 200, data: { name: 'TRAN THI B' } });
  if (req.params.op === 'payout')   return res.json({ err: 200, data: { ref: 'NP' + Date.now(), state: 'PENDING' } });
  if (req.params.op === 'status')   return res.json({ err: 200, data: { state: 'SUCCESS' } }); 
  return res.json({ err: 404, message: 'op không hỗ trợ' });
};