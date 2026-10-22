# shadcn/ui structure, in v1's colours

Explainer pages use shadcn/ui's clean interface structure. The look itself comes from "How does CCFT work?" version 1. So take shadcn's structure, and fill it with v1's colours and fonts.

Sources, checked on 2026-10-03:
- The token list and its rules come from `ui.shadcn.com/docs/theming` (raw text at `ui.shadcn.com/docs/theming.md`).
- The component anatomy comes from `github.com/shadcn-ui/ui`, path `apps/v4/registry/new-york-v4/ui/<name>.tsx`. The project has an MIT licence. If a detail here looks wrong, fetch that file again.

The working example is [templates/page.html](templates/page.html).

## Tokens: shadcn's names, v1's values

Each surface token pairs with a `-foreground` token for the text on it. Use the tokens for all interface colour, and define dark mode by overriding the same tokens.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` / `--foreground` | `#f0f2f7` / `#16161f` | `#13141b` / `#eceef6` | Page and body text |
| `--card` | `#fdfdfd` | `#1c1d27` | Cards |
| `--border` | `#d9dbe6` | `#2e3040` | Card edges and lines |
| `--muted-foreground` | `#666a7c` | `#9ba0b5` | Captions and notes |
| `--primary` / `--primary-foreground` | `#4f50e7` / `#ffffff` | `#5557ee` / `#ffffff` | Main button, pressed toggle, indigo blocks |
| `--accent` | `#e2e2f4` | `#262846` | Toggle track, slots, quiet fills |
| `--ring` | `#4f50e7` | `#8e8fff` | Focus rings |
| `--acc` / `--och` / `--line` | `#4f50e7` / `#dbad36` / `#c9cbd8` | `#8e8fff` / `#e4b84a` / `#3a3c50` | Flow and request, response, quiet lines |

Fonts: Figtree (400 to 900) for all text, and JetBrains Mono for code. These are v1's fonts, so do not switch to shadcn's Geist.

## Rules taken from shadcn

1. Semantic pairs: a surface and the text on it always come as a token pair.
2. One radius scale from `--radius` (0.75rem). Cards use 1.4 times it. Toggles and buttons are pills, as in v1.
3. Every focusable control shows a 3px ring of `--ring` at 50%.
4. Toggle groups use `aria-pressed`. The pressed item takes `--primary` with `--primary-foreground`.
5. A button has one main variant (filled `--primary`) and a disabled state at 50% opacity.
6. Spacing comes from one scale. Indent by structure, not by eye.
7. Colour carries meaning (flow, response, cost). Everything else stays neutral.
8. Light and dark both work from the same tokens. Test both.
