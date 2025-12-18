
import React, { useState } from 'react';
import { HealthCondition, UserProfile, AppLanguage } from '../types';
import Button from './Button';
import Card from './Card';
import { ChevronRight, Baby, Cross, Shield, Bean, Heart, Check, PlusCircle, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [condition, setCondition] = useState<HealthCondition | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [selectedContext, setSelectedContext] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);

  const conditions = [
    { id: HealthCondition.PREGNANCY, icon: <Baby />, label: "Pregnancy" },
    { id: HealthCondition.CANCER_CARE, icon: <Cross />, label: "Cancer Care" },
    { id: HealthCondition.AUTOIMMUNE, icon: <Shield />, label: "Autoimmune" },
    { id: HealthCondition.ALLERGIES, icon: <Bean />, label: "Allergies" },
    { id: HealthCondition.GENERAL_HEALTH, icon: <Heart />, label: "General Health" },
    { id: HealthCondition.MORE_DISEASES, icon: <PlusCircle />, label: "Other" },
  ];

  const symptomOptions = ["Nausea", "Fatigue", "Heartburn", "Headache", "Bloating", "Skin Rash", "Joint Pain", "Dizziness"];

  const getScreeningOptions = (cond: HealthCondition) => {
    switch (cond) {
      case HealthCondition.ALLERGIES: return ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish"];
      case HealthCondition.PREGNANCY: return ["1st Trimester", "2nd Trimester", "3rd Trimester", "Gestational Diabetes", "High BP"];
      case HealthCondition.AUTOIMMUNE: return ["Celiac Disease", "Hashimoto's", "Rheumatoid Arthritis", "Lupus", "AIP Diet"];
      case HealthCondition.CANCER_CARE: return ["Chemotherapy", "Radiation", "Neutropenic", "Mouth Sores", "Nausea"];
      case HealthCondition.GENERAL_HEALTH: return ["Weight Loss", "Muscle Gain", "Vegan", "Keto", "Low Sodium", "Acne-Prone Skin"];
      default: return [];
    }
  };

  const handleNext = () => {
    if (step === 1 && condition) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      onComplete({
        name: "User",
        condition: condition!,
        language: AppLanguage.EN, // Default language choice during onboarding
        customConditionName: customName,
        currentSymptoms: symptoms,
        additionalContext: condition === HealthCondition.MORE_DISEASES && customDesc ? [...selectedContext, `Description: ${customDesc}`] : selectedContext
      });
    }
  };

  const toggleContext = (item: string) => setSelectedContext(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  const toggleSymptom = (sym: string) => setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);

  return (
    <div className="min-h-screen p-6 flex flex-col pt-12 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-64 h-64 bg-[#6FAE9A]/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
      <div className="w-full h-2 bg-white/50 rounded-full mb-10 overflow-hidden backdrop-blur-sm border border-white/20">
        <div className="h-full bg-gradient-to-r from-[#6FAE9A] to-[#4D8C7A] transition-all duration-700 ease-out rounded-full" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl font-extrabold text-[#1C1C1C] mb-3 tracking-tight">Personalize<br/>Your Safety.</h1>
            <p className="text-gray-500 mb-10 font-medium text-lg">Choose the context that fits you best.</p>
            <div className="grid grid-cols-2 gap-4">
              {conditions.map((c) => (
                <Card key={c.id} variant={condition === c.id ? "highlight" : "glass"} onClick={() => setCondition(c.id)} className={`flex flex-col items-center gap-4 text-center py-8 transition-all duration-300 ${condition === c.id ? 'ring-2 ring-[#6FAE9A] scale-[1.02]' : 'hover:bg-white/90'}`}>
                  <div className={`transform transition-transform duration-300 ${condition === c.id ? 'scale-110 text-[#6FAE9A]' : 'text-gray-400'}`}>
                    {React.cloneElement(c.icon as React.ReactElement<any>, { size: 32 })}
                  </div>
                  <span className={`font-bold text-sm ${condition === c.id ? 'text-[#1C1C1C]' : 'text-gray-500'}`}>{c.label}</span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && condition && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <h1 className="text-3xl font-extrabold text-[#1C1C1C] mb-2">Let's get specific.</h1>
            <p className="text-gray-500 mb-8 font-medium">Refine your profile for better accuracy.</p>
            <Card variant="glass" className="mb-6">
                {condition === HealthCondition.MORE_DISEASES ? (
                <div className="space-y-6">
                    <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Condition Name</label>
                    <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g., Kidney Disease" className="w-full p-4 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FAE9A]" />
                    </div>
                    <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Instructions</label>
                    <textarea value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="Tell us what to look for..." className="w-full p-4 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FAE9A] h-24 resize-none" />
                    </div>
                </div>
                ) : (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select all that apply</p>
                    {getScreeningOptions(condition).map((option) => (
                    <div key={option} onClick={() => toggleContext(option)} className={`p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${selectedContext.includes(option) ? 'bg-[#EAF4F0] border-[#6FAE9A] text-[#4D8C7A]' : 'bg-white/40 border-transparent hover:bg-white/60'}`}>
                        <span className="font-bold text-sm">{option}</span>
                        {selectedContext.includes(option) && <Check size={18} className="text-[#6FAE9A]" />}
                    </div>
                    ))}
                </div>
                )}
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <h1 className="text-3xl font-extrabold text-[#1C1C1C] mb-2">How are you feeling?</h1>
            <p className="text-gray-500 mb-8 font-medium">We'll adjust risks based on your symptoms.</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {symptomOptions.map(s => (
                <button key={s} onClick={() => toggleSymptom(s)} className={`px-6 py-3 rounded-full text-sm font-bold transition-all shadow-sm ${symptoms.includes(s) ? 'bg-[#6FAE9A] text-white shadow-[#6FAE9A]/30 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 glass-nav flex gap-4 max-w-[450px] mx-auto z-20 rounded-t-3xl">
        {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} className="w-14 px-0 rounded-full"><ChevronLeft size={24} /></Button>}
        <Button onClick={handleNext} disabled={(step === 1 && !condition) || (step === 2 && condition === HealthCondition.MORE_DISEASES && !customName)} className="flex-1 flex justify-between items-center">
          <span>{step === 3 ? "Finish Setup" : "Continue"}</span>
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
