# /explain: an agent skill

/explain makes an agent explain any topic twice:

1. A short answer in plain English, written 80% of the way to ASD-STE100 (Simplified Technical English).
2. One web page for a reader who knows nothing about the topic. Its big pictures draw themselves in the 3Blue1Brown style, and it has very few words. It ends with a check: the reader predicts a result, then changes one assumption.

## Install

**Claude Code.** Unzip this folder into your skills folder, so that the path is `~/.claude/skills/explain/SKILL.md`. Then ask Claude to explain something, or type `/explain`.

**Other agents.** Put the folder where your agent reads skills, or point it at `SKILL.md`.

You need Python 3 for the writing lint (`scripts/ste_lint.py`) and a browser to test the page.

## What is inside

| File | What it holds |
|---|---|
| `SKILL.md` | The steps the agent follows |
| `STE.md` | The writing rules: 80% of ASD-STE100, plus plain-prose rules |
| `PAGE.md` | The shape of the page, its engine, and the tests to run before you deliver |
| `MOTION.md` | The 3Blue1Brown motion rules and timings |
| `SHADCN.md` | The interface tokens and rules |
| `templates/page.html` | A complete page to start from. Its example explains CCFT, a small program that runs a team of AI models. |
| `scripts/ste_lint.py` | Checks text against the writing rules. Try `python3 scripts/ste_lint.py scripts/samples/bad.md`. |
| `scripts/overlap.js` | Checks the page's pictures for labels that touch shapes or each other |

Made by Mohamed Fuad.
