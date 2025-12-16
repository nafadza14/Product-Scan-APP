import { supabase } from './supabaseClient';
import { UserProfile, ScanHistoryItem } from '../types';

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
    .order('created_at', { ascending: false });

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