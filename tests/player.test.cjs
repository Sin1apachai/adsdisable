const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
async function run(parent, excluded = []) {
  let tick, changes, clicks = 0;
  const style = { isConnected: false, remove() { this.isConnected = false; } };
  const button = { disabled: true, getClientRects: () => [1], click() { clicks++; } };
  vm.runInNewContext(fs.readFileSync('player-ads.js', 'utf8'), {
    URL, location: { hostname: 'lumierecore.com', ancestorOrigins: [parent] },
    document: { createElement: () => style, documentElement: { append(s) { s.isConnected = true; } },
      addEventListener() {}, getElementById: () => button },
    chrome: { storage: { local: { async get() { return { enabled: true, excluded }; } },
      onChanged: { addListener(fn) { changes = fn; } } } },
    setInterval(fn) { tick = fn; }, getComputedStyle: () => ({ visibility: 'visible' })
  });
  await new Promise(resolve => setImmediate(resolve));
  return { style, button, tick, changes, clicks: () => clicks };
}
(async () => {
  const test = await run('https://xn--l3ca4b6dsc1b.com');
  assert(test.style.isConnected);
  test.tick(); assert.equal(test.clicks(), 1);
  assert.equal(test.button.disabled, false);
  test.button.getClientRects = () => [];
  test.tick(); assert.equal(test.clicks(), 1);
  test.changes({ enabled: { newValue: false } }, 'local');
  test.tick(); assert(!test.style.isConnected); assert.equal(test.clicks(), 1);
  const exempt = await run('https://xn--l3ca4b6dsc1b.com', ['xn--l3ca4b6dsc1b.com']);
  assert(!exempt.style.isConnected);
  const other = await run('https://example.com'); assert.equal(other.tick, undefined);
  console.log('PASS: embedded overlay, parent exclusion, immediate preroll skip, hidden button ignored, unrelated embeds');
})().catch(error => { console.error(error); process.exitCode = 1; });
