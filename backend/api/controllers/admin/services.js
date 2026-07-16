async function decorate(service) {
  const id = String(service.id);
  const [fields, validations, definition] = await Promise.all([
    TransField.find({ service: id }).sort('order ASC'),
    TransValidation.find({ service: id }).sort('order ASC'),
    TransDefinition.findOne({ service: id }),
  ]);
  return {
    id,
    code: service.code,
    name: service.name,
    serviceType: service.serviceType,
    currency: service.currency,
    enabled: service.enabled,
    fieldBuilder: service.fieldBuilder || [],
    feeConfig: service.feeConfig || {},
    auth: service.auth || {},
    hooks: service.hooks || [],
    effects: service.effects || [],
    settlement: service.settlement || {},
    concurrency: service.concurrency,
    fields,
    validations,
    glSteps: definition ? definition.glSteps || [] : [],
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

module.exports = async function services(req, res) {
  const rows = await Service.find().sort('code ASC');
  const services = [];
  for (const s of rows) services.push(await decorate(s));
  return res.ok({ services });
};
