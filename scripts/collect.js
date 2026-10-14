// ===== 毎朝の収集：RSS → Claudeで判定 → Notionに「確認待ち」で追加 → LINEで通知 =====
// 使い方:
//   npm run collect:dry    … RSSを読んで候補を表示するだけ（鍵いらず・お金かからず）
//   npm run collect:judge  … Claudeの判定まで試す（Notion・LINEは使わない。登録済みの比較は incidents.json で代用）
//   npm run collect        … 本番（Claude・Notion・LINEを使う）
import { readFile } from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { fetchRecentArticles } from './lib/feeds.js';
import { classify } from './lib/classify.js';
import { geocode } from './lib/geocode.js';
import { loadExisting, createDraft } from './lib/notion.js';
import { notifyLine } from './lib/line.js';
import { NOTION_DATABASE_URL, LOOKBACK_HOURS } from './config.js';

const dryRun = process.argv.includes('--dry-run');
const judgeOnly = process.argv.includes('--judge-only');

// ① RSSから、AIに関係ありそうな新着記事を集める
const articles = await fetchRecentArticles();
console.log(`直近${LOOKBACK_HOURS}時間でAIに関係ありそうな記事: ${articles.length}件`);

if (dryRun) {
  for (const a of articles) console.log(`- [${a.source}] ${a.title}\n  ${a.link}`);
  process.exit(0);
}

// ② すでにNotionにある記事は飛ばす（判定だけ試すときは手元のJSONで代用）
const known = judgeOnly
  ? { urls: new Set(), titles: JSON.parse(await readFile(new URL('../data/incidents.json', import.meta.url), 'utf8')).incidents.map((d) => d.title) }
  : await loadExisting();
const fresh = articles.filter((a) => !known.urls.has(a.link));
console.log(`うち未処理: ${fresh.length}件`);

// ③ 1件ずつClaudeに判定させ、事件ならNotionに追加
const added = [];
let failed = 0;
for (const article of fresh) {
  try {
    const result = await classify(article, known.titles);
    if (!result.is_incident) {
      console.log(`  × ${article.title}（${result.reason}）`);
      continue;
    }
    if (result.duplicate_of) {
      console.log(`  = ${article.title}（登録済み「${result.duplicate_of}」と同じ事件）`);
      continue;
    }
    const coords = await geocode(result.place_query);
    if (judgeOnly) {
      console.log(JSON.stringify({ ...result, coords }, null, 2));
    } else {
      await createDraft(result, article, coords);
    }
    added.push(result);
    known.titles.push(result.title);   // 同じ日の別の記事が同じ事件を報じていても二重にしない
    console.log(`  ✓ ${result.title}${coords ? '' : '（位置は手入力が必要）'}`);
  } catch (err) {
    // 1件失敗しても、残りの記事は続ける
    failed++;
    const detail = err instanceof Anthropic.APIError ? `Claude APIエラー ${err.status}` : err.message;
    console.error(`  ⚠ 失敗: ${article.title}（${detail}）`);
  }
}

// ④ 追加があればLINEで知らせる
console.log(`${judgeOnly ? '事件と判定' : 'Notionに追加'}: ${added.length}件`);
if (added.length > 0 && !judgeOnly) {
  await notifyLine([
    `AI事件マップ：確認待ちが${added.length}件あります`,
    ...added.map((d) => `・${d.title}`),
    '',
    'Notionで内容を確かめて「公開」にしてください',
    NOTION_DATABASE_URL,
  ].join('\n'));
}

// 全部失敗していたら、鍵の間違いなどを疑って「失敗」で終わる（GitHub Actionsで赤くなって気づける）
if (fresh.length > 0 && failed === fresh.length) {
  console.error(`⚠ ${failed}件すべて失敗しました。ANTHROPIC_API_KEY などの設定を確認してください`);
  process.exitCode = 1;
}
