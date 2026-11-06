(() => {
  const site = 'xn--l3ca4b6dsc1b.com';
  const parents = Array.from(location.ancestorOrigins || [], origin => {
    try { return new URL(origin).hostname; } catch { return ''; }
  });
  if (!parents.some(host => host === site || host.endsWith('.' + site))) return;

  // This file runs in MAIN before the player's external configuration scripts.
  // Keep the original setting so disabling ClearAds restores the publisher value.
  const key = 'PLAYER_PRE_PLAYLIST_ENABLED';
  let original = window[key];
  let block = true;
  const descriptor = Object.getOwnPropertyDescriptor(window, key);
  if (descriptor && !descriptor.configurable) return;
  Object.defineProperty(window, key, {
    configurable: true,
    enumerable: descriptor?.enumerable ?? true,
    get() { return block ? false : original; },
    set(value) { original = value; }
  });
  document.addEventListener('clearads-player-policy', event => {
    if (event.detail === 'enabled') block = true;
    else if (event.detail === 'disabled') block = false;
  });
})();
