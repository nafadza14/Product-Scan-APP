
export enum ViewState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  RESULT = 'RESULT',
  PANTRY = 'PANTRY',
  PROFILE = 'PROFILE',
  RANKING = 'RANKING'
}

export enum AppLanguage {
  EN = 'en',
  ID = 'id',
  AR = 'ar',
  FR = 'fr',
  ZH = 'zh-CN'
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
  language: AppLanguage;
  customConditionName?: string; 
  additionalContext: string[]; 
  currentSymptoms: string[];   
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
  value: string; 
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
  category: 'Food' | 'Cosmetic' | 'Other'; 
  icon?: string; 
  status: ScanStatus;
  score: number; 
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E'; 
  explanation: string;
  ingredients: IngredientAnalysis[]; 
  fullIngredientList: string; 
  nutritionAdvisor?: MacroNutrient[]; 
  dietarySuitability?: DietarySuitability; 
  alternatives: Array<{ name: string; reason: string }>;
}

export interface ScanHistoryItem extends ScanResult {
  id: string;
  timestamp: number;
  isFavorite?: boolean;
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
  content: string[]; 
  summary: string;
}
