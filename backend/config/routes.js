module.exports.routes = {
  'GET /api/health': { action: 'health' },

  'POST /api/customer/register': { action: 'customer/register' },
  'POST /api/customer/login':    { action: 'customer/login' },
  'POST /api/officer/login':     { action: 'officer/login' },
  'GET  /api/me':                { action: 'me' },
  'GET  /api/customer/balance':  { action: 'customer/balance' },
  'GET  /api/customer/instruments': { action: 'customer/instruments' },
  'GET  /api/customer/history':     { action: 'customer/history' },

  // Engine 3 runtime 
  'POST /api/txn/request': { action: 'txn/request' },
  'POST /api/txn/confirm': { action: 'txn/confirm' },
  'POST /api/txn/verify':  { action: 'txn/verify' },
  'POST /api/txn/callback/:connector': { action: 'txn/callback' },

  'POST /mock/vcb/:op':   { action: 'mock/vcb' },
  'POST /mock/napas/:op': { action: 'mock/napas' },
  'POST /mock/visa/:op':  { action: 'mock/visa' },

  'POST /api/admin/connector/test': { action: 'admin/test-connector' },
  'POST /api/admin/recover':        { action: 'admin/recover' },
  'GET  /api/admin/integrity':      { action: 'admin/integrity' },
  'GET  /api/admin/trails':         { action: 'admin/trails' },
};
