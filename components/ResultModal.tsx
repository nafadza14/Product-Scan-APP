import React from 'react';
import { ScanResult, ScanStatus } from '../types';
import { AlertCircle, CheckCircle2, XCircle, ArrowRight, X } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 flex flex-col items-center w-80 animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-[#6FAE9A] border-t-transparent animate-spin mb-4"></div>
          <h3 className="text-lg font-bold text-[#1C1C1C]">Analyzing...</h3>
          <p className="text-center text-gray-500 mt-2 text-sm">Checking medical profile...</p>
          <p className="text-center text-gray-500 text-sm">Reviewing ingredients...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getStatusColor = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return 'bg-[#4CAF50]';
      case ScanStatus.CAUTION: return 'bg-[#FFC107]';
      case ScanStatus.AVOID: return 'bg-[#FF5252]';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return <CheckCircle2 size={32} className="text-white" />;
      case ScanStatus.CAUTION: return <AlertCircle size={32} className="text-white" />;
      case ScanStatus.AVOID: return <XCircle size={32} className="text-white" />;
    }
  };

  const getStatusTitle = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.SAFE: return 'Excellent Choice';
      case ScanStatus.CAUTION: return 'Mostly Safe';
      case ScanStatus.AVOID: return 'Not Recommended';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto transition-opacity" onClick={onClose}></div>
      
      <div className="bg-[#F8F9FA] w-full sm:w-[400px] sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-transform duration-300 ease-out shadow-[0px_-8px_30px_rgba(0,0,0,0.2)]">
        
        {/* Header Badge */}
        <div className={`${getStatusColor(result.status)} p-6 pt-8 pb-10 relative flex flex-col items-center justify-center text-white rounded-t-3xl`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <X size={20} />
          </button>
          
          <div className="mb-3 transform scale-110">
            {getStatusIcon(result.status)}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{getStatusTitle(result.status)}</h2>
          <p className="opacity-90 mt-1 font-medium">{result.productName}</p>
        </div>

        {/* Content Body */}
        <div className="p-6 -mt-6 bg-[#F8F9FA] rounded-t-3xl relative z-10 flex flex-col gap-5">
          
          {/* AI Explanation */}
          <Card className="border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EAF4F0] flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#6FAE9A] uppercase mb-1">VitalSense AI</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.explanation}
                </p>
              </div>
            </div>
          </Card>

          {/* Ingredient Breakdown */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-[#1C1C1C]">Key Ingredients</h3>
            <div className="space-y-2">
              {result.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-800">{ing.name}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    ing.riskLevel === 'Safe' ? 'bg-green-100 text-green-700' :
                    ing.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {ing.riskLevel.toUpperCase()}
                  </span>
                </div>
              ))}
              {result.ingredients.length === 0 && (
                <p className="text-sm text-gray-400 italic">No specific ingredients flagged.</p>
              )}
            </div>
          </div>

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-[#1C1C1C]">Better Alternatives</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                 {result.alternatives.map((alt, idx) => (
                   <Card key={idx} className="min-w-[160px] p-4 flex flex-col gap-2 border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-[#EAF4F0] flex items-center justify-center text-[#6FAE9A]">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="font-bold text-sm text-gray-800 leading-tight">{alt.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{alt.reason}</p>
                   </Card>
                 ))}
              </div>
            </div>
          )}

          <div className="h-2"></div>
          <Button onClick={onClose}>Scan Another Item</Button>
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;