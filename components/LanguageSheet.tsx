import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AppLanguage } from '../types';
import { Translator, languageOptions } from '../i18n';
import { Pressable } from './ui';

const LanguageSheet: React.FC<{ t: Translator; current: AppLanguage; onPick: (l: AppLanguage) => void }> = ({ t, current, onPick }) => (
  <div className="px-5 pt-9 pb-safe">
    <h2 className="text-[22px] font-semibold text-ink mb-4">{t('language')}</h2>
    <div className="rounded-3xl bg-white shadow-soft divide-y divide-canvas overflow-hidden mb-4" role="radiogroup">
      {languageOptions.map((o) => {
        const on = o.code === current;
        return (
          <Pressable key={o.code} role="radio" aria-checked={on} onClick={() => onPick(o.code)} className="w-full flex items-center justify-between px-4 h-[60px] text-start">
            <span>
              <span className="block text-[16px] font-semibold text-ink">{o.native}</span>
              {o.native !== o.label && <span className="block text-[13px] text-ink-muted">{o.label}</span>}
            </span>
            {on && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center">
                <Check size={15} strokeWidth={3} />
              </motion.span>
            )}
          </Pressable>
        );
      })}
    </div>
  </div>
);

export default LanguageSheet;
