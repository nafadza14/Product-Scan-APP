import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Leaf, Layers, CircleDot, Sun, RefreshCw } from 'lucide-react';
import { SkinScanItem, SkinType } from '../types';
import { Translator, TranslationKey } from '../i18n';
import { NavBar, Pressable, Ring, useCountUp } from './ui';

interface Props {
  t: Translator;
  rtl: boolean;
  item: SkinScanItem;
  onClose: () => void;
  onCheckAgain: () => void;
}

const TYPES: SkinType[] = ['Dry', 'Normal', 'Combination', 'Oily'];
const typeKey: Record<SkinType, TranslationKey> = { Dry: 'skinDry', Normal: 'skinNormal', Combination: 'skinCombination', Oily: 'skinOily' };

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }
});

const MetricTile: React.FC<{ label: string; value: number; icon: React.ReactNode; delay: number }> = ({ label, value, icon, delay }) => {
  const shown = useCountUp(value, delay);
  return (
    <div className="rounded-3xl bg-white p-4 min-h-[124px] flex flex-col justify-between">
      <span className="text-[14px] font-medium text-ink-soft flex items-center gap-1.5">
        {icon} {label}
      </span>
      <div className="flex items-end justify-between mt-3">
        <span className="text-[30px] leading-none font-semibold tracking-[-0.02em] text-ink tabular-nums">{shown}%</span>
        <Ring value={value} size={46} stroke={5} delay={delay} />
      </div>
    </div>
  );
};

const SkinResult: React.FC<Props> = ({ t, rtl, item, onClose, onCheckAgain }) => {
  const [scrolled, setScrolled] = useState(false);
  const typeIndex = TYPES.indexOf(item.skinType);

  const metrics: [TranslationKey, number, React.ReactNode][] = [
    ['moisture', item.metrics.moisture, <Droplets size={15} className="text-[#4BA3D9]" />],
    ['firmness', item.metrics.firmness, <Leaf size={15} className="text-safe" />],
    ['texture', item.metrics.texture, <Layers size={15} className="text-ink-muted" />],
    ['pores', item.metrics.poreVisibility, <CircleDot size={15} className="text-caution" />],
    ['evenness', item.metrics.evenness, <Sun size={15} className="text-coral" />]
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}>
        <NavBar
          title={t('skinCheck')}
          onClose={onClose}
          backLabel={t('back')}
          closeLabel={t('close')}
          scrolled={scrolled}
          rtl={rtl}
        />

        <div className="px-5 pb-40">
          <motion.h1 {...reveal(0)} className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink mb-6">
            {t('skinTitle')} <span aria-hidden>✅</span>
          </motion.h1>

          {/* Skin type */}
          <motion.section {...reveal(1)} className="rounded-3xl bg-white p-5 shadow-soft mb-3">
            <p className="text-[16px] text-ink-soft mb-3">
              {t('skinType')}: <span className="font-semibold text-ink">{t(typeKey[item.skinType])}</span>
            </p>
            <div className="flex justify-between text-[13px] font-medium mb-2" dir="ltr">
              {TYPES.map((ty, i) => (
                <span key={ty} className={i === typeIndex ? 'text-coral font-semibold' : 'text-coral-light/90'}>
                  {t(typeKey[ty])}
                </span>
              ))}
            </div>
            <div className="relative h-2.5 rounded-full bg-gradient-to-r from-[#F9C98A] via-[#F6A04D] to-coral" dir="ltr">
              <motion.span
                className="absolute top-1/2 -mt-[11px] w-[22px] h-[22px] -ml-[11px] rounded-full bg-white border-[5px] border-coral shadow-soft"
                initial={{ left: '0%' }}
                animate={{ left: `${(typeIndex / (TYPES.length - 1)) * 100}%` }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 22 }}
              />
            </div>
            {item.concerns.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {item.concerns.map((c, i) => (
                  <motion.span
                    key={c}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.06, type: 'spring', stiffness: 420, damping: 24 }}
                    className="h-9 px-4 rounded-full bg-ink text-white text-[14px] font-semibold inline-flex items-center"
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.section>

          {/* Metrics */}
          <motion.section {...reveal(2)} className="rounded-[30px] bg-sage-soft p-2 grid grid-cols-2 gap-2 mb-8">
            {metrics.map(([k, v, icon], i) => (
              <div key={k} className={i === metrics.length - 1 ? 'col-span-2' : ''}>
                <MetricTile label={t(k)} value={v} icon={icon} delay={0.3 + i * 0.08} />
              </div>
            ))}
          </motion.section>

          {item.summary && (
            <motion.section {...reveal(3)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-2.5">{t('concerns')}</h3>
              <p className="text-[16px] leading-relaxed text-ink-soft">{item.summary}</p>
            </motion.section>
          )}

          {item.routine.length > 0 && (
            <motion.section {...reveal(4)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-3">{t('routine')}</h3>
              <ol className="rounded-3xl bg-white shadow-soft divide-y divide-canvas">
                {item.routine.map((r, i) => (
                  <li key={i} className="flex gap-3.5 p-4">
                    <span className="w-8 h-8 rounded-full bg-sage-soft text-ink text-[14px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span>
                      <span className="block text-[16px] font-semibold text-ink">{r.step}</span>
                      <span className="block text-[14px] text-ink-muted leading-snug mt-0.5">{r.tip}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </motion.section>
          )}

          {(item.lookFor.length > 0 || item.avoid.length > 0) && (
            <motion.section {...reveal(5)} className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-3xl bg-white shadow-soft p-4">
                <p className="text-[15px] font-semibold text-safe mb-2">{t('lookFor')}</p>
                <ul className="space-y-1.5">
                  {item.lookFor.map((x) => (
                    <li key={x} className="text-[14px] text-ink leading-snug">{x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-white shadow-soft p-4">
                <p className="text-[15px] font-semibold text-avoid mb-2">{t('avoidIngredients')}</p>
                <ul className="space-y-1.5">
                  {item.avoid.map((x) => (
                    <li key={x} className="text-[14px] text-ink leading-snug">{x}</li>
                  ))}
                </ul>
              </div>
            </motion.section>
          )}

          <p className="text-[13px] text-ink-faint leading-relaxed">{t('skinDisclaimer')}</p>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar">
        <Pressable onClick={onCheckAgain} className="w-full h-14 mb-1 rounded-full bg-ink text-white font-semibold flex items-center justify-center gap-2 shadow-lift">
          <RefreshCw size={19} /> {t('checkAgain')}
        </Pressable>
      </div>
    </>
  );
};

export default SkinResult;
