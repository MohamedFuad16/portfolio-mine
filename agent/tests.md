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
