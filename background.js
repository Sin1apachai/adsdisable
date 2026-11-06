const defaults = { enabled: true, excluded: [] };
async function syncRules(state) {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: state.enabled ? ['ads'] : [],
    disableRulesetIds: state.enabled ? [] : ['ads']
  });
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old.map(rule => rule.id),
    addRules: state.excluded.map((host, index) => ({
      id: index + 1, priority: 100,
      action: { type: 'allowAllRequests' },
      condition: { requestDomains: [host], resourceTypes: ['main_frame'] }
    }))
  });
  await chrome.action.setBadgeText({ text: state.enabled ? 'ON' : 'OFF' });
  await chrome.action.setBadgeBackgroundColor({ color: state.enabled ? '#df302f' : '#9b8c8c' });
}
let queue = Promise.resolve();
function enqueue(task) { const next = queue.then(task); queue = next.catch(() => {}); return next; }
chrome.runtime.onInstalled.addListener(() => { enqueue(async () => syncRules(await chrome.storage.local.get(defaults))); });
chrome.runtime.onStartup.addListener(() => { enqueue(async () => syncRules(await chrome.storage.local.get(defaults))); });
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || message.type !== 'setState') return;
  enqueue(async () => {
    const old = await chrome.storage.local.get(defaults);
    const state = { enabled: typeof message.enabled === 'boolean' ? message.enabled : old.enabled, excluded: old.excluded };
    if (typeof message.host === 'string' && /^[a-z0-9.-]+$/i.test(message.host)) {
      const set = new Set(state.excluded);
      if (message.exclude) set.add(message.host); else set.delete(message.host);
      state.excluded = [...set].sort();
    }
    await syncRules(state);
    await chrome.storage.local.set(state);
    return state;
  }).then(state => respond({ ok: true, state }), error => respond({ ok: false, error: error.message }));
  return true;
});
