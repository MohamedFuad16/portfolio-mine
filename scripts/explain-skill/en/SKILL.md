---
name: explain
description: "Explain a topic twice: a short answer in plain English (80% of ASD-STE100), and one ELI5 web page whose pictures draw themselves in the 3Blue1Brown style. Use when the user asks to explain something, asks how something works, asks for an ELI5, or asks for an explainer page."
---

# explain

Every explanation is a pair about one topic. Both teach the same facts in the same words:

1. **Text**: the answer in your reply, written 80% of the way to ASD-STE100 ([STE.md](STE.md)). It is also the plain summary beside the page, so the reader can check the page against it.
2. **Page**: one ELI5 web page for a reader who knows nothing about the topic, in the design of "How does CCFT work?" version 1. It has big pictures and few words. The pictures draw themselves and move in the 3Blue1Brown style ([MOTION.md](MOTION.md)), and the controls follow shadcn's anatomy in v1's colours ([SHADCN.md](SHADCN.md)). The rules are in [PAGE.md](PAGE.md), and you start from [templates/page.html](templates/page.html).

If the user names only one format ("just the text", "only a page"), build only that one. If the whole answer fits in three sentences, give the text and offer the page in one line.

## Steps

1. **Get the facts.** Read the code, the docs, or the sources before you write. Label each claim as verified, inferred, or assumed. Done when every fact in the plan has a source or a label.
2. **Write the glossary first.** List each technical term that the topic needs, with one plain definition and one tiny example. If the picture marks a term with a colour, keep that colour everywhere. Use one word for one meaning in both outputs ("request" everywhere, never "request" here and "call" there). Done when neither output uses a term that is missing from the glossary.
3. **Write the text** to [STE.md](STE.md). Save it to a file and run the lint from this skill's folder:
   ```bash
   python3 scripts/ste_lint.py <file>
   ```
   Done when the lint exits 0. Keep a warning only when you can say why it stays.
4. **Build the page** from the template, by [PAGE.md](PAGE.md). Run the lint on the page's words too. Done when every item on the test list in PAGE.md passes.
5. **Make it a check, not a show.** The page asks the reader to predict an outcome before it reveals the answer. Then it lets the reader change one assumption and see the new result. Each step names who acts: "the daemon sends", not "it is sent".
6. **Deliver** the text in the reply, then the page. Add one line per check you ran, with its result.
