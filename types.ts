
export enum ViewState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  RESULT = 'RESULT',
  PANTRY = 'PANTRY',
  PROFILE = 'PROFILE'
}

export enum HealthCondition {
  PREGNANCY = 'Pregnancy',
  CANCER_CARE = 'Cancer Care',
  AUTOIMMUNE = 'Autoimmune',
  ALLERGIES = 'Allergies',
  GENERAL_HEALTH = 'General Health',
  MORE_DISEASES = 'More Diseases',
  NONE = 'None'
}

export interface UserProfile {
  name: string;
  condition: HealthCondition;
  customConditionName?: string; // For "More Diseases" input
  additionalContext: string[]; // Specific restrictions or answers from Step 2
  currentSymptoms: string[];   // Transient symptoms from Step 3
}

export enum ScanStatus {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  AVOID = 'AVOID'
}

export interface IngredientAnalysis {
  name: string;
  riskLevel: 'Safe' | 'High Risk' | 'Moderate';
  description: string;
}

export interface MacroNutrient {
  name: 'Fat' | 'Saturated Fat' | 'Sugar' | 'Salt' | 'Protein';
  value: string; // e.g., "1.8g"
  level: 'Low' | 'Medium' | 'High';
}

export interface DietarySuitability {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  lactoseFree: boolean;
}

export interface ScanResult {
  productName: string;
  category: 'Food' | 'Cosmetic' | 'Other'; // Added Category
  icon?: string; // Emoji representation
  status: ScanStatus;
  score: number; // 0 to 100
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E'; // Optional for non-food
  explanation: string;
  ingredients: IngredientAnalysis[]; // Risk analysis ingredients
  fullIngredientList: string; // Full text list
  nutritionAdvisor?: MacroNutrient[]; // Optional for non-food
  dietarySuitability?: DietarySuitability; // Optional for non-food
  alternatives: Array<{ name: string; reason: string }>;
}

export interface ScanHistoryItem extends ScanResult {
  id: string;
  timestamp: number;
}

export interface DashboardStat {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface Article {
  id: string;
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
  date: string;
  readTime: string;
  content: string[]; // Array of paragraphs for in-app reading
  summary: string;
}
