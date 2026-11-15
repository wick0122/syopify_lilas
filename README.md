# Lilas Shopifyテーマ 編集用プロジェクト

Shopifyのテーマは `sections/` や `assets/` の中にフォルダを作れません。
このプロジェクトでは、**ふだんは `src/` の中をページごとに分けて編集し、
アップロードするときだけ Shopify の形(1階層)に自動でまとめます。**

## フォルダの見方

```
src/
├─ pages/                 ページごと
│   ├─ top/               トップ
│   │   ├─ sections/      lx-top-01〜14.liquid(ブロックごとのHTML)
│   │   ├─ snippets/      lx-tail-top.liquid(ページ専用のスクリプト)
│   │   ├─ templates/     index.json(文言・並び順)
│   │   ├─ css/           lilas-index.css
│   │   └─ images/        このページだけで使う画像
│   ├─ features/ products/ message/ about/ guide/
│   ├─ product/           製品ページ(aging, bright, calmsmooth, sensitive, smooth, oil, serum, balm)
│   └─ legal/             privacy, terms, tokushoho
├─ common/                全ページ共通
│   ├─ header/  footer/  news/      ヘッダー・お知らせバー/フッター・サービス紹介/Newsパネル
│   ├─ system/            共通CSS・共通スクリプト・動画スニペット
│   ├─ shopify/           カート周りのCSS・JS
│   ├─ shared/images/     複数のページで使う画像
│   └─ layout/            theme.liquid(全体の枠・head)
└─ shopify/               Shopify標準(main-*.liquid、config、locales など)
```

### 行き先のルール(自由にフォルダを増やせます)
ファイルは、**いちばん近い「決まった名前のフォルダ」**で行き先が決まります。

| フォルダ名 | まとめ先 |
|---|---|
| `sections/` `snippets/` `templates/` `layout/` `config/` `locales/` `blocks/` | 同じ名前のフォルダ |
| `css/` `js/` `images/` `fonts/` `media/` `assets/` | `assets/` |

例:`src/pages/top/sections/01_FV/lx-top-01.liquid` → `sections/lx-top-01.liquid`
(`01_FV` のような整理用フォルダはいくつ挟んでも大丈夫です)

- `_` で始まるファイル・フォルダ、`.md` `.txt` はアップロードに含めません(メモ置き場に使えます)。
- 同じファイル名が2つあると、ビルドを止めてお知らせします(Shopify内では上書きされてしまうため)。

## 使い方

| やりたいこと | Macでダブルクリック | ターミナルの場合 |
|---|---|---|
| アップロード用にまとめる | `1_ビルド.command` | `python3 theme_tool.py build` |
| 編集しながら自動でまとめ続ける | `2_自動ビルド.command` | `python3 theme_tool.py watch` |
| Shopifyで変更した内容を取り込む | `3_取り込み.command`(zipかフォルダを選ぶ) | `python3 theme_tool.py import <zip/フォルダ>` |

- ビルドすると `dist/` に Shopify 形式のテーマができ、`release/` に日付入りのzipが保存されます。
- **Shopifyへの上げ方**:管理画面「オンラインストア → テーマ → テーマを追加 → zipファイルをアップロード」で `release/` のzipを選ぶ。
  Shopify CLI を使う場合は `shopify theme push --path dist`(プレビューは `shopify theme dev --path dist` と `2_自動ビルド` を同時に起動)。
- ビルド時に、存在しない画像・スニペット・セクションを参照している箇所があれば「⚠」で知らせます。

## テーマエディタで文言を変えたときは
Shopifyのテーマエディタで編集すると、`templates/*.json` や `config/settings_data.json` が Shopify 側だけで変わります。
上書きして消さないよう、**ローカルで編集を始める前に**テーマを書き出して `3_取り込み` で取り込んでください。
取り込みはファイル名で元の場所を探して上書きし、新しいファイルはルールに沿って振り分けます。

## 画像について
画像名(`img-xxxxxxxx.webp`)と使用箇所の対応は `画像の使用箇所.md` にまとめています(取り込み時に自動更新。`python3 theme_tool.py map` でも作り直せます)。

## GitHub ⇄ Shopify 連携(wick0122/syopify_lilas)

| ブランチ | 中身 | Shopify |
|---|---|---|
| `develop` | このプロジェクト(src/ とツール)。ふだん編集・コミットする場所 | つながない |
| `main` | ビルド済みのShopify形式だけ(自動生成。手で編集しない) | 公開テーマに連携 |
| `preview` | 確認用のビルド(任意) | 非公開テーマに連携 |

### 初回だけ
1. GitHubに空のリポジトリ `wick0122/syopify_lilas` を用意(作成済み)
2. `0_初回セットアップ.command` をダブルクリック → main と develop が GitHub に送られます
3. Shopify「テーマ」→「インポート」→「GitHubから接続」→ `syopify_lilas` の **main** を選ぶ

### ふだんの流れ
1. develop で `src/` を編集してコミット(`git commit`)
2. `4_公開（main）.command` をダブルクリック。自動で次を行います
   - GitHubの main にある、Shopify側の変更(テーマエディタでの文言修正など)を `src/` に取り込み、develop にコミット
   - ビルドして、main にコミット&プッシュ → Shopifyのテーマに反映
   - develop もプッシュ
3. 公開前に確認したいときは `5_プレビュー公開（preview）.command`(previewブランチを非公開テーマにつないでおく)

ターミナルなら `python3 theme_tool.py publish`(既定は main)/ `python3 theme_tool.py publish preview`。

> ⚠ main は自動生成です。直接編集やコミットはしないでください(Shopifyのテーマエディタでの保存は問題ありません。次の公開時に自動で取り込みます)。
> ⚠ Shopifyの「コードを編集」で直接書き換えた場合も取り込まれますが、同じファイルをローカルでも直していると、Shopify側の内容で上書きされます。コードの修正はローカル(src/)で行うのが安全です。

### 困ったとき
- **「同じファイルが両方で変更されています」と出たら**:隣にできた `_shopify版_〜` と元のファイルを見比べて、元のファイルにまとめます。`_shopify版_〜` を消してコミットし、もう一度公開してください。
- **「前回の公開記録が見つかりません」と出たら**:`.shopify-base-main` に、最後に公開した main のコミットID(`git rev-parse origin/main`)を書いてコミットしてください。
- 取り込むのは、**前回の公開以降に Shopify 側で変わったファイルだけ**です。ローカルで直した内容が、Shopify側の古い内容で上書きされることはありません。
