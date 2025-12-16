import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, ScanResult, ScanHistoryItem, ScanStatus } from './types';
import Onboarding from './components/Onboarding';
import { Home, Scan, Compass, User, Clock, Activity, ChevronRight, History, Sparkles } from 'lucide-react';
import Card from './components/Card';
import Button from './components/Button';
import Scanner from './components/Scanner';
import ResultModal from './components/ResultModal';
import ExploreView from './components/ExploreView';
import Auth from './components/Auth';
import { analyzeImage } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { getUserProfile, updateUserProfile, getScanHistory, addScanResult } from './services/dbService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [loadingApp, setLoadingApp] = useState(true);

  // Initialize App and Auth Listener
  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        const profile = await getUserProfile(session.user.id);
        
        if (profile) {
          setUser(profile);
          const history = await getScanHistory(session.user.id);
          setScanHistory(history);
          setView(ViewState.HOME);
        } else {
          setView(ViewState.ONBOARDING);
        }
      } else {
        setView(ViewState.AUTH);
      }
      setLoadingApp(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUserId(session.user.id);
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
          const history = await getScanHistory(session.user.id);
          setScanHistory(history);
          setView(ViewState.HOME);
        } else {
          setView(ViewState.ONBOARDING);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserId(null);
        setScanHistory([]);
        setView(ViewState.AUTH);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    if (!userId) return;
    
    // Override name with auth metadata if available
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser?.user_metadata?.full_name) {
       profile.name = authUser.user_metadata.full_name;
    } else if (authUser?.email) {
       profile.name = authUser.email.split('@')[0];
    }

    await updateUserProfile(userId, profile);
    setUser(profile);
    setView(ViewState.HOME);
  };

  const handleScanCapture = async (imageSrc: string) => {
    setView(ViewState.HOME); 
    setIsScanning(true);
    setScanResult(null); 

    if (!user || !userId) return;

    const rawBase64 = imageSrc.split(',')[1];
    
    try {
      const result = await analyzeImage(rawBase64, user);
      setScanResult(result);
      
      const newHistoryItem: ScanHistoryItem = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
      
      await addScanResult(userId, newHistoryItem);
      setScanHistory(prev => [newHistoryItem, ...prev]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusStyles = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return "text-green-600 bg-green-50 border-green-100";
      case ScanStatus.AVOID: return "text-red-600 bg-red-50 border-red-100";
      case ScanStatus.CAUTION: return "text-yellow-600 bg-yellow-50 border-yellow-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  const NavIcon = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-1 transition-all duration-300 w-12 ${isActive ? 'text-[#6FAE9A] -translate-y-1' : 'text-gray-400 group hover:text-gray-600'}`}>
      <div className={`p-2 rounded-full transition-all ${isActive ? 'bg-[#6FAE9A]/10' : 'bg-transparent'}`}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-sm" : ""} />
      </div>
    </button>
  );

  if (loadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6FAE9A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ---------- RENDER VIEWS ----------

  if (view === ViewState.AUTH) {
    return <Auth />;
  }

  if (view === ViewState.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === ViewState.SCANNER) {
    return (
      <Scanner 
        onCapture={handleScanCapture} 
        onClose={() => setView(ViewState.HOME)} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden bg-[#F0FDF9]">
      
      {/* --- HOME VIEW --- */}
      {activeTab === 'Home' && (
        <div className="flex flex-col h-screen max-h-screen animate-in fade-in duration-500">
          
          <div className="p-6 pt-12 flex-1 overflow-y-auto no-scrollbar pb-32">
             
             {/* Header Info */}
             <div className="flex justify-between items-start mb-6">
               <div>
                  <h1 className="text-3xl font-bold text-[#1C1C1C] tracking-tight">{getGreeting()},</h1>
                  {/* Gradient Text for Name */}
                  <p className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#6FAE9A] to-[#3B6E5F] truncate max-w-[200px]">
                    {user?.name?.split(' ')[0]}
                  </p>
               </div>
               <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md border-2 border-white p-0.5 shadow-md overflow-hidden cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveTab('Profile')}>
                  <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=6FAE9A&color=fff`} alt="Profile" className="w-full h-full object-cover rounded-full" />
               </div>
             </div>

             {/* Condition Check-in Card (Highlighted) */}
             <Card variant="highlight" className="mb-6 p-5 relative overflow-hidden group cursor-pointer border-[#6FAE9A]/20" onClick={() => setView(ViewState.ONBOARDING)}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6FAE9A]/15 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#6FAE9A]/25 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded-md bg-[#6FAE9A]/10">
                           <Sparkles size={14} className="text-[#6FAE9A]" />
                        </div>
                        <span className="text-xs font-bold text-[#6FAE9A] uppercase tracking-wider">Daily Check-in</span>
                    </div>
                    <h3 className="font-bold text-xl text-[#1C1C1C] mb-1">How is your condition today?</h3>
                    <p className="text-sm text-gray-500 mb-3 font-medium">Update symptoms for accurate results.</p>
                    <div className="flex items-center gap-1 text-[#6FAE9A] font-bold text-sm group-hover:gap-2 transition-all">
                        <span>Update Status</span>
                        <ChevronRight size={16} />
                    </div>
                </div>
             </Card>

             {/* Scan Action Card - Stronger Gradient */}
             <div className="mb-8" onClick={() => setView(ViewState.SCANNER)}>
                <Card variant="standard" className="p-2 flex items-center gap-4 cursor-pointer !border-none !shadow-[0_10px_30px_rgba(111,174,154,0.15)] group active:scale-[0.98]">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#6FAE9A] to-[#428070] flex items-center justify-center text-white shadow-lg shadow-[#6FAE9A]/30 group-hover:shadow-[#6FAE9A]/50 transition-all">
                        <Scan size={36} className="group-hover:scale-110 transition-transform drop-shadow-md" />
                    </div>
                    <div className="flex-1 py-2 pr-4">
                        <h3 className="font-bold text-lg text-[#1C1C1C] mb-1">Scan Product</h3>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Point camera at any label <br/>
                            <span className="text-[#6FAE9A] font-bold tracking-wide">(Food or Skincare)</span>
                        </p>
                    </div>
                    <div className="pr-4 text-gray-300 group-hover:text-[#6FAE9A] transition-colors">
                        <ChevronRight size={24} />
                    </div>
                </Card>
             </div>

             {/* Recent Scans List */}
             <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[#1C1C1C] text-lg">Recent Scans</h3>
                    <button className="text-xs text-[#6FAE9A] font-bold uppercase tracking-wide hover:bg-[#6FAE9A]/10 px-2 py-1 rounded-md transition-colors" onClick={() => setActiveTab('MyScan')}>View All</button>
                </div>

                <div className="space-y-3">
                    {scanHistory.length === 0 ? (
                        <div className="text-center py-10 bg-white/40 rounded-3xl border border-white/50 border-dashed">
                            <p className="text-sm text-gray-400 font-medium">No scans yet. Try scanning an item!</p>
                        </div>
                    ) : (
                        scanHistory.slice(0, 5).map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setScanResult(item)}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50 cursor-pointer active:scale-[0.99] transition-transform hover:shadow-md hover:border-[#6FAE9A]/20"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F0FDF9] to-white border border-[#F0FDF9] flex items-center justify-center text-2xl shadow-sm">
                                    {item.icon || "📦"}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 line-clamp-1">{item.productName}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{formatTimeAgo(item.timestamp)}</p>
                                </div>
                            </div>
                            <span className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-white ${
                                item.status === ScanStatus.SAFE ? 'bg-green-500' :
                                item.status === ScanStatus.AVOID ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></span>
                        </div>
                        ))
                    )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- EXPLORE VIEW --- */}
      {activeTab === 'Explore' && (
          <ExploreView userProfile={user} />
      )}

      {/* --- MY SCAN VIEW --- */}
      {activeTab === 'MyScan' && (
         <div className="p-6 pt-12 animate-in fade-in duration-500 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-6 text-[#1C1C1C]">History</h1>

            <div className="space-y-3 pb-24">
               {scanHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                     <History size={48} className="mb-4" />
                     <p className="text-gray-500 font-medium">No history yet.</p>
                  </div>
               ) : (
                  scanHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setScanResult(item)}>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">
                             {item.icon || "📦"}
                          </div>
                          <div>
                             <p className="font-bold text-gray-800 line-clamp-1">{item.productName}</p>
                             <p className="text-xs text-gray-400 font-medium">{formatTimeAgo(item.timestamp)}</p>
                          </div>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(item.status)}`}>
                          {item.status}
                       </span>
                    </div>
                  ))
               )}
            </div>
         </div>
      )}
      
      {/* --- PROFILE VIEW --- */}
      {activeTab === 'Profile' && (
         <div className="p-6 pt-12 animate-in fade-in duration-500">
            <h1 className="text-3xl font-extrabold mb-8 text-center text-[#1C1C1C]">Profile</h1>
            <div className="flex flex-col items-center mb-10">
               <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-[#6FAE9A] to-[#4D8C7A] mb-4 shadow-xl shadow-[#6FAE9A]/20">
                  <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-white">
                    <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=6FAE9A&color=fff`} alt="Profile" className="w-full h-full object-cover" />
                  </div>
               </div>
               <h2 className="text-2xl font-bold">{user?.name}</h2>
               <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <p className="text-green-700 text-xs font-bold uppercase tracking-wide">Active</p>
               </div>
            </div>

            <Card variant="highlight" className="mb-6 shadow-md border-white">
               <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Condition</p>
                  <Activity size={16} className="text-[#6FAE9A]" />
               </div>
               <p className="font-bold text-xl text-[#1C1C1C] mb-2">
                  {user?.customConditionName || user?.condition}
               </p>
               {user?.additionalContext?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                     {user.additionalContext.map((ctx, i) => (
                        <span key={i} className="text-xs bg-white text-[#6FAE9A] px-2 py-1 rounded-md font-semibold border border-[#6FAE9A]/10 shadow-sm max-w-full truncate">{ctx}</span>
                     ))}
                  </div>
               )}
            </Card>

            <div className="space-y-3">
                <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => setView(ViewState.ONBOARDING)}
                className="bg-white"
                >
                Edit Health Profile
                </Button>

                <Button variant="ghost" fullWidth onClick={handleSignOut}>Sign Out</Button>
            </div>
         </div>
      )}

      {/* --- RESULT MODAL --- */}
      {(isScanning || scanResult) && (
        <ResultModal 
          result={scanResult} 
          isLoading={isScanning}
          onClose={() => {
             setScanResult(null);
             setIsScanning(false);
          }} 
        />
      )}

      {/* --- FLOATING NAVIGATION --- */}
      <div className="fixed bottom-6 left-6 right-6 z-30 max-w-[400px] mx-auto">
         {/* Floating Scan Button (Center - GREEN MATCHING) */}
         <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-40">
            <button 
              onClick={() => setView(ViewState.SCANNER)}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#6FAE9A] to-[#4D8C7A] text-white shadow-[0_10px_30px_rgba(111,174,154,0.5)] flex items-center justify-center border-4 border-[#F0FDF9] active:scale-95 transition-all hover:shadow-[0_15px_40px_rgba(111,174,154,0.6)] hover:-translate-y-1"
            >
              <Scan size={28} className="drop-shadow-md" />
            </button>
         </div>

         {/* Nav Container */}
         <div className="glass-nav px-2 py-4 flex justify-between items-center rounded-2xl relative z-30 border border-white/60">
            <div className="flex-1 flex justify-around">
               <NavIcon icon={Home} label="Home" isActive={activeTab === 'Home'} onClick={() => setActiveTab('Home')} />
               <NavIcon icon={Compass} label="Explore" isActive={activeTab === 'Explore'} onClick={() => setActiveTab('Explore')} />
            </div>
            
            {/* Spacer for Center Button */}
            <div className="w-16"></div>

            <div className="flex-1 flex justify-around">
               <NavIcon icon={History} label="History" isActive={activeTab === 'MyScan'} onClick={() => setActiveTab('MyScan')} />
               <NavIcon icon={User} label="Profile" isActive={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
            </div>
         </div>
      </div>

    </div>
  );
};

export default App;