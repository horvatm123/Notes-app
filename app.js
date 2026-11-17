'use strict';

const $ = id => document.getElementById(id);
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
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
const APP_VERSION = '1.0.1';
const MAX_IMG = 1280;          // longest image side in px after resizing
const SAVE_DELAY = 600;        // ms of inactivity before autosave
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
};
const icon = name =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

/* ---------------- State ---------------- */

let db;
let folders = [];
let filter = loadPref('filter', 'home');   // 'home' (no folder), 'all' or folder id
let query = '';
let searchOpen = false;
let view = 'home';
let viewMode = loadPref('viewMode', 'list');   // 'list' or 'grid'
let current = null;            // note being edited (plain text, memory only)
let currentKey = null;         // key of the open locked note (memory only, never stored)
let curFolder = null;          // folder being edited
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

// items: { icon | dot, label, onClick, danger, checked }
function menuList(items) {
  const box = el('div', 'menu');
  for (const it of items) {
    const b = el('button', 'menu-item' + (it.danger ? ' danger' : ''));
    b.type = 'button';
    if (it.dot) {
      const d = el('span', 'dot');
      d.style.background = it.dot;
      b.append(d);
    } else {
      b.insertAdjacentHTML('beforeend', icon(it.icon));
    }
    b.append(el('span', null, it.label));
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
  e.classList.remove('shake', 'swap');
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
  filter = f;
  savePref('filter', f);
}

function renderHeader() {
  const f = folderById(filter);
  $('homeTitle').textContent = f ? f.name : filter === 'all' ? 'Sve bilješke' : 'Bilješke';
  const next = viewMode === 'grid' ? 'list' : 'grid';
  $('viewBtn').innerHTML = icon(next);
  $('viewBtn').setAttribute('aria-label', next === 'grid' ? 'Prikaz mreže' : 'Prikaz popisa');
  renderTabs();
}

function renderTabs() {
  const box = $('tabs');
  box.replaceChildren();
  const tab = (id, label) => {
    const b = el('button', 'tab' + (filter === id ? ' active' : ''));
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.onclick = () => { setFilter(id); render(); };
    box.append(b);
    return b;
  };
  const home = tab('home', 'Bilješke izvan mapa');
  home.classList.add('home');
  home.innerHTML = icon('home');
  for (const f of folders) {
    const b = tab(f.id, 'Mapa ' + f.name);
    const d = el('span', 'dot');
    d.style.background = f.color;
    b.append(d, el('span', 'label', f.name));
  }
  const all = tab('all', 'Sve bilješke');      // last, pushed to the right edge
  all.classList.add('all');
  all.textContent = 'Sve';
  box.querySelector('.active')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
}

async function render() {
  folders = (await getAll('folders')).sort((a, b) => a.name.localeCompare(b.name, 'hr'));
  if (filter !== 'all' && filter !== 'home' && !folderById(filter)) setFilter('home');
  renderHeader();

  let notes = await getAll('notes');
  const q = searchOpen ? norm(query.trim()) : '';
  if (q) notes = notes.filter(n => norm(n.title + ' ' + (n.locked ? '' : n.body)).includes(q));   // search covers all folders
  else if (filter === 'home') notes = notes.filter(n => !n.folderId);
  else if (filter !== 'all') notes = notes.filter(n => n.folderId === filter);
  notes.sort((a, b) => b.updated - a.updated);

  const list = $('list');
  list.className = 'list mode-' + viewMode;
  list.replaceChildren();
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
  for (const n of notes) list.append(viewMode === 'grid' ? gridCard(n, showFolder) : listCard(n, showFolder));
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
  if (f && withDot) {
    const d = el('span', 'dot');
    d.style.background = f.color;
    m.append(d);
  }
  const parts = [formatDate(n.updated)];
  if (f && showFolder) parts.push(f.name);
  if (n.images) parts.push(n.images === 1 ? '1 slika' : n.images + ' slike');
  m.append(parts.join(' · '));
  return m;
}

function listCard(n, showFolder) {
  const f = folderById(n.folderId);
  const card = el('article', 'note');
  if (f) card.style.borderLeftColor = f.color;
  card.append(el('b', null, n.title || 'Bez naslova'));
  if (n.locked) {
    const p = el('div', 'preview locked');
    p.innerHTML = icon('lock');
    p.append('Zaključano');
    card.append(p);
  } else {
    const text = (n.body || '').replace(/\s+/g, ' ').slice(0, 140);
    if (text) card.append(el('div', 'preview', text));
  }
  card.append(metaLine(n, f, showFolder, false), moreButton(n));
  card.onclick = () => openNote(n);
  return card;
}

function gridCard(n, showFolder) {
  const f = folderById(n.folderId);
  const card = el('article', 'note');
  const th = el('div', 'thumb rich');
  if (n.locked) {
    th.classList.add('locked');
    th.innerHTML = icon('lock');
  } else {
    th.innerHTML = sanitize(noteHtml(n));
    if (!th.textContent.trim() && !th.querySelector('img')) th.classList.add('empty-thumb');
  }
  card.append(th, el('div', 'name', n.title || 'Bez naslova'), metaLine(n, f, showFolder, true), moreButton(n));
  card.onclick = () => openNote(n);
  return card;
}

/* ---------------- Folders drawer ---------------- */

async function openDrawer() {
  const notes = await getAll('notes');
  const count = id => notes.filter(n => (n.folderId || null) === id).length;
  const box = $('folderList');
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

  const home = row(filter === 'home');
  home.append(pickBtn('home', 'Bilješke', count(null), async () => { setFilter('home'); await back(); render(); }));
  const all = row(filter === 'all');
  all.append(pickBtn('notes', 'Sve bilješke', notes.length, async () => { setFilter('all'); await back(); render(); }));
  box.append(home, all);

  for (const f of folders) {
    const r = row(filter === f.id);
    const d = el('span', 'dot');
    d.style.background = f.color;
    r.append(pickBtn(d, f.name, count(f.id), async () => { setFilter(f.id); await back(); render(); }));
    const edit = el('button', 'icon-btn');
    edit.type = 'button';
    edit.innerHTML = icon('edit');
    edit.setAttribute('aria-label', 'Uredi mapu ' + f.name);
    edit.onclick = async () => { await back(); openFolderEd(f); };
    r.append(edit);
    box.append(r);
  }

  const add = row(false, 'add');
  add.append(pickBtn('plus', 'Nova mapa', null, async () => { await back(); openFolderEd(); }));
  box.append(add);

  // backup
  box.append(el('h4', 'drawer-sub', 'Sigurnosna kopija'));
  const last = Number(loadPref('lastBackup', 0));
  const exp = row(false);
  exp.append(pickBtn('download', 'Izvezi kopiju', null, async () => { await back(); exportBackup(); }));
  exp.querySelector('.pick').append(el('span', 'count', last ? formatDate(last) : 'nikad'));
  const imp = row(false);
  imp.append(pickBtn('upload', 'Uvezi kopiju', null, () => { $('importInput').click(); back(); }));
  box.append(exp, imp, el('p', 'version', 'Bilješke · verzija ' + APP_VERSION));

  drawerOpen = true;
  $('drawer').classList.add('open');
  updateScrim();
  pushLayer(() => {
    drawerOpen = false;
    $('drawer').classList.remove('open');
    updateScrim();
  });
}

/* ---------------- Note menu (⋮) ---------------- */

function openNoteMenu(n) {
  showSheet(sh => {
    sh.append(sheetTitle(n.title || 'Bez naslova'));
    const items = [
      { icon: 'folder', label: 'Premjesti u mapu', onClick: () => openMoveSheet(n) },
    ];
    if (navigator.share) items.push({ icon: 'share', label: 'Podijeli', onClick: () => shareNote(n) });
    items.push({ icon: 'copy', label: 'Kopiraj tekst', onClick: () => copyNote(n) });
    items.push(n.locked
      ? { icon: 'unlock', label: 'Otključaj', onClick: () => unlockNote(n) }
      : { icon: 'lock', label: 'Zaključaj', onClick: () => lockNote(n) });
    items.push({ icon: 'trash', label: 'Obriši', danger: true, onClick: () => deleteNote(n) });
    sh.append(menuList(items));
  });
}

function openMoveSheet(n) {
  showSheet(sh => {
    sh.append(sheetTitle('Premjesti u mapu'));
    const move = async (id, name) => {
      await updateNote(n.id, { folderId: id });
      await closeSheet();
      toast(id ? `Premješteno u „${name}”` : 'Uklonjeno iz mape');
      render();
    };
    const items = [{ icon: 'notes', label: 'Bez mape', checked: !n.folderId, onClick: () => move(null) }];
    for (const f of folders)
      items.push({ dot: f.color, label: f.name, checked: n.folderId === f.id, onClick: () => move(f.id, f.name) });
    sh.append(menuList(items));
    if (!folders.length) sh.append(el('p', 'hint', 'Još nemaš mapa. Napravi ih u izborniku mapa (gore lijevo).'));
  });
}

// plain text of a note, asks for the password if it is locked
async function noteText(n, why) {
  let fresh = await getOne('notes', n.id);
  if (!fresh) return null;
  let body = fresh.body || '';
  if (fresh.locked) {
    await closeSheet();
    const key = await getLockKey(why, false);
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
  await updateNote(n.id, { html: data.html, body: data.body, images: countImages(data.html), locked: undefined, enc: undefined });
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
  toast('Bilješka je obrisana');
  render();
}

/* ---------------- Backup (export / import) ----------------
   One JSON file with all notes, folders and the PIN check.
   Locked notes stay encrypted inside the file; open notes are readable. */

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

async function exportBackup() {
  const data = {
    app: 'biljeske', format: 1, version: APP_VERSION, exported: Date.now(),
    notes: await getAll('notes'), folders: await getAll('folders'), meta: await getAll('meta'),
  };
  const blob = new Blob([JSON.stringify(data, backupReplacer)], { type: 'application/json' });
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = `biljeske-kopija-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  savePref('lastBackup', String(Date.now()));
  toast('Kopija je spremljena u Preuzimanja');
}

async function importBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text(), backupReviver);
  } catch {
    data = null;
  }
  if (data?.app !== 'biljeske' || !Array.isArray(data.notes) || !Array.isArray(data.folders)) {
    toast('Ovo nije ispravna kopija bilješki');
    return;
  }
  const ok = await confirmSheet({
    title: 'Uvesti kopiju?',
    text: `Kopija sadrži ${data.notes.length} bilješki i ${data.folders.length} mapa. Postojeće bilješke ostaju. ` +
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
  const t = db.transaction(['notes', 'folders', 'meta'], 'readwrite');
  for (const f of data.folders) {
    if (!f || typeof f.id !== 'string' || typeof f.name !== 'string' || localFolders.has(f.id)) continue;
    t.objectStore('folders').put({ id: f.id, name: f.name.slice(0, 40), color: COLORS.includes(f.color) ? f.color : COLORS[5] });
  }
  for (const n of data.notes) {
    if (!n || typeof n.id !== 'string' || typeof n.updated !== 'number') continue;
    if (n.locked && (!n.enc || !lockedUsable)) { skipped++; continue; }
    const cur = localNotes.get(n.id);
    if (cur && cur.updated >= n.updated) continue;
    const note = {
      id: n.id, title: String(n.title || ''), folderId: typeof n.folderId === 'string' ? n.folderId : null,
      updated: n.updated, images: Number(n.images) || 0,
      body: n.locked ? '' : String(n.body || ''),
      html: n.locked ? '' : sanitize(String(n.html ?? textToHtml(n.body || ''))),
    };
    if (n.locked) { note.locked = true; note.enc = n.enc; note.images = 0; }
    t.objectStore('notes').put(note);
    added++;
  }
  if (adoptLock) t.objectStore('meta').put(backupLock);
  await new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); });
  await render();
  toast(`Uvezeno bilješki: ${added}` + (skipped ? ` · preskočeno zaključanih: ${skipped} (drugi PIN)` : ''));
}

/* ---------------- Editor ---------------- */

async function openNote(n) {
  const fresh = await getOne('notes', n.id);
  if (!fresh) return render();
  if (!fresh.locked) return openEditor(fresh, null);
  const key = await getLockKey(fresh.title || 'Zaključana bilješka', false);
  if (!key) return;
  const latest = await getOne('notes', n.id);     // re-read: a PIN migration may have re-encrypted it
  const data = await decryptJSON(key, latest.enc);
  openEditor({ ...latest, html: data.html, body: data.body }, key);
}

function openEditor(n, key) {
  homeScroll = window.scrollY;
  current = n
    ? { ...n }
    : { id: crypto.randomUUID(), title: '', body: '', html: '', images: 0,
        folderId: folderById(filter) ? filter : null, updated: Date.now() };
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
  current = { ...current, title, html, body: text, images, updated: Date.now() };
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

/* ---------------- Folder editor ---------------- */

function openFolderEd(f) {
  curFolder = f ? { ...f } : { id: crypto.randomUUID(), name: '', color: COLORS[5] };
  $('fTitle').textContent = f ? 'Uredi mapu' : 'Nova mapa';
  $('fName').value = curFolder.name;
  $('fDel').hidden = !f;
  drawSwatches();
  pushLayer(async () => { show('home'); await render(); });
  show('folderEd');
  if (!f) $('fName').focus();
}

function drawSwatches() {
  const box = $('swatches');
  box.innerHTML = '';
  for (const c of COLORS) {
    const b = el('button', 'sw' + (c === curFolder.color ? ' sel' : ''));
    b.type = 'button';
    b.style.background = c;
    b.setAttribute('aria-label', 'Boja ' + c);
    b.onclick = () => { curFolder.color = c; drawSwatches(); };
    box.append(b);
  }
}

/* ---------------- Events ---------------- */

// home
$('newBtn').onclick = () => openEditor();
$('foldersBtn').onclick = () => openDrawer();
$('viewBtn').onclick = () => {
  viewMode = viewMode === 'grid' ? 'list' : 'grid';
  savePref('viewMode', viewMode);
  render();
};
$('searchBtn').onclick = () => {
  searchOpen = true;
  $('appbarMain').hidden = true;
  $('appbarSearch').hidden = false;
  $('tabs').hidden = true;
  $('search').focus();
  render();
  pushLayer(() => {
    searchOpen = false;
    query = '';
    $('search').value = '';
    $('appbarSearch').hidden = true;
    $('appbarMain').hidden = false;
    $('tabs').hidden = false;
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

// save when the app goes to the background; close a locked note after a longer pause
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    flushSave();
  } else if (view === 'editor' && currentKey && Date.now() - hiddenAt > LOCK_AFTER_MS) {
    back();
  }
});

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

// folder editor
$('fCancel').onclick = () => back();
$('fSave').onclick = async () => {
  curFolder.name = $('fName').value.trim();
  if (!curFolder.name) { toast('Upiši ime mape'); $('fName').focus(); return; }
  await put('folders', curFolder);
  setFilter(curFolder.id);
  await back();
};
$('fDel').onclick = async () => {
  const ok = await confirmSheet({
    title: 'Obrisati mapu?',
    text: `Mapa „${curFolder.name}” se briše, a bilješke iz nje ostaju i prelaze u bilješke bez mape.`,
    confirmLabel: 'Obriši mapu',
    danger: true,
  });
  if (!ok) return;
  for (const n of await getAll('notes'))
    if (n.folderId === curFolder.id) { n.folderId = null; await put('notes', n); }
  await del('folders', curFolder.id);
  setFilter('home');
  await back();
};

$('importInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (file) await importBackup(file);
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

(async () => {
  for (const e of document.querySelectorAll('[data-icon]')) e.innerHTML = icon(e.dataset.icon);
  buildPinPad();
  db = await openDB();
  // ask the browser not to auto-delete our data when storage is low
  navigator.storage?.persist?.().catch(() => {});
  history.replaceState({ depth: 0 }, '');
  show('home');
  await render();
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
