// ===== 設定 =====
const COLORS = { ai: '#e86c3e', human: '#f5f5f5' };
const ACTOR_LABEL = { ai: 'AIが自分で', human: '人間が悪用' };
const STATUS_LABEL = { confirmed: '確認済み', reported: '報道のみ', disputed: '当事者が否定' };
const PRECISION_LABEL = { city: '都市', country: '国（位置は目安）', region: '地域（位置は目安）' };
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// ===== 状態（今アプリがどうなっているか） =====
let incidents = [];
let year = '';           // 選んでいる年（'2026' など）
let month = 'all';       // 選んでいる月（'all' か '01'〜'12'）
let selectedId = null;

// ===== 地球儀をつくる =====
const globe = new Globe(document.getElementById('globe'))
  .backgroundColor('#0b0b0c')
  .showAtmosphere(true)
  .atmosphereColor('#3a3a40')
  .atmosphereAltitude(0.18)
  // 陸地を点の集まりで描く
  .hexPolygonResolution(3)
  .hexPolygonMargin(0.45)
  .hexPolygonUseDots(true)
  .hexPolygonColor(() => '#45454c')
  // 事件の点
  .pointLat('lat')
  .pointLng('lng')
  .pointColor((d) => COLORS[d.actor])
  .pointAltitude((d) => (d.id === selectedId ? 0.08 : 0.02))
  .pointRadius(0.45)
  .pointLabel((d) => d.title)
  .onPointClick((d) => select(d.id))
  // 事件の波紋
  .ringLat('lat')
  .ringLng('lng')
  .ringColor((d) => (t) => hexToRgba(COLORS[d.actor], 1 - t))
  .ringMaxRadius(4)
  .ringPropagationSpeed(2)
  .ringRepeatPeriod(1400);

globe.globeMaterial().color.set('#121214');
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.35;
globe.pointOfView({ lat: 20, lng: 140, altitude: 2.4 });

// パネルに隠れない場所に地球儀を置く
//   パソコン：右のパネルの分だけ幅を減らす
//   スマホ　：パネルが下にあるので高さを6割にして上に置く
function fitGlobe() {
  const isWide = window.innerWidth > 720;
  globe
    .width(isWide ? window.innerWidth - 380 : window.innerWidth)
    .height(isWide ? window.innerHeight : Math.round(window.innerHeight * 0.6));
}
fitGlobe();
window.addEventListener('resize', fitGlobe);

// ===== データを読み込んで開始 =====
init();

async function init() {
  const [data, countries] = await Promise.all([
    fetch('data/incidents.json').then((r) => r.json()),
    fetch('https://unpkg.com/globe.gl@2.46.2/example/datasets/ne_110m_admin_0_countries.geojson').then((r) => r.json()),
  ]);

  globe.hexPolygonsData(countries.features);

  // date '2026-07-11' から年 '2026' と月 '07' を切り出しておく
  incidents = data.incidents
    .map((d) => ({ ...d, year: d.date.slice(0, 4), month: d.date.slice(5, 7) }))
    .sort((a, b) => b.date.localeCompare(a.date));   // 新しい順

  buildYearSelect();
  buildList();
  render();
}

// ===== 年のドロップダウンをつくる（「すべての期間」＋データにある年を新しい順） =====
function buildYearSelect() {
  const years = [...new Set(incidents.map((d) => d.year))].sort().reverse();
  year = 'all';   // 最初は全部見せる

  const select = document.getElementById('year');
  for (const y of ['all', ...years]) {
    const option = el('option', '', y === 'all' ? 'すべての期間' : `${y}年`);
    option.value = y;
    select.append(option);
  }
  select.value = year;
  select.addEventListener('change', () => {
    year = select.value;
    month = 'all';   // 年を変えたら月は「全月」に戻す
    render();
  });
}

// ===== 画面を今の状態に合わせて描き直す =====
function render() {
  const inYear = year === 'all' ? incidents : incidents.filter((d) => d.year === year);
  const visible = inYear.filter((d) => month === 'all' || d.month === month);

  // 選んでいた事件が期間から外れたら、詳細を閉じる
  if (selectedId && !visible.some((d) => d.id === selectedId)) closeDetail();

  globe.pointsData(visible);
  // 選んでいる事件があればそれだけ、なければ表示中の全部を光らせる
  globe.ringsData(selectedId ? visible.filter((d) => d.id === selectedId) : visible);

  // 「すべての期間」のときは月を選ぶ意味がないので、月のボタンを隠す
  document.getElementById('months').hidden = year === 'all';
  renderMonths(inYear);

  const label = year === 'all' ? 'すべての期間' : month === 'all' ? `${year}年` : `${year}年${Number(month)}月`;
  document.getElementById('count').textContent = `${label}の事件 ${visible.length}件`;

  for (const li of document.querySelectorAll('.item')) {
    li.classList.toggle('is-hidden', !visible.some((d) => d.id === li.dataset.id));
    li.classList.toggle('is-selected', li.dataset.id === selectedId);
  }
}

// ===== 月のボタンを描き直す（件数つき・事件のない月は押せない） =====
function renderMonths(inYear) {
  const box = document.getElementById('months');
  box.replaceChildren();

  for (const m of ['all', ...MONTHS]) {
    const n = inYear.filter((d) => m === 'all' || d.month === m).length;
    const button = el('button', 'month');
    button.type = 'button';
    button.disabled = n === 0;
    button.setAttribute('aria-pressed', String(m === month));
    button.append(
      el('span', '', m === 'all' ? '全月' : `${Number(m)}月`),
      el('small', '', n > 0 ? `${n}件` : '–'),
    );
    button.addEventListener('click', () => {
      month = m;
      render();
    });
    box.append(button);
  }
}

// ===== 右の一覧をつくる（最初に1回だけ。表示/非表示は render が切り替える） =====
function buildList() {
  const list = document.getElementById('list');
  for (const d of incidents) {
    const li = el('li', 'item');
    li.dataset.id = d.id;
    li.append(
      el('span', `dot dot-${d.actor}`),
      el('span', 'item-title', d.title),
      el('span', 'item-meta', `${d.dateLabel}・${ACTOR_LABEL[d.actor]}`),
    );
    li.addEventListener('click', () => select(d.id));
    list.append(li);
  }
}

// ===== 事件を選んだとき =====
function select(id) {
  selectedId = id;
  const d = incidents.find((x) => x.id === id);
  globe.controls().autoRotate = false;
  globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.6 }, 1000);
  showDetail(d);
  render();
}

function closeDetail() {
  selectedId = null;
  document.getElementById('detail').hidden = true;
  globe.controls().autoRotate = true;
}

function showDetail(d) {
  const box = document.getElementById('detail');
  box.replaceChildren();   // 中身を空にする

  const close = el('button', 'close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', '閉じる');
  close.addEventListener('click', () => {
    closeDetail();
    render();
  });

  const badge = el('span', `badge badge-${d.status}`, STATUS_LABEL[d.status]);

  const dl = document.createElement('dl');
  addRow(dl, '時期', d.dateLabel);
  addRow(dl, '場所', `${d.place}［${PRECISION_LABEL[d.precision]}］`);
  addRow(dl, '誰が', d.actor === 'ai' ? 'AIが自分で（テスト中など）' : '人間がAIを悪用');
  addRow(dl, 'AI', d.ai);

  const sources = el('ol', 'sources');
  for (const s of d.sources) {
    const a = el('a', '', s.title);
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    const li = document.createElement('li');
    li.append(a);
    sources.append(li);
  }

  box.append(close, el('h2', '', d.title), badge, dl, el('p', '', d.summary), el('div', 'item-meta', '出典'), sources);
  box.hidden = false;
  box.scrollIntoView({ block: 'nearest' });
}

// ===== 小さな道具 =====
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function addRow(dl, label, value) {
  dl.append(el('dt', '', label), el('dd', '', value));
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
