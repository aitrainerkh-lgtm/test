import { LiveAdvisor } from './live.js';
import { buildSystemInstruction } from './prompt.js';
import { loadSources, saveSources, totalChars, readFileAsText, makeSource, MAX_TOTAL_CHARS } from './sources.js';

const $ = (id) => document.getElementById(id);

const TEXT = {
  status: {
    idle: 'ចុចប៊ូតុងខាងក្រោម ដើម្បីចាប់ផ្ដើមនិយាយ',
    connecting: 'កំពុងភ្ជាប់...',
    listening: 'កំពុងស្ដាប់បង... សូមនិយាយបាន',
    speaking: 'Advisor កំពុងនិយាយ...',
    reconnecting: 'កំពុងភ្ជាប់ឡើងវិញ...',
  },
  start: 'ចាប់ផ្ដើមនិយាយ',
  end: 'បញ្ចប់ការនិយាយ',
  errors: {
    mic_denied: 'សូមអនុញ្ញាតឲ្យប្រើ Microphone ក្នុង Browser រួចព្យាយាមម្ដងទៀត។',
    audio_failed: 'Browser នេះមិនគាំទ្រសំឡេងទេ។ សូមប្រើ Chrome ឬ Safari ជំនាន់ថ្មី។',
    offline: 'មិនអាចភ្ជាប់ Internet បានទេ។ សូមពិនិត្យ Internet រួចព្យាយាមម្ដងទៀត។',
    missing_api_key: 'Server មិនទាន់មាន API Key ទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រង App។',
    rate_limited: 'ប្រើច្រើនពេក។ សូមរង់ចាំប៉ុន្មាននាទី រួចព្យាយាមម្ដងទៀត។',
    access_code_required: 'លេខកូដមិនត្រឹមត្រូវ។',
    connection_lost: 'ការភ្ជាប់បានដាច់។ សូមចុច ចាប់ផ្ដើមនិយាយ ម្ដងទៀត។',
    default: 'មិនអាចភ្ជាប់ទៅ Advisor បានទេ។ សូមព្យាយាមម្ដងទៀត។',
  },
  idleStop: 'បានបញ្ចប់ដោយស្វ័យប្រវត្តិ ព្រោះគ្មានសំឡេង ៣ នាទី។',
  file: {
    unsupported: 'ប្រភេទឯកសារនេះមិនគាំទ្រទេ។ សូមប្រើ PDF, Word (.docx) ឬ TXT។',
    empty: 'មិនអាចអានអត្ថបទពីឯកសារនេះបានទេ (ប្រហែលជាឯកសារស្កេន ឬរូបភាព)។ សូមបិទភ្ជាប់អត្ថបទជំនួសវិញ។',
    failed: 'មិនអាចអានឯកសារនេះបានទេ។',
    full: 'ប្រភពពេញហើយ។ សូមលុបប្រភពខ្លះសិន។',
    cut: 'ឯកសារវែងពេក។ បានរក្សាទុកតែផ្នែកខាងដើម។',
    storage: 'មិនអាចរក្សាទុកក្នុងឧបករណ៍នេះបានទេ។',
    reading: 'កំពុងអានឯកសារ...',
    added: 'បានបន្ថែមប្រភព',
    nextTalk: 'ប្រភពថ្មីនឹងប្រើ នៅពេលបងចាប់ផ្ដើមនិយាយលើកក្រោយ។',
    needText: 'សូមបិទភ្ជាប់អត្ថបទជាមុនសិន។',
  },
  remove: 'លុប',
  used: (pct) => `បានប្រើ ${toKhmerDigits(pct)}% នៃទំហំប្រភព`,
  chars: (n) => `${toKhmerDigits(n.toLocaleString('en-US'))} តួអក្សរ`,
};

function toKhmerDigits(v) {
  return String(v).replace(/\d/g, (d) => '០១២៣៤៥៦៧៨៩'[d]);
}

// ---------- state ----------
let sources = loadSources();

function storageGet(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}
function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

const advisor = new LiveAdvisor({
  getSystemInstruction: () => buildSystemInstruction(sources),
  getAccessCode: () => storageGet('ba.code'),
});

// ---------- toast ----------
let toastTimer;
function toast(message, ms = 4200) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => (el.hidden = true), 300);
  }, ms);
}

// ---------- talk ----------
const app = $('app');
const talkBtn = $('talkBtn');

advisor.addEventListener('state', (e) => {
  const state = e.detail;
  app.dataset.state = state;
  $('status').textContent = TEXT.status[state] || '';
  const active = state !== 'idle';
  $('talkLabel').textContent = active ? TEXT.end : TEXT.start;
  talkBtn.classList.toggle('active', active);
  $('talkIcon').innerHTML = active
    ? '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  if (active) animate();
});

advisor.addEventListener('failure', (e) => {
  if (e.detail === 'access_code_required') {
    const hadCode = !!storageGet('ba.code');
    storageSet('ba.code', '');
    askAccessCode(hadCode);
    return;
  }
  toast(TEXT.errors[e.detail] || TEXT.errors.default, 6000);
});

advisor.addEventListener('idle-stop', () => toast(TEXT.idleStop, 6000));

talkBtn.addEventListener('click', () => {
  if (advisor.state === 'idle') advisor.start();
  else advisor.stop();
});

// Orb reacts to the voice level.
const orb = $('orbWrap');
let raf = 0;
let smooth = 0;
function animate() {
  cancelAnimationFrame(raf);
  const tick = () => {
    if (advisor.state === 'idle') {
      smooth = 0;
      orb.style.setProperty('--lvl', '0');
      return;
    }
    smooth += (advisor.level() - smooth) * 0.25;
    orb.style.setProperty('--lvl', smooth.toFixed(3));
    raf = requestAnimationFrame(tick);
  };
  tick();
}

// ---------- access code ----------
function askAccessCode(wrong) {
  const dlg = $('codeDialog');
  dlg.hidden = false;
  $('codeInput').value = '';
  if (wrong) toast(TEXT.errors.access_code_required);
  setTimeout(() => $('codeInput').focus(), 50);
}
$('codeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  storageSet('ba.code', $('codeInput').value.trim());
  $('codeDialog').hidden = true;
  advisor.start();
});
$('codeCancel').addEventListener('click', () => ($('codeDialog').hidden = true));

// ---------- sources ----------
const sheet = $('sheet');
let changedDuringTalk = false;

function openSheet() {
  changedDuringTalk = false;
  renderSources();
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('open'));
}
function closeSheet() {
  sheet.classList.remove('open');
  setTimeout(() => (sheet.hidden = true), 250);
  hidePaste();
  if (changedDuringTalk && advisor.state !== 'idle') toast(TEXT.file.nextTalk);
}

$('sourcesBtn').addEventListener('click', openSheet);
$('sheetClose').addEventListener('click', closeSheet);
sheet.addEventListener('click', (e) => {
  if (e.target === sheet) closeSheet();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('codeDialog').hidden) $('codeDialog').hidden = true;
  else if (!sheet.hidden) closeSheet();
});

function updateBadge() {
  const badge = $('sourceCount');
  badge.hidden = sources.length === 0;
  badge.textContent = toKhmerDigits(sources.length);
}

function renderSources() {
  const list = $('sourceList');
  list.innerHTML = '';
  for (const s of sources) {
    const li = document.createElement('li');
    li.className = 'source-card';
    const ext = (/\.([a-z0-9]+)$/i.exec(s.name)?.[1] || 'TXT').slice(0, 4).toUpperCase();
    li.innerHTML = `
      <span class="file-cube">${ext}</span>
      <span class="source-meta"><b></b><small></small></span>
      <button class="icon-btn danger" type="button" aria-label="${TEXT.remove}">
        <svg viewBox="0 0 24 24"><path d="M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9.5 7V4.5h5V7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
    li.querySelector('b').textContent = s.name;
    li.querySelector('small').textContent = TEXT.chars(s.text.length);
    li.querySelector('button').addEventListener('click', () => {
      sources = sources.filter((x) => x.id !== s.id);
      persist();
      renderSources();
    });
    list.appendChild(li);
  }
  $('emptyNote').hidden = sources.length > 0;
  const pct = Math.min(100, Math.round((totalChars(sources) / MAX_TOTAL_CHARS) * 100));
  $('meterFill').style.width = `${pct}%`;
  $('meterText').textContent = TEXT.used(pct);
  $('meter').hidden = sources.length === 0;
  updateBadge();
}

function persist() {
  if (!saveSources(sources)) toast(TEXT.file.storage);
  if (advisor.state !== 'idle') changedDuringTalk = true;
}

// Adds a source, trimming it to the space left. Returns true if added.
function addSource(name, text) {
  const room = MAX_TOTAL_CHARS - totalChars(sources);
  if (room < 200) {
    toast(TEXT.file.full);
    return false;
  }
  if (text.length > room) {
    text = text.slice(0, room);
    toast(TEXT.file.cut);
  }
  sources.push(makeSource(name, text));
  persist();
  return true;
}

$('fileInput').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  let added = 0;
  for (const file of files) {
    toast(`${TEXT.file.reading} ${file.name}`, 20000);
    try {
      const text = await readFileAsText(file);
      if (addSource(file.name, text)) added++;
      else break;
    } catch (err) {
      toast(`${file.name}: ${TEXT.file[err.message] || TEXT.file.failed}`, 6500);
      console.warn(err);
      continue;
    }
  }
  renderSources();
  if (added) toast(`${TEXT.file.added} (${toKhmerDigits(added)})`, 2500);
});

function hidePaste() {
  $('pasteForm').hidden = true;
}
$('pasteBtn').addEventListener('click', () => {
  $('pasteForm').hidden = false;
  $('pasteTitle').focus();
});
$('pasteCancel').addEventListener('click', hidePaste);
$('pasteForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('pasteText').value.trim();
  if (text.length < 20) return toast(TEXT.file.needText);
  const title = $('pasteTitle').value.trim() || text.slice(0, 40).replace(/\s+/g, ' ');
  if (addSource(title, text)) {
    $('pasteTitle').value = '';
    $('pasteText').value = '';
    hidePaste();
    renderSources();
    toast(TEXT.file.added, 2500);
  }
});

updateBadge();

// Stop the microphone if the page is closed.
window.addEventListener('pagehide', () => advisor.stop());
