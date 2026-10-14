import type { AvoidKey, QuizConcern, SkinPlan, SkinQuiz, SkinScanItem } from '../types';

/**
 * Builds a personal plan from the quiz answers and, when there is one, the latest skin check.
 * Rule based on purpose: the same answers always give the same plan, and every line is
 * reviewable copy (plan_* keys) rather than free model output.
 */

const CONCERN_FROM_CHECK: Record<string, QuizConcern> = {
  breakouts: 'breakouts',
  darkSpots: 'marks',
  uneven: 'dullness',
  redness: 'redness',
  dryness: 'dryness',
  enlargedPores: 'pores',
  oiliness: 'pores',
  fineLines: 'lines'
};

const take = (xs: string[], n: number) => Array.from(new Set(xs)).slice(0, n);

export const effectiveConcerns = (quiz: SkinQuiz, latest?: SkinScanItem): QuizConcern[] => {
  const fromCheck = (latest?.concernDetails || [])
    .filter((c) => c.severity >= 2)
    .map((c) => CONCERN_FROM_CHECK[c.id])
    .filter(Boolean) as QuizConcern[];
  return Array.from(new Set([...quiz.concerns, ...fromCheck]));
};

export const buildPlan = (quiz: SkinQuiz, latest?: SkinScanItem): SkinPlan => {
  const c = new Set(effectiveConcerns(quiz, latest));
  const type = latest ? latest.skinType.toLowerCase() : quiz.skinType;
  const oily = type === 'oily' || type === 'combination';
  const dry = type === 'dry';
  const sensitive = quiz.sensitive === 'yes' || c.has('redness');
  const pregnant = quiz.pregnancy !== 'no';

  const focus = c.has('breakouts')
    ? 'focus_clear'
    : c.has('redness') || quiz.sensitive === 'yes'
      ? 'focus_calm'
      : c.has('marks') || c.has('dullness')
        ? 'focus_glow'
        : c.has('dryness')
          ? 'focus_hydrate'
          : c.has('pores')
            ? 'focus_pores'
            : c.has('lines')
              ? 'focus_firm'
              : 'focus_glow';

  const reduce: string[] = [];
  if (quiz.sugar === 2 || (quiz.sugar === 1 && (c.has('breakouts') || c.has('dullness') || c.has('lines')))) reduce.push('r_sugar');
  if (quiz.dairy >= 1 && c.has('breakouts')) reduce.push('r_dairy');
  if (c.has('breakouts') && quiz.sugar >= 1) reduce.push('r_highGI');
  if (quiz.fried >= 1) reduce.push('r_fried');
  if (sensitive) reduce.push('r_spicyAlcohol');
  if (!reduce.length) reduce.push('r_processed');

  const add: string[] = [];
  if (c.has('breakouts') || c.has('redness') || c.has('dryness')) add.push('a_omega3');
  if (c.has('marks') || c.has('dullness')) add.push('a_vitC');
  if (c.has('breakouts')) add.push('a_zinc');
  if (quiz.water < 2 || dry || c.has('dryness')) add.push('a_water');
  if (c.has('lines')) add.push('a_protein');
  add.push('a_colorful');

  const am = [dry ? 'am_rinse' : 'am_cleanser'];
  if ((c.has('marks') || c.has('dullness')) && !sensitive) am.push('am_vitc');
  else if (oily || c.has('pores') || c.has('breakouts')) am.push('am_niacinamide');
  am.push(dry || c.has('dryness') ? 'am_moisturizer_rich' : 'am_moisturizer_light', 'am_spf');

  const pm = ['pm_cleanser'];
  if (c.has('breakouts')) pm.push(pregnant || sensitive ? 'pm_azelaic' : 'pm_bha');
  else if ((c.has('lines') || c.has('marks')) && !pregnant) pm.push(sensitive ? 'pm_azelaic' : 'pm_retinoid');
  else if (c.has('marks') && pregnant) pm.push('pm_azelaic');
  if (sensitive || c.has('dryness') || dry) pm.push('pm_ceramide');
  else pm.push('pm_moisturizer');

  const habits = ['h_logMeals', 'h_selfie'];
  if (quiz.sleep < 2) habits.push('h_sleep');
  if (quiz.stress === 2) habits.push('h_stress');
  if (c.has('breakouts')) habits.push('h_pillow');

  return {
    focus,
    reduce: take(reduce, 4),
    add: take(add, 4),
    am: take(am, 4),
    pm: take(pm, 4),
    habits: take(habits, 4),
    createdAt: Date.now()
  };
};

/** Avoid-list items the plan suggests, merged into what the person already picked. */
export const suggestedAvoid = (quiz: SkinQuiz, latest?: SkinScanItem): AvoidKey[] => {
  const c = new Set(effectiveConcerns(quiz, latest));
  const out: AvoidKey[] = [];
  if (quiz.sensitive === 'yes' || c.has('redness')) out.push('fragrance', 'essentialOils');
  if (quiz.pregnancy !== 'no') out.push('retinoids');
  if (c.has('breakouts')) out.push('comedogenic');
  if (c.has('breakouts') && quiz.sugar === 2) out.push('addedSugar');
  if (c.has('breakouts') && quiz.dairy === 2) out.push('dairy');
  return out;
};
