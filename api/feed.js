import { handleFeed } from '../server/feed.js';


export default async function handler(req, res) {
  try {
    const { status, body } = await handleFeed(req.method, req.query || {});
    // Cache each personalized URL at the edge for 30 minutes, serve stale while refreshing.
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.status(status).setHeader('Content-Type', 'application/json').send(body);
  } catch (err) {
    res.status(502).json({ error: 'feed_error', message: String(err?.message || err) });
  }
}
