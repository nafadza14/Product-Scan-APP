import {
  ScanResult,
  UserProfile,
  ScanStatus,
  HealthCondition,
  AppLanguage,
  SkinAnalysis,
  AnalysisError,
  SkinGoal,
  SkinZone,
  SkinZoneId,
  SkinConcern,
  ConcernId,
  Severity
} from '../types';

// JSON Schema type names (the schemas below are sent to the model inside the prompt).
const Type = { OBJECT: 'object', STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean', ARRAY: 'array' } as const;

// Requests go to our own endpoint (/api/chat), which adds the Sumopod key on the server.
// In dev, vite.config.ts proxies it; on Vercel, api/chat.js handles it.
const ENDPOINT = '/api/chat';

const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  [AppLanguage.EN]: 'English',
  [AppLanguage.ID]: 'Bahasa Indonesia',
  [AppLanguage.AR]: 'Arabic',
  [AppLanguage.FR]: 'French',
  [AppLanguage.ZH]: 'Simplified Chinese'
};

const clamp = (n: unknown, fallback = 50) => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
};

const profileSummary = (p: UserProfile) => {
  const condition =
    p.condition === HealthCondition.MORE_DISEASES ? `Specific condition: ${p.customConditionName || 'unspecified'}` : p.condition;
  return [
    `- Condition: ${condition}`,
    `- Details: ${p.additionalContext.length ? p.additionalContext.join(', ') : 'None'}`,
    `- Symptoms today: ${p.currentSymptoms.length ? p.currentSymptoms.join(', ') : 'None'}`
  ].join('\n');
};

const STYLE_RULES = `
WRITING STYLE for every text field:
- Plain, calm, specific sentences. No hype, no fear-mongering.
- Never use em dashes or en dashes. Use commas, periods or colons instead.
- Never diagnose. Say what to watch for and when to ask a doctor.`;

const extractJSON = (text: string) => {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(t);
  } catch {
    const first = t.indexOf('{');
    const last = t.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(t.slice(first, last + 1));
    throw new Error('no json');
  }
};

async function callModel(imageBase64: string, systemInstruction: string, prompt: string, schema: any) {
  const system = `${systemInstruction}

Reply with ONE JSON object only, no markdown and no extra text. It must match this JSON Schema:
${JSON.stringify(schema)}`;

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });
  } catch (err: any) {
    throw new AnalysisError('network', String(err?.message || err));
  }

  const raw = await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || /missing_key|api key/i.test(raw)) throw new AnalysisError('missing_key', raw.slice(0, 300));
    if (res.status === 429 || res.status >= 500) throw new AnalysisError('network', raw.slice(0, 300));
    throw new AnalysisError('unknown', raw.slice(0, 300));
  }

  let text = '';
  try {
    const data = JSON.parse(raw);
    const content = data?.choices?.[0]?.message?.content;
    text = Array.isArray(content) ? content.map((c: any) => c?.text || '').join('') : String(content || '');
  } catch {
    throw new AnalysisError('unknown', 'Invalid response');
  }
  // Some models think out loud first; drop any <think> block.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  if (!text.trim()) throw new AnalysisError('unknown', 'Empty response');
  try {
    return extractJSON(text);
  } catch {
    throw new AnalysisError('unknown', 'Invalid JSON');
  }
}

const stripDashes = (s: string) => s.replace(/\s*[\u2014\u2013]\s*/g, ', ');
const clean = (s: unknown, fallback = '') => (typeof s === 'string' && s.trim() ? stripDashes(s.trim()) : fallback);

export const analyzeImage = async (imageBase64: string, userProfile: UserProfile): Promise<ScanResult> => {
  const language = LANGUAGE_NAMES[userProfile.language] || 'English';

  const systemInstruction = `
You are a careful food and cosmetics ingredient analyst.
Analyze the product in the photo for this person:
${profileSummary(userProfile)}

First decide if the photo shows a packaged food, drink, supplement or cosmetic with readable text.
If it does not, set "recognized" to false and leave the other fields minimal.

SCORING (0 to 100, how well this product suits THIS person):
- Nutri-Score and the personal score must agree. Nutri-Score D means a score between 30 and 55. Nutri-Score E means a score below 30.
- Never give more than 60 to a D or E product.
- Pregnancy: weigh high sugar heavily (gestational diabetes risk), flag retinoids, high-dose vitamin A, salicylic acid in high concentrations, alcohol, raw or unpasteurized ingredients, high-mercury fish.
- Allergies: any listed allergen, or "may contain" warnings for it, means AVOID.
- Status: SAFE for 70 and above, CAUTION for 40 to 69, AVOID below 40.
- Cosmetics have no Nutri-Score, nutrition or diet fields.

OUTPUT:
- Every text field in ${language}. Product name may stay in its original language.
- "explanation": two or three sentences on why this score fits this person.
- "icon": a single emoji that represents the product.
- Ingredients: list up to 10 that matter most, flagged ones first.
- "nutritionAdvisor" names must be exactly one of: Fat, Saturated Fat, Sugar, Salt, Protein. Levels must be Low, Medium or High.
${STYLE_RULES}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      recognized: { type: Type.BOOLEAN },
      productName: { type: Type.STRING },
      category: { type: Type.STRING, enum: ['Food', 'Cosmetic', 'Other'] },
      icon: { type: Type.STRING },
      status: { type: Type.STRING, enum: ['SAFE', 'CAUTION', 'AVOID'] },
      score: { type: Type.NUMBER },
      nutriScore: { type: Type.STRING, enum: ['A', 'B', 'C', 'D', 'E', 'N/A'] },
      explanation: { type: Type.STRING },
      fullIngredientList: { type: Type.STRING },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ['Safe', 'High Risk', 'Moderate'] },
            description: { type: Type.STRING }
          },
          required: ['name', 'riskLevel', 'description']
        }
      },
      nutritionAdvisor: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, enum: ['Fat', 'Saturated Fat', 'Sugar', 'Salt', 'Protein'] },
            value: { type: Type.STRING },
            level: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
          },
          required: ['name', 'level']
        }
      },
      dietarySuitability: {
        type: Type.OBJECT,
        properties: {
          vegan: { type: Type.BOOLEAN },
          vegetarian: { type: Type.BOOLEAN },
          glutenFree: { type: Type.BOOLEAN },
          lactoseFree: { type: Type.BOOLEAN }
        }
      },
      alternatives: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } },
          required: ['name', 'reason']
        }
      }
    },
    required: ['recognized', 'productName', 'category', 'status', 'score', 'explanation', 'ingredients', 'alternatives']
  };

  const data = await callModel(
    imageBase64,
    systemInstruction,
    `Identify this product, read its ingredients and analyze it for me. Answer in ${language}.`,
    schema
  );

  if (data.recognized === false || !data.productName) throw new AnalysisError('not_recognized');

  const score = clamp(data.score);
  const status: ScanStatus =
    data.status === 'SAFE' || data.status === 'CAUTION' || data.status === 'AVOID'
      ? data.status
      : score >= 70
        ? ScanStatus.SAFE
        : score >= 40
          ? ScanStatus.CAUTION
          : ScanStatus.AVOID;
  const category = data.category === 'Cosmetic' || data.category === 'Other' ? data.category : 'Food';

  return {
    productName: clean(data.productName, 'Unknown product'),
    category,
    icon: typeof data.icon === 'string' && [...data.icon].length <= 4 ? data.icon : category === 'Cosmetic' ? '🧴' : '🥫',
    status,
    score,
    nutriScore: category === 'Food' && ['A', 'B', 'C', 'D', 'E'].includes(data.nutriScore) ? data.nutriScore : undefined,
    explanation: clean(data.explanation),
    fullIngredientList: clean(data.fullIngredientList),
    ingredients: (Array.isArray(data.ingredients) ? data.ingredients : []).slice(0, 10).map((i: any) => ({
      name: clean(i?.name, '?'),
      riskLevel: i?.riskLevel === 'High Risk' || i?.riskLevel === 'Moderate' ? i.riskLevel : 'Safe',
      description: clean(i?.description)
    })),
    nutritionAdvisor: category === 'Food' && Array.isArray(data.nutritionAdvisor) ? data.nutritionAdvisor : [],
    dietarySuitability: category === 'Food' ? data.dietarySuitability : undefined,
    alternatives: (Array.isArray(data.alternatives) ? data.alternatives : []).slice(0, 3).map((a: any) => ({
      name: clean(a?.name),
      reason: clean(a?.reason)
    }))
  };
};

const ZONES = ['forehead', 'tzone', 'leftCheek', 'rightCheek', 'chin', 'underEye'] as const;
const CONCERNS = ['breakouts', 'redness', 'darkSpots', 'darkCircles', 'fineLines', 'oiliness', 'dryness', 'enlargedPores', 'uneven'] as const;
const GOAL_TEXT: Record<SkinGoal, string> = {
  clearBreakouts: 'clear breakouts',
  evenTone: 'even out skin tone and dark spots',
  hydration: 'more hydration',
  calmRedness: 'calm redness and sensitivity',
  smoothTexture: 'smoother texture',
  firmness: 'firmer skin and fewer fine lines',
  minimizePores: 'less visible pores'
};

export interface SkinContext {
  goals?: SkinGoal[];
  /** The previous check, so the model can comment on change. */
  previous?: { daysAgo: number; skinScore?: number; metrics: SkinAnalysis['metrics']; concerns: string[] };
  /** Recent diary entries in plain text (sleep, stress, tags). */
  recentLog?: string;
  /** What the person currently uses. */
  routine?: string;
}

export const analyzeSkin = async (imageBase64: string, userProfile: UserProfile, ctx: SkinContext = {}): Promise<SkinAnalysis> => {
  const language = LANGUAGE_NAMES[userProfile.language] || 'English';
  const goals = ctx.goals?.length ? ctx.goals.map((g) => GOAL_TEXT[g]).join(', ') : 'not set';
  const prev = ctx.previous
    ? `Previous check ${ctx.previous.daysAgo} day(s) ago: skin score ${ctx.previous.skinScore ?? 'n/a'}, metrics ${JSON.stringify(ctx.previous.metrics)}, concerns: ${ctx.previous.concerns.join(', ') || 'none'}.`
    : 'This is the first check.';

  const systemInstruction = `
You are a careful cosmetic skin analyst. You read one selfie and give specific, practical, kind guidance.
Health profile:
${profileSummary(userProfile)}
Skin goals: ${goals}
${prev}
Recent diary: ${ctx.recentLog || 'none'}
Current routine: ${ctx.routine || 'not shared'}

STEP 1. Photo check. If there is no clear human face, set "faceDetected" false. Otherwise rate the photo:
- quality.lighting: good, dim, harsh or uneven. quality.sharp and quality.frontal: true or false.
- quality.confidence 0 to 100: how much the photo supports the scores below. Lower it for filters, makeup, blur or bad light.

STEP 2. Metrics, 0 to 100, higher always means healthier-looking:
moisture, firmness, texture, poreVisibility (100 = barely visible pores), evenness.
skinScore: one overall 0 to 100 number, consistent with the metrics and concerns.

STEP 3. Zones. Score each of: ${ZONES.join(', ')}. Give each a one-sentence note on what you see there (for example "a few small closed comedones near the hairline").

STEP 4. Concerns. For each of ${CONCERNS.join(', ')} give severity 0 (none), 1 (mild), 2 (moderate) or 3 (marked), the zones where you see it, and a one-sentence note. Be specific about location and appearance. Never call anything a disease; describe what is visible.

STEP 5. "concerns": the 2 to 4 most noticeable concerns as short labels.
"topPriority": the one thing that would help most right now, in one sentence, tied to their goals.
"summary": three sentences. If there is a previous check, say plainly what improved or got worse and by how much. Link to the diary only when the pattern is clear, and phrase it as a possibility.

STEP 6. Routine: 3 to 4 morning steps (time "am") and 3 to 4 evening steps (time "pm"), in order. Each has "step" (short title), "ingredient" (the key active, or empty), and "tip" (one sentence on how and why for THIS person). Build on their current routine when shared instead of replacing everything.
"lookFor" and "avoid": 3 to 5 ingredient names each.

RULES:
- Pregnancy: never suggest retinoids, high-dose salicylic acid or hydroquinone; put them in "avoid". Cancer care: fragrance-free and gentle only.
- Cosmetic guidance only. If something looks like it needs a doctor (sudden change, bleeding, painful cysts, a changing mole), say so in the summary.
- All text in ${language}. Zone and concern ids stay in English exactly as listed.
${STYLE_RULES}`;

  const num = { type: Type.NUMBER };
  const schema = {
    type: Type.OBJECT,
    properties: {
      faceDetected: { type: Type.BOOLEAN },
      quality: {
        type: Type.OBJECT,
        properties: {
          lighting: { type: Type.STRING, enum: ['good', 'dim', 'harsh', 'uneven'] },
          sharp: { type: Type.BOOLEAN },
          frontal: { type: Type.BOOLEAN },
          confidence: num
        }
      },
      skinType: { type: Type.STRING, enum: ['Dry', 'Normal', 'Combination', 'Oily'] },
      skinScore: num,
      metrics: {
        type: Type.OBJECT,
        properties: { moisture: num, firmness: num, texture: num, poreVisibility: num, evenness: num },
        required: ['moisture', 'firmness', 'texture', 'poreVisibility', 'evenness']
      },
      zones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { zone: { type: Type.STRING, enum: [...ZONES] }, score: num, note: { type: Type.STRING } },
          required: ['zone', 'score', 'note']
        }
      },
      concernDetails: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, enum: [...CONCERNS] },
            severity: num,
            zones: { type: Type.ARRAY, items: { type: Type.STRING, enum: [...ZONES] } },
            note: { type: Type.STRING }
          },
          required: ['id', 'severity', 'note']
        }
      },
      concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
      topPriority: { type: Type.STRING },
      summary: { type: Type.STRING },
      routine: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, enum: ['am', 'pm'] },
            step: { type: Type.STRING },
            ingredient: { type: Type.STRING },
            tip: { type: Type.STRING }
          },
          required: ['time', 'step', 'tip']
        }
      },
      lookFor: { type: Type.ARRAY, items: { type: Type.STRING } },
      avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['faceDetected', 'skinType', 'skinScore', 'metrics', 'zones', 'concernDetails', 'concerns', 'summary', 'routine', 'lookFor', 'avoid']
  };

  const data = await callModel(
    imageBase64,
    systemInstruction,
    `Analyze the skin in this selfie in detail and update my routine. Answer in ${language}.`,
    schema
  );

  if (data.faceDetected === false || !data.metrics) throw new AnalysisError('no_face');

  const list = (v: unknown, max: number) =>
    (Array.isArray(v) ? v : []).map((x) => clean(x)).filter(Boolean).slice(0, max);
  const isZone = (z: unknown): z is SkinZoneId => typeof z === 'string' && (ZONES as readonly string[]).includes(z);

  const metrics = {
    moisture: clamp(data.metrics.moisture),
    firmness: clamp(data.metrics.firmness),
    texture: clamp(data.metrics.texture),
    poreVisibility: clamp(data.metrics.poreVisibility),
    evenness: clamp(data.metrics.evenness)
  };
  const avg = Math.round((metrics.moisture + metrics.firmness + metrics.texture + metrics.poreVisibility + metrics.evenness) / 5);

  const zones: SkinZone[] = (Array.isArray(data.zones) ? data.zones : [])
    .filter((z: any) => isZone(z?.zone))
    .map((z: any) => ({ zone: z.zone, score: clamp(z.score), note: clean(z.note) }));

  const concernDetails: SkinConcern[] = (Array.isArray(data.concernDetails) ? data.concernDetails : [])
    .filter((c: any) => (CONCERNS as readonly string[]).includes(c?.id))
    .map((c: any) => ({
      id: c.id as ConcernId,
      severity: Math.max(0, Math.min(3, Math.round(Number(c.severity) || 0))) as Severity,
      zones: (Array.isArray(c.zones) ? c.zones : []).filter(isZone),
      note: clean(c.note)
    }));

  const q = data.quality || {};
  return {
    skinType: ['Dry', 'Normal', 'Combination', 'Oily'].includes(data.skinType) ? data.skinType : 'Normal',
    skinScore: typeof data.skinScore === 'number' ? clamp(data.skinScore) : avg,
    metrics,
    zones,
    concernDetails,
    quality: {
      lighting: ['good', 'dim', 'harsh', 'uneven'].includes(q.lighting) ? q.lighting : 'good',
      sharp: q.sharp !== false,
      frontal: q.frontal !== false,
      confidence: clamp(q.confidence, 70)
    },
    topPriority: clean(data.topPriority),
    concerns: list(data.concerns, 4),
    summary: clean(data.summary),
    routine: (Array.isArray(data.routine) ? data.routine : [])
      .slice(0, 8)
      .map((r: any) => ({
        step: clean(r?.step),
        tip: clean(r?.tip),
        ingredient: clean(r?.ingredient) || undefined,
        time: r?.time === 'pm' ? ('pm' as const) : r?.time === 'am' ? ('am' as const) : undefined
      }))
      .filter((r: any) => r.step),
    lookFor: list(data.lookFor, 5),
    avoid: list(data.avoid, 5)
  };
};
