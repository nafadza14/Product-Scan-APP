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
        icon: "⚠️",
        status: ScanStatus.CAUTION,
        explanation: "API Key missing. Check Vercel Environment Variables.",
        ingredients: [],
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

  // Optimized System Instruction for speed (fewer input tokens)
  const systemInstruction = `
    Analyze product label (Food/Skincare) image for safety.
    User Profile: [Condition: ${conditionLabel}], [Context: ${contextStr}], [Symptoms: ${symptomsStr}].
    
    Task:
    1. Identify Product.
    2. Analyze ingredients against Profile.
    3. Verdict: SAFE, CAUTION, or AVOID.
    
    Output strictly in JSON:
    {
      "productName": "string",
      "icon": "emoji",
      "status": "SAFE" | "CAUTION" | "AVOID",
      "explanation": "Concise verdict (max 2 sentences).",
      "ingredients": [{ "name": "string", "riskLevel": "Safe" | "Moderate" | "High Risk", "description": "Very short reason" }],
      "alternatives": [{ "name": "string", "reason": "short reason" }]
    }
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
            text: "Analyze image. Return valid JSON."
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
            icon: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["SAFE", "CAUTION", "AVOID"] },
            explanation: { type: Type.STRING },
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
          required: ["productName", "status", "explanation", "ingredients", "alternatives", "icon"]
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

    return {
      productName: data.productName || "Unknown Product",
      icon: data.icon || "📦",
      status: statusEnum,
      explanation: data.explanation || "Analysis complete.",
      ingredients: data.ingredients || [],
      alternatives: data.alternatives || []
    };

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    
    let errorMessage = "Could not analyze. Ensure text is clear and try again.";
    
    if (error.message?.includes('429')) {
        errorMessage = "Service busy. Please try again.";
    }

    return {
      productName: "Scan Failed",
      icon: "⚠️",
      status: ScanStatus.CAUTION,
      explanation: errorMessage,
      ingredients: [],
      alternatives: []
    };
  }
};