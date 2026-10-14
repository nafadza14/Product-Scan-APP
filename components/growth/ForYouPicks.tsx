import React from 'react';
import { ExternalLink, FlaskConical, Moon, ShoppingBag, Sun } from 'lucide-react';
import type { AppLanguage, SkinPlan, SkinScanItem } from '../../types';
import type { Translator, TranslationKey } from '../../i18n';
import { shopUrl } from '../../services/affiliate';

interface Props {
  t: Translator;
  lang: AppLanguage;
  latest?: SkinScanItem;
  plan?: SkinPlan;
}

/** Ingredients from the latest skin check and product types from the plan, each with a labelled shop link. */
const ForYouPicks: React.FC<Props> = ({ t, lang, latest, plan }) => {
  const ingredients = (latest?.lookFor || []).slice(0, 5);
  const routine = plan ? [...plan.am.map((id) => ({ id, time: 'am' as const })), ...plan.pm.map((id) => ({ id, time: 'pm' as const }))].filter((r) => !/cleanser|rinse/.test(r.id)) : [];
  if (!ingredients.length && !routine.length) {
    return (
      <div className="px-5 mb-6">
        <p className="rounded-3xl bg-mist p-4 text-[14px] text-ink-muted leading-snug">{t('picksEmpty')}</p>
      </div>
    );
  }
  const shop = (query: string, label: string) => (
    <a
      href={shopUrl(query, lang)}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`${t('shop')}: ${label}`}
      className="h-9 px-3.5 rounded-full bg-ink text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shrink-0"
    >
      <ShoppingBag size={14} /> {t('shop')}
    </a>
  );
  return (
    <div className="px-5 mb-7" data-testid="for-you-picks">
      {ingredients.length > 0 && (
        <>
          <h2 className="text-[19px] font-semibold text-ink mb-3">{t('picksTitle')}</h2>
          <ul className="rounded-3xl bg-mist divide-y divide-canvas overflow-hidden mb-5">
            {ingredients.map((ing) => (
              <li key={ing} className="p-3.5 flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                  <FlaskConical size={18} />
                </span>
                <span className="flex-1 min-w-0 text-[15px] font-semibold text-ink">{ing}</span>
                {shop(`${ing} skincare`, ing)}
              </li>
            ))}
          </ul>
        </>
      )}
      {routine.length > 0 && (
        <>
          <h2 className="text-[19px] font-semibold text-ink mb-3">{t('picksRoutine')}</h2>
          <ul className="rounded-3xl bg-mist divide-y divide-canvas overflow-hidden mb-3">
            {routine.map((r) => {
              const name = t(`plan_${r.id}` as TranslationKey);
              return (
                <li key={r.id} className="p-3.5 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-peach/10 text-peach flex items-center justify-center shrink-0">{r.time === 'am' ? <Sun size={18} /> : <Moon size={18} />}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold text-ink">{name}</span>
                    <span className="block text-[12.5px] text-ink-muted truncate">{t(`plan_${r.id}_d` as TranslationKey)}</span>
                  </span>
                  {shop(name, name)}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="text-[12px] text-ink-faint leading-snug flex gap-1.5">
        <ExternalLink size={13} className="shrink-0 mt-0.5" /> {t('affiliateNote')}
      </p>
    </div>
  );
};

export default ForYouPicks;
