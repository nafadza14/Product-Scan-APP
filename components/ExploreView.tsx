import React, { useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, Share2, Check } from 'lucide-react';
import { Article, UserProfile } from '../types';
import { Translator, TranslationKey, conditionLabel } from '../i18n';
import { getDailyFeed, FALLBACK_IMAGE } from '../services/articleService';
import { IconButton, Pressable } from './ui';

const catKey: Record<Article['category'], TranslationKey> = {
  Nutrition: 'catNutrition',
  Skin: 'catSkin',
  Labels: 'catLabels',
  Wellness: 'catWellness'
};

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE;
};

export const ExploreView: React.FC<{ t: Translator; user: UserProfile | null; onOpen: (a: Article) => void }> = ({ t, user, onOpen }) => {
  const articles = useMemo(() => getDailyFeed(user), [user]);
  const [featured, ...rest] = articles;

  return (
    <div className="px-5 pt-safe pb-36">
      <div className="pt-3 mb-5">
        <h1 className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-ink">{t('exploreTitle')}</h1>
        <p className="text-[16px] text-ink-muted mt-2">{t('exploreSub', { condition: conditionLabel(t, user) })}</p>
      </div>

      {featured && (
        <Pressable onClick={() => onOpen(featured)} className="block w-full text-start mb-8">
          <div className="relative h-[340px] rounded-[28px] overflow-hidden bg-sage">
            <img src={featured.image} alt="" onError={onImgError} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
            <div className="absolute top-4 start-4 h-8 px-3 rounded-full bg-white/85 backdrop-blur text-ink text-[13px] font-semibold inline-flex items-center">
              {t('featured')}
            </div>
            <div className="absolute bottom-0 inset-x-0 p-5 text-white">
              <p className="text-[13px] text-white/75 mb-1.5">
                {t(catKey[featured.category])}, {t('minRead', { n: featured.readTime })}
              </p>
              <h2 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.01em] mb-2">{featured.title}</h2>
              <p className="text-[15px] text-white/80 leading-snug line-clamp-2">{featured.summary}</p>
            </div>
          </div>
        </Pressable>
      )}

      <h3 className="text-[20px] font-semibold text-ink mb-3">{t('moreReads')}</h3>
      <div className="space-y-3">
        {rest.map((a) => (
          <Pressable key={a.id} onClick={() => onOpen(a)} className="w-full rounded-3xl bg-white p-3 flex gap-3.5 text-start shadow-soft">
            <div className="w-[92px] h-[92px] rounded-2xl overflow-hidden bg-sage shrink-0">
              <img src={a.image} alt="" loading="lazy" onError={onImgError} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <span className="flex-1 min-w-0 py-1">
              <span className="block text-[13px] text-ink-muted mb-1">
                {t(catKey[a.category])}, {t('minRead', { n: a.readTime })}
              </span>
              <span className="block text-[16px] font-semibold text-ink leading-snug line-clamp-3">{a.title}</span>
            </span>
          </Pressable>
        ))}
      </div>
    </div>
  );
};

export const ArticlePage: React.FC<{ t: Translator; rtl: boolean; article: Article; onBack: () => void }> = ({ t, rtl, article, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const imgY = useTransform(scrollY, [0, 300], [0, 90]);
  const imgScale = useTransform(scrollY, [-150, 0], [1.25, 1]);
  const barOpacity = useTransform(scrollY, [200, 260], [0, 1]);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const data = { title: article.title, text: article.summary, url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${article.title}\n${window.location.origin}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch { /* dismissed */ }
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto no-scrollbar bg-canvas">
      {/* Floating controls */}
      <div className="fixed top-0 inset-x-0 z-30 flex justify-center pointer-events-none">
        <div className="relative w-full max-w-[450px] px-5 pt-safe pb-3 flex items-center justify-between pointer-events-auto">
          <motion.div className="absolute inset-0 blur-bar" style={{ opacity: barOpacity }} />
          <IconButton tone="light" label={t('back')} onClick={onBack} className="relative">
            <ChevronLeft size={22} className={rtl ? 'rotate-180' : ''} />
          </IconButton>
          <motion.p className="relative text-[16px] font-semibold text-ink truncate px-3" style={{ opacity: barOpacity }}>
            {article.title}
          </motion.p>
          <IconButton tone="light" label={copied ? t('linkCopied') : t('share')} onClick={share} className="relative">
            {copied ? <Check size={19} /> : <Share2 size={19} />}
          </IconButton>
        </div>
      </div>

      <div className="relative h-[380px] overflow-hidden bg-sage">
        <motion.img
          src={article.image}
          alt=""
          onError={onImgError}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover origin-bottom"
          style={{ y: imgY, scale: imgScale }}
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-canvas to-transparent" />
      </div>

      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative -mt-10 px-6 pb-24"
      >
        <p className="text-[14px] text-ink-muted mb-2">
          {t(catKey[article.category])}, {t('minRead', { n: article.readTime })}
        </p>
        <h1 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink mb-4">{article.title}</h1>
        <p className="text-[18px] leading-relaxed text-ink-soft mb-6">{article.summary}</p>
        <div className="space-y-5 max-w-[62ch]">
          {article.content.map((p, i) => (
            <p key={i} className="text-[17px] leading-[1.65] text-ink">
              {p}
            </p>
          ))}
        </div>
        <p className="text-[13px] text-ink-faint leading-relaxed mt-10">{t('disclaimer')}</p>
      </motion.article>
    </div>
  );
};
