// The native app (Capacitor) runs on its own origin and calls the deployed API, so allow those origins only.
const ALLOWED = ['capacitor://localhost', 'ionic://localhost', 'http://localhost', 'https://localhost'];

/** Sets CORS headers for allowed origins. Returns true when the request was a preflight and is answered. */
export function applyCors(req, res) {
  const origin = req.headers?.origin;
  if (origin && ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}
