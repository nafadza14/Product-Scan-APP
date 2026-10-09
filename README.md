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
| Explore | 200+ live articles from public health RSS feeds (`/api/feed`), ranked for each person's condition, details, symptoms and skin goals, with the reason shown; plus quick guides |
| Profile | Health profile, symptoms, language (EN, ID, AR with RTL, FR, ZH), sign out |

## Supabase setup (once)

Open Supabase Dashboard, SQL Editor, paste `supabase/setup.sql` and run it. It creates `skin_checks`, `diary_logs`, `user_settings`, a private `skin-photos` storage bucket, adds `language` to `profiles` and `category` to `scans`, and sets Row Level Security so each person only sees their own rows.

Until it is run, the app still works, but the diary stays on the device (Profile shows Backup: This device only).

## Data notes

- Everything follows the account: profile, product scans, skin checks and their photos (private bucket), diary days, routine, goals and favorites. The device keeps a copy so the app opens instantly and works offline; changes sync in the background.
- Sessions persist in localStorage and refresh automatically. Each Vercel preview URL is a different site to the browser, so use the production domain to stay signed in.

## QA

`qa/e2e.py` runs every flow in headless Chromium with a fake camera, mocked Supabase (including the diary tables and storage), a mocked `/api/chat` and a fixture `/api/feed`. `node qa/fixtures/make-feed.mjs` tests RSS parsing and ranking and regenerates the fixture.

```bash
pip install playwright && python -m playwright install chromium
npm run build
npx vite preview --port 4173 &
python3 qa/e2e.py   # screenshots in qa/out/
```
