// Live health reading list from public RSS feeds, ranked for one person.
// Shared by the Vercel function (api/feed.js) and the Vite dev server.

const SD = (topic) => `https://www.sciencedaily.com/rss/health_medicine/${topic}.xml`;

/**
 * Each feed carries the topics it is mostly about. Topics line up with the
 * personalization keys below, so a feed about pregnancy ranks higher for
 * someone in the pregnancy profile even when a headline is vague.
 */
export const FEEDS = [
  { url: SD('skin_care'), source: 'ScienceDaily', topics: ['skin'], category: 'Skin' },
  { url: SD('eczema'), source: 'ScienceDaily', topics: ['skin', 'allergies', 'autoimmune'], category: 'Skin' },
  { url: SD('psoriasis'), source: 'ScienceDaily', topics: ['skin', 'autoimmune'], category: 'Skin' },
  { url: SD('nutrition'), source: 'ScienceDaily', topics: ['nutrition'], category: 'Nutrition' },
  { url: SD('diet_and_weight_loss'), source: 'ScienceDaily', topics: ['nutrition', 'weight'], category: 'Nutrition' },
  { url: SD('pregnancy_and_childbirth'), source: 'ScienceDaily', topics: ['pregnancy'], category: 'Pregnancy' },
  { url: SD('fertility'), source: 'ScienceDaily', topics: ['pregnancy'], category: 'Pregnancy' },
  { url: SD('womens_health'), source: 'ScienceDaily', topics: ['pregnancy', 'women'], category: 'Wellness' },
  { url: SD('allergy'), source: 'ScienceDaily', topics: ['allergies'], category: 'Allergies' },
  { url: SD('food_allergies'), source: 'ScienceDaily', topics: ['allergies', 'nutrition'], category: 'Allergies' },
  { url: SD('immune_system'), source: 'ScienceDaily', topics: ['autoimmune'], category: 'Immunity' },
  { url: SD('lupus'), source: 'ScienceDaily', topics: ['autoimmune'], category: 'Immunity' },
  { url: SD('rheumatoid_arthritis'), source: 'ScienceDaily', topics: ['autoimmune', 'joints'], category: 'Immunity' },
  { url: SD('celiac_disease'), source: 'ScienceDaily', topics: ['autoimmune', 'gluten', 'nutrition'], category: 'Immunity' },
  { url: SD('cancer'), source: 'ScienceDaily', topics: ['cancer'], category: 'Cancer care' },
  { url: SD('breast_cancer'), source: 'ScienceDaily', topics: ['cancer', 'women'], category: 'Cancer care' },
  { url: SD('diabetes'), source: 'ScienceDaily', topics: ['bloodSugar', 'nutrition'], category: 'Nutrition' },
  { url: SD('sleep_disorders'), source: 'ScienceDaily', topics: ['sleep', 'wellness'], category: 'Wellness' },
  { url: SD('stress'), source: 'ScienceDaily', topics: ['stress', 'wellness'], category: 'Wellness' },
  { url: SD('fitness'), source: 'ScienceDaily', topics: ['fitness', 'wellness'], category: 'Wellness' },
  { url: SD('healthy_aging'), source: 'ScienceDaily', topics: ['aging', 'skin', 'wellness'], category: 'Wellness' },
  { url: 'https://newsinhealth.nih.gov/rss', source: 'NIH News in Health', topics: ['wellness'], category: 'Wellness' },
  { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/consumer-updates/rss.xml', source: 'FDA Consumer Updates', topics: ['labels', 'wellness'], category: 'Labels' },
  { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/food-allergies/rss.xml', source: 'FDA', topics: ['allergies', 'labels'], category: 'Allergies' },
  { url: 'https://www.health.harvard.edu/blog/feed', source: 'Harvard Health', topics: ['wellness', 'nutrition'], category: 'Wellness' },
  { url: 'https://health.detik.com/rss', source: 'detikHealth', topics: ['wellness'], category: 'Wellness', lang: 'id' }
];

// Words that tie an article to a profile choice. Lowercase, matched on word starts.
const KEYWORDS = {
  // conditions
  pregnancy: ['pregnan', 'prenatal', 'fetal', 'fetus', 'trimester', 'gestation', 'maternal', 'birth', 'breastfeed', 'newborn', 'kehamilan', 'hamil', 'ibu hamil', 'janin', 'menyusui'],
  cancer: ['cancer', 'tumor', 'tumour', 'chemo', 'radiotherapy', 'radiation therapy', 'oncolog', 'carcinogen', 'kanker', 'kemoterapi'],
  autoimmune: ['autoimmun', 'lupus', 'rheumatoid', 'celiac', 'coeliac', 'hashimoto', 'thyroid', 'psoriasis', 'multiple sclerosis', 'inflammat', 'immune', 'autoimun', 'imun'],
  allergies: ['allerg', 'anaphyla', 'peanut', 'tree nut', 'shellfish', 'histamine', 'hives', 'eczema', 'intoleran', 'alergi'],
  general: ['diet', 'nutrition', 'exercise', 'sleep', 'healthy', 'vitamin', 'wellbeing', 'well-being', 'gizi', 'sehat'],
  // details
  gestationalDiabetes: ['gestational diabetes', 'blood sugar', 'glucose', 'insulin', 'diabetes', 'gula darah'],
  highBp: ['blood pressure', 'hypertension', 'preeclampsia', 'pre-eclampsia', 'sodium', 'salt', 'darah tinggi'],
  trimester1: ['first trimester', 'early pregnancy', 'morning sickness', 'folic', 'folate'],
  trimester3: ['third trimester', 'labor', 'labour', 'preterm', 'delivery'],
  peanuts: ['peanut'],
  treeNuts: ['tree nut', 'almond', 'cashew', 'walnut', 'hazelnut'],
  dairy: ['dairy', 'milk', 'lactose', 'cheese', 'susu'],
  eggs: ['egg'],
  gluten: ['gluten', 'wheat', 'celiac', 'coeliac'],
  soy: ['soy', 'kedelai'],
  shellfish: ['shellfish', 'shrimp', 'crustacean', 'seafood'],
  celiac: ['celiac', 'coeliac', 'gluten'],
  hashimoto: ['hashimoto', 'thyroid'],
  ra: ['rheumatoid', 'arthritis', 'joint'],
  lupus: ['lupus'],
  aip: ['inflammat', 'anti-inflammatory', 'gut'],
  chemo: ['chemo', 'chemotherapy'],
  radiation: ['radiation', 'radiotherapy'],
  neutropenic: ['infection', 'food safety', 'immune'],
  mouthSores: ['mouth', 'oral', 'mucositis'],
  weightLoss: ['weight loss', 'obesity', 'calorie', 'appetite', 'glp-1', 'fasting'],
  muscleGain: ['muscle', 'protein', 'strength', 'resistance training'],
  vegan: ['vegan', 'plant-based', 'plant based', 'vegetarian'],
  keto: ['keto', 'low-carb', 'low carb', 'carbohydrate'],
  lowSodium: ['sodium', 'salt', 'blood pressure'],
  acne: ['acne', 'pimple', 'breakout', 'sebum', 'jerawat'],
  // symptoms
  nausea: ['nausea', 'vomit', 'morning sickness', 'mual'],
  fatigue: ['fatigue', 'tired', 'energy', 'lelah'],
  heartburn: ['heartburn', 'reflux', 'gerd', 'acid'],
  headache: ['headache', 'migraine', 'sakit kepala'],
  bloating: ['bloat', 'gut', 'digest', 'microbiome', 'kembung'],
  skinRash: ['rash', 'eczema', 'dermatitis', 'hives', 'itch', 'ruam'],
  jointPain: ['joint', 'arthritis', 'pain', 'nyeri sendi'],
  dizziness: ['dizz', 'vertigo', 'blood pressure', 'pusing'],
  // skin goals
  clearBreakouts: ['acne', 'pimple', 'breakout', 'pore', 'sebum'],
  evenTone: ['pigment', 'melasma', 'dark spot', 'hyperpigment', 'sunscreen', 'uv'],
  hydration: ['hydrat', 'moistur', 'skin barrier', 'dry skin', 'ceramide'],
  calmRedness: ['rosacea', 'redness', 'sensitive skin', 'inflammat', 'eczema'],
  smoothTexture: ['exfoliat', 'retinoid', 'retinol', 'texture', 'collagen'],
  firmness: ['collagen', 'wrinkle', 'aging', 'ageing', 'elastic'],
  minimizePores: ['pore', 'sebum', 'oily skin', 'niacinamide'],
  // feed-level topics
  skin: ['skin', 'derma', 'sunscreen', 'uv', 'cosmetic', 'kulit'],
  nutrition: ['diet', 'food', 'nutri', 'eating', 'meal', 'makanan'],
  labels: ['label', 'ingredient', 'additive', 'recall', 'cosmetic', 'supplement'],
  sleep: ['sleep', 'insomnia', 'circadian', 'tidur'],
  stress: ['stress', 'anxiety', 'cortisol', 'mental health'],
  wellness: []
};

const CONDITION_TOPIC = {
  Pregnancy: 'pregnancy',
  'Cancer Care': 'cancer',
  Autoimmune: 'autoimmune',
  Allergies: 'allergies',
  'General Health': 'general',
  'More Diseases': 'general',
  None: 'general'
};

const DETAIL_KEY = {
  'Gestational Diabetes': 'gestationalDiabetes',
  'High BP': 'highBp',
  '1st Trimester': 'trimester1',
  '3rd Trimester': 'trimester3',
  Peanuts: 'peanuts',
  'Tree Nuts': 'treeNuts',
  Dairy: 'dairy',
  Eggs: 'eggs',
  Gluten: 'gluten',
  Soy: 'soy',
  Shellfish: 'shellfish',
  'Celiac Disease': 'celiac',
  "Hashimoto's": 'hashimoto',
  'Rheumatoid Arthritis': 'ra',
  Lupus: 'lupus',
  'AIP Diet': 'aip',
  Chemotherapy: 'chemo',
  Radiation: 'radiation',
  Neutropenic: 'neutropenic',
  'Mouth Sores': 'mouthSores',
  'Weight Loss': 'weightLoss',
  'Muscle Gain': 'muscleGain',
  Vegan: 'vegan',
  Keto: 'keto',
  'Low Sodium': 'lowSodium',
  'Acne-Prone Skin': 'acne',
  Nausea: 'nausea',
  Fatigue: 'fatigue',
  Heartburn: 'heartburn',
  Headache: 'headache',
  Bloating: 'bloating',
  'Skin Rash': 'skinRash',
  'Joint Pain': 'jointPain',
  Dizziness: 'dizziness'
};

// ---------- RSS parsing (no dependencies) ----------

const decode = (s = '') =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const stripHtml = (s = '') => decode(decode(s).replace(/<[^>]+>/g, ' ')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
};
const attr = (block, name, a) => {
  const m = block.match(new RegExp(`<${name}\\s[^>]*${a}=["']([^"']+)["'][^>]*>`, 'i'));
  return m ? decode(m[1]) : '';
};
const noDashes = (s) => s.replace(/\s*[—–]\s*/g, ', ');

export const parseFeed = (xml, feed) => {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks
    .map((b) => {
      const title = noDashes(stripHtml(tag(b, 'title')));
      const link = stripHtml(tag(b, 'link')) || attr(b, 'link', 'href');
      const rawDesc = tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded') || tag(b, 'content');
      const summary = noDashes(stripHtml(rawDesc)).slice(0, 420);
      const date = Date.parse(stripHtml(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'))) || 0;
      const image =
        attr(b, 'media:content', 'url') ||
        attr(b, 'media:thumbnail', 'url') ||
        attr(b, 'enclosure', 'url') ||
        (decode(rawDesc).match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] ||
        '';
      return title && link
        ? { id: link, title, summary, link, date, image: /^https?:/.test(image) ? image : '', source: feed.source, category: feed.category, topics: feed.topics, lang: feed.lang || 'en' }
        : null;
    })
    .filter(Boolean);
};

// ---------- Fetch with an in-memory cache (per warm function instance) ----------

let cache = { at: 0, items: [] };
const TTL = 30 * 60 * 1000;

const fetchFeed = async (feed) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'VitalSense/1.0 (+https://product-scan-app.vercel.app)', Accept: 'application/rss+xml, application/xml, text/xml, */*' }
    });
    if (!res.ok) return [];
    return parseFeed(await res.text(), feed);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
};

export const loadAllItems = async (fetcher = fetchFeed) => {
  if (Date.now() - cache.at < TTL && cache.items.length) return cache.items;
  const lists = await Promise.all(FEEDS.map((f) => fetcher(f)));
  const seen = new Set();
  const items = [];
  for (const list of lists) {
    for (const it of list) {
      const key = it.link.replace(/[?#].*$/, '');
      const tkey = it.title.toLowerCase();
      if (seen.has(key) || seen.has(tkey)) continue;
      seen.add(key);
      seen.add(tkey);
      items.push(it);
    }
  }
  if (items.length) cache = { at: Date.now(), items };
  return items;
};

// ---------- Ranking ----------

const reCache = new Map();
const wordRe = (w) => {
  if (!reCache.has(w)) reCache.set(w, new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
  return reCache.get(w);
};
// Matches on word starts, so "uv" does not match inside "uvula" style substrings of other words.
const hits = (text, words) => words.reduce((n, w) => (w && wordRe(w).test(text) ? n + 1 : n), 0);

/**
 * Scores an article for a profile. Returns the score and the profile choice
 * that matched most, which the app shows as "Because you chose ...".
 */
export const scoreItem = (item, profile, now = Date.now()) => {
  const title = ` ${item.title.toLowerCase()} `;
  const body = ` ${item.summary.toLowerCase()} `;
  const wants = [];
  const condTopic = CONDITION_TOPIC[profile.condition] || 'general';
  wants.push({ key: condTopic, label: profile.condition, weight: 6 });
  for (const d of profile.details) if (DETAIL_KEY[d]) wants.push({ key: DETAIL_KEY[d], label: d, weight: 5 });
  for (const s of profile.symptoms) if (DETAIL_KEY[s]) wants.push({ key: DETAIL_KEY[s], label: s, weight: 4 });
  for (const g of profile.goals) if (KEYWORDS[g]) wants.push({ key: g, label: g, weight: 4 });
  for (const w of profile.custom) wants.push({ key: null, words: [w], label: w, weight: 6 });

  let score = 0;
  let best = null;
  for (const w of wants) {
    const words = w.words || KEYWORDS[w.key] || [];
    const s = hits(title, words) * 3 + hits(body, words) + (w.key && item.topics.includes(w.key) ? 2 : 0);
    if (s > 0) {
      score += s * w.weight;
      if (!best || s * w.weight > best.s) best = { s: s * w.weight, label: w.label };
    }
  }
  // Everyone gets skin and food content (this is a skin and label app), lightly.
  if (item.topics.includes('skin') || item.topics.includes('labels')) score += 3;
  if (item.topics.includes('nutrition')) score += 2;
  // Newer is better: up to +8 for today, fading over ~3 weeks.
  if (item.date) score += Math.max(0, 8 - (now - item.date) / (3 * 86400000));
  // Same language as the reader.
  if (item.lang === profile.lang) score += 4;
  return { score, reason: best?.label || null };
};

const splitList = (v) => (v ? String(v).split('|').map((x) => x.trim()).filter(Boolean).slice(0, 20) : []);

export const buildFeed = async (query, fetcher) => {
  const profile = {
    condition: query.condition || 'General Health',
    details: splitList(query.details),
    symptoms: splitList(query.symptoms),
    goals: splitList(query.goals),
    custom: splitList(query.custom).map((x) => x.toLowerCase()).filter((x) => x.length > 2),
    lang: query.lang || 'en'
  };
  const limit = Math.min(Number(query.limit) || 240, 400);
  const items = await loadAllItems(fetcher);
  const ranked = items
    .map((it) => ({ ...it, ...scoreItem(it, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ topics, score, ...rest }) => ({ ...rest, score: Math.round(score) }));
  return { generatedAt: Date.now(), total: items.length, sources: [...new Set(items.map((i) => i.source))], items: ranked };
};

export async function handleFeed(method, query) {
  if (method !== 'GET') return { status: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  const data = await buildFeed(query);
  return { status: 200, body: JSON.stringify(data) };
}
