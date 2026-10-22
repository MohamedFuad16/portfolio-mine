#!/usr/bin/env python3
"""Check Japanese plain text or Markdown against the rules in ../WRITING.md.

Usage:
  ja_lint.py FILE [--strict] [--glossary FILE]
  cat FILE | ja_lint.py -

Errors (exit code 1): sentences over the limit (40 characters for an instruction, 60 for a
description), dashes, semicolons, double negatives, and glossary synonyms.
Warnings (exit code 0, or 1 with --strict): hedges, passive forms, noun-heavy "を行う",
paragraphs over six sentences, and hype words.

Counting skips inline code, URLs, numbers with units and quoted text, as WRITING.md says.
Code blocks are skipped. The glossary file holds lines like "リクエスト: 要求, 呼び出し"
(the word to keep, then the synonyms to flag).
"""
import re
import sys

# Sentences that end like an instruction (40-character limit).
INSTRUCTION = re.compile(r"(してください|てください|しましょう|します。?$|ます。?$)")
INSTRUCTION_START = re.compile(r"^(まず|次に|最後に|そのあと)?、?.{0,12}(を|に)(開き|押し|実行し|入力し|選び|保存し|読み|書き|閉じ|入れ)")
HEDGE = re.compile(r"(かもしれません|かもしれない|と思われ|と考えられ|ようです|みたいです|おそらく|多分)")
DOUBLE_NEG = re.compile(r"(ないわけでは(な|あ)|なくは(な|あ)|ないことは(な|あ)|ないではいられな)")
PASSIVE = re.compile(r"(され(る|ます|た|ました)|られ(る|ます|た|ました))")
NOUN_VERB = re.compile(r"を行(う|い|います|いました)")
HYPE = re.compile(r"(画期的|革新的|シームレス|強力な|圧倒的|最先端|究極の|唯一無二|ゲームチェンジャー|魔法のよう)")
DASH = re.compile(r"[—―–]|[―─]{1,}")


def strip_markdown(text):
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^---\n.*?\n---\n", "", text, flags=re.S)  # frontmatter
    text = re.sub(r"`[^`]*`", "C", text)
    text = re.sub(r"https?://\S+", "U", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.M)
    text = re.sub(r"\*\*|__", "", text)
    text = re.sub(r"^\s*\|.*\|\s*$", "", text, flags=re.M)  # tables are reference, not prose
    return text


def paragraphs(text):
    out = []
    for block in re.split(r"\n\s*\n", text):
        items = re.split(r"\n\s*(?:[-*+]|\d+\.)\s+", "\n" + block)
        out += [re.sub(r"\s+", "", i) for i in items if i.strip()]
    return out


def sentences(par):
    return [s for s in re.split(r"(?<=[。！？])", par) if s.strip()]


def length(sentence):
    s = re.sub(r"「[^」]*」|『[^』]*』|（[^）]*）|\([^)]*\)", "・", sentence)  # quotes and asides count as one
    s = re.sub(r"\d+(\.\d+)?(%|ms|s|px|KB|MB|秒|分|時間|日|件|個|人|字|文)?", "・", s)
    s = re.sub(r"[A-Za-z0-9_./-]+", "・", s)
    return len(re.sub(r"[。、！？：「」\s]", "", s))


def lint(text, glossary=None):
    errors, warnings = [], []
    for p_i, par in enumerate(paragraphs(strip_markdown(text)), 1):
        sents = sentences(par)
        if len(sents) > 6:
            warnings.append((p_i, par[:30], f"段落が{len(sents)}文あります（6文まで）"))
        for s in sents:
            q = re.sub(r"「[^」]*」", "「」", s)  # quoted text is a mention, not a use
            instruction = bool(INSTRUCTION_START.search(q)) or q.rstrip("。").endswith("てください")
            limit = 40 if instruction else 60
            n = length(q)
            if n > limit:
                kind = "手順" if instruction else "説明"
                errors.append((p_i, s, f"{n}字（{kind}は{limit}字まで）"))
            if DASH.search(q):
                errors.append((p_i, s, "ダッシュは使いません（。か、で区切ります）"))
            if "；" in q or ";" in q:
                errors.append((p_i, s, "「；」は使いません（2つの文にします）"))
            if DOUBLE_NEG.search(q):
                errors.append((p_i, s, f"二重否定「{DOUBLE_NEG.search(q).group(0)}」"))
            for pattern, why in ((HEDGE, "あいまいな言い方"), (PASSIVE, "受け身（だれが動くかを書きます）"), (NOUN_VERB, "「〜を行う」より動詞で"), (HYPE, "誇張語（しくみか数字で書きます）")):
                m = pattern.search(q)
                if m:
                    warnings.append((p_i, s, f"{why}「{m.group(0)}」"))
            for keep, alts in (glossary or {}).items():
                for alt in alts:
                    if alt in s:
                        errors.append((p_i, s, f"「{alt}」は用語集の「{keep}」の言いかえです（1つのものに1つの名前）"))
    return errors, warnings


def load_glossary(path):
    g = {}
    for line in open(path, encoding="utf-8"):
        if ":" in line and not line.lstrip().startswith("#"):
            keep, alts = line.split(":", 1)
            g[keep.strip()] = [a.strip() for a in re.split(r"[,、]", alts) if a.strip()]
    return g


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 2
    strict = "--strict" in argv
    glossary = load_glossary(argv[argv.index("--glossary") + 1]) if "--glossary" in argv else None
    src = argv[0]
    text = sys.stdin.read() if src == "-" else open(src, encoding="utf-8").read()
    errors, warnings = lint(text, glossary)
    for kind, items in (("ERROR", errors), ("WARN", warnings)):
        for p_i, s, why in items:
            print(f"{kind} 段落{p_i}: {why}\n    {s[:80]}")
    print(f"\nエラー {len(errors)} 件、警告 {len(warnings)} 件")
    return 1 if errors or (strict and warnings) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
