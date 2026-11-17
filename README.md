# Notes-app
App for taking personal, day-to-day notes ----> only for private use

Installable web app (PWA). All notes are stored locally in the browser (IndexedDB); nothing is sent to a server.

## Features (v1)
- notes with formatting: bold, italic, headings, bullet / numbered lists, checklists
- images (resized to max 1280 px before saving)
- folders with colors
- search (ignores diacritics: `sesir` finds `šešir`)
- autosave, dark mode, works offline, installable on phone

## Files
- `index.html` – markup
- `style.css` – look
- `app.js` – logic (database, list, editor)
- `sw.js` – service worker (offline cache)
- `manifest.webmanifest`, `icons/` – install info

## Run locally
`python -m http.server` in this folder, then open http://localhost:8000
