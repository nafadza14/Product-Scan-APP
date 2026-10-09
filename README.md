# VitalSense

Scan a food or skincare label and see whether it suits your health profile. Check your skin with a selfie and get a simple routine.

Built with React, Vite, Tailwind, Framer Motion, Supabase (auth and data) and Sumopod (image analysis with `gemini/gemini-3.1-flash-lite`).

## Run locally

Requires Node 18 or newer.

```bash
npm install
echo "SUMOPOD_API_KEY=your-key" > .env.local
npm run dev
```

Optional: `SUMOPOD_MODEL` overrides the model (default `gemini/gemini-3.1-flash-lite`), `SUMOPOD_BASE_URL` overrides the API base (default `https://ai.sumopod.com/v1`).

The browser never sees the key. It posts to `/api/chat`; `api/chat.js` (Vercel) and the Vite dev server both forward that to Sumopod with the key added on the server.

## Deploy on Vercel

Add `SUMOPOD_API_KEY` under Project Settings, Environment Variables, then redeploy. The key is only read by the `/api/chat` function.

## What's in the app

| Area | What it does |
| --- | --- |
| Home | Greeting, scan shortcuts, recent scans, daily symptom check-in, best matches |
| Scanner | Product mode (rear camera) and Skin mode (front camera), upload from gallery, flash, tap to focus |
| Product result | Personal score, Nutri-Score, flagged ingredients, nutrition levels, diet fit, alternatives, save to favorites |
| Skin result | Skin score with change since last check, photo quality and confidence, top priority, six-zone face map, nine concern levels, AM/PM routine with key ingredients, use as my routine |
| Diary | Skin journal: today's check, AM/PM routine checklist, mood, sleep, water, stress, tags and notes; history timeline with photo compare; trends and patterns between diary entries and skin score; skin goals; product scan history |
| Explore | Short, plain-language reads ordered by your health focus |
| Profile | Health profile, symptoms, language (EN, ID, AR with RTL, FR, ZH), sign out |

## Data notes

- Product scans are stored in the Supabase `scans` table.
- The skin diary (skin checks, small photo thumbnails, daily logs, routine, goals) is stored on the device only: localStorage plus IndexedDB for photos. Nothing from the diary is uploaded except the photo sent for analysis.
- The `profiles` table has no `language` column, so language is stored on the device. Add a `language text` column if you want it to follow the account.

## QA

`qa/e2e.py` runs every flow in headless Chromium with a fake camera, mocked Supabase and a mocked `/api/chat`.

```bash
pip install playwright && python -m playwright install chromium
npm run build
npx vite preview --port 4173 &
python3 qa/e2e.py   # screenshots in qa/out/
```
