# Writing to ASD-STE100, 80% of the way

ASD-STE100 (Simplified Technical English) is the controlled language of aircraft maintenance manuals. It exists so that a tired reader, native speaker or not, cannot misread a sentence. Karpathy (2026-10-02) found LLM explanations in it "a lot more readable", and softens it to "80% of the way" because the full standard is strict. This file is that 80%: the structure rules in full, the vocabulary rules as discipline, and plain-prose rules on top.

Sources: the free standard, ASD-STE100 Issue 9 (asd-ste100.org), and the rule paraphrase in the MIT-licensed SimpleEnglish skill by AminBlg (github.com/AminBlg/SimpleEnglish). Rule numbers below are the standard's, checked against that rule catalog on 2026-10-03 (the catalog paraphrases Issue 9, so the official PDF has the final wording). Cite only these numbers.

## Modes

- **Pragmatic** (default): every structure rule below. Domain words stay ("daemon", "token", "webhook") as technical nouns.
- **Strict**: only when the user names STE, ASD-STE100, or compliance. Add the full vocabulary discipline, and tell the user that full compliance needs the official dictionary.

## First, sort each passage

| | Procedural (what to do) | Descriptive (what a thing is or does) |
|---|---|---|
| Verb form | Imperative: "Open the file." | Simple present, past or future |
| Sentence limit | 20 words (5.1) | 25 words (6.3) |
| Unit | One instruction per sentence (5.2) | One topic per paragraph (6.5), at most six sentences (6.6) |

Explanations are mostly descriptive. A "try it" or "how to" part is procedural. Keep them in separate paragraphs.

## Rules

**Words**
- One item, one name (1.11, 9.4). Pick the word from the glossary and keep it everywhere.
- Use a technical noun as a noun and a technical verb as a verb (1.7, 1.13). "Send the request", not "do a request".
- Use no phrasal verbs when a single verb exists (9.3): "set up" becomes "install" or "configure".
- Keep noun chains to three words or fewer (2.1). Break longer ones with "of", "for", "in": "the timeout value for the connection pool".

**Verbs**
- Active voice (3.6). Name who acts: "the daemon sends the request". Use the passive only when the actor is unknown.
- Simple tenses only (3.2, 3.4): no "has been", no "is being".
- An "-ing" word only as a noun ("logging"), never as a verb (3.5).
- Say the action with a verb, not a noun (3.7): "compress the file", not "perform compression".
- Modals: "can", "must", "will". For "should": a requirement becomes "must", a suggestion becomes a fact or goes. For "may", "might", "could": use "can". For "would": restructure as "If X occurs, Y occurs."

**Sentences**
- Full grammar, short sentences (4.1, 4.2): keep "the", "a", and "that". No contractions. No telegraph style.
- A vertical list for complex text (4.3). The lead-in colon ends a sentence for the word count (8.4).
- Link related sentences with plain connectors (4.4): "Then", "As a result", "Because of this".
- One new fact per sentence (6.1).
- Put a condition first (5.4): "If the build fails, read the log."
- Safety (7.1 to 7.3): start with the command or the condition, then the risk. "CAUTION: Do not run this on production. It erases rows."

**Punctuation and counting**
- No semicolons (8.1): write two sentences.
- No em dashes or en dashes, and no hyphen used as a dash (a house rule on top of the standard). Use a period or a comma.
- Code, identifiers, file paths, numbers with units, and quoted text each count as one word (8.5 to 8.7). Leave them exact.

## Plain-prose rules apply on top

Plain words ("use", not "leverage"). No filler ("it is worth noting"). No hype ("robust", "seamless"). No rule-of-three padding.

Say what a thing does with a mechanism or a number, never how it feels.

## Self-check before you deliver

1. Run `python3 scripts/ste_lint.py <file>` from this skill's folder. It reports sentence length, banned modals, contractions, semicolons, dashes, passive voice, late conditions, long paragraphs, and slop words. Exit code 1 means an error you must fix.
2. Read your three longest sentences aloud. Split any that you must read twice.
3. Search for every synonym of each glossary term. Replace each hit with the glossary word.

## Where STE does not fit

STE is for facts and instructions. If the user asks for marketing copy or personal writing, say that STE does not fit it.
