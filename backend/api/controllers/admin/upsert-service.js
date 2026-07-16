function parseJsonValue(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() ? JSON.parse(value) : fallback;
  return value;
}

module.exports = async function upsertService(req, res) {
  try {
    const p = req.allParams();
    const code = `${p.code || ''}`.trim().toUpperCase();
    if (!code) return res.fail(400, 'Thiếu mã service');

    const values = {
      code,
      name: `${p.name || code}`.trim(),
      serviceType: `${p.serviceType || ''}`.trim(),
      currency: p.currency || 'VND',
      enabled: p.enabled !== false,
      fieldBuilder: parseJsonValue(p.fieldBuilder, []),
      feeConfig: parseJsonValue(p.feeConfig, { type: 'fixed', value: 0 }),
      auth: parseJsonValue(p.auth, { method: 'NONE' }),
      hooks: parseJsonValue(p.hooks, []),
      effects: parseJsonValue(p.effects, []),
      settlement: parseJsonValue(p.settlement, { mode: 'sync' }),
      concurrency: p.concurrency || 'locked',
    };

    let service = await Service.findOne({ code });
    if (service) service = await Service.updateOne(service.id).set(values);
    else service = await Service.create(values).fetch();

    const sid = String(service.id);
    if (p.fields !== undefined) {
      const fields = parseJsonValue(p.fields, []);
      await TransField.destroy({ service: sid });
      if (fields.length) await TransField.createEach(fields.map((f, i) => Object.assign({}, f, { service: sid, order: f.order == null ? i : f.order })));
    }
    if (p.validations !== undefined) {
      const validations = parseJsonValue(p.validations, []);
      await TransValidation.destroy({ service: sid });
      if (validations.length) await TransValidation.createEach(validations.map((v, i) => Object.assign({}, v, { service: sid, order: v.order == null ? i : v.order })));
    }
    if (p.glSteps !== undefined) {
      const glSteps = parseJsonValue(p.glSteps, []);
      const existingDef = await TransDefinition.findOne({ service: sid });
      if (existingDef) await TransDefinition.updateOne(existingDef.id).set({ glSteps });
      else await TransDefinition.create({ service: sid, glSteps });
    }

    return res.ok({ service });
  } catch (e) {
    return res.fail(400, e.message || 'Không lưu được service');
  }
};
