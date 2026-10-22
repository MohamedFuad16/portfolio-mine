# The explainer page

The page explains a topic to someone who knows nothing about it, with big pictures and few words. It uses the design of "How does CCFT work?" version 1: its fonts, colours, robot icons and flowcharts. On top of that design, the pictures move in the 3Blue1Brown style ([MOTION.md](MOTION.md)), the words follow [STE.md](STE.md), and the controls follow shadcn's anatomy ([SHADCN.md](SHADCN.md)).

Start from [templates/page.html](templates/page.html). It is a complete, tested page in that design. Replace its content, and keep its tokens, symbols and engine. Deliver the finished page as one self-contained HTML file. In Claude, you can publish it as an Artifact.

## Shape (from v1)

- **A question as the headline** in Figtree 900 ("How does CCFT work?"), then a lead of two or three sentences with a few bold words.
- **Numbered steps.** Each step has a big indigo number, one short title, one card with one picture, and one caption of at most two sentences.
- **The picture carries the fact.** It is line art from the symbol set (robot, disk, window, person, clock, lock, envelope, key), indigo blocks for the main actors, and straight arrows with a verb above them. A picture that only decorates gets cut.
- **Order**: what the parts are, how they move (one step per move), what goes wrong or what it costs, then the check.
- **The check** (a step with a "?" number) is one question card. The reader picks one of two to four answer cards, then presses "Check my answer". Until a pick, the button stays faded and a hint says "Pick an answer first". After the check, the right card turns green and a wrong pick turns orange. A badge says "Correct" or "Not quite", and the picture builds. Then one toggle changes an assumption and shows the new result. Set `ANSWER` and `VERDICT` in the script and `data-guess` on each answer card.
- **The glossary** ("Words on this page") comes last. Each term has one plain line. The words are the same as in the text reply.

## The engine (keep it)

- Every picture draws itself when its top edge passes about 60% of the screen height, so the reader watches it happen. Outlines draw on, then fills fade in, then text sharpens, then arrow heads appear. The order is the order of the elements in the SVG, so put them in teaching order.
- An arrow with the classes `ar a` is a main flow. While its card is the one most in view, a dot travels along it. An arrow with `ar a two` is a request and a response: an indigo dot goes out and an ochre dot comes back. Only one card runs its flow at a time.
- A picture with `data-script="<name>"` runs a one-off scene from `SCRIPTS` after it builds. The template has `rebuild`, which zooms the camera into the context window, clears its lines, draws them again and zooms out. Write new scripts with the `camera`, `tween` and `wait` helpers.
- Under reduced motion, every picture shows its end state at once.

## Test before you deliver

- Scroll through every step at desktop width and at 375 px, in light and in dark (set `data-theme` on `<html>`).
- At 375 px, the page is exactly as wide as the screen (`scrollWidth` equals `innerWidth`). Each wide picture scrolls inside its card, as in v1.
- In each picture, and in each camera zoom, no label touches a shape or another label. Run `scripts/overlap.js` in the page (show any hidden picture first). It must return an empty list.
- The check works: a prediction, the verdict, the picture, and the toggle that changes the live value.
- The console shows no errors. Run the lint on the page's words.
- Some preview panes cannot open a local file. Serve the folder over HTTP (for example `python3 -m http.server`). A hidden tab renders no frames, so the pictures do not build there. If a test stalls, run it in a visible window or in headless Chrome.
