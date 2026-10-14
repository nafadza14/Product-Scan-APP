import { handleChat } from '../server/sumopod.js';
import { applyCors } from '../server/cors.js';


export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  try {
    let payload = req.body;
    if (typeof payload === 'string') payload = JSON.parse(payload || '{}');
    const { status, body } = await handleChat(req.method, payload || {});
    res.status(status).setHeader('Content-Type', 'application/json').send(body);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', message: String(err?.message || err) });
  }
}
