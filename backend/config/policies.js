module.exports.policies = {
  '*': false,                       
  health: true,
  'customer/register': true,        
  'customer/login': true,
  'officer/login': true,

  me: 'isAuthenticated',
  'customer/balance': 'isAuthenticated',
  'customer/instruments': 'isAuthenticated',
  'customer/history': 'isAuthenticated',
  'txn/request': 'isAuthenticated',
  'txn/confirm': 'isAuthenticated',
  'txn/verify': 'isAuthenticated',
  'txn/callback': true,                  

  'mock/vcb': true,
  'mock/napas': true,
  'mock/visa': true,

  'admin/test-connector': ['isAuthenticated', 'isOfficer'],
  'admin/recover': ['isAuthenticated', 'isOfficer'],
  'admin/integrity': ['isAuthenticated', 'isOfficer'],
  'admin/trails': ['isAuthenticated', 'isOfficer'],
  'admin/reconcile': ['isAuthenticated', 'isOfficer'],
};
