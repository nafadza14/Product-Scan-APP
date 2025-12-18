
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ViewState, UserProfile, ScanResult, ScanHistoryItem, ScanStatus, AppLanguage } from './types';
import { Home, Scan, Compass, User, ClipboardList, Sparkles, ChevronRight, Activity, Package, Key, AlertCircle, Globe, Droplet, Utensils, Zap, History, Check, X, Star, ChevronLeft, Heart, Smile } from 'lucide-react';
import Card from './components/Card';
import Button from './components/Button';
import { supabase } from './services/supabaseClient';
import { 
  getUserProfile, 
  updateUserProfile, 
  getScanHistory, 
  addScanResult,
  getCachedProfile,
  cacheProfile,
  getCachedHistory,
  cacheHistory
} from './services/dbService';

// --- LOCALIZATION ---
const translations = {
  [AppLanguage.EN]: {
    greeting: "Hello,",
    guest: "Guest",
    apiKeyLimited: "AI Access Limited",
    apiKeyMissing: "Scanning requires an active API key. Please select yours to continue.",
    selectKey: "Select API Key Now",
    billingDoc: "Billing Documentation",
    dailyCheck: "Daily Check",
    howAreYou: "How are you feeling?",
    updateStatus: "Update status for better results.",
    scanProduct: "Scan Product",
    scanPrompt: "Point camera at",
    scanAnyLabel: "any label",
    scanFoodSkincare: "(Food or Skincare)",
    recentHistory: "Recent History",
    viewAll: "View All",
    routine: "My Routine",
    profile: "Profile",
    healthCondition: "Health Condition",
    changeProfile: "Change Health Profile",
    signOut: "Sign Out",
    apiKeyActive: "API Key Active",
    apiKeyRequired: "API Key Required",
    language: "Language",
    selectLanguage: "Select Language",
    nowShowing: "Now showing insights for",
    updatedToday: "Updated Today",
    todaysRead: "Today's Reads",
    topStory: "Top Story",
    justNow: "Just now",
    skincareRoutine: "Skincare Routine",
    foodTracking: "Food Tracking",
    routineDesc: "Track your habits to help VitalSense learn your triggers.",
    aiSync: "AI Sync Enabled",
    recentScans: "Scan History",
    favorites: "Favorites",
    recent: "Recent",
    noFavorites: "No favorites yet.",
    noScans: "Start scanning to see your history.",
    scanFace: "Scan your face",
    scanEat: "Scan what you eat",
    yourFavorites: "Your Favorites",
    favoritesUserScan: "Favourites user scan"
  },
  [AppLanguage.ID]: {
    greeting: "Halo,",
    guest: "Tamu",
    apiKeyLimited: "Akses AI Terbatas",
    apiKeyMissing: "Pindai memerlukan kunci API yang aktif. Silakan pilih kunci Anda untuk melanjutkan.",
    selectKey: "Pilih Kunci API Sekarang",
    billingDoc: "Dokumentasi Billing",
    dailyCheck: "Cek Harian",
    howAreYou: "Bagaimana kondisi Anda?",
    updateStatus: "Perbarui gejala untuk hasil akurat.",
    scanProduct: "Pindai Produk",
    scanPrompt: "Arahkan kamera ke",
    scanAnyLabel: "label apa pun",
    scanFoodSkincare: "(Makanan atau Skincare)",
    recentHistory: "Riwayat Terakhir",
    viewAll: "Lihat Semua",
    routine: "Rutinitas Saya",
    profile: "Profil",
    healthCondition: "Kondisi Kesehatan",
    changeProfile: "Ubah Profil Kesehatan",
    signOut: "Keluar",
    apiKeyActive: "Kunci API Aktif",
    apiKeyRequired: "Kunci API Dibutuhkan",
    language: "Bahasa",
    selectLanguage: "Pilih Bahasa",
    nowShowing: "Menampilkan info untuk",
    updatedToday: "Diperbarui Hari Ini",
    todaysRead: "Bacaan Hari Ini",
    topStory: "Berita Utama",
    justNow: "Baru saja",
    skincareRoutine: "Rutinitas Skincare",
    foodTracking: "Pelacakan Makanan",
    routineDesc: "Catat kebiasaan Anda untuk membantu VitalSense mempelajari pemicu Anda.",
    aiSync: "Sinkronisasi AI Aktif",
    recentScans: "Riwayat Pindaian",
    favorites: "Favorit",
    recent: "Terbaru",
    noFavorites: "Belum ada favorit.",
    noScans: "Mulai memindai untuk melihat riwayat.",
    scanFace: "Pindai wajah Anda",
    scanEat: "Pindai makanan Anda",
    yourFavorites: "Favorit Anda",
    favoritesUserScan: "Favorit pindaian pengguna"
  },
  [AppLanguage.AR]: {
    greeting: "مرحباً،",
    guest: "ضيف",
    apiKeyLimited: "وصول محدود للذكاء الاصطناعي",
    apiKeyMissing: "يتطلب المسح مفتاح API نشطًا. يرجى الاختيار للمتابعة.",
    selectKey: "اختر مفتاح API الآن",
    billingDoc: "وثائق الفواتير",
    dailyCheck: "الفحص اليومي",
    howAreYou: "كيف تشعر اليوم؟",
    updateStatus: "تحديث الحالة لنتائج أفضل.",
    scanProduct: "مسح منتج",
    scanPrompt: "وجه الكاميرا نحو",
    scanAnyLabel: "أي ملصق",
    scanFoodSkincare: "(طعام أو عناية بالبشرة)",
    recentHistory: "السجل الأخير",
    viewAll: "عرض الكل",
    routine: "روتيني",
    profile: "الملف الشخصي",
    healthCondition: "الحالة الصحية",
    changeProfile: "تغيير الملف الصحي",
    signOut: "تسجيل الخروج",
    apiKeyActive: "مفتاح API نشط",
    apiKeyRequired: "مفتاح API مطلوب",
    language: "اللغة",
    selectLanguage: "اختر اللغة",
    nowShowing: "عرض الأفكار لـ",
    updatedToday: "تم التحديث اليوم",
    todaysRead: "قراءات اليوم",
    topStory: "القصة الرئيسية",
    justNow: "الآن",
    skincareRoutine: "روتين العناية بالبشرة",
    foodTracking: "تتبع الغذاء",
    routineDesc: "تتبع عاداتك لمساعدة VitalSense على تعلم محفزاتك.",
    aiSync: "مزامنة الذكاء الاصطناعي مفعّلة",
    recentScans: "سجل الفحص",
    favorites: "المفضلة",
    recent: "الأخيرة",
    noFavorites: "لا توجد مفضلات بعد.",
    noScans: "ابدأ المسح لرؤية سجلك.",
    scanFace: "امسح وجهك",
    scanEat: "امسح ما تأكله",
    yourFavorites: "مفضلاتك",
    favoritesUserScan: "مفضلات فحص المستخدم"
  },
  [AppLanguage.FR]: {
    greeting: "Bonjour,",
    guest: "Invité",
    apiKeyLimited: "Accès IA Limité",
    apiKeyMissing: "Le scan nécessite une clé API active. Veuillez sélectionner la vôtre.",
    selectKey: "Sélectionner la clé API",
    billingDoc: "Documentation de facturation",
    dailyCheck: "Bilan Quotidien",
    howAreYou: "Comment vous sentez-vous ?",
    updateStatus: "Mettez à jour votre statut pour de meilleurs résultats.",
    scanProduct: "Scanner un produit",
    scanPrompt: "Pointez la caméra sur",
    scanAnyLabel: "n'importe quelle étiquette",
    scanFoodSkincare: "(Aliments ou Soins)",
    recentHistory: "Historique Récent",
    viewAll: "Voir Tout",
    routine: "Ma Routine",
    profile: "Profil",
    healthCondition: "État de Santé",
    changeProfile: "Changer de profil santé",
    signOut: "Déconnexion",
    apiKeyActive: "Clé API Active",
    apiKeyRequired: "Clé API Requise",
    language: "Langue",
    selectLanguage: "Choisir la langue",
    nowShowing: "Affichage des infos pour",
    updatedToday: "Mis à jour aujourd'hui",
    todaysRead: "Lectures du jour",
    topStory: "À la une",
    justNow: "À l'instant",
    skincareRoutine: "Routine de soins",
    foodTracking: "Suivi alimentaire",
    routineDesc: "Suivez vos habitudes pour aider VitalSense à apprendre vos déclencheurs.",
    aiSync: "Synchro IA Activée",
    recentScans: "Historique des scans",
    favorites: "Favoris",
    recent: "Récents",
    noFavorites: "Aucun favori pour le moment.",
    noScans: "Commencez à scanner pour voir votre historique.",
    scanFace: "Scannez votre visage",
    scanEat: "Scannez votre repas",
    yourFavorites: "Vos Favoris",
    favoritesUserScan: "Favoris de l'utilisateur"
  },
  [AppLanguage.ZH]: {
    greeting: "你好，",
    guest: "访客",
    apiKeyLimited: "AI 访问受限",
    apiKeyMissing: "扫描需要有效的 API 密钥。请选择您的密钥以继续。",
    selectKey: "立即选择 API 密钥",
    billingDoc: "计费文档",
    dailyCheck: "每日检查",
    howAreYou: "你今天感觉如何？",
    updateStatus: "更新状态以获得更好的结果。",
    scanProduct: "扫描产品",
    scanPrompt: "请将相机对准",
    scanAnyLabel: "任何标签",
    scanFoodSkincare: "(食品或护肤品)",
    recentHistory: "最近历史",
    viewAll: "查看全部",
    routine: "我的常规",
    profile: "个人资料",
    healthCondition: "健康状况",
    changeProfile: "更改健康档案",
    signOut: "登出",
    apiKeyActive: "API 密钥已激活",
    apiKeyRequired: "需要 API 密钥",
    language: "语言",
    selectLanguage: "选择语言",
    nowShowing: "正在显示见解：",
    updatedToday: "今日已更新",
    todaysRead: "今日阅读",
    topStory: "头条故事",
    justNow: "刚刚",
    skincareRoutine: "护肤常规",
    foodTracking: "食物追踪",
    routineDesc: "追踪您的习惯，帮助 VitalSense 了解您的触发因素。",
    aiSync: "AI 同步已开启",
    recentScans: "扫描历史",
    favorites: "收藏",
    recent: "最近",
    noFavorites: "尚无收藏内容。",
    noScans: "开始扫描以查看您的历史记录。",
    scanFace: "扫描您的脸部",
    scanEat: "扫描您的食物",
    yourFavorites: "您的收藏",
    favoritesUserScan: "用户扫描收藏"
  }
};

const languageOptions = [
  { code: AppLanguage.EN, label: "English", native: "English", flag: "🇺🇸" },
  { code: AppLanguage.ID, label: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: AppLanguage.AR, label: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: AppLanguage.FR, label: "French", native: "Français", flag: "🇫🇷" },
  { code: AppLanguage.ZH, label: "Chinese", native: "简体中文", flag: "🇨🇳" }
];

// --- LAZY LOADED COMPONENTS ---
const Onboarding = lazy(() => import('./components/Onboarding'));
const Scanner = lazy(() => import('./components/Scanner'));
const ResultModal = lazy(() => import('./components/ResultModal'));
const ExploreView = lazy(() => import('./components/ExploreView'));
const Auth = lazy(() => import('./components/Auth'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh] animate-in fade-in duration-300">
    <div className="w-8 h-8 border-4 border-[#6FAE9A] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanHistoryItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [loadingApp, setLoadingApp] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [historyCategory, setHistoryCategory] = useState<'recent' | 'favorites'>('recent');
  const [isModalFromHistory, setIsModalFromHistory] = useState(false);

  const currentLang = user?.language || AppLanguage.EN;
  const t = translations[currentLang] || translations[AppLanguage.EN];
  const isRTL = currentLang === AppLanguage.AR;

  const checkApiKey = async () => {
    const apiKey = process.env.API_KEY;
    const envKeyAvailable = typeof apiKey === 'string' && 
                             apiKey !== "" && 
                             apiKey !== "undefined" && 
                             apiKey !== "null";
    
    if (envKeyAvailable) {
      setHasApiKey(true);
      return true;
    }

    let isSelected = false;
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        isSelected = await aistudio.hasSelectedApiKey();
      }
    } catch (e) {}
    
    setHasApiKey(isSelected);
    return isSelected;
  };

  useEffect(() => {
    checkApiKey();
    const interval = setInterval(() => {
        const apiKey = process.env.API_KEY;
        const envKeyAvailable = typeof apiKey === 'string' && apiKey !== "" && apiKey !== "undefined" && apiKey !== "null";
        if (!envKeyAvailable) checkApiKey();
    }, 5000);

    let mounted = true;
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (mounted) setLoadingApp(false);
          return;
        }
        const currentUserId = session.user.id;
        if (mounted) setUserId(currentUserId);
        const cachedUser = getCachedProfile(currentUserId);
        if (cachedUser && mounted) {
           setUser(cachedUser);
           const cachedHistory = getCachedHistory(currentUserId);
           if (cachedHistory) setScanHistory(cachedHistory);
        }
        const profile = await getUserProfile(currentUserId);
        if (mounted && profile) {
            setUser(profile);
            cacheProfile(currentUserId, profile);
            const history = await getScanHistory(currentUserId);
            setScanHistory(history);
            cacheHistory(currentUserId, history);
        }
        if (mounted) setLoadingApp(false);
      } catch (err) {
        if (mounted) setLoadingApp(false);
      }
    };
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session) {
        setUserId(session.user.id);
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
          setView(ViewState.HOME);
          const history = await getScanHistory(session.user.id);
          setScanHistory(history);
        } else {
          setView(ViewState.ONBOARDING);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserId(null);
        setScanHistory([]);
        setView(ViewState.HOME);
      }
    });

    return () => { 
      mounted = false; 
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleLanguageChange = async (lang: AppLanguage) => {
    if (!user || !userId) return;
    const updatedUser = { ...user, language: lang };
    setUser(updatedUser);
    await updateUserProfile(userId, updatedUser);
    setShowLanguageModal(false);
  };

  const handleToggleFavorite = (id: string) => {
    setScanHistory(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item);
        if (userId) cacheHistory(userId, updated);
        return updated;
    });
  };

  const handleOpenKeySelector = async () => {
    const apiKey = process.env.API_KEY;
    if (typeof apiKey === 'string' && apiKey !== "" && apiKey !== "undefined") return;
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.openSelectKey === 'function') {
        await aistudio.openSelectKey();
        setHasApiKey(true);
      }
    } catch (e) {}
  };

  const handleScanAction = async () => {
    if (!user) { setView(ViewState.AUTH); return; }
    const keyReady = await checkApiKey();
    if (!keyReady) { handleOpenKeySelector(); return; }
    setView(ViewState.SCANNER);
  };

  const handleScanCapture = async (imageSrc: string) => {
    setView(ViewState.HOME); 
    setIsScanning(true);
    setScanResult(null); 
    setIsModalFromHistory(false);
    if (!user || !userId) return;
    const rawBase64 = imageSrc.split(',')[1];
    try {
      const { analyzeImage } = await import('./services/geminiService');
      const result = await analyzeImage(rawBase64, user);
      if (result.productName.toLowerCase().includes("configuration error") || 
          result.productName.toLowerCase().includes("error konfigurasi")) {
        setHasApiKey(false);
      } else {
        const newHistoryItem: ScanHistoryItem = { ...result, id: crypto.randomUUID(), timestamp: Date.now(), isFavorite: false };
        setScanResult(newHistoryItem);
        const newHistory = [newHistoryItem, ...scanHistory];
        setScanHistory(newHistory);
        addScanResult(userId, newHistoryItem);
      }
    } catch (e) { console.error(e); } finally { setIsScanning(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setUserId(null);
    setScanHistory([]);
    setView(ViewState.HOME);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return t.justNow;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const renderIcon = (iconStr?: string) => {
    if (!iconStr || iconStr.length > 4 || iconStr.includes('_')) return <Package size={24} className="text-[#6FAE9A]" />;
    return iconStr;
  };

  const NavIcon = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-1 transition-all duration-300 w-12 ${isActive ? 'text-[#6FAE9A] -translate-y-1' : 'text-gray-400 group hover:text-gray-600'}`}>
      <div className={`p-2 rounded-full transition-all ${isActive ? 'bg-[#6FAE9A]/10' : 'bg-transparent'}`}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className={`text-[8px] font-bold uppercase tracking-widest ${isActive ? 'text-[#6FAE9A]' : 'text-gray-400'}`}>{label}</span>
    </button>
  );

  const filteredHistory = historyCategory === 'recent' 
    ? scanHistory 
    : scanHistory.filter(item => item.isFavorite);

  const userFavorites = scanHistory.filter(item => item.isFavorite);

  if (loadingApp) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#6FAE9A] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (view === ViewState.AUTH) return <Suspense fallback={<LoadingSpinner />}><Auth onCancel={() => setView(ViewState.HOME)} /></Suspense>;
  if (view === ViewState.ONBOARDING) return <Suspense fallback={<LoadingSpinner />}><Onboarding onComplete={(p) => { updateUserProfile(userId!, p); setUser(p); setView(ViewState.HOME); }} /></Suspense>;
  if (view === ViewState.SCANNER) return <Suspense fallback={<LoadingSpinner />}><Scanner onCapture={handleScanCapture} onClose={() => setView(ViewState.HOME)} /></Suspense>;

  return (
    <div className={`min-h-screen pb-32 relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {activeTab === 'Home' && (
        <div className="flex flex-col h-screen max-h-screen animate-in fade-in duration-500">
          <div className="p-6 pt-12 flex-1 overflow-y-auto no-scrollbar pb-32">
             <div className="flex justify-between items-start mb-6">
               <div>
                  <h1 className="text-3xl font-bold text-[#1C1C1C] tracking-tight">{t.greeting}</h1>
                  <p className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#6FAE9A] to-[#3B6E5F] truncate max-w-[200px]">
                    {user ? user.name.split(' ')[0] : t.guest}
                  </p>
               </div>
               <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md border-2 border-white p-0.5 shadow-md overflow-hidden cursor-pointer" onClick={() => setActiveTab('Profile')}>
                  {user ? (
                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=6FAE9A&color=fff`} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-400"><User size={20} /></div>
                  )}
               </div>
             </div>

             {!hasApiKey && (
                <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
                    <Card variant="standard" className="p-4 bg-red-50 border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="font-bold text-red-900 text-sm">{t.apiKeyLimited}</h4>
                                <p className="text-xs text-red-700 mb-3">{t.apiKeyMissing}</p>
                                <button onClick={handleOpenKeySelector} className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm hover:bg-red-700 transition-colors">{t.selectKey}</button>
                            </div>
                        </div>
                    </Card>
                </div>
             )}

             <Card variant="highlight" className="mb-6 p-5 relative overflow-hidden group cursor-pointer border-[#6FAE9A]/20" onClick={() => user ? setView(ViewState.ONBOARDING) : setView(ViewState.AUTH)}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6FAE9A]/15 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-[#6FAE9A]" />
                        <span className="text-xs font-bold text-[#6FAE9A] uppercase tracking-wider">{t.dailyCheck}</span>
                    </div>
                    <h3 className="font-bold text-xl text-[#1C1C1C] mb-1">{t.howAreYou}</h3>
                    <p className="text-sm text-gray-500 mb-3 font-medium">{t.updateStatus}</p>
                </div>
             </Card>

             {/* Large Scan Product Card as per image */}
             <div className="mb-6" onClick={handleScanAction}>
                <Card variant="standard" className="p-5 flex items-center gap-5 cursor-pointer !border-none !shadow-[0_10px_30px_rgba(0,0,0,0.05)] group bg-white">
                    <div className="w-20 h-20 rounded-2xl bg-[#6FAE9A] flex items-center justify-center text-white shadow-lg shadow-[#6FAE9A]/20 flex-shrink-0">
                        <div className="relative w-10 h-10 border-2 border-white/40 rounded-xl flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 border-2 border-white rounded-lg"></div>
                            <Scan size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-2xl text-[#1C1C1C] leading-none mb-2">{t.scanProduct}</h3>
                        <div className="text-sm font-medium text-gray-500 space-y-0.5">
                            <p>{t.scanPrompt} <span className="font-bold">{t.scanAnyLabel}</span></p>
                            <p className="text-[#6FAE9A] font-bold">{t.scanFoodSkincare}</p>
                        </div>
                    </div>
                    <ChevronRight size={24} className="text-gray-300" />
                </Card>
             </div>

             {/* Specialized Scan Grid */}
             <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Skincare - Pink */}
                <div 
                    onClick={handleScanAction}
                    className="relative h-44 rounded-3xl overflow-hidden cursor-pointer group active:scale-95 transition-all shadow-[0_10px_25px_rgba(251,207,232,0.3)] bg-gradient-to-br from-pink-400 to-rose-500 border border-white/20"
                >
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-xl text-white">
                        <Smile size={20} />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-black text-lg leading-tight mb-1">{t.scanFace}</p>
                        <div className="h-1 w-8 bg-white/40 rounded-full"></div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-20 transform -rotate-12 group-hover:scale-110 transition-transform">
                        <Smile size={100} className="text-white" />
                    </div>
                </div>

                {/* Food - Yellow */}
                <div 
                    onClick={handleScanAction}
                    className="relative h-44 rounded-3xl overflow-hidden cursor-pointer group active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,210,0,0.3)] bg-gradient-to-br from-[#FFD200] to-[#F7931E] border border-white/20"
                >
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-xl text-white">
                        <Utensils size={20} />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-black text-lg leading-tight mb-1">{t.scanEat}</p>
                        <div className="h-1 w-8 bg-white/40 rounded-full"></div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-20 transform -rotate-12 group-hover:scale-110 transition-transform">
                        <Utensils size={100} className="text-white" />
                    </div>
                </div>
             </div>

             {/* Your Favorites Horizontal Scroll */}
             {userFavorites.length > 0 && (
                 <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <Heart size={18} className="text-rose-500 fill-rose-500" />
                            <h3 className="font-bold text-lg text-[#1C1C1C]">{t.yourFavorites}</h3>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                        {userFavorites.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => { setScanResult(item); setIsModalFromHistory(true); }}
                                className="w-32 flex-shrink-0 bg-white/70 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl mb-3">
                                    {renderIcon(item.icon)}
                                </div>
                                <p className="text-[11px] font-bold text-gray-800 line-clamp-1 mb-1">{item.productName}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === ScanStatus.SAFE ? 'bg-green-500' : item.status === ScanStatus.AVOID ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                    <span className="text-[9px] font-bold text-gray-400">{item.score}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

             {/* New "Favourites user scan" Vertical Section at Bottom */}
             {userFavorites.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-xl text-[#1C1C1C] mb-4 px-1">{t.favoritesUserScan}</h3>
                    <div className="space-y-4">
                        {userFavorites.map((item) => (
                             <div 
                                key={item.id} 
                                onClick={() => { setScanResult(item); setIsModalFromHistory(true); }}
                                className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                                        {renderIcon(item.icon)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.productName}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase">{item.category} • {formatTimeAgo(item.timestamp)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Star size={18} fill="#FFD200" className="text-[#FFD200]" />
                                    <span className={`w-2.5 h-2.5 rounded-full ${item.status === ScanStatus.SAFE ? 'bg-green-500' : item.status === ScanStatus.AVOID ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'Explore' && <Suspense fallback={<LoadingSpinner />}><ExploreView userProfile={user} translations={t} /></Suspense>}
      
      {activeTab === 'Routine' && (
        <div className="p-6 pt-12 animate-in fade-in duration-500 min-h-screen no-scrollbar overflow-y-auto pb-32">
            {!showHistoryDetail ? (
                <>
                <h1 className="text-3xl font-extrabold mb-2 text-[#1C1C1C]">{t.routine}</h1>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">{t.routineDesc}</p>
                
                <div className="space-y-6">
                    <Card variant="standard" className="p-1 flex flex-col cursor-pointer hover:border-[#6FAE9A]/40 transition-all shadow-lg shadow-[#6FAE9A]/5 border border-white/80 group" onClick={() => setShowHistoryDetail(true)}>
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4D8C7A]/20 to-[#4D8C7A]/10 flex items-center justify-center text-[#4D8C7A] group-hover:scale-105 transition-transform duration-500">
                                <History size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl text-[#1C1C1C] mb-1">{t.recentScans}</h3>
                                <div className="flex gap-1.5 overflow-hidden">
                                    {scanHistory.slice(0, 3).map(item => (
                                        <div key={item.id} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-[10px] border border-gray-50">
                                            {renderIcon(item.icon)}
                                        </div>
                                    ))}
                                    {scanHistory.length > 3 && <div className="text-[10px] text-gray-400 self-center font-bold">+{scanHistory.length - 3}</div>}
                                    {scanHistory.length === 0 && <span className="text-xs text-gray-400 font-medium">{t.noScans}</span>}
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </Card>

                    <Card variant="standard" className="p-1 flex flex-col cursor-pointer hover:border-pink-200 transition-all shadow-lg shadow-pink-500/5 border border-white/80 group">
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400/20 to-pink-400/10 flex items-center justify-center text-pink-500 group-hover:scale-105 transition-transform duration-500">
                                <Smile size={32} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-xl text-[#1C1C1C]">{t.skincareRoutine}</h3>
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-pink-500/10 rounded-full">
                                        <Zap size={10} className="text-pink-500 fill-pink-500" />
                                        <span className="text-[9px] font-bold text-pink-500 uppercase tracking-tighter">AI Ready</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 font-medium">{t.aiSync}</p>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </Card>

                    <Card variant="standard" className="p-1 flex flex-col cursor-pointer hover:border-amber-200 transition-all shadow-lg shadow-amber-500/5 border border-white/80 group">
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD200]/20 to-[#FFD200]/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform duration-500">
                                <Utensils size={32} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-xl text-[#1C1C1C]">{t.foodTracking}</h3>
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full">
                                        <Zap size={10} className="text-amber-500 fill-amber-500" />
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">AI Ready</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 font-medium">{t.aiSync}</p>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </Card>

                    <Card variant="glass" className="p-6 bg-white/40 border-dashed border-2 border-gray-200">
                        <div className="flex flex-col items-center text-center py-4">
                            <Activity className="text-gray-300 mb-3" size={40} />
                            <h4 className="font-bold text-gray-400">Sync Health Data</h4>
                            <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Coming soon: Connect Apple Health to automatically track your vitality.</p>
                        </div>
                    </Card>
                </div>
                </>
            ) : (
                <div className="animate-in slide-in-from-right-10 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => setShowHistoryDetail(false)} className="p-2 bg-white rounded-full shadow-sm text-gray-500">
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-extrabold text-[#1C1C1C]">{t.recentScans}</h1>
                    </div>

                    <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
                        <button 
                            onClick={() => setHistoryCategory('recent')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${historyCategory === 'recent' ? 'bg-white text-[#6FAE9A] shadow-sm' : 'text-gray-400'}`}
                        >
                            {t.recent}
                        </button>
                        <button 
                            onClick={() => setHistoryCategory('favorites')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${historyCategory === 'favorites' ? 'bg-white text-[#6FAE9A] shadow-sm' : 'text-gray-400'}`}
                        >
                            {t.favorites}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {filteredHistory.length > 0 ? filteredHistory.map(item => (
                             <div key={item.id} className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 cursor-pointer group" onClick={() => { setScanResult(item); setIsModalFromHistory(true); }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">{renderIcon(item.icon)}</div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.productName}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase">{formatTimeAgo(item.timestamp)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item.id); }}
                                        className={`p-2 rounded-full transition-colors ${item.isFavorite ? 'text-yellow-400' : 'text-gray-200'}`}
                                    >
                                        <Star size={18} fill={item.isFavorite ? "currentColor" : "none"} />
                                    </button>
                                    <span className={`w-2.5 h-2.5 rounded-full ${item.status === ScanStatus.SAFE ? 'bg-green-500' : item.status === ScanStatus.AVOID ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center py-20 text-gray-300">
                                <History size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">{historyCategory === 'favorites' ? t.noFavorites : t.noScans}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      )}

      {activeTab === 'Profile' && (
         <div className="p-6 pt-12 animate-in fade-in duration-500 pb-32 overflow-y-auto max-h-screen no-scrollbar">
            <h1 className="text-3xl font-extrabold mb-8 text-center text-[#1C1C1C]">{t.profile}</h1>
            {user ? (
                <>
                <div className="flex flex-col items-center mb-8">
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-[#6FAE9A] to-[#4D8C7A] mb-4 shadow-xl">
                        <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=6FAE9A&color=fff`} alt="Profile" className="w-full h-full object-cover rounded-full border-4 border-white" />
                    </div>
                    <h2 className="text-2xl font-bold">{user?.name}</h2>
                    <button onClick={handleOpenKeySelector} className={`mt-2 text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full ${hasApiKey ? 'text-[#6FAE9A] bg-[#6FAE9A]/10' : 'text-red-600 bg-red-50'}`}>
                        <Key size={12} /> {hasApiKey ? t.apiKeyActive : t.apiKeyRequired}
                    </button>
                </div>

                <div className="space-y-6">
                    <Card variant="standard" className="p-5">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-gray-400 font-bold uppercase">{t.healthCondition}</p>
                            <Activity size={16} className="text-[#6FAE9A]" />
                        </div>
                        <p className="font-bold text-xl text-[#1C1C1C] mb-2">{user?.customConditionName || user?.condition}</p>
                        
                        {(user?.additionalContext?.length > 0 || user?.currentSymptoms?.length > 0) && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                {user.additionalContext.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <div className="w-1 h-1 rounded-full bg-[#6FAE9A]" />
                                        {item}
                                    </div>
                                ))}
                                {user.currentSymptoms.map((sym, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                        <Activity size={10} />
                                        {sym}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Button variant="secondary" fullWidth onClick={() => setView(ViewState.ONBOARDING)} className="mb-8">
                        {t.changeProfile}
                    </Button>

                    <Card variant="standard" className="p-5 cursor-pointer hover:border-[#6FAE9A]/40 transition-all group" onClick={() => setShowLanguageModal(true)}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#6FAE9A]/10 flex items-center justify-center text-[#6FAE9A] group-hover:scale-105 transition-transform">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">{t.language}</p>
                                    <p className="font-bold text-lg text-[#1C1C1C]">
                                        {languageOptions.find(opt => opt.code === currentLang)?.flag} {languageOptions.find(opt => opt.code === currentLang)?.native}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </Card>

                    <div className="pt-4">
                        <Button variant="ghost" fullWidth onClick={handleSignOut}>{t.signOut}</Button>
                    </div>
                </div>
                </>
            ) : <Button fullWidth onClick={() => setView(ViewState.AUTH)}>Log In / Sign Up</Button>}
         </div>
      )}

      {showLanguageModal && (
        <div className="fixed inset-0 z-[60] bg-white animate-in slide-in-from-bottom-10 flex flex-col no-scrollbar">
            <div className="p-6 pt-12 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <h2 className="text-2xl font-extrabold text-[#1C1C1C]">{t.selectLanguage}</h2>
                <button onClick={() => setShowLanguageModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-all">
                    <X size={24} />
                </button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto">
                {languageOptions.map((opt) => (
                    <button 
                        key={opt.code}
                        onClick={() => handleLanguageChange(opt.code)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${currentLang === opt.code ? 'bg-[#6FAE9A]/5 border-[#6FAE9A] shadow-md shadow-[#6FAE9A]/5' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-3xl">{opt.flag}</span>
                            <div className="text-left">
                                <p className={`font-bold text-lg ${currentLang === opt.code ? 'text-[#6FAE9A]' : 'text-gray-800'}`}>{opt.native}</p>
                                <p className="text-xs text-gray-400 font-medium">{opt.label}</p>
                            </div>
                        </div>
                        {currentLang === opt.code && (
                            <div className="w-8 h-8 rounded-full bg-[#6FAE9A] flex items-center justify-center text-white">
                                <Check size={18} strokeWidth={3} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
      )}

      {(isScanning || scanResult) && (
        <Suspense fallback={<LoadingSpinner />}>
            <ResultModal 
                result={scanResult} 
                isLoading={isScanning} 
                isHistoryView={isModalFromHistory}
                onClose={() => { setScanResult(null); setIsScanning(false); }} 
                onToggleFavorite={handleToggleFavorite}
            />
        </Suspense>
      )}

      <div className="fixed bottom-6 left-6 right-6 z-30 max-w-[400px] mx-auto">
         <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-40">
            <button onClick={handleScanAction} className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#6FAE9A] to-[#4D8C7A] text-white shadow-lg flex items-center justify-center border-4 border-[#F0FDF9] active:scale-95 transition-all"><Scan size={28} /></button>
         </div>
         <div className="glass-nav px-2 py-4 flex justify-between items-center rounded-2xl relative z-30 border border-white/60">
            <div className="flex-1 flex justify-around">
               <NavIcon icon={Home} label="Home" isActive={activeTab === 'Home'} onClick={() => { setActiveTab('Home'); setShowHistoryDetail(false); }} />
               <NavIcon icon={Compass} label="Explore" isActive={activeTab === 'Explore'} onClick={() => { setActiveTab('Explore'); setShowHistoryDetail(false); }} />
            </div>
            <div className="w-16"></div>
            <div className="flex-1 flex justify-around">
               <NavIcon icon={ClipboardList} label="Routine" isActive={activeTab === 'Routine'} onClick={() => setActiveTab('Routine')} />
               <NavIcon icon={User} label="Profile" isActive={activeTab === 'Profile'} onClick={() => { setActiveTab('Profile'); setShowHistoryDetail(false); }} />
            </div>
         </div>
      </div>
    </div>
  );
};

export default App;
