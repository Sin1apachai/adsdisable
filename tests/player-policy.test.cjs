const assert = require('assert/strict'), fs = require('fs'), vm = require('vm');
const code = fs.readFileSync('player-policy.js', 'utf8');
function setup(parent, nonConfigurable = false) {
  const window = {}, listeners = {};
  if (nonConfigurable) Object.defineProperty(window, 'PLAYER_PRE_PLAYLIST_ENABLED', { value: true, configurable: false });
  vm.runInNewContext(code, { window, URL, location: { ancestorOrigins: [parent] },
    document: { addEventListener(name, handler) { listeners[name] = handler; } } });
  return { window, policy: detail => listeners['clearads-player-policy']?.({ detail }) };
}
const player = setup('https://xn--l3ca4b6dsc1b.com');
// External player configuration arriving after document_start cannot re-enable preroll.
player.window.PLAYER_PRE_PLAYLIST_ENABLED = true;
assert.equal(player.window.PLAYER_PRE_PLAYLIST_ENABLED, false);
player.window.PLAYER_PRE_PLAYLIST_ENABLED = true;
assert.equal(player.window.PLAYER_PRE_PLAYLIST_ENABLED, false);
player.policy('disabled');
assert.equal(player.window.PLAYER_PRE_PLAYLIST_ENABLED, true);
player.window.PLAYER_PRE_PLAYLIST_ENABLED = false;
assert.equal(player.window.PLAYER_PRE_PLAYLIST_ENABLED, false);
player.policy('enabled'); player.window.PLAYER_PRE_PLAYLIST_ENABLED = true;
assert.equal(player.window.PLAYER_PRE_PLAYLIST_ENABLED, false);
const other = setup('https://example.com');
other.window.PLAYER_PRE_PLAYLIST_ENABLED = true;
assert.equal(other.window.PLAYER_PRE_PLAYLIST_ENABLED, true);
assert.equal(Object.getOwnPropertyDescriptor(other.window, 'PLAYER_PRE_PLAYLIST_ENABLED').get, undefined);
assert.equal(setup('https://xn--l3ca4b6dsc1b.com', true).window.PLAYER_PRE_PLAYLIST_ENABLED, true);
console.log('PASS: early preroll policy, late config writes, publisher-value restoration, unrelated embeds, locked setting');
