import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Ribbon, ShieldPlus, Nut, Heart, Plus, Check, ChevronLeft } from 'lucide-react';
import { AppLanguage, HealthCondition, UserProfile } from '../types';
import { Translator, TranslationKey, optionLabel } from '../i18n';
import { IconButton, NavBar, Pressable, PrimaryButton, haptic } from './ui';

export type OnboardingMode = 'new' | 'edit' | 'symptoms';

interface Props {
  t: Translator;
  rtl: boolean;
  mode: OnboardingMode;
  language: AppLanguage;
  initial: UserProfile | null;
  defaultName: string;
  onComplete: (p: UserProfile) => void;
  onClose?: () => void;
}

const CONDITIONS: { id: HealthCondition; icon: React.ElementType; label: TranslationKey; sub: TranslationKey }[] = [
  { id: HealthCondition.PREGNANCY, icon: Baby, label: 'condPregnancy', sub: 'condPregnancySub' },
  { id: HealthCondition.ALLERGIES, icon: Nut, label: 'condAllergies', sub: 'condAllergiesSub' },
  { id: HealthCondition.AUTOIMMUNE, icon: ShieldPlus, label: 'condAutoimmune', sub: 'condAutoimmuneSub' },
  { id: HealthCondition.CANCER_CARE, icon: Ribbon, label: 'condCancer', sub: 'condCancerSub' },
  { id: HealthCondition.GENERAL_HEALTH, icon: Heart, label: 'condGeneral', sub: 'condGeneralSub' },
  { id: HealthCondition.MORE_DISEASES, icon: Plus, label: 'condOther', sub: 'condOtherSub' }
];

const SYMPTOMS = ['Nausea', 'Fatigue', 'Heartburn', 'Headache', 'Bloating', 'Skin Rash', 'Joint Pain', 'Dizziness'];

const contextOptions = (c: HealthCondition | null): string[] => {
  switch (c) {
    case HealthCondition.ALLERGIES:
      return ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Shellfish'];
    case HealthCondition.PREGNANCY:
      return ['1st Trimester', '2nd Trimester', '3rd Trimester', 'Gestational Diabetes', 'High BP'];
    case HealthCondition.AUTOIMMUNE:
      return ['Celiac Disease', "Hashimoto's", 'Rheumatoid Arthritis', 'Lupus', 'AIP Diet'];
    case HealthCondition.CANCER_CARE:
      return ['Chemotherapy', 'Radiation', 'Neutropenic', 'Mouth Sores', 'Nausea'];
    case HealthCondition.GENERAL_HEALTH:
      return ['Weight Loss', 'Muscle Gain', 'Vegan', 'Keto', 'Low Sodium', 'Acne-Prone Skin'];
    default:
      return [];
  }
};

const NOTE_PREFIX = 'Description: ';

const Onboarding: React.FC<Props> = ({ t, rtl, mode, language, initial, defaultName, onComplete, onClose }) => {
  const [step, setStep] = useState(mode === 'symptoms' ? 3 : 1);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState(initial?.name || defaultName);
  const [condition, setCondition] = useState<HealthCondition | null>(initial?.condition && initial.condition !== HealthCondition.NONE ? initial.condition : null);
  const [customName, setCustomName] = useState(initial?.customConditionName || '');
  const [notes, setNotes] = useState(initial?.additionalContext.find((c) => c.startsWith(NOTE_PREFIX))?.slice(NOTE_PREFIX.length) || '');
  const [context, setContext] = useState<string[]>(initial?.additionalContext.filter((c) => !c.startsWith(NOTE_PREFIX)) || []);
  const [symptoms, setSymptoms] = useState<string[]>(initial?.currentSymptoms || []);

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) => {
    haptic(6);
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const finish = () => {
    const isOther = condition === HealthCondition.MORE_DISEASES;
    const options = contextOptions(condition);
    onComplete({
      name: name.trim(),
      condition: condition || HealthCondition.GENERAL_HEALTH,
      language: initial?.language || language,
      customConditionName: isOther ? customName.trim() : undefined,
      additionalContext: isOther ? (notes.trim() ? [`${NOTE_PREFIX}${notes.trim()}`] : []) : context.filter((c) => options.includes(c)),
      currentSymptoms: symptoms
    });
  };

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  const next = () => {
    if (mode === 'symptoms' || step === 3) return finish();
    go(step + 1);
  };

  const canContinue =
    step === 1 ? !!condition && name.trim().length > 0 : step === 2 ? condition !== HealthCondition.MORE_DISEASES || customName.trim().length > 0 : true;

  const slide = {
    enter: (d: number) => ({ x: `${(rtl ? -1 : 1) * d * 30}%`, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: `${(rtl ? 1 : -1) * d * 30}%`, opacity: 0 })
  };

  return (
    <div className="h-full flex flex-col bg-canvas">
      {mode === 'symptoms' ? (
        <NavBar onClose={onClose} backLabel={t('back')} closeLabel={t('close')} rtl={rtl} />
      ) : (
        <div className="px-5 pt-safe pb-2">
          <div className="flex items-center justify-between h-11 mb-3">
            {step > 1 ? (
              <IconButton tone="light" label={t('back')} onClick={() => go(step - 1)}>
                <ChevronLeft size={22} className={rtl ? 'rotate-180' : ''} />
              </IconButton>
            ) : mode === 'edit' && onClose ? (
              <button onClick={onClose} className="text-[16px] font-medium text-ink-muted">
                {t('cancel')}
              </button>
            ) : (
              <span />
            )}
            <span className="text-[14px] font-medium text-ink-muted">{t('stepOf', { n: step })}</span>
            <span className="w-11" />
          </div>
          <div className="h-1.5 rounded-full bg-sage-soft overflow-hidden" dir="ltr">
            <motion.div className="h-full rounded-full bg-ink" animate={{ width: `${(step / 3) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 28 }} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar overflow-x-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="px-5 pt-5 pb-36"
          >
            {step === 1 && (
              <>
                <h1 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink">{t('ob1Title')}</h1>
                <p className="text-[16px] text-ink-muted mt-2 mb-6">{t('ob1Sub')}</p>

                <label className="block rounded-3xl bg-white shadow-soft px-4 py-3 mb-4">
                  <span className="block text-[12px] text-ink-muted mb-1">{t('yourName')}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('yourNamePh')}
                    autoComplete="given-name"
                    className="w-full bg-transparent outline-none text-[17px] text-ink placeholder:text-ink-faint"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3" role="radiogroup">
                  {CONDITIONS.map(({ id, icon: Icon, label, sub }) => {
                    const active = condition === id;
                    return (
                      <Pressable
                        key={id}
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setCondition(id);
                          if (id !== condition) setContext([]);
                        }}
                        className={`relative rounded-3xl p-4 text-start min-h-[132px] flex flex-col justify-between transition-colors ${
                          active ? 'bg-ink text-white shadow-lift' : 'bg-white text-ink shadow-soft'
                        }`}
                      >
                        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${active ? 'bg-white/15' : 'bg-sage-soft'}`}>
                          <Icon size={20} />
                        </span>
                        <span>
                          <span className="block text-[16px] font-semibold leading-tight">{t(label)}</span>
                          <span className={`block text-[12.5px] leading-snug mt-1 ${active ? 'text-white/70' : 'text-ink-muted'}`}>{t(sub)}</span>
                        </span>
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute top-3 end-3 w-6 h-6 rounded-full bg-coral flex items-center justify-center"
                            >
                              <Check size={14} strokeWidth={3} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Pressable>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink">{t('ob2Title')}</h1>
                {condition === HealthCondition.MORE_DISEASES ? (
                  <div className="mt-6 rounded-3xl bg-white shadow-soft divide-y divide-canvas">
                    <label className="block px-4 py-3">
                      <span className="block text-[12px] text-ink-muted mb-1">{t('conditionName')}</span>
                      <input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder={t('conditionNamePh')}
                        className="w-full bg-transparent outline-none text-[17px] text-ink placeholder:text-ink-faint"
                      />
                    </label>
                    <label className="block px-4 py-3">
                      <span className="block text-[12px] text-ink-muted mb-1">{t('notes')}</span>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('notesPh')}
                        rows={3}
                        className="w-full bg-transparent outline-none text-[16px] text-ink placeholder:text-ink-faint resize-none"
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <p className="text-[16px] text-ink-muted mt-2 mb-6">{t('ob2Sub')}</p>
                    <div className="rounded-3xl bg-white shadow-soft divide-y divide-canvas overflow-hidden">
                      {contextOptions(condition).map((o) => {
                        const on = context.includes(o);
                        return (
                          <Pressable
                            key={o}
                            role="checkbox"
                            aria-checked={on}
                            haptics={false}
                            onClick={() => toggle(context, setContext, o)}
                            className="w-full flex items-center justify-between px-4 h-14 text-start"
                          >
                            <span className="text-[16px] font-medium text-ink">{optionLabel(o, language)}</span>
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                on ? 'bg-ink text-white' : 'border-2 border-sage'
                              }`}
                            >
                              {on && <Check size={14} strokeWidth={3} />}
                            </span>
                          </Pressable>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink">{t('ob3Title')}</h1>
                <p className="text-[16px] text-ink-muted mt-2 mb-6">{t('ob3Sub')}</p>
                <div className="flex flex-wrap gap-2.5">
                  {SYMPTOMS.map((s) => {
                    const on = symptoms.includes(s);
                    return (
                      <Pressable
                        key={s}
                        haptics={false}
                        aria-pressed={on}
                        onClick={() => toggle(symptoms, setSymptoms, s)}
                        className={`h-11 px-4 rounded-full text-[15px] font-semibold transition-colors ${on ? 'bg-ink text-white' : 'bg-white text-ink shadow-soft'}`}
                      >
                        {optionLabel(s, language)}
                      </Pressable>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar">
        <div className="pb-1">
          <PrimaryButton onClick={next} disabled={!canContinue}>
            {mode === 'symptoms' ? t('saveChanges') : step === 3 ? (mode === 'edit' ? t('saveChanges') : t('finish')) : t('continue')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
