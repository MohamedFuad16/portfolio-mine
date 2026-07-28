<div align="center">

# Mohamed Fuad — Portfolio

**A fast, bilingual (EN / 日本語) personal portfolio built as a static Vite + React single page.**

[![Live Site](https://img.shields.io/badge/Live-portfolio--mine.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://portfolio-mine-two-ruddy.vercel.app)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com/)

</div>

---

## Overview

A dark, compact, dashed-border personal site that presents who I am, my work
experience, my skills, and my projects — with a heavy focus on motion, polish,
and a clean mobile-first responsive layout. It is a **static front end with no
backend, API, or persistence layer**; everything renders in the browser.

**Live:** <https://portfolio-mine-two-ruddy.vercel.app>

## Features

- **Bilingual EN / 日本語** — one-tap segmented `EN | 日本語` locale switch that
  defaults to the browser language and remembers your choice. All copy, work
  details, tooltips, and even project screenshots have Japanese variants.
- **GSAP motion system** — coordinated hero entrance, section-title slide-ins,
  scroll-driven parallax inside project cards, timeline node pops, a live
  equalizer wave divider, and a `ScrollSmoother` smooth-scroll shell. All motion
  is gated behind `prefers-reduced-motion`.
- **Hand-drawn signature** — a single-stroke "Mohamed Fuad" monoline signature
  drawn on scroll via GSAP `DrawSVG`, with a perpetual highlight that traces the
  handwriting.
- **Live GitHub contribution grid** — a real contribution heatmap pulled from my
  GitHub activity, with edge-aware hover tooltips (date + contribution count,
  localized).
- **Two-sided flip card** — profile photo that flips to reveal a LinkedIn QR code.
- **Expandable work history** — timeline rows with official company logos that
  expand to bilingual role details.
- **Tactile feedback** — a water-ripple + soft chime on tap (real taps only —
  scrolling and dragging don't trigger it).
- **Locale-aware résumé download** — serves the Japanese 履歴書・職務経歴書 or
  the English CV based on the active locale.
- **Project detail pages** — clicking a project opens a dedicated, hash-routed
  detail page (Overview · Key Features · How It Works · tech stack) that animates
  in and out with GSAP and is fully bilingual.
- **Dev notes** — the "Thoughts in words" section links out to my
  [Qiita profile](https://qiita.com/mfuad16).
- **Responsive & OLED-friendly** — verified with no horizontal overflow at
  320 / 375 / 768 / 1280 / 1920 px in both locales.

## Featured Projects

| Project | What it is | Links |
| ------- | ---------- | ----- |
| **WebDrop** | AirDrop-style browser file sharing with bump pairing, ultrasonic handshake, and WebRTC streams | [Live](https://web-drop-lyart.vercel.app/) · [Repo](https://github.com/MohamedFuad16/WebDrop) |
| **Tutor-System** | AI learning app with tutor tools, realtime voice tutoring, and source-aware PDF chat | [Live](https://tutor-system-architecture.vercel.app/) · [Repo](https://github.com/MohamedFuad16/Tutor-System) |
| **TokaiHub** | Mobile-first bilingual student portal PWA with AWS Cognito auth | [Live](https://mohamedfuad16.github.io/TokaiHub/) · [Repo](https://github.com/MohamedFuad16/TokaiHub) |
| **ClaudeShot** | Native macOS utility that captures the frontmost window straight into Claude | [Repo](https://github.com/MohamedFuad16/ClaudeShot) |

## Tech Stack

- **React 19** + **Vite** (static SPA, no backend)
- **GSAP** (`ScrollTrigger`, `ScrollSmoother`, `DrawSVG`, `SplitText`, `ScrollToPlugin`) + `@gsap/react`
- **lucide-react** and **react-icons** for iconography
- **border-beam** and **thinking-orbs** for the avatar beam and the agent motif
- Hand-written CSS visual system (dark, dashed-border, compact)

## Project Structure

```
index.html            # Loads fonts + the React entry
src/main.jsx          # Portfolio data (experience, skills, projects) + React components
src/styles.css        # Dark, compact, dashed-border visual system
src/signature-path.js # Generated single-stroke signature path data
public/assets/        # Project screenshots & logos (EN + JA variants)
public/resume/        # CV PDFs (EN / JA)
```

## Getting Started

> This tree does **not** track `node_modules` / `dist` — install after cloning.
> Vite 8 needs **Node ^20.19 or >=22.12** (see `.nvmrc` / `engines`); older
> Node fails the build with a `styleText` import error from rolldown.

```bash
pnpm install      # this workspace is pnpm-managed
pnpm dev          # Vite dev server on http://127.0.0.1:5173
pnpm build        # Production build into dist/
pnpm preview      # Preview the production build
```

## Deployment

The site is a static build deployed to **Vercel**. Run `pnpm build` and
serve `dist/` from any static host.

---

<div align="center">
Built by <a href="https://github.com/MohamedFuad16">Mohamed Fuad</a>
</div>
