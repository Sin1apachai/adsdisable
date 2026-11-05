const enabled = document.querySelector('#enabled');
const excluded = document.querySelector('#excluded');
const status = document.querySelector('#status');
let tab, host;
async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try { const url = new URL(tab.url); if (['http:', 'https:'].includes(url.protocol)) host = url.hostname; } catch {}
  document.querySelector('#host').textContent = host || 'หน้านี้ไม่รองรับการบล็อก';
  const state = await chrome.storage.local.get({ enabled: true, excluded: [] });
  enabled.checked = state.enabled;
  excluded.checked = !!host && state.excluded.some(domain => host === domain || host.endsWith('.' + domain));
  excluded.disabled = !host || (excluded.checked && !state.excluded.includes(host));
  document.querySelector('#reload').disabled = !host;
  const diagnostic = document.querySelector('#diagnostics');
  diagnostic.textContent = 'รุ่น ' + chrome.runtime.getManifest().version;
  if (host) {
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { type: 'diagnostics' });
      diagnostic.textContent += result.active && result.styleAttached
        ? ` • ทำงานบนหน้านี้ พบช่องโฆษณา ${result.matched + result.hiddenPromos} จุด`
        : ' • ปิดอยู่หรือเว็บนี้ถูกยกเว้น';
    } catch { diagnostic.textContent += ' • ยังไม่เชื่อมต่อหน้าเว็บ กรุณารีเฟรชหน้า'; }
  }
}
async function update(change) {
  enabled.disabled = excluded.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'setState', ...change });
    if (!result?.ok) throw new Error(result?.error || 'บันทึกไม่สำเร็จ');
    status.textContent = 'บันทึกแล้ว • รีเฟรชหน้าเพื่อให้มีผลครบถ้วน';
  } catch (error) { status.textContent = 'เกิดข้อผิดพลาด: ' + error.message; }
  finally { enabled.disabled = false; await init(); }
}
enabled.addEventListener('change', () => update({ enabled: enabled.checked }));
excluded.addEventListener('change', () => update({ host, exclude: excluded.checked }));
document.querySelector('#reload').addEventListener('click', () => chrome.tabs.reload(tab.id));
init().catch(error => { status.textContent = error.message; });
