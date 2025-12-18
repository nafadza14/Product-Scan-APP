
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ScanResult, UserProfile, ScanStatus, HealthCondition, AppLanguage } from "../types";

export const analyzeImage = async (
  imageBase64: string, 
  userProfile: UserProfile
): Promise<ScanResult> => {
  
  const apiKey = process.env.API_KEY;
  const lang = userProfile.language || AppLanguage.EN;

  const languageMap: Record<AppLanguage, string> = {
    [AppLanguage.EN]: "English",
    [AppLanguage.ID]: "Bahasa Indonesia",
    [AppLanguage.AR]: "Arabic",
    [AppLanguage.FR]: "French",
    [AppLanguage.ZH]: "Simplified Chinese"
  };

  const currentLanguageName = languageMap[lang];

  if (!apiKey || apiKey === 'undefined' || apiKey === "") {
    const isID = lang === AppLanguage.ID;
    return {
      productName: isID ? "Error Konfigurasi" : "Configuration Error",
      category: "Other",
      icon: "⚠️",
      status: ScanStatus.CAUTION,
      score: 0,
      explanation: isID 
        ? "Kunci API tidak ditemukan. Pastikan Anda telah mengonfigurasi API_KEY."
        : "API Key missing. Please check your configuration.",
      ingredients: [],
      fullIngredientList: "",
      alternatives: []
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  // Using flash for better reliability and lower latency in vision-to-json tasks
  const modelId = "gemini-3-flash-preview"; 

  const isCustomCondition = userProfile.condition === HealthCondition.MORE_DISEASES;
  const conditionLabel = isCustomCondition 
    ? `Specific Condition: ${userProfile.customConditionName}` 
    : userProfile.condition;

  const contextStr = userProfile.additionalContext.length > 0 ? userProfile.additionalContext.join(', ') : "None";
  const symptomsStr = userProfile.currentSymptoms.length > 0 ? userProfile.currentSymptoms.join(', ') : "None";

  const systemInstruction = `
    You are a professional health and ingredient analyst. 
    Analyze the provided product image based on this user profile:
    - Condition: ${conditionLabel}
    - Details: ${contextStr}
    - Symptoms: ${symptomsStr}

    CRITICAL SCORING ALIGNMENT:
    - Nutri-Score (A-E) and personalized Safety Score (0-100) MUST be consistent.
    - A product with Nutri-Score 'D' or 'E' (high sugar/processed/fats) is a health risk for almost ALL sensitive conditions (Pregnancy, Autoimmune, etc).
    - If Nutri-Score is 'D', the Safety Score MUST be between 30 and 55.
    - If Nutri-Score is 'E', the Safety Score MUST be below 30.
    - NEVER give a score above 60 to a Nutri-Score 'D' or 'E' product.
    - For Pregnancy: Penalize high sugar (Nutri-Score D/E) heavily due to Gestational Diabetes risks.

    RESPONSE FORMAT:
    - Language: ${currentLanguageName}.
    - 'explanation': Briefly explain why the Nutri-Score led to the specific Safety Score for their condition.
    - Output valid JSON only.
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
            text: `Identify product, ingredients, and provide health analysis in ${currentLanguageName}. Ensure Safety Score is below 60 if Nutri-Score is D or E.`
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster vision response
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
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
                        name: { type: Type.STRING },
                        value: { type: Type.STRING },
                        level: { type: Type.STRING }
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
          required: ["productName", "category", "status", "score", "explanation", "ingredients", "alternatives"]
        }
      }
    });

    if (!response.text) {
      throw new Error("AI response empty. This may be due to safety filters on the image.");
    }

    const data = JSON.parse(response.text.trim());

    return {
      productName: data.productName || "Unknown Product",
      category: data.category || "Food",
      icon: data.icon || (data.category === 'Cosmetic' ? "🧴" : "📦"),
      status: (data.status as ScanStatus) || ScanStatus.CAUTION,
      score: data.score || 50,
      nutriScore: (data.nutriScore === 'N/A' || !data.nutriScore) ? undefined : data.nutriScore,
      explanation: data.explanation || "Analysis complete.",
      fullIngredientList: data.fullIngredientList || "Ingredients not readable.",
      ingredients: (data.ingredients || []).slice(0, 10),
      nutritionAdvisor: data.nutritionAdvisor || [],
      dietarySuitability: data.dietarySuitability,
      alternatives: (data.alternatives || []).slice(0, 3)
    };

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    return {
      productName: "Analysis Error",
      category: "Other",
      icon: "⚠️",
      status: ScanStatus.CAUTION,
      score: 0,
      explanation: error.message || "Failed to analyze image.",
      ingredients: [],
      fullIngredientList: "",
      alternatives: []
    };
  }
};
