import { supabase } from './supabaseClient';
import { UserProfile, ScanHistoryItem } from '../types';

const CACHE_PREFIX = 'vitalSense_';

// --- CACHING HELPERS ---

export const getCachedProfile = (userId: string): UserProfile | null => {
  try {
    const data = localStorage.getItem(`${CACHE_PREFIX}profile_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

export const cacheProfile = (userId: string, data: UserProfile) => {
  localStorage.setItem(`${CACHE_PREFIX}profile_${userId}`, JSON.stringify(data));
};

export const getCachedHistory = (userId: string): ScanHistoryItem[] | null => {
  try {
    const data = localStorage.getItem(`${CACHE_PREFIX}history_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

export const cacheHistory = (userId: string, data: ScanHistoryItem[]) => {
  localStorage.setItem(`${CACHE_PREFIX}history_${userId}`, JSON.stringify(data));
};

// --- DATABASE INTERACTIONS ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
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
    throw error;
  }
};

export const getScanHistory = async (userId: string): Promise<ScanHistoryItem[]> => {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50); // PERFORMANCE: Limit to 50 most recent items

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    timestamp: item.timestamp,
    productName: item.product_name,
    icon: item.icon,
    status: item.status,
    explanation: item.explanation,
    ingredients: item.ingredients,
    alternatives: item.alternatives
  }));
};

export const addScanResult = async (userId: string, result: ScanHistoryItem) => {
  const { error } = await supabase
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
      timestamp: result.timestamp
    });

  if (error) {
    console.error('Error adding scan:', error);
  }
};