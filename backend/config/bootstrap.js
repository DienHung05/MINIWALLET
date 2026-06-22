module.exports.bootstrap = async function () {
  sails.log.info('==> MODELS LOADED:', Object.keys(sails.models || {}));

  const Currency_ = sails.models.currency;   
  const Officer_  = sails.models.officer;    

  if (!Currency_ || !Officer_) {
    sails.log.warn('Model chưa nạp đủ — bỏ qua seed.');
    return;
  }

  if (await Currency_.count() === 0) {
    await Currency_.create({ code: 'VND', name: 'Vietnamese Dong', decimal: 0 });
    sails.log.info('Seeded Currency VND');
  }
  if (await Officer_.count() === 0) {
    const passwordHash = await sails.helpers.hashPin('admin123');
    await Officer_.create({ username: 'admin', passwordHash });
    sails.log.info('Seeded Officer: admin / admin123');
  }

};