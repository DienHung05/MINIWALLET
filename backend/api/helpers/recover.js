module.exports = {
  friendlyName: 'Recover',
  description: 'Janitor phục hồi giao dịch/khoá treo.',
  inputs: {
    requestTtlMs: { type: 'number', defaultsTo: 15 * 60 * 1000 },
    processingStaleMs: { type: 'number', defaultsTo: 2 * 60 * 1000 },
    lockLeaseMs: { type: 'number', defaultsTo: 2 * 60 * 1000 },
    reverseAfterMs: { type: 'number', defaultsTo: 10 * 60 * 1000 },
  },
  exits: { success: { outputType: 'ref' } },

  fn: async function (inputs, exits) {
    const engine = require('../services/engine');
    const now = Date.now();
    const summary = { expired: 0, settled: 0, reversed: 0, failed: 0, flippedDone: 0, unlocked: 0, leftProcessing: 0 };

    // 1) pending quá hạn -> expired
    const stalePending = await TransactionTrail.find({ status: 'pending', createdAt: { '<': now - inputs.requestTtlMs } });
    for (const t of stalePending) {
      const r = await TransactionTrail.updateOne({ id: t.id, status: 'pending' }).set({ status: 'expired' });
      if (r) summary.expired++;
    }

    // 2) processing treo
    const staleProc = await TransactionTrail.find({ status: 'processing', updatedAt: { '<': now - inputs.processingStaleMs } });
    for (const t of staleProc) {
      const txn = await Transaction.findOne({ transRefId: t.id, status: 'done' });
      if (txn) {                                   // crash sau ghi sổ, trước khi flip
        await TransactionTrail.updateOne({ id: t.id, status: 'processing' }).set({ status: 'done' });
        summary.flippedDone++; continue;
      }
      const service = await Service.findOne(t.service);
      const settlement = (service && service.settlement) || {};
      if (settlement.mode === 'async') {
        const settleHook = ((service.hooks) || []).find((h) => h.phase === 'onSettle');
        let state = 'UNKNOWN';
        if (settleHook) {
          try {
            const out = await sails.helpers.callConnector(settleHook.connector, 'status', { refId: t.id });
            state = `${(out.data && out.data.state) || ''}`.toUpperCase();
          } catch (e) { /* giữ UNKNOWN */ }
        }
        if (state === 'SUCCESS') { await engine.processCallback(settleHook && settleHook.connector, { refId: t.id, state: 'SUCCESS' }); summary.settled++; }
        else if (state === 'FAILED') { await engine.processCallback(settleHook && settleHook.connector, { refId: t.id, state: 'FAILED' }); summary.reversed++; }
        else if (now - new Date(t.updatedAt).getTime() > inputs.reverseAfterMs) { // unknown quá lâu -> hoàn tiền
          await engine.processCallback(settleHook && settleHook.connector, { refId: t.id, state: 'FAILED' }); summary.reversed++;
        } else summary.leftProcessing++;
      } else {                                     // sync, chưa có Transaction -> crash trước commit
        await TransactionTrail.updateOne({ id: t.id, status: 'processing' }).set({ status: 'failed' });
        summary.failed++;
      }
    }

    const orphanLocks = await Pocket.find({ state: 'inProgress', updatedAt: { '<': now - inputs.lockLeaseMs } });
    for (const p of orphanLocks) {
      const r = await Pocket.updateOne({ id: p.id, state: 'inProgress' }).set({ state: 'idle' });
      if (r) summary.unlocked++;
    }

    if (Object.values(summary).some((n) => n > 0)) sails.log.info('Recover: ' + JSON.stringify(summary));
    return exits.success(summary);
  },
};
