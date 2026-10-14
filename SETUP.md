# AI事件マップ セットアップ手順

## 全体の流れ

```
毎朝5:17（GitHub Actions: collect）
  RSS 7媒体 → AIっぽい記事だけ → Claudeが判定・抽出 → Notion「AI事件」に「確認待ち」で追加 → LINE通知
                                                          ↓
                                    Maoがスマホで確認して「公開」or「却下」
                                                          ↓
3時間おき（GitHub Actions: export）
  Notionの「公開」→ data/incidents.json → コミット → Vercelが自動で公開サイトを更新
```

- Notionのデータベース：MY WORK SPACE ＞ **AI事件**（最初の11件は手作業で「公開」登録済み）
- 「却下」にした記事は、次から自動で飛ばされる
- 緯度・経度が空の事件は地図に載らない（地域しか分からない事件など）。Notionで数字を入れてから「公開」にする

## Maoの作業

### ① 鍵を貼る（ローカル）
1. `.env.example` をコピーして `.env` を作る
2. 値を貼る（どれもトレンドボットで使っている鍵と同じでOK）
   - `ANTHROPIC_API_KEY`
   - `NOTION_TOKEN`
   - `LINE_CHANNEL_ACCESS_TOKEN`（自分だけに送るなら `LINE_USER_ID` も）

### ② 動作確認（ローカル。Novaに「動かして」と言えばNovaがやる）
```bash
npm run collect:dry
```
RSSの候補が出るだけ。鍵もお金も使わない
```bash
npm run export
```
Notionの11件が `data/incidents.json` に書き出されればNotion連携OK
```bash
npm run collect
```
本番。Claudeで判定し、事件があればNotionに追加される

### ③ 自動化（GitHub）
1. GitHubに新しいリポジトリを作ってpushする
2. Settings → Secrets and variables → Actions に①と同じ4つを登録する
3. Actionsタブで `collect` と `export` を一度ずつ手動実行して、成功を確認する

### ④ 公開（Vercel）
1. VercelでGitHubのリポジトリをImportする（設定はそのままでよい。静的サイトとして公開される）
2. 以後は export がコミットするたびに自動で更新される

## 費用の目安
- Claude：初期設定は `claude-opus-5-5`。1記事あたり約3〜5円 × 1日10〜20記事 ＝ **1日50円前後・月1,500円前後**（概算）
  - 安くしたいなら `.env`（GitHubではSecret）に `CLAUDE_MODEL=claude-haiku-5-5` を足す（約1/40＝月40円前後。判定の精度は要確認）
- Nominatim（地名→緯度経度）・GitHub Actions・Vercel：無料枠の範囲

## 情報源を足すとき
`scripts/config.js` の `FEEDS` に1行足す。BleepingComputer と SecurityWeek は自動取得を拒否している（403）ので入れていない
