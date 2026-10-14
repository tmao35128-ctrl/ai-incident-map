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
];

// 何時間前までの記事を見るか（毎朝1回動かすので、少し重なるように26時間）
export const LOOKBACK_HOURS = 26;

// AIに関係ありそうな記事だけをClaudeに回す（全部回すとお金がかかるため）
export const AI_KEYWORDS =
  /\b(AI|LLMs?|GPT|ChatGPT|OpenAI|Anthropic|Claude|Gemini|Copilot|Mythos|agentic|artificial intelligence)\b|生成AI|AIエージェント|人工知能/i;

// 判定に使うClaudeのモデル。環境変数 CLAUDE_MODEL で差し替えられる
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-5-5';
