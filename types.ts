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

/** Facial areas the analysis reports on. */
export type SkinZoneId = 'forehead' | 'tzone' | 'leftCheek' | 'rightCheek' | 'chin' | 'underEye';

export interface SkinZone {
  zone: SkinZoneId;
  score: number; // 0-100, higher is healthier-looking
  note: string;
}

export type ConcernId =
  | 'breakouts'
  | 'redness'
  | 'darkSpots'
  | 'darkCircles'
  | 'fineLines'
  | 'oiliness'
  | 'dryness'
  | 'enlargedPores'
  | 'uneven';

export type Severity = 0 | 1 | 2 | 3; // none, mild, moderate, marked

export interface SkinConcern {
  id: ConcernId;
  severity: Severity;
  zones: SkinZoneId[];
  note: string;
}

export interface SkinRoutineStep {
  step: string;
  tip: string;
  /** Which part of the day. Older results have no time and are treated as both. */
  time?: 'am' | 'pm';
  ingredient?: string;
}

export interface PhotoQuality {
  lighting: 'good' | 'dim' | 'harsh' | 'uneven';
  sharp: boolean;
  frontal: boolean;
  confidence: number; // 0-100
}

export interface SkinAnalysis {
  skinType: SkinType;
  metrics: SkinMetrics;
  /** Short labels, kept for older entries and quick display. */
  concerns: string[];
  summary: string;
  routine: SkinRoutineStep[];
  lookFor: string[];
  avoid: string[];
  // Added in the diary release. Optional so older saved checks still load.
  skinScore?: number;
  zones?: SkinZone[];
  concernDetails?: SkinConcern[];
  quality?: PhotoQuality;
  topPriority?: string;
}

export interface SkinScanItem extends SkinAnalysis {
  id: string;
  timestamp: number;
  /** Key of the photo thumbnail in IndexedDB on this device. */
  photoId?: string;
  /** Path of the photo in private Supabase storage, when cloud backup is set up. */
  photoPath?: string;
}

/** One day in the skin diary. Keyed by local date YYYY-MM-DD. */
export interface DiaryLog {
  date: string;
  feeling?: 1 | 2 | 3 | 4 | 5;
  sleep?: number; // hours
  water?: number; // glasses
  stress?: 1 | 2 | 3;
  tags: string[];
  note?: string;
  done: { am: string[]; pm: string[] }; // routine step ids ticked off
  updatedAt?: number;
}

export interface RoutineItem {
  id: string;
  name: string;
  product?: string;
}

export interface UserRoutine {
  am: RoutineItem[];
  pm: RoutineItem[];
  updatedAt: number;
}

export type SkinGoal = 'clearBreakouts' | 'evenTone' | 'hydration' | 'calmRedness' | 'smoothTexture' | 'firmness' | 'minimizePores';

export interface DiaryPrefs {
  goals: SkinGoal[];
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

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  date: number;
  image: string;
  source: string;
  category: string; // Skin, Nutrition, Pregnancy, Allergies, Immunity, Cancer care, Wellness, Labels
  lang: string;
  reason: string | null; // the profile choice that matched best
  score: number;
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
