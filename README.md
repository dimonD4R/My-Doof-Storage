<p align="center">
  <h1 align="center">Your Memories</h1>
  <p align="center">
    A private, self-hosted web archive for photos and videos — organized by
    time, events, people, and place.
  </p>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=flat-square" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" />
  <img alt="React Router" src="https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter&logoColor=white&style=flat-square" />
</p>

---

## About

Your Memories turns a simple JSON catalog + raw media files on GitHub into a
beautiful, browseable personal library. No database, no backend server — a
static web app that loads a metadata file (`MOB-Storage.json`) and streams
photos and videos straight from a global CDN.

The archive is private by default, and safe to share through
self-contained link tokens with fine-grained permissions.

## Features

- **Memories** — every photo and video in one grid, with responsive image
  thumbnails generated on the fly.
- **Timeline** — chronological browsing grouped by year and month.
- **Events** — real-life outings (a zoo visit, a forest trek) auto-detected
  from your data and presented with cover photos.
- **Collections** — build your own hand-picked albums (stored in your browser).
- **Favorites** — star the moments that matter most.
- **People & Categories** — filter by people, categories, subcategories,
  keywords, and media type.
- **Fast search** — debounced full-text search across titles, dates, and
  keywords.
- **Gallery views** — switch between grid, comfortable, masonry, and timeline
  layouts.
- **Lightbox & stories** — full-resolution viewing with a story-style viewer.
- **Download as ZIP** — select multiple memories and download them in one
  archive (built with `jszip`).
- **Share links** — generate compact, self-encoded tokens
  (`#/share/...`) for a collection or event with granular permissions:
  - view photos / view videos
  - allow downloads
  - original quality only
  - optional password gate and expiry date
  - fully offline-safe (works on any static host, no server rewrites)
- **QR codes** — instantly open a share link on your phone.
- **Surprise mode** — a little delight for opening the archive.
- **Offline-friendly** — the metadata catalog is cached in
  `localStorage` (6-hour TTL) and a bundled copy ships inside the build.

## How it works

```
GitHub repository (media + MOB-Storage.json)
        │
        ├── jsDelivr CDN (cdn.jsdelivr.net)  ──► images & videos (Range requests ✚ CORS)
        ├── raw.githubusercontent.com        ──► fallback + original downloads
        └── wsrv.nl (Weserv)                 ──► lightweight WebP thumbnails
                                │
                                ▼
              Your Memories web app (any static host)
```

1. On startup the app fetches `MOB-Storage.json` — a flat catalog in which each
   entry points to a media file by relative path and carries its category,
   subcategories, and keywords.
2. The catalog is **normalized** into a `MediaItem[]`: dates are parsed from
   titles, people are inferred from keywords/subcategories, and events are
   grouped automatically.
3. Revisits within 6 hours are served instantly from `localStorage`; the remote
   URL is re-probed across `main` / `master` / `gh-pages` if the configured
   branch is wrong.

## Tech stack

| Layer       | Choice                        |
| ----------- | ----------------------------- |
| UI          | React 18                      |
| Language    | TypeScript 5                  |
| Build       | Vite 6                        |
| Styling     | Tailwind CSS 4                |
| Routing     | React Router 6 (hash mode)    |
| Downloads   | JSZip                         |
| QR codes    | `qrcode.react`                |

## Getting started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# type-check
npm run typecheck

# production build
npm run build

# preview the production build
npm run preview
```

### Data configuration

The app reads its source repository from the `baseUrl` field inside
`MOB-Storage.json`. To point it at your own media repository:

| Method               | How                                                                 |
| -------------------- | ------------------------------------------------------------------- |
| Metadata file        | set `baseUrl` to your repo, e.g. `https://github.com/you/media-repo` |
| Environment variable | `VITE_DATA_URL=https://.../MOB-Storage.json` (takes precedence)      |

Example `MOB-Storage.json` entry:

```json
{
  "version": "1.0.0",
  "baseUrl": "https://github.com/dimonD4R/Web-My-Personal-Photos-Videos",
  "videos": [
    {
      "id": "1",
      "title": "2026-07-01 15:04",
      "Image": "Biodiversity_Aravali-Rahul-Lalita-Mummy/Mummy - Lalita/20260701_150421.jpg",
      "video": "",
      "category": "Biodiversity Aravali",
      "subcategories": ["Mummy Lalita"],
      "keywords": ["Mummy", "Lalita", "Biodiversity", "Aravali"]
    }
  ]
}
```

> Media paths are relative to the repository root, so keep the same folder
> layout in your media repository and mirror the catalog file there (or bundle
> it locally under `public/data/MOB-Storage.json`).

## Project structure

```
src/
├── components/
│   ├── collections/   # collection create / add-to dialogs
│   ├── downloads/     # ZIP download dialog
│   ├── events/        # event cards & covers
│   ├── filters/       # filter drawer + active filter chips
│   ├── gallery/       # media grid & cards
│   ├── media/         # lightbox & story viewer
│   ├── navigation/    # header, sidebar, mobile nav, layout
│   ├── search/        # search bar
│   ├── sharing/       # share modal
│   └── ui/            # buttons, menus, chips, icons, toasts
├── data/              # repository resolution, loader, normalizer
├── hooks/             # debounce & filter hooks
├── lib/               # sharing, search, filtering, downloads
├── pages/             # home, memories, events, timeline, collections,
│                      # favorites, categories, people, share
├── state/             # global store + surprise mode
├── types/             # shared TypeScript models
└── utils/             # storage, date, class-name helpers
public/data/           # bundled local copy of the catalog
```

## Deployment

The app is a fully static site and routes with hash URLs, so it deploys
anywhere:

```bash
npm run build    # outputs to dist/
```

Then serve `dist/` from GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any
static host — no redirect or rewrite rules required.

## Roadmap

- [ ] Lazy-load gallery tiles for very large archives
- [ ] EXIF-based date fallback when titles carry no date
- [ ] Collage-style covers for collection shares
- [ ] Custom share branding per link

## License

Private. Built for a personal archive — the public docs and app shell only.