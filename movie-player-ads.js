(() => {
  const parents = Array.from(location.ancestorOrigins || [], origin => {
    try { return new URL(origin).hostname; } catch { return ''; }
  });
  let state = { enabled: true, excluded: [] };
  let active = false;
  let attempts = 0;
  function apply() {
    active = state.enabled && ![location.hostname, ...parents].some(host =>
      state.excluded.some(domain => host === domain || host.endsWith('.' + domain)));
  }
  chrome.storage.local.get(state).then(value => { state = value; apply(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of ['enabled', 'excluded']) if (changes[key]) state[key] = changes[key].newValue;
    apply();
  });
  const timer = setInterval(() => {
    const frame = document.getElementById('videoIframe');
    const source = frame?.getAttribute('src')?.trim();
    // Stop as soon as the player's own handler has selected the content frame.
    if (source && source !== 'about:blank') { clearInterval(timer); return; }
    if (attempts >= 10) { clearInterval(timer); return; }
    if (!active || document.readyState === 'loading') return;
    const skip = document.getElementById('skipButton');
    if (!frame || !skip) return;
    attempts++;
    skip.click();
  }, 100);
})();
