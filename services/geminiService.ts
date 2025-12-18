
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ScanResult, UserProfile, ScanStatus, HealthCondition, AppLanguage } from "../types";

export const analyzeImage = async (
  imageBase64: string, 
  userProfile: UserProfile
): Promise<ScanResult> => {
  
  // Directly use process.env.API_KEY as per instructions
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
        ? "Kunci API tidak ditemukan. Pastikan Anda telah mengonfigurasi API_KEY di Vercel atau memilih kunci secara manual."
        : "API Key missing. Ensure you have configured API_KEY in Vercel or selected a key manually.",
      ingredients: [],
      fullIngredientList: "",
      alternatives: []
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const modelId = "gemini-3-pro-preview"; 

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

  const systemInstruction = `
    You are an expert health assistant. Analyze a product label (Food/Cosmetic) based on this profile:
    Profile: ${conditionLabel}
    Context: ${contextStr}
    Symptoms: ${symptomsStr}

    OUTPUT LANGUAGE: ${currentLanguageName}. All text fields in the JSON response must be in ${currentLanguageName}.

    RULES:
    1. DO NOT transcribe the entire label text. 
    2. 'fullIngredientList' MAX 30 words.
    3. 'explanation' MAX 2 sentences.
    4. Provide short, professional medical reasoning.
    5. Ensure valid JSON.
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
            text: `Analyze this image and provide results in ${currentLanguageName} in JSON format according to the schema.`
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 512 }, 
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
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
                },
                required: ["name", "riskLevel"]
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
          required: ["productName", "category", "status", "score", "explanation", "ingredients", "alternatives", "icon"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI response empty");

    const data = JSON.parse(text.trim());

    let statusEnum = ScanStatus.SAFE;
    if (data.status === 'AVOID') statusEnum = ScanStatus.AVOID;
    if (data.status === 'CAUTION') statusEnum = ScanStatus.CAUTION;

    return {
      productName: data.productName || "Unknown Product",
      category: data.category || "Food",
      icon: data.icon || "📦",
      status: statusEnum,
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
    
    let errorMessage = "Failed to contact AI server.";
    
    if (error?.status === 403 || error?.message?.includes("403")) {
      errorMessage = "Access denied (403). Check if Google Cloud billing project is active.";
    }

    return {
      productName: "Analysis Error",
      category: "Other",
      icon: "⚠️",
      status: ScanStatus.CAUTION,
      score: 0,
      explanation: errorMessage,
      ingredients: [],
      fullIngredientList: "",
      alternatives: []
    };
  }
};