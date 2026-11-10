(() => {
  const generic = 'ins.adsbygoogle, [data-ad-slot][data-ad-client], iframe[src*="doubleclick.net"], iframe[src*="googlesyndication.com"], [id^="google_ads_iframe"], [id^="div-gpt-ad"], [data-nitro-encrypted]';
  // Site-specific selectors from EasyList (see THIRD-PARTY.txt).
  const mobalytics = '.m-17psdf9, .m-1hsuptt, .m-bz6vl, [id^="nitro-"], [id^="nitropay-"], [data-nitro-encrypted], [data-nitro-encrypted], .ad-container, .ad-slot, [data-ad-unit], [data-ad-slot], [id^="mobalytics-"][id*="-ad"]';
  const isMobalytics = location.hostname === 'mobalytics.gg' || location.hostname.endsWith('.mobalytics.gg');
  const isGgAnimes = location.hostname === 'gg-animes.com' || location.hostname.endsWith('.gg-animes.com');
  const ggAnimes = '.container_ads, .header-bnn, .floating_content, [id^="ads_"], #block-8';
  const isDoujinTh = location.hostname === 'doujin-th.com' || location.hostname.endsWith('.doujin-th.com');
  const doujinTh = 'iframe[src^="//doujin-th.com/banner/"], iframe[src^="https://doujin-th.com/banner/"], iframe[src^="http://doujin-th.com/banner/"], iframe[src^="/banner/"], ins[data-zoneid][class^="eas"], div:has(> iframe[src*="doujin-th.com/banner/"]), div:has(> iframe[src^="/banner/"])';
  const isAdditionalSite = location.hostname === 'xn--l3ca4b6dsc1b.com' || location.hostname.endsWith('.xn--l3ca4b6dsc1b.com');
  const additionalSite = '.dac-section--banner, .dac-section--float, .dac-grid[data-dac-slug], .dac-float[data-dac-slug], .dac-ad, .video-player-banners-left, .video-player-banners-right, .video-player-banner, .ad-bnr-side, #ad-bnr-bottom';
  const is2499 = location.hostname === '2499hdonline.com' || location.hostname.endsWith('.2499hdonline.com');
  const movieSite = '.ad-mobile-stack, .ad-item, #mau-global-ads-wrap, #mau-player-overlay';
  const selectors = generic + (isMobalytics ? ', ' + mobalytics : '') + (isGgAnimes ? ', ' + ggAnimes : '') + (isDoujinTh ? ', ' + doujinTh : '') + (isAdditionalSite ? ', ' + additionalSite : '') + (is2499 ? ', ' + movieSite : '');
  const style = document.createElement('style');
  style.id = 'clearads-cosmetic-style';
  style.textContent = `${selectors} { display: none !important; }`;
  let state = { enabled: true, excluded: [] };
  const hiddenPromos = new Map();
  let active = false;
  let scheduled = false;
  const observedRoots = new WeakSet();
  function conceal(target) {
    if (!target || ['BODY', 'HTML', 'MAIN'].includes(target.tagName) || target.id === 'root') return;
    if (!hiddenPromos.has(target)) hiddenPromos.set(target, {
      value: target.style.getPropertyValue('display'), priority: target.style.getPropertyPriority('display')
    });
    target.style.setProperty('display', 'none', 'important');
  }
  function pageRoots() {
    const roots = [document];
    for (let i = 0; i < roots.length; i++) {
      for (const element of roots[i].querySelectorAll('*')) {
        let shadow = element.shadowRoot;
        try { shadow ||= chrome.dom?.openOrClosedShadowRoot(element); } catch {}
        if (shadow && !roots.includes(shadow)) {
          roots.push(shadow);
          if (!observedRoots.has(shadow)) {
            observedRoots.add(shadow);
            new MutationObserver(schedule).observe(shadow, { childList: true, subtree: true, characterData: true });
          }
        }
      }
    }
    return roots;
  }
  function hideMobalyticsPromos() {
    if (!active || !isMobalytics) return;
    for (const root of pageRoots()) {
    for (const node of root.querySelectorAll('*')) {
      if (node.children.length > 1) continue;
      const label = node.textContent.trim();
      if (!/^(advertisement|remove all ads)$/i.test(label)) continue;
      // Ad widgets may live inside a closed shadow root outside the app root.
      if (root.host && !root.querySelector('main, article, nav, h1') && root.textContent.length < 3000) {
        conceal(root.host);
        continue;
      }
      let target = /^advertisement$/i.test(label) ? node.closest('header') || node : node.parentElement;
      const parent = target?.parentElement;
      // Only collapse small, dedicated ad panels, never a content or page root.
      if (parent && !['BODY', 'HTML', 'MAIN'].includes(parent.tagName) && parent.id !== 'root' &&
          !parent.querySelector('main, article, nav, h1') && parent.textContent.length < 800 &&
          parent.querySelectorAll('*').length < 100) target = parent;
      conceal(target);
    }
    }
  }
  function schedule() {
    if (!active || !isMobalytics || scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; hideMobalyticsPromos(); }, 150);
  }
  function apply() {
    const host = location.hostname;
    active = state.enabled && !state.excluded.some(domain => host === domain || host.endsWith('.' + domain));
    if (active && !style.isConnected && document.documentElement) document.documentElement.append(style);
    if (!active) style.remove();
    if (!active) {
      for (const [node, previous] of hiddenPromos) {
        if (previous.value) node.style.setProperty('display', previous.value, previous.priority);
        else node.style.removeProperty('display');
      }
      hiddenPromos.clear();
    } else schedule();
  }
  chrome.storage.local.get(state).then(value => { state = value; apply(); });
  document.addEventListener('DOMContentLoaded', apply, { once: true });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type !== 'diagnostics') return;
    apply();
    hideMobalyticsPromos();
    respond({ active, styleAttached: style.isConnected, matched: document.querySelectorAll(selectors).length,
      hiddenPromos: hiddenPromos.size, version: chrome.runtime.getManifest().version });
  });
  if (isMobalytics) new MutationObserver(schedule).observe(document, { childList: true, subtree: true });
  if (isMobalytics) setInterval(() => { if (!document.hidden) schedule(); }, 2000);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of ['enabled', 'excluded']) if (changes[key]) state[key] = changes[key].newValue;
    apply();
  });
})();
