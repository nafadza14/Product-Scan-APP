// Shared by the Vercel function (api/chat.js) and the Vite dev server (vite.config.ts).
// The Sumopod key never reaches the browser: the client posts messages here and we add the key.

const BASE_URL = process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com/v1';
const DEFAULT_MODEL = 'MiniMax-M3.1-Flash-Preview';

export const sumopodConfigured = () => !!process.env.SUMOPOD_API_KEY;

/** Returns { status, body } where body is a JSON string. */
export async function handleChat(method, payload) {
  if (method === 'GET') {
    return { status: 200, body: JSON.stringify({ configured: sumopodConfigured(), model: process.env.SUMOPOD_MODEL || DEFAULT_MODEL }) };
  }
  if (method !== 'POST') return { status: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };

  const key = process.env.SUMOPOD_API_KEY;
  if (!key) return { status: 500, body: JSON.stringify({ error: 'missing_key', message: 'SUMOPOD_API_KEY is not set on the server.' }) };

  const messages = Array.isArray(payload?.messages) ? payload.messages : null;
  if (!messages || messages.length === 0 || messages.length > 4) {
    return { status: 400, body: JSON.stringify({ error: 'bad_request' }) };
  }

  const upstream = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      // The model is fixed on the server so the endpoint can't be used for other models.
      model: process.env.SUMOPOD_MODEL || DEFAULT_MODEL,
      messages,
      temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.2,
      max_tokens: Math.min(Number(payload.max_tokens) || 2500, 4000)
    })
  });
  return { status: upstream.status, body: await upstream.text() };
}
