# Scanything landing (www.scanything.online)

Marketing page that sends visitors to the app at https://app.scanything.online (and later the App Store and Google Play).

Next.js 16, static export friendly. Copy is in Indonesian and English (`src/components/sites/scanything/content.ts`), auto-picked from the browser language with a toggle in the header.

Layout rhythm and motion patterns were measured from a reference site at 375px (`docs/research/oyenza/page-brief.md`). All text, UI mockups and the logo are Scanything's own.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Deploy on Vercel

New project from this repo, Root Directory `landing`, framework Next.js. Add the domain `www.scanything.online`.

## Edit

- Copy and links: `src/components/sites/scanything/content.ts` (`APP_URL`)
- Sections: `Landing.tsx`; phone screens: `Phones.tsx`; styles and animations: `src/app/globals.css`
- When the store apps are live, turn the two "Coming soon" badges in the hero into links.
