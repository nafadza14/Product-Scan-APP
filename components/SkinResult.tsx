import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Leaf, Layers, CircleDot, Sun, RefreshCw, Camera, Target, Check, ListChecks, Lock } from 'lucide-react';
import { SkinScanItem, SkinType, SkinZoneId } from '../types';
import { Translator, TranslationKey } from '../i18n';
import { NavBar, Pressable, Ring, useCountUp } from './ui';
import { scoreOf } from '../services/diaryService';
import { CONCERN_KEYS, FaceMap, SEV_COLORS, SEV_KEYS, Thumb, ZONE_KEYS, scoreColor } from './diary/shared';

interface Props {
  t: Translator;
  rtl: boolean;
  item: SkinScanItem;
  previous?: SkinScanItem;
  routineSaved?: boolean;
  onClose: () => void;
  onCheckAgain: () => void;
  onUseRoutine?: () => void;
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

const SkinResult: React.FC<Props> = ({ t, rtl, item, previous, routineSaved, onClose, onCheckAgain, onUseRoutine }) => {
  const [scrolled, setScrolled] = useState(false);
  const [zone, setZone] = useState<SkinZoneId | null>(null);
  const score = scoreOf(item);
  const shownScore = useCountUp(score, 0.3);
  const delta = previous ? score - scoreOf(previous) : null;
  const q = item.quality;
  const lowQuality = q && (q.confidence < 65 || q.lighting !== 'good' || !q.sharp || !q.frontal);
  const reason: TranslationKey = !q
    ? 'reasonGeneric'
    : !q.sharp
      ? 'reasonBlur'
      : !q.frontal
        ? 'reasonAngle'
        : q.lighting === 'dim'
          ? 'reasonDim'
          : q.lighting === 'harsh'
            ? 'reasonHarsh'
            : q.lighting === 'uneven'
              ? 'reasonUneven'
              : 'reasonGeneric';
  const zoneScores = Object.fromEntries((item.zones || []).map((z) => [z.zone, z.score])) as Partial<Record<SkinZoneId, number>>;
  const concerns = [...(item.concernDetails || [])].sort((a, b) => b.severity - a.severity);
  const am = item.routine.filter((r) => r.time !== 'pm');
  const pm = item.routine.filter((r) => r.time === 'pm');
  const hasTimes = item.routine.some((r) => r.time);
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
          <motion.h1 {...reveal(0)} className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink mb-5">
            {t('skinTitle')} <span aria-hidden>✅</span>
          </motion.h1>

          {/* Score hero */}
          <motion.section {...reveal(0)} className="rounded-[28px] bg-ink text-white p-4 mb-3 flex items-center gap-4">
            <Thumb photoId={item.photoId} className="w-[84px] h-[104px] rounded-2xl shrink-0" label={t('noPhoto')} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-white/70">{t('skinScoreLabel')}</p>
              <p className="text-[46px] leading-none font-semibold tracking-[-0.02em] tabular-nums mt-1">{shownScore}</p>
              <p className="text-[13.5px] mt-2" style={{ color: delta === null ? 'rgba(255,255,255,.7)' : delta > 0 ? '#7FD6AE' : delta < 0 ? '#F4A38F' : 'rgba(255,255,255,.7)' }}>
                {delta === null ? t('firstCheck') : delta === 0 ? t('sinceLastSame') : delta > 0 ? t('sinceLastUp', { n: delta }) : t('sinceLastDown', { n: delta })}
              </p>
            </div>
            <Ring value={score} size={64} stroke={7} track="rgba(255,255,255,.15)" delay={0.3} />
          </motion.section>

          {/* Photo quality */}
          {q && (
            <motion.div
              {...reveal(1)}
              className={`rounded-2xl px-4 py-3 mb-3 flex gap-3 items-start ${lowQuality ? 'bg-caution/10' : 'bg-safe/10'}`}
              role={lowQuality ? 'status' : undefined}
            >
              <span className={`mt-0.5 ${lowQuality ? 'text-caution' : 'text-safe'}`}>{lowQuality ? <Camera size={18} /> : <Check size={18} />}</span>
              <p className="text-[14px] text-ink leading-snug flex-1">
                {lowQuality ? t('qualityLow', { reason: t(reason) }) : t('qualityGood')}{' '}
                <span className="text-ink-muted tabular-nums">{t('confidence', { n: q.confidence })}</span>
              </p>
            </motion.div>
          )}

          {item.topPriority && (
            <motion.section {...reveal(1)} className="rounded-3xl bg-coral/10 p-4 mb-3 flex gap-3">
              <span className="w-9 h-9 rounded-xl bg-coral text-white flex items-center justify-center shrink-0">
                <Target size={18} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-coral">{t('topPriority')}</p>
                <p className="text-[15.5px] text-ink leading-snug mt-0.5">{item.topPriority}</p>
              </div>
            </motion.section>
          )}

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

          {item.zones && item.zones.length > 0 && (
            <motion.section {...reveal(3)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-3">{t('zonesTitle')}</h3>
              <div className="rounded-3xl bg-white shadow-soft p-4">
                <div className="flex gap-4 items-start">
                  <div className="w-[120px] shrink-0">
                    <FaceMap scores={zoneScores} active={zone} onPick={(z) => setZone((cur) => (cur === z ? null : z))} />
                  </div>
                  <ul className="flex-1 min-w-0 space-y-1">
                    {item.zones.map((z) => (
                      <li key={z.zone}>
                        <button
                          onClick={() => setZone((cur) => (cur === z.zone ? null : z.zone))}
                          aria-pressed={zone === z.zone}
                          className={`w-full flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-start transition-colors ${zone === z.zone ? 'bg-sage-soft' : ''}`}
                        >
                          <span className="text-[14px] text-ink truncate">{t(ZONE_KEYS[z.zone])}</span>
                          <span className="text-[14px] font-semibold tabular-nums" style={{ color: scoreColor(z.score) }}>
                            {z.score}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[14.5px] text-ink-soft leading-snug mt-3 min-h-[2.6em]">
                  {zone ? item.zones.find((z) => z.zone === zone)?.note : item.zones.slice().sort((a, b) => a.score - b.score)[0]?.note}
                </p>
              </div>
            </motion.section>
          )}

          {concerns.length > 0 && (
            <motion.section {...reveal(3)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-3">{t('concernLevels')}</h3>
              <ul className="rounded-3xl bg-white shadow-soft divide-y divide-canvas">
                {concerns.map((c, i) => (
                  <li key={c.id} className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-[15.5px] font-semibold text-ink">{t(CONCERN_KEYS[c.id])}</span>
                      <span className="text-[13px] font-semibold" style={{ color: SEV_COLORS[c.severity] }}>
                        {t(SEV_KEYS[c.severity])}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-2" aria-hidden>
                      {[1, 2, 3].map((n) => (
                        <motion.span
                          key={n}
                          className="h-1.5 flex-1 rounded-full origin-left"
                          style={{ background: n <= c.severity ? SEV_COLORS[c.severity] : '#E4EBE9' }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.4 + i * 0.05 + n * 0.06, duration: 0.35 }}
                        />
                      ))}
                    </div>
                    {c.severity > 0 && c.note && <p className="text-[14px] text-ink-muted leading-snug">{c.note}</p>}
                    {c.severity > 0 && c.zones.length > 0 && (
                      <p className="text-[12.5px] text-ink-faint mt-1">{c.zones.map((z) => t(ZONE_KEYS[z])).join(', ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {item.summary && (
            <motion.section {...reveal(3)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-2.5">{t('concerns')}</h3>
              <p className="text-[16px] leading-relaxed text-ink-soft">{item.summary}</p>
            </motion.section>
          )}

          {item.routine.length > 0 && (
            <motion.section {...reveal(4)} className="mb-8">
              <h3 className="text-[19px] font-semibold text-ink mb-3">{t('routine')}</h3>
              {(hasTimes ? ([['am', am], ['pm', pm]] as const) : ([['all', item.routine]] as const)).map(([time, steps]) =>
                steps.length ? (
                  <div key={time} className="mb-3">
                    {time !== 'all' && <p className="text-[14px] font-semibold text-ink-muted mb-2 px-1">{time === 'am' ? `☀️ ${t('routineAm')}` : `🌙 ${t('routinePm')}`}</p>}
                    <ol className="rounded-3xl bg-white shadow-soft divide-y divide-canvas">
                      {steps.map((r, i) => (
                        <li key={i} className="flex gap-3.5 p-4">
                          <span className="w-8 h-8 rounded-full bg-sage-soft text-ink text-[14px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="min-w-0">
                            <span className="block text-[16px] font-semibold text-ink">{r.step}</span>
                            {r.ingredient && <span className="inline-flex mt-1 h-6 px-2.5 rounded-full bg-safe/10 text-safe text-[12.5px] font-semibold items-center">{r.ingredient}</span>}
                            <span className="block text-[14px] text-ink-muted leading-snug mt-1">{r.tip}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null
              )}
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
          {item.photoId && (
            <p className="text-[13px] text-ink-faint leading-relaxed mt-2 flex items-center gap-1.5">
              <Lock size={13} /> {t('photoPrivate')}
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar">
        <div className="flex gap-3 mb-1">
          <Pressable onClick={onCheckAgain} aria-label={t('checkAgain')} className="h-14 w-14 shrink-0 rounded-full bg-white text-ink flex items-center justify-center shadow-soft">
            <RefreshCw size={20} />
          </Pressable>
          {onUseRoutine && item.routine.length > 0 ? (
            <Pressable
              onClick={onUseRoutine}
              disabled={routineSaved}
              className={`flex-1 h-14 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lift transition-colors ${routineSaved ? 'bg-safe text-white !opacity-100' : 'bg-ink text-white'}`}
            >
              {routineSaved ? <Check size={19} /> : <ListChecks size={19} />} {routineSaved ? t('routineInDiary') : t('useAsRoutine')}
            </Pressable>
          ) : (
            <Pressable onClick={onCheckAgain} className="flex-1 h-14 rounded-full bg-ink text-white font-semibold flex items-center justify-center gap-2 shadow-lift">
              {t('checkAgain')}
            </Pressable>
          )}
        </div>
      </div>
    </>
  );
};

export default SkinResult;
