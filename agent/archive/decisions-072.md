# ADR archive: ADR-072

_Moved verbatim from agent/decisions.md on 2026-10-22._

---

## ADR-072: Tiny courts drawn on a low-resolution canvas (2026-10-21)

Context: the owner wanted a section like Dhruv's "Small plays" (isometric sports dioramas with tiny players).
Decision: draw it live in code, not as a video. One 2D canvas at a low art resolution, scaled up by a whole number of device pixels with nearest-neighbour, so shapes keep a pixel grid. The ground is cached per resize; players, ball and props are depth-sorted each frame (points by x + y, full-width props such as nets by y). Play logic is seeded and per sport. The loop stops when the section is off screen or paused.
Consequences: no new assets or dependencies, about 1,000 lines in one component. Adding a sport means a new sport object with court, surface, props, setup, tick, carry and hud.

Amendment (2026-10-21): the 2D canvas renderer is replaced. The owner wanted the reference's exact quality, which is a WebGL render with a dither pass. The scene is now three.js (orthographic camera at 30 degrees, one shadow-casting sun, Lambert materials) rendered into a target at art resolution, then quantised per channel with a 4x4 Bayer threshold. Partly transparent pixels are stippled by the same threshold. three.js is a new dependency, loaded in its own chunk only near the section, so the first page load does not grow. The play logic did not change apart from 3D facing (`yaw`), velocities and player separation.

