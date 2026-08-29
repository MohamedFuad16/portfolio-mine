# Data

Portfolio content is currently embedded in `src/App.jsx`.

CV sources: English `/Users/mfuad16/Documents/Resume/output/Mohamed_Fuad_CV.pdf`; Japanese `/Users/mfuad16/Documents/aice_jakes_resume_JA.pdf`.

Key identity:
- Mohamed Fuad
- Tokyo, Japan
- `mohamed.fuad.jp@gmail.com`
- GitHub: `MohamedFuad16`
- LinkedIn: `mohamed-fuad-6b8483278`

Focus areas: Forward Deployed Engineering, full-stack product development, LLM systems, agent workflows, tool-calling, MCP, TypeScript, Python, Swift, Node, AWS, English/Japanese.

Localized copy:
- `src/App.jsx` contains `copy.en` and `copy.ja` for section labels, intro/contact text, contribution labels, and project/work descriptions.
- Work experience entries include English and Japanese role/date/status/detail variants.

Current project links:
- WebDrop: `https://web-drop-lyart.vercel.app/`, GitHub `https://github.com/MohamedFuad16/WebDrop`
- Tutor-System: `https://tutor-system-architecture.vercel.app/`, GitHub `https://github.com/MohamedFuad16/Tutor-System`
- TokaiHub: `https://mohamedfuad16.github.io/TokaiHub/`, GitHub `https://github.com/MohamedFuad16/TokaiHub`
- ClaudeShot: `https://github.com/MohamedFuad16/ClaudeShot`

Static assets:
- Profile and QR: `public/media/images/`.
- Project screenshots and ClaudeShot SVG/icon pair: `public/media/projects/`.
- University/work marks: `public/media/logos/`.
- Interaction audio: `public/media/audio/achievement-completed.wav`.
- Daijin atlas pairs: `public/media/mascot/`.

Runtime public data:
- Contribution grid fetches `https://github-contributions-api.jogruber.de/v4/MohamedFuad16?y=last`, falls back to `public/media/data/contributions.json`, then embedded data. The UI labels this as a rolling 12-month total.
