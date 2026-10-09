import { supabase } from './supabaseClient';
import type { DiaryLog, DiaryPrefs, SkinScanItem, UserRoutine } from '../types';

// Mirrors the diary to Supabase so it follows the account across devices and survives
// cleared browser data. Every call is best effort: if the tables are not set up yet
// (supabase/setup.sql not run), the app keeps working from device storage.

export type CloudStatus = 'unknown' | 'on' | 'not_set_up' | 'offline';
let status: CloudStatus = 'unknown';
const listeners = new Set<(s: CloudStatus) => void>();
const setStatus = (s: CloudStatus) => {
  if (s === status) return;
  status = s;
  listeners.forEach((l) => l(s));
};
export const getCloudStatus = () => status;
export const onCloudStatus = (fn: (s: CloudStatus) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const missingTable = (e: any) => {
  const code = e?.code || '';
  const msg = String(e?.message || '');
  return code === '42P01' || code === 'PGRST205' || code === 'PGRST204' || /does not exist|schema cache/i.test(msg);
};
const handleError = (e: any) => {
  if (!e) return;
  if (missingTable(e)) setStatus('not_set_up');
  else if (/fetch|network/i.test(String(e?.message))) setStatus('offline');
  console.warn('[cloud]', e.message || e);
};

// ---------- Pull ----------

export interface CloudSnapshot {
  scans: SkinScanItem[];
  logs: Record<string, DiaryLog>;
  settings: { routine: UserRoutine | null; goals: DiaryPrefs['goals'] | null; favorites: string[] | null; updatedAt: number } | null;
}

export const pullAll = async (userId: string): Promise<CloudSnapshot | null> => {
  const [checks, logs, settings] = await Promise.all([
    supabase.from('skin_checks').select('id, taken_at, data, photo_path').eq('user_id', userId).order('taken_at', { ascending: false }).limit(500),
    supabase.from('diary_logs').select('day, data, updated_at').eq('user_id', userId).limit(1000),
    supabase.from('user_settings').select('routine, goals, favorites, updated_at').eq('user_id', userId).maybeSingle()
  ]);
  const err = checks.error || logs.error || settings.error;
  if (err) {
    handleError(err);
    return null;
  }
  setStatus('on');
  return {
    scans: (checks.data || []).map((r: any) => ({ ...(r.data || {}), id: r.id, timestamp: Number(r.taken_at), photoId: r.id, photoPath: r.photo_path || undefined })),
    logs: Object.fromEntries((logs.data || []).map((r: any) => [r.day, { ...(r.data || {}), date: r.day, updatedAt: Number(r.updated_at) || 0 }])),
    settings: settings.data
      ? {
          routine: settings.data.routine || null,
          goals: settings.data.goals || null,
          favorites: settings.data.favorites || null,
          updatedAt: Number(settings.data.updated_at) || 0
        }
      : null
  };
};

// ---------- Push ----------

export const pushSkinCheck = async (userId: string, item: SkinScanItem, thumbDataUrl?: string) => {
  if (status === 'not_set_up') return;
  let photo_path: string | undefined;
  if (thumbDataUrl) {
    try {
      const blob = await (await fetch(thumbDataUrl)).blob();
      const path = `${userId}/${item.id}.jpg`;
      const { error } = await supabase.storage.from('skin-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (!error) photo_path = path;
      else console.warn('[cloud] photo', error.message);
    } catch (e) {
      console.warn('[cloud] photo', e);
    }
  }
  const { photoId, photoPath, ...data } = item as SkinScanItem & { photoPath?: string };
  const { error } = await supabase
    .from('skin_checks')
    .upsert({ id: item.id, user_id: userId, taken_at: item.timestamp, data, photo_path: photo_path || photoPath || null });
  handleError(error);
};

const logTimers = new Map<string, number>();
export const pushLog = (userId: string, log: DiaryLog) => {
  if (status === 'not_set_up') return;
  window.clearTimeout(logTimers.get(log.date));
  logTimers.set(
    log.date,
    window.setTimeout(async () => {
      const { error } = await supabase
        .from('diary_logs')
        .upsert({ user_id: userId, day: log.date, data: log, updated_at: log.updatedAt || Date.now() });
      handleError(error);
    }, 800)
  );
};

let settingsTimer: number | undefined;
export const pushSettings = (userId: string, s: { routine: UserRoutine | null; goals: DiaryPrefs['goals']; favorites: string[] }) => {
  if (status === 'not_set_up') return;
  window.clearTimeout(settingsTimer);
  settingsTimer = window.setTimeout(async () => {
    const { error } = await supabase.from('user_settings').upsert({ user_id: userId, ...s, updated_at: Date.now() });
    handleError(error);
  }, 800);
};

/** Fetches a photo from private storage when it is not cached on this device. */
export const downloadPhoto = async (path: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage.from('skin-photos').download(path);
    if (error || !data) return null;
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(data);
    });
  } catch {
    return null;
  }
};

// ---------- Merge ----------

export const mergeScans = (local: SkinScanItem[], remote: SkinScanItem[]) => {
  const byId = new Map<string, SkinScanItem>();
  for (const s of remote) byId.set(s.id, s);
  for (const s of local) byId.set(s.id, { ...byId.get(s.id), ...s });
  return Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
};

export const mergeLogs = (local: Record<string, DiaryLog>, remote: Record<string, DiaryLog>) => {
  const out: Record<string, DiaryLog> = { ...remote };
  for (const [d, l] of Object.entries(local)) {
    const r = remote[d];
    if (!r || (l.updatedAt || 0) >= (r.updatedAt || 0)) out[d] = l;
  }
  return out;
};
