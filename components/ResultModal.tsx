import React from 'react';
import { ScanResult, ScanStatus } from '../types';
import { CheckCircle2, X, AlertTriangle, Ban, Info } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface ResultModalProps {
  result: ScanResult | null;
  onClose: () => void;
  isLoading: boolean;
}

// Helper to get color based on score (Matches Nutri-Score logic)
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
    <div className="relative flex flex-col items-center justify-center -mt-2">
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
        
        {/* Centered Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span 
                className="text-4xl font-black tracking-tight transition-colors duration-300"
                style={{ color: activeColor }}
            >
                {score}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">Safety Score</span>
        </div>
      </div>
      
      {/* Context Label */}
      <div className="mt-[-20px] bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 shadow-sm z-10">
        <p className="text-[10px] font-bold text-gray-500 text-center whitespace-nowrap">
            According to your condition
        </p>
      </div>
    </div>
  );
};

const NutriScoreBadge = ({ score }: { score: string }) => {
    const scores = ['A', 'B', 'C', 'D', 'E'];
    // Official Nutri-Score Colors
    const colors: Record<string, string> = {
        'A': '#1E8F4E', // Dark Green
        'B': '#7AC943', // Light Green
        'C': '#FFD200', // Yellow
        'D': '#F7931E', // Orange
        'E': '#E53935'  // Red
    };

    return (
        <div className="flex flex-col items-center">
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
                            {isActive && (
                                <div className="absolute inset-0 border border-white/20 rounded-lg"></div>
                            )}
                        </div>
                    );
                })}
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

  const getVerdictData = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: 
        return { 
            bg: 'bg-[#1E8F4E]', 
            text: 'text-white', 
            icon: <CheckCircle2 size={24} className="text-white" />, 
            title: 'Recommended',
            sub: 'Safe for your condition'
        };
      case ScanStatus.CAUTION: 
        return { 
            bg: 'bg-[#FFD200]', 
            text: 'text-[#1C1C1C]', 
            icon: <AlertTriangle size={24} className="text-[#1C1C1C]" />, 
            title: 'Consume with Caution',
            sub: 'Moderate risks detected'
        };
      case ScanStatus.AVOID: 
        return { 
            bg: 'bg-[#E53935]', 
            text: 'text-white', 
            icon: <Ban size={24} className="text-white" />, 
            title: 'Not Recommended',
            sub: 'High risk ingredients found'
        };
      default: 
        return { 
            bg: 'bg-gray-500', 
            text: 'text-white', 
            icon: <Info size={24} />, 
            title: 'Unknown Status',
            sub: 'Analysis inconclusive'
        };
    }
  };

  const verdict = getVerdictData(result.status);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" onClick={onClose}></div>
      
      <div className="bg-[#F8F9FA] w-full sm:w-[450px] sm:rounded-3xl rounded-t-[2.5rem] max-h-[92vh] overflow-y-auto pointer-events-auto transform transition-transform duration-300 ease-out shadow-[0px_-10px_40px_rgba(0,0,0,0.2)] no-scrollbar flex flex-col">
        
        {/* Navigation / Close */}
        <div className="sticky top-0 z-20 bg-[#F8F9FA]/95 backdrop-blur-xl p-4 flex justify-between items-center border-b border-gray-100">
            <h2 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Analysis Result</h2>
            <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                <X size={18} />
            </button>
        </div>

        <div className="p-6 pt-4 pb-12">
            
            {/* Top Section: Icon, Score, NutriScore */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-[2rem] bg-white shadow-lg border border-gray-100 flex items-center justify-center text-6xl mb-4">
                    {result.icon}
                </div>
                <h1 className="text-2xl font-extrabold text-[#1C1C1C] text-center leading-tight mb-8 max-w-[280px]">
                    {result.productName}
                </h1>
                
                <div className="flex w-full justify-between items-start px-2 sm:px-4 gap-4">
                    <div className="flex-1 flex justify-center">
                        <NutriScoreBadge score={result.nutriScore} />
                    </div>
                    <div className="h-24 w-[1px] bg-gray-200 mt-2"></div>
                    <div className="flex-1 flex justify-center">
                        <ScoreGauge score={result.score} />
                    </div>
                </div>
            </div>

            {/* Verdict Card */}
            <div className={`w-full rounded-2xl p-5 mb-8 shadow-xl ${verdict.bg} ${verdict.text} transition-colors duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                        {verdict.icon}
                    </div>
                    <div>
                        <span className="font-bold text-lg block leading-none mb-1">{verdict.title}</span>
                        <span className="text-xs opacity-90 font-medium uppercase tracking-wide">{verdict.sub}</span>
                    </div>
                </div>
                <p className={`text-sm font-medium leading-relaxed opacity-95 p-3 rounded-xl bg-black/5`}>
                    {result.explanation}
                </p>
            </div>

            {/* Ingredient Breakdown */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-[#1C1C1C] flex items-center gap-2">
                    Nutrition Preference
                </h3>
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
                    {result.ingredients.length > 0 ? result.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-start justify-between p-4 border-b border-gray-50 last:border-0">
                            <div className="flex items-start gap-4">
                                <div className={`mt-0.5 p-1.5 rounded-full ${
                                    ing.riskLevel === 'Safe' ? 'bg-green-100 text-green-600' : 
                                    ing.riskLevel === 'High Risk' ? 'bg-red-100 text-red-600' : 
                                    'bg-yellow-100 text-yellow-600'
                                }`}>
                                    {ing.riskLevel === 'Safe' ? <CheckCircle2 size={16} /> : 
                                     ing.riskLevel === 'High Risk' ? <Ban size={16} /> : 
                                     <AlertTriangle size={16} />}
                                </div>
                                <div>
                                    <span className="font-bold text-gray-800 text-sm block mb-1">{ing.name}</span>
                                    <p className="text-xs text-gray-500 leading-relaxed">{ing.description}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ml-2 shrink-0 ${
                                ing.riskLevel === 'Safe' ? 'bg-green-50 text-green-600' : 
                                ing.riskLevel === 'High Risk' ? 'bg-red-50 text-red-600' : 
                                'bg-yellow-50 text-yellow-600'
                            }`}>
                                {ing.riskLevel === 'Safe' ? 'Safe' : ing.riskLevel}
                            </span>
                        </div>
                    )) : (
                        <div className="p-6 text-center">
                            <p className="text-gray-400 text-sm">No specific ingredient warnings found.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Alternatives */}
            {result.alternatives.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4 text-[#1C1C1C]">Better Alternatives</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                     {result.alternatives.map((alt, idx) => (
                       <Card key={idx} variant="standard" className="min-w-[220px] p-5 border-gray-100 flex flex-col gap-3 flex-shrink-0 !rounded-2xl hover:scale-[1.02]">
                          <div className="w-8 h-8 rounded-full bg-[#EAF4F0] flex items-center justify-center text-[#6FAE9A]">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800 leading-tight mb-1">{alt.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{alt.reason}</p>
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