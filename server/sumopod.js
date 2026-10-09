// Shared by the Vercel function (api/chat.js) and the Vite dev server (vite.config.ts).
// The Sumopod key never reaches the browser: the client posts messages here and we add the key.

const BASE_URL = process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com/v1';
const DEFAULT_MODEL = 'gemini/gemini-3.1-flash-lite';

// Accept a few common spellings, and ignore stray spaces or quotes pasted into the dashboard.
const KEY_NAMES = ['SUMOPOD_API_KEY', 'VITE_SUMOPOD_API_KEY', 'SUMOPOD_KEY', 'SUMOPOD_APIKEY'];
const readKey = () => {
  for (const name of KEY_NAMES) {
    const v = (process.env[name] || '').trim().replace(/^['"]|['"]$/g, '');
    if (v) return v;
  }
  // Fallback: an older variable name, used only if it holds a Sumopod-style key (sk-...).
  const legacy = (process.env.API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return legacy.startsWith('sk-') ? legacy : '';
};

export const sumopodConfigured = () => !!readKey();

/** Returns { status, body } where body is a JSON string. */
export async function handleChat(method, payload) {
  if (method === 'GET') {
    // Diagnostics only: names of related variables (never their values) and which Vercel environment this is.
    const seen = Object.keys(process.env).filter((k) => /sumo|api_key|apikey/i.test(k) && !/^npm_/i.test(k));
    return {
      status: 200,
      body: JSON.stringify({
        configured: sumopodConfigured(),
        model: process.env.SUMOPOD_MODEL || DEFAULT_MODEL,
        environment: process.env.VERCEL_ENV || 'local',
        deployment: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || null,
        variablesSeen: seen
      })
    };
  }
  if (method !== 'POST') return { status: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };

  const key = readKey();
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
