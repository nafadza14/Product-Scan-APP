import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, ScanLine, AlertTriangle, ChevronDown, Leaf, Wheat, Milk, Sprout, Sparkles } from 'lucide-react';
import { MacroNutrient, ScanHistoryItem, ScanStatus, UserProfile } from '../types';
import { Translator, TranslationKey, conditionLabel } from '../i18n';
import { NavBar, Pressable, ProductIcon, Ring, useCountUp } from './ui';
import { statusColor } from './HomeView';

interface Props {
  t: Translator;
  rtl: boolean;
  item: ScanHistoryItem;
  user: UserProfile | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onScanAnother: () => void;
}

const NUTRI_COLORS: Record<string, string> = { A: '#1E8F4E', B: '#7AC943', C: '#F2C230', D: '#F08A24', E: '#D9412F' };

const macroKey: Record<string, TranslationKey> = {
  Fat: 'macroFat',
  'Saturated Fat': 'macroSatFat',
  Sugar: 'macroSugar',
  Salt: 'macroSalt',
  Protein: 'macroProtein'
};
const levelKey: Record<string, TranslationKey> = { Low: 'levelLow', Medium: 'levelMedium', High: 'levelHigh' };

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay: 0.12 + i * 0.07, ease: [0.16, 1, 0.3, 1] }
});

const MacroRow: React.FC<{ m: MacroNutrient; t: Translator }> = ({ m, t }) => {
  const good = m.level === 'Low' || (m.name === 'Protein' && m.level === 'High');
  const bars = m.level === 'Low' ? 1 : m.level === 'Medium' ? 2 : 3;
  const color = good ? '#2E8C68' : m.level === 'Medium' ? '#DB8F1F' : '#D2432F';
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[15px] font-medium text-ink">{t(macroKey[m.name] || 'macroFat')}</span>
      <span className="flex items-center gap-3">
        {m.value && <span className="text-[13px] text-ink-muted">{m.value}</span>}
        <span className="flex gap-1" aria-label={t(levelKey[m.level] || 'levelMedium')}>
          {[1, 2, 3].map((b) => (
            <span key={b} className="w-4 h-1.5 rounded-full" style={{ background: b <= bars ? color : '#E4EBE9' }} />
          ))}
        </span>
        <span className="text-[13px] font-semibold w-14 text-end" style={{ color }}>
          {t(levelKey[m.level] || 'levelMedium')}
        </span>
      </span>
    </div>
  );
};

const ProductResult: React.FC<Props> = ({ t, rtl, item, user, onClose, onToggleFavorite, onScanAnother }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const score = useCountUp(item.score, 0.35);
  const isCosmetic = item.category === 'Cosmetic';
  const flagged = item.ingredients.filter((i) => i.riskLevel !== 'Safe');
  const color = statusColor(item.status);

  const verdict =
    item.status === ScanStatus.SAFE
      ? { title: t('verdictSafe'), sub: t('verdictSafeSub'), emoji: '✅' }
      : item.status === ScanStatus.CAUTION
        ? { title: t('verdictCaution'), sub: t('verdictCautionSub'), emoji: '⚠️' }
        : { title: t('verdictAvoid'), sub: t('verdictAvoidSub'), emoji: '⛔' };

  const tiles: React.ReactNode[] = [
    <div key="score" className="rounded-3xl bg-white p-4 flex flex-col justify-between min-h-[132px]">
      <span className="text-[14px] font-medium text-ink-soft flex items-center gap-1.5">
        <Sparkles size={15} style={{ color }} /> {t('yourScore')}
      </span>
      <div className="flex items-end justify-between mt-3">
        <span className="text-[34px] leading-none font-semibold tracking-[-0.02em] text-ink tabular-nums">{score}</span>
        <Ring value={item.score} size={52} stroke={6} color={color} delay={0.35} />
      </div>
    </div>
  ];

  if (!isCosmetic && item.nutriScore) {
    tiles.push(
      <div key="nutri" className="rounded-3xl bg-white p-4 flex flex-col justify-between min-h-[132px]">
        <span className="text-[14px] font-medium text-ink-soft">{t('nutriScore')}</span>
        <div className="flex items-end gap-[3px] mt-3" aria-label={`${t('nutriScore')} ${item.nutriScore}`}>
          {['A', 'B', 'C', 'D', 'E'].map((g) => {
            const active = g === item.nutriScore;
            return (
              <motion.span
                key={g}
                initial={{ height: 26 }}
                animate={{ height: active ? 46 : 26 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 22 }}
                className={`flex-1 rounded-lg flex items-center justify-center font-semibold text-white ${active ? 'text-[18px]' : 'text-[12px] opacity-35'}`}
                style={{ background: NUTRI_COLORS[g] }}
              >
                {g}
              </motion.span>
            );
          })}
        </div>
      </div>
    );
  }

  tiles.push(
    <div key="flag" className="rounded-3xl bg-white p-4 flex flex-col justify-between min-h-[132px]">
      <span className="text-[14px] font-medium text-ink-soft flex items-center gap-1.5">
        <AlertTriangle size={15} className="text-caution" /> {t('flagged')}
      </span>
      <div className="flex items-end gap-3 mt-3">
        <span className="text-[34px] leading-none font-semibold text-ink tabular-nums">{flagged.length}</span>
        <span className="flex-1 min-w-0 flex flex-wrap justify-end gap-1.5">
          {flagged.slice(0, 3).map((f) => (
            <span
              key={f.name}
              className={`h-7 px-2.5 rounded-full text-[12.5px] font-semibold inline-flex items-center max-w-full truncate ${
                f.riskLevel === 'High Risk' ? 'bg-avoid/10 text-avoid' : 'bg-caution/10 text-caution'
              }`}
            >
              {f.name}
            </span>
          ))}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}>
        <NavBar
          title={scrolled ? item.productName : isCosmetic ? t('skincareAnalysis') : t('foodAnalysis')}
          onClose={onClose}
          backLabel={t('back')}
          closeLabel={t('close')}
          scrolled={scrolled}
          rtl={rtl}
        />

        <div className="px-5 pb-40">
          <motion.div {...reveal(0)} className="flex items-center gap-4 mb-6">
            <ProductIcon icon={item.icon} size={72} className="!rounded-3xl bg-white shadow-soft" />
            <div className="min-w-0">
              <p className="text-[14px] text-ink-muted">{isCosmetic ? t('filterSkincare') : t('filterFood')}</p>
              <h1 className="text-[22px] leading-tight font-semibold text-ink tracking-[-0.01em] line-clamp-2">{item.productName}</h1>
            </div>
          </motion.div>

          <motion.h2 {...reveal(1)} className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink">
            {verdict.title} <span aria-hidden>{verdict.emoji}</span>
          </motion.h2>
          <motion.p {...reveal(1)} className="text-[16px] text-ink-muted mt-1.5 mb-6">
            {verdict.sub}. {t('scoreFor', { condition: conditionLabel(t, user) })}
          </motion.p>

          <motion.div {...reveal(2)} className="rounded-[30px] bg-sage-soft p-2 grid grid-cols-2 gap-2 mb-8">
            {tiles.map((tile, i) => (
              <div key={i} className={tiles.length % 2 === 1 && i === tiles.length - 1 ? 'col-span-2' : ''}>
                {tile}
              </div>
            ))}
          </motion.div>

          {item.explanation && (
            <motion.section {...reveal(3)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-2.5">{t('why')}</h3>
              <p className="text-[16px] leading-relaxed text-ink-soft">{item.explanation}</p>
            </motion.section>
          )}

          <motion.section {...reveal(4)} className="mb-8">
            <h3 className="text-[19px] font-semibold text-ink mb-3">{t('flagged')}</h3>
            {flagged.length === 0 ? (
              <p className="text-[15px] text-ink-muted rounded-3xl bg-white p-4 shadow-soft">{t('flaggedNone')}</p>
            ) : (
              <div className="rounded-3xl bg-white shadow-soft divide-y divide-canvas">
                {flagged.map((ing, i) => {
                  const high = ing.riskLevel === 'High Risk';
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-[16px] font-semibold text-ink">{ing.name}</span>
                        <span
                          className={`text-[12px] font-semibold px-2.5 h-6 inline-flex items-center rounded-full shrink-0 ${
                            high ? 'bg-avoid/10 text-avoid' : 'bg-caution/10 text-caution'
                          }`}
                        >
                          {high ? t('riskHigh') : t('riskModerate')}
                        </span>
                      </div>
                      {ing.description && <p className="text-[14px] leading-snug text-ink-muted">{ing.description}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>

          {!isCosmetic && item.nutritionAdvisor && item.nutritionAdvisor.length > 0 && (
            <motion.section {...reveal(5)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-3">{t('nutrition')}</h3>
              <div className="rounded-3xl bg-white shadow-soft px-4 divide-y divide-canvas">
                {item.nutritionAdvisor.map((m, i) => (
                  <MacroRow key={i} m={m} t={t} />
                ))}
              </div>
            </motion.section>
          )}

          {!isCosmetic && item.dietarySuitability && (
            <motion.section {...reveal(5)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-3">{t('diet')}</h3>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['vegan', Sprout],
                    ['vegetarian', Leaf],
                    ['glutenFree', Wheat],
                    ['lactoseFree', Milk]
                  ] as const
                ).map(([k, Icon]) => {
                  const yes = !!item.dietarySuitability?.[k];
                  return (
                    <span
                      key={k}
                      className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-full text-[14px] font-semibold ${
                        yes ? 'bg-ink text-white' : 'bg-white text-ink-faint shadow-soft line-through decoration-1'
                      }`}
                      aria-label={`${t(k)}: ${yes ? t('likely') : t('unlikely')}`}
                    >
                      <Icon size={16} /> {t(k)}
                    </span>
                  );
                })}
              </div>
            </motion.section>
          )}

          <motion.section {...reveal(6)} className="mb-8">
            <Pressable
              haptics={false}
              onClick={() => setShowFull((s) => !s)}
              aria-expanded={showFull}
              className="w-full rounded-3xl bg-white shadow-soft p-4 text-start"
            >
              <span className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-ink">{t('fullList')}</span>
                <motion.span animate={{ rotate: showFull ? 180 : 0 }}>
                  <ChevronDown size={20} className="text-ink-muted" />
                </motion.span>
              </span>
              <AnimatePresence initial={false}>
                {showFull && (
                  <motion.span
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="block overflow-hidden"
                  >
                    <span className="block pt-3 text-[14px] leading-relaxed text-ink-muted">{item.fullIngredientList || t('fullListMissing')}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </Pressable>
          </motion.section>

          {item.alternatives.length > 0 && (
            <motion.section {...reveal(7)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-3">{t('alternatives')}</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory pb-1">
                {item.alternatives.map((alt, i) => (
                  <div key={i} className="snap-start shrink-0 w-[230px] rounded-3xl bg-white p-4 shadow-soft">
                    <span className="w-9 h-9 rounded-2xl bg-safe/10 text-safe flex items-center justify-center mb-3">
                      <Leaf size={18} />
                    </span>
                    <p className="text-[15px] font-semibold text-ink leading-snug mb-1">{alt.name}</p>
                    <p className="text-[13px] text-ink-muted leading-snug">{alt.reason}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          <p className="text-[13px] text-ink-faint leading-relaxed">{t('disclaimer')}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar">
        <div className="flex gap-3 pb-1">
          <Pressable
            onClick={() => onToggleFavorite(item.id)}
            aria-pressed={!!item.isFavorite}
            className={`h-14 px-5 rounded-full font-semibold flex items-center gap-2 transition-colors ${
              item.isFavorite ? 'bg-coral text-white' : 'bg-white text-ink shadow-soft'
            }`}
          >
            <motion.span key={String(item.isFavorite)} initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
              <Star size={20} fill={item.isFavorite ? 'currentColor' : 'none'} />
            </motion.span>
            {item.isFavorite ? t('saved') : t('save')}
          </Pressable>
          <Pressable onClick={onScanAnother} className="flex-1 h-14 rounded-full bg-ink text-white font-semibold flex items-center justify-center gap-2 shadow-lift">
            <ScanLine size={20} /> {t('scanAnother')}
          </Pressable>
        </div>
      </div>
    </>
  );
};

export default ProductResult;

