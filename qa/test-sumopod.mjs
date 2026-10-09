// Quick check that the Sumopod key and model work with a photo.
// Usage (from the project folder):  node qa/test-sumopod.mjs
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const key = process.env.SUMOPOD_API_KEY || env.SUMOPOD_API_KEY;
const model = process.env.SUMOPOD_MODEL || env.SUMOPOD_MODEL || 'MiniMax-M3.1-Flash-Preview';
if (!key) { console.error('SUMOPOD_API_KEY not found in .env.local'); process.exit(1); }

const image = readFileSync('qa/assets/label.png').toString('base64');
console.log(`Testing ${model} with a label photo...`);
const t0 = Date.now();
const res = await fetch('https://ai.sumopod.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model,
    max_tokens: 300,
    messages: [{ role: 'user', content: [
      { type: 'text', text: 'What product is in this photo? List its first three ingredients. Reply in one short sentence.' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${image}` } }
    ] }]
  })
});
const body = await res.text();
console.log(`HTTP ${res.status} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
try {
  const j = JSON.parse(body);
  if (j.choices) console.log('Answer:', j.choices[0].message.content);
  else console.log(JSON.stringify(j, null, 2));
} catch { console.log(body.slice(0, 800)); }
if (res.ok) console.log('\nOK: if the answer mentions granola and oats, the model can read photos.');
