module.exports.policies = {

  '*': false,
  health: true,
  'customer/register': true,
  'customer/login': true,
  'officer/login': true,
  me: ['isAuthenticated'],
  
};
