import React from 'react';
import { ScanResult, ScanStatus } from '../types';
import { AlertCircle, CheckCircle2, XCircle, X } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface ResultModalProps {
  result: ScanResult | null;
  onClose: () => void;
  isLoading: boolean;
}

const ResultModal: React.FC<ResultModalProps> = ({ result, onClose, isLoading }) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center w-72 animate-pulse">
          <div className="w-20 h-20 rounded-full border-4 border-[#6FAE9A] border-t-transparent animate-spin mb-6"></div>
          <h3 className="text-xl font-bold text-[#1C1C1C]">Analyzing...</h3>
          <p className="text-center text-gray-500 mt-2 text-sm font-medium">Checking ingredients against your profile...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getStatusColor = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return 'bg-gradient-to-br from-[#4CAF50] to-[#388E3C]';
      case ScanStatus.CAUTION: return 'bg-gradient-to-br from-[#FFC107] to-[#FFA000]';
      case ScanStatus.AVOID: return 'bg-gradient-to-br from-[#FF5252] to-[#D32F2F]';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return <CheckCircle2 size={40} className="text-white" />;
      case ScanStatus.CAUTION: return <AlertCircle size={40} className="text-white" />;
      case ScanStatus.AVOID: return <XCircle size={40} className="text-white" />;
    }
  };

  const getStatusTitle = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return 'Safe to Use';
      case ScanStatus.CAUTION: return 'Use with Caution';
      case ScanStatus.AVOID: return 'Avoid This';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" onClick={onClose}></div>
      
      <div className="bg-[#F8F9FA] w-full sm:w-[450px] sm:rounded-3xl rounded-t-[2.5rem] max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-transform duration-300 ease-out shadow-[0px_-10px_40px_rgba(0,0,0,0.2)] no-scrollbar">
        
        {/* Header Badge */}
        <div className={`${getStatusColor(result.status)} p-8 pb-12 relative flex flex-col items-center justify-center text-white rounded-t-[2.5rem]`}>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm">
            <X size={20} />
          </button>
          
          <div className="mb-4 transform scale-110 drop-shadow-md">
            {getStatusIcon(result.status)}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{getStatusTitle(result.status)}</h2>
          <p className="opacity-90 mt-1 font-medium text-lg text-center px-4">{result.productName}</p>
        </div>

        {/* Content Body */}
        <div className="p-6 -mt-8 bg-[#F8F9FA] rounded-t-[2rem] relative z-10 flex flex-col gap-6">
          
          {/* AI Explanation */}
          <Card variant="standard" className="border-none shadow-md bg-white">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EAF4F0] to-[#D1EBE5] flex items-center justify-center flex-shrink-0 mt-1 text-[#6FAE9A]">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#6FAE9A] uppercase mb-1 tracking-wide">VitalSense AI</h4>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  {result.explanation}
                </p>
              </div>
            </div>
          </Card>

          {/* Ingredient Breakdown */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-[#1C1C1C] flex items-center gap-2">
                Ingredients Analysis
            </h3>
            <div className="space-y-2">
              {result.ingredients.map((ing, idx) => (
                <Card key={idx} variant="standard" className="flex items-center justify-between p-4 !rounded-2xl border-gray-100 hover:border-gray-200">
                  <span className="font-bold text-gray-700 text-sm">{ing.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                    ing.riskLevel === 'Safe' ? 'bg-green-100 text-green-700' :
                    ing.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {ing.riskLevel}
                  </span>
                </Card>
              ))}
              {result.ingredients.length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-4">No specific ingredients flagged.</p>
              )}
            </div>
          </div>

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-[#1C1C1C]">Better Options</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                 {result.alternatives.map((alt, idx) => (
                   <Card key={idx} variant="standard" className="min-w-[200px] p-5 border-gray-100 flex flex-col gap-3 flex-shrink-0 !rounded-2xl hover:scale-[1.02]">
                      <div className="w-10 h-10 rounded-full bg-[#EAF4F0] flex items-center justify-center text-[#6FAE9A]">
                        <CheckCircle2 size={20} />
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

          <div className="h-4"></div>
          <Button onClick={onClose} className="shadow-xl shadow-[#6FAE9A]/20">Scan Another Item</Button>
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;