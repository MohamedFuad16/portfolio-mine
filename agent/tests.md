# Tests

No automated test suite yet.

Verification workflow:
- Run `pnpm build`.
- Run the local dev server.
- Use the in-app browser to compare desktop and mobile views against the reference site.
- Check for console errors and responsive text overflow.
- At 390px, confirm all five project technology chips fit on one line and the View Details hint stays visible.
- Open a project from mobile and confirm the preview expands from its card rectangle into the 16:9 detail hero; repeat with reduced motion enabled when animation code changes.
- Verify both EN and JA profile/project copy, including the Tokai logo and ClaudeShot card.
