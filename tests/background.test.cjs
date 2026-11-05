const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
let listener, stored = { enabled: true, excluded: [] }, dynamic = [], rulesets;
const event = () => ({ addListener() {} });
const chrome = {
  runtime: { id: 'test', onInstalled: event(), onStartup: event(), onMessage: { addListener(fn) { listener = fn; } } },
  storage: { local: { async get() { return structuredClone(stored); }, async set(value) { stored = structuredClone(value); } } },
  action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  declarativeNetRequest: {
    async updateEnabledRulesets(value) { rulesets = value; },
    async getDynamicRules() { return dynamic; },
    async updateDynamicRules(value) { dynamic = value.addRules; }
  }
};
vm.runInNewContext(fs.readFileSync('background.js', 'utf8'), { chrome });
const send = change => new Promise(resolve => listener({ type: 'setState', ...change }, { id: 'test' }, resolve));
(async () => {
  assert.equal((await send({ enabled: false })).ok, true);
  assert.equal(stored.enabled, false);
  assert.equal(rulesets.disableRulesetIds[0], 'ads');
  await send({ host: 'example.com', exclude: true });
  assert.equal(dynamic[0].condition.requestDomains[0], 'example.com');
  assert.equal(dynamic[0].action.type, 'allowAllRequests');
  await send({ enabled: true });
  assert.equal(rulesets.enableRulesetIds[0], 'ads');
  await send({ host: 'example.com', exclude: false });
  assert.equal(dynamic.length, 0);
  await send({ host: 'bad/path', exclude: true });
  assert.equal(dynamic.length, 0);
  console.log('PASS: global toggle, site exception, removal, invalid hostname');
})().catch(e => { console.error(e); process.exitCode = 1; });
