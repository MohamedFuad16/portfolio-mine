# /explain：エージェントスキル

/explain を使うと、エージェントはどんなテーマも2通りで説明します。

1. やさしい日本語の短い答え（英語のときは ASD-STE100、簡略技術英語の80%）。
2. そのテーマを何も知らない人のための1枚のWebページ。大きな図が3Blue1Brown風に自分で描かれ、言葉はとても少なくします。最後に確かめの問いがあり、読み手は結果を予想してから、前提を1つ変えて試します。

## インストール

**Claude Code**：このフォルダをスキルのフォルダに展開し、`~/.claude/skills/explain/SKILL.md` というパスにします。そのあと、Claude に何かの説明を頼むか、`/explain` と入力します。

**ほかのエージェント**：エージェントがスキルを読むフォルダに置くか、`SKILL.md` を指定します。

文章のチェック（`scripts/ja_lint.py`、`scripts/ste_lint.py`）には Python 3 が、ページのテストにはブラウザが必要です。

## 中身

| ファイル | 内容 |
|---|---|
| `SKILL.md` | エージェントが従う手順 |
| `WRITING.md` | 日本語の書き方のルール（やさしい日本語） |
| `STE.md` | 英語で書くときのルール（ASD-STE100 の80%）。英語版のままです |
| `PAGE.md` | ページの形、エンジン、渡す前のテスト |
| `MOTION.md` | 3Blue1Brown風の動きのルールと時間 |
| `SHADCN.md` | 画面の色のトークンとルール |
| `templates/page.html` | 始めるための完成したページ（日本語）。例として、AIモデルのチームを動かす小さなプログラム「CCFT」を説明しています |
| `scripts/ja_lint.py` | 日本語の文章をルールでチェックします。`python3 scripts/ja_lint.py scripts/samples/bad-ja.md` で試せます |
| `scripts/ste_lint.py` | 英語の文章をチェックします |
| `scripts/overlap.js` | ページの図で、ラベルが図形やほかのラベルに重なっていないかを調べます |

作者：Mohamed Fuad
