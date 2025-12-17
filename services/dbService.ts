import { supabase } from './supabaseClient';
import { UserProfile, ScanHistoryItem } from '../types';

const CACHE_PREFIX = 'vitalSense_';

// --- CACHING HELPERS ---

export const getCachedProfile = (userId: string): UserProfile | null => {
  try {
    const data = localStorage.getItem(`${CACHE_PREFIX}profile_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) { 
    // If cache is corrupted, clear it
    localStorage.removeItem(`${CACHE_PREFIX}profile_${userId}`);
    return null; 
  }
};

export const cacheProfile = (userId: string, data: UserProfile) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}profile_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage quota exceeded, could not cache profile");
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
    // PERFORMANCE FIX: Only cache the latest 10 items locally to prevent 
    // large JSON parsing from blocking the main thread on app open.
    const limitedData = data.slice(0, 10);
    localStorage.setItem(`${CACHE_PREFIX}history_${userId}`, JSON.stringify(limitedData));
  } catch (e) {
    // If quota exceeded, clear old history to make space
    console.warn("Storage quota exceeded, clearing history cache");
    localStorage.removeItem(`${CACHE_PREFIX}history_${userId}`);
  }
};

// --- DATABASE INTERACTIONS ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      name: data.name,
      condition: data.condition,
      customConditionName: data.custom_condition_name,
      additionalContext: data.additional_context || [],
      currentSymptoms: data.current_symptoms || []
    };
  } catch (e) {
    console.error("Network error fetching profile", e);
    return null;
  }
};

export const updateUserProfile = async (userId: string, profile: UserProfile) => {
  // Update Cache Immediately (Optimistic)
  cacheProfile(userId, profile);

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: profile.name,
      condition: profile.condition,
      custom_condition_name: profile.customConditionName,
      additional_context: profile.additionalContext,
      current_symptoms: profile.currentSymptoms,
      updated_at: new Date()
    });

  if (error) {
    console.error('Error updating profile:', error);
    // Don't throw, allow the UI to continue optimistically
  }
};

export const getScanHistory = async (userId: string): Promise<ScanHistoryItem[]> => {
  try {
    const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching history:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp,
        productName: item.product_name,
        category: item.category || 'Food',
        icon: item.icon,
        status: item.status,
        explanation: item.explanation,
        ingredients: item.ingredients || [],
        alternatives: item.alternatives || [],
        // Ensure all detailed analysis fields are mapped from DB snake_case to app camelCase
        score: item.score || 0,
        nutriScore: item.nutri_score,
        fullIngredientList: item.full_ingredient_list || '',
        nutritionAdvisor: item.nutrition_advisor || [],
        dietarySuitability: item.dietary_suitability || undefined
    }));
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const addScanResult = async (userId: string, result: ScanHistoryItem) => {
  // Fire and forget - don't await this in the UI thread
  supabase
    .from('scans')
    .insert({
      id: result.id,
      user_id: userId,
      product_name: result.productName,
      category: result.category,
      icon: result.icon,
      status: result.status,
      explanation: result.explanation,
      ingredients: result.ingredients,
      alternatives: result.alternatives,
      timestamp: result.timestamp,
      // Save full analysis details
      score: result.score,
      nutri_score: result.nutriScore,
      full_ingredient_list: result.fullIngredientList,
      nutrition_advisor: result.nutritionAdvisor,
      dietary_suitability: result.dietarySuitability
    }).then(({ error }) => {
       if (error) console.error('Error adding scan to history:', error);
    });
};