const assert = require('assert/strict');
const rules = require('../rules.json');
assert.equal(new Set(rules.map(rule => rule.id)).size, rules.length);
for (const filter of ['||doujin-th.com/banner/', '||magsrv.com^', '||pemsrv.com^']) {
  const rule = rules.find(rule => rule.condition.urlFilter === filter);
  assert(rule, `Missing rule ${filter}`);
  assert.equal(rule.action.type, 'block');
  assert.deepEqual(rule.condition.initiatorDomains, ['doujin-th.com']);
  assert(rule.condition.resourceTypes.includes('script'));
  assert(rule.condition.resourceTypes.includes('sub_frame'));
  assert(!rule.condition.resourceTypes.includes('main_frame'));
}
assert(!rules.some(rule => rule.condition.urlFilter === '||doujin-th.com^'));
const mikuRule = rules.find(rule => rule.condition.urlFilter === '||miku-doujin.com/pic/');
assert(mikuRule);
assert.deepEqual(mikuRule.condition.initiatorDomains, ['miku-doujin.com']);
assert.deepEqual(mikuRule.condition.resourceTypes, ['image']);
assert.equal(mikuRule.action.type, 'block');
assert(!rules.some(rule => rule.condition.urlFilter === '||miku-doujin.com^'));
for (const filter of ['||storage.adwpress.com/uploads/media/', '||xn--l3ca4b6dsc1b.com/wp-content/plugins/dynamic-ads-client/']) {
  const rule = rules.find(rule => rule.condition.urlFilter === filter);
  assert(rule, `Missing updated banner rule ${filter}`);
  assert.deepEqual(rule.condition.initiatorDomains, ['xn--l3ca4b6dsc1b.com']);
  assert.equal(rule.action.type, 'block');
  assert(!rule.condition.resourceTypes.includes('main_frame'));
  assert(!rule.condition.resourceTypes.includes('media'));
}
console.log('PASS: banner and ad-provider rules scoped to doujin-th; main navigation preserved');
