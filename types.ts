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

export type SkinType = 'Dry' | 'Normal' | 'Combination' | 'Oily';

export interface SkinMetrics {
  moisture: number;
  firmness: number;
  texture: number;
  poreVisibility: number;
  evenness: number;
}

export interface SkinRoutineStep {
  step: string;
  tip: string;
}

export interface SkinAnalysis {
  skinType: SkinType;
  metrics: SkinMetrics;
  concerns: string[];
  summary: string;
  routine: SkinRoutineStep[];
  lookFor: string[];
  avoid: string[];
}

export interface SkinScanItem extends SkinAnalysis {
  id: string;
  timestamp: number;
}

export interface Article {
  id: string;
  title: string;
  category: 'Nutrition' | 'Skin' | 'Labels' | 'Wellness';
  readTime: number;
  summary: string;
  content: string[];
  image: string;
  conditions?: HealthCondition[];
}

export type ScanMode = 'product' | 'skin';

export type AnalysisErrorCode = 'missing_key' | 'not_recognized' | 'no_face' | 'network' | 'unknown';

export class AnalysisError extends Error {
  code: AnalysisErrorCode;
  constructor(code: AnalysisErrorCode, message?: string) {
    super(message || code);
    this.code = code;
  }
}
