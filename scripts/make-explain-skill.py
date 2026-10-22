#!/usr/bin/env python3
"""Package the /explain skill for download from the toolkit card.

Writes public/media/skills/explain-skill-en.zip and explain-skill-ja.zip. Each
zip holds one `explain/` folder: the language's files from
scripts/explain-skill/<lang>/, plus the shared scripts. The sources are a public
copy of the owner's explain-classic skill with local paths and private project
notes removed, so edit them here, not in ~/.folio.

Entries get a fixed timestamp, so the same sources always give the same bytes.

Usage: python3 scripts/make-explain-skill.py
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "explain-skill")
OUT = os.path.join(ROOT, "public", "media", "skills")
STAMP = (2026, 10, 22, 0, 0, 0)
BORROW = {"ja": ["STE.md"]}


def files(base):
    for folder, _, names in os.walk(base):
        for name in sorted(names):
            if name.startswith("."):
                continue
            path = os.path.join(folder, name)
            yield path, os.path.relpath(path, base)


def build(lang):
    entries = dict()
    # Shared files first, so a language's own file of the same name wins.
    for path, rel in files(os.path.join(SRC, "shared")):
        entries[rel] = path
    for path, rel in files(os.path.join(SRC, lang)):
        entries[rel] = path
    # The Japanese package keeps the English writing rules for English output.
    for rel in BORROW.get(lang, ()):
        entries.setdefault(rel, os.path.join(SRC, "en", rel))
    os.makedirs(OUT, exist_ok=True)
    target = os.path.join(OUT, f"explain-skill-{lang}.zip")
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in sorted(entries):
            info = zipfile.ZipInfo(f"explain/{rel}", STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o755 if rel.endswith(".py") else 0o644) << 16
            with open(entries[rel], "rb") as f:
                z.writestr(info, f.read())
    print(f"{os.path.relpath(target, ROOT)}: {len(entries)} files, {os.path.getsize(target) / 1024:.1f} KB")


if __name__ == "__main__":
    for lang in ("en", "ja"):
        build(lang)
