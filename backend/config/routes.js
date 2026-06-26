module.exports.routes = {
  'GET /api/health': { action: 'health' },

  'POST /api/customer/register': { action: 'customer/register' },
  'POST /api/customer/login':    { action: 'customer/login' },
  'POST /api/officer/login':     { action: 'officer/login' },
  'GET  /api/me':                { action: 'me' },
  'GET  /api/customer/balance':  { action: 'customer/balance' },
};