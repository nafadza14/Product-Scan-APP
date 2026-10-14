import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Infinity as InfinityIcon, LineChart, RefreshCw, Share2, X } from 'lucide-react';
import type { Translator } from '../../i18n';
import { PAYWALL_MODE, PRICES, PlanId, TRIAL_DAYS } from '../../services/billing';
import { Pressable, PrimaryButton } from '../ui';

interface Props {
  t: Translator;
  currency: 'usd' | 'idr';
  native: boolean;
  onStart: (plan: PlanId) => Promise<void>;
  onRestore?: () => Promise<void>;
  onClose: () => void;
}

const Paywall: React.FC<Props> = ({ t, currency, native, onStart, onRestore, onClose }) => {
  const [plan, setPlan] = useState<PlanId>('annual');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const prices = PRICES[currency];
  const canClose = PAYWALL_MODE === 'soft';

  const start = async () => {
    setBusy(true);
    setError(false);
    try {
      await onStart(plan);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const features = [
    { icon: LineChart, text: t('pwF1') },
    { icon: InfinityIcon, text: t('pwF2') },
    { icon: RefreshCw, text: t('pwF3') },
    { icon: Share2, text: t('pwF4') }
  ];

  const option = (id: PlanId) => {
    const on = plan === id;
    return (
      <Pressable
        key={id}
        role="radio"
        aria-checked={on}
        haptics={false}
        onClick={() => setPlan(id)}
        className={`relative w-full rounded-[22px] p-4 text-start border-2 transition-colors ${on ? 'border-ink bg-white' : 'border-transparent bg-mist'}`}
      >
        {id === 'annual' && <span className="absolute -top-2.5 end-4 h-6 px-2.5 rounded-full bg-peach text-white text-[12px] font-semibold inline-flex items-center">{t('pwBest')}</span>}
        <span className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-[16px] font-semibold text-ink">{id === 'annual' ? t('pwAnnual') : t('pwMonthly')}</span>
            <span className="block text-[13px] text-ink-muted mt-0.5">
              {id === 'annual' ? t('pwTrial', { n: TRIAL_DAYS, p: prices.annual.price }) : t('pwMonthlyNote', { p: prices.monthly.price })}
            </span>
          </span>
          <span className="text-end shrink-0">
            <span className="block text-[15px] font-semibold text-ink tabular-nums">{t('pwPerMonth', { p: prices[id].perMonth })}</span>
          </span>
        </span>
      </Pressable>
    );
  };

  return (
    <div className="h-full flex flex-col bg-canvas" data-testid="paywall">
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-safe pb-56">
        <div className="pt-3 flex justify-end h-12">
          {canClose && (
            <Pressable aria-label={t('pwLater')} onClick={onClose} className="w-10 h-10 rounded-full bg-mist text-ink-muted flex items-center justify-center">
              <X size={20} />
            </Pressable>
          )}
        </div>
        <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} src="/icon.svg" alt="" className="w-20 h-20 rounded-[24px] shadow-lift mb-5" />
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em] text-ink">{t('pwTitle')}</h1>
        <p className="text-[16px] text-ink-muted mt-2 mb-6">{t('pwSub')}</p>
        <ul className="space-y-3 mb-7">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Icon size={18} />
              </span>
              <span className="text-[15.5px] text-ink">{text}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-3" role="radiogroup">
          {option('annual')}
          {option('monthly')}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar">
        <div className="pb-1">
          {error && <p className="text-[13.5px] text-avoid text-center mb-2">{t('pwError')}</p>}
          <PrimaryButton onClick={start} disabled={busy}>
            {plan === 'annual' ? t('pwCta') : t('pwCtaMonthly')}
          </PrimaryButton>
          <p className="text-[12.5px] text-ink-muted text-center mt-2.5 flex items-center justify-center gap-1">
            <Check size={13} /> {t('pwTerms')}
          </p>
          {!native && <p className="text-[12px] text-ink-faint text-center mt-1">{t('pwTestNote')}</p>}
          <div className="flex justify-center gap-4 mt-1">
            {native && onRestore && (
              <Pressable haptics={false} onClick={() => onRestore()} className="h-9 text-[13px] font-semibold text-ink-muted">
                {t('pwRestore')}
              </Pressable>
            )}
            {canClose && (
              <Pressable haptics={false} onClick={onClose} className="h-9 text-[13px] font-semibold text-ink-muted">
                {t('pwLater')}
              </Pressable>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
