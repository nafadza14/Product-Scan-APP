import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLanguage, Article, DiaryLog, FeedItem, DiaryPrefs, ScanHistoryItem, ScanMode, SkinScanItem, UserProfile, UserRoutine } from './types';
import { makeT } from './i18n';
import { supabase, requestPersistentStorage } from './services/supabaseClient';
import { CloudStatus, getCloudStatus, mergeLogs, mergeScans, onCloudStatus, pullAll, pushLog, pushSettings, pushSkinCheck } from './services/cloudSync';
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
import {
  dateKey,
  emptyLog,
  getLogs,
  getPrefs,
  getRoutine,
  loadPhoto,
  makeThumb,
  recentLogText,
  routineFromScan,
  saveLogs,
  savePhoto,
  savePrefs,
  saveRoutine,
  scoreOf
} from './services/diaryService';
import DiaryView from './components/diary/DiaryView';
import { CompareView, GoalsSheet, RoutineEditor } from './components/diary/DiarySheets';
import { NavBar } from './components/ui';
import HomeView from './components/HomeView';
import { ExploreView, ArticlePage, FeedArticlePage } from './components/ExploreView';
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
  | { k: 'feedItem'; item: FeedItem }
  | { k: 'language' }
  | { k: 'auth'; mode: 'signin' | 'signup' }
  | { k: 'onboarding'; mode: OnboardingMode }
  | { k: 'routineEdit' }
  | { k: 'goals' }
  | { k: 'compare'; a: string; b: string }
  | { k: 'products' };

const presentation = (o: Overlay): 'push' | 'sheet' | 'full' =>
  o.k === 'article' || o.k === 'feedItem' ? 'push' : o.k === 'scanner' || (o.k === 'onboarding' && o.mode === 'new') ? 'full' : 'sheet';

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
  const [logs, setLogs] = useState<Record<string, DiaryLog>>({});
  const [routine, setRoutine] = useState<UserRoutine | null>(null);
  const [prefs, setPrefs] = useState<DiaryPrefs>({ goals: [] });
  const [routineSource, setRoutineSource] = useState<string | null>(null);
  const [deviceLang, setDeviceLang] = useState<AppLanguage>(detectLanguage);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(getCloudStatus());
  useEffect(() => onCloudStatus(setCloudStatus) as unknown as () => void, []);
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
      // 1. Show what this device already has, instantly.
      const cached = getCachedProfile(id);
      if (cached) setUser(cached);
      setHistory(getCachedHistory(id));
      const localScans = getSkinHistory(id);
      const localLogs = getLogs(id);
      const localRoutine = getRoutine(id);
      const localPrefs = getPrefs(id);
      setSkinHistory(localScans);
      setLogs(localLogs);
      setRoutine(localRoutine);
      setPrefs(localPrefs);

      // 2. Profile from the account.
      const profile = await getUserProfile(id);
      if (userIdRef.current !== id) return;
      if (profile) {
        const merged = { ...profile, name: profile.name || nameFromMeta || '' };
        setUser(merged);
        cacheProfile(id, merged);
        if (profile.language) {
          setDeviceLang(profile.language);
        }
      } else if (!cached) {
        setUser(null);
        open({ k: 'onboarding', mode: 'new' });
      } else {
        // The account has no profile row yet (for example an earlier save failed): save the cached one.
        updateUserProfile(id, cached);
      }

      // 3. Product scans and favorites.
      const remoteHistory = await getScanHistory(id);
      if (userIdRef.current !== id) return;

      // 4. Diary from the cloud, merged with anything only this device has.
      const cloud = await pullAll(id);
      if (userIdRef.current !== id) return;
      if (cloud) {
        const scans = mergeScans(localScans, cloud.scans);
        const logsMerged = mergeLogs(localLogs, cloud.logs);
        const remoteSettingsNewer = cloud.settings && cloud.settings.updatedAt >= (localRoutine?.updatedAt || 0);
        const routineFinal = remoteSettingsNewer ? cloud.settings!.routine : localRoutine;
        const goalsFinal = remoteSettingsNewer && cloud.settings!.goals ? cloud.settings!.goals : localPrefs.goals;
        const favs = new Set([...(cloud.settings?.favorites || []), ...getFavoriteIds(id)]);

        setSkinHistory(scans);
        saveSkinHistory(id, scans);
        setLogs(logsMerged);
        saveLogs(id, logsMerged);
        setRoutine(routineFinal);
        if (routineFinal) saveRoutine(id, routineFinal);
        setPrefs({ goals: goalsFinal });
        savePrefs(id, { goals: goalsFinal });
        setFavoriteIds(id, favs);
        setHistory(remoteHistory.map((h) => ({ ...h, isFavorite: favs.has(h.id) })));

        // Upload what only this device had (first run after setup, or offline edits).
        const remoteIds = new Set(cloud.scans.map((x) => x.id));
        for (const sc of localScans.filter((x) => !remoteIds.has(x.id))) {
          loadPhoto(sc.photoId).then((ph) => pushSkinCheck(id, sc, ph || undefined));
        }
        for (const [d, l] of Object.entries(localLogs)) {
          const r = cloud.logs[d];
          if (!r || (l.updatedAt || 0) > (r.updatedAt || 0)) pushLog(id, l);
        }
        if (!cloud.settings || !remoteSettingsNewer) pushSettings(id, { routine: routineFinal, goals: goalsFinal, favorites: Array.from(favs) });
      } else {
        setHistory(remoteHistory);
      }
    },
    [open]
  );

  useEffect(() => {
    let mounted = true;
    let booted = false;
    checkAiConfigured().then(setHasApiKey);
    requestPersistentStorage();
    const finishBoot = () => {
      if (!booted && mounted) {
        booted = true;
        setBooting(false);
      }
    };
    // Safety net: never sit on the splash screen for long.
    const bootTimer = window.setTimeout(finishBoot, 4000);

    const nameOf = (u: any) => u?.user_metadata?.full_name || u?.user_metadata?.name;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // INITIAL_SESSION fires once with the stored session (or null) after supabase-js has read
      // and, if needed, refreshed it. Using it avoids treating a still-loading session as signed out.
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          userIdRef.current = session.user.id;
          setTimeout(() => {
            Promise.race([loadUser(session.user.id, session.user.email, nameOf(session.user)), new Promise((r) => setTimeout(r, 2500))]).finally(finishBoot);
          }, 0);
        } else {
          finishBoot();
        }
      } else if (event === 'SIGNED_IN' && session?.user && session.user.id !== userIdRef.current) {
        userIdRef.current = session.user.id;
        // Close the sign-in sheet first, then load (which may open onboarding).
        closeAll();
        setTimeout(() => loadUser(session.user.id, session.user.email, nameOf(session.user)), 50);
        setTab('home');
        finishBoot();
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        setUserId(null);
        setUser(null);
        setEmail(undefined);
        setHistory([]);
        setSkinHistory([]);
        setLogs({});
        setRoutine(null);
        setPrefs({ goals: [] });
        finishBoot();
      }
    });
    return () => {
      mounted = false;
      window.clearTimeout(bootTimer);
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
      updateUserProfile(userId, p);
    }
    setTimeout(close, 180);
  };

  const toggleFavorite = (id: string) => {
    if (!userId) return;
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h));
      const favs = next.filter((h) => h.isFavorite).map((h) => h.id);
      setFavoriteIds(userId, new Set(favs));
      cacheHistory(userId, next);
      pushSettings(userId, { routine, goals: prefs.goals, favorites: favs });
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
        const prev = [...skinHistory].sort((a, b) => b.timestamp - a.timestamp)[0];
        const routineText = routine
          ? `morning: ${routine.am.map((r) => r.name + (r.product ? ` (${r.product})` : '')).join(', ') || 'none'}; evening: ${routine.pm.map((r) => r.name + (r.product ? ` (${r.product})` : '')).join(', ') || 'none'}`
          : undefined;
        const result = await svc.analyzeSkin(base64, user, {
          goals: prefs.goals,
          previous: prev
            ? { daysAgo: Math.max(0, Math.round((Date.now() - prev.timestamp) / 86400000)), skinScore: scoreOf(prev), metrics: prev.metrics, concerns: prev.concerns }
            : undefined,
          recentLog: recentLogText(logs),
          routine: routineText
        });
        const id = crypto.randomUUID();
        // Keep a small thumbnail on this device so the diary can show progress photos.
        const thumb = await makeThumb(`data:image/jpeg;base64,${base64}`);
        await savePhoto(id, thumb);
        const item: SkinScanItem = { ...result, id, timestamp: Date.now(), photoId: id, photoPath: `${userId}/${id}.jpg` };
        pushSkinCheck(userId, item, thumb);
        setSkinHistory((prev) => {
          const next = [item, ...prev];
          saveSkinHistory(userId, next);
          return next;
        });
        if (overlaysRef.current[overlaysRef.current.length - 1]?.k === 'scanner') replaceTop({ k: 'skin', id: item.id });
      }
    },
    [user, userId, replaceTop, skinHistory, routine, prefs, logs]
  );

  // ---------- Diary ----------

  const updateLog = (date: string, patch: Partial<DiaryLog>) => {
    if (!userId) return;
    setLogs((prev) => {
      const entry = { ...(prev[date] || emptyLog(date)), ...patch, updatedAt: Date.now() };
      const next = { ...prev, [date]: entry };
      saveLogs(userId, next);
      pushLog(userId, entry);
      return next;
    });
  };

  const applyRoutine = (r: UserRoutine) => {
    if (!userId) return;
    setRoutine(r);
    saveRoutine(userId, r);
    pushSettings(userId, { routine: r, goals: prefs.goals, favorites: history.filter((h) => h.isFavorite).map((h) => h.id) });
  };

  const applyScanRoutine = (scan?: SkinScanItem) => {
    const s = scan || [...skinHistory].sort((a, b) => b.timestamp - a.timestamp)[0];
    if (!s) return;
    applyRoutine(routineFromScan(s));
    setRoutineSource(s.id);
  };

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
            <SkinResult
              t={t}
              rtl={rtl}
              item={item}
              previous={[...skinHistory].filter((x) => x.timestamp < item.timestamp).sort((a, b) => b.timestamp - a.timestamp)[0]}
              routineSaved={routineSource === item.id}
              onClose={close}
              onCheckAgain={() => replaceTop({ k: 'scanner', mode: 'skin' })}
              onUseRoutine={() => applyScanRoutine(item)}
            />
          </Sheet>
        );
      }
      case 'routineEdit':
        return (
          <Sheet key={key} onClose={close} label={t('routineEdit')}>
            <RoutineEditor
              t={t}
              rtl={rtl}
              initial={routine}
              latestScan={[...skinHistory].sort((a, b) => b.timestamp - a.timestamp)[0]}
              fromScan={routineFromScan}
              onSave={(r) => {
                applyRoutine(r);
                close();
              }}
              onClose={close}
            />
          </Sheet>
        );
      case 'goals':
        return (
          <Sheet key={key} onClose={close} height="auto" label={t('goalsTitle')}>
            <GoalsSheet
              t={t}
              initial={prefs.goals}
              onSave={(goals) => {
                const p = { ...prefs, goals };
                setPrefs(p);
                if (userId) {
                  savePrefs(userId, p);
                  pushSettings(userId, { routine, goals, favorites: history.filter((h) => h.isFavorite).map((h) => h.id) });
                }
                close();
              }}
            />
          </Sheet>
        );
      case 'compare': {
        const a = skinHistory.find((s) => s.id === o.a);
        const b = skinHistory.find((s) => s.id === o.b);
        if (!a || !b) return null;
        const fmt = (ts: number) => new Intl.DateTimeFormat(lang === AppLanguage.ZH ? 'zh-CN' : lang, { day: 'numeric', month: 'short' }).format(ts);
        return (
          <Sheet key={key} onClose={close} label={t('compareTitle')}>
            <CompareView t={t} rtl={rtl} a={a} b={b} formatDate={fmt} onClose={close} />
          </Sheet>
        );
      }
      case 'products':
        return (
          <Sheet key={key} onClose={close} label={t('productScans')}>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <NavBar onClose={close} backLabel={t('back')} closeLabel={t('close')} rtl={rtl} />
              <div>
                <LibraryView
                  t={t}
                  history={history}
                  skinHistory={[]}
                  signedIn={!!userId}
                  onOpenProduct={(item) => open({ k: 'product', id: item.id })}
                  onOpenSkin={() => {}}
                  onToggleFavorite={toggleFavorite}
                  onScan={() => replaceTop({ k: 'scanner', mode: 'product' })}
                  embedded
                />
              </div>
            </div>
          </Sheet>
        );
      case 'feedItem':
        return (
          <PushPage key={key} onBack={close} rtl={rtl} label={o.item.title}>
            <FeedArticlePage t={t} rtl={rtl} lang={lang} item={o.item} onBack={close} />
          </PushPage>
        );
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
                onSeeAll={() => setTab('diary')}
                onFeeling={() => open({ k: 'onboarding', mode: 'symptoms' })}
                onProfile={() => setTab('profile')}
              />
            )}
            {tab === 'explore' && <ExploreView t={t} user={user} goals={prefs.goals} onOpen={(a) => open({ k: 'article', article: a })} onOpenFeed={(f) => open({ k: 'feedItem', item: f })} />}
            {tab === 'diary' && (
              <DiaryView
                t={t}
                rtl={rtl}
                lang={lang}
                signedIn={!!userId}
                scans={skinHistory}
                logs={logs}
                routine={routine}
                prefs={prefs}
                productCount={history.length}
                onCheckSkin={() => startScan('skin')}
                onOpenSkin={(item) => open({ k: 'skin', id: item.id })}
                onUpdateLog={updateLog}
                onEditRoutine={() => open({ k: 'routineEdit' })}
                onUseScanRoutine={() => applyScanRoutine()}
                onEditGoals={() => open({ k: 'goals' })}
                onCompare={(x, y) => open({ k: 'compare', a: x.id, b: y.id })}
                onOpenProducts={() => open({ k: 'products' })}
                onSignIn={() => open({ k: 'auth', mode: 'signin' })}
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
                cloudStatus={cloudStatus}
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
