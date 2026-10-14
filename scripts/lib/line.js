// ===== LINEに通知する（Novaのボットを再利用） =====
// LINE_USER_ID があればその人だけに送る（push）。なければ友だち全員に送る（broadcast）

export async function notifyLine(text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.log('（LINEの鍵が未設定なので通知はスキップ）');
    return;
  }
  const to = process.env.LINE_USER_ID;
  const res = await fetch(`https://api.line.me/v2/bot/message/${to ? 'push' : 'broadcast'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...(to && { to }), messages: [{ type: 'text', text: text.slice(0, 4900) }] }),
  });
  if (!res.ok) console.error(`⚠ LINE通知に失敗（${res.status}）: ${await res.text()}`);
}
