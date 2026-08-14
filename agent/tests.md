# Tests

No automated test suite yet.

Verification workflow:
- Run `pnpm build`.
- Run the local dev server.
- Use the in-app browser to compare desktop and mobile views against the reference site.
- Check for console errors and responsive text overflow.
- At 390px, confirm all five project technology chips fit on one line and the View Details hint stays visible.
- Open a project from mobile and confirm the entire card clone expands from its exact rectangle to the viewport, the underlying page reaches scale 0.95/opacity 0.65, and the real detail content replaces the clone. Close it and confirm the motion reverses into the source card with no stuck hidden state.
- Repeat the route with reduced motion enabled when animation code changes.
- Verify both EN and JA profile/project copy, including the symbol-only Tokai mark and ClaudeShot card.
- Confirm a non-interactive page-surface click plays the achievement sound, while buttons, links, form controls, summaries, labels, and role/contenteditable controls remain silent. The visual ripple may still appear on controls that bubble to the page handler.
- At a desktop viewport, confirm `.daijin-mascot` sits to the left of the portrait, its reaching paw
  visibly crosses the portrait's left edge, and frame numbers advance without React rerenders.
  Expected section map: Profile→Playful, Skills→Clever, Experience→Working,
  Contributions→Thinking, Projects→Curious, Writing→Listening, Contact→Happy.
- Contextual clips must advance once and hold without transitioning to Idle or starting a second
  loop. Playful is the exception to the full-sheet range: it must sample only frames 9–23–9, never
  the malformed frame 8 or the turn/back-view passage in sheet B. Scroll down/up/down and confirm the same section retriggers. While a section enters,
  its title must have a non-identity transform and return cleanly to `none`; the profile shell must
  rotate through both directions for 3.2s and settle to zero.
- At 1280px, the portrait canvas intentionally overlaps the photo box horizontally by about 26px so
  the visible paw touches it; vertical centres should be within 2px. At a section threshold, Daijin
  must return to the left of the heading with visible breathing room and vertically aligned centres.
- Reload at 390×844 and confirm `.daijin-mascot` computes to `display:none` and the document has no
  horizontal overflow. Open a project detail on desktop and confirm the mascot unmounts until return.
- Validate all 18 Daijin WebP files are non-empty 3072×2048 images before release. Current manual QA
  observed Playful frame 18 at the profile, Clever frame 14 at Skills, Working frame 12 at Experience,
  and Curious frame 8 at Projects, all with successful decoding.
