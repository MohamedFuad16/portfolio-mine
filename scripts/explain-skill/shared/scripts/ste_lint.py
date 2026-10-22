#!/usr/bin/env python3
"""Lint plain text or Markdown against the 80% ASD-STE100 rules in ../STE.md.

Usage:
  ste_lint.py FILE [--strict] [--glossary FILE]
  cat FILE | ste_lint.py -

Errors (exit code 1): sentences over the limit (20 words for an instruction, 25 for a description),
semicolons, em or en dashes, a hyphen used as a dash, contractions, and glossary synonyms.
Warnings (exit code 0, or 1 with --strict): weak modals, passive voice, perfect tenses, a condition after
its command, an -ing verb after a comma, paragraphs over six sentences, and slop words.

Counting follows the standard: inline code, URLs, numbers with units and text in parentheses count as one
word each (rules 8.5 to 8.7). Code blocks are skipped. The glossary file holds lines like
"request: call, message" (the word to keep, then the synonyms to flag).
"""
import re
import sys

# Verbs that start an instruction. A sentence that starts with one is procedural (20-word limit).
IMPERATIVE = set("""add allow ask build change check choose click close configure connect copy create delete do drag enter find
fix give go install keep let lift look make move open paste pick plug press pull push put read remove repeat replace restart run
save see select send set show start stop take tap try turn type update use wait watch write""".split())
# Linking words that can come before the verb of an instruction ("Then open the file.").
LEAD = {"then", "now", "next", "first", "finally", "also", "again", "next,", "please"}
MODALS = re.compile(r"\b(should|would|may|might|could)\b", re.I)
CONTRACTIONS = re.compile(r"\b\w+(n['’]t|['’]re|['’]ll|['’]ve|['’]d)\b|\b(I['’]m|it['’]s|that['’]s|there['’]s|what['’]s|let['’]s|here['’]s|who['’]s|he['’]s|she['’]s)\b", re.I)
PASSIVE = re.compile(r"\b(is|are|was|were|be|been|being)\s+(\w+ed|built|done|made|sent|kept|held|given|taken|written|shown|known|seen|run|set|put|read|found|lost|told|paid|left)\b", re.I)
PERFECT = re.compile(r"\b(has|have|had)\s+(been|\w+ed|built|done|made|sent|written|shown|seen|run|found)\b", re.I)
LATE_CONDITION = re.compile(r"^(?!(if|when|unless|before|after)\b).+\s(if|unless)\s", re.I)
NOT_VERBS = r"(?!(during|according|including|string|thing|something|nothing|anything|everything|morning|evening|spring|ring|king|ceiling|wing)\b)"
ING_AFTER_COMMA = re.compile(r",\s+" + NOT_VERBS + r"\w{3,}ing\b")
SLOP = re.compile(r"\b(leverage|utili[sz]e|in order to|prior to|it is worth noting|crucial(ly)?|seamless(ly)?|robust|powerful|comprehensive|"
                  r"delve|dive into|streamline|plethora|myriad|cutting-edge|state-of-the-art|game-changer|"
                  r"facilitate|empower|unlock|elevate|simply|effortless(ly)?|blazingly)\b", re.I)
DASH = re.compile(r"[\u2014\u2013]|\s-\s")


def strip_markdown(text):
    """Remove code blocks, keep inline code as one token, drop Markdown markers."""
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"`[^`]*`", "CODE", text)
    text = re.sub(r"https?://[^\s)\]]*[^\s)\].,:;!?]", "URL", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.M)
    text = re.sub(r"\*\*|__|\*|_(?=\w)|(?<=\w)_", "", text)
    text = re.sub(r"^\s*\|.*\|\s*$", "", text, flags=re.M)  # tables are reference, not prose
    return text


def paragraphs(text):
    """Blocks of prose. Each list item is its own block."""
    out = []
    for block in re.split(r"\n\s*\n", text):
        items = re.split(r"\n\s*(?:[-*+]|\d+\.)\s+", "\n" + block)
        out += [re.sub(r"\s+", " ", i).strip() for i in items if i.strip()]
    return out


def sentences(par):
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'“(])", par)
    return [p.strip() for p in parts if p.strip()]


def word_count(sentence):
    s = re.sub(r"\([^)]*\)", " P ", sentence)  # a parenthesis counts as one word (8.5 to 8.7)
    s = re.sub(r"\b\d+(\.\d+)?\s?(%|ms|s|kb|mb|gb|px|k)\b", "N", s, flags=re.I)
    s = re.sub(r"\s:\s|:$", " ", s)
    return len([w for w in re.split(r"\s+", s) if re.search(r"\w", w)])


def lint(text, strict=False, glossary=None):
    errors, warnings = [], []
    prose = strip_markdown(text)
    for p_i, par in enumerate(paragraphs(prose), 1):
        sents = sentences(par)
        if len(sents) > 6:
            warnings.append((p_i, par[:60], f"paragraph has {len(sents)} sentences (6.6: at most 6)"))
        for s in sents:
            q = re.sub(r'"[^"]*"|“[^”]*”', "Q", s)  # quoted text is a mention, not a use
            # The colon of a list lead-in ends the sentence for counting (8.4).
            counted = q.split(":")[0] if q.rstrip().endswith(":") else q
            words = [re.sub(r"[^a-z]", "", w.lower()) for w in counted.split()] or [""]
            first = words[1] if words[0] in LEAD and len(words) > 1 else words[0]
            limit = 20 if first in IMPERATIVE else 25
            n = word_count(counted)
            if n > limit:
                kind = "an instruction" if limit == 20 else "a description"
                errors.append((p_i, s, f"{n} words (limit {limit} for {kind}: 5.1 / 6.3)"))
            if ";" in q:
                errors.append((p_i, s, "semicolon (8.1: write two sentences)"))
            if DASH.search(q):
                errors.append((p_i, s, "dash used as punctuation (use a period or a comma)"))
            if CONTRACTIONS.search(q):
                errors.append((p_i, s, f"contraction '{CONTRACTIONS.search(q).group(0)}' (4.2)"))
            m = MODALS.search(q)
            if m:
                warnings.append((p_i, s, f"modal '{m.group(0)}' (use can, must or will)"))
            m = PASSIVE.search(q)
            if m:
                warnings.append((p_i, s, f"passive '{m.group(0)}' (3.6: name who acts)"))
            m = PERFECT.search(q)
            if m:
                warnings.append((p_i, s, f"perfect tense '{m.group(0)}' (3.4: simple tenses)"))
            if LATE_CONDITION.search(q):
                warnings.append((p_i, s, "condition after its command (5.4: put 'If ...' first)"))
            m = ING_AFTER_COMMA.search(q)
            if m:
                warnings.append((p_i, s, f"-ing verb after a comma '{m.group(0).strip(', ')}' (3.5)"))
            m = SLOP.search(q)
            if m:
                warnings.append((p_i, s, f"slop word '{m.group(0)}' (say the mechanism or a number)"))
            for keep, alts in (glossary or {}).items():
                for alt in alts:
                    if re.search(rf"\b{re.escape(alt)}\b", s, re.I):
                        errors.append((p_i, s, f"'{alt}' is a synonym of glossary term '{keep}' (1.11: one item, one name)"))
    return errors, warnings


def load_glossary(path):
    g = {}
    for line in open(path, encoding="utf-8"):
        if ":" in line and not line.lstrip().startswith("#"):
            keep, alts = line.split(":", 1)
            g[keep.strip()] = [a.strip() for a in alts.split(",") if a.strip()]
    return g


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 2
    strict = "--strict" in argv
    glossary = None
    if "--glossary" in argv:
        glossary = load_glossary(argv[argv.index("--glossary") + 1])
    src = argv[0]
    text = sys.stdin.read() if src == "-" else open(src, encoding="utf-8").read()
    errors, warnings = lint(text, strict, glossary)
    for kind, items in (("ERROR", errors), ("WARN", warnings)):
        for p_i, s, why in items:
            print(f"{kind} para {p_i}: {why}\n    {s[:140]}")
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors or (strict and warnings) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
