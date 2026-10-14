// ===== 書き出し：Notionで「公開」にした事件 → data/incidents.json =====
// アプリはこのJSONだけを読む（Notionの鍵がブラウザに出ない・表示が速い）
import { readFile, writeFile } from 'node:fs/promises';
import { publishedIncidents } from './lib/notion.js';

const FILE = new URL('../data/incidents.json', import.meta.url);

const all = await publishedIncidents();

// 地図に置けないもの（日付か位置が空）は外して、Notionで直すよう知らせる
const incidents = all.filter((d) => {
  const ok = d.date && d.lat !== null && d.lng !== null;
  if (!ok) console.warn(`⚠ 日付か緯度・経度が空なので載せません: ${d.title}`);
  return ok;
});

// 中身が変わっていなければ書き換えない（無駄な更新を出さないため）
const current = JSON.parse(await readFile(FILE, 'utf8').catch(() => '{"incidents":[]}'));
if (JSON.stringify(current.incidents) === JSON.stringify(incidents)) {
  console.log(`変更なし（公開中 ${incidents.length}件）`);
  process.exit(0);
}

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });   // 例 2026-10-14
await writeFile(FILE, JSON.stringify({ updated: today, incidents }, null, 2) + '\n');
console.log(`data/incidents.json を更新しました（公開中 ${incidents.length}件）`);
