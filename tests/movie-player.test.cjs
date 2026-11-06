const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
async function setup({ excluded = [], available = true, completes = true } = {}) {
  let tick, changes, clicks = 0, source = '', stopped = false;
  const frame = { getAttribute: () => source };
  const skip = { click() { clicks++; if (completes && clicks === 4) source = 'https://example.test/content'; } };
  const document = { readyState: 'complete', getElementById: id => !available ? null : id === 'videoIframe' ? frame : skip };
  vm.runInNewContext(fs.readFileSync('movie-player-ads.js', 'utf8'), {
    URL, location: { hostname: '2499hdonline.com', ancestorOrigins: ['https://2499hdonline.com'] }, document,
    chrome: { storage: { local: { async get() { return { enabled: true, excluded }; } }, onChanged: { addListener(fn) { changes = fn; } } } },
    setInterval(fn) { tick = fn; return 1; }, clearInterval() { stopped = true; }
  });
  await new Promise(resolve => setImmediate(resolve));
  return { document, tick, changes, clicks: () => clicks, stopped: () => stopped };
}
(async () => {
  const player = await setup();
  for (let i = 0; i < 6; i++) player.tick();
  assert.equal(player.clicks(), 4); assert(player.stopped());
  const exempt = await setup({ excluded: ['2499hdonline.com'] }); exempt.tick(); assert.equal(exempt.clicks(), 0);
  const off = await setup(); off.changes({ enabled: { newValue: false } }, 'local'); off.tick(); assert.equal(off.clicks(), 0);
  const loading = await setup(); loading.document.readyState = 'loading'; loading.tick(); assert.equal(loading.clicks(), 0);
  const missing = await setup({ available: false }); missing.tick(); assert.equal(missing.clicks(), 0);
  const changedPlayer = await setup({ completes: false }); for (let i = 0; i < 15; i++) changedPlayer.tick();
  assert.equal(changedPlayer.clicks(), 10); assert(changedPlayer.stopped());
  const rule = require('../rules.json').find(rule => rule.condition.urlFilter === '||ads.p2p-cdnmovie.xyz^');
  assert.deepEqual(rule.condition.initiatorDomains, ['2499hdonline.com']); assert(rule.condition.resourceTypes.includes('media'));
  assert(!rule.condition.resourceTypes.includes('main_frame'));
  console.log('PASS: ad playlist progression, stop after content, opt-out, loading/missing player, bounded retries, scoped media rule');
})().catch(error => { console.error(error); process.exitCode = 1; });
