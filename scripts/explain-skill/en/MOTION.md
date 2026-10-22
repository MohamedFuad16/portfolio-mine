# Motion in the 3Blue1Brown style

The pictures on the page move like a 3Blue1Brown (3b1b) video. Grant Sanderson makes those videos with Manim, his own animation library. The names in brackets are Manim's animation families (docs.manim.community, "Animations"), so you can look up a real example.

The core idea: the picture is one continuous scene. Things change shape, move, and get new labels while you watch. Your eye follows each object from start to end, so you never lose track of it.

## Rules

1. **One scene, no slides.** A new step changes the picture that is already there. It never cuts or fades to a new picture.
2. **An object keeps its identity.** If the "request" box is in step 2 and step 3, it is the same element. It moves, grows or changes shape to its new form (transform). Give each element a stable id across steps.
3. **Changed labels keep their shared parts.** When "context" becomes "context + tool result", the word "context" slides to its new place and only "+ tool result" draws in (transform_matching_parts).
4. **New things draw on.** An outline draws as a stroke, then the fill fades in. Text writes on letter by letter (creation).
5. **A colour keeps its meaning for the whole page.** If the picture marks a term with a colour, the caption, the quiz card and the glossary use that colour too. Indigo is the flow and the request, and ochre is the response.
6. **The camera moves to the detail.** Zoom into one part of the diagram to show what is inside it, then pull back to the whole. On SVG, animate the `viewBox`.
7. **Live values drive the picture.** A number or a slider changes, and the diagram follows it in every frame (numbers, updaters). For example, the context window fills, the cost bar grows, and the token count rolls. Use this for the "change one assumption" check.
8. **Point with motion, not with arrows only.** Pulse the item once (indication), draw a line around it, or dim everything else to about 30%.
9. **Stagger a group.** Members of a group start one after the other, about 0.1 to 0.2 of the run time apart (composition).
10. **Pause and ponder.** Before a reveal, the page asks the question, and the picture holds still. The reader predicts. Then the picture moves.
11. **One example, then the rule.** Show one case with real numbers first. Then show the general form.

## Timing

- A teaching change (a transform, a camera move) takes about 1 s, with a smooth ease in and out. Manim's default run time is 1 s.
- Hold still for 1 to 2 s after each change, so the reader can read the new state.
- A whole picture draws in about 1.5 to 2 s: each part takes 0.8 s, and parts start 45 ms apart. It starts when the top of the picture passes about 60% of the screen height. A test on 2026-10-04 tried both sides. At 1 s per part and 70 ms apart, the drawing was too slow to watch. At 0.55 s and 28 ms, with an early start, it was over before the reader got there.
- Interface motion (pills, buttons) stays faster, about 150 to 250 ms. The slower 3b1b timing is for teaching content only.

## How to build it

- **The page.** Each step has its own picture in v1's design. The engine in `templates/page.html` builds each picture when it scrolls into view (rule 4) and runs one flow at a time along the main arrows. A `data-script` scene adds a camera move or a change of state (rules 2, 3 and 6). See [PAGE.md](PAGE.md).
- **React.** With motion/react, `layoutId` and `layout` keep identity across steps. `pathLength` draws strokes on. An `animate` on the SVG `viewBox` moves the camera. `useMotionValue` with `useTransform` gives live values. Morph a shape by keeping the same number of path points in both forms.
- **Real mathematics** (graphs, equations, geometry). If a topic needs these, render the scene with Manim Community and embed it as a video. Ask the user before you install Manim.
- **Reduced motion.** Show the end state of each step, and keep the colours and the order.

## Check before you deliver

- Step through the page. Each element that is in two steps must move or change. It must not disappear and come back.
- A term with a colour has the same colour everywhere.
