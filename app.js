'use strict';

const $ = id => document.getElementById(id);
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const MAX_IMG = 1280;          // longest image side in px after resizing
const SAVE_DELAY = 600;        // ms of inactivity before autosave

let db;
let folders = [];
let filter = 'all';            // 'all' or folder id
let query = '';
let view = 'home';
let current = null;            // note being edited
let curFolder = null;          // folder being edited
let dirty = false;
let saveTimer = null;
let lastRange = null;          // last caret position inside the editor
let homeScroll = 0;

/* ---------------- Database (IndexedDB) ---------------- */

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('biljeske', 2);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('notes')) d.createObjectStore('notes', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('folders')) d.createObjectStore('folders', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const store = (s, mode) => db.transaction(s, mode).objectStore(s);
const getAll = s => req(store(s, 'readonly').getAll());
const put = (s, o) => req(store(s, 'readwrite').put(o));
const del = (s, id) => req(store(s, 'readwrite').delete(id));

/* ---------------- Helpers ---------------- */

const folderById = id => folders.find(f => f.id === id);
// lowercase + strip diacritics, so "sesir" finds "šešir"
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

function show(v) {
  view = v;
  for (const id of ['home', 'editor', 'folderEd']) $(id).hidden = id !== v;
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('hr-HR', opts);
}

// Convert old plain-text notes (from the first version) to HTML
function textToHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  return text.split('\n').map(line => {
    div.textContent = line;
    return '<div>' + (div.innerHTML || '<br>') + '</div>';
  }).join('');
}

/* Only keep the tags/attributes the editor itself produces.
   Protects against broken or malicious HTML (paste, future sync). */
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI', 'P', 'DIV', 'BR', 'IMG', 'SPAN']);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH']);

function sanitize(html) {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  const walk = node => {
    for (const el of [...node.childNodes]) {
      if (el.nodeType === Node.TEXT_NODE) continue;
      if (el.nodeType !== Node.ELEMENT_NODE) { el.remove(); continue; }
      const tag = el.tagName.toUpperCase();
      if (DROP.has(tag)) { el.remove(); continue; }
      walk(el);
      if (!ALLOWED.has(tag)) { el.replaceWith(...el.childNodes); continue; }
      for (const a of [...el.attributes]) {
        const keep =
          (tag === 'IMG' && a.name === 'src' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(a.value)) ||
          (tag === 'IMG' && a.name === 'alt') ||
          (tag === 'UL' && a.name === 'class' && a.value === 'todo') ||
          (tag === 'LI' && a.name === 'data-checked' && a.value === 'true');
        if (!keep) el.removeAttribute(a.name);
      }
      if (tag === 'IMG' && !el.hasAttribute('src')) el.remove();
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

/* ---------------- Home: list ---------------- */

function renderChips() {
  const chips = $('chips');
  chips.innerHTML = '';
  const mk = (label, color, active, onclick, cls = '') => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'chip ' + cls + (active ? ' active' : '');
    if (color) {
      const d = document.createElement('span');
      d.className = 'dot';
      d.style.background = color;
      c.append(d);
    }
    c.append(label);
    c.onclick = onclick;
    chips.append(c);
  };
  mk('Sve', null, filter === 'all', () => { filter = 'all'; render(); });
  for (const f of folders) {
    const active = filter === f.id;
    // tapping the active folder again opens its settings
    mk(active ? f.name + ' ✎' : f.name, f.color, active, () => {
      if (active) openFolderEd(f); else { filter = f.id; render(); }
    });
  }
  mk('+ Mapa', null, false, () => openFolderEd(), 'add');
}

async function render() {
  folders = (await getAll('folders')).sort((a, b) => a.name.localeCompare(b.name, 'hr'));
  if (filter !== 'all' && !folderById(filter)) filter = 'all';
  renderChips();

  let notes = await getAll('notes');
  const q = norm(query.trim());
  if (q) notes = notes.filter(n => norm(n.title + ' ' + n.body).includes(q));   // search covers all folders
  else if (filter !== 'all') notes = notes.filter(n => n.folderId === filter);
  notes.sort((a, b) => b.updated - a.updated);

  const list = $('list');
  list.innerHTML = '';
  if (!notes.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = q ? 'Ništa nije pronađeno.' : 'Još nema bilješki. Dodaj prvu tipkom +';
    list.append(p);
    return;
  }
  for (const n of notes) {
    const f = folderById(n.folderId);
    const el = document.createElement('article');
    el.className = 'note';
    if (f) el.style.borderLeftColor = f.color;

    const t = document.createElement('b');
    t.textContent = n.title || 'Bez naslova';
    const p = document.createElement('div');
    p.className = 'preview';
    p.textContent = (n.body || '').replace(/\s+/g, ' ').slice(0, 140);
    const m = document.createElement('div');
    m.className = 'meta';
    const parts = [formatDate(n.updated)];
    if (f) parts.push(f.name);
    if (n.images) parts.push(n.images === 1 ? '1 slika' : n.images + ' slike');
    m.textContent = parts.join(' · ');

    el.append(t);
    if (p.textContent) el.append(p);
    el.append(m);
    el.onclick = () => openEditor(n);
    list.append(el);
  }
}

/* ---------------- Editor ---------------- */

function openEditor(n) {
  homeScroll = window.scrollY;
  current = n
    ? { ...n }
    : { id: crypto.randomUUID(), title: '', body: '', html: '', images: 0,
        folderId: filter === 'all' ? null : filter, updated: Date.now() };
  dirty = false;
  lastRange = null;

  $('title').value = current.title || '';
  $('body').innerHTML = sanitize(current.html != null ? current.html : textToHtml(current.body));
  $('saveState').textContent = '';

  const sel = $('folderSel');
  sel.innerHTML = '<option value="">Bez mape</option>';
  for (const f of folders) {
    const o = document.createElement('option');
    o.value = f.id;
    o.textContent = f.name;
    sel.append(o);
  }
  sel.value = current.folderId || '';

  history.pushState({ v: 'editor' }, '');
  show('editor');
  window.scrollTo(0, 0);
  if (!n) $('title').focus();
}

function markDirty() {
  dirty = true;
  $('saveState').textContent = '…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrent, SAVE_DELAY);
}

async function saveCurrent() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!current) return;
  const bodyEl = $('body');
  const html = sanitize(bodyEl.innerHTML);
  const text = bodyEl.innerText.trim();
  const images = bodyEl.querySelectorAll('img').length;
  const title = $('title').value.trim();
  current = { ...current, title, html, body: text, images,
              folderId: $('folderSel').value || null, updated: Date.now() };
  dirty = false;
  if (!title && !text && !images) {        // empty note is not kept
    await del('notes', current.id);
    $('saveState').textContent = '';
    return;
  }
  await put('notes', current);
  $('saveState').textContent = 'Spremljeno';
}

async function flushSave() {
  if (current && dirty) await saveCurrent();
}

/* Selection helpers */
function selectionElement() {
  const sel = getSelection();
  if (!sel.rangeCount) return null;
  const n = sel.anchorNode;
  const el = n && (n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement);
  return el && $('body').contains(el) ? el : null;
}

// Make sure the caret is inside the editor before running a command
function ensureCaret() {
  const body = $('body');
  if (selectionElement()) return;
  body.focus();
  const sel = getSelection();
  sel.removeAllRanges();
  if (lastRange && body.contains(lastRange.startContainer)) {
    sel.addRange(lastRange);
  } else {
    const r = document.createRange();
    r.selectNodeContents(body);
    r.collapse(false);
    sel.addRange(r);
  }
}

function toggleTodo() {
  let li = selectionElement()?.closest('li');
  if (li && li.parentElement.tagName === 'UL') {
    li.parentElement.classList.toggle('todo');
  } else {
    document.execCommand('insertUnorderedList');
    li = selectionElement()?.closest('li');
    if (li && li.parentElement.tagName === 'UL') li.parentElement.classList.add('todo');
  }
}

function toggleHeading() {
  const inHeading = selectionElement()?.closest('h1,h2,h3');
  document.execCommand('formatBlock', false, inHeading ? 'div' : 'h2');
}

function runCmd(cmd) {
  if (cmd === 'image') { $('imgInput').click(); return; }
  ensureCaret();
  switch (cmd) {
    case 'bold': document.execCommand('bold'); break;
    case 'italic': document.execCommand('italic'); break;
    case 'heading': toggleHeading(); break;
    case 'ul': document.execCommand('insertUnorderedList'); break;
    case 'ol': document.execCommand('insertOrderedList'); break;
    case 'todo': toggleTodo(); break;
  }
  markDirty();
  updateToolbar();
}

function updateToolbar() {
  const el = selectionElement();
  const ul = el?.closest('ul');
  const state = {
    bold: !!el && document.queryCommandState('bold'),
    italic: !!el && document.queryCommandState('italic'),
    heading: !!el?.closest('h1,h2,h3'),
    ul: !!ul && !ul.classList.contains('todo'),
    ol: !!el?.closest('ol'),
    todo: !!ul && ul.classList.contains('todo'),
  };
  for (const b of $('toolbar').querySelectorAll('button[data-cmd]'))
    b.classList.toggle('on', !!state[b.dataset.cmd]);
}

/* Images: shrink before storing, so notes stay small */
async function fileToDataUrl(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMG / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';               // JPEG has no transparency
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return c.toDataURL('image/jpeg', 0.82);
}

async function insertImage(file) {
  let url;
  try {
    url = await fileToDataUrl(file);
  } catch {
    alert('Ova slika se ne može učitati.');
    return;
  }
  ensureCaret();
  document.execCommand('insertHTML', false, '<img src="' + url + '" alt=""><br>');
  markDirty();
}

/* ---------------- Folder editor ---------------- */

function openFolderEd(f) {
  curFolder = f ? { ...f } : { id: crypto.randomUUID(), name: '', color: COLORS[5] };
  $('fTitle').textContent = f ? 'Uredi mapu' : 'Nova mapa';
  $('fName').value = curFolder.name;
  $('fDel').hidden = !f;
  drawSwatches();
  history.pushState({ v: 'folderEd' }, '');
  show('folderEd');
  if (!f) $('fName').focus();
}

function drawSwatches() {
  const box = $('swatches');
  box.innerHTML = '';
  for (const c of COLORS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw' + (c === curFolder.color ? ' sel' : '');
    b.style.background = c;
    b.setAttribute('aria-label', 'Boja ' + c);
    b.onclick = () => { curFolder.color = c; drawSwatches(); };
    box.append(b);
  }
}

/* ---------------- Events ---------------- */

// Every screen change goes through browser history,
// so the phone's back gesture returns to the list instead of closing the app.
window.addEventListener('popstate', async () => {
  if (view === 'editor') await flushSave();
  current = null;
  show('home');
  await render();
  window.scrollTo(0, homeScroll);
});

$('newBtn').onclick = () => openEditor();
$('doneBtn').onclick = () => history.back();
$('delBtn').onclick = async () => {
  if (!confirm('Obrisati bilješku?')) return;
  await del('notes', current.id);
  current = null;
  dirty = false;
  history.back();
};

$('search').addEventListener('input', e => { query = e.target.value; render(); });

$('title').addEventListener('input', markDirty);
$('title').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); $('body').focus(); }
});
$('folderSel').addEventListener('change', markDirty);

const bodyEl = $('body');
bodyEl.addEventListener('input', e => {
  // a new checklist item should start unchecked
  if (e.inputType === 'insertParagraph') selectionElement()?.closest('li')?.removeAttribute('data-checked');
  // clear leftover <br> so the placeholder shows again
  if (!bodyEl.textContent && !bodyEl.querySelector('img,li')) bodyEl.innerHTML = '';
  markDirty();
});

// tap on a checkbox toggles it
bodyEl.addEventListener('click', e => {
  const li = e.target.closest?.('ul.todo > li');
  if (!li || e.target !== li) return;
  if (e.clientX - li.getBoundingClientRect().left > 32) return;
  e.preventDefault();
  if (li.dataset.checked === 'true') li.removeAttribute('data-checked');
  else li.dataset.checked = 'true';
  markDirty();
});

// paste as plain text (keeps notes clean)
bodyEl.addEventListener('paste', e => {
  const text = e.clipboardData?.getData('text/plain');
  if (text == null) return;
  e.preventDefault();
  document.execCommand('insertText', false, text);
});

document.addEventListener('selectionchange', () => {
  if (view !== 'editor' || !selectionElement()) return;
  lastRange = getSelection().getRangeAt(0).cloneRange();
  updateToolbar();
});

// keep focus in the editor when tapping toolbar buttons
$('toolbar').addEventListener('mousedown', e => e.preventDefault());
$('toolbar').addEventListener('click', e => {
  const b = e.target.closest('button[data-cmd]');
  if (b) runCmd(b.dataset.cmd);
});

$('imgInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (file) await insertImage(file);
});

// save immediately when the app goes to the background
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushSave();
});

// move the toolbar above the on-screen keyboard (iOS)
if (window.visualViewport) {
  const vv = window.visualViewport;
  const updateKb = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb + 'px');
  };
  vv.addEventListener('resize', updateKb);
  vv.addEventListener('scroll', updateKb);
}

$('fCancel').onclick = () => history.back();
$('fSave').onclick = async () => {
  curFolder.name = $('fName').value.trim();
  if (!curFolder.name) { alert('Upiši ime mape.'); return; }
  await put('folders', curFolder);
  filter = curFolder.id;
  history.back();
};
$('fDel').onclick = async () => {
  if (!confirm('Obrisati mapu? Bilješke u njoj ostaju, bez mape.')) return;
  for (const n of await getAll('notes'))
    if (n.folderId === curFolder.id) { n.folderId = null; await put('notes', n); }
  await del('folders', curFolder.id);
  filter = 'all';
  history.back();
};

/* ---------------- Start ---------------- */

(async () => {
  db = await openDB();
  // ask the browser not to auto-delete our data when storage is low
  navigator.storage?.persist?.().catch(() => {});
  show('home');
  await render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
