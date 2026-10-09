import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLanguage, Article, ScanHistoryItem, ScanMode, SkinScanItem, UserProfile } from './types';
import { makeT } from './i18n';
import { supabase } from './services/supabaseClient';
import {
  addScanResult,
  cacheHistory,
  cacheProfile,
  getCachedHistory,
  getCachedProfile,
  getFavoriteIds,
  getScanHistory,
  getSkinHistory,
  getUserProfile,
  saveSkinHistory,
  setFavoriteIds,
  updateUserProfile
} from './services/dbService';
import { checkAiConfigured } from './services/config';
import HomeView from './components/HomeView';
import { ExploreView, ArticlePage } from './components/ExploreView';
import LibraryView from './components/LibraryView';
import ProfileView from './components/ProfileView';
import TabBar, { Tab } from './components/TabBar';
import Scanner from './components/Scanner';
import ProductResult from './components/ProductResult';
import SkinResult from './components/SkinResult';
import Auth from './components/Auth';
import Onboarding, { OnboardingMode } from './components/Onboarding';
import LanguageSheet from './components/LanguageSheet';
import { PushPage, Sheet, IOS_EASE, sheetTransition } from './components/ui';

type Overlay =
  | { k: 'scanner'; mode: ScanMode }
  | { k: 'product'; id: string }
  | { k: 'skin'; id: string }
  | { k: 'article'; article: Article }
  | { k: 'language' }
  | { k: 'auth'; mode: 'signin' | 'signup' }
  | { k: 'onboarding'; mode: OnboardingMode };

const presentation = (o: Overlay): 'push' | 'sheet' | 'full' =>
  o.k === 'article' ? 'push' : o.k === 'scanner' || (o.k === 'onboarding' && o.mode === 'new') ? 'full' : 'sheet';

const LANG_KEY = 'vitalSense_lang';

const detectLanguage = (): AppLanguage => {
  try {
    const saved = localStorage.getItem(LANG_KEY) as AppLanguage | null;
    if (saved && Object.values(AppLanguage).includes(saved)) return saved;
  } catch { /* storage blocked */ }
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('id') || nav.startsWith('ms')) return AppLanguage.ID;
  if (nav.startsWith('ar')) return AppLanguage.AR;
  if (nav.startsWith('fr')) return AppLanguage.FR;
  if (nav.startsWith('zh')) return AppLanguage.ZH;
  return AppLanguage.EN;
};

const App: React.FC = () => {
  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();
  const [metaName, setMetaName] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [skinHistory, setSkinHistory] = useState<SkinScanItem[]>([]);
  const [deviceLang, setDeviceLang] = useState<AppLanguage>(detectLanguage);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [tab, setTab] = useState<Tab>('home');
  const [overlays, setOverlays] = useState<Overlay[]>([]);

  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const lang = user?.language || deviceLang;
  const t = useMemo(() => makeT(lang), [lang]);
  const rtl = lang === AppLanguage.AR;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [lang, rtl]);

  // ---------- Overlay stack, mirrored into browser history so the system back gesture works ----------

  useEffect(() => {
    window.history.replaceState({ ov: 0 }, '');
    const onPop = (e: PopStateEvent) => {
      const depth = typeof e.state?.ov === 'number' ? e.state.ov : 0;
      setOverlays((prev) => prev.slice(0, depth));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const open = useCallback((o: Overlay) => {
    const next = [...overlaysRef.current, o];
    overlaysRef.current = next;
    setOverlays(next);
    window.history.pushState({ ov: next.length }, '');
  }, []);

  const close = useCallback(() => {
    if ((window.history.state?.ov ?? 0) > 0 && (window.history.state?.ov ?? 0) === overlaysRef.current.length) {
      window.history.back();
    } else {
      const next = overlaysRef.current.slice(0, -1);
      overlaysRef.current = next;
      setOverlays(next);
    }
  }, []);

  const replaceTop = useCallback((o: Overlay) => {
    const next = [...overlaysRef.current.slice(0, -1), o];
    overlaysRef.current = next;
    setOverlays(next);
  }, []);

  const closeAll = useCallback(() => {
    const n = overlaysRef.current.length;
    if (!n) return;
    if ((window.history.state?.ov ?? 0) === n) window.history.go(-n);
    else {
      overlaysRef.current = [];
      setOverlays([]);
    }
  }, []);

  // ---------- Session & data ----------

  const loadUser = useCallback(
    async (id: string, mail?: string, nameFromMeta?: string) => {
      setUserId(id);
      setEmail(mail);
      setMetaName(nameFromMeta || '');
      const cached = getCachedProfile(id);
      if (cached) setUser(cached);
      setHistory(getCachedHistory(id));
      setSkinHistory(getSkinHistory(id));

      const profile = await getUserProfile(id);
      if (userIdRef.current !== id) return;
      if (profile) {
        const merged = { ...profile, name: profile.name || nameFromMeta || '' };
        setUser(merged);
        cacheProfile(id, merged);
      } else if (!cached) {
        setUser(null);
        open({ k: 'onboarding', mode: 'new' });
      }
      const remote = await getScanHistory(id);
      if (userIdRef.current === id) setHistory(remote);
    },
    [open]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      checkAiConfigured().then(setHasApiKey);
      try {
        const { data } = await supabase.auth.getSession();
        const s = data.session;
        if (s?.user && mounted) {
          userIdRef.current = s.user.id;
          await Promise.race([
            loadUser(s.user.id, s.user.email, s.user.user_metadata?.full_name || s.user.user_metadata?.name),
            new Promise((r) => setTimeout(r, 2500))
          ]);
        }
      } finally {
        if (mounted) setBooting(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user && session.user.id !== userIdRef.current) {
        userIdRef.current = session.user.id;
        // Close the sign-in sheet first, then load (which may open onboarding).
        closeAll();
        setTimeout(() => loadUser(session.user.id, session.user.email, session.user.user_metadata?.full_name || session.user.user_metadata?.name), 50);
        setTab('home');
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        setUserId(null);
        setUser(null);
        setEmail(undefined);
        setHistory([]);
        setSkinHistory([]);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUser, closeAll]);

  const saveProfile = async (p: UserProfile) => {
    setUser(p);
    if (userId) await updateUserProfile(userId, p);
  };

  const changeLanguage = (l: AppLanguage) => {
    setDeviceLang(l);
    try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
    if (user && userId) {
      const p = { ...user, language: l };
      setUser(p);
      cacheProfile(userId, p);
    }
    setTimeout(close, 180);
  };

  const toggleFavorite = (id: string) => {
    if (!userId) return;
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h));
      setFavoriteIds(userId, new Set(next.filter((h) => h.isFavorite).map((h) => h.id)));
      cacheHistory(userId, next);
      return next;
    });
  };

  // ---------- Scanning ----------

  const startScan = async (mode: ScanMode) => {
    if (!userId) return open({ k: 'auth', mode: 'signup' });
    if (!user) return open({ k: 'onboarding', mode: 'new' });
    open({ k: 'scanner', mode });
  };

  const analyze = useCallback(
    async (mode: ScanMode, base64: string) => {
      if (!user || !userId) throw new Error('No profile');
      const svc = await import('./services/aiService');
      if (mode === 'product') {
        const result = await svc.analyzeImage(base64, user);
        const item: ScanHistoryItem = { ...result, id: crypto.randomUUID(), timestamp: Date.now(), isFavorite: false };
        setHistory((prev) => {
          const next = [item, ...prev];
          cacheHistory(userId, next);
          return next;
        });
        addScanResult(userId, item);
        // If the person closed the scanner while waiting, keep the result in history but don't pop a sheet.
        if (overlaysRef.current[overlaysRef.current.length - 1]?.k === 'scanner') replaceTop({ k: 'product', id: item.id });
      } else {
        const result = await svc.analyzeSkin(base64, user);
        const item: SkinScanItem = { ...result, id: crypto.randomUUID(), timestamp: Date.now() };
        setSkinHistory((prev) => {
          const next = [item, ...prev];
          saveSkinHistory(userId, next);
          return next;
        });
        if (overlaysRef.current[overlaysRef.current.length - 1]?.k === 'scanner') replaceTop({ k: 'skin', id: item.id });
      }
    },
    [user, userId, replaceTop]
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    try {
      if (userId) {
        localStorage.removeItem(`vitalSense_profile_${userId}`);
        localStorage.removeItem(`vitalSense_history_${userId}`);
      }
    } catch { /* ignore */ }
    setTab('home');
  };

  // ---------- Rendering ----------

  const base = overlays[0] ? presentation(overlays[0]) : null;
  const baseAnim =
    base === 'sheet'
      ? { scale: 0.92, y: 8, borderRadius: 24, filter: 'brightness(0.9)' }
      : base === 'push'
        ? { x: rtl ? '28%' : '-28%', scale: 1, y: 0, borderRadius: 0, filter: 'brightness(0.94)' }
        : { x: '0%', scale: 1, y: 0, borderRadius: 0, filter: 'brightness(1)' };

  const renderOverlay = (o: Overlay, i: number) => {
    const key = `${o.k}-${i}`;
    switch (o.k) {
      case 'scanner':
        return <Scanner key={key} t={t} rtl={rtl} initialMode={o.mode} onClose={close} analyze={analyze} />;
      case 'product': {
        const item = history.find((h) => h.id === o.id);
        if (!item) return null;
        return (
          <Sheet key={key} onClose={close} label={item.productName}>
            <ProductResult
              t={t}
              rtl={rtl}
              item={item}
              user={user}
              onClose={close}
              onToggleFavorite={toggleFavorite}
              onScanAnother={() => replaceTop({ k: 'scanner', mode: 'product' })}
            />
          </Sheet>
        );
      }
      case 'skin': {
        const item = skinHistory.find((s) => s.id === o.id);
        if (!item) return null;
        return (
          <Sheet key={key} onClose={close} label={t('skinCheck')}>
            <SkinResult t={t} rtl={rtl} item={item} onClose={close} onCheckAgain={() => replaceTop({ k: 'scanner', mode: 'skin' })} />
          </Sheet>
        );
      }
      case 'article':
        return (
          <PushPage key={key} onBack={close} rtl={rtl} label={o.article.title}>
            <ArticlePage t={t} rtl={rtl} article={o.article} onBack={close} />
          </PushPage>
        );
      case 'language':
        return (
          <Sheet key={key} onClose={close} height="auto" label={t('language')}>
            <LanguageSheet t={t} current={lang} onPick={changeLanguage} />
          </Sheet>
        );
      case 'auth':
        return (
          <Sheet key={key} onClose={close} label={t('signIn')}>
            <Auth t={t} rtl={rtl} initialMode={o.mode} onClose={close} />
          </Sheet>
        );
      case 'onboarding': {
        const content = (
          <Onboarding
            t={t}
            rtl={rtl}
            mode={o.mode}
            language={lang}
            initial={o.mode === 'new' ? null : user}
            defaultName={metaName}
            onClose={o.mode === 'new' ? undefined : close}
            onComplete={(p) => {
              saveProfile(p);
              close();
            }}
          />
        );
        if (o.mode === 'new')
          return (
            <motion.div
              key={key}
              className="fixed inset-0 z-50 flex justify-center bg-canvas"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={sheetTransition}
            >
              <div className="relative w-full max-w-[450px] h-full">{content}</div>
            </motion.div>
          );
        return (
          <Sheet key={key} onClose={close} label={t('healthProfile')}>
            {content}
          </Sheet>
        );
      }
    }
  };

  if (booting) {
    return (
      <div className="w-full max-w-[450px] h-[100dvh] bg-canvas flex items-center justify-center">
        <motion.svg viewBox="0 0 512 512" className="w-16 h-16" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <rect width="512" height="512" rx="112" fill="#0E2B2E" />
          <circle cx="256" cy="256" r="132" fill="none" stroke="#2B4A4D" strokeWidth="36" />
          <motion.circle
            cx="256"
            cy="256"
            r="132"
            fill="none"
            stroke="#EE5F3B"
            strokeWidth="36"
            strokeLinecap="round"
            initial={{ pathLength: 0.15, rotate: 0 }}
            animate={{ pathLength: [0.15, 0.6, 0.15], rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '50%', originY: '50%' }}
          />
          <circle cx="256" cy="256" r="34" fill="#E9EEEC" />
        </motion.svg>
      </div>
    );
  }

  const stats = {
    scans: history.length,
    saved: history.filter((h) => h.isFavorite).length,
    skin: skinHistory.length
  };

  return (
    <div className="relative w-full max-w-[450px] h-[100dvh] overflow-hidden bg-black">
      <motion.div
        className="absolute inset-0 bg-canvas overflow-hidden origin-top"
        animate={baseAnim}
        transition={base === 'push' || overlays.length === 0 ? { type: 'tween', ease: IOS_EASE, duration: 0.5 } : sheetTransition}
        aria-hidden={overlays.length > 0}
      >
        <motion.main
            key={tab}
            className="absolute inset-0 overflow-y-auto no-scrollbar"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22 }}
          >
            {tab === 'home' && (
              <HomeView
                t={t}
                rtl={rtl}
                user={user}
                history={history}
                skinHistory={skinHistory}
                hasApiKey={hasApiKey}
                onScan={startScan}
                onOpenProduct={(item) => open({ k: 'product', id: item.id })}
                onOpenSkin={(item) => open({ k: 'skin', id: item.id })}
                onSeeAll={() => setTab('library')}
                onFeeling={() => open({ k: 'onboarding', mode: 'symptoms' })}
                onProfile={() => setTab('profile')}
              />
            )}
            {tab === 'explore' && <ExploreView t={t} user={user} onOpen={(a) => open({ k: 'article', article: a })} />}
            {tab === 'library' && (
              <LibraryView
                t={t}
                history={history}
                skinHistory={skinHistory}
                signedIn={!!userId}
                onOpenProduct={(item) => open({ k: 'product', id: item.id })}
                onOpenSkin={(item) => open({ k: 'skin', id: item.id })}
                onToggleFavorite={toggleFavorite}
                onScan={() => startScan('product')}
              />
            )}
            {tab === 'profile' && (
              <ProfileView
                t={t}
                rtl={rtl}
                user={userId ? user : null}
                language={lang}
                email={email}
                stats={stats}
                hasApiKey={hasApiKey}
                onSignIn={(mode) => open({ k: 'auth', mode })}
                onEditProfile={() => open({ k: 'onboarding', mode: 'edit' })}
                onUpdateSymptoms={() => open({ k: 'onboarding', mode: 'symptoms' })}
                onLanguage={() => open({ k: 'language' })}
                onSignOut={signOut}
              />
            )}
        </motion.main>

        <TabBar t={t} tab={tab} onTab={setTab} onScan={() => startScan('product')} />
      </motion.div>

      <AnimatePresence>{overlays.map(renderOverlay)}</AnimatePresence>
    </div>
  );
};

export default App;
