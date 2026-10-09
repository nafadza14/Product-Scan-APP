import {
  ScanResult,
  UserProfile,
  ScanStatus,
  HealthCondition,
  AppLanguage,
  SkinAnalysis,
  AnalysisError
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
        max_tokens: 2500
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

export const analyzeSkin = async (imageBase64: string, userProfile: UserProfile): Promise<SkinAnalysis> => {
  const language = LANGUAGE_NAMES[userProfile.language] || 'English';

  const systemInstruction = `
You are a cosmetic skin analyst giving gentle, practical skincare guidance from a selfie.
The person's health profile:
${profileSummary(userProfile)}

First decide if the photo shows a human face clearly enough to judge skin. If not, set "faceDetected" to false.

Estimate (0 to 100, higher is better for every metric):
- moisture: how hydrated the skin looks
- firmness: how firm and smooth contours look
- texture: how smooth the surface looks
- poreVisibility: how refined pores look (100 means barely visible pores)
- evenness: how even the tone looks

Then:
- "skinType": one of Dry, Normal, Combination, Oily.
- "concerns": 2 to 4 short labels (one to three words each) for what you see.
- "summary": two sentences, kind and specific.
- "routine": 3 or 4 steps in order (morning and evening). "step" is a short title, "tip" is one sentence.
- "lookFor" and "avoid": 3 or 4 ingredient names each.
- Respect the health profile. Pregnancy: never suggest retinoids, high-dose salicylic acid or hydroquinone; put them in "avoid". Cancer care: favor fragrance-free, gentle products.
- Cosmetic guidance only. Do not diagnose medical conditions. If something looks like it needs a doctor, say so in the summary.
- All text in ${language}.
${STYLE_RULES}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      faceDetected: { type: Type.BOOLEAN },
      skinType: { type: Type.STRING, enum: ['Dry', 'Normal', 'Combination', 'Oily'] },
      metrics: {
        type: Type.OBJECT,
        properties: {
          moisture: { type: Type.NUMBER },
          firmness: { type: Type.NUMBER },
          texture: { type: Type.NUMBER },
          poreVisibility: { type: Type.NUMBER },
          evenness: { type: Type.NUMBER }
        },
        required: ['moisture', 'firmness', 'texture', 'poreVisibility', 'evenness']
      },
      concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
      summary: { type: Type.STRING },
      routine: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { step: { type: Type.STRING }, tip: { type: Type.STRING } },
          required: ['step', 'tip']
        }
      },
      lookFor: { type: Type.ARRAY, items: { type: Type.STRING } },
      avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['faceDetected', 'skinType', 'metrics', 'concerns', 'summary', 'routine', 'lookFor', 'avoid']
  };

  const data = await callModel(
    imageBase64,
    systemInstruction,
    `Analyze the skin in this selfie and suggest a routine. Answer in ${language}.`,
    schema
  );

  if (data.faceDetected === false || !data.metrics) throw new AnalysisError('no_face');

  const list = (v: unknown, max: number) =>
    (Array.isArray(v) ? v : []).map((x) => clean(x)).filter(Boolean).slice(0, max);

  return {
    skinType: ['Dry', 'Normal', 'Combination', 'Oily'].includes(data.skinType) ? data.skinType : 'Normal',
    metrics: {
      moisture: clamp(data.metrics.moisture),
      firmness: clamp(data.metrics.firmness),
      texture: clamp(data.metrics.texture),
      poreVisibility: clamp(data.metrics.poreVisibility),
      evenness: clamp(data.metrics.evenness)
    },
    concerns: list(data.concerns, 4),
    summary: clean(data.summary),
    routine: (Array.isArray(data.routine) ? data.routine : [])
      .slice(0, 4)
      .map((r: any) => ({ step: clean(r?.step), tip: clean(r?.tip) }))
      .filter((r: any) => r.step),
    lookFor: list(data.lookFor, 4),
    avoid: list(data.avoid, 4)
  };
};
