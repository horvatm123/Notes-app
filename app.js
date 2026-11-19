'use strict';

const $ = id => document.getElementById(id);
// folder colors (bright); OLD_COLORS are the softer ones from v1.0, converted on start
const COLORS = ['#ff2d3d', '#ff7a00', '#ffc400', '#00c853', '#00b8d4', '#2f6bff', '#9b3dff', '#ff2d8a'];
const OLD_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const ACCENTS = [['blue', '#2f6bff', 'Plava'], ['purple', '#8a3dff', 'Ljubičasta'], ['pink', '#f0287a', 'Ružičasta'],
  ['red', '#ee2b3b', 'Crvena'], ['orange', '#ff6a00', 'Narančasta'], ['green', '#00a651', 'Zelena'], ['teal', '#009d9a', 'Tirkizna']];
const DEFAULT_SETTINGS = { theme: 'system', accent: 'blue', font: 'dm', size: 'l' };
// formatting options; names map to CSS variables (--t-*, --h-*) so dark mode can adjust them
const TEXT_COLORS = [['red', 'Crvena'], ['blue', 'Plava'], ['green', 'Zelena'], ['yellow', 'Žuta'], ['orange', 'Narančasta'], ['purple', 'Ljubičasta']];
const HL_COLORS = TEXT_COLORS;
const UL_COLORS = [['fg', 'Obična'], ...TEXT_COLORS];
const SIZES = [['s', 'Mala', '.85em'], ['', 'Normalna', '1em'], ['l', 'Velika', '1.25em'], ['xl', 'Najveća', '1.55em']];
const LISTS = [['bullet', '•', 'Točke'], ['number', '1.', 'Brojevi'], ['dash', '–', 'Crtice'], ['arrow', '→', 'Strelice']];
const STYLE_VALUES = {
  'data-c': new Set(TEXT_COLORS.map(c => c[0])),
  'data-h': new Set(HL_COLORS.map(c => c[0])),
  'data-u': new Set(UL_COLORS.map(c => c[0])),
  'data-fs': new Set(['s', 'l', 'xl']),
};
const APP_VERSION = '1.2.1';
const MAX_IMG = 1280;          // longest image side in px after resizing
const SAVE_DELAY = 500;        // ms of inactivity before autosave
const KDF_ITERATIONS = 600000; // PBKDF2 rounds: makes PIN guessing slow
const LEGACY_ITERATIONS = 250000; // rounds used by the old text password (v2)
const PIN_LENGTH = 6;
const LOCK_AFTER_MS = 60000;   // an open locked note closes if the app was hidden longer than this

/* ---------------- Icons (inline SVG) ---------------- */

const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  list: '<rect x="4" y="4.5" width="16" height="6" rx="1.5"/><rect x="4" y="13.5" width="16" height="6" rx="1.5"/>',
  dots: '<circle cx="12" cy="5.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.7" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  share: '<path d="M12 4v11M8 8l4-4 4 4M5 14v5h14v-5"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 16V5a1 1 0 0 1 1-1h9"/>',
  folder: '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  notes: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="M20.5 16.5l-5-5L7 19"/>',
  list: '<circle cx="5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="5" cy="17.5" r="1.2" fill="currentColor" stroke="none"/><path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20"/>',
  checklist: '<rect x="3.5" y="4" width="6.5" height="6.5" rx="1.6"/><path d="M5.2 7.3l1.3 1.3 2-2.3"/><rect x="3.5" y="13.5" width="6.5" height="6.5" rx="1.6"/><path d="M13.5 7.3H20.5M13.5 16.8H20.5"/>',
  highlight: '<path d="M14.5 4.5l5 5-8 8H7v-4.5z"/><path d="M12 7l5 5"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6.5 9.5V20h11V9.5"/><path d="M10 20v-5h4v5"/>',
  folders: '<path d="M3 8.5a2 2 0 0 1 2-2h3.5l1.8 1.8H16a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M6.5 4.5h3l1.5 1.5h7a2.5 2.5 0 0 1 2.5 2.5v6"/>',
  // gear (same shape as the Lucide "settings" icon)
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 18.5z"/>',
  apps: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><path d="M16.5 13.5v6M13.5 16.5h6"/>',
  phone: '<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M10.5 18h3"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.2-1.5-1.2-2.6 0-.9.7-1.4 1.6-1.4h2.1a4.2 4.2 0 0 0 4.2-4.2C20.5 6.5 16.7 3.5 12 3.5z"/><circle cx="7.8" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>',
};
const icon = name =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

/* ---------------- State ---------------- */

let db;
let folders = [];
let filter = 'home';           // 'home' (no folder), 'all' or folder id; the app always starts at home
let query = '';
let searchOpen = false;
let view = 'home';
let viewMode = loadPref('viewMode', 'list');   // 'list' or 'grid'
let settings = loadSettings();
let current = null;            // note being edited (plain text, memory only)
let currentKey = null;         // key of the open locked note (memory only, never stored)
let openFolderId = null;       // locked folder that is currently unlocked
let folderKey = null;          // its key (memory only); forgotten when leaving the folder
let animateList = true;        // next render animates the cards in
let dirty = false;
let saveTimer = null;
let lastRange = null;          // last caret position inside the editor
let homeScroll = 0;
let hiddenAt = 0;
let sheetOpen = false;
let sheetOnClose = null;
let drawerOpen = false;

function loadPref(key, def) {
  try { return localStorage.getItem(key) || def; } catch { return def; }
}
function savePref(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage not available */ }
}

/* ---------------- Settings (theme, accent color, font, text size, date) ---------------- */

function loadSettings() {
  let s = {};
  try { s = JSON.parse(loadPref('settings', '{}')) || {}; } catch { /* ignore */ }
  if (s.font === 'sans') s.font = 'system';       // v1.1.0 name of the system font
  delete s.dateMode;                             // removed in v1.2.0: cards always show the creation date
  return { ...DEFAULT_SETTINGS, ...s };
}

const darkQuery = matchMedia('(prefers-color-scheme: dark)');

function applySettings() {
  const r = document.documentElement;
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && darkQuery.matches);
  r.dataset.theme = dark ? 'dark' : 'light';
  r.dataset.font = settings.font;
  r.dataset.size = settings.size;
  r.dataset.accent = settings.accent;
  // color of the phone's status bar
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0e0e11' : '#f4f5f9';
}

function setSetting(key, value) {
  settings[key] = value;
  savePref('settings', JSON.stringify(settings));
  applySettings();
}
darkQuery.addEventListener?.('change', () => { if (settings.theme === 'system') applySettings(); });

/* ---------------- Database (IndexedDB) ---------------- */

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('biljeske', 3);
    r.onupgradeneeded = () => {
      const d = r.result;
      for (const s of ['notes', 'folders', 'meta'])
        if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const store = (s, mode) => db.transaction(s, mode).objectStore(s);
const getAll = s => req(store(s, 'readonly').getAll());
const getOne = (s, id) => req(store(s, 'readonly').get(id));
const put = (s, o) => req(store(s, 'readwrite').put(o));
const del = (s, id) => req(store(s, 'readwrite').delete(id));

async function updateNote(id, patch) {
  const n = await getOne('notes', id);
  if (!n) return;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete n[k]; else n[k] = v;
  }
  await put('notes', n);
}

/* ---------------- Helpers ---------------- */

const folderById = id => folders.find(f => f.id === id);
// lowercase + strip diacritics, so "sesir" finds "šešir"
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function show(v) {
  const changed = view !== v;
  view = v;
  for (const id of ['home', 'editor']) {
    const e = $(id);
    e.hidden = id !== v;
    if (id === v && changed) restartAnimation(e, 'enter');
  }
}

// "19. 11.", with the year when it is not the current one
function formatDay(ts) {
  const d = new Date(ts);
  let date = `${d.getDate()}. ${d.getMonth() + 1}.`;
  if (d.getFullYear() !== new Date().getFullYear()) date += ` ${d.getFullYear()}.`;
  return date;
}
// "19. 11. u 14:35"
function formatDate(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${formatDay(ts)} u ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// cards show when the note was created; v1.0 notes have no creation time, so their last edit is used
const createdOf = n => n.created || n.updated;

// Convert old plain-text notes (from the first version) to HTML
function textToHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  return text.split('\n').map(line => {
    div.textContent = line;
    return '<div>' + (div.innerHTML || '<br>') + '</div>';
  }).join('');
}
const noteHtml = n => (n.html != null ? n.html : textToHtml(n.body));
const countImages = html => (html.match(/<img\b/gi) || []).length;

/* Only keep the tags/attributes the editor itself produces.
   Protects against broken or malicious HTML (paste, future sync). */
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI', 'P', 'DIV', 'BR', 'IMG', 'SPAN']);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH']);

function sanitize(html) {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  const walk = node => {
    for (const e of [...node.childNodes]) {
      if (e.nodeType === Node.TEXT_NODE) continue;
      if (e.nodeType !== Node.ELEMENT_NODE) { e.remove(); continue; }
      const tag = e.tagName.toUpperCase();
      if (DROP.has(tag)) { e.remove(); continue; }
      walk(e);
      if (!ALLOWED.has(tag)) { e.replaceWith(...e.childNodes); continue; }
      for (const a of [...e.attributes]) {
        const keep =
          (tag === 'IMG' && a.name === 'src' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(a.value)) ||
          (tag === 'IMG' && a.name === 'alt') ||
          (tag === 'UL' && a.name === 'class' && /^(todo|dash|arrow)$/.test(a.value)) ||
          (tag === 'SPAN' && STYLE_VALUES[a.name]?.has(a.value)) ||
          (tag === 'LI' && a.name === 'data-checked' && a.value === 'true');
        if (!keep) e.removeAttribute(a.name);
      }
      if (tag === 'IMG' && !e.hasAttribute('src')) e.remove();
      else if (tag === 'SPAN' && !e.attributes.length) e.replaceWith(...e.childNodes);   // plain span adds nothing
    }
  };
  walk(doc.body);
  return doc.body.innerHTML.replace(/\u200B/g, '');   // remove caret helper characters
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- Navigation ----------------
   Every screen/overlay is a "layer" with its own browser-history entry,
   so the phone's back gesture closes the top layer instead of the app. */

const layers = [];
let popWaiters = [];

function pushLayer(close) {
  layers.push(close);
  history.pushState({ depth: layers.length }, '');
}

// close the top layer; resolves when it is closed
function back() {
  return new Promise(res => { popWaiters.push(res); history.back(); });
}

window.addEventListener('popstate', async () => {
  const close = layers.pop();
  if (close) await close();
  const waiters = popWaiters;
  popWaiters = [];
  waiters.forEach(r => r());
});

function updateScrim() {
  $('scrim').classList.toggle('open', sheetOpen || drawerOpen || pinOpen);
}

/* ---------------- Encryption ----------------
   Password -> key with PBKDF2, note content encrypted with AES-GCM (256 bit).
   One password for all locked notes. The key only lives in memory. */

const te = new TextEncoder();
const td = new TextDecoder();

async function deriveKey(password, salt, iterations = KDF_ITERATIONS) {
  const base = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encryptJSON(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));   // new random IV for every save
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj)));
  return { iv, data };
}

async function decryptJSON(key, enc) {
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: enc.iv }, key, enc.data);
  return JSON.parse(td.decode(buf));
}

// returns the key if the password is right, otherwise null
async function tryPassword(password) {
  const lock = await getOne('meta', 'lock');
  if (!lock) return null;
  const key = await deriveKey(password, lock.salt, lock.iterations || LEGACY_ITERATIONS);
  try {
    await decryptJSON(key, lock.check);   // AES-GCM fails on a wrong key
    return key;
  } catch {
    return null;
  }
}

/* ---------------- Bottom sheet ---------------- */

function showSheet(build, onClose = null) {
  const sh = $('sheet');
  sh.replaceChildren();
  build(sh);
  sheetOnClose = onClose;
  if (sheetOpen) restartAnimation(sh, 'swap');   // content changes inside an open sheet: fade it in
  if (!sheetOpen) {
    sheetOpen = true;
    sh.classList.add('open');
    updateScrim();
    pushLayer(() => {
      sheetOpen = false;
      sh.classList.remove('open');
      updateScrim();
      document.activeElement?.blur();
      const cb = sheetOnClose;
      sheetOnClose = null;
      cb?.();
    });
  }
  sh.scrollTop = 0;
}
const closeSheet = () => (sheetOpen ? back() : Promise.resolve());

function sheetTitle(text) { return el('h3', null, text); }

// items: { icon | dot, label, onClick, danger, accent, checked, sub }
function menuList(items) {
  const box = el('div', 'menu');
  for (const it of items) {
    const b = el('button', 'menu-item' + (it.danger ? ' danger' : '') + (it.accent ? ' accent' : ''));
    b.type = 'button';
    if (it.dot) {
      const d = el('span', 'dot');
      d.style.background = it.dot;
      b.append(d);
    } else {
      b.insertAdjacentHTML('beforeend', icon(it.icon));
    }
    b.append(el('span', null, it.label));
    if (it.sub) b.append(el('span', 'sub', it.sub));
    if (it.checked) b.insertAdjacentHTML('beforeend', icon('check').replace('<svg', '<svg class="check"'));
    b.onclick = it.onClick;
    box.append(b);
  }
  return box;
}

function passwordSheet({ title, text, fields, confirmLabel, isNew, onSubmit }) {
  return new Promise(resolve => {
    let result = null;
    showSheet(sh => {
      const form = el('form', 'pw-form');
      form.append(el('h3', null, title));
      if (text) form.append(el('p', null, text));
      const inputs = fields.map(ph => {
        const i = el('input');
        i.type = 'password';
        i.placeholder = ph;
        i.autocomplete = isNew ? 'new-password' : 'current-password';
        return i;
      });
      const err = el('p', 'error');
      const cancel = el('button', 'secondary', 'Odustani');
      cancel.type = 'button';
      cancel.onclick = () => back();
      const ok = el('button', null, confirmLabel);
      ok.type = 'submit';
      const actions = el('div', 'actions');
      actions.append(cancel, ok);
      form.append(...inputs, err, actions);
      form.onsubmit = async e => {
        e.preventDefault();
        ok.disabled = true;
        err.textContent = '';
        try {
          const r = await onSubmit(inputs.map(i => i.value));
          if (typeof r === 'string') { err.textContent = r; inputs[0].select(); return; }
          result = r;
          await closeSheet();
        } finally {
          ok.disabled = false;
        }
      };
      sh.append(form);
      setTimeout(() => inputs[0].focus(), 60);
    }, () => resolve(result));
  });
}

// Yes/no question in the bottom sheet; resolves true when confirmed
function confirmSheet({ title, text, confirmLabel, danger }) {
  return new Promise(resolve => {
    let ok = false;
    showSheet(sh => {
      const box = el('div', 'pw-form confirm');
      box.append(el('h3', null, title));
      if (text) box.append(el('p', null, text));
      const cancel = el('button', 'secondary', 'Odustani');
      cancel.type = 'button';
      cancel.onclick = () => back();
      const yes = el('button', danger ? 'danger-fill' : null, confirmLabel);
      yes.type = 'button';
      yes.onclick = () => { ok = true; back(); };
      const actions = el('div', 'actions');
      actions.append(cancel, yes);
      box.append(actions);
      sh.append(box);
    }, () => resolve(ok));
  });
}

/* ---------------- PIN dialog (iPhone style) ---------------- */

let pinOpen = false;
let pinStep = null;          // { title, text, onPin(pin) }
let pinValue = '';
let pinBusy = false;
let pinResult = null;

function buildPinPad() {
  const pad = $('pinPad');
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'cancel', '0', 'del']) {
    const b = el('button');
    b.type = 'button';
    if (k === 'cancel') {
      b.className = 'text';
      b.textContent = 'Odustani';
      b.onclick = () => back();
    } else if (k === 'del') {
      b.className = 'text del';
      b.textContent = '⌫';
      b.setAttribute('aria-label', 'Obriši znamenku');
      b.onclick = () => pinInput('del');
    } else {
      b.textContent = k;
      b.dataset.d = k;
      b.onclick = () => pinInput(k);
    }
    pad.append(b);
  }
}

function drawPinDots() {
  const box = $('pinDots');
  box.replaceChildren();
  for (let i = 0; i < PIN_LENGTH; i++) box.append(el('span', i < pinValue.length ? 'on' : ''));
}

function restartAnimation(e, cls) {
  e.classList.remove('shake', 'swap', 'enter');
  void e.offsetWidth;          // forces the browser to restart the animation
  e.classList.add(cls);
}

function setPinStep(step, error = '') {
  pinStep = step;
  pinValue = '';
  $('pinTitle').textContent = step.title;
  $('pinText').textContent = step.text || '';
  $('pinError').textContent = error;
  drawPinDots();
}

// Shows the dialog; resolves with the value of the last step, or null if cancelled
function openPin(step) {
  return new Promise(resolve => {
    pinResult = null;
    setPinStep(step);
    $('pinCard').classList.remove('shake', 'swap');
    pinOpen = true;
    $('pin').classList.add('open');
    updateScrim();
    document.activeElement?.blur();     // hide the on-screen keyboard
    pushLayer(() => {
      pinOpen = false;
      $('pin').classList.remove('open');
      updateScrim();
      pinValue = '';
      drawPinDots();
      resolve(pinResult);
    });
  });
}

// onPin returns { done: value } | { error } | { next: step } | { next, error }
async function pinInput(d) {
  if (!pinOpen || pinBusy) return;
  if (d === 'del') {
    pinValue = pinValue.slice(0, -1);
    drawPinDots();
    return;
  }
  if (pinValue.length >= PIN_LENGTH) return;
  pinValue += d;
  $('pinError').textContent = '';
  drawPinDots();
  if (pinValue.length < PIN_LENGTH) return;

  pinBusy = true;
  try {
    await new Promise(r => setTimeout(r, 150));   // let the last dot show
    const r = await pinStep.onPin(pinValue);
    if ('done' in r) {
      pinResult = r.done;
      await back();
    } else {
      setPinStep(r.next || pinStep, r.error || '');
      restartAnimation($('pinCard'), r.error ? 'shake' : 'swap');
    }
  } finally {
    pinBusy = false;
  }
}

// New PIN in two steps. Resolves with { key, record }; the caller saves the record.
function setupPin() {
  const first = {
    title: 'Postavi PIN',
    text: `Odaberi PIN od ${PIN_LENGTH} znamenki. Isti PIN vrijedi za sve zaključane bilješke. ` +
          'Ako ga zaboraviš, zaključane bilješke se ne mogu vratiti.',
    onPin: async pin => ({
      next: {
        title: 'Ponovi PIN',
        text: 'Upiši isti PIN još jednom.',
        onPin: async again => {
          if (again !== pin) return { next: first, error: 'PIN-ovi se ne podudaraju. Pokušaj ponovno.' };
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const key = await deriveKey(pin, salt);
          const check = await encryptJSON(key, { ok: true });
          return { done: { key, record: { id: 'lock', kind: 'pin', salt, iterations: KDF_ITERATIONS, check } } };
        },
      },
    }),
  };
  return openPin(first);
}

function askPin(title) {
  return openPin({
    title,
    text: 'Upiši PIN',
    onPin: async pin => {
      const key = await tryPassword(pin);
      return key ? { done: key } : { error: 'Pogrešan PIN' };
    },
  });
}

// Notes locked with the old text password (v2) are re-encrypted with a new PIN
async function migrateToPin() {
  const oldKey = await passwordSheet({
    title: 'Prijelaz na PIN',
    text: 'Zaključavanje sada koristi PIN. Upiši staru lozinku još jednom, a zatim postavi novi PIN.',
    fields: ['Stara lozinka'],
    confirmLabel: 'Dalje',
    onSubmit: async ([pw]) => (await tryPassword(pw)) || 'Pogrešna lozinka.',
  });
  if (!oldKey) return null;
  const pin = await setupPin();
  if (!pin) return null;
  const updated = [];
  for (const n of (await getAll('notes')).filter(x => x.locked))
    updated.push({ ...n, enc: await encryptJSON(pin.key, await decryptJSON(oldKey, n.enc)) });
  // one transaction: either everything switches to the new PIN or nothing does
  await new Promise((res, rej) => {
    const t = db.transaction(['notes', 'meta'], 'readwrite');
    for (const n of updated) t.objectStore('notes').put(n);
    t.objectStore('meta').put(pin.record);
    t.oncomplete = res;
    t.onerror = () => rej(t.error);
  });
  toast('PIN je postavljen');
  return pin.key;
}

// Key for locked notes. allowSetup: create a PIN if none exists yet.
async function getLockKey(title, allowSetup) {
  let lock = await getOne('meta', 'lock');
  if (lock && lock.kind !== 'pin') {
    if ((await getAll('notes')).some(n => n.locked)) return migrateToPin();
    await del('meta', 'lock');           // old password protects nothing, start with a PIN
    lock = null;
  }
  if (lock) return askPin(title);
  if (!allowSetup) return null;
  const pin = await setupPin();
  if (!pin) return null;
  await put('meta', pin.record);
  return pin.key;
}

/* ---------------- Home ---------------- */

function setFilter(f) {
  if (f !== filter) {
    animateList = true;
    // leaving an unlocked "locked folder" forgets its key
    if (openFolderId && f !== openFolderId) { openFolderId = null; folderKey = null; }
  }
  filter = f;
}

// Croatian plural: 1 bilješka, 2 bilješke, 5 bilješki
function plural(n, one, few, many) {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return `${n} ${one}`;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}
const notesCount = n => plural(n, 'bilješka', 'bilješke', 'bilješki');

// dark or white text, whichever is easier to read on this color
function textOn(hex) {
  const v = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255);
  return lum > 170 ? '#111114' : '#ffffff';
}

// time of the last writing in a folder; the most active folder comes first
function folderActivity(f, notes) {
  let t = f.created || 0;
  for (const n of notes) if (n.folderId === f.id && n.updated > t) t = n.updated;
  return t;
}

async function loadFolders(notes) {
  notes = notes || await getAll('notes');
  const list = await getAll('folders');
  const act = new Map(list.map(f => [f.id, folderActivity(f, notes)]));
  folders = list.sort((a, b) => act.get(b.id) - act.get(a.id) || a.name.localeCompare(b.name, 'hr'));
  return notes;
}

// notes of a locked folder stay hidden (also in "Sve" and in search) until the folder is opened with the PIN
const folderHidden = id => {
  const f = id && folderById(id);
  return !!(f && f.locked && openFolderId !== f.id);
};

// switch to home, all or a folder; a locked folder asks for the PIN first
async function selectFilter(id) {
  const f = folderById(id);
  if (f && f.locked && openFolderId !== id) {
    const key = await getLockKey(`Mapa „${f.name}”`, false);
    if (!key) return false;
    setFilter(id);
    openFolderId = id;
    folderKey = key;
    return true;
  }
  setFilter(id);
  return true;
}
const goTo = async id => { if (await selectFilter(id)) render(); };

function renderHeader() {
  const f = folderById(filter);
  const h = $('homeTitle');
  h.textContent = f ? f.name : filter === 'all' ? 'Sve bilješke' : 'Bilješke';
  if (f?.locked) h.insertAdjacentHTML('beforeend', `<span class="lock-ic">${icon('unlock')}</span>`);
  const next = viewMode === 'grid' ? 'list' : 'grid';
  $('viewBtn').innerHTML = icon(next);
  $('viewBtn').setAttribute('aria-label', next === 'grid' ? 'Prikaz mreže' : 'Prikaz popisa');
  $('folderMenuBtn').hidden = !f;
  renderTabs();
}

function renderTabs() {
  const box = $('tabs');
  const scroll = box.scrollLeft;
  box.replaceChildren();
  const tab = (id, label) => {
    const b = el('button', 'tab' + (filter === id ? ' active' : ''));
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.onclick = () => goTo(id);
    box.append(b);
    return b;
  };
  const home = tab('home', 'Bilješke izvan mapa');
  home.classList.add('home');
  home.innerHTML = icon('home');
  for (const f of folders) {
    const b = tab(f.id, 'Mapa ' + f.name);
    b.style.setProperty('--tab-color', f.color);
    b.style.setProperty('--tab-fg', textOn(f.color));
    const d = el('span', 'dot');
    d.style.background = f.color;
    b.append(d, el('span', 'label', f.name));
    if (f.locked) b.insertAdjacentHTML('beforeend', `<span class="mini">${icon(openFolderId === f.id ? 'unlock' : 'lock')}</span>`);
  }
  const all = tab('all', 'Sve bilješke');      // last, pushed to the right edge
  all.classList.add('all');
  all.textContent = 'Sve';
  box.scrollLeft = scroll;
  const active = box.querySelector('.active');
  if (active) {
    // scroll the active tab into view inside the row only (not the whole page)
    const l = active.offsetLeft - 10, r = active.offsetLeft + active.offsetWidth + 34 - box.clientWidth;
    if (box.scrollLeft > l) box.scrollLeft = l;
    else if (box.scrollLeft < r) box.scrollLeft = r;
  }
}

async function render() {
  const all = await loadFolders();
  if (filter !== 'all' && filter !== 'home' && (!folderById(filter) || folderHidden(filter))) setFilter('home');
  renderHeader();

  let notes = all.filter(n => !folderHidden(n.folderId));
  const q = searchOpen ? query.trim() : '';
  let scores = null;
  if (q) {                                    // search covers all folders
    scores = searchNotes(notes, q);
    notes = notes.filter(n => scores.has(n.id));
    notes.sort((a, b) => scores.get(b.id) - scores.get(a.id) || b.updated - a.updated);
  } else {
    if (filter === 'home') notes = notes.filter(n => !n.folderId);
    else if (filter !== 'all') notes = notes.filter(n => n.folderId === filter);
    notes.sort((a, b) => b.updated - a.updated);   // last edited on top
  }

  const list = $('list');
  list.className = 'list mode-' + viewMode;
  list.replaceChildren();
  const anim = animateList;
  animateList = false;
  if (!notes.length) {
    const msg = q ? 'Ništa nije pronađeno.'
      : searchOpen ? 'Upiši pojam za pretragu.'
      : filter === 'home' ? 'Nema bilješki izvan mapa. Dodaj novu tipkom +'
      : filter === 'all' ? 'Još nema bilješki. Dodaj prvu tipkom +'
      : 'Ova mapa je prazna. Dodaj bilješku tipkom +';
    list.append(el('p', 'empty', msg));
    return;
  }
  const showFolder = filter === 'all' || !!q;
  notes.forEach((n, i) => {
    const card = viewMode === 'grid' ? gridCard(n, showFolder) : listCard(n, showFolder);
    if (anim && i < 14) {          // only the first cards, the rest are below the screen anyway
      card.classList.add('anim');
      card.style.setProperty('--i', i);
    }
    list.append(card);
  });
}

function moreButton(n) {
  const b = el('button', 'icon-btn more');
  b.type = 'button';
  b.innerHTML = icon('dots');
  b.setAttribute('aria-label', 'Više opcija');
  b.onclick = e => { e.stopPropagation(); openNoteMenu(n); };
  return b;
}

function metaLine(n, f, showFolder, withDot) {
  const m = el('div', 'meta');
  const date = el('span', null, formatDate(createdOf(n)));
  if (f && withDot) {
    const d = el('span', 'dot');
    d.style.background = f.color;
    date.prepend(d);
  }
  m.append(date);
  if (f && showFolder) m.append(el('span', null, f.name));
  if (n.images) m.append(el('span', null, n.images === 1 ? '1 slika' : n.images + ' slike'));
  return m;
}

function noteCard(n) {
  const card = el('article', 'note');
  card.dataset.id = n.id;
  const f = folderById(n.folderId);
  if (f) {
    card.classList.add('in-folder');
    card.style.setProperty('--fc', f.color);
  }
  card.onclick = () => openNote(n);
  return [card, f];
}

function listCard(n, showFolder) {
  const [card, f] = noteCard(n);
  card.append(el('b', null, n.title || 'Bez naslova'));
  if (n.locked) {
    const p = el('div', 'preview locked');
    p.innerHTML = icon('lock');
    p.append('Zaključano');
    card.append(p);
  } else {
    const text = (n.body || '').replace(/\s+/g, ' ').slice(0, 160);
    if (text) card.append(el('div', 'preview', text));
  }
  card.append(metaLine(n, f, showFolder, false), moreButton(n));
  return card;
}

function gridCard(n, showFolder) {
  const [card, f] = noteCard(n);
  const th = el('div', 'thumb rich');
  if (n.locked) {
    th.classList.add('locked');
    th.innerHTML = icon('lock');
  } else {
    th.innerHTML = sanitize(noteHtml(n));
    if (!th.textContent.trim() && !th.querySelector('img')) th.classList.add('empty-thumb');
  }
  card.append(th, el('div', 'name', n.title || 'Bez naslova'), metaLine(n, f, showFolder, true), moreButton(n));
  return card;
}

/* ---------------- Search that forgives typos ----------------
   "promijena" finds "promjena", "biljske" finds "bilješke". Every word of the query
   must match a word of the note: exactly, as a part of it, or with 1–2 wrong letters. */

const words = s => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// edit distance (insert, delete, change, swap two letters); gives up above `max`
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

const allowedTypos = len => (len >= 8 ? 2 : len >= 4 ? 1 : 0);

// how well one query word matches one word of the note (0 = not at all)
function wordScore(q, w) {
  if (w === q) return 4;
  if (w.startsWith(q)) return 3;
  if (w.includes(q)) return 2;
  const max = allowedTypos(q.length);
  if (!max) return 0;
  if (editDistance(q, w, max) <= max) return 1.5;
  // the word is still being typed: compare with the beginning of the note's word
  if (w.length > q.length && editDistance(q, w.slice(0, q.length), max) <= max) return 1;
  return 0;
}

// returns Map id -> score for notes that match
function searchNotes(notes, query) {
  const qWords = words(query);
  const phrase = norm(query);
  const res = new Map();
  if (!qWords.length) return res;
  for (const n of notes) {
    const titleW = words(n.title);
    const bodyW = n.locked ? [] : words(n.body);
    let total = 0;
    for (const q of qWords) {
      let best = 0;
      for (const w of titleW) best = Math.max(best, wordScore(q, w) * 2);   // title counts double
      if (best < 8) for (const w of bodyW) { best = Math.max(best, wordScore(q, w)); if (best >= 4) break; }
      if (!best) { total = 0; break; }
      total += best;
    }
    if (!total) continue;
    if (norm(n.title).includes(phrase)) total += 6;
    res.set(n.id, total);
  }
  return res;
}

/* ---------------- Drawer (☰) ---------------- */

async function openDrawer() {
  const notes = await loadFolders();
  const count = id => notes.filter(n => (n.folderId || null) === id).length;
  const box = $('drawerList');
  box.replaceChildren();

  const row = (active, extraCls) => el('div', 'folder-row' + (active ? ' active' : '') + (extraCls ? ' ' + extraCls : ''));
  const pickBtn = (lead, label, cnt, onClick) => {
    const b = el('button', 'pick');
    b.type = 'button';
    if (typeof lead === 'string') b.innerHTML = icon(lead); else b.append(lead);
    b.append(el('span', 'label', label));
    if (cnt != null) b.append(el('span', 'count', String(cnt)));
    b.onclick = onClick;
    return b;
  };
  const closeThen = fn => async () => { await back(); fn(); };

  const home = row(filter === 'home');
  home.append(pickBtn('home', 'Bilješke', count(null), closeThen(() => goTo('home'))));
  const all = row(filter === 'all');
  all.append(pickBtn('notes', 'Sve bilješke', notes.filter(n => !folderHidden(n.folderId)).length, closeThen(() => goTo('all'))));
  box.append(home, all);

  if (folders.length) box.append(el('h4', 'drawer-sub', 'Mape'));
  for (const f of folders) {
    const r = row(filter === f.id);
    const d = el('span', 'dot');
    d.style.background = f.color;
    const pick = pickBtn(d, f.name, count(f.id), closeThen(() => goTo(f.id)));
    if (f.locked) pick.querySelector('.label').insertAdjacentHTML('afterend', `<span class="mini">${icon('lock')}</span>`);
    r.append(pick);
    const edit = el('button', 'icon-btn');
    edit.type = 'button';
    edit.innerHTML = icon('edit');
    edit.setAttribute('aria-label', 'Uredi mapu ' + f.name);
    edit.onclick = closeThen(async () => { if (await folderSheet(f)) render(); });
    r.append(edit);
    box.append(r);
  }
  const add = row(false, 'add');
  add.append(pickBtn('plus', 'Nova mapa', null, closeThen(createFolder)));
  box.append(add);

  box.append(el('h4', 'drawer-sub', 'Aplikacija'));
  const set = row(false);
  set.append(pickBtn('settings', 'Postavke', null, closeThen(openSettings)));
  const last = Number(loadPref('lastBackup', 0));
  const exp = row(false);
  exp.append(pickBtn('download', 'Izvezi kopiju', null, closeThen(openExportSheet)));
  exp.querySelector('.pick').append(el('span', 'count', last ? formatDay(last) : 'nikad'));
  const imp = row(false);
  imp.append(pickBtn('upload', 'Uvezi', null, closeThen(openImportSheet)));
  box.append(set, exp, imp, el('p', 'version', 'Bilješke · verzija ' + APP_VERSION));

  drawerOpen = true;
  $('drawer').classList.add('open');
  updateScrim();
  pushLayer(() => {
    drawerOpen = false;
    $('drawer').classList.remove('open');
    updateScrim();
  });
}

/* ---------------- Settings ---------------- */

function openSettings() {
  showSheet(sh => {
    sh.append(sheetTitle('Postavke'));
    const group = label => {
      const g = el('div', 'set-group');
      g.append(el('div', 'set-label', label));
      sh.append(g);
      return g;
    };
    // segmented control: options [value, label, class]
    const seg = (label, key, options, after) => {
      const box = el('div', 'seg');
      for (const [v, text, cls] of options) {
        const b = el('button', (settings[key] === v ? 'sel ' : '') + (cls || ''), text);
        b.type = 'button';
        b.onclick = () => {
          setSetting(key, v);
          for (const x of box.children) x.classList.toggle('sel', x === b);
          after?.();
        };
        box.append(b);
      }
      group(label).append(box);
    };
    seg('Tema', 'theme', [['system', 'Sustav'], ['light', 'Svijetla'], ['dark', 'Tamna']]);

    const acc = el('div', 'accents');
    for (const [v, color, name] of ACCENTS) {
      const b = el('button', 'sw' + (settings.accent === v ? ' sel' : ''));
      b.type = 'button';
      b.style.background = color;
      b.setAttribute('aria-label', name);
      b.onclick = () => {
        setSetting('accent', v);
        for (const x of acc.children) x.classList.toggle('sel', x === b);
      };
      acc.append(b);
    }
    group('Boja naglaska').append(acc);

    seg('Font', 'font', [['dm', 'DM Sans', 'f-dm'], ['serif', 'Serif', 'f-serif'], ['system', 'Sustavski', 'f-system']]);
    seg('Veličina teksta', 'size', [['m', 'Normalna'], ['l', 'Veća'], ['xl', 'Najveća']]);
  });
}

/* ---------------- Folders ---------------- */

// Name and color of a folder in the bottom sheet. Resolves with the saved folder, or null.
function folderSheet(f) {
  return new Promise(resolve => {
    let saved = null;
    let wantDelete = false;
    const cur = f ? { ...f } : { id: crypto.randomUUID(), name: '', color: COLORS[5], created: Date.now() };
    showSheet(sh => {
      const form = el('form', 'pw-form');
      form.append(el('h3', null, f ? 'Uredi mapu' : 'Nova mapa'));
      const name = el('input');
      name.placeholder = 'Ime mape';
      name.maxLength = 40;
      name.autocomplete = 'off';
      name.value = cur.name;
      const sw = el('div', 'swatches');
      const draw = () => {
        sw.replaceChildren();
        for (const c of COLORS) {
          const b = el('button', 'sw' + (c === cur.color ? ' sel' : ''));
          b.type = 'button';
          b.style.background = c;
          b.setAttribute('aria-label', 'Boja ' + c);
          b.onclick = () => { cur.color = c; draw(); };
          sw.append(b);
        }
      };
      draw();
      const err = el('p', 'error');
      const cancel = el('button', 'secondary', 'Odustani');
      cancel.type = 'button';
      cancel.onclick = () => back();
      const ok = el('button', null, f ? 'Spremi' : 'Napravi mapu');
      ok.type = 'submit';
      const actions = el('div', 'actions');
      actions.append(cancel, ok);
      form.onsubmit = async e => {
        e.preventDefault();
        cur.name = name.value.trim();
        if (!cur.name) { err.textContent = 'Upiši ime mape.'; name.focus(); return; }
        await put('folders', cur);
        saved = cur;
        await closeSheet();
      };
      form.append(name, sw, err, actions);
      if (f) {
        // red bubble under the buttons, as wide as both of them together
        const delBtn = el('button', 'danger-fill wide-btn');
        delBtn.type = 'button';
        delBtn.innerHTML = icon('trash');
        delBtn.append('Obriši mapu');
        delBtn.onclick = () => { wantDelete = true; back(); };
        form.append(delBtn);
      }
      sh.append(form);
      if (!f) setTimeout(() => name.focus(), 80);
    }, () => {
      resolve(saved);
      if (wantDelete) deleteFolder(f);      // asks for confirmation in the next sheet
    });
  });
}

async function createFolder() {
  const f = await folderSheet();
  if (!f) return;
  setFilter(f.id);
  toast(`Mapa „${f.name}” je napravljena`);
  render();
}

// all folders as tiles: easier than scrolling the tabs when there are many
async function openAllFolders() {
  const notes = await loadFolders();
  showSheet(sh => {
    sh.append(sheetTitle('Mape'));
    const grid = el('div', 'folder-grid');
    let i = 0;
    const tile = (color, iconName, name, sub, active, onClick) => {
      const b = el('button', 'folder-tile' + (active ? ' active' : ''));
      b.type = 'button';
      b.style.setProperty('--fc', color);
      b.style.setProperty('--i', i++);
      const ic = el('span', 'ft-icon');
      ic.innerHTML = icon(iconName);
      b.append(ic, el('span', 'ft-name', name));
      if (sub) b.append(el('span', 'ft-count', sub));
      b.onclick = onClick;
      grid.append(b);
      return b;
    };
    const open = id => async () => { await closeSheet(); goTo(id); };
    tile('var(--accent)', 'home', 'Bilješke', notesCount(notes.filter(n => !n.folderId).length), filter === 'home', open('home'));
    tile('var(--muted)', 'notes', 'Sve bilješke', notesCount(notes.filter(n => !folderHidden(n.folderId)).length), filter === 'all', open('all'));
    for (const f of folders) {
      const t = tile(f.color, 'folder', f.name, notesCount(notes.filter(n => n.folderId === f.id).length), filter === f.id, open(f.id));
      if (f.locked) t.querySelector('.ft-icon').insertAdjacentHTML('beforeend', icon('lock'));
    }
    const add = tile('var(--accent)', 'plus', 'Nova mapa', null, false, createFolder);
    add.classList.add('add');
    sh.append(grid);
  });
}

// ⋮ in the app bar while a folder is open
function openFolderMenu() {
  const f = folderById(filter);
  if (!f) return;
  showSheet(sh => {
    sh.append(sheetTitle(f.name));
    sh.append(menuList([
      { icon: 'palette', label: 'Uredi izgled (ime i boja)', onClick: async () => { if (await folderSheet(f)) render(); } },
      f.locked
        ? { icon: 'unlock', label: 'Otključaj mapu', onClick: () => unlockFolder(f) }
        : { icon: 'lock', label: 'Zaključaj mapu', onClick: () => lockFolder(f) },
      { icon: 'download', label: 'Izvezi mapu', onClick: () => openExportSheet(f) },
      { icon: 'trash', label: 'Obriši mapu', danger: true, onClick: () => deleteFolder(f) },
    ]));
  });
}

function runTransaction(stores, fill) {
  return new Promise((res, rej) => {
    const t = db.transaction(stores, 'readwrite');
    fill(t);
    t.oncomplete = res;
    t.onerror = () => rej(t.error);
  });
}

async function lockFolder(f) {
  const ok = await confirmSheet({
    title: 'Zaključati mapu?',
    text: `Za otvaranje mape „${f.name}” trebat će PIN. Bilješke u njoj se šifriraju i ne vide se u „Sve” ni u pretrazi dok je mapa zaključana.`,
    confirmLabel: 'Zaključaj',
  });
  if (!ok) return;
  const key = await getLockKey('Zaključaj mapu', true);
  if (!key) return;
  const updated = [];
  for (const n of (await getAll('notes')).filter(x => x.folderId === f.id && !x.locked)) {
    const enc = await encryptJSON(key, { html: noteHtml(n), body: n.body || '' });
    updated.push({ ...n, html: '', body: '', images: 0, locked: true, lockedByFolder: true, enc });
  }
  // one transaction: the folder and all its notes are locked together
  await runTransaction(['notes', 'folders'], t => {
    for (const n of updated) t.objectStore('notes').put(n);
    t.objectStore('folders').put({ ...f, locked: true });
  });
  openFolderId = f.id;              // stays open until you leave it
  folderKey = key;
  toast('Mapa je zaključana');
  render();
}

async function unlockFolder(f) {
  await closeSheet();
  const key = await getLockKey('Otključaj mapu', false);
  if (!key) return;
  const updated = [];
  for (const n of (await getAll('notes')).filter(x => x.folderId === f.id && x.lockedByFolder)) {
    const data = await decryptJSON(key, n.enc);
    const plain = { ...n, html: data.html, body: data.body, images: countImages(data.html) };
    delete plain.locked; delete plain.enc; delete plain.lockedByFolder;
    updated.push(plain);
  }
  const folder = { ...f };
  delete folder.locked;
  await runTransaction(['notes', 'folders'], t => {
    for (const n of updated) t.objectStore('notes').put(n);
    t.objectStore('folders').put(folder);
  });
  openFolderId = null;
  folderKey = null;
  toast('Mapa je otključana');
  render();
}

async function deleteFolder(f) {
  const ok = await confirmSheet({
    title: 'Obrisati mapu?',
    text: `Mapa „${f.name}” se briše, a bilješke iz nje ostaju i prelaze u bilješke bez mape.` +
          (f.locked ? ' Bilješke iz zaključane mape ostaju zaključane PIN-om.' : ''),
    confirmLabel: 'Obriši mapu',
    danger: true,
  });
  if (!ok) return;
  const notes = (await getAll('notes')).filter(n => n.folderId === f.id);
  await runTransaction(['notes', 'folders'], t => {
    for (const n of notes) {
      const m = { ...n, folderId: null };
      delete m.lockedByFolder;            // stays locked as a normal locked note
      t.objectStore('notes').put(m);
    }
    t.objectStore('folders').delete(f.id);
  });
  setFilter('home');
  toast('Mapa je obrisana');
  render();
}

/* ---------------- Note menu (⋮) ---------------- */

// key for a locked note: no PIN needed inside an already opened locked folder
function keyFor(n, title) {
  if (folderKey && n.folderId && n.folderId === openFolderId) return Promise.resolve(folderKey);
  return getLockKey(title, false);
}

function openNoteMenu(n) {
  const inLockedFolder = !!folderById(n.folderId)?.locked;
  showSheet(sh => {
    sh.append(sheetTitle(n.title || 'Bez naslova'));
    const items = [
      { icon: 'folder', label: 'Premjesti u mapu', onClick: () => openMoveSheet(n) },
    ];
    if (navigator.share) items.push({ icon: 'share', label: 'Podijeli', onClick: () => shareNote(n) });
    items.push({ icon: 'copy', label: 'Kopiraj tekst', onClick: () => copyNote(n) });
    if (!n.locked) items.push({ icon: 'lock', label: 'Zaključaj', onClick: () => lockNote(n) });
    else if (!inLockedFolder) items.push({ icon: 'unlock', label: 'Otključaj', onClick: () => unlockNote(n) });
    items.push({ icon: 'trash', label: 'Obriši', danger: true, onClick: () => deleteNote(n) });
    sh.append(menuList(items));
  });
}

function openMoveSheet(n) {
  showSheet(sh => {
    sh.append(sheetTitle('Premjesti u mapu'));
    const items = [{ icon: 'notes', label: 'Bez mape', checked: !n.folderId, onClick: () => moveNote(n, null) }];
    for (const f of folders)
      items.push({ dot: f.color, label: f.name, sub: f.locked ? 'zaključana' : '', checked: n.folderId === f.id, onClick: () => moveNote(n, f) });
    items.push({
      icon: 'plus', label: 'Premjesti u novu mapu…', accent: true,
      onClick: async () => { const f = await folderSheet(); if (f) await moveNote(n, f); },
    });
    sh.append(menuList(items));
  });
}

async function moveNote(n, f) {
  await closeSheet();
  const fresh = await getOne('notes', n.id);
  if (!fresh) return;
  let patch = { folderId: f ? f.id : null };
  if (f?.locked && !fresh.locked) {
    // a note moved into a locked folder is encrypted as well
    const key = await keyFor({ folderId: f.id }, 'Premjesti u zaključanu mapu');
    if (!key) return;
    const enc = await encryptJSON(key, { html: noteHtml(fresh), body: fresh.body || '' });
    patch = { ...patch, html: '', body: '', images: 0, locked: true, lockedByFolder: true, enc };
  } else if (fresh.lockedByFolder && !f?.locked) {
    // it was locked only because of its folder, so leaving the folder unlocks it
    const key = await keyFor(fresh, 'Premjesti iz zaključane mape');
    if (!key) return;
    const data = await decryptJSON(key, fresh.enc);
    patch = { ...patch, html: data.html, body: data.body, images: countImages(data.html), locked: undefined, enc: undefined, lockedByFolder: undefined };
  }
  await updateNote(n.id, patch);
  toast(f ? `Premješteno u „${f.name}”` : 'Uklonjeno iz mape');
  render();
}

// plain text of a note, asks for the PIN if it is locked
async function noteText(n, why) {
  let fresh = await getOne('notes', n.id);
  if (!fresh) return null;
  let body = fresh.body || '';
  if (fresh.locked) {
    await closeSheet();
    const key = await keyFor(fresh, why);
    if (!key) return null;
    fresh = await getOne('notes', n.id);
    body = (await decryptJSON(key, fresh.enc)).body;
  }
  return { title: fresh.title || '', text: (fresh.title ? fresh.title + '\n\n' : '') + body };
}

async function shareNote(n) {
  const t = await noteText(n, 'Otključaj za dijeljenje');
  if (!t) return;
  try {
    await navigator.share({ title: t.title || 'Bilješka', text: t.text });
  } catch (e) {
    if (e.name !== 'AbortError') toast('Dijeljenje nije uspjelo');
  }
  await closeSheet();
}

async function copyNote(n) {
  const t = await noteText(n, 'Otključaj za kopiranje');
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t.text);
    toast('Tekst je kopiran');
  } catch {
    toast('Kopiranje nije uspjelo');
  }
  await closeSheet();
}

async function lockNote(n) {
  await closeSheet();
  const key = await getLockKey('Zaključaj bilješku', true);
  if (!key) return;
  const fresh = await getOne('notes', n.id);
  const enc = await encryptJSON(key, { html: noteHtml(fresh), body: fresh.body || '' });
  // plain text is replaced, only the encrypted copy stays in the database
  await put('notes', { ...fresh, html: '', body: '', images: 0, locked: true, enc });
  toast('Bilješka je zaključana');
  render();
}

async function unlockNote(n) {
  await closeSheet();
  const key = await getLockKey('Otključaj bilješku', false);
  if (!key) return;
  const fresh = await getOne('notes', n.id);
  const data = await decryptJSON(key, fresh.enc);
  await updateNote(n.id, { html: data.html, body: data.body, images: countImages(data.html), locked: undefined, enc: undefined, lockedByFolder: undefined });
  toast('Bilješka je otključana');
  render();
}

async function deleteNote(n) {
  const ok = await confirmSheet({
    title: 'Obrisati bilješku?',
    text: `„${n.title || 'Bez naslova'}” će biti trajno obrisana.`,
    confirmLabel: 'Obriši',
    danger: true,
  });
  if (!ok) return;
  await del('notes', n.id);
  const card = $('list').querySelector(`[data-id="${CSS.escape(n.id)}"]`);
  if (card) {                      // let the card fade out first
    card.classList.add('leaving');
    await new Promise(r => setTimeout(r, 200));
  }
  toast('Bilješka je obrisana');
  render();
}

/* ---------------- Backup (export / import) ----------------
   One JSON file with all notes, folders and the PIN check.
   Without encryption: locked notes stay encrypted, other notes are readable.
   With encryption (format 2): the whole file is encrypted with the PIN. */

function toB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromB64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// binary data (salt, IV, encrypted content) is written as { $b64: "..." }
const backupReplacer = (k, v) =>
  v instanceof ArrayBuffer ? { $b64: toB64(new Uint8Array(v)) }
  : ArrayBuffer.isView(v) ? { $b64: toB64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) }
  : v;
const backupReviver = (k, v) =>
  v && typeof v === 'object' && typeof v.$b64 === 'string' ? fromB64(v.$b64) : v;

const today = () => new Date().toISOString().slice(0, 10);

// folder: export only that folder; without it everything is exported
function openExportSheet(folder) {
  let encrypt = loadPref('encryptBackup', '1') === '1';
  showSheet(sh => {
    const box = el('div', 'pw-form');
    box.append(el('h3', null, folder ? `Izvezi mapu „${folder.name}”` : 'Izvezi kopiju'),
      el('p', null, folder
        ? 'Datoteka sadrži sve bilješke iz ove mape. Uvoz (☰ → Uvezi) ih vraća u istu mapu.'
        : 'Kopija sadrži sve bilješke i mape. Spremi je na Google Drive pa je imaš i ako izgubiš ili promijeniš mobitel.'));
    const tr = el('div', 'toggle-row');
    const txt = el('div', 'txt', 'Šifriraj PIN-om');
    txt.append(el('small', null, 'Bez PIN-a nitko ne može pročitati kopiju. Bez šifriranja su otvorene bilješke čitljive.'));
    const sw = el('button', 'switch' + (encrypt ? ' on' : ''));
    sw.type = 'button';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-label', 'Šifriraj PIN-om');
    sw.setAttribute('aria-checked', String(encrypt));
    sw.onclick = () => {
      encrypt = !encrypt;
      sw.classList.toggle('on', encrypt);
      sw.setAttribute('aria-checked', String(encrypt));
    };
    tr.append(txt, sw);
    box.append(tr);
    sh.append(box);
    const items = [];
    if (navigator.canShare)
      items.push({ icon: 'cloud', label: 'Spremi u Google Drive…', sub: 'ili drugdje', onClick: () => exportBackup('share', encrypt, folder) });
    items.push({ icon: 'phone', label: 'Spremi na uređaj', sub: 'Preuzimanja', onClick: () => exportBackup('download', encrypt, folder) });
    sh.append(menuList(items));
  });
}

async function buildBackup(encrypt, folder) {
  const data = {
    app: 'biljeske', format: 1, version: APP_VERSION, exported: Date.now(),
    notes: await getAll('notes'), folders: await getAll('folders'), meta: await getAll('meta'),
  };
  if (folder) {                 // the PIN check (meta) stays, locked notes need it
    data.notes = data.notes.filter(n => n.folderId === folder.id);
    data.folders = data.folders.filter(f => f.id === folder.id);
  }
  let json = JSON.stringify(data, backupReplacer);
  if (encrypt) {
    const key = await getLockKey('Šifriraj kopiju', true);    // sets up a PIN if there is none yet
    if (!key) return null;
    const lock = await getOne('meta', 'lock');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(json));
    json = JSON.stringify({
      app: 'biljeske', format: 2, encrypted: true, version: APP_VERSION, exported: data.exported,
      lock: { salt: lock.salt, iterations: lock.iterations, check: lock.check },
      payload: { iv, data: enc },
    }, backupReplacer);
  }
  return json;
}

function downloadFile(file) {
  const a = el('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

async function exportBackup(how, encrypt, folder) {
  savePref('encryptBackup', encrypt ? '1' : '0');
  await closeSheet();
  const json = await buildBackup(encrypt, folder);
  if (!json) return;
  // file name: biljeske-kopija-2026-11-19 or biljeske-mapa-posao-2026-11-19
  const slug = folder ? 'mapa-' + (norm(folder.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mapa') : 'kopija';
  const base = `biljeske-${slug}-${today()}${encrypt ? '-sifrirano' : ''}`;
  const file = new File([json], base + '.json', { type: 'application/json' });
  if (how === 'share') {
    // Android does not share .json files, so a .txt with the same content is used there (import accepts both)
    const shareFile = navigator.canShare({ files: [file] }) ? file : new File([json], base + '.txt', { type: 'text/plain' });
    try {
      if (!navigator.canShare({ files: [shareFile] })) throw new Error('files');
      await navigator.share({ files: [shareFile], title: shareFile.name });
      if (!folder) savePref('lastBackup', String(Date.now()));
      toast(folder ? 'Mapa je poslana' : 'Kopija je poslana');
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
      toast('Dijeljenje ne radi ovdje, kopija ide u Preuzimanja');
    }
  }
  downloadFile(file);
  if (!folder) savePref('lastBackup', String(Date.now()));
  if (how !== 'share') toast((folder ? 'Mapa je spremljena' : 'Kopija je spremljena') + ' u Preuzimanja');
}

/* ---- Import: own backups, Google Keep (Takeout .zip / .json), text files ---- */

function openImportSheet() {
  showSheet(sh => {
    sh.append(sheetTitle('Uvezi'));
    sh.append(el('p', null, 'Odaberi jednu ili više datoteka. Vrsta se prepozna sama.'));
    const pick = () => { $('importInput').click(); back(); };
    sh.append(menuList([
      { icon: 'upload', label: 'Sigurnosna kopija', sub: '.json / .txt', onClick: pick },
      { icon: 'apps', label: 'Google Keep', sub: 'Takeout .zip', onClick: pick },
      { icon: 'notes', label: 'Tekstualne datoteke', sub: '.txt, .md', onClick: pick },
    ]));
    sh.append(el('p', 'hint',
      'Google Keep: takeout.google.com → odaberi samo Keep → preuzmi .zip. ' +
      'Iz Samsung Notesa ili Keepa možeš i otvoriti bilješku → Dijeli → Bilješke, i ona se odmah doda ovdje.'));
  });
}

// minimal ZIP reader (stored or deflate entries), enough for Google Takeout
async function openZip(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--)
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not a zip');
  let count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const entries = new Map();
  for (let i = 0; i < count && dv.getUint32(off, true) === 0x02014b50; i++) {
    const method = dv.getUint16(off + 10, true);
    let csize = dv.getUint32(off + 20, true);
    const nameLen = dv.getUint16(off + 28, true), extraLen = dv.getUint16(off + 30, true), commentLen = dv.getUint16(off + 32, true);
    let local = dv.getUint32(off + 42, true);
    const name = dec.decode(buf.subarray(off + 46, off + 46 + nameLen));
    // ZIP64: sizes that do not fit 32 bits are in an extra field
    if (csize === 0xffffffff || local === 0xffffffff) {
      let p = off + 46 + nameLen;
      const end = p + extraLen;
      while (p + 4 <= end) {
        const id = dv.getUint16(p, true), size = dv.getUint16(p + 2, true);
        if (id === 1) {
          let q = p + 4;
          if (dv.getUint32(off + 24, true) === 0xffffffff) q += 8;          // uncompressed size
          if (csize === 0xffffffff) { csize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (local === 0xffffffff) local = Number(dv.getBigUint64(q, true));
        }
        p += 4 + size;
      }
    }
    entries.set(name, { method, csize, local });
    off += 46 + nameLen + extraLen + commentLen;
  }
  const read = async name => {
    const e = entries.get(name);
    const start = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
    const data = buf.subarray(start, start + e.csize);
    if (e.method === 0) return data;
    if (e.method !== 8) throw new Error('compression');
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  };
  return { names: [...entries.keys()].filter(n => !n.endsWith('/')), read };
}

// short stable id, so importing the same file twice does not duplicate notes
function hashId(prefix, str) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13);
  }
  return prefix + '-' + (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function htmlToText(html) {
  const d = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html').body;
  for (const b of d.querySelectorAll('br')) b.replaceWith('\n');
  for (const b of d.querySelectorAll('div,p,li,h1,h2,h3')) b.append('\n');
  return d.textContent.replace(/​/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

const isKeepNote = o => o && typeof o === 'object' && !Array.isArray(o) &&
  ('textContent' in o || 'listContent' in o || 'textContentHtml' in o) && ('userEditedTimestampUsec' in o || 'createdTimestampUsec' in o);

// Google Keep note (from Takeout) -> our note; readFile(path) gives attachment bytes when importing a zip
async function fromKeep(k, readFile) {
  if (k.isTrashed) return null;
  let html = k.textContentHtml ? sanitize(k.textContentHtml) : textToHtml(k.textContent || '');
  if (Array.isArray(k.listContent) && k.listContent.length) {
    html += '<ul class="todo">' + k.listContent.map(i =>
      `<li${i.isChecked ? ' data-checked="true"' : ''}>${escapeHtml(String(i.text || '')) || '<br>'}</li>`).join('') + '</ul>';
  }
  for (const a of k.attachments || []) {
    if (!readFile || !/^image\//.test(a.mimetype || '') || !a.filePath) continue;
    try {
      const bytes = await readFile(a.filePath);
      if (bytes) html += `<img src="${await fileToDataUrl(new Blob([bytes], { type: a.mimetype }))}" alt="">`;
    } catch { /* attachment missing: skip it */ }
  }
  const created = Math.round(Number(k.createdTimestampUsec) / 1000) || Date.now();
  const updated = Math.round(Number(k.userEditedTimestampUsec) / 1000) || created;
  return {
    id: hashId('keep', String(k.createdTimestampUsec) + '|' + (k.title || '')),
    title: String(k.title || '').slice(0, 200), html, created, updated,
    folderName: k.labels?.[0]?.name || 'Google Keep',
  };
}

function fromText(fileName, text, modified) {
  const title = fileName.replace(/^.*\//, '').replace(/\.(txt|md|markdown)$/i, '');
  return {
    id: hashId('txt', fileName + '|' + text.length + '|' + text.slice(0, 200)),
    title: title.slice(0, 200), html: textToHtml(text.replace(/\r\n?/g, '\n')),
    created: modified || Date.now(), updated: modified || Date.now(),
    folderName: 'Uvezeno',
  };
}

async function importFiles(files) {
  const found = [];          // notes from other apps
  const backups = [];
  let failed = 0;
  const handleText = async (name, text, modified, readFile) => {
    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
      let o = null;
      try { o = JSON.parse(trimmed, backupReviver); } catch { /* not JSON, treat as text */ }
      if (o?.app === 'biljeske') { backups.push(o); return; }
      if (isKeepNote(o)) { const n = await fromKeep(o, readFile); if (n) found.push(n); return; }
      if (o && /\.json$/i.test(name)) return;           // some other JSON file: skip
    }
    if (/\.json$/i.test(name) || /(^|\/)Labels\.txt$/i.test(name) || !trimmed) return;
    found.push(fromText(name, text, modified));
  };

  toast('Čitam datoteke…');
  for (const file of files) {
    try {
      if (/\.zip$/i.test(file.name) || /zip/.test(file.type)) {
        const zip = await openZip(file);
        const td8 = new TextDecoder();
        for (const name of zip.names) {
          if (!/\.(json|txt|md)$/i.test(name)) continue;
          const dir = name.slice(0, name.lastIndexOf('/') + 1);
          const readFile = async p => {
            const match = zip.names.find(x => x === dir + p) || zip.names.find(x => x.endsWith('/' + p));
            return match ? zip.read(match) : null;
          };
          await handleText(name, td8.decode(await zip.read(name)), null, readFile);
        }
      } else {
        await handleText(file.name, await file.text(), file.lastModified, null);
      }
    } catch {
      failed++;
    }
  }

  for (const b of backups) await importBackupData(b);
  if (found.length) await importForeign(found);
  else if (!backups.length) toast(failed ? 'Datoteka se ne može pročitati' : 'U datotekama nema bilješki za uvoz');
}

async function importForeign(found) {
  const byFolder = new Map();
  for (const n of found) byFolder.set(n.folderName, (byFolder.get(n.folderName) || 0) + 1);
  const ok = await confirmSheet({
    title: `Uvesti ${notesCount(found.length)}?`,
    text: 'Bilješke idu u mape: ' + [...byFolder].map(([f, c]) => `„${f}” (${c})`).join(', ') +
          '. Kasnije ih možeš premjestiti kamo želiš.',
    confirmLabel: 'Uvezi',
  });
  if (!ok) return;
  const existing = new Map((await getAll('notes')).map(n => [n.id, n]));
  const folderList = await getAll('folders');
  const newFolders = [];
  const folderFor = name => {
    let f = [...folderList, ...newFolders].find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!f) {
      f = { id: crypto.randomUUID(), name: name.slice(0, 40), color: COLORS[(folderList.length + newFolders.length + 2) % COLORS.length], created: Date.now() };
      newFolders.push(f);
    }
    return f.id;
  };
  let added = 0;
  const records = [];
  for (const n of found) {
    const cur = existing.get(n.id);
    if (cur && cur.updated >= n.updated) continue;
    const html = sanitize(n.html);
    records.push({
      id: n.id, title: n.title, html, body: htmlToText(html), images: countImages(html),
      created: n.created, updated: n.updated, folderId: cur ? cur.folderId : folderFor(n.folderName),
    });
    added++;
  }
  await runTransaction(['notes', 'folders'], t => {
    for (const f of newFolders) t.objectStore('folders').put(f);
    for (const r of records) t.objectStore('notes').put(r);
  });
  setFilter('all');
  await render();
  toast(added ? `Uvezeno: ${notesCount(added)}` : 'Sve te bilješke već postoje');
}

// own backup file (already parsed)
async function importBackupData(data) {
  if (data.encrypted) {
    const lock = data.lock;
    if (!lock?.salt || !lock.check || !data.payload) { toast('Ova kopija je oštećena'); return; }
    const key = await openPin({
      title: 'Šifrirana kopija',
      text: 'Upiši PIN koji je vrijedio kad je kopija napravljena.',
      onPin: async pin => {
        const k = await deriveKey(pin, lock.salt, lock.iterations || KDF_ITERATIONS);
        try { await decryptJSON(k, lock.check); return { done: k }; } catch { return { error: 'Pogrešan PIN' }; }
      },
    });
    if (!key) return;
    try {
      const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.payload.iv }, key, data.payload.data);
      data = JSON.parse(td.decode(buf), backupReviver);
    } catch {
      toast('Kopija se ne može dešifrirati');
      return;
    }
  }
  if (data?.app !== 'biljeske' || !Array.isArray(data.notes) || !Array.isArray(data.folders)) {
    toast('Ovo nije ispravna kopija bilješki');
    return;
  }
  const ok = await confirmSheet({
    title: 'Uvesti kopiju?',
    text: `Kopija sadrži ${notesCount(data.notes.length)} i ${plural(data.folders.length, 'mapu', 'mape', 'mapa')}. Postojeće bilješke ostaju. ` +
          'Ako ista bilješka postoji na oba mjesta, zadržava se novija verzija.',
    confirmLabel: 'Uvezi',
  });
  if (!ok) return;

  const localNotes = new Map((await getAll('notes')).map(n => [n.id, n]));
  const localFolders = new Set((await getAll('folders')).map(f => f.id));
  const localLock = await getOne('meta', 'lock');
  const backupLock = (data.meta || []).find(m => m && m.id === 'lock' && m.salt && m.check);
  const sameLock = !!(localLock && backupLock && toB64(localLock.salt) === toB64(backupLock.salt));
  const localHasLocked = [...localNotes.values()].some(n => n.locked);
  // take over the PIN from the backup only if no local note depends on the current one
  const adoptLock = !!backupLock && !sameLock && !localHasLocked;
  const lockedUsable = !backupLock || sameLock || adoptLock;

  let added = 0, skipped = 0;
  await runTransaction(['notes', 'folders', 'meta'], t => {
    for (const f of data.folders) {
      if (!f || typeof f.id !== 'string' || typeof f.name !== 'string' || localFolders.has(f.id)) continue;
      const color = OLD_COLORS.includes(f.color) ? COLORS[OLD_COLORS.indexOf(f.color)]
        : /^#[0-9a-f]{6}$/i.test(f.color) ? f.color : COLORS[5];
      const folder = { id: f.id, name: f.name.slice(0, 40), color, created: Number(f.created) || 0 };
      if (f.locked && lockedUsable) folder.locked = true;
      t.objectStore('folders').put(folder);
    }
    for (const n of data.notes) {
      if (!n || typeof n.id !== 'string' || typeof n.updated !== 'number') continue;
      if (n.locked && (!n.enc || !lockedUsable)) { skipped++; continue; }
      const cur = localNotes.get(n.id);
      if (cur && cur.updated >= n.updated) continue;
      const note = {
        id: n.id, title: String(n.title || ''), folderId: typeof n.folderId === 'string' ? n.folderId : null,
        updated: n.updated, created: Number(n.created) || n.updated, images: Number(n.images) || 0,
        body: n.locked ? '' : String(n.body || ''),
        html: n.locked ? '' : sanitize(String(n.html ?? textToHtml(n.body || ''))),
      };
      if (n.locked) { note.locked = true; note.enc = n.enc; note.images = 0; if (n.lockedByFolder) note.lockedByFolder = true; }
      t.objectStore('notes').put(note);
      added++;
    }
    if (adoptLock) t.objectStore('meta').put(backupLock);
  });
  await render();
  toast(`Uvezeno: ${notesCount(added)}` + (skipped ? ` · preskočeno zaključanih: ${skipped} (drugi PIN)` : ''));
}

/* ---- Share target: "Dijeli → Bilješke" from another app creates a new note ---- */

async function receiveShared() {
  const p = new URLSearchParams(location.search);
  if (!p.has('title') && !p.has('text') && !p.has('url')) return false;
  history.replaceState({ depth: 0 }, '', location.pathname);     // clean address, a reload does not add it twice
  let title = (p.get('title') || '').trim();
  let text = (p.get('text') || '').replace(/\r\n?/g, '\n');
  const url = p.get('url');
  if (url && !text.includes(url)) text += (text ? '\n' : '') + url;
  if (!title) {
    // first short line becomes the title (Samsung Notes and Keep send title and text together)
    const lines = text.split('\n');
    if (lines.length > 1 && lines[0].trim().length <= 80) {
      title = lines.shift().trim();
      while (lines.length && !lines[0].trim()) lines.shift();
      text = lines.join('\n');
    }
  }
  if (!title && !text.trim()) return false;
  const now = Date.now();
  const note = { id: crypto.randomUUID(), title, html: textToHtml(text), body: text.trim(), images: 0, folderId: null, created: now, updated: now };
  await put('notes', note);
  await render();
  openEditor(note, null);
  toast('Bilješka je dodana');
  return true;
}

/* ---------------- Editor ---------------- */

async function openNote(n) {
  const fresh = await getOne('notes', n.id);
  if (!fresh) return render();
  if (!fresh.locked) return openEditor(fresh, null);
  const key = await keyFor(fresh, fresh.title || 'Zaključana bilješka');
  if (!key) return;
  const latest = await getOne('notes', n.id);     // re-read: a PIN migration may have re-encrypted it
  const data = await decryptJSON(key, latest.enc);
  openEditor({ ...latest, html: data.html, body: data.body }, key);
}

function openEditor(n, key) {
  homeScroll = window.scrollY;
  const now = Date.now();
  current = n
    ? { ...n }
    : { id: crypto.randomUUID(), title: '', body: '', html: '', images: 0,
        folderId: folderById(filter) ? filter : null, created: now, updated: now };
  // a new note inside an opened locked folder is encrypted like the others there
  if (!n && current.folderId && current.folderId === openFolderId && folderKey) {
    key = folderKey;
    current.lockedByFolder = true;
  }
  currentKey = key || null;
  dirty = false;
  lastRange = null;

  $('title').value = current.title || '';
  $('body').innerHTML = sanitize(noteHtml(current));
  $('saveState').textContent = '';
  $('lockBadge').hidden = !currentKey;
  showTools(false);

  pushLayer(closeEditor);
  show('editor');
  window.scrollTo(0, 0);
  if (!n) $('title').focus();
}

async function closeEditor() {
  await flushSave();
  current = null;
  currentKey = null;
  $('body').innerHTML = '';            // do not keep decrypted text in the page
  show('home');
  await render();
  window.scrollTo(0, homeScroll);
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
  const text = bodyEl.innerText.replace(/\u200B/g, '').trim();
  const images = bodyEl.querySelectorAll('img').length;
  const title = $('title').value.trim();
  // notes from v1.0 have no creation time: the last edit before this one is the best guess
  current = { ...current, created: createdOf(current), title, html, body: text, images, updated: Date.now() };
  dirty = false;
  if (!title && !text && !images) {        // empty note is not kept
    await del('notes', current.id);
    $('saveState').textContent = '';
    return;
  }
  let record = current;
  if (currentKey) {
    const enc = await encryptJSON(currentKey, { html, body: text });
    record = { ...current, html: '', body: '', images: 0, locked: true, enc };
  }
  await put('notes', record);
  $('saveState').textContent = 'Spremljeno';
}

// "Spremi": save everything now and go back to the list
async function saveAndClose() {
  clearTimeout(saveTimer);
  const empty = !$('title').value.trim() && !$('body').innerText.replace(/\u200B/g, '').trim() && !$('body').querySelector('img');
  if (current) await saveCurrent();
  await back();
  if (!empty) toast('Spremljeno');
}

async function flushSave() {
  if (current && dirty) await saveCurrent();
}

/* Selection helpers */
function selectionElement() {
  const sel = getSelection();
  if (!sel.rangeCount) return null;
  const n = sel.anchorNode;
  const e = n && (n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement);
  return e && $('body').contains(e) ? e : null;
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

const MARK = 'x-mark-font';      // temporary font name used to find the selected text

const elementOf = n => (n && (n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement));
// element at the caret, also when the editor lost focus (e.g. a toolbar tap)
function caretElement() {
  const e = selectionElement() || (lastRange && elementOf(lastRange.startContainer));
  return e && $('body').contains(e) ? e : null;
}

/* Wraps the selected text in plain <span>s and returns them.
   With nothing selected, an empty span is placed at the caret so new typing goes into it. */
function markSelection() {
  ensureCaret();
  const sel = getSelection();
  const r = sel.getRangeAt(0);
  if (r.collapsed) {
    const s = document.createElement('span');
    s.textContent = '​';           // zero-width space keeps the caret inside the span
    r.insertNode(s);
    const nr = document.createRange();
    nr.setStart(s.firstChild, 1);
    nr.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nr);
    return [s];
  }
  // the browser splits the selection across paragraphs and list items for us
  document.execCommand('styleWithCSS', false, false);
  document.execCommand('fontName', false, MARK);
  const spans = [];
  for (const f of $('body').querySelectorAll('font')) {
    if (f.getAttribute('face') !== MARK) continue;
    const s = document.createElement('span');
    s.append(...f.childNodes);
    f.replaceWith(s);
    spans.push(s);
  }
  if (spans.length) {
    const nr = document.createRange();
    nr.setStartBefore(spans[0]);
    nr.setEndAfter(spans[spans.length - 1]);
    sel.removeAllRanges();
    sel.addRange(nr);
  }
  return spans;
}

function unwrap(e) { e.replaceWith(...e.childNodes); }

// Moves `node` out of its ancestor `anc`, splitting anc into a part before and a part after
function splitOut(node, anc) {
  const r = document.createRange();
  r.setStartAfter(node);
  r.setEnd(anc, anc.childNodes.length);
  const tail = r.extractContents();
  r.setStartBefore(node);
  r.setEnd(anc, anc.childNodes.length);
  const mid = r.extractContents();       // node itself is moved, wrappers between are copied
  const after = anc.cloneNode(false);
  after.append(tail);
  anc.after(mid, after);
  const isEmpty = e => !e.textContent.replace(/​/g, '') && !e.querySelector('img');
  if (isEmpty(after)) after.remove();
  if (isEmpty(anc)) anc.remove();
}

/* Sets one text style (data-c, data-h, data-u, data-fs) on the selection.
   value null removes it. Each span carries only one style, so styles never stack up. */
function applyStyle(attr, value) {
  const spans = markSelection();
  for (const m of spans) {
    for (const d of [...m.querySelectorAll(`span[${attr}]`)]) unwrap(d);
    let a;
    while ((a = m.parentElement.closest(`span[${attr}]`)) && $('body').contains(a)) splitOut(m, a);
    if (value) m.setAttribute(attr, value);
  }
  markDirty();
  updateToolbar();
}

function listKind(list) {
  if (!list) return null;
  if (list.tagName === 'OL') return 'number';
  for (const k of ['todo', 'dash', 'arrow']) if (list.classList.contains(k)) return k;
  return 'bullet';
}

// kind: bullet | number | dash | arrow | todo. Choosing the current kind removes the list.
function setList(kind) {
  ensureCaret();
  const list = selectionElement()?.closest('li')?.parentElement;
  const cur = listKind(list);
  const want = kind === 'number' ? 'OL' : 'UL';
  let target = list;
  if (cur === kind) {
    document.execCommand(want === 'OL' ? 'insertOrderedList' : 'insertUnorderedList');
    target = null;
  } else if (!list) {
    document.execCommand(want === 'OL' ? 'insertOrderedList' : 'insertUnorderedList');
    target = selectionElement()?.closest('li')?.parentElement;
  } else if (list.tagName !== want) {
    // switch the whole list between <ul> and <ol>, keeping the caret where it was
    const r = getSelection().getRangeAt(0);
    const [sc, so, ec, eo] = [r.startContainer, r.startOffset, r.endContainer, r.endOffset];
    target = document.createElement(want);
    target.append(...list.childNodes);
    list.replaceWith(target);
    const nr = document.createRange();
    nr.setStart(sc, so);
    nr.setEnd(ec, eo);
    getSelection().removeAllRanges();
    getSelection().addRange(nr);
  }
  if (target) {
    target.removeAttribute('class');
    if (want === 'UL' && kind !== 'bullet') target.classList.add(kind);
  }
  markDirty();
  updateToolbar();
}

/* Toolbar (hidden behind the pencil) and its option panels */
let panelCmd = null;

function showTools(open) {
  closePanel();
  $('tools').hidden = !open;
  $('penBtn').hidden = open;
  if (open) updateToolbar();
}

function closePanel() {
  panelCmd = null;
  $('toolPanel').hidden = true;
  for (const b of $('toolbar').querySelectorAll('.open')) b.classList.remove('open');
}

const PANEL_ATTR = { underline: 'data-u', color: 'data-c', highlight: 'data-h', size: 'data-fs' };

function currentValue(cmd) {
  const e = caretElement();
  if (cmd === 'list') {
    const k = listKind(e?.closest('li')?.parentElement);
    return k === 'todo' ? null : k;
  }
  const attr = PANEL_ATTR[cmd];
  return e?.closest(`span[${attr}]`)?.getAttribute(attr) || '';
}

function openPanel(cmd) {
  if (panelCmd === cmd) return closePanel();
  closePanel();
  panelCmd = cmd;
  $('toolbar').querySelector(`[data-cmd="${cmd}"]`).classList.add('open');
  const p = $('toolPanel');
  p.replaceChildren();
  p.hidden = false;
  p.append(el('div', 'panel-title',
    { underline: 'Podcrtavanje', color: 'Boja slova', highlight: 'Isticanje', size: 'Veličina slova', list: 'Popis' }[cmd]));
  const row = el('div', 'panel-row');
  p.append(row);
  const cur = currentValue(cmd);
  const opt = (cls, label, active, onClick) => {
    const b = el('button', 'opt ' + cls + (active ? ' active' : ''));
    b.type = 'button';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.onclick = () => { onClick(); closePanel(); };
    row.append(b);
    return b;
  };
  const attr = PANEL_ATTR[cmd];

  if (cmd === 'size') {
    for (const [v, label, size] of SIZES) {
      const b = opt('text-opt', label, cur === v, () => applyStyle(attr, v || null));
      b.textContent = label;
      b.style.fontSize = size;
    }
  } else if (cmd === 'list') {
    for (const [v, glyph, label] of LISTS) {
      const b = opt('glyph-opt', label, cur === v, () => setList(v));
      b.textContent = glyph;
    }
  } else {
    opt('swatch none', cmd === 'color' ? 'Zadana boja' : 'Bez', !cur, () => applyStyle(attr, null)).innerHTML = icon('close');
    const colors = cmd === 'highlight' ? HL_COLORS : cmd === 'underline' ? UL_COLORS : TEXT_COLORS;
    for (const [v, label] of colors) {
      const b = opt('swatch', label, cur === v, () => applyStyle(attr, v));
      if (cmd === 'underline') {      // underline: show a "U" underlined in that color
        b.classList.add('u-swatch');
        b.textContent = 'U';
        b.style.textDecoration = `underline 3px var(--t-${v})`;
        b.style.textUnderlineOffset = '4px';
      } else {
        b.style.background = `var(--${cmd === 'highlight' ? 'h' : 't'}-${v})`;
      }
    }
  }
}

function runCmd(cmd) {
  if (cmd === 'close') { showTools(false); return; }
  if (cmd === 'image') { closePanel(); $('imgInput').click(); return; }
  if (PANEL_ATTR[cmd] || cmd === 'list') { openPanel(cmd); return; }
  closePanel();
  ensureCaret();
  switch (cmd) {
    case 'bold':
    case 'italic':
      document.execCommand('styleWithCSS', false, false);
      document.execCommand(cmd);
      break;
    case 'todo': setList('todo'); return;
  }
  markDirty();
  updateToolbar();
}

function updateToolbar() {
  if ($('tools').hidden) return;
  const e = selectionElement();
  const kind = listKind(e?.closest('li')?.parentElement);
  const on = {
    bold: !!e && document.queryCommandState('bold'),
    italic: !!e && document.queryCommandState('italic'),
    list: !!kind && kind !== 'todo',
    todo: kind === 'todo',
    underline: !!currentValue('underline'),
    size: !!currentValue('size'),
  };
  for (const b of $('toolbar').querySelectorAll('button[data-cmd]')) b.classList.toggle('on', !!on[b.dataset.cmd]);
  // color bars show the style at the caret
  const bar = (cmd, prefix, fallback) => {
    const v = currentValue(cmd);
    $('toolbar').querySelector(`[data-cmd="${cmd}"] .ind`).style.background = v ? `var(--${prefix}-${v})` : fallback;
  };
  bar('color', 't', 'var(--fg)');
  bar('highlight', 'h', 'var(--muted)');
  bar('underline', 't', 'var(--fg)');
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
    toast('Ova slika se ne može učitati');
    return;
  }
  ensureCaret();
  document.execCommand('insertHTML', false, '<img src="' + url + '" alt=""><br>');
  markDirty();
}

/* ---------------- Events ---------------- */

// home
$('newBtn').onclick = () => openEditor();
$('menuBtn').onclick = () => openDrawer();
$('allFoldersBtn').onclick = () => openAllFolders();
$('folderMenuBtn').onclick = () => openFolderMenu();
$('viewBtn').onclick = () => {
  viewMode = viewMode === 'grid' ? 'list' : 'grid';
  savePref('viewMode', viewMode);
  render();
};
$('searchBtn').onclick = () => {
  searchOpen = true;
  $('appbarMain').hidden = true;
  $('appbarSearch').hidden = false;
  $('tabsRow').hidden = true;
  $('search').focus();
  render();
  pushLayer(() => {
    searchOpen = false;
    query = '';
    $('search').value = '';
    $('appbarSearch').hidden = true;
    $('appbarMain').hidden = false;
    $('tabsRow').hidden = false;
    animateList = true;
    render();
  });
};
$('searchClose').onclick = () => back();
$('search').addEventListener('input', e => { query = e.target.value; render(); });
$('scrim').onclick = () => back();
document.addEventListener('keydown', e => {
  if (pinOpen) {             // laptop: type the PIN with the keyboard
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); pinInput(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); pinInput('del'); }
    else if (e.key === 'Escape') { e.preventDefault(); back(); }
    return;
  }
  if (e.key === 'Escape' && (sheetOpen || drawerOpen)) { e.preventDefault(); back(); }
});

// editor
$('doneBtn').onclick = () => back();
$('saveBtn').addEventListener('mousedown', e => e.preventDefault());   // keep the keyboard until the save is done
$('saveBtn').onclick = () => saveAndClose();
$('title').addEventListener('input', markDirty);
$('title').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); $('body').focus(); }
});

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
  const boxWidth = parseFloat(getComputedStyle(li).paddingLeft);
  if (e.clientX - li.getBoundingClientRect().left > boxWidth) return;
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

// keep focus (and the on-screen keyboard) in the editor when tapping the tools
$('tools').addEventListener('mousedown', e => e.preventDefault());
$('penBtn').addEventListener('mousedown', e => e.preventDefault());
$('penBtn').onclick = () => showTools(true);
bodyEl.addEventListener('pointerdown', () => closePanel());
$('toolbar').addEventListener('click', e => {
  const b = e.target.closest('button[data-cmd]');
  if (b) runCmd(b.dataset.cmd);
});

$('imgInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (file) await insertImage(file);
});

// save when the app goes to the background; after a longer pause close locked notes and locked folders
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    flushSave();
    return;
  }
  if (Date.now() - hiddenAt <= LOCK_AFTER_MS) return;
  if (view === 'editor' && currentKey) await back();
  if (openFolderId) {
    while (layers.length) await back();      // close sheets etc. on top of the folder
    openFolderId = null;
    folderKey = null;
    render();
  }
});
// last chance to save when the app is closed
window.addEventListener('pagehide', () => flushSave());

// move the toolbar and sheets above the on-screen keyboard (iOS)
if (window.visualViewport) {
  const vv = window.visualViewport;
  const updateKb = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb + 'px');
  };
  vv.addEventListener('resize', updateKb);
  vv.addEventListener('scroll', updateKb);
}

$('importInput').addEventListener('change', async e => {
  const files = [...e.target.files];
  e.target.value = '';
  if (files.length) await importFiles(files);
});

/* App updates: a new service worker takes over in the background.
   The page reloads itself when the user is on the list, not while writing. */
let updateReady = false;
function reloadIfUpdated() {
  if (updateReady && view === 'home' && !layers.length) {
    try { sessionStorage.setItem('justUpdated', '1'); } catch { /* ignore */ }
    location.reload();
  }
}
window.addEventListener('popstate', () => setTimeout(reloadIfUpdated, 300));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reloadIfUpdated();
});

/* ---------------- Start ---------------- */

// v1.0 folders: brighter colors, and a creation time so new folders are sorted sensibly
async function migrateFolders() {
  for (const f of await getAll('folders')) {
    const i = OLD_COLORS.indexOf(f.color);
    if (i < 0 && f.created != null) continue;
    await put('folders', { ...f, color: i >= 0 ? COLORS[i] : f.color, created: f.created ?? 0 });
  }
}

(async () => {
  for (const e of document.querySelectorAll('[data-icon]')) e.innerHTML = icon(e.dataset.icon);
  buildPinPad();
  applySettings();
  db = await openDB();
  // ask the browser not to auto-delete our data when storage is low
  navigator.storage?.persist?.().catch(() => {});
  await migrateFolders();
  history.replaceState({ depth: 0 }, '');
  show('home');
  await render();
  await receiveShared();
  try {
    if (sessionStorage.getItem('justUpdated')) {
      sessionStorage.removeItem('justUpdated');
      toast('Aplikacija je ažurirana');
    }
  } catch { /* ignore */ }
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;          // first install, nothing to update
      updateReady = true;
      reloadIfUpdated();
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
