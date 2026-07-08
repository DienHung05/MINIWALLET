#!/usr/bin/env node

const path = require('path');
const net = require('net');

process.chdir(path.resolve(__dirname, '..'));
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const DEFAULT_QA_DB = 'mongodb://127.0.0.1:27017/miniwallet_qa';
const dbUrl = process.env.DATABASE_URL || DEFAULT_QA_DB;
const isQaDatabase = /(?:_qa|test)/i.test(new URL(dbUrl).pathname || '');

if (!isQaDatabase && process.env.MINIWALLET_QA_ALLOW_SHARED_DB !== '1') {
  console.error('Refusing to run QA against a non-test database: ' + dbUrl);
  console.error('Use a database name containing "_qa" or "test", or set MINIWALLET_QA_ALLOW_SHARED_DB=1 intentionally.');
  process.exit(1);
}

process.env.DATABASE_URL = dbUrl;

const sails = require('sails');
const rc = require('sails/accessible/rc');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function printOk(message) {
  console.log('[OK] ' + message);
}

async function liftSails() {
  const config = rc();
  const port = Number(process.env.MINIWALLET_QA_PORT || await getFreePort());
  await new Promise((resolve, reject) => {
    sails.lift(Object.assign({}, config, {
      environment: 'test',
      port,
      hooks: Object.assign({}, config.hooks || {}, { grunt: false }),
      log: { level: process.env.MINIWALLET_QA_LOG_LEVEL || 'error' },
      models: Object.assign({}, config.models || {}, { migrate: 'drop' }),
      datastores: {
        default: {
          adapter: 'sails-mongo',
          url: dbUrl,
        },
      },
      custom: Object.assign({}, config.custom || {}, {
        bcryptRounds: 4,
        checksumSecret: 'qa-checksum-secret',
        jwtSecret: 'qa-jwt-secret',
      }),
    }), (err) => (err ? reject(err) : resolve()));
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function lowerSails() {
  if (global.__recoverTimer) {
    clearInterval(global.__recoverTimer);
    global.__recoverTimer = null;
  }
  await new Promise((resolve) => sails.lower(resolve));
}

async function syncConnectorBaseUrls() {
  const address = sails.hooks.http.server.address();
  const base = 'http://127.0.0.1:' + address.port + '/mock';
  await Connector.updateOne({ code: 'VCB' }).set({ baseUrl: base + '/vcb' });
  await Connector.updateOne({ code: 'VISA' }).set({ baseUrl: base + '/visa' });
  await Connector.updateOne({ code: 'NAPAS' }).set({ baseUrl: base + '/napas' });
}

async function createCustomer(seed, balance) {
  const password = 'pass123';
  const passwordHash = await sails.helpers.hashPin(password);
  const customer = await Customer.create({
    username: 'qa_' + seed,
    phone: seed,
    name: 'QA ' + seed,
    passwordHash,
    pinHash: passwordHash,
  }).fetch();
  const checksum = await sails.helpers.computeChecksum(balance, 'customer', customer.id, 'VND');
  const pocket = await Pocket.create({
    ownerType: 'customer',
    ownerRef: customer.id,
    balance,
    checksum,
  }).fetch();
  const updated = await Customer.updateOne(customer.id).set({ pocket: pocket.id });
  return Object.assign({}, updated, { password });
}

async function sumBalances() {
  const pockets = await Pocket.find({});
  return pockets.reduce((sum, p) => sum + Number(p.balance || 0), 0);
}

async function assertPocketIntegrity(label) {
  const pockets = await Pocket.find({});
  for (const p of pockets) {
    assert(Number(p.balance || 0) >= 0, label + ': pocket has negative balance ' + p.id);
    const expected = await sails.helpers.computeChecksum(p.balance, p.ownerType, p.ownerRef, p.currency || 'VND');
    assert(p.checksum === expected, label + ': checksum mismatch for pocket ' + p.id);
  }
}

async function assertTotalUnchanged(baseline, label) {
  const current = await sumBalances();
  assert(current === baseline, label + ': total balance changed from ' + baseline + ' to ' + current);
  await assertPocketIntegrity(label);
}

async function snapshotRef(transRefId) {
  const trail = await TransactionTrail.findOne(transRefId);
  const entries = await PocketEntry.find({ transRefId });
  const txns = await Transaction.find({ transRefId });
  return {
    status: trail && trail.status,
    entryCount: entries.length,
    transactionCount: txns.length,
    txns,
  };
}

async function expectReplayStable(transRefId, before, label) {
  const after = await snapshotRef(transRefId);
  assert(after.status === before.status, label + ': status changed on replay');
  assert(after.entryCount === before.entryCount, label + ': entry count changed on replay');
  assert(after.transactionCount === before.transactionCount, label + ': transaction count changed on replay');
  return after;
}

async function runP2PReplay(engine, sender, receiver, baseline) {
  const req = await engine.processRequest('P2P', {
    receiverPhone: receiver.phone,
    amount: 25000,
  }, { userId: sender.id, user: sender });

  const first = await engine.processVerify(req.transRefId, sender.password, { userId: sender.id, user: sender });
  assert(first.status === 'done', 'P2P should be done');

  const beforeReplay = await snapshotRef(req.transRefId);
  const second = await engine.processVerify(req.transRefId, sender.password, { userId: sender.id, user: sender });
  assert(second.replay === true, 'P2P second verify should be replay');
  await expectReplayStable(req.transRefId, beforeReplay, 'P2P replay');
  await assertTotalUnchanged(baseline, 'P2P replay');
  printOk('P2P verify replay is idempotent');
}

async function runCardTopup(engine, customer, baseline) {
  const card = await Instrument.create({
    customer: customer.id,
    type: 'card',
    connector: 'VISA',
    token: 'tok_card_1111_qa',
    holderName: customer.name,
    maskedNumber: '****1111',
    status: 'active',
    meta: { brand: 'VISA' },
  }).fetch();

  const req = await engine.processRequest('CARD_TOPUP', {
    instrumentId: card.id,
    amount: 70000,
  }, { userId: customer.id, user: customer });

  const first = await engine.processVerify(req.transRefId, '123456', { userId: customer.id, user: customer });
  assert(first.status === 'done', 'CARD_TOPUP should be done');

  const beforeReplay = await snapshotRef(req.transRefId);
  const second = await engine.processVerify(req.transRefId, '123456', { userId: customer.id, user: customer });
  assert(second.replay === true, 'CARD_TOPUP second verify should be replay');
  await expectReplayStable(req.transRefId, beforeReplay, 'CARD_TOPUP replay');
  await assertTotalUnchanged(baseline, 'CARD_TOPUP replay');
  printOk('CARD_TOPUP verify replay keeps ledger stable');
}

async function runInterbankSuccessReplay(engine, customer, baseline) {
  const req = await engine.processRequest('INTERBANK_OUT', {
    amount: 50000,
    destBank: 'VCB',
    destAccount: '1234567890',
  }, { userId: customer.id, user: customer });

  const verify = await engine.processVerify(req.transRefId, customer.password, { userId: customer.id, user: customer });
  assert(verify.status === 'processing', 'INTERBANK_OUT should wait for callback');

  const first = await engine.processCallback('NAPAS', { refId: req.transRefId, state: 'SUCCESS' });
  assert(first.status === 'done', 'SUCCESS callback should finish transaction');

  const beforeReplay = await snapshotRef(req.transRefId);
  const second = await engine.processCallback('NAPAS', { refId: req.transRefId, state: 'SUCCESS' });
  assert(second.status === 'done' && second.replay === true, 'Duplicate SUCCESS callback should replay');
  await expectReplayStable(req.transRefId, beforeReplay, 'SUCCESS callback replay');
  await assertTotalUnchanged(baseline, 'SUCCESS callback replay');
  printOk('INTERBANK_OUT SUCCESS callback replay is idempotent');
}

async function runInterbankFailedReplay(engine, customer, baseline) {
  const req = await engine.processRequest('INTERBANK_OUT', {
    amount: 42000,
    destBank: 'VCB',
    destAccount: '2234567890',
  }, { userId: customer.id, user: customer });

  const verify = await engine.processVerify(req.transRefId, customer.password, { userId: customer.id, user: customer });
  assert(verify.status === 'processing', 'INTERBANK_OUT reversal case should wait for callback');

  const first = await engine.processCallback('NAPAS', { refId: req.transRefId, state: 'FAILED' });
  assert(first.status === 'reversed', 'FAILED callback should reverse transaction');

  const beforeReplay = await snapshotRef(req.transRefId);
  const second = await engine.processCallback('NAPAS', { refId: req.transRefId, state: 'FAILED' });
  assert(second.status === 'reversed' && second.replay === true, 'Duplicate FAILED callback should replay');
  await expectReplayStable(req.transRefId, beforeReplay, 'FAILED callback replay');
  await assertTotalUnchanged(baseline, 'FAILED callback replay');
  printOk('INTERBANK_OUT FAILED callback replay is idempotent');
}

async function runTimeoutRecovery(engine, customer, baseline) {
  const req = await engine.processRequest('INTERBANK_OUT', {
    amount: 36000,
    destBank: 'VCB',
    destAccount: '3234567890',
  }, { userId: customer.id, user: customer });

  const verify = await engine.processVerify(req.transRefId, customer.password, { userId: customer.id, user: customer });
  assert(verify.status === 'processing', 'timeout case should wait for callback');

  const napas = await Connector.findOne({ code: 'NAPAS' });
  const operations = Object.assign({}, napas.operations || {});
  const originalStatus = operations.status;
  operations.status = Object.assign({}, originalStatus || {}, { path: '/status-unknown' });
  await Connector.updateOne({ code: 'NAPAS' }).set({ operations });

  await TransactionTrail.updateOne(req.transRefId).set({ updatedAt: Date.now() - 60 * 60 * 1000 });
  const summary = await sails.helpers.recover.with({
    processingStaleMs: 0,
    reverseAfterMs: 0,
  });

  operations.status = originalStatus;
  await Connector.updateOne({ code: 'NAPAS' }).set({ operations });

  const snap = await snapshotRef(req.transRefId);
  assert(summary.reversed >= 1, 'recover should reverse stale unknown async transaction');
  assert(snap.status === 'reversed', 'timeout recovery should leave trail reversed');
  assert(snap.transactionCount === 1, 'timeout recovery should create one reversal receipt');
  await assertTotalUnchanged(baseline, 'timeout recovery');
  printOk('Recover reverses stale async transaction when partner state is unknown');
}

async function main() {
  await liftSails();
  await syncConnectorBaseUrls();

  const engine = require('../api/services/engine');
  const alice = await createCustomer('0910000001', 1000000);
  const bob = await createCustomer('0910000002', 1000000);
  const baseline = await sumBalances();
  await assertPocketIntegrity('baseline');

  await runP2PReplay(engine, alice, bob, baseline);
  await runCardTopup(engine, alice, baseline);
  await runInterbankSuccessReplay(engine, alice, baseline);
  await runInterbankFailedReplay(engine, alice, baseline);
  await runTimeoutRecovery(engine, alice, baseline);

  printOk('All engine QA checks passed on ' + dbUrl);
}

main()
  .catch((err) => {
    console.error('[FAIL] ' + (err && err.stack ? err.stack : err));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (sails && sails.hooks) await lowerSails();
  });
