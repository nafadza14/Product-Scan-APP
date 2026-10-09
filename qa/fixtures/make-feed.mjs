// Builds synthetic RSS for every configured feed, runs the real parser and ranking,
// and checks that results are personalized. Writes the JSON the e2e test serves.
import { writeFileSync } from 'node:fs';
import { FEEDS, parseFeed, buildFeed } from '../../server/feed.js';

const TITLES = {
  skin: ['New mineral sunscreen leaves no white cast', 'Ceramides help repair a damaged skin barrier', 'Why acne flares under stress', 'Retinol and collagen: what the evidence says', 'Rosacea triggers mapped in a large study', 'Hyperpigmentation responds to azelaic acid'],
  nutrition: ['Ultra-processed food and gut health', 'Plant-based protein matches whey for muscle', 'Low sodium diets and blood pressure', 'Fiber at breakfast steadies glucose', 'Keto diet and cholesterol in adults', 'Vitamin D from food versus supplements'],
  pregnancy: ['Folate early in pregnancy lowers risk', 'Gestational diabetes screening improves outcomes', 'Sleep position in the third trimester', 'Morning sickness relief that works', 'Prenatal vitamins: which ones matter', 'Preeclampsia warning signs to know'],
  allergies: ['Peanut allergy oral immunotherapy results', 'Shellfish allergy in adults is rising', 'Cross-contact on food labels explained', 'Eczema and food allergy in children', 'Hives after exercise: a rare allergy', 'Tree nut allergy and almond milk'],
  autoimmune: ['Gluten-free diet and celiac remission', 'Lupus flares linked to sunlight', 'Rheumatoid arthritis and joint pain diet', 'Hashimoto thyroid and selenium', 'Inflammation markers fall with exercise', 'Psoriasis biologics and skin clearance'],
  cancer: ['Chemotherapy nausea eased by ginger', 'Mouth sores during radiation therapy', 'Food safety for people with low immunity', 'Breast cancer survivors and exercise', 'Cancer fatigue and sleep quality', 'Taste changes during chemo'],
  bloodSugar: ['Walking after meals lowers blood sugar', 'Insulin resistance and sleep'],
  sleep: ['Short sleep and skin aging', 'Circadian rhythm and appetite'],
  stress: ['Cortisol and breakouts', 'Mindfulness lowers stress markers'],
  fitness: ['Strength training at any age', 'Ten minute workouts add up'],
  wellness: ['Hydration myths and facts', 'Screen time and headaches', 'Fatigue: when to see a doctor', 'Heartburn foods to limit'],
  labels: ['FDA warns about mislabeled supplements', 'Cosmetic ingredient recall notice', 'Reading allergen statements on labels'],
  weight: ['GLP-1 drugs and appetite', 'Weight loss plateaus explained'],
  women: ['Hormones and skin across the cycle'],
  joints: ['Joint pain and omega-3'],
  gluten: ['Hidden gluten in sauces'],
  aging: ['Collagen supplements reviewed']
};

const now = Date.now();
let n = 0;
const rss = (feed) => {
  const titles = feed.topics.flatMap((t) => TITLES[t] || []);
  const items = [];
  for (let i = 0; i < 12; i++) {
    n++;
    const t = `${titles[i % titles.length]}, report ${n}`;
    items.push(`<item><title><![CDATA[${t}]]></title><link>https://example.org/${encodeURIComponent(feed.source)}/${n}</link><description>&lt;p&gt;${t}. Researchers report new findings &amp;amp; practical advice.&lt;/p&gt;</description><pubDate>${new Date(now - (i * 13 + n) * 3600000).toUTCString()}</pubDate></item>`);
  }
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>${feed.source}</title>${items.join('')}</channel></rss>`;
};

const fetcher = async (feed) => parseFeed(rss(feed), feed);
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } else console.log('ok  ', m); };

const preg = await buildFeed({ condition: 'Pregnancy', details: 'Gestational Diabetes|2nd Trimester', symptoms: 'Nausea', goals: 'evenTone', lang: 'en', limit: '400' }, fetcher);
assert(preg.total >= 200, `aggregated ${preg.total} unique articles (need 200+)`);
const top10 = preg.items.slice(0, 10).map((i) => i.title);
assert(top10.filter((t) => /pregnan|gestational|trimester|morning sickness|prenatal|folate|preeclampsia|blood sugar|glucose|insulin/i.test(t)).length >= 7, 'pregnancy profile: top 10 mostly pregnancy or blood sugar');
assert(preg.items[0].reason, `top item has a reason: "${preg.items[0].reason}"`);

const allergy = await buildFeed({ condition: 'Allergies', details: 'Peanuts|Shellfish', lang: 'en' }, fetcher);
const atop = allergy.items.slice(0, 10).map((i) => i.title);
assert(atop.filter((t) => /allerg|peanut|shellfish|eczema|hives|nut|cross-contact|allergen/i.test(t)).length >= 7, 'allergy profile: top 10 mostly allergy');
assert(atop[0] !== top10[0], 'different profiles get different top stories');

const cancer = await buildFeed({ condition: 'Cancer Care', details: 'Chemotherapy|Mouth Sores', symptoms: 'Fatigue', lang: 'en' }, fetcher);
assert(cancer.items.slice(0, 6).every((i) => /chemo|mouth|radiation|cancer|fatigue|immunity|taste/i.test(i.title)), 'cancer profile: top 6 all relevant');

const parsed = parseFeed('<rss><channel><item><title>A &amp; B — test</title><link>https://x.org/1</link><description><![CDATA[<p>Hi <b>there</b></p><img src="https://x.org/i.jpg">]]></description></item></channel></rss>', FEEDS[0]);
assert(parsed[0].title === 'A & B, test' && parsed[0].summary === 'Hi there' && parsed[0].image === 'https://x.org/i.jpg', 'parser: entities, CDATA, html, image, dashes');
const atom = parseFeed('<feed><entry><title>Atom item</title><link href="https://x.org/a"/><summary>Sum</summary><updated>2026-10-01T00:00:00Z</updated></entry></feed>', FEEDS[0]);
assert(atom[0].link === 'https://x.org/a' && atom[0].date > 0, 'parser: Atom entries');

writeFileSync(new URL('./feed-pregnancy.json', import.meta.url), JSON.stringify(preg));
console.log('wrote feed-pregnancy.json with', preg.items.length, 'items');
