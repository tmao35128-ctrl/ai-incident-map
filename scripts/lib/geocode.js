// ===== 地名 → 緯度・経度（OpenStreetMapの無料の地名検索 Nominatim） =====
// 利用ルール：1秒に1回まで・アプリ名を名乗る（User-Agent）

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function geocode(query) {
  if (!query) return null;   // 地域しか分からない事件は、Notionで手で入れる

  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, format: 'json', limit: '1' })}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ai-incident-map/0.1 (personal project)', 'Accept-Language': 'en' },
  });
  await sleep(1100);   // 次の検索まで1秒以上あける

  if (!res.ok) {
    console.warn(`⚠ 地名検索に失敗（${res.status}）: ${query}`);
    return null;
  }
  const [hit] = await res.json();
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
}
