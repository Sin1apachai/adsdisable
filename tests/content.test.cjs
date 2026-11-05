const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const source = fs.readFileSync('content.js', 'utf8');
async function test(host, initial) {
  let changes;
  const style = { isConnected: false, remove() { this.isConnected = false; } };
  const document = { createElement() { return style; }, documentElement: { append(s) { s.isConnected = true; } }, addEventListener() {} };
  const chrome = { runtime: { onMessage: { addListener() {} } }, storage: { local: { async get() { return initial; } }, onChanged: { addListener(fn) { changes = fn; } } } };
  vm.runInNewContext(source, { document, chrome, location: { hostname: host } });
  await new Promise(resolve => setImmediate(resolve));
  return { style, changes };
}
(async () => {
  const gg = await test('gg-animes.com', { enabled: true, excluded: [] });
  assert(gg.style.textContent.includes('.container_ads'));
  assert(gg.style.textContent.includes('.floating_content'));
  assert(gg.style.isConnected);
  gg.changes({ enabled: { newValue: false } }, 'local');
  assert(!gg.style.isConnected);
  gg.changes({ enabled: { newValue: true } }, 'local');
  assert(gg.style.isConnected);
  const other = await test('example.com', { enabled: true, excluded: [] });
  assert(!other.style.textContent.includes('.container_ads'));
  const exempt = await test('gg-animes.com', { enabled: true, excluded: ['gg-animes.com'] });
  assert(!exempt.style.isConnected);
  console.log('PASS: site-specific hiding, toggle restoration, site exclusions, unrelated sites');
})().catch(error => { console.error(error); process.exitCode = 1; });
