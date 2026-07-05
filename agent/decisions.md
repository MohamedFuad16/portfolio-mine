# Decisions

## ADR-001 - 2026-07-04 - Use Vite React Static Portfolio

Status: Accepted

Context: The workspace was empty and the request was to rebuild a portfolio clone with custom resume data.

Decision: Scaffold a Vite React single page site with static assets and embedded portfolio data.

Consequences: The site is easy to run and deploy as static files. Future content edits currently require changing `src/main.jsx`.

## ADR-002 - 2026-07-04 - Generate Local Bitmap Portfolio Visuals

Status: Accepted

Context: The reference portfolio depends on image-heavy project cards and a profile avatar. The local site needs visual assets without relying on private project screenshots.

Decision: Generate local PNG assets for the avatar and each project preview under `public/assets/`.

Consequences: The site remains self-contained and visually complete. Replacing previews with real screenshots later only requires swapping files with the same names.

## ADR-003 - 2026-07-04 - Use Live Project Screenshots And Public Logo Assets

Status: Accepted

Context: The portfolio needed to match the reference more closely with proper skill logos, real project previews, and actual project links.

Decision: Capture screenshots from live project URLs into `public/assets/`, use public Devicon/Simple Icons CDN assets for skill logos, and link each card to its live page and GitHub repo.

Consequences: Project cards now represent the real sites. Skill logos depend on public CDN availability at runtime, while project screenshots remain local.

## ADR-004 - 2026-07-04 - Match Reference Portfolio Measurements

Status: Accepted

Context: A later fidelity pass found that the clone still differed from the reference in QR behavior, font stack, button shadows, skill carousel direction, dashed borders, and project screenshot framing.

Decision: Adopt reference-derived measurements: Figtree/JetBrains fonts, 700px page shell with 18px side padding, 664px dashed sections, 120x124 avatar, 25px QR control backed by a real LinkedIn QR image, two skill marquees moving in opposite directions, 1.5px dashed borders, layered button shadows, and 300x170 project previews.

Consequences: The UI now tracks the reference more closely. The site uses the `qrcode` package to generate the static LinkedIn QR asset.

## ADR-005 - 2026-07-04 - Use Local Avatar Decoration Layer

Status: Accepted

Context: The reference profile image includes a decorative blossom layer around the avatar, and the previous local avatar looked too plain.

Decision: Generate a local transparent PNG decoration and layer it over the yacht profile photo while keeping the real QR control and hover card above it.

Consequences: The profile block now better matches the reference composition while remaining self-contained. The avatar container allows visible overflow, so child image clipping is handled by the profile photo itself.

## ADR-006 - 2026-07-04 - Prefer Local Icon Components And Bilingual Runtime Copy

Status: Accepted

Context: CDN brand/skill icons were fragile in the browser, and the portfolio needed a Japanese version plus more reference-like interactive sections.

Decision: Use `react-icons` for skills/contact marks, keep official company logos as local downloaded assets, add a React locale toggle for English/Japanese copy, use expandable work rows for details, and fetch the public GitHub contribution API at runtime with a local fallback.

Consequences: The main UI no longer depends on remote icon SVGs, Japanese copy can be switched locally without routing, work details match the reference dropdown behavior, and contribution totals can update when the public API is reachable.

## ADR-007 - 2026-07-04 - Use Flip QR Avatar And Browser-Locale Copy

Status: Accepted

Context: The avatar decoration was no longer desired, the QR behavior needed to match the reference flip interaction more closely, and the language control should not float at the top of the page.

Decision: Remove the decorative avatar overlay from the rendered UI, implement a two-sided avatar card that flips between the profile photo and LinkedIn QR, initialize locale from the browser language while persisting manual choices, move the language toggle into the profile handle row, and use the Hotel SUI Akasaka official favicon for a square readable work icon.

Consequences: The profile section is cleaner on mobile, the QR interaction is closer to the reference, Japanese/English defaults feel local to the visitor, and the Hotel SUI work tile remains visible at small sizes.

## ADR-008 - 2026-07-05 - Download Remote Favicons Locally, Never Hotlink

Status: Accepted

Context: The Japan Airlines work-experience logo was hotlinked directly from `https://www.jal.com/favicon.ico`. It rendered fine in some views but was reported broken in others — a live cross-origin favicon fetch has no guaranteed behavior across browsers/sessions (referrer policy, hotlink protection, caching), even though a plain `curl` fetch succeeded.

Decision: Download the JAL favicon locally (`public/assets/jal-favicon.png`, converted from `.ico`) and reference it the same way Altius Link and Hotel SUI Akasaka's logos already are. No work-experience logo should be a live remote URL.

Consequences: One less network dependency, consistent with ADR-006's rationale for the other two logos. Any new work-experience entry should download its logo locally rather than linking the company's own site.

## ADR-009 - 2026-07-05 - Untrack node_modules and dist, Never Commit Build Output

Status: Accepted

Context: The first commit accidentally included the full `node_modules/` (182MB) and a `dist/` build that had drifted from source (stale asset hashes), because the repo had no `.gitignore`. The stale `dist/` was actively confusing (task 1 of the 2026-07-05 cleanup was written specifically to deal with it).

Decision: Add a `.gitignore` covering `node_modules/`, `dist/`, `.tools/` (a locally downloaded `gh` CLI binary, unrelated to the project), and `.DS_Store`; `git rm --cached` the already-tracked copies.

Consequences: `dist/` must be rebuilt locally (`npm run build`) before any static-host deploy that expects it — it is no longer checked in. Anyone cloning fresh needs `npm install`. This is standard practice and avoids the exact staleness bug this ADR responds to.

## ADR-010 - 2026-07-05 - Prevent Title Wrapping With Ellipsis, Not Just flex-wrap

Status: Accepted

Context: "Hotel SUI Akasaka" (and potentially other long or Japanese-locale company/role names) wrapped mid-word in the Work Experience list on desktop, because `.experience-item h3` had no `flex-wrap` and nothing stopped the anchor's text node from breaking when the row ran out of space. A narrower mobile-only media query already worked around this by letting the status badge drop to its own line, but nothing protected the desktop layout or the name text itself.

Decision: Wrap the company name in a `.company-name` span with `white-space: nowrap; text-overflow: ellipsis`, set `min-width: 0` through the whole flex/grid chain (`.experience-summary` → `.experience-copy` → `h3` → `a`) so shrinking is actually possible, and add `flex-wrap: wrap` to the base (desktop) `h3` rule so the status badge can drop to its own line before the name is forced to wrap.

Consequences: Company names never break mid-word at any width; at the narrowest tested width (320px) names ellipsize instead (e.g. "Alt…"), which is an intentional, accepted trade-off over a broken two-line wrap.

## ADR-011 - 2026-07-05 - Delay `visibility` Transitions Instead of Snapping Them

Status: Accepted

Context: An animation/transition audit found the contribution-heatmap tooltip's fade-out was invisible in practice: `opacity` was transitioned but `visibility` (paired for accessibility/hit-testing) was not, so on mouse-out `visibility: hidden` applied instantly and the element stopped rendering before the opacity transition had a chance to play. Same root-cause class of bug could recur anywhere `opacity` + `visibility` are paired.

Decision: Pair `visibility` with its own zero-duration transition and a `transition-delay` equal to the fade duration on the "hide" direction (`visibility 0ms linear 140ms`), and zero delay on the "show" direction. Applied here to the heatmap tooltip; use the same pattern for any future opacity+visibility pairing on this site.

Consequences: Fade-outs are now actually visible. This is a general technique worth remembering, not a one-off fix — any new hover/tooltip treatment using `visibility` (rather than just `display`) should follow it.

## ADR-012 - 2026-07-05 - Give Every Interactive Element a Transitioned Hover State

Status: Accepted

Context: A full animation audit found most primary interactive elements (nav/contact/project buttons, locale toggle, QR flip button, work-experience company links, the expand chevron, skill pills) either had no hover state at all or changed color/background instantly with no `transition`, which reads as abrupt/unpolished next to the site's otherwise-animated pieces (avatar flip, marquee, click-burst, accordion).

Decision: Add a consistent ~160ms ease transition plus a subtle hover treatment (background lighten, ~1px lift for pill buttons, color brighten for plain links/icons) to every clickable element site-wide, rather than leaving some animated and others static.

Consequences: Any new button/link component added to this site should follow the same convention — a `transition` on the properties its `:hover` rule changes, using ~160ms ease unless there's a specific reason to differ (e.g. the 220-260ms used for the chevron rotate and accordion, which are larger/slower motions by design).
