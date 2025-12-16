import React, { useState } from 'react';
import { HealthCondition, UserProfile } from '../types';
import Button from './Button';
import Card from './Card';
import { ChevronRight, Baby, Cross, Shield, Bean, Heart, Check, PlusCircle, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [condition, setCondition] = useState<HealthCondition | null>(null);
  
  // Step 2 Data
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [selectedContext, setSelectedContext] = useState<string[]>([]);

  // Step 3 Data
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
      case HealthCondition.ALLERGIES:
        return [
          "Peanuts", 
          "Tree Nuts (Almonds, Cashews, etc.)", 
          "Milk / Dairy / Lactose", 
          "Eggs", 
          "Wheat / Gluten", 
          "Soy", 
          "Fish", 
          "Shellfish (Crustacean)", 
          "Sesame", 
          "Sulfites",
          "Corn",
          "Mustard",
          "Fragrance / Perfume (Contact Dermatitis)",
          "Latex"
        ];
      case HealthCondition.PREGNANCY:
        return [
          "Trimester: 1st (Weeks 1-12)",
          "Trimester: 2nd (Weeks 13-26)",
          "Trimester: 3rd (Weeks 27+)",
          "Condition: Gestational Diabetes",
          "Condition: Preeclampsia / High BP",
          "Symptom: Severe Morning Sickness",
          "Diet: Avoiding Unpasteurized Dairy",
          "Diet: Limiting Caffeine",
          "Diet: Meat/Egg Aversions",
          "Skincare: Avoid Retinoids/Salicylic Acid",
          "Skincare: Avoid Essential Oils",
          "Supplement: Taking Prenatals"
        ];
      case HealthCondition.AUTOIMMUNE:
        return [
          "Celiac Disease (Strict Gluten-Free)",
          "Hashimoto's Thyroiditis",
          "Rheumatoid Arthritis",
          "Lupus (SLE)",
          "Psoriasis / Eczema",
          "Diet: AIP (Autoimmune Protocol)",
          "Sensitivity: Nightshades (Tomatoes, Peppers)",
          "Sensitivity: Dairy / Casein",
          "Sensitivity: Soy",
          "Sensitivity: Legumes / Grains",
          "Trigger: Artificial Sweeteners",
          "Symptom: Chronic Inflammation / Joint Pain"
        ];
      case HealthCondition.CANCER_CARE:
        return [
          "Treatment: Chemotherapy",
          "Treatment: Radiation Therapy",
          "Treatment: Immunotherapy",
          "Condition: Neutropenic (Low Immunity)",
          "Symptom: Mouth Sores / Swallowing Issues",
          "Symptom: Metallic Taste / Dysgeusia",
          "Symptom: Severe Nausea / Vomiting",
          "Diet: Need High-Calorie / High-Protein",
          "Skin: Radiation Burns / Extreme Dryness",
          "Skincare: Need Fragrance-Free",
          "Risk: Lymphedema",
          "Symptom: Extreme Fatigue"
        ];
      case HealthCondition.GENERAL_HEALTH:
        return [
          "Goal: Weight Loss",
          "Goal: Muscle Gain",
          "Diet: Vegan",
          "Diet: Vegetarian",
          "Diet: Keto / Low Carb",
          "Watch: Added Sugars",
          "Watch: Sodium / Salt (Heart Health)",
          "Watch: Saturated Fats",
          "Avoid: Processed Foods / Additives",
          "Skin: Acne-Prone",
          "Skin: Sensitive / Dry",
          "Skincare: Avoid Parabens / Sulfates"
        ];
      default:
        return [];
    }
  };

  const getCommonRestrictions = () => [
    "Low Sodium",
    "Low Potassium",
    "Low Phosphorus",
    "Low Protein",
    "Fluid Restriction",
    "Gluten Free",
    "Low Sugar / Diabetic Friendly",
    "Low FODMAP",
    "Anti-Inflammatory",
    "Avoid Grapefruit (Meds Interaction)",
    "Soft Foods Only",
    "Fragrance Free"
  ];

  const handleNext = () => {
    if (step === 1 && condition) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Compile final context
      let finalContext = [...selectedContext];
      if (condition === HealthCondition.MORE_DISEASES && customDesc) {
        finalContext.push(`Description: ${customDesc}`);
      }

      onComplete({
        name: "User",
        condition: condition!,
        customConditionName: customName,
        currentSymptoms: symptoms,
        additionalContext: finalContext
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleContext = (item: string) => {
    setSelectedContext(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleSymptom = (sym: string) => {
    setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col pt-12">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-[#6FAE9A] transition-all duration-500 ease-out" 
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        
        {/* STEP 1: Condition Selection */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">Let's personalize your safety.</h1>
            <p className="text-gray-500 mb-8">Choose the context that fits you best.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {conditions.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => setCondition(c.id)}
                  className={`
                    p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center gap-3 text-center
                    ${condition === c.id 
                      ? 'border-[#6FAE9A] bg-[#EAF4F0] text-[#4D8C7A]' 
                      : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}
                  `}
                >
                  <div className={`transform scale-125 ${condition === c.id ? 'text-[#6FAE9A]' : ''}`}>
                    {c.icon}
                  </div>
                  <span className="font-semibold text-sm">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Detailed Screening */}
        {step === 2 && condition && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">Let's get specific.</h1>
            <p className="text-gray-500 mb-8">Select all statements that apply to your {condition === HealthCondition.MORE_DISEASES ? "condition" : "situation"}.</p>

            {condition === HealthCondition.MORE_DISEASES ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Condition Name</label>
                  <input 
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Kidney Disease, IBS"
                    className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6FAE9A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Specific Instructions</label>
                  <textarea 
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Tell us exactly what to look for..."
                    className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6FAE9A] h-24 resize-none"
                  />
                </div>
                
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider pt-2">Common Restrictions</p>
                <div className="space-y-3">
                  {getCommonRestrictions().map((option) => (
                    <div 
                      key={option}
                      onClick={() => toggleContext(option)}
                      className={`
                        p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                        ${selectedContext.includes(option) 
                          ? 'border-[#6FAE9A] bg-[#EAF4F0] text-[#4D8C7A]' 
                          : 'border-gray-200 hover:bg-gray-50'}
                      `}
                    >
                      <span className="font-medium text-sm">{option}</span>
                      {selectedContext.includes(option) && <Check size={18} />}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Select all that apply</p>
                <div className="space-y-3">
                  {getScreeningOptions(condition).map((option) => (
                    <div 
                      key={option}
                      onClick={() => toggleContext(option)}
                      className={`
                        p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                        ${selectedContext.includes(option) 
                          ? 'border-[#6FAE9A] bg-[#EAF4F0] text-[#4D8C7A]' 
                          : 'border-gray-200 hover:bg-gray-50'}
                      `}
                    >
                      <span className="font-medium text-sm">{option}</span>
                      {selectedContext.includes(option) && <Check size={18} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Current Symptoms */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">How are you feeling today?</h1>
            <p className="text-gray-500 mb-8">We'll adjust ingredient risks based on your current state.</p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {symptomOptions.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`
                    px-5 py-3 rounded-full text-sm font-medium transition-all
                    ${symptoms.includes(s)
                      ? 'bg-[#6FAE9A] text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
            
            <Card className="bg-blue-50 border-none">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can always update your symptoms later from the Home screen.
              </p>
            </Card>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex gap-4 max-w-[450px] mx-auto z-20">
        {step > 1 && (
          <Button variant="secondary" onClick={handleBack} className="w-14 px-0">
             <ChevronLeft size={20} />
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={
            (step === 1 && !condition) || 
            (step === 2 && condition === HealthCondition.MORE_DISEASES && !customName)
          }
          className="flex-1 flex justify-between items-center"
        >
          <span>{step === 3 ? "Finish Setup" : "Continue"}</span>
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;