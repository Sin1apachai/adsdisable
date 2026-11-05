const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
let changed, diagnostic;
const values = new Map();
const host = { children: [], textContent: '', tagName: 'DIV', id: 'ad-widget', shadowRoot: null,
  style: { getPropertyValue: k => values.get(k)?.value || '', getPropertyPriority: k => values.get(k)?.priority || '',
    setProperty(k, value, priority) { values.set(k, { value, priority }); }, removeProperty(k) { values.delete(k); } } };
const label = { children: [], textContent: 'ADVERTISEMENT' };
const shadow = { host, textContent: 'ADVERTISEMENT Remove Ads Remove all ads', querySelector() { return null; }, querySelectorAll() { return [label]; } };
const style = { isConnected: false, remove() { this.isConnected = false; } };
const document = { hidden: false, createElement() { return style; }, documentElement: { append(s) { s.isConnected = true; } },
  addEventListener() {}, querySelectorAll(selector) { return selector === '*' ? [host] : []; } };
const chrome = { dom: { openOrClosedShadowRoot: element => element === host ? shadow : null },
  runtime: { getManifest: () => ({ version: '1.3.0' }), onMessage: { addListener(fn) { diagnostic = fn; } } },
  storage: { local: { async get() { return { enabled: true, excluded: [] }; } }, onChanged: { addListener(fn) { changed = fn; } } } };
vm.runInNewContext(fs.readFileSync('content.js', 'utf8'), {
  document, chrome, location: { hostname: 'mobalytics.gg' }, MutationObserver: class { observe() {} }, setTimeout() {}, setInterval() {}
});
setImmediate(() => {
  let report;
  diagnostic({ type: 'diagnostics' }, {}, result => { report = result; });
  assert.equal(host.style.getPropertyValue('display'), 'none');
  assert.equal(report.hiddenPromos, 1);
  changed({ enabled: { newValue: false } }, 'local');
  assert.equal(host.style.getPropertyValue('display'), '');
  console.log('PASS: closed shadow ad modal detected; hiding restores when disabled');
});
