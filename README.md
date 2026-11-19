# Bilješke (Notes-app)

Private notes app for personal, day-to-day use. Version **1.5.0**.

Live: https://horvatm123.github.io/Notes-app/

It is an installable web app (PWA). All notes are stored only on the device, in the browser's database (IndexedDB). Nothing is sent to a server; this repository contains only the app code.

## Install on a phone
- **Android (Chrome):** open the link → ⋮ → *Install app* / *Add to home screen*
- **iPhone (Safari):** open the link → Share → *Add to Home Screen*

## Features
- **Home screen:** always opens on home; tabs for notes without a folder, each folder and all notes; the folder you wrote in last moves to the front; a button shows all folders as tiles; list or grid view
- **Search** ignores diacritics and forgives typos (`promijena` finds `promjena`)
- **Folders** with bright colors; ⋮ inside a folder: edit name/color, lock with the PIN, export the folder, delete (also from ☰ → pencil). A locked folder needs the PIN to open, its notes are encrypted and hidden from *Sve* and search
- **Editor:** blue back and *Spremi* (save and close) buttons, formatting tools behind the pencil button, autosave
- **Select notes:** long press on a note starts the selection (tap to add more, *Odaberi sve*); ⋮ deletes, moves, exports or locks all selected notes
- **Deleting a folder** deletes the notes in it too (after a confirmation; a locked folder needs the PIN)
- **Note menu (⋮):** move to a folder or a new folder, share, copy text, lock / unlock, delete
- **Cards** show the date and time the note was created; the last edited note is on top
- **Settings (☰ → Postavke):** theme (system/light/dark), accent color, font (DM Sans, Source Serif 4, system), text size
- **Locked notes:** 6-digit PIN; AES-256-GCM, key from the PIN with PBKDF2 (600 000 rounds). Titles stay visible. A forgotten PIN cannot be recovered.
- **Backup:** ☰ → *Izvezi kopiju*: to Google Drive (share sheet) or to the device, optionally encrypted with the PIN. *Uvezi* merges it back (newer version of a note wins)
- **Import from other apps:** Google Keep (Takeout `.zip` or `.json`), `.txt`/`.md` files, and *Share → Bilješke* from any app (share target)
- Works offline, animations respect the system "reduce motion" setting, updates itself when a new version is published

## Files
| File | Purpose |
|---|---|
| `index.html` | markup |
| `style.css` | look, themes, animations |
| `app.js` | logic: database, list, search, editor, locking, settings, backup, import |
| `sw.js` | service worker (offline cache, updates) |
| `manifest.webmanifest`, `icons/` | install info, share target |
| `fonts/` | DM Sans and Source Serif 4 (SIL Open Font License, see `fonts/OFL-*.txt`) |

## Releasing a new version
Change `APP_VERSION` in `app.js` and the `CACHE` name in `sw.js`; installed apps pick up the update automatically.

## Run locally
`python -m http.server` in this folder, then open http://localhost:8000
