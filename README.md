# Bilješke (Notes-app)

Private notes app for personal, day-to-day use. Version **1.0.0**.

Live: https://horvatm123.github.io/Notes-app/

It is an installable web app (PWA). All notes are stored only on the device, in the browser's database (IndexedDB). Nothing is sent to a server; this repository contains only the app code.

## Install on a phone
- **Android (Chrome):** open the link → ⋮ → *Install app* / *Add to home screen*
- **iPhone (Safari):** open the link → Share → *Add to Home Screen*

## Features
- **Home screen:** tabs for notes without a folder (home), each folder, and all notes; list or grid view (Samsung Notes style); search that ignores diacritics (`sesir` finds `šešir`)
- **Folders** with colors, managed from the ☰ menu
- **Editor:** formatting tools behind the pencil button: bold, italic, colored underline, text color, highlight, font size, lists (bullets, numbers, dashes, arrows), checklists, images (resized to max 1280 px); autosave
- **Note menu (⋮):** move to folder, share, copy text, lock / unlock, delete
- **Locked notes:** 6-digit PIN; content encrypted with AES-256-GCM, key derived from the PIN with PBKDF2 (600 000 rounds). Titles stay visible. A forgotten PIN cannot be recovered.
- **Backup:** ☰ → *Izvezi kopiju* saves one JSON file; *Uvezi kopiju* merges it back (newer version of a note wins). Locked notes stay encrypted in the file, other notes are readable.
- Works offline, dark mode, updates itself when a new version is published

## Files
| File | Purpose |
|---|---|
| `index.html` | markup |
| `style.css` | look |
| `app.js` | logic: database, list, editor, locking, backup |
| `sw.js` | service worker (offline cache, updates) |
| `manifest.webmanifest`, `icons/` | install info |

## Releasing a new version
Change `APP_VERSION` in `app.js` and the `CACHE` name in `sw.js`; installed apps pick up the update automatically.

## Run locally
`python -m http.server` in this folder, then open http://localhost:8000
