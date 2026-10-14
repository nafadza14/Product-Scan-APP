import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, ChevronLeft, X } from 'lucide-react';
import type { Freq, QuizConcern, SkinQuiz as Quiz } from '../../types';
import type { Translator, TranslationKey } from '../../i18n';
import { Pressable, PrimaryButton, SecondaryButton, haptic } from '../ui';

type Answers = Partial<Quiz>;

interface Q {
  id: keyof Quiz;
  title: TranslationKey;
  sub?: TranslationKey;
  multi?: boolean;
  options: { value: string | number; label: TranslationKey; emoji?: string }[];
}

const FREQ = (emoji: [string, string, string]): Q['options'] => [
  { value: 0, label: 'f0', emoji: emoji[0] },
  { value: 1, label: 'f1', emoji: emoji[1] },
  { value: 2, label: 'f2', emoji: emoji[2] }
];

const QUESTIONS: Q[] = [
  {
    id: 'skinType',
    title: 'q_skinType',
    options: [
      { value: 'dry', label: 'o_dry', emoji: '🏜️' },
      { value: 'normal', label: 'o_normal', emoji: '🙂' },
      { value: 'combination', label: 'o_combination', emoji: '🌗' },
      { value: 'oily', label: 'o_oily', emoji: '✨' },
      { value: 'unsure', label: 'o_unsure', emoji: '🤔' }
    ]
  },
  {
    id: 'concerns',
    title: 'q_concerns',
    sub: 'q_concernsSub',
    multi: true,
    options: (['breakouts', 'marks', 'dullness', 'redness', 'dryness', 'pores', 'lines'] as QuizConcern[]).map((c) => ({ value: c, label: `qc_${c}` as TranslationKey }))
  },
  {
    id: 'sensitive',
    title: 'q_sensitive',
    options: [
      { value: 'yes', label: 'o_often' },
      { value: 'sometimes', label: 'o_sometimes' },
      { value: 'no', label: 'o_rarely' }
    ]
  },
  {
    id: 'age',
    title: 'q_age',
    options: [
      { value: 'u25', label: 'o_u25' },
      { value: 'a25', label: 'o_a25' },
      { value: 'a35', label: 'o_a35' },
      { value: 'a45', label: 'o_a45' }
    ]
  },
  { id: 'sugar', title: 'q_sugar', options: FREQ(['🍓', '🍩', '🧋']) },
  { id: 'dairy', title: 'q_dairy', options: FREQ(['🌱', '🧀', '🥛']) },
  { id: 'fried', title: 'q_fried', options: FREQ(['🥗', '🍟', '🍔']) },
  {
    id: 'water',
    title: 'q_water',
    options: [
      { value: 0, label: 'w0', emoji: '💧' },
      { value: 1, label: 'w1', emoji: '💧💧' },
      { value: 2, label: 'w2', emoji: '💧💧💧' }
    ]
  },
  {
    id: 'sleep',
    title: 'q_sleep',
    options: [
      { value: 0, label: 's0', emoji: '😵' },
      { value: 1, label: 's1', emoji: '😪' },
      { value: 2, label: 's2', emoji: '😴' }
    ]
  },
  {
    id: 'stress',
    title: 'q_stress',
    options: [
      { value: 0, label: 'st0', emoji: '😌' },
      { value: 1, label: 'st1', emoji: '😐' },
      { value: 2, label: 'st2', emoji: '😫' }
    ]
  },
  {
    id: 'routine',
    title: 'q_routine',
    options: [
      { value: 0, label: 'r0' },
      { value: 1, label: 'r1' },
      { value: 2, label: 'r2' }
    ]
  },
  {
    id: 'pregnancy',
    title: 'q_pregnancy',
    sub: 'q_pregnancySub',
    options: [
      { value: 'no', label: 'p_no' },
      { value: 'pregnant', label: 'p_pregnant' },
      { value: 'breastfeeding', label: 'p_breastfeeding' }
    ]
  },
  {
    id: 'source',
    title: 'q_source',
    options: [
      { value: 'tiktok', label: 'src_tiktok' },
      { value: 'instagram', label: 'src_instagram' },
      { value: 'friend', label: 'src_friend' },
      { value: 'search', label: 'src_search' },
      { value: 'other', label: 'src_other' }
    ]
  }
];

interface Props {
  t: Translator;
  rtl: boolean;
  initial?: Quiz;
  hasSkinCheck: boolean;
  onClose: () => void;
  /** withSelfie: the person chose to take a skin check before seeing the plan. */
  onDone: (quiz: Quiz, withSelfie: boolean) => void;
}

const SkinQuiz: React.FC<Props> = ({ t, rtl, initial, hasSkinCheck, onClose, onDone }) => {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setA] = useState<Answers>(initial ? { ...initial } : { concerns: [] });
  const total = QUESTIONS.length;
  const atSelfie = i === total;
  const q = QUESTIONS[i];

  const finish = (withSelfie: boolean, a: Answers = answers) =>
    onDone(
      {
        skinType: (a.skinType as Quiz['skinType']) || 'unsure',
        concerns: (a.concerns as QuizConcern[]) || [],
        sensitive: (a.sensitive as Quiz['sensitive']) || 'sometimes',
        age: (a.age as Quiz['age']) || 'a25',
        sugar: (a.sugar ?? 1) as Freq,
        dairy: (a.dairy ?? 1) as Freq,
        fried: (a.fried ?? 1) as Freq,
        water: (a.water ?? 1) as Freq,
        sleep: (a.sleep ?? 1) as Freq,
        stress: (a.stress ?? 1) as Freq,
        routine: (a.routine ?? 1) as Freq,
        pregnancy: (a.pregnancy as Quiz['pregnancy']) || 'no',
        source: a.source,
        completedAt: Date.now()
      },
      withSelfie
    );

  const go = (to: number) => {
    setDir(to > i ? 1 : -1);
    setI(to);
  };
  const next = (ans: Answers = answers) => {
    if (i + 1 < total) return go(i + 1);
    if (hasSkinCheck) return finish(false, ans);
    go(total);
  };
  const a = answers;

  const pick = (value: string | number) => {
    haptic(6);
    if (q.multi) {
      const cur = (a[q.id] as string[]) || [];
      setA({ ...a, [q.id]: cur.includes(String(value)) ? cur.filter((x) => x !== value) : [...cur, String(value)] });
      return;
    }
    const ans = { ...a, [q.id]: value };
    setA(ans);
    window.setTimeout(() => next(ans), 220);
  };

  const selected = (v: string | number) => (q.multi ? ((a[q.id] as string[]) || []).includes(String(v)) : a[q.id] === v);
  const slide = {
    enter: (d: number) => ({ x: `${(rtl ? -1 : 1) * d * 24}%`, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: `${(rtl ? 1 : -1) * d * 24}%`, opacity: 0 })
  };

  return (
    <div className="h-full flex flex-col bg-canvas" data-testid="skin-quiz">
      <div className="px-5 pt-safe">
        <div className="pt-3 flex items-center gap-3">
          <Pressable
            aria-label={t('back')}
            onClick={() => (i === 0 ? onClose() : go(i - 1))}
            className="w-10 h-10 rounded-full bg-mist flex items-center justify-center text-ink shrink-0"
          >
            {i === 0 ? <X size={20} /> : <ChevronLeft size={22} className={rtl ? 'rotate-180' : ''} />}
          </Pressable>
          <div className="flex-1 h-1.5 rounded-full bg-mist overflow-hidden" role="progressbar" aria-valuenow={Math.min(i + 1, total)} aria-valuemax={total}>
            <motion.div className="h-full bg-ink rounded-full" animate={{ width: `${(Math.min(i + 1, total) / total) * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 34 }} />
          </div>
          <span className="text-[13px] text-ink-muted tabular-nums w-14 text-end">{t('quizStep', { n: Math.min(i + 1, total), total })}</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={i}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 overflow-y-auto no-scrollbar px-5 pt-8 pb-40"
          >
            {atSelfie ? (
              <div className="text-center pt-6">
                <div className="mx-auto w-24 h-24 rounded-[30px] bg-peach/15 text-peach flex items-center justify-center mb-6">
                  <Camera size={40} />
                </div>
                <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">{t('quizSkinCheckTitle')}</h1>
                <p className="text-[16px] text-ink-muted mt-3 leading-relaxed">{t('quizSkinCheckBody')}</p>
              </div>
            ) : (
              <>
                <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">{t(q.title)}</h1>
                {q.sub && <p className="text-[15px] text-ink-muted mt-2">{t(q.sub)}</p>}
                <div className="mt-7 space-y-2.5" role={q.multi ? 'group' : 'radiogroup'}>
                  {q.options.map((o) => {
                    const on = selected(o.value);
                    return (
                      <Pressable
                        key={String(o.value)}
                        role={q.multi ? 'checkbox' : 'radio'}
                        aria-checked={on}
                        haptics={false}
                        onClick={() => pick(o.value)}
                        className={`w-full min-h-[60px] rounded-[22px] px-4 py-3 flex items-center gap-3 text-start transition-colors ${on ? 'bg-ink text-white' : 'bg-mist text-ink'}`}
                      >
                        {o.emoji && <span className="text-[22px] w-8 text-center shrink-0" aria-hidden>{o.emoji}</span>}
                        <span className="flex-1 text-[16px] font-medium">{t(o.label)}</span>
                        {q.multi && (
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${on ? 'bg-white text-ink' : 'border-2 border-sage'}`}>
                            {on && <Check size={14} strokeWidth={3} />}
                          </span>
                        )}
                      </Pressable>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar space-y-2.5">
        {atSelfie ? (
          <div className="pb-1 space-y-2.5">
            <PrimaryButton onClick={() => finish(true)}>
              <Camera size={19} /> {t('quizSkinCheckCta')}
            </PrimaryButton>
            <SecondaryButton onClick={() => finish(false)}>{t('quizSkinCheckSkip')}</SecondaryButton>
          </div>
        ) : (
          (q.multi || a[q.id] !== undefined) && (
            <div className="pb-1">
              <PrimaryButton onClick={() => next()} disabled={q.multi && !((a[q.id] as string[]) || []).length}>
                {t('quizNext')}
              </PrimaryButton>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SkinQuiz;
