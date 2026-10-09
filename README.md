# VitalSense

Scan a food or skincare label and see whether it suits your health profile. Check your skin with a selfie and get a simple routine.

Built with React, Vite, Tailwind, Framer Motion, Supabase (auth and data) and Gemini (image analysis).

## Run locally

Requires Node 18 or newer.

```bash
npm install
echo "GEMINI_API_KEY=your-key" > .env.local
npm run dev
```

Optional: set `GEMINI_MODEL` to pin a model. The default is `gemini-flash-latest`, which always points at Google's current Flash model.

## Deploy on Vercel

Add `GEMINI_API_KEY` under Project Settings, Environment Variables, then redeploy. The key is read at build time.

## What's in the app

| Area | What it does |
| --- | --- |
| Home | Greeting, scan shortcuts, recent scans, daily symptom check-in, best matches |
| Scanner | Product mode (rear camera) and Skin mode (front camera), upload from gallery, flash, tap to focus |
| Product result | Personal score, Nutri-Score, flagged ingredients, nutrition levels, diet fit, alternatives, save to favorites |
| Skin result | Skin type, five metrics, what we noticed, routine, ingredients to look for and skip |
| Library | All scans with filters (Food, Skincare, Skin checks, Saved) and sort by date or score |
| Explore | Short, plain-language reads ordered by your health focus |
| Profile | Health profile, symptoms, language (EN, ID, AR with RTL, FR, ZH), sign out |

## Data notes

- Product scans are stored in the Supabase `scans` table. Favorites and skin checks are stored on the device only (no photos are kept anywhere).
- The `profiles` table has no `language` column, so language is stored on the device. Add a `language text` column if you want it to follow the account.
- The Gemini key is used from the browser. For production, consider moving analysis into a Vercel serverless function so the key is not shipped to clients.

## QA

`qa/e2e.py` runs every flow in headless Chromium with a fake camera, mocked Supabase and mocked Gemini.

```bash
pip install playwright && python -m playwright install chromium
GEMINI_API_KEY=test-key npm run build
npx vite preview --port 4173 &
python3 qa/e2e.py   # screenshots in qa/out/
```
