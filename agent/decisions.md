# Decisions

Append-only. The newest ADRs are below. ADR-001 to ADR-071 are in `agent/archive/`, verbatim, in the four files named in this index. The file has no ADR-025. Only `state.md` names that number. The next number is 074.

## Archived ADRs

- ADR-001 to ADR-024: index lines in `agent/archive/decisions-index-001-024.md`.
- ADR-026 to ADR-072: index lines in `agent/archive/decisions-index-026-072.md`. The ADR text is in the files that index names.

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

## ADR-076: Scroll decoration is set up after first paint, in yielding chunks (2026-10-25)

Context: PageSpeed Insights read mobile 64 and desktop 73, both with about 800 ms of Total Blocking Time. Google's test machines are about 3x slower than the local Mac, where Lighthouse showed only 57 to 210 ms. A CPU profile at 4x throttle put one 441 ms task inside hydration: the main `useGSAP` block created about 400 scroll tweens at once, each reading computed style. The hero ribbon canvas also drew every frame from load.
Decision: keep ScrollSmoother and the `#projects` link handler synchronous, and run every scroll-triggered reveal after first paint (`requestIdleCallback`, timeout 1500 ms) in chunks that yield to the main thread. Elements already in view when the setup runs keep no entrance. Repeating or many-element motion is CSS: the 365 contribution cells (`cell-in`, delays written when the reveal fires) and the skill-icon drift (`skill-drift`). The ribbon draws from a colour table at 30 fps, starts when idle and pauses off screen.
Consequences: an element that a fast scroller reaches before the idle callback runs appears without its entrance. New scroll reveals belong in the deferred chunk list, not in the hydration path. Under reduced motion nothing changes: the setup never runs and the CSS animations are off.
