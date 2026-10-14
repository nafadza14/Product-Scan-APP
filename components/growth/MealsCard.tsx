import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Trash2, UtensilsCrossed } from 'lucide-react';
import type { Meal } from '../../types';
import type { Translator, TranslationKey } from '../../i18n';
import { loadPhoto } from '../../services/diaryService';
import { Pressable } from '../ui';
import { FOOD_FLAGS } from '../diary/shared';

const SKIN = {
  good: { key: 'impactGood' as TranslationKey, color: '#2E8C68' },
  neutral: { key: 'impactNeutral' as TranslationKey, color: '#6E8283' },
  bad: { key: 'impactBad' as TranslationKey, color: '#D2432F' }
};

const MealThumb: React.FC<{ meal: Meal }> = ({ meal }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadPhoto(meal.photoId).then((p) => live && setSrc(p));
    return () => {
      live = false;
    };
  }, [meal.photoId]);
  return (
    <span className="w-14 h-14 rounded-2xl bg-white overflow-hidden shrink-0 flex items-center justify-center text-[26px]">
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : meal.emoji}
    </span>
  );
};

interface Props {
  t: Translator;
  meals: Meal[];
  busy: boolean;
  error: boolean;
  locale: string;
  onAdd: (file: File) => void;
  onRemove: (id: string) => void;
}

const MealsCard: React.FC<Props> = ({ t, meals, busy, error, locale, onAdd, onRemove }) => {
  const input = useRef<HTMLInputElement>(null);
  const time = (ts: number) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(ts);
  return (
    <section className="rounded-[26px] bg-mist p-4" data-testid="meals-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-semibold text-ink flex items-center gap-2">
          <UtensilsCrossed size={17} className="text-peach" /> {t('mealsTitle')}
        </h2>
        <Pressable
          onClick={() => input.current?.click()}
          disabled={busy}
          className="h-9 px-3.5 rounded-full bg-ink text-white text-[13.5px] font-semibold inline-flex items-center gap-1.5"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />} {busy ? t('mealAnalyzing') : t('mealLog')}
        </Pressable>
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          data-testid="meal-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onAdd(f);
          }}
        />
      </div>
      {error && <p className="text-[13.5px] text-avoid mb-2" role="alert">{t('mealError')}</p>}
      {meals.length === 0 ? (
        <p className="text-[14px] text-ink-muted leading-snug">{t('mealsEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {[...meals].sort((a, b) => b.ts - a.ts).map((m) => {
              const s = SKIN[m.skin];
              return (
                <motion.li key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl bg-white/70 p-2.5 flex gap-3">
                  <MealThumb meal={m} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[15px] font-semibold text-ink truncate">{m.name}</p>
                      <span className="text-[12px] text-ink-faint shrink-0">{time(m.ts)}</span>
                    </div>
                    <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: s.color }}>
                      {t(s.key)}
                    </p>
                    {m.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {m.flags.slice(0, 4).map((f) => {
                          const meta = FOOD_FLAGS.find((x) => x.id === f);
                          if (!meta) return null;
                          return (
                            <span key={f} className={`h-6 px-2 rounded-full text-[11.5px] font-semibold inline-flex items-center ${meta.good ? 'bg-safe/10 text-safe' : 'bg-caution/10 text-caution'}`}>
                              {t(meta.key)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {m.note && <p className="text-[12.5px] text-ink-muted leading-snug mt-1">{m.note}</p>}
                  </div>
                  <Pressable aria-label={t('mealRemove')} haptics={false} onClick={() => onRemove(m.id)} className="w-8 h-8 rounded-full text-ink-faint flex items-center justify-center shrink-0">
                    <Trash2 size={15} />
                  </Pressable>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
};

export default MealsCard;
