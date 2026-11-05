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
  assert(!other.style.textContent.includes('doujin-th.com/banner/'));
  assert(!other.style.textContent.includes('.dac-section--banner'));
  const additional = await test('xn--l3ca4b6dsc1b.com', { enabled: true, excluded: [] });
  for (const selector of ['.dac-section--banner', '.dac-section--float', '.video-player-banners-left', '.video-player-banners-right', '#ad-bnr-bottom']) assert(additional.style.textContent.includes(selector));
  assert(additional.style.isConnected);
  additional.changes({ excluded: { newValue: ['xn--l3ca4b6dsc1b.com'] } }, 'local');
  assert(!additional.style.isConnected);
  const doujin = await test('doujin-th.com', { enabled: true, excluded: [] });
  assert(doujin.style.textContent.includes('doujin-th.com/banner/'));
  assert(doujin.style.textContent.includes('ins[data-zoneid][class^="eas"]'));
  assert(doujin.style.isConnected);
  doujin.changes({ excluded: { newValue: ['doujin-th.com'] } }, 'local');
  assert(!doujin.style.isConnected);
  const exempt = await test('gg-animes.com', { enabled: true, excluded: ['gg-animes.com'] });
  assert(!exempt.style.isConnected);
  console.log('PASS: site-specific hiding, toggle restoration, site exclusions, unrelated sites');
})().catch(error => { console.error(error); process.exitCode = 1; });
