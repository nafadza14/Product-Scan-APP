export enum ViewState {
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

export interface ScanResult {
  productName: string;
  icon?: string; // Emoji representation
  status: ScanStatus;
  explanation: string;
  ingredients: IngredientAnalysis[];
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