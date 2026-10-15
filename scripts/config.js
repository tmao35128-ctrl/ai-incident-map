// ===== 収集の設定（ここを書き換えれば動きが変わる） =====

// Notionの「AI事件」データベース（MY WORK SPACE の中）
export const NOTION_DATA_SOURCE_ID = '80ab0756-a8fa-4c03-96bf-2527eff5f444';
export const NOTION_DATABASE_URL = 'https://www.notion.so/0813bfe4881e4e11a62b6786092c350c';

// 読みに行くニュースのRSS
// ※ BleepingComputer と SecurityWeek は自動取得を拒否している（403）ので入れていない
export const FEEDS = [
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { name: 'Help Net Security', url: 'https://www.helpnetsecurity.com/feed/' },
  { name: 'The Record', url: 'https://therecord.media/feed/' },
  { name: 'The Register', url: 'https://www.theregister.com/security/headlines.atom' },
  { name: 'Security NEXT', url: 'https://www.security-next.com/feed' },
  { name: 'Security Affairs', url: 'https://securityaffairs.com/feed' },
  { name: 'SOCRadar', url: 'https://socradar.io/blog/feed/' },
  // --- 国内（日本の事件は海外メディアにほぼ載らないため） ---
  { name: 'NHK 社会', url: 'https://www.nhk.or.jp/rss/news/cat1.xml' },
  { name: 'NHK 科学・文化', url: 'https://www.nhk.or.jp/rss/news/cat3.xml' },
  { name: 'piyolog', url: 'https://piyolog.hatenadiary.jp/rss' },
  { name: 'ScanNetSecurity', url: 'https://scan.netsecurity.ne.jp/rss/index.rdf' },
  { name: 'ITmedia セキュリティ', url: 'https://rss.itmedia.co.jp/rss/2.0/news_security.xml' },
  { name: '@IT セキュリティ', url: 'https://rss.itmedia.co.jp/rss/2.0/ait_security.xml' },
  { name: 'Scutum WAF Tech Blog', url: 'https://www.scutum.jp/information/waf_tech_blog/atom.xml' },
  { name: 'JPCERT/CC', url: 'https://www.jpcert.or.jp/rss/jpcert-all.rdf' },
];

// 何時間前までの記事を見るか（毎朝1回動かすので、少し重なるように26時間）
export const LOOKBACK_HOURS = 26;

// AIに関係ありそうな記事だけをClaudeに回す（全部回すとお金がかかるため）
// ※ NHKなどは「ＡＩ」を全角で書くので、全角も拾う
export const AI_KEYWORDS =
  /\b(AI|LLMs?|GPT|ChatGPT|OpenAI|Anthropic|Claude|Gemini|Copilot|Mythos|agentic|artificial intelligence)\b|ＡＩ|ＧＰＴ|生成AI|AIエージェント|人工知能|オープンAI|アンソロピック/i;

// 判定に使うClaudeのモデル。環境変数 CLAUDE_MODEL で差し替えられる
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-5-5';
