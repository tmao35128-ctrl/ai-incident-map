// ===== Notionの「AI事件」データベースとのやりとり =====
import { Client, collectAllDataSourceRows } from '@notionhq/client';
import { NOTION_DATA_SOURCE_ID } from '../config.js';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// --- Notionのプロパティ ⇔ ふつうの値 の変換 ---
const readText = (p) => (p?.rich_text ?? p?.title ?? []).map((t) => t.plain_text).join('');
const readSelect = (p) => p?.select?.name ?? null;
const writeText = (s) => ({ rich_text: [{ text: { content: String(s ?? '').slice(0, 2000) } }] });
const writeSelect = (name) => ({ select: name ? { name } : null });

// 英語の値（Claudeの出力・アプリのJSON）⇔ Notionの選択肢
export const LABELS = {
  precision: { city: '都市', country: '国', region: '地域' },
  actor: { ai: 'AIが自分で', human: '人間が悪用' },
  status: { confirmed: '確認済み', reported: '報道のみ', disputed: '当事者が否定' },
};
const reverse = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
const FROM_LABEL = { precision: reverse(LABELS.precision), actor: reverse(LABELS.actor), status: reverse(LABELS.status) };

// すでにNotionにあるもの（重複して追加しないため）
//   urls   … 記事のURL（却下したものも含む）
//   titles … 却下以外の事件のタイトル（別の記事が同じ事件を報じたときに見分けるため）
export async function loadExisting() {
  const rows = await collectAllDataSourceRows(notion, { data_source_id: NOTION_DATA_SOURCE_ID });
  const urls = new Set();
  const titles = [];
  for (const row of rows) {
    const p = row.properties;
    if (!p) continue;
    if (p['出典URL']?.url) urls.add(p['出典URL'].url);
    for (const m of readText(p['出典']).matchAll(/https?:\/\/\S+/g)) urls.add(m[0]);
    if (readSelect(p['ステータス']) !== '却下') titles.push(readText(p['タイトル']));
  }
  return { urls, titles };
}

// 新しい事件を「確認待ち」で追加する
export async function createDraft(incident, article, coords) {
  return notion.pages.create({
    parent: { type: 'data_source_id', data_source_id: NOTION_DATA_SOURCE_ID },
    properties: {
      'タイトル': { title: [{ text: { content: incident.title } }] },
      'ステータス': writeSelect('確認待ち'),
      '発生日': { date: /^\d{4}-\d{2}-\d{2}$/.test(incident.date) ? { start: incident.date } : null },
      '時期の表記': writeText(incident.date_label),
      '場所': writeText(incident.place),
      '位置の精度': writeSelect(LABELS.precision[incident.precision]),
      '緯度': { number: coords?.lat ?? null },
      '経度': { number: coords?.lng ?? null },
      '誰が': writeSelect(LABELS.actor[incident.actor]),
      'AI': writeText(incident.ai),
      '確度': writeSelect(LABELS.status[incident.status]),
      '要約': writeText(incident.summary),
      '出典URL': { url: article.link },
      '出典': writeText(`${article.source}: ${article.title} | ${article.link}`),
    },
  });
}

// 「公開」の事件を、アプリのJSONと同じ形で返す
export async function publishedIncidents() {
  const rows = await collectAllDataSourceRows(notion, {
    data_source_id: NOTION_DATA_SOURCE_ID,
    filter: { property: 'ステータス', select: { equals: '公開' } },
    sorts: [{ property: '発生日', direction: 'descending' }],
  });

  return rows.filter((row) => row.properties).map((row) => {
    const p = row.properties;
    // 出典は「タイトル | URL」が1行に1つ（タイトルに | が入っていてもいいように、最後の | で分ける）
    const sources = readText(p['出典']).split('\n')
      .map((line) => [line.slice(0, line.lastIndexOf(' | ')), line.slice(line.lastIndexOf(' | ') + 3)])
      .filter(([, url]) => /^https?:\/\//.test(url.trim()))
      .map(([title, url]) => ({ title: title.trim(), url: url.trim() }));
    if (sources.length === 0 && p['出典URL']?.url) sources.push({ title: '出典', url: p['出典URL'].url });

    return {
      id: row.id.replaceAll('-', ''),
      title: readText(p['タイトル']),
      date: p['発生日']?.date?.start ?? null,
      dateLabel: readText(p['時期の表記']),
      lat: p['緯度']?.number ?? null,
      lng: p['経度']?.number ?? null,
      place: readText(p['場所']),
      precision: FROM_LABEL.precision[readSelect(p['位置の精度'])] ?? 'region',
      actor: FROM_LABEL.actor[readSelect(p['誰が'])] ?? 'human',
      ai: readText(p['AI']),
      summary: readText(p['要約']),
      status: FROM_LABEL.status[readSelect(p['確度'])] ?? 'reported',
      sources,
    };
  });
}
