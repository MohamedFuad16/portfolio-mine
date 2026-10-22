# Archived decisions, ADR-049 to ADR-059

Moved verbatim from `agent/decisions.md` on 2026-10-22 to keep that file under the size limit. The text after the rule is unchanged. ADR dates: 2026-07-30 to 2026-08-14.

Path notes (added when archived, not part of the original text):
- `public/assets/contributions.json` (ADR-053) is now `public/media/data/contributions.json` (commit 8a85b1c, 2026-08-30).

---

## ADR-049 — Human-voiced copy for Internship Portal and AI Brain Platform (2026-07-30)

Context: The user read both project pages as AI-generated and asked for them to be
fixed "naturally to match all the other projects." The specific complaints were the
em dashes and a set of status-ish fragments: "In active development", "The web app is
live", "The iOS client", "Ongoing research". They also named "Paid work" and "etc.",
neither of which existed anywhere in the source — the badges are `in progress` and
`research project` — so there was nothing to remove for those two.

Separately: the Internship Portal was being sold as a "LaTeX-to-PDF compiler". The
user's correction is that the compiler is not the point. It is an internship tracker
**and** a way to find internships by searching, and those two things are the product.

Decision:

1. **Deleted the `status` block from both projects** rather than rewriting it. Every
   phrase the user objected to lived there and nothing else did, so a rewrite would
   have been inventing new copy to fill a slot they did not want. `ProjectDetailView`
   already renders it as `{d.status && ...}`, so removing the key drops the paragraph
   with no code change. `highlights` (the AI Brain figures strip) was left alone — it
   is numbers, not prose, and was not part of the complaint.

2. **Reframed the Internship Portal around find + track.** The card description, the
   tagline, the first two feature bullets and the four-step system map now lead with
   searching the postings and moving an application from saved through to interview.
   The résumé editor survives as the last bullet, described as where the résumé you
   send gets written, and the phrase "LaTeX-to-PDF compiler" is gone from the copy.
   The map's old fourth step ("Documents / LaTeX compiled to PDF") became
   "Find / Track / Your data / Shared server".

3. **Left the system-architecture flow charts alone.** The Internship Portal chart
   still terminates in "Tectonic to PDF", because that is accurately what the compile
   endpoint does and the chart documents server responsibilities, not billing. It is
   also width-tuned per ADR-043/044 (the 116-unit phone branch box), so relabelling
   invites the overflow bugs those ADRs fixed. Flagged to the user as their call.

4. **Em dashes removed from both projects' copy, in both locales.** Prose was rewritten
   toward the plain declarative voice WebDrop already uses — short sentences, first
   person, no rhetorical questions, no semicolon chains, no "the architectural rule I
   care about most". The Japanese was rewritten in parallel, not machine-mapped from
   the new English.

Consequences: Verified by real render, not by reading the diff. Because the in-app
preview pane freezes `requestAnimationFrame` (measured this session: **0 ticks in
12.2s**, so every scroll-revealed block reads `opacity: 0` there), the check ran in
headless Chrome over CDP with `Page.startScreencast` to keep frames coming. Across
mobile 390x844 and desktop 1280x900, both slugs, both locales: no `.pd-status` in the
DOM, 0 em dashes in the rendered text, none of the named phrases present, no
horizontal overflow, all `.pd-block` sections reaching `opacity: 1` after scroll, no
console errors and no failed requests. Production build clean.

One harness lesson worth keeping: the locale preference persists in `localStorage`, so
a run that clicks 日本語 poisons every later "English" load in the same profile. The
first sweep silently reported Japanese copy under four `en` keys. Clear `localStorage`
between locale cases.

## ADR-050 — A two-line label must straddle a diamond's midline (2026-07-30)

Context: On the AI Brain page the only decision diamond that carries a subtitle,
"Did it pass?" / "Teacher grades held-out exams", had its subtitle crossing the
orange outline on both sides. Measured before the fix, at the wide geometry in
Japanese: subtitle 177.88 user units against 158.78 available, so **9.55 units of
overhang per side**. Compact/Japanese overhung by 1.05.

Cause: `FlowBox` placed the subtitle at `mid + gap` for every shape. That is correct
for a rectangle or a cylinder, which are the same width at every height, but a
diamond is only full width at its vertical midline and tapers to a point above and
below. At `dy = 13.5` of a 37-unit half-height the shape has already given up 36% of
its width, so the label was being drawn where the box no longer existed. The title
was fine only because it is short.

Decision: when a decision has a subtitle, straddle the midline — title at
`mid - (gap/2 + 1.5)`, sub at `mid + (gap/2 + 1.5)` — so both lines sit in the widest
band instead of one hanging into the taper. Non-diamond shapes keep the original
slightly-low placement, which reads better inside a constant-width box. The diamond's
own geometry is untouched, deliberately: extending the tips to gentle the taper would
have been the other fix, but the arrow into a diamond already terminates 5 units
inside its top tip (`to: y + rowH - 3` vs a tip at `y + rowH - 8`), so growing the
tips would have widened a pre-existing overlap into a visible one and required
threading the next stage's kind into `FlowArrow`. Not worth it for a text-placement
bug.

**Straddling alone was not enough, and the first verification of it was wrong.** It was
checked by computing the diamond's width at the text's *centre line* and comparing that
to `getComputedTextLength()`, which reported 8.19 units of margin and looked clean in a
3x capture. But a line of text has height, and the binding constraint is its **lower
corners**, which sit ~6.6 units below the centre where the diamond has narrowed
further. Re-tested with `SVGGeometryElement.isPointInFill` against the real path, using
all four corners of `getBBox()`: the bottom two corners were still outside in both
locales (EN sub 159.97 units, JA 177.88, against ~150 usable at that height). A
validation subagent caught this independently.

So the subtitle was **shortened** as well, the remedy ADR-043/044 already used for the
116-unit phone branch box: "Teacher grades held-out exams" → "Graded by the teacher"
(159.97 → 91.07 units) and "教師モデルが持ち出し不可試験を採点" → "教師モデルが採点"
(177.88 → 65.11). "Held-out exams" is not lost; the prose above the chart already says
the exams are commits the cheap model has never seen.

Consequences: All four `getBBox()` corners of both the title and the subtitle now test
inside the diamond path, in EN and JA, at both the wide and compact geometries — the
strict test, not the centre-line one. The other four charts contain no decision with a
subtitle, so nothing else moved. Production build clean.

Lesson: to check text against a non-rectangular shape, test the text's bounding-box
corners with `isPointInFill` against the actual path. Comparing text length to the
shape's width at the text's centre line silently passes labels that visibly cross the
outline, and comparing against the shape's *bounding box* is looser still.

## ADR-051 — GSAP applies vars in reverse, so never mix `inset` with `left`/`top` (2026-07-30)

Context: A validation subagent found that the mobile card-expand opened from the
viewport's top-left corner rather than from the tapped card. Confirmed independently
by sampling the overlay per animation frame and by a MutationObserver on its `style`
attribute. Before the fix the overlay's first painted frame was `[0, 0, 357, 478]`
while the tapped card sat at `[20, 451.23, 350, 404.75]`; `el.style.left` was `auto`
and `left` stayed 0 for all ~80 frames of every open. The error equals the card's
distance from the viewport origin, so it grew with scroll position — up to ~451px.

Cause: the open did

```js
gsap.set(el, { autoAlpha: 1, inset: 'auto', left: origin.left, top: origin.top, ... })
```

GSAP's CSSPlugin builds its PropTween list by **prepending**, so vars are applied in
the reverse of the order written. `inset: 'auto'` therefore landed *after* `left` and
`top` and reset both — `inset` is a shorthand for all four offsets. The subsequent
`.to(el, { left: 0, top: 0, ... })` then read its start values from computed style,
which for `position: fixed` with `inset: auto` resolves to the static position `0,0`,
so left/top tweened 0 → 0 and never moved.

Decision: set `right: 'auto'` and `bottom: 'auto'` explicitly instead of the `inset`
shorthand. Those are distinct properties from `left`/`top`, so no application order can
clobber the origin rect. The reduced-motion branch keeps `inset: 0` — it pairs it with
`width/height: 'auto'` and sets no left/top, so there is nothing to overwrite.

Consequences: The overlay's first style write now reads exactly the card's rect —
`left=20px top=388px width=350px height=426px right=auto bottom=auto` against a
measured origin of `[20, 387.98, 350, 425.81]` — and the open still ends at
`[0, 0, 390, 844]`, the full viewport. Verified on two cards at two scroll positions.

Why four previous ADRs missed it: the close was never affected, because it does not
touch `inset`, and it lands within 0.42px. ADR-046's per-frame sampling compared each
clone child against its original — all *relative* measurements, which stay correct even
when the whole overlay starts in the wrong place. Absolute origin was never asserted.
Any future check of this animation must compare the overlay's own first frame against
the origin card's rect.

## ADR-052 — Japanese is a real locale, not a translation layer (2026-07-30)

Context: The ADR-049 rewrite fixed two projects' copy but a validation sweep showed the
Japanese side of the site was only partly localized, and that three projects' Japanese
described a different product from their English.

Decision, in the order the problems bite:

1. **`document.documentElement.lang` now follows the locale.** `index.html` ships
   `lang="en"` and nothing ever changed it, so a Japanese visitor got a fully translated
   page still declaring itself English, and screen readers read Japanese with an English
   voice. Set in the same effect that persists the preference.

2. **Badges are localized.** `badge` had no Japanese counterpart, so all six cards *and*
   all six detail heroes showed `live app` / `in progress` / `research project` /
   `long-term project` / `student PWA` / `macOS utility` on an otherwise Japanese page.
   Added `badgeJa` to every project and a `badgeLabel(project, locale)` helper used by
   both render sites, falling back to `badge` if a translation is ever missing.

3. **Strings that were hardcoded English are now keys.** The footer's role and city and
   the contact card's "Email" (which said "Email" while the hero said "メール" for the
   same action, on the same page) became `footerRole`, `footerCity` and the existing
   `t.email`. `building` was "AIツールを開発中" against an English "Building AI agent
   tools" — the Japanese had quietly dropped "agent", which is the whole point of the
   line.

4. **Three projects' locales were reconciled.** WebDrop, Tutor-System and TokaiHub had
   Japanese card copy and taglines that were stale marketing register (feature dumps,
   モダンな, ネイティブアプリのような) against plain English. Worse, **WebDrop's Japanese
   advertised バンプペアリング — bump pairing — a mechanism the English never claims.**
   Both sides now say the same thing.

5. **The remaining AI-tells were removed from the four projects ADR-049 did not touch**,
   plus two residues in the pair it did: ClaudeShot's "keep the utility practical for
   daily use", Tutor's "Fast teaching stays in the foreground.", TokaiHub's "email
   aliases keep login familiar" and its `with…plus` weld of onboarding to theming,
   WebDrop's "when those sensors are not" (an ellipsis that never completes), AI Brain's
   tricolon and four-clause chain, and the Internship Portal's "does two things"
   followed by four. The home intro's opening tricolon went too — it was the first
   sentence a visitor read.

6. **The last two em dashes in user-facing strings** were the card `aria-label`
   ("WebDrop — View details", on all six cards in both locales, so screen-reader-only
   and easy to miss) and the ErrorBoundary copy.

Consequences: Swept 28 route × locale × breakpoint combinations at 390x844 and
1280x900 over CDP: **zero problems** — `lang` correct in all four locale/breakpoint
pairs, all six badges Japanese under `ja`, no em dash in any rendered string, no
horizontal overflow, no clipped titles, no broken images, no `.pd-block` stuck hidden,
flow-chart connectors present on all 24 detail combos, all diamond labels inside their
path, 0 console errors and 0 responses >= 400. The mobile expand still writes the
tapped card's exact rect on open (ADR-051 holds). Production build clean.

## ADR-053 — Copy consistency pass, and the Japanese spacing trap (2026-08-02)

Context: `git pull` brought one automated commit (`c403cf6..3403921`) touching only
`public/assets/contributions.json` — the rolling window slid forward, dropping
2025-08-01/02 and appending 2026-07-31 and 2026-08-01, total 583 → 586. A bug sweep of
the whole site was run on top of it. Most of the sweep's agents died on a session
limit; the copy dimension completed and its nine findings were verified by hand
afterwards, since every automated verifier had also died.

The pulled data itself is correct and needed no change: 364 cells, exactly 52 weeks,
contiguous, no duplicates, first cell 2025-08-03 is a Sunday and last 2026-08-01 a
Saturday, `total` equals the sum of counts. The 12 month labels were re-derived
independently against the component's own bucketing and every one sits over a column
that really contains that month; the trailing single-day Aug 2026 is correctly dropped
by the `span >= 3` filter, so there is no duplicate "Aug".

Decisions — nine copy defects fixed, all confirmed against source before touching:

1. The Internship Portal overview enumerated four tracker states and the feature bullet
   five, two paragraphs apart. The overview no longer enumerates at all; the bullet owns
   the list.
2. AI Brain's flow introduced "the gym", a term used in no other rendered string (the
   overview calls the same thing a loop), and alternated "a teacher model" / "the
   teacher" / "Graded by the teacher". Settled on "the loop" and "the teacher model"
   throughout, diagram included.
3. Tutor-System's Japanese used three words for one concept — バックグラウンドジョブ,
   背景, バックグラウンド処理 — where 背景 is the picture-background sense, not a running
   process. Also 前景チューター, a calque of an English term the English never defines.
   Both sides now say it plainly.
4. Stray ASCII spaces inside 「Markdownの Brain」 and 「Cognitoメール OTP」, inconsistent
   with the same words written unspaced on those very pages.
5. WebDrop's decision diamond was the only one of four not phrased as a question in
   Japanese (「近接を確認」, which also duplicated the system-map label directly above the
   chart). Now 「十分に近いか」.
6. English copy carried two tokens an English-only reader cannot read (履歴書, 職務経歴書)
   with no gloss; it now names the formats in English while the Japanese keeps the real
   names. "centre" was the single en-GB spelling among catalog / signaling / enrollment /
   localize.
7. `t.tech` served both an inline card label (where the trailing colon is right) and an
   `<h2>` section heading (where it is not). Split into `tech` and `techHeading`.
8. The footer read "1,338visitors" in the text stream. Added the space to the English
   unit only — Japanese takes none.
9. Three English grammar slips: two compound subjects with singular verbs, one missing
   article with a comparative that had no comparand.

Then, verifying the fix, the render exposed a tenth defect the sweep had only alluded
to: **`introParagraphs.ja` rendered 「机上の要件から 推測するのではなく」**. JSX drops a
newline adjacent to a tag but condenses one between two runs of text into a space, and
the paragraph had been wrapped for readability. See `agent/errors.md`; the rule is that
a Japanese JSX fragment may break lines only where they abut a tag.

The visitor counter's `.sr-only` duplicate was reported and deliberately **not**
changed: it is the canonical accessible pattern (the per-character spans are
`aria-hidden`, so assistive tech reads the value once), and duplication in `textContent`
is inherent to every use of visually-hidden text. Only the missing space was a defect.

Consequences: 28 route × locale × breakpoint combos re-swept — zero problems, zero
console errors, zero responses >= 400, `lang` correct per locale, badges Japanese under
`ja`, no em dash in any rendered string, no overflow or clipped titles, all flow-chart
connectors present, and every diamond label still passing the strict `isPointInFill`
corner test after "Graded by the teacher model" widened it. The mobile expand still
writes the tapped card's exact rect and closes clean (ADR-051 holds). A dedicated scan
for ASCII spaces adjacent to CJK now comes back with only the legitimate cases.
Production build clean.

Not covered by this pass, and worth a look sometime: the resume PDFs, the strings inside
the raster project screenshots, and colour contrast of the small grey type.

## ADR-054 — The open animation's real defects, and two contribution-window bugs (2026-08-02)

Context: the user reported, repeatedly, that opening a project "glitches out — it's
displaced, it's supposed to be shown immediately up top, it shows down and then up at
the top within a split second." Earlier passes had fixed the overlay's *origin*
(ADR-051) but never the content's behaviour once the box was moving. Two diagnostic
subagents measured the desktop and mobile paths per animation frame over CDP.

### What was actually wrong

**Desktop.** Every `.pd-animate` element was painted 26px below its resting position
from the first visible frame, and the `.from()` was positioned `'-=0.12'` with a 0.07
stagger — so the panel was fully opaque at ~290ms while its content was still sliding
until ~1130ms. Content demonstrably arrived low and travelled up long after the panel
was solid. That is the reported symptom, by design rather than by accident.

Underneath it sat a genuine bug. `.pd-back` carries `transition: ... transform 160ms`
for its `:hover { transform: translateX(-2px) }` nudge. GSAP's `.from()` initialises
lazily when the playhead reaches it; by then the CSS transition had already carried the
computed transform partway, GSAP read that in-flight value as the element's *resting*
`y`, and baked it in. The button slid **down** ~26px instead of up and stayed there for
the life of the overlay — final inline `translate(0px, 25.574px)`, still present at
t=3000ms, and race-dependent (25.57px at 1280x900, 18.34px at 1440x900). Its gap to the
screenshot rendered ~18px instead of the designed 44px, and its hover nudge was dead,
overridden by GSAP's leftover inline transform.

**Mobile.** Three separate things, in increasing order of how much they matter:
- The box residual: `.project-detail-inner` is a normal-flow child of the element whose
  `top` is being tweened, and `pinnedInnerLayout()` pins only width. `cardExpandEase`
  has covered 95.5% by t=0.22 where the content faded in, leaving 4.5% x `origin.top`
  (4–36px) of upward travel in plain sight.
- **The dominant defect:** the clone and the real page are different layouts. The cloned
  card's title rests **110.3px** above the detail page's `<h1>` and its preview ~90px
  above `.pd-shot`, yet both layers were over 10% opaque for ~200ms — two vertically
  offset copies of the same title and image dissolving through each other.
- Tapping a card whose scroll-reveal `gsap.from(card, {y:36, opacity:0, scale:0.985})`
  was still running snapshotted its in-flight inline styles into `card.outerHTML`. The
  clone then morphed as a featureless black rectangle at `opacity: 0` with its title
  266px out of place, and `measureOrigin()` — which neutralises `main`'s transform but
  not the card's own — returned the scaled box, 344.75x398.68 instead of 350x404.75.

### Decisions

1. **Desktop hero lands in place and only fades.** `.pd-back`, `.pd-shot` and
   `.pd-headline` get opacity only, no `y`. That removes the reported displacement and,
   because GSAP no longer writes a transform to `.pd-back`, it removes the permanent
   offset at its source and gives the hover nudge back to CSS. `.pd-block`s keep a small
   staged rise — they are below the fold, so it is never seen arriving — but via
   `fromTo` rather than `.from()`, so the end value is pinned and no stray CSS
   transition can bake an offset in again.
2. **Mobile hands over instead of cross-fading.** The clone is gone by 0.32 and the real
   content starts after it. `.project-detail` and `.pd-expand-face` share `#0b0d0e`, so
   the handover is invisible, and waiting until 0.32 also drops the box residual to
   under a pixel. Rejected: pinning inner's vertical offset — a subagent verified
   empirically that it puts `.pd-back` 474px above the box's top edge where
   `overflow: hidden` deletes it, and the overflow cannot simply be dropped because the
   real content is ~3000px tall.
3. **Settle the card before snapshotting it.** `gsap.killTweensOf(card)` plus
   `clearProps` before reading `outerHTML`. The card is about to be hidden by
   `is-expand-origin`, and on close it should be at rest — which is what clearProps
   leaves. This also fixes the bad `origin` rect.

### The two contribution-window bugs (carried over from ADR-053)

4. **Weekday alignment.** The grid is seven rows deep flowing column-first, so a column
   only means "one week" if the first cell sits in the row for its own weekday — which a
   flat `slice(-364)` of data ending *today* satisfies one day in seven.

   The first attempt trimmed forward to the next Sunday, and the very next snapshot showed
   why that was wrong: pulled on 2026-08-02 it starts on a **Monday**, so trimming threw
   away six days of history and silently shrank the total. Instead the first cell is now
   offset into its own weekday row (`gridRowStart: leadIn + 1`) and the rest auto-flow from
   there, so column one is partial — which is what GitHub does — and not a single day is
   lost. `weekCount` and every month label's column count from `leadIn` rather than zero.
   Verified by grouping the painted cells by their actual Y: seven rows, each holding
   exactly one weekday, mapping 0..6 in order, with all 364 days retained.
5. **Caption vs grid.** `pickTotal` used the API's `total.lastYear`, computed over its
   whole returned range rather than the range drawn. Simulated across a fortnight of
   dates, the caption disagreed with the grid on **13 days out of 14**. The total is now
   always the sum of the cells on screen. The snapshot's own total already equalled the
   sum of its cells, so nothing changes there.

Consequences, all measured after the change: mobile travel-while-visible **0px** (was
4–36), double-image window **0ms** (was ~200ms), clone-vs-real title gap **0** (was
110.3px), with the box fully landed and the clone gone before content appears. Desktop
back/headline/shot travel **0px** each (was 26), `.pd-back` final transform `none` (was a
permanent `translate(0px, 25.574px)`), inline style just `opacity: 1`, and its gap back
to the designed **44px**. The open still writes the tapped card's exact rect and the
close still lands on it. The grid fix proved itself live: this ran on Sunday 2026-08-02,
exactly the case the old code got wrong, and rendered a correctly weekday-aligned
53-column grid — seven rows, zero rows mixing weekdays, all 364 days kept — with caption
587 equal to the sum of its cells. 28 route x locale x breakpoint combos
clean, 0 console errors, 0 responses >= 400. Production build clean.

## ADR-055 — Daijin is a desktop-only, time-driven scroll companion (2026-08-14)

Status: Accepted.

Context: The finished Daijin mascot was built as complete traditional-animation frames in a separate
lab. The portfolio needs the character at the bottom-right without disturbing its dense mobile
layout, inheriting ScrollSmoother transforms, blocking controls, or turning scrolling into choppy
frame scrubbing. Copying all 15 lossless lab clips would also add unnecessary download weight.

Decision: Add `DaijinMascot` outside `#smooth-wrapper` and render a persistent 1024×1024 SVG viewport
over one of nine optimized paired WebP clips. Playback uses elapsed time and `requestAnimationFrame`;
the existing scoped ScrollTrigger only chooses a shuffled, non-repeating clip from progress bands.
Hide the mascot at 760px and below, set `pointer-events:none`, freeze a poster frame for reduced
motion, and unmount it while a project detail is open. Keep the files local under
`public/assets/daijin/` and do not depend on the mascot lab server.

Consequences: The desktop mascot remains anchored to the viewport, changes personality naturally as
the visitor moves through the page, and continues smooth animation between scroll events. Phones pay
no decoded-image or layout cost because CSS hides the component. The selected nine clip pairs add
about 27.3 MB of compressed public assets; future work should retain paired lazy loading and validate
every atlas rather than preloading the full library.

## ADR-056 — Use semantic scenes and an imperative half-scale canvas (2026-08-14)

Status: Accepted; refines ADR-055.

Context: The first portfolio integration decoded two 6144×4096 atlases per active clip, roughly
192 MB of RGBA pixels, and changed React state at up to 24 fps. The animated CSS drop-shadow added
another full transparent-layer filter each frame. Scroll bands selected clips arbitrarily, and a
hard change between independently drawn poses exposed the different body silhouettes.

Decision: Downsample the portfolio copies to 3072×2048 with 512×512 cells, which is still slightly
above 2× the largest CSS display size. Draw crops imperatively into one 512×512 canvas and update only
diagnostic data attributes, not React state. Remove the drop-shadow, decode only the active pair, and
blend the retained old canvas into the new clip over 280ms at section boundaries. Replace arbitrary
bands with semantic scenes: Profile→Playful, Skills→Clever, Experience→Working,
Contributions→Thinking, Projects→Curious, Writing→Listening, and Contact→Happy. Move between a small
profile perch and three right-rail positions with a contained CSS transition.

Consequences: Active decoded memory falls to about 48 MB, the complete portfolio mascot asset set is
12.27 MB, React does no frame-rate work, and the canvas redraws only when the authored frame advances
after the brief transition. Internal clips remain traditional frame animation; only
the boundary between two complete performances blends. Daijin now relates to the content currently
being viewed and phones do not mount or decode the component. New sections must be placed in the scene
map in document order, and atlas copies must remain 3072×2048.

## ADR-057 — Keep one left perch and make section performances one-shot (2026-08-14)

Status: Accepted; refines ADR-056.

Context: Moving Daijin from the profile to high/middle/low right-rail positions made the mascot feel
detached from the page. The long vertical travel was visible during scrolling, and looping a new clip
for an entire section read as a background GIF rather than a character reacting. A short clip blend
did not solve the spatial mismatch.

Decision: Keep the mascot fixed at one clamped top-left coordinate, overlapping the profile photo and
remaining on the left for the whole desktop visit. Measure section thresholds so their headings
scroll up to that perch. Trigger one complete contextual clip per crossing, clamp non-Idle playback at
frame 46, then use a React effect keyed by clip and scene to return to looping Idle. Give SectionTitle
stable `data-daijin-title` partner hooks and play one restrained elastic nudge when Skills, Work,
Projects, or Thoughts reaches Daijin; nudge the Contribution block and Contact heading similarly.
During the profile Playful action, apply a one-shot CSS keyframe that rotates the photo shell left,
right, and back to rest. Disable the photo keyframe under reduced motion.

Consequences: Daijin has a stable spatial relationship with the portrait and never slides vertically
or crosses to the right. Reactions read as discrete performances with a clear start and finish, can
retrigger when scrolling back, and remain independent of scroll velocity. Partner selectors and scene
order are now part of the interaction contract; adding a heading requires both its data hook and scene
entry. Idle remains the only intentional infinite clip.

## ADR-058 — Reserve a mascot header gap instead of overlapping content (2026-08-14)

Status: Accepted; refines ADR-057.

Context: A 132px fixed mascot at top 10px extended to y=142 while the profile photo began near y=70.
The deliberate overlap covered the portrait and, while scrolling, put Daijin directly on top of the
section title. This looked crowded at both full desktop and the narrower split-browser width.

Decision: Reduce Daijin to 112×112 and increase desktop main top padding from 58px to 132px. Keep the
mascot at top 10px, the semantic section trigger at top 150px, and the existing <=760px main padding
of 46px because the mascot is not mounted there.

Consequences: At 1280px, Daijin ends at y=122 and the portrait begins at y=142, producing a measured
20px clear gap. Titles meet the perch around y=150–155, producing 28–33px of breathing room while
remaining close enough for the nudge interaction to read. The extra desktop header height is now part
of the mascot layout contract.

## ADR-059 — Use a responsive left rail and exclude the Playful turnaround (2026-08-14)

Status: Accepted; supersedes ADR-057's Idle handoff and ADR-058's above-content gap.

Context: The above-image perch still did not match the intended composition: Daijin belongs beside
the portrait and beside each section title. Canvas bounds also overstated the visual reach because
the sprite contains transparent padding. More importantly, Playful's source sheet contains a
malformed generated in-between and an unwanted back-view turn, so playing all 46 frames created the
reported spin/glitch even after the Idle transition was removed.

Decision: Restore the original desktop top padding and reserve a responsive left rail. Use a
profile-only horizontal inset so the drawn paw crosses the portrait edge, while non-profile scenes
use the wider heading coordinate. Extend the card-rock keyframe to 3.2 seconds. Give Playful an
explicit front-facing frame path (9 through 23, then back to 9), decode only sheet A for that path,
and hold the final selected frame. Do not automatically transition contextual clips to Idle.

Consequences: Daijin now reads as physically beside the current element, touches the photo during the
reach, and never displays the corrupted turn or back-view frames. The portrait uses a deliberate
overlap while headings retain breathing room. Clip-specific frame paths are now part of the renderer
contract and can exclude bad source passages without regenerating the atlas.
