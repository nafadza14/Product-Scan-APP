import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ScanResult, UserProfile, ScanStatus, HealthCondition } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const analyzeImage = async (
  imageBase64: string, 
  userProfile: UserProfile
): Promise<ScanResult> => {
  
  if (!GEMINI_API_KEY) {
      console.error("Gemini API Key is missing.");
      return {
        productName: "Configuration Error",
        category: "Other",
        icon: "⚠️",
        status: ScanStatus.CAUTION,
        score: 50,
        explanation: "API Key missing. Check Vercel Environment Variables.",
        ingredients: [],
        fullIngredientList: "Not available",
        alternatives: []
      };
  }

  // Use gemini-2.5-flash for speed
  const modelId = "gemini-2.5-flash";

  const isCustomCondition = userProfile.condition === HealthCondition.MORE_DISEASES;

  const conditionLabel = isCustomCondition 
    ? `Specific Condition: ${userProfile.customConditionName}` 
    : userProfile.condition;

  const contextStr = userProfile.additionalContext.length > 0 
    ? userProfile.additionalContext.join(', ') 
    : "None";
    
  const symptomsStr = userProfile.currentSymptoms.length > 0
    ? userProfile.currentSymptoms.join(', ')
    : "None";

  // Optimized System Instruction for Granular Cosmetic Analysis
  const systemInstruction = `
    Analyze product label image.
    Profile: ${conditionLabel}. Context: ${contextStr}. Symptoms: ${symptomsStr}.
    
    Task:
    1. Identify Product Name & Category ('Food' or 'Cosmetic').
    2. Assess safety (SAFE, CAUTION, AVOID) & score (0-100) based on ingredients + profile.
    
    --- CATEGORY LOGIC ---
    
    IF 'Food':
       - Extract Nutrition Advisor (Fat, Sat Fat, Sugar, Salt, Protein).
       - Determine Dietary Suitability (Vegan, Gluten-Free, etc).
       - Ingredients: List MODERATE/HIGH risks for health.
    
    IF 'Cosmetic' (Skincare, Make-up, Haircare, Household):
       - SKIP Nutrition Advisor, Dietary Suitability, NutriScore (return null/empty).
       - PERFORM DEEP INGREDIENT SAFETY CHECK:
         * Endocrine Disruptors (e.g., Parabens, Phthalates, Triclosan) -> HIGH RISK.
         * Carcinogens (e.g., Formaldehyde releasers, PEGs with contamination risk) -> HIGH RISK.
         * Allergens (e.g., Fragrance/Parfum, Methylisothiazolinone, Linalool) -> MODERATE/HIGH depending on profile.
         * Irritants (e.g., SLS/SLES, Drying Alcohols like Denat) -> MODERATE RISK.
         * Comedogenic (e.g., Isopropyl Myristate, Coconut Oil - for face products) -> MODERATE RISK.
       - 'ingredients' array MUST list these risky items.
       - 'description' for each ingredient MUST start with the classification, e.g., "[Endocrine Disruptor] Linked to hormonal imbalance..." or "[Comedogenic] May clog pores...".
    
    --- OUTPUT FORMAT ---
    
    Common for BOTH:
       - 'fullIngredientList': Transcription of the full ingredient text.
       - 'ingredients': Structured array of DETECTED RISKS ONLY.
       - 'alternatives': Max 2 healthy/safer swaps.
       - 'icon': Single emoji.
    
    Output strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          },
          {
            text: "Analyze. Return valid JSON."
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["Food", "Cosmetic", "Other"] },
            icon: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["SAFE", "CAUTION", "AVOID"] },
            score: { type: Type.NUMBER },
            nutriScore: { type: Type.STRING, enum: ["A", "B", "C", "D", "E", "N/A"] },
            explanation: { type: Type.STRING },
            fullIngredientList: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  riskLevel: { type: Type.STRING, enum: ["Safe", "High Risk", "Moderate"] },
                  description: { type: Type.STRING }
                }
              }
            },
            nutritionAdvisor: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, enum: ["Fat", "Saturated Fat", "Sugar", "Salt", "Protein"] },
                        value: { type: Type.STRING },
                        level: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                    }
                }
            },
            dietarySuitability: {
                type: Type.OBJECT,
                properties: {
                    vegan: { type: Type.BOOLEAN },
                    vegetarian: { type: Type.BOOLEAN },
                    glutenFree: { type: Type.BOOLEAN },
                    lactoseFree: { type: Type.BOOLEAN }
                }
            },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            }
          },
          required: ["productName", "category", "status", "score", "explanation", "ingredients", "alternatives", "icon"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleanText);

    let statusEnum = ScanStatus.SAFE;
    if (data.status === 'AVOID') statusEnum = ScanStatus.AVOID;
    if (data.status === 'CAUTION') statusEnum = ScanStatus.CAUTION;

    // Handle N/A NutriScore
    let finalNutriScore = data.nutriScore;
    if (finalNutriScore === 'N/A') finalNutriScore = undefined;

    return {
      productName: data.productName || "Unknown Product",
      category: data.category || "Food",
      icon: data.icon || "📦",
      status: statusEnum,
      score: data.score || 50,
      nutriScore: finalNutriScore,
      explanation: data.explanation || "Analysis complete.",
      fullIngredientList: data.fullIngredientList || "Ingredients not found.",
      ingredients: data.ingredients || [],
      nutritionAdvisor: data.nutritionAdvisor || [],
      dietarySuitability: data.dietarySuitability,
      alternatives: data.alternatives || []
    };

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    
    return {
      productName: "Scan Failed",
      category: "Other",
      icon: "⚠️",
      status: ScanStatus.CAUTION,
      score: 0,
      explanation: "Could not analyze product. Please try again.",
      ingredients: [],
      fullIngredientList: "",
      nutritionAdvisor: [],
      dietarySuitability: { vegan: false, vegetarian: false, glutenFree: false, lactoseFree: false },
      alternatives: []
    };
  }
};