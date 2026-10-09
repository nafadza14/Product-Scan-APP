import { supabase } from './supabaseClient';
import { UserProfile, ScanHistoryItem, AppLanguage, SkinScanItem } from '../types';

const PREFIX = 'vitalSense_';
const key = (kind: string, userId: string) => `${PREFIX}${kind}_${userId}`;

const readJSON = <T>(k: string): T | null => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
    return null;
  }
};

const writeJSON = (k: string, value: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app keeps working from memory */
  }
};

// ---------- Profile ----------

export const getCachedProfile = (userId: string) => readJSON<UserProfile>(key('profile', userId));
export const cacheProfile = (userId: string, data: UserProfile) => writeJSON(key('profile', userId), data);

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    const cached = getCachedProfile(userId);
    return {
      name: data.name || cached?.name || '',
      condition: data.condition,
      // The profiles table has no language column yet, so language lives on the device.
      language: data.language || cached?.language || AppLanguage.EN,
      customConditionName: data.custom_condition_name || undefined,
      additionalContext: data.additional_context || [],
      currentSymptoms: data.current_symptoms || []
    };
  } catch {
    return null;
  }
};

export const updateUserProfile = async (userId: string, profile: UserProfile) => {
  cacheProfile(userId, profile);
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    name: profile.name,
    condition: profile.condition,
    custom_condition_name: profile.customConditionName || null,
    additional_context: profile.additionalContext,
    current_symptoms: profile.currentSymptoms,
    updated_at: new Date()
  });
  if (error) console.error('Error updating profile:', error.message);
};

// ---------- Favorites (device level, keyed by scan id) ----------

export const getFavoriteIds = (userId: string): Set<string> =>
  new Set(readJSON<string[]>(key('favorites', userId)) || []);

export const setFavoriteIds = (userId: string, ids: Set<string>) =>
  writeJSON(key('favorites', userId), Array.from(ids));

// ---------- Product scans ----------

const HISTORY_LIMIT = 50;

export const getCachedHistory = (userId: string): ScanHistoryItem[] => {
  const items = readJSON<ScanHistoryItem[]>(key('history', userId)) || [];
  const favs = getFavoriteIds(userId);
  return items.map((i) => ({ ...i, isFavorite: favs.has(i.id) }));
};

export const cacheHistory = (userId: string, data: ScanHistoryItem[]) =>
  writeJSON(key('history', userId), data.slice(0, HISTORY_LIMIT));

const guessCategory = (name: string): ScanHistoryItem['category'] =>
  /cream|wash|serum|lotion|toner|cleanser|sunscreen|spf|shampoo|soap|moisturi[sz]er|balm|gel|mask|essence/i.test(name)
    ? 'Cosmetic'
    : 'Food';

export const getScanHistory = async (userId: string): Promise<ScanHistoryItem[]> => {
  const cached = getCachedHistory(userId);
  const byId = new Map(cached.map((c) => [c.id, c]));
  const favs = getFavoriteIds(userId);

  try {
    const { data, error } = await supabase
      .from('scans')
      .select(
        'id, timestamp, product_name, icon, status, explanation, ingredients, alternatives, score, nutri_score, full_ingredient_list, nutrition_advisor'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error || !data) return cached;

    const remote: ScanHistoryItem[] = data.map((row: any) => {
      const local = byId.get(row.id);
      return {
        id: row.id,
        timestamp: Number(row.timestamp) || Date.now(),
        productName: row.product_name,
        // The scans table has no category or diet columns, so prefer what this device saw.
        category: local?.category || guessCategory(row.product_name || ''),
        dietarySuitability: local?.dietarySuitability,
        icon: row.icon,
        status: row.status,
        explanation: row.explanation || '',
        ingredients: row.ingredients || [],
        alternatives: row.alternatives || [],
        score: typeof row.score === 'number' ? row.score : 0,
        nutriScore: row.nutri_score || undefined,
        fullIngredientList: row.full_ingredient_list || '',
        nutritionAdvisor: row.nutrition_advisor || [],
        isFavorite: favs.has(row.id)
      };
    });

    // Keep local-only scans (for example, ones still uploading) that the server doesn't have yet.
    const remoteIds = new Set(remote.map((r) => r.id));
    const merged = [...remote, ...cached.filter((c) => !remoteIds.has(c.id))].sort((a, b) => b.timestamp - a.timestamp);
    cacheHistory(userId, merged);
    return merged;
  } catch {
    return cached;
  }
};

export const addScanResult = async (userId: string, result: ScanHistoryItem) => {
  const { error } = await supabase.from('scans').insert({
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
  });
  if (error) console.error('Error adding scan:', error.message);
};

// ---------- Skin checks (device only, no photos are stored) ----------

export const getSkinHistory = (userId: string): SkinScanItem[] => readJSON<SkinScanItem[]>(key('skin', userId)) || [];

export const saveSkinHistory = (userId: string, items: SkinScanItem[]) => writeJSON(key('skin', userId), items.slice(0, 30));
