import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, ScanResult, ScanHistoryItem, ScanStatus } from './types';
import Onboarding from './components/Onboarding';
import { Home, Scan, Compass, User, Camera, Clock, Activity, ChevronRight, History } from 'lucide-react';
import Card from './components/Card';
import Button from './components/Button';
import Scanner from './components/Scanner';
import ResultModal from './components/ResultModal';
import ExploreView from './components/ExploreView';
import { analyzeImage } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  // Load User and History
  useEffect(() => {
    const savedUser = localStorage.getItem('vitalSense_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView(ViewState.HOME);
    }

    const savedHistory = localStorage.getItem('vitalSense_history');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('vitalSense_user', JSON.stringify(profile));
    setView(ViewState.HOME);
  };

  const handleScanCapture = async (imageSrc: string) => {
    setView(ViewState.HOME); 
    setIsScanning(true);
    setScanResult(null); 

    if (!user) return;

    const rawBase64 = imageSrc.split(',')[1];
    
    try {
      const result = await analyzeImage(rawBase64, user);
      setScanResult(result);
      
      // Save to History
      const newHistoryItem: ScanHistoryItem = {
        ...result,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      
      const updatedHistory = [newHistoryItem, ...scanHistory];
      setScanHistory(updatedHistory);
      localStorage.setItem('vitalSense_history', JSON.stringify(updatedHistory));

    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusStyles = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return "text-green-600 bg-green-50";
      case ScanStatus.AVOID: return "text-red-600 bg-red-50";
      case ScanStatus.CAUTION: return "text-yellow-600 bg-yellow-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const NavIcon = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#6FAE9A]' : 'text-gray-400'}`}>
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  // ---------- RENDER VIEWS ----------

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
    <div className="min-h-screen bg-[#F8F9FA] pb-24 relative overflow-hidden">
      
      {/* --- HOME VIEW --- */}
      {activeTab === 'Home' && (
        <div className="p-6 pt-12 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
               <p className="text-gray-500 text-sm font-medium">Good Morning,</p>
               <h1 className="text-2xl font-bold text-[#1C1C1C]">{user?.name || "Sarah"}</h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
               <img src="https://picsum.photos/100/100" alt="Profile" />
            </div>
          </div>

          {/* Daily Insight Hero */}
          <Card variant="standard" className="bg-gradient-to-br from-[#6FAE9A] to-[#4D8C7A] text-white p-6 mb-6 shadow-[0_8px_30px_rgba(111,174,154,0.4)] border-none">
            <h2 className="text-lg font-bold mb-2">How is your body feeling?</h2>
            <p className="text-white/80 text-sm mb-6">Update your symptoms for accurate scanning.</p>
            
            <div className="flex justify-between gap-2">
               {['Nausea', 'Fatigue', 'Great'].map(sym => (
                  <button 
                    key={sym}
                    className="flex-1 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-semibold transition-colors"
                  >
                    {sym}
                  </button>
               ))}
            </div>
          </Card>

          {/* Scan Ingredients CTA Button */}
          <div 
             onClick={() => setView(ViewState.SCANNER)}
             className="w-full bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-6 flex items-center gap-4 cursor-pointer active:scale-98 transition-transform border border-gray-50"
          >
             <div className="w-14 h-14 rounded-2xl bg-[#EAF4F0] flex items-center justify-center text-[#6FAE9A]">
                <Camera size={28} />
             </div>
             <div className="flex-1">
                <h3 className="text-lg font-bold text-[#1C1C1C]">Scan ingredients</h3>
                <p className="text-sm text-gray-500">Point camera at any label</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Scan size={16} className="text-gray-400" />
             </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-[#1C1C1C]">Recently Scanned</h3>
               <button className="text-xs text-[#6FAE9A] font-semibold" onClick={() => setActiveTab('MyScan')}>View All</button>
            </div>
            
            <div className="space-y-3">
               {scanHistory.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                     <History className="mx-auto text-gray-300 mb-2" size={24} />
                     <p className="text-sm text-gray-400">No scans yet. Try scanning something!</p>
                  </div>
               ) : (
                 scanHistory.slice(0, 3).map((item) => (
                   <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm cursor-pointer" onClick={() => setScanResult(item)}>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                            {item.icon || "📦"}
                         </div>
                         <div>
                            <p className="font-semibold text-sm text-gray-800 line-clamp-1">{item.productName}</p>
                            <p className="text-xs text-gray-400">{formatTimeAgo(item.timestamp)}</p>
                         </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyles(item.status)}`}>
                         {item.status.toUpperCase()}
                      </span>
                   </div>
                 ))
               )}
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
            <h1 className="text-2xl font-bold mb-6 text-[#1C1C1C]">My Scans</h1>

            {/* Body/Face Scan Card */}
            <div 
               onClick={() => setView(ViewState.SCANNER)}
               className="w-full bg-gradient-to-r from-[#eef2ff] to-[#e0e7ff] rounded-3xl p-5 mb-8 shadow-sm flex items-center gap-4 cursor-pointer active:scale-98 transition-transform border border-indigo-100"
            >
               <div className="w-14 h-14 rounded-2xl bg-white text-indigo-500 flex items-center justify-center shadow-sm">
                  <Activity size={28} />
               </div>
               <div className="flex-1">
                  <h3 className="text-lg font-bold text-indigo-900">Body & Face Scan</h3>
                  <p className="text-sm text-indigo-700/80">Analyze skin conditions or symptoms</p>
               </div>
               <ChevronRight className="text-indigo-300" />
            </div>

            {/* History List */}
            <h3 className="font-bold text-[#1C1C1C] mb-4">History Scan</h3>
            <div className="space-y-3 pb-24">
               {scanHistory.length === 0 ? (
                  <div className="text-center py-12">
                     <p className="text-gray-400">Your history is empty.</p>
                     <Button variant="ghost" onClick={() => setView(ViewState.SCANNER)}>Scan a Product</Button>
                  </div>
               ) : (
                  scanHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-50 cursor-pointer active:bg-gray-50 transition-colors" onClick={() => setScanResult(item)}>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg">
                             {item.icon || "📦"}
                          </div>
                          <div>
                             <p className="font-semibold text-sm text-gray-800 line-clamp-1">{item.productName}</p>
                             <p className="text-xs text-gray-400">{formatTimeAgo(item.timestamp)}</p>
                          </div>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyles(item.status)}`}>
                          {item.status.toUpperCase()}
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
            <h1 className="text-2xl font-bold mb-6">Profile</h1>
            <div className="flex flex-col items-center mb-8">
               <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg mb-3">
                  <img src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full object-cover" />
               </div>
               <h2 className="text-xl font-bold">{user?.name}</h2>
               <p className="text-gray-500 text-sm">Member since 2024</p>
            </div>

            <Card className="mb-4">
               <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Health Condition</p>
               </div>
               <p className="font-medium text-lg text-[#6FAE9A] mb-1">
                  {user?.customConditionName || user?.condition}
               </p>
               {user?.additionalContext?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                     {user.additionalContext.map((ctx, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 max-w-full truncate">{ctx}</span>
                     ))}
                  </div>
               )}
            </Card>

            <Button 
               variant="primary" 
               fullWidth 
               className="mb-4"
               onClick={() => setView(ViewState.ONBOARDING)}
            >
               Update Health Profile
            </Button>

            <Button variant="ghost" fullWidth onClick={() => {
               localStorage.removeItem('vitalSense_user');
               localStorage.removeItem('vitalSense_history');
               setScanHistory([]);
               setView(ViewState.ONBOARDING);
            }}>Sign Out</Button>
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

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 pb-8 flex justify-between items-center z-30 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)] max-w-[450px] mx-auto">
        <NavIcon icon={Home} label="Home" isActive={activeTab === 'Home'} onClick={() => setActiveTab('Home')} />
        <NavIcon icon={Compass} label="Explore" isActive={activeTab === 'Explore'} onClick={() => setActiveTab('Explore')} />
        
        {/* FAB for Scan */}
        <button 
          onClick={() => setView(ViewState.SCANNER)}
          className="w-16 h-16 -mt-8 bg-[#6FAE9A] rounded-full shadow-[0_8px_20px_rgba(111,174,154,0.4)] flex items-center justify-center text-white transition-transform active:scale-95 border-4 border-[#F8F9FA]"
        >
          <Scan size={28} />
        </button>
        
        <NavIcon icon={Clock} label="My Scan" isActive={activeTab === 'MyScan'} onClick={() => setActiveTab('MyScan')} />
        <NavIcon icon={User} label="Profile" isActive={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
      </div>
    </div>
  );
};

export default App;