import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, Share2, Check, ExternalLink } from 'lucide-react';
import { AppLanguage, Article, FeedItem, SkinGoal, UserProfile } from '../types';
import { Translator, TranslationKey, conditionLabel, optionLabel, timeAgo } from '../i18n';
import { getDailyFeed, FALLBACK_IMAGE } from '../services/articleService';
import { Chip, IconButton, Pressable } from './ui';

const catKey: Record<Article['category'], TranslationKey> = {
  Nutrition: 'catNutrition',
  Skin: 'catSkin',
  Labels: 'catLabels',
  Wellness: 'catWellness'
};

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE;
};

const CAT_KEYS: Record<string, TranslationKey> = {
  Skin: 'catSkin',
  Nutrition: 'catNutrition',
  Labels: 'catLabels',
  Wellness: 'catWellness',
  Pregnancy: 'catPregnancy',
  Allergies: 'catAllergies',
  Immunity: 'catImmunity',
  'Cancer care': 'catCancer'
};

// RSS items rarely carry images, so each category gets a small set of calm photos.
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;
const CAT_IMAGES: Record<string, string[]> = {
  Skin: ['photo-1570172619644-dfd03ed5d881', 'photo-1556228578-8c89e6adf883', 'photo-1598440947619-2c35fc9aa908', 'photo-1608248597279-f99d160bfcbc'],
  Nutrition: ['photo-1512621776951-a57141f2eefd', 'photo-1490645935967-10de6ba17061', 'photo-1546069901-ba9599a7e63c', 'photo-1498837167922-ddd27525d352'],
  Pregnancy: ['photo-1519689680058-324335c77eba', 'photo-1555820585-c5ae44394b79', 'photo-1531983412531-1f49a365ffed'],
  Allergies: ['photo-1610832958506-aa56368176cf', 'photo-1542838132-92c53300491e', 'photo-1505253758473-96b701d36dec'],
  Immunity: ['photo-1505751172876-fa1923c5c528', 'photo-1576091160399-112ba8d25d1d', 'photo-1584362917165-526a968579e8'],
  'Cancer care': ['photo-1559839734-2b71ea197ec2', 'photo-1532938911079-1b06ac7ceec7', 'photo-1505253758473-96b701d36dec'],
  Wellness: ['photo-1544367563-12123d8965cd', 'photo-1506126613408-eca07ce68773', 'photo-1499209974431-2761e2523676', 'photo-1447452001602-7090c774637d'],
  Labels: ['photo-1542838132-92c53300491e', 'photo-1610832958506-aa56368176cf']
};
export const feedImage = (it: FeedItem) => {
  if (it.image) return it.image;
  const list = CAT_IMAGES[it.category] || CAT_IMAGES.Wellness;
  let h = 0;
  for (let i = 0; i < it.id.length; i++) h = (h * 31 + it.id.charCodeAt(i)) | 0;
  return u(list[Math.abs(h) % list.length]);
};

const GOAL_KEYS: Record<string, TranslationKey> = {
  clearBreakouts: 'goalClearBreakouts',
  evenTone: 'goalEvenTone',
  hydration: 'goalHydration',
  calmRedness: 'goalCalmRedness',
  smoothTexture: 'goalSmoothTexture',
  firmness: 'goalFirmness',
  minimizePores: 'goalMinimizePores'
};
const CONDITION_KEYS: Record<string, TranslationKey> = {
  Pregnancy: 'condPregnancy',
  'Cancer Care': 'condCancer',
  Autoimmune: 'condAutoimmune',
  Allergies: 'condAllergies',
  'General Health': 'condGeneral'
};
export const reasonLabel = (t: Translator, lang: AppLanguage, r: string | null) =>
  !r ? null : GOAL_KEYS[r] ? t(GOAL_KEYS[r]) : CONDITION_KEYS[r] ? t(CONDITION_KEYS[r]) : optionLabel(r, lang);

const FEED_CACHE = 'vitalSense_feed';

const useFeed = (user: UserProfile | null, goals: SkinGoal[]) => {
  const params = useMemo(() => {
    const q = new URLSearchParams({
      condition: user?.condition || 'General Health',
      details: (user?.additionalContext || []).filter((c) => !c.startsWith('Description:')).join('|'),
      symptoms: (user?.currentSymptoms || []).join('|'),
      goals: goals.join('|'),
      custom: user?.customConditionName ? user.customConditionName.split(/[\s,]+/).join('|') : '',
      lang: user?.language || 'en'
    });
    return q.toString();
  }, [user, goals]);

  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; items: FeedItem[]; sources: string[]; at: number }>(() => {
    try {
      const c = JSON.parse(localStorage.getItem(FEED_CACHE) || 'null');
      if (c && c.params === params && Date.now() - c.at < 6 * 3600000) return { status: 'ready', items: c.items, sources: c.sources, at: c.at };
    } catch { /* ignore */ }
    return { status: 'loading', items: [], sources: [], at: 0 };
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    fetch(`/api/feed?${params}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!alive) return;
        const items: FeedItem[] = Array.isArray(d.items) ? d.items : [];
        if (!items.length) throw new Error('empty');
        setState({ status: 'ready', items, sources: d.sources || [], at: d.generatedAt || Date.now() });
        try {
          localStorage.setItem(FEED_CACHE, JSON.stringify({ params, at: d.generatedAt || Date.now(), items: items.slice(0, 240), sources: d.sources || [] }));
        } catch { /* storage full */ }
      })
      .catch(() => alive && setState((s) => (s.items.length ? s : { ...s, status: 'error' })));
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [params, nonce]);

  return { ...state, retry: () => setNonce((n) => n + 1) };
};

export const ExploreView: React.FC<{
  t: Translator;
  user: UserProfile | null;
  goals: SkinGoal[];
  onOpen: (a: Article) => void;
  onOpenFeed: (f: FeedItem) => void;
}> = ({ t, user, goals, onOpen, onOpenFeed }) => {
  const lang = user?.language || AppLanguage.EN;
  const guides = useMemo(() => getDailyFeed(user), [user]);
  const feed = useFeed(user, goals);
  const [cat, setCat] = useState<string>('all');
  const [shown, setShown] = useState(20);
  const sentinel = useRef<HTMLDivElement>(null);

  const cats = useMemo(() => {
    const count = new Map<string, number>();
    feed.items.forEach((i) => count.set(i.category, (count.get(i.category) || 0) + 1));
    return Array.from(count.entries()).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [feed.items]);
  const list = cat === 'all' ? feed.items : feed.items.filter((i) => i.category === cat);
  const [featured, ...rest] = list;

  useEffect(() => setShown(20), [cat]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setShown((n) => Math.min(n + 20, list.length)), { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length]);

  const locale = lang === AppLanguage.ZH ? 'zh-CN' : lang;
  const ago = (ts: number) => (ts ? timeAgo(t, ts) : '');
  const when = feed.at ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(feed.at) : '';

  const meta = (it: FeedItem) => [t(CAT_KEYS[it.category] || 'catWellness'), it.source, ago(it.date)].filter(Boolean).join(', ');

  return (
    <div className="pt-safe pb-36">
      <div className="px-5 pt-3 mb-4">
        <h1 className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-ink">{t('exploreTitle')}</h1>
        <p className="text-[16px] text-ink-muted mt-2">{t('exploreSub', { condition: conditionLabel(t, user) })}</p>
        {feed.status === 'ready' && (
          <p className="text-[13px] text-ink-faint mt-1">{t('feedCount', { n: feed.items.length, s: feed.sources.length, t: when })}</p>
        )}
      </div>

      {feed.items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-4">
          <Chip active={cat === 'all'} onClick={() => setCat('all')}>
            {t('feedForYou')}
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {t(CAT_KEYS[c] || 'catWellness')}
            </Chip>
          ))}
        </div>
      )}

      <div className="px-5">
        {feed.status === 'loading' && feed.items.length === 0 && (
          <div aria-busy="true">
            <div className="h-[300px] rounded-[28px] skeleton mb-4" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[112px] rounded-3xl skeleton mb-3" />
            ))}
          </div>
        )}

        {feed.status === 'error' && feed.items.length === 0 && (
          <div className="rounded-3xl bg-white shadow-soft p-4 mb-6 flex items-center gap-3">
            <p className="flex-1 text-[14px] text-ink-muted leading-snug">{t('feedLoadingError')}</p>
            <Pressable onClick={feed.retry} className="h-10 px-4 rounded-full bg-ink text-white text-[14px] font-semibold shrink-0">
              {t('feedRetry')}
            </Pressable>
          </div>
        )}

        {featured && (
          <Pressable onClick={() => onOpenFeed(featured)} className="block w-full text-start mb-5">
            <div className="relative h-[320px] rounded-[28px] overflow-hidden bg-sage">
              <img src={feedImage(featured)} alt="" onError={onImgError} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              {reasonLabel(t, lang, featured.reason) && (
                <div className="absolute top-4 start-4 max-w-[80%] h-8 px-3 rounded-full bg-white/90 backdrop-blur text-ink text-[13px] font-semibold inline-flex items-center truncate">
                  {t('feedBecause', { x: reasonLabel(t, lang, featured.reason)! })}
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                <p className="text-[13px] text-white/75 mb-1.5">{meta(featured)}</p>
                <h2 className="text-[22px] leading-[1.18] font-semibold tracking-[-0.01em] mb-2 line-clamp-3">{featured.title}</h2>
                <p className="text-[14.5px] text-white/80 leading-snug line-clamp-2">{featured.summary}</p>
              </div>
            </div>
          </Pressable>
        )}

        {cat === 'all' && guides.length > 0 && (
          <section className="mb-6">
            <h3 className="text-[20px] font-semibold text-ink mb-3">{t('feedQuickGuides')}</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory pb-1">
              {guides.slice(0, 6).map((a) => (
                <Pressable key={a.id} onClick={() => onOpen(a)} className="snap-start shrink-0 w-[220px] rounded-3xl bg-white shadow-soft overflow-hidden text-start">
                  <img src={a.image} alt="" loading="lazy" onError={onImgError} referrerPolicy="no-referrer" className="w-full h-[110px] object-cover" />
                  <span className="block p-3">
                    <span className="block text-[12.5px] text-ink-muted mb-1">{t('minRead', { n: a.readTime })}</span>
                    <span className="block text-[15px] font-semibold text-ink leading-snug line-clamp-2">{a.title}</span>
                  </span>
                </Pressable>
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <ul className="space-y-3">
            {rest.slice(0, shown).map((it) => {
              const why = reasonLabel(t, lang, it.reason);
              return (
                <li key={it.id}>
                  <Pressable onClick={() => onOpenFeed(it)} className="w-full rounded-3xl bg-white p-3 flex gap-3.5 text-start shadow-soft">
                    <div className="w-[92px] h-[92px] rounded-2xl overflow-hidden bg-sage shrink-0">
                      <img src={feedImage(it)} alt="" loading="lazy" onError={onImgError} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                    <span className="flex-1 min-w-0 py-0.5">
                      <span className="block text-[12.5px] text-ink-muted mb-1 truncate">{meta(it)}</span>
                      <span className="block text-[15.5px] font-semibold text-ink leading-snug line-clamp-3">{it.title}</span>
                      {why && <span className="inline-flex mt-1.5 h-6 px-2.5 rounded-full bg-coral/10 text-coral text-[12px] font-semibold items-center max-w-full truncate">{t('feedBecause', { x: why })}</span>}
                    </span>
                  </Pressable>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={sentinel} />
        {shown < rest.length && (
          <Pressable onClick={() => setShown((n) => n + 20)} className="w-full h-12 mt-4 rounded-full bg-white text-ink font-semibold shadow-soft">
            {t('feedShowMore')}
          </Pressable>
        )}

        {feed.status === 'error' && feed.items.length === 0 && (
          <ul className="space-y-3">
            {guides.map((a) => (
              <li key={a.id}>
                <Pressable onClick={() => onOpen(a)} className="w-full rounded-3xl bg-white p-3 flex gap-3.5 text-start shadow-soft">
                  <div className="w-[92px] h-[92px] rounded-2xl overflow-hidden bg-sage shrink-0">
                    <img src={a.image} alt="" loading="lazy" onError={onImgError} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <span className="flex-1 min-w-0 py-1">
                    <span className="block text-[13px] text-ink-muted mb-1">{t('minRead', { n: a.readTime })}</span>
                    <span className="block text-[16px] font-semibold text-ink leading-snug line-clamp-3">{a.title}</span>
                  </span>
                </Pressable>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const FeedArticlePage: React.FC<{ t: Translator; rtl: boolean; lang: AppLanguage; item: FeedItem; onBack: () => void }> = ({ t, rtl, lang, item, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const imgY = useTransform(scrollY, [0, 300], [0, 80]);
  const barOpacity = useTransform(scrollY, [160, 220], [0, 1]);
  const [copied, setCopied] = useState(false);
  const why = reasonLabel(t, lang, item.reason);
  const locale = lang === AppLanguage.ZH ? 'zh-CN' : lang;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: item.title, url: item.link });
      else {
        await navigator.clipboard.writeText(`${item.title}\n${item.link}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch { /* dismissed */ }
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto no-scrollbar bg-canvas">
      <div className="fixed top-0 inset-x-0 z-30 flex justify-center pointer-events-none">
        <div className="relative w-full max-w-[450px] px-5 pt-safe pb-3 flex items-center justify-between pointer-events-auto">
          <motion.div className="absolute inset-0 blur-bar" style={{ opacity: barOpacity }} />
          <IconButton tone="light" label={t('back')} onClick={onBack} className="relative">
            <ChevronLeft size={22} className={rtl ? 'rotate-180' : ''} />
          </IconButton>
          <motion.p className="relative text-[16px] font-semibold text-ink truncate px-3" style={{ opacity: barOpacity }}>
            {item.source}
          </motion.p>
          <IconButton tone="light" label={copied ? t('linkCopied') : t('share')} onClick={share} className="relative">
            {copied ? <Check size={19} /> : <Share2 size={19} />}
          </IconButton>
        </div>
      </div>

      <div className="relative h-[300px] overflow-hidden bg-sage">
        <motion.img src={feedImage(item)} alt="" onError={onImgError} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" style={{ y: imgY }} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" />
      </div>

      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative -mt-8 px-6 pb-24"
      >
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="h-7 px-3 rounded-full bg-white text-ink text-[12.5px] font-semibold inline-flex items-center shadow-soft">{t(CAT_KEYS[item.category] || 'catWellness')}</span>
          {item.lang !== lang && <span className="h-7 px-3 rounded-full bg-sage-soft text-ink text-[12.5px] font-semibold inline-flex items-center">{item.lang === 'en' ? t('feedInEnglish') : item.lang.toUpperCase()}</span>}
          {why && <span className="h-7 px-3 rounded-full bg-coral/10 text-coral text-[12.5px] font-semibold inline-flex items-center">{t('feedBecause', { x: why })}</span>}
        </div>
        <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink mb-2">{item.title}</h1>
        <p className="text-[14px] text-ink-muted mb-5">
          {item.source}
          {item.date ? `, ${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(item.date)}` : ''}
        </p>
        {item.summary && <p className="text-[18px] leading-[1.6] text-ink mb-6 max-w-[62ch]">{item.summary}</p>}
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 h-14 rounded-full bg-ink text-white font-semibold shadow-lift active:scale-[0.98] transition-transform"
        >
          {t('feedReadOriginal', { source: item.source })} <ExternalLink size={18} />
        </a>
        <p className="text-[13px] text-ink-faint leading-relaxed mt-4">{t('feedSourceNote', { source: item.source })}</p>
        <p className="text-[13px] text-ink-faint leading-relaxed mt-2">{t('disclaimer')}</p>
      </motion.article>
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
