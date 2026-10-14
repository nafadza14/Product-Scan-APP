# Scanything landing (www.scanything.online)

Marketing page that sends visitors to the app at https://app.scanything.online (and later the App Store and Google Play).

Next.js 16, static export friendly. Copy is in Indonesian and English (`src/components/sites/scanything/content.ts`), auto-picked from the browser language with a toggle in the header.

Section rhythm at 375px follows a reference site (`docs/research/oyenza/page-brief.md`); visuals, type, colours and motion come from the Scanything app itself.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Deploy on Vercel

New project from this repo, Root Directory `landing`, framework Next.js. Add the domain `www.scanything.online`.

## App recordings

The phone screens are real recordings of the app (`public/sites/scanything/media/{id,en}`), made with demo data:

```bash
# from the repo root, with the app built and served on :4173 (npm run build && npx vite preview --port 4173)
python3 qa/landing/make_assets.py   # demo selfie and meal images (once)
python3 qa/landing/capture.py       # writes qa/landing/out/{id,en}/*.mp4|webm|jpg
```

Copy the new files into `landing/public/sites/scanything/media/` after the app UI changes. Motion values (iOS ease, rise and stagger, springs) are shared with the app in `src/components/sites/scanything/motion.ts`.

## Edit

- Copy and links: `src/components/sites/scanything/content.ts` (`APP_URL`)
- Sections: `Landing.tsx`; phone screens: `Phones.tsx`; styles and animations: `src/app/globals.css`
- When the store apps are live, turn the two "Coming soon" badges in the hero into links.
