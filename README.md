<div align="center">

<img src="public/mf-logo.svg" width="72" alt="MF monogram" />

# Mohamed Fuad · Portfolio

**The bilingual (EN / 日本語) personal site of Mohamed Fuad, a full-stack developer in Tokyo, built as a static Vite + React single page.**

[![Live Site](https://img.shields.io/badge/Live-www.mohamedfuad.com-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://www.mohamedfuad.com)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com/)

</div>

---

## Overview

A compact personal site that presents who I am, my work experience, my skills
and my projects, with a lot of attention on motion and a mobile-first layout.
The UI is a static Vite SPA with one small Vercel Function for the Upstash
visitor counter, and Vercel Web Analytics for anonymous traffic reporting.

**Live:** <https://www.mohamedfuad.com>

## Features

- **Bilingual EN / 日本語**: a segmented `EN | 日本語` switch that defaults to
  the browser language and remembers your choice. All copy, work details,
  tooltips and project screenshots have Japanese versions.
- **Dark and light themes**: a sun and moon toggle, with the theme set before
  first paint by `public/theme-init.js`.
- **Command menu**: Cmd+K or Ctrl+K jumps to a section, opens a project, copies
  my email, opens the CV or switches theme.
- **Project detail pages**: each project opens a hash-routed page
  (`#/project/<slug>`) with an overview, key features, how it works and the
  stack. Projects can be filtered by technology, and a short clip plays on hover.
- **GSAP motion**: hero entrance, section-title slide-ins, parallax inside
  project cards, timeline node pops and a `ScrollSmoother` shell. Decorative
  motion stands down under `prefers-reduced-motion`.
- **Hand-drawn signature**: a single-stroke "Mohamed Fuad" signature drawn on
  scroll with GSAP `DrawSVG`.
- **GitHub contribution grid**: a contribution heatmap from my GitHub activity
  that shows which public repositories each day went to. A scheduled workflow
  refreshes the snapshot every 6 hours.
- **Flip card**: the profile photo flips to show a LinkedIn QR code.
- **Work history**: timeline rows with company logos and tenure that expand to
  bilingual role details.
- **Locale-aware CV download**: the Japanese 履歴書・職務経歴書 or the English CV,
  based on the active locale.
- **Readable by search engines and AI crawlers**: JSON-LD Person data, Open
  Graph tags, `robots.txt`, `sitemap.xml` and `llms.txt`.
- **Dev notes**: the "Thoughts in words" section links to my
  [Qiita profile](https://qiita.com/mfuad16).

## Featured Projects

| Project | What it is | Links |
| ------- | ---------- | ----- |
| **Ledger** | Reads a 100-page annual report, finds the few pages that matter, and returns a checked balance sheet | [Live](https://assignment.mohamedfuad.com) · [Repo](https://github.com/MohamedFuad16/ledger-financial-report-system) |
| **WebDrop** | Nearby file sharing in the browser, with proximity checks and direct WebRTC transfers | [Live](https://webdrop.mohamedfuad.com) · [Repo](https://github.com/MohamedFuad16/WebDrop) |
| **Internship Portal** | A bilingual app for finding internships and keeping every application in one list, on the web and on iOS | [Live](https://portal.mohamedfuad.com) · [Repo](https://github.com/MohamedFuad16/resume-studio-dashboard) |
| **CCFT** | A leader model plans the work as a task graph, and a scheduler runs parallel worker agents through it, with a native macOS app on top | Private repo |
| **Tutor-System** | A study workspace for papers and textbooks that keeps track of where every answer came from | [Live](https://tutor-system-architecture.vercel.app/) · [Repo](https://github.com/MohamedFuad16/Tutor-System) |
| **TokaiHub** | A bilingual student app for Tokai University that reads the university's TIPS portal | [Live](https://tokaihub.mohamedfuad.com/) · [Repo](https://github.com/MohamedFuad16/TokaiHub) |
| **ClaudeShot** | A native macOS shortcut that captures the frontmost window and pastes it into Claude | [Repo](https://github.com/MohamedFuad16/ClaudeShot) |

## Tech Stack

- **React 19** + **Vite 8** (static SPA)
- **GSAP** (`ScrollTrigger`, `ScrollSmoother`, `DrawSVG`, `SplitText`, `ScrollToPlugin`) + `@gsap/react`
- **lucide-react** and **react-icons** for icons
- **border-beam** for the avatar beam
- **Vercel Web Analytics** for anonymous, cookie-free page-view reporting
- **Upstash Redis** for the de-duplicated visitor counter
- Hand-written CSS visual system

## Project Structure

```
api/visits.mjs                  # Vercel Function for the Upstash-backed counter
src/main.jsx                    # React + Vercel Analytics entry point
src/App.jsx                     # Portfolio data, views, routing and motion
src/components/DaijinMascot.jsx # Canvas mascot component
src/data/signature-path.js      # Generated single-stroke signature data
src/styles/global.css           # Visual system
public/media/                   # Data, images, logos, mascot, project and video assets
public/resume/                  # CV PDFs (EN / JA)
public/theme-init.js            # Sets the theme before first paint
scripts/check-assets.mjs        # Verifies public and nested SVG asset references
scripts/fetch-contributions.mjs # Refreshes the contribution snapshot
```

## Getting Started

> This tree does **not** track `node_modules` / `dist`; install after cloning.
> Vite 8 needs **Node ^20.19 or >=22.12** (see `.nvmrc` / `engines`); older
> Node fails the build with a `styleText` import error from rolldown.

```bash
pnpm install      # this workspace is pnpm-managed
pnpm dev          # Vite dev server on http://127.0.0.1:5173
pnpm check        # Asset validation + production build
pnpm preview      # Preview the production build
```

## Environment

The site is static except for one serverless function, `api/visits.mjs`, which
backs the footer's visitor counter. Set these in the Vercel project:

| Variable | Purpose |
| -------- | ------- |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `VISITS_SALT` | Optional. Salt for the visitor de-duplication hash |
| `GH_TIME_ZONE` | Time zone for `scripts/fetch-contributions.mjs` (default in `.env.example`: `Asia/Tokyo`) |

Without the Upstash variables the endpoint returns 503 and the footer omits the
counter, so the site works unchanged. Visitors are de-duplicated server-side by
a truncated salted hash of IP + user-agent with a 30-day expiry; no address is
stored.

Vercel Web Analytics needs no environment variable or external analytics
account. In the Vercel project, open **Analytics**, select **Enable**, and
deploy. The app reports `/` and each `/project/<slug>` virtual page separately
so hash-routed project views appear in the dashboard. Reports are anonymous
aggregates and do not expose raw IP addresses or identify anonymous people.

## Deployment

The site is deployed to **Vercel** at <https://www.mohamedfuad.com>. Vercel
builds the Vite application, serves `api/visits.mjs`, and hosts the Web
Analytics dashboard.

## Contact

- Site: <https://www.mohamedfuad.com>
- LinkedIn: <https://www.linkedin.com/in/mohamed-fuad-6b8483278>
- Qiita: <https://qiita.com/mfuad16>
- Email: <mohamed.fuad.jp@gmail.com>

---

<div align="center">
Built by <a href="https://github.com/MohamedFuad16">Mohamed Fuad</a>
</div>
