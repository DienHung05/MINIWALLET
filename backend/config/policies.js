module.exports.policies = {
  '*': false,                       
  health: true,
  'customer/register': true,        
  'customer/login': true,
  'officer/login': true,

  me: 'isAuthenticated',
  'customer/balance': 'isAuthenticated',
  'txn/request': 'isAuthenticated',
  'txn/confirm': 'isAuthenticated',
  'txn/verify': 'isAuthenticated',
  'txn/callback': true,                  // đối tác gọi về (demo: công khai; thật: verify chữ ký)

  'mock/vcb': true,
  'mock/napas': true,
  'mock/visa': true,

  'admin/test-connector': ['isAuthenticated', 'isOfficer'],
};