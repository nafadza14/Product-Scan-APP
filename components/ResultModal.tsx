import React from 'react';
import { ScanResult, ScanStatus, MacroNutrient } from '../types';
import { CheckCircle2, X, AlertTriangle, Ban, Info, Leaf, Wheat, Milk, Check, Droplet, Candy, Dumbbell, Flame, Package } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface ResultModalProps {
  result: ScanResult | null;
  onClose: () => void;
  isLoading: boolean;
}

// Helper to get color based on score
const getScoreColor = (score: number) => {
    if (score >= 81) return '#1E8F4E'; // A - Dark Green
    if (score >= 61) return '#7AC943'; // B - Light Green
    if (score >= 41) return '#FFD200'; // C - Yellow
    if (score >= 21) return '#F7931E'; // D - Orange
    return '#E53935'; // E - Red
};

const ScoreGauge = ({ score }: { score: number }) => {
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const activeColor = getScoreColor(score);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Label moved to top */}
      <div className="absolute top-2 left-0 right-0 flex justify-center z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Safety Score</span>
      </div>

      <div className="relative flex items-center justify-center w-40 h-40">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform rotate-[135deg]"
        >
          {/* Track */}
          <circle
            stroke="#f3f4f6"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: circumference * 0.25 }}
          />
          {/* Progress */}
          <circle
            stroke={activeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ 
                strokeDasharray: `${circumference} ${circumference}`, 
                strokeDashoffset: Math.max(strokeDashoffset, circumference * 0.25),
                transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease'
            }}
          />
        </svg>
        
        {/* Centered Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-5">
            <span 
                className="text-4xl font-black tracking-tight transition-colors duration-300 leading-none"
                style={{ color: activeColor }}
            >
                {score}
            </span>
        </div>
      </div>
      
      {/* Context Label */}
      <div className="mt-[-25px] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 shadow-sm z-10">
        <p className="text-[10px] font-bold text-gray-500 text-center whitespace-nowrap">
            According to your condition
        </p>
      </div>
    </div>
  );
};

const NutriScoreBadge = ({ score }: { score: string }) => {
    const scores = ['A', 'B', 'C', 'D', 'E'];
    const colors: Record<string, string> = {
        'A': '#1E8F4E', 'B': '#7AC943', 'C': '#FFD200', 'D': '#F7931E', 'E': '#E53935'
    };

    return (
        <div className="flex flex-col items-center justify-center h-full pb-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Nutri-Score</span>
            <div className="flex items-center bg-gray-100 p-1 rounded-xl shadow-inner">
                {scores.map((s) => {
                    const isActive = score === s;
                    return (
                        <div 
                            key={s}
                            className={`
                                w-9 h-11 flex items-center justify-center text-base font-black transition-all duration-300 relative
                                ${isActive 
                                    ? 'z-10 scale-110 shadow-lg text-white rounded-lg transform -translate-y-0.5' 
                                    : 'text-white/40 scale-100'
                                }
                            `}
                            style={{ 
                                backgroundColor: colors[s],
                                borderRadius: isActive ? '8px' : undefined,
                                borderTopLeftRadius: !isActive && s === 'A' ? '8px' : undefined,
                                borderBottomLeftRadius: !isActive && s === 'A' ? '8px' : undefined,
                                borderTopRightRadius: !isActive && s === 'E' ? '8px' : undefined,
                                borderBottomRightRadius: !isActive && s === 'E' ? '8px' : undefined,
                            }}
                        >
                            {s}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Sub-Components for Breakdown ---

const NutritionPreferenceRow = ({ icon, label, isSuitable }: { icon: React.ReactNode, label: string, isSuitable: boolean | undefined }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-3">
            <div className="text-gray-400">{icon}</div>
            <span className="text-sm font-medium text-[#1C1C1C]">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
            {isSuitable ? (
                <>
                  <Check size={16} className="text-green-500" />
                  <span className="text-xs font-bold text-gray-600">Probably</span>
                </>
            ) : (
                <>
                  <X size={16} className="text-gray-300" />
                  <span className="text-xs font-medium text-gray-400">Unlikely</span>
                </>
            )}
        </div>
    </div>
);

const NutritionAdvisorRow: React.FC<{ item: MacroNutrient }> = ({ item }) => {
    // Icon mapping
    const getIcon = (name: string) => {
        if (name.includes('Fat')) return <Droplet size={18} />;
        if (name.includes('Sugar')) return <Candy size={18} />;
        if (name.includes('Salt')) return <Flame size={18} />; // Abstract for salt
        if (name.includes('Protein')) return <Dumbbell size={18} />;
        return <Info size={18} />;
    };

    const getColor = (level: string) => {
        if (level === 'Low' || (item.name === 'Protein' && level === 'High')) return 'bg-green-500'; // Protein high is good
        if (level === 'Medium') return 'bg-yellow-400';
        return 'bg-red-500';
    };

    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
                <div className="text-gray-400 p-2 bg-gray-50 rounded-lg">{getIcon(item.name)}</div>
                <span className="text-sm font-bold text-[#1C1C1C]">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">{item.level}</span>
                <div className={`w-3 h-3 rounded-full ${getColor(item.level)}`}></div>
            </div>
        </div>
    );
};

const ResultModal: React.FC<ResultModalProps> = ({ result, onClose, isLoading }) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center w-72 animate-pulse">
          <div className="w-20 h-20 rounded-full border-4 border-[#6FAE9A] border-t-transparent animate-spin mb-6"></div>
          <h3 className="text-xl font-bold text-[#1C1C1C]">Analyzing...</h3>
          <p className="text-center text-gray-500 mt-2 text-sm font-medium">Checking ingredients against your profile...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isCosmetic = result.category === 'Cosmetic';
  
  // Render safe icon
  const renderIcon = (iconStr?: string) => {
    if (!iconStr || iconStr.length > 4) return <Package size={48} className="text-[#6FAE9A]" />;
    return iconStr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" onClick={onClose}></div>
      
      <div className="bg-[#F8F9FA] w-full sm:w-[450px] sm:rounded-3xl rounded-t-[2.5rem] max-h-[92vh] overflow-y-auto pointer-events-auto transform transition-transform duration-300 ease-out shadow-[0px_-10px_40px_rgba(0,0,0,0.2)] no-scrollbar flex flex-col">
        
        {/* Navigation */}
        <div className="sticky top-0 z-20 bg-[#F8F9FA]/95 backdrop-blur-xl p-4 flex justify-between items-center border-b border-gray-100">
            <h2 className="font-bold text-gray-400 text-xs uppercase tracking-widest">
                {isCosmetic ? 'Skincare Analysis' : 'Nutrition Analysis'}
            </h2>
            <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                <X size={18} />
            </button>
        </div>

        <div className="p-6 pt-4 pb-12">
            
            {/* Header Identity */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-[2rem] bg-white shadow-lg border border-gray-100 flex items-center justify-center text-6xl mb-4 overflow-hidden">
                    {renderIcon(result.icon)}
                </div>
                <h1 className="text-2xl font-extrabold text-[#1C1C1C] text-center leading-tight mb-2 max-w-[280px]">
                    {result.productName}
                </h1>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 bg-gray-100 px-2 py-1 rounded-md">
                    {result.category}
                </span>
                
                {/* SCORES - Conditional Layout */}
                <div className="flex w-full items-center justify-center gap-6 sm:gap-8 px-2">
                    {/* Only show NutriScore if Food AND available */}
                    {!isCosmetic && result.nutriScore && (
                        <>
                        <div className="flex-shrink-0">
                            <NutriScoreBadge score={result.nutriScore} />
                        </div>
                        <div className="h-16 w-[1px] bg-gray-200"></div>
                        </>
                    )}
                    <div className="flex-shrink-0">
                        <ScoreGauge score={result.score} />
                    </div>
                </div>
            </div>

            {/* Verdict Card */}
            <div className={`w-full rounded-2xl p-5 mb-8 shadow-xl transition-colors duration-300
                ${result.status === ScanStatus.SAFE ? 'bg-[#1E8F4E] text-white' : 
                  result.status === ScanStatus.CAUTION ? 'bg-[#FFD200] text-[#1C1C1C]' : 'bg-[#E53935] text-white'}
            `}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                        {result.status === ScanStatus.SAFE ? <CheckCircle2 size={24} /> : 
                         result.status === ScanStatus.CAUTION ? <AlertTriangle size={24} /> : <Ban size={24} />}
                    </div>
                    <div>
                        <span className="font-bold text-lg block leading-none mb-1">
                             {result.status === ScanStatus.SAFE ? 'Recommended' : 
                              result.status === ScanStatus.CAUTION ? 'Use with Caution' : 'Not Recommended'}
                        </span>
                        <span className="text-xs opacity-90 font-medium uppercase tracking-wide">
                             {result.status === ScanStatus.SAFE ? 'Safe for your condition' : 
                              result.status === ScanStatus.CAUTION ? 'Moderate risks detected' : 'High risk ingredients found'}
                        </span>
                    </div>
                </div>
                <p className={`text-sm font-medium leading-relaxed opacity-95 p-3 rounded-xl bg-black/5`}>
                    {result.explanation}
                </p>
            </div>

            {/* FOOD SECTIONS - HIDDEN FOR COSMETICS */}
            {!isCosmetic && (
                <>
                {/* 1. Nutrition Preference */}
                {result.dietarySuitability && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 text-[#1C1C1C]">Nutrition Preference</h3>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                            <NutritionPreferenceRow icon={<Leaf size={20} />} label="Vegan" isSuitable={result.dietarySuitability?.vegan} />
                            <NutritionPreferenceRow icon={<Leaf size={20} className="text-green-600" />} label="Vegetarian" isSuitable={result.dietarySuitability?.vegetarian} />
                            <NutritionPreferenceRow icon={<Wheat size={20} />} label="Gluten-Free" isSuitable={result.dietarySuitability?.glutenFree} />
                            <NutritionPreferenceRow icon={<Milk size={20} />} label="Free of Lactose" isSuitable={result.dietarySuitability?.lactoseFree} />
                        </div>
                    </div>
                )}

                {/* 2. Nutrition Advisor */}
                {result.nutritionAdvisor && result.nutritionAdvisor.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 text-[#1C1C1C]">Nutrition Advisor</h3>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                            {result.nutritionAdvisor.map((macro, idx) => (
                                <NutritionAdvisorRow key={idx} item={macro} />
                            ))}
                        </div>
                    </div>
                )}
                </>
            )}

            {/* 3. Ingredients - ALWAYS SHOW */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                     <h3 className="text-lg font-bold text-[#1C1C1C]">
                         {isCosmetic ? 'Ingredient Risks' : 'Ingredients Analysis'}
                     </h3>
                     <span className="text-xs font-bold text-[#6FAE9A] bg-[#6FAE9A]/10 px-2 py-1 rounded-md">
                         {result.ingredients.filter(i => i.riskLevel !== 'Safe').length} Concerns Found
                     </span>
                </div>
                
                {/* Risk Breakdown first */}
                {result.ingredients.filter(i => i.riskLevel !== 'Safe').length > 0 && (
                    <div className="mb-4 bg-red-50 rounded-2xl p-4 border border-red-100">
                         {result.ingredients.filter(i => i.riskLevel !== 'Safe').map((ing, i) => (
                             <div key={i} className="mb-3 last:mb-0">
                                 <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                                     <AlertTriangle size={14} />
                                     {ing.name}
                                 </div>
                                 <p className="text-xs text-red-600/80 leading-snug">{ing.description}</p>
                             </div>
                         ))}
                    </div>
                )}

                {/* Full Text List */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Ingredient List</p>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {result.fullIngredientList || "Ingredient list not detected."}
                    </p>
                </div>
            </div>

            {/* 4. Better Alternatives - ALWAYS SHOW */}
            {result.alternatives.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-[#1C1C1C]">Better Alternatives</h3>
                     <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Scroll for more</span>
                  </div>
                  
                  {/* Horizontal Scroll with "Peek" effect */}
                  <div className="flex overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar snap-x snap-mandatory">
                     {result.alternatives.map((alt, idx) => (
                       <Card 
                            key={idx} 
                            variant="standard" 
                            className="w-[200px] mr-4 p-4 border-gray-100 flex flex-col gap-2 flex-shrink-0 !rounded-2xl hover:scale-[1.02] snap-center shadow-md"
                        >
                          <div className="flex items-center justify-between">
                              <div className="w-8 h-8 rounded-full bg-[#EAF4F0] flex items-center justify-center text-[#6FAE9A]">
                                <CheckCircle2 size={16} />
                              </div>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{alt.name}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-3 leading-relaxed">{alt.reason}</p>
                          </div>
                       </Card>
                     ))}
                  </div>
                </div>
            )}

            <Button onClick={onClose} fullWidth className="shadow-xl shadow-[#6FAE9A]/20">Scan Another Item</Button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;