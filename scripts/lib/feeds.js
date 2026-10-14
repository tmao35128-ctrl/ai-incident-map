// ===== RSSからAIに関係ありそうな新着記事を集める =====
import Parser from 'rss-parser';
import { FEEDS, LOOKBACK_HOURS, AI_KEYWORDS } from '../config.js';

const parser = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': 'ai-incident-map/0.1 (RSS reader)' },
});

export async function fetchRecentArticles() {
  const since = Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000;

  // 全部のRSSを同時に読みに行く。1つ失敗しても他は続ける（allSettled）
  const results = await Promise.allSettled(FEEDS.map((f) => parser.parseURL(f.url)));

  const articles = [];
  const seen = new Set();
  results.forEach((result, i) => {
    const source = FEEDS[i].name;
    if (result.status === 'rejected') {
      console.warn(`⚠ ${source} の読み込みに失敗: ${result.reason.message}`);
      return;
    }
    for (const item of result.value.items) {
      const published = new Date(item.isoDate ?? item.pubDate ?? 0).getTime();
      const text = (item.contentSnippet ?? item.content ?? '').slice(0, 6000);
      if (published < since) continue;                                   // 古い記事
      if (!AI_KEYWORDS.test(`${item.title} ${text}`)) continue;          // AIと関係なさそう
      if (seen.has(item.link)) continue;                                 // 同じ記事が2回
      seen.add(item.link);
      articles.push({ source, title: item.title, link: item.link, published: new Date(published).toISOString(), text });
    }
  });
  return articles;
}
