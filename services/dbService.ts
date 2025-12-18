
import { supabase } from './supabaseClient';
import { UserProfile, ScanHistoryItem, AppLanguage, ScanStatus } from '../types';

const CACHE_PREFIX = 'vitalSense_';

export const getCachedProfile = (userId: string): UserProfile | null => {
  try {
    const data = localStorage.getItem(`${CACHE_PREFIX}profile_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) { 
    localStorage.removeItem(`${CACHE_PREFIX}profile_${userId}`);
    return null; 
  }
};

export const cacheProfile = (userId: string, data: UserProfile) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}profile_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage quota exceeded");
  }
};

export const getCachedHistory = (userId: string): ScanHistoryItem[] | null => {
  try {
    const data = localStorage.getItem(`${CACHE_PREFIX}history_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) { 
    localStorage.removeItem(`${CACHE_PREFIX}history_${userId}`);
    return null; 
  }
};

export const cacheHistory = (userId: string, data: ScanHistoryItem[]) => {
  try {
    const limitedData = data.slice(0, 10);
    localStorage.setItem(`${CACHE_PREFIX}history_${userId}`, JSON.stringify(limitedData));
  } catch (e) {
    localStorage.removeItem(`${CACHE_PREFIX}history_${userId}`);
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    // Use cached language if DB doesn't have it yet to prevent state loss
    const cached = getCachedProfile(userId);

    return {
      name: data.name,
      condition: data.condition,
      language: data.language || cached?.language || AppLanguage.EN,
      customConditionName: data.custom_condition_name,
      additionalContext: data.additional_context || [],
      currentSymptoms: data.current_symptoms || []
    };
  } catch (e) {
    return null;
  }
};

export const updateUserProfile = async (userId: string, profile: UserProfile) => {
  cacheProfile(userId, profile);

  // Omit 'language' column as it's missing from Supabase schema cache
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: profile.name,
      condition: profile.condition,
      // language: profile.language, // Removed to fix schema error
      custom_condition_name: profile.customConditionName,
      additional_context: profile.additionalContext,
      current_symptoms: profile.currentSymptoms,
      updated_at: new Date()
    });

  if (error) {
    console.error('Error updating profile:', error.message || JSON.stringify(error, null, 2));
  }
};

export const getScanHistory = async (userId: string): Promise<ScanHistoryItem[]> => {
  try {
    // Omit 'dietary_suitability' to fix schema error
    const { data, error } = await supabase
        .from('scans')
        .select('id, timestamp, product_name, icon, status, explanation, ingredients, alternatives, score, nutri_score, full_ingredient_list, nutrition_advisor')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return [];

    return data.map((item: any) => {
        const isCosmetic = item.product_name.toLowerCase().includes('cream') || 
                          item.product_name.toLowerCase().includes('wash') || 
                          item.product_name.toLowerCase().includes('serum');
        
        return {
            id: item.id,
            timestamp: item.timestamp,
            productName: item.product_name,
            category: isCosmetic ? 'Cosmetic' : 'Food',
            icon: item.icon,
            status: item.status,
            explanation: item.explanation,
            ingredients: item.ingredients || [],
            alternatives: item.alternatives || [],
            score: item.score || 0,
            nutriScore: item.nutri_score,
            fullIngredientList: item.full_ingredient_list || '',
            nutritionAdvisor: item.nutrition_advisor || [],
            // Fallback to empty object if missing from DB
            dietarySuitability: undefined 
        };
    });
  } catch (e) {
    return [];
  }
};

export const addScanResult = async (userId: string, result: ScanHistoryItem) => {
  // Omit 'dietary_suitability' to fix schema error
  supabase
    .from('scans')
    .insert({
      id: result.id,
      user_id: userId,
      product_name: result.productName,
      icon: result.icon,
      status: result.status,
      explanation: result.explanation,
      ingredients: result.ingredients,
      alternatives: result.alternatives,
      timestamp: result.timestamp,
      score: result.score,
      nutri_score: result.nutriScore,
      full_ingredient_list: result.fullIngredientList,
      nutrition_advisor: result.nutritionAdvisor
      // dietary_suitability: result.dietarySuitability // Removed to fix schema error
    }).then(({ error }) => {
       if (error) console.error('Error adding scan:', error.message || JSON.stringify(error, null, 2));
    });
};
