import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ScanResult, UserProfile, ScanStatus, HealthCondition } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const analyzeImage = async (
  imageBase64: string, 
  userProfile: UserProfile
): Promise<ScanResult> => {
  
  // Using gemini-2.5-flash for faster and more robust multimodal analysis
  const modelId = "gemini-2.5-flash";

  const isGeneralHealth = userProfile.condition === HealthCondition.GENERAL_HEALTH;
  const isCustomCondition = userProfile.condition === HealthCondition.MORE_DISEASES;

  // Construct the primary condition string
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
    You are an expert Ingredient Analyst and Nutritionist. Your role is to analyze product labels for safety based on a user's profile.
    
    User Profile:
    - Condition: ${conditionLabel}
    - Specific Context: ${contextStr}
    - Current Symptoms: ${symptomsStr}
    
    Task:
    1. **Identify Product**: Is this Food or Skincare? If neither (e.g. random object), mark as CAUTION and explain.
    2. **Pick an Icon**: Choose a single emoji that best represents this product (e.g. 🥛 for milk, 🧴 for lotion).
    3. **Analyze Ingredients**: Check against the user's specific condition and restrictions.
    4. **Verdict**:
       - SAFE: No harmful ingredients found for this profile.
       - CAUTION: Majority of ingredients are safe, but has minor warnings. Use a friendly tone: "It's likely fine to use, but be mindful of..."
       - AVOID: Contains prohibited ingredients for this condition.
    
    Output strictly in JSON format. Do not include markdown code blocks.
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
            text: "Analyze this image. Return strictly valid JSON matching the schema."
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
            icon: { type: Type.STRING, description: "A single emoji representing the product" },
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
    if (!text) {
      throw new Error("No response from AI");
    }

    // Clean up potential markdown blocks if the model ignores the instruction (rare with JSON mode but possible)
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleanText);

    // Map the string status to our Enum
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

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      productName: "Scan Failed",
      icon: "⚠️",
      status: ScanStatus.CAUTION,
      explanation: "We couldn't analyze this image. Please ensure the ingredients text is clearly visible and try again.",
      ingredients: [],
      alternatives: []
    };
  }
};