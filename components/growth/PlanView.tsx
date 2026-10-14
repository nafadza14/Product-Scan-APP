import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Leaf, Minus, Moon, Plus, RotateCcw, Sparkles, Sun } from 'lucide-react';
import type { AvoidKey, SkinPlan } from '../../types';
import type { Translator, TranslationKey } from '../../i18n';
import { NavBar, Pressable, PrimaryButton, SecondaryButton } from '../ui';

interface Props {
  t: Translator;
  rtl: boolean;
  plan: SkinPlan;
  /** Show the "building your plan" animation first (right after the quiz). */
  building?: boolean;
  usedSkinCheck: boolean;
  addedAvoid: AvoidKey[];
  routineApplied: boolean;
  onUseRoutine: () => void;
  onRetake: () => void;
  onContinue: () => void;
  onClose: () => void;
}

const STEPS: TranslationKey[] = ['pb1', 'pb2', 'pb3', 'pb4'];

const Building: React.FC<{ t: Translator; onDone: () => void }> = ({ t, onDone }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / 2600) * 100);
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else window.setTimeout(onDone, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-canvas" aria-live="polite" data-testid="plan-building">
      <div className="relative w-[140px] h-[140px] mb-8">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#F2F5F4" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke="#F47B45" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[30px] font-semibold text-ink tabular-nums">{Math.round(pct)}%</span>
      </div>
      <h1 className="text-[24px] font-semibold text-ink mb-5">{t('planBuilding')}</h1>
      <ul className="space-y-2.5 w-full max-w-[280px]">
        {STEPS.map((s, i) => {
          const done = pct >= (i + 1) * 25;
          return (
            <li key={s} className={`flex items-center gap-3 text-[15px] transition-colors ${done ? 'text-ink' : 'text-ink-faint'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-leaf text-white' : 'bg-mist'}`}>{done && <Check size={14} strokeWidth={3} />}</span>
              {t(s)}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; tone: string; items: string[]; t: Translator; i: number }> = ({ title, icon, tone, items, t, i }) => (
  <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="mb-5">
    <h2 className="text-[17px] font-semibold text-ink mb-2.5 flex items-center gap-2">
      <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${tone}1F`, color: tone }}>
        {icon}
      </span>
      {title}
    </h2>
    <ul className="rounded-3xl bg-mist divide-y divide-canvas overflow-hidden">
      {items.map((id) => (
        <li key={id} className="p-4">
          <p className="text-[15.5px] font-semibold text-ink">{t(`plan_${id}` as TranslationKey)}</p>
          <p className="text-[13.5px] text-ink-muted leading-snug mt-0.5">{t(`plan_${id}_d` as TranslationKey)}</p>
        </li>
      ))}
    </ul>
  </motion.section>
);

const PlanView: React.FC<Props> = ({ t, rtl, plan, building, usedSkinCheck, addedAvoid, routineApplied, onUseRoutine, onRetake, onContinue, onClose }) => {
  const [phase, setPhase] = useState<'building' | 'plan'>(building ? 'building' : 'plan');
  if (phase === 'building') return <Building t={t} onDone={() => setPhase('plan')} />;

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar" data-testid="plan-view">
        <NavBar title={t('planTitle')} onClose={onClose} backLabel={t('back')} closeLabel={t('close')} rtl={rtl} />
        <div className="px-5 pb-44">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="rounded-[28px] bg-leaf text-white p-5 mb-6">
            <p className="text-[13px] text-white/70 flex items-center gap-1.5">
              <Sparkles size={14} /> {t('planFocusLabel')}
            </p>
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] mt-1.5">{t(plan.focus as TranslationKey)}</h1>
            <p className="text-[13.5px] text-white/70 mt-2">{usedSkinCheck ? t('planBasedOnCheck') : t('planBasedOn')}</p>
          </motion.div>

          {addedAvoid.length > 0 && (
            <p className="rounded-2xl bg-peach/10 text-ink text-[14px] px-4 py-3 mb-5 leading-snug">
              {t('planAvoidAdded', { items: addedAvoid.map((k) => t(`av_${k}` as TranslationKey)).join(', ') })}
            </p>
          )}

          <Section t={t} i={0} title={t('planReduce')} icon={<Minus size={16} />} tone="#D2432F" items={plan.reduce} />
          <Section t={t} i={1} title={t('planAdd')} icon={<Plus size={16} />} tone="#2E8C68" items={plan.add} />
          <Section t={t} i={2} title={t('planAm')} icon={<Sun size={16} />} tone="#F47B45" items={plan.am} />
          <Section t={t} i={3} title={t('planPm')} icon={<Moon size={16} />} tone="#17473A" items={plan.pm} />
          <Section t={t} i={4} title={t('planHabits')} icon={<Leaf size={16} />} tone="#6BA644" items={plan.habits} />

          <Pressable haptics={false} onClick={onRetake} className="mx-auto flex items-center gap-1.5 text-[14px] font-semibold text-ink-muted h-10 px-3">
            <RotateCcw size={15} /> {t('planRetake')}
          </Pressable>
          <p className="text-[12.5px] text-ink-faint leading-relaxed mt-3">{t('planDisclaimer')}</p>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar">
        <div className="pb-1 space-y-2.5">
          {routineApplied ? (
            <SecondaryButton disabled>
              <Check size={18} /> {t('planRoutineSet')}
            </SecondaryButton>
          ) : (
            <SecondaryButton onClick={onUseRoutine}>{t('planUseRoutine')}</SecondaryButton>
          )}
          <PrimaryButton onClick={onContinue}>{t('planContinue')}</PrimaryButton>
        </div>
      </div>
    </>
  );
};

export default PlanView;
