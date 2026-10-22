# Decisions

Append-only. The newest ADRs are below. ADR-001 to ADR-071 are in `agent/archive/`, verbatim, in the four files named in this index. The file has no ADR-025. Only `state.md` names that number. The next number is 074.

## Archived ADRs

- ADR-001 to ADR-024: index lines in `agent/archive/decisions-index-001-024.md`.
- ADR-026 Hash-routed bilingual project detail pages + Qiita notes + headshot (decisions-026-048.md)
- ADR-027 Use fitted 16:9 project captures and lightweight system maps (decisions-026-048.md)
- ADR-028 Full-width technology rails, ClaudeShot, and mobile shared-element expansion (decisions-026-048.md)
- ADR-029 Expand the complete mobile project card and use a retro coin sound (decisions-026-048.md)
- ADR-030 Use the supplied achievement-completed interaction sound (decisions-026-048.md)
- ADR-031 Keep interactive controls silent (decisions-026-048.md)
- ADR-032 Whole experience card toggles, dots re-anchored (decisions-026-048.md)
- ADR-033 Contribution snapshot refreshed by GitHub Actions (decisions-026-048.md)
- ADR-034 Border beam and thinking orb (decisions-026-048.md)
- ADR-035 Project detail gains a real flow chart (decisions-026-048.md)
- ADR-036 Pin detail content width during the mobile expand (decisions-026-048.md)
- ADR-037 Fix real bugs found after the previous session's mobile "verification" (decisions-026-048.md)
- ADR-038 Avatar glow offset on mobile, bio split, and a real mobile card-expand bug (decisions-026-048.md)
- ADR-039 Excalidraw-style hand-drawn flow chart (decisions-026-048.md)
- ADR-040 Mobile detail header shares the image's animation track, not the staggered reveal (decisions-026-048.md)
- ADR-041 Flow chart connector lines: filter region must not depend on a zero-area bounding box (decisions-026-048.md)
- ADR-042 Repository-wide bug sweep: layout drift, modal semantics, toolchain pinning (decisions-026-048.md)
- ADR-043 Two current projects added; private repos and detail depth (decisions-026-048.md)
- ADR-044 The flow chart's hand-drawn filter was invisible; commit to a precise diagram (decisions-026-048.md)
- ADR-045 Project order, a "New" flag, and the title gets its own line (decisions-026-048.md)
- ADR-046 The mobile card-expand clone was reflowing; pin it to the origin card (decisions-026-048.md)
- ADR-047 The mobile close measured its target through a scaled ancestor (decisions-026-048.md)
- ADR-048 Shimmer heading and a visitor counter with number pop-in (decisions-026-048.md)
- ADR-049 Human-voiced copy for Internship Portal and AI Brain Platform (decisions-049-059.md)
- ADR-050 A two-line label must straddle a diamond's midline (decisions-049-059.md)
- ADR-051 GSAP applies vars in reverse, so never mix `inset` with `left`/`top` (decisions-049-059.md)
- ADR-052 Japanese is a real locale, not a translation layer (decisions-049-059.md)
- ADR-053 Copy consistency pass, and the Japanese spacing trap (decisions-049-059.md)
- ADR-054 The open animation's real defects, and two contribution-window bugs (decisions-049-059.md)
- ADR-055 Daijin is a desktop-only, time-driven scroll companion (decisions-049-059.md)
- ADR-056 Use semantic scenes and an imperative half-scale canvas (decisions-049-059.md)
- ADR-057 Keep one left perch and make section performances one-shot (decisions-049-059.md)
- ADR-058 Reserve a mascot header gap instead of overlapping content (decisions-049-059.md)
- ADR-059 Use a responsive left rail and exclude the Playful turnaround (decisions-049-059.md)
- ADR-060 Integrate anonymous analytics and structure without dropping newer remote work (decisions-060-071.md)
- ADR-061 Remove the click sound; rebuild the contribution grid around one portal tooltip (decisions-060-071.md)
- ADR-062 Ledger and CCFT projects, hover clips, tech filter, repo-aware heatmap, Cmd+K, tenure timeline, light theme (decisions-060-071.md)
- ADR-063 Spell UI signature as pre-generated glyph paths; font-swap layout shift fixed at the source (decisions-060-071.md)
- ADR-064 Detail page lower half in each project's own colours, with shorter copy (decisions-060-071.md)
- ADR-065 Prerender the home page and load the bundle after first paint (decisions-060-071.md)
- ADR-066 WebDrop launch video: original phone frame and per-frame font stubs (decisions-060-071.md)
- ADR-067 TokaiHub launch video: masking the owner's data and the end-card claim (decisions-060-071.md)
- ADR-068 Launch videos v4: measured pacing, calm soundtrack, photoreal phone (decisions-060-071.md)
- ADR-069 Launch videos served from public/ for now (decisions-060-071.md)
- ADR-070 A "My Toolkit" section for things made for other builders (decisions-060-071.md)
- ADR-071 Video Bridge on the portfolio, shown from a local test instance (decisions-060-071.md)
- ADR-072: Tiny courts drawn on a low-resolution canvas (`agent/archive/decisions-072.md`)

## ADR-073: Eddy sticker pack built as a standalone lab outside the Vite app (2026-10-22)

Context: the owner asked for a code recreation of the first video in https://x.com/designbyaron/status/2112600237671932327, an "eddy" sticker pack. The pack is dragged or flicked into a spin, then torn open. The stickers burst out, orbit and settle. After that they can be peeled, flipped, carried and dropped. Some stickers are 3D characters that spin and blink.
Decision: build it in `labs/eddy-sticker-pack/`, outside the portfolio app. It is plain HTML, CSS and ES modules with no build step. Vite builds only the root `index.html`, so the lab is not in the portfolio bundle. three.js 0.169.0 is imported by full URL from cdn.jsdelivr.net, not from `package.json` (the app pins 0.180.0 for Tiny courts). One shared WebGL renderer draws each 3D character into that sticker's own 2D canvas. This is used instead of 12 WebGL contexts or one fullscreen canvas, because each sticker must stay a separate DOM element that can be peeled and dragged.
Consequences: the lab needs a static server and network access, for three.js from cdn.jsdelivr.net and the Inter Tight font from Google Fonts. `.claude/launch.json` has an "eddy-sticker-pack" config for the server (python http.server, port 5189). The lab imports nothing from the app, so a fix in one does not reach the other. URL flags and file roles are in `agent/state.md`. The two three.js gotchas are in `agent/errors.md`.

Amendment (2026-10-22): scene builds are async and yield between phases, and ground canvases are sized by pixels per metre, because a synchronous build made a 173 to 464 ms scroll long task. Figure geometry is shared through a shape cache, and disposal frees everything that is not shared.

## ADR-073: The /explain skill ships as a public copy (2026-10-22)

Context: the owner wanted visitors to download the explain-classic skill, in English and Japanese.
Decision: keep a public copy in `scripts/explain-skill/{en,ja,shared}`, not the owner's `~/.folio` skill, because the original names local paths, the CCFT architecture notes path, Folio's world internals and the `/lesson` command. `scripts/make-explain-skill.py` zips each language into `public/media/skills/` with fixed timestamps, so the bytes only change when the sources do. The Japanese package translates the docs and the template page, swaps STE for its own plain-Japanese WRITING.md with `ja_lint.py`, and keeps STE.md for English output. The toolkit card picks the zip by locale.
Consequences: a change to the owner's skill does not reach the download until someone ports it here and rebuilds. The template's worked example still explains CCFT's architecture at a high level.


## ADR-074: Sticker pack embedded as a lazy iframe from public/labs (2026-10-22)

Context: the owner wanted the sticker pack on the home page without loading three.js for every visitor. (ADR-073 is used twice; this follows both.)
Decision: move the lab to `public/labs/sticker-pack/` so Vite copies it into `dist/`, vendor three.js 0.180.0 (the app's version) instead of the CDN, and embed it with an iframe that gets its src only near the viewport. Touch screens load it after a tap, because the lab uses `touch-action: none` and would trap page scrolling. The lab keeps its own CSP header with the importmap hash and `frame-ancestors 'self'`.
Consequences: the lab's three.js is a second copy (860 KB raw, about 180 KB gzip for the two core files, loaded only with the frame). Any edit to the importmap text needs a new sha256 in `vercel.json`. The section shows only the pack and a full-screen link.


## ADR-075: Project pages on real paths, prerendered per project (2026-10-22)

Context: project detail pages lived at `#/project/<slug>`. A hash is never sent to the server, so every project shared one URL, one title and one HTML file for crawlers and link previews.
Decision: use `/projects/<slug>` (no trailing slash). The build writes `dist/projects/<slug>.html` for the 7 projects, each with its own title, description, canonical, og and twitter tags and JSON-LD, and the server HTML already has the detail overlay open. `vercel.json` rewrites `/projects/:slug` to `/projects/:slug.html`. The client uses `pushState` and `popstate`, and old `#/project/<slug>` links, on load and in place, are rewritten to the path with `replaceState`. Files are `<slug>.html`, not `<slug>/index.html`, because `vite preview` serves the home page for the second form (see `agent/errors.md`). This supersedes the hash-routing part of ADR-026.
Consequences: a new project needs an entry in the slug list, the sitemap and `llms.txt`. The build fails if a head pattern is missing or if the `index.html` title differs from `HOME_TITLE`. The Vercel rewrite has not run in production yet. Pageviews are now reported as `/projects/<slug>`, so older `/project/<slug>` rows in analytics are a separate path.
