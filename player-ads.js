(() => {
  // Run only inside this site's embedded player, not on unrelated embeds.
  const parentHosts = Array.from(location.ancestorOrigins || [], origin => {
    try { return new URL(origin).hostname; } catch { return ''; }
  });
  const site = 'xn--l3ca4b6dsc1b.com';
  if (!parentHosts.some(host => host === site || host.endsWith('.' + site))) return;
  const style = document.createElement('style');
  style.textContent = '#x9q { display: none !important; }';
  let state = { enabled: true, excluded: [] };
  let active = false;
  function apply() {
    active = state.enabled && ![location.hostname, ...parentHosts].some(host =>
      state.excluded.some(domain => host === domain || host.endsWith('.' + domain)));
    if (active && !style.isConnected && document.documentElement) document.documentElement.append(style);
    if (!active) style.remove();
  }
  function skipWhenAvailable() {
    if (!active) return;
    const button = document.getElementById('skip_btn');
    // Preserve the player's own countdown and playback sequence.
    if (button && !button.disabled && button.getClientRects().length && getComputedStyle(button).visibility !== 'hidden') button.click();
  }
  chrome.storage.local.get(state).then(value => { state = value; apply(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of ['enabled', 'excluded']) if (changes[key]) state[key] = changes[key].newValue;
    apply();
  });
  document.addEventListener('DOMContentLoaded', apply, { once: true });
  setInterval(() => { apply(); skipWhenAvailable(); }, 1000);
})();
