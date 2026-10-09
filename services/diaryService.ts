import type { DiaryLog, DiaryPrefs, RoutineItem, SkinScanItem, UserRoutine } from '../types';

// Everything in the skin diary stays on this device. Photos live in IndexedDB,
// small records in localStorage, all keyed by user id.

const PREFIX = 'vitalSense_';
const k = (kind: string, userId: string) => `${PREFIX}${kind}_${userId}`;

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch { /* storage full or blocked */ }
};

// ---------- Dates ----------

export const dateKey = (d: Date | number = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);

// ---------- Logs ----------

export const emptyLog = (date: string): DiaryLog => ({ date, tags: [], done: { am: [], pm: [] } });

export const getLogs = (userId: string): Record<string, DiaryLog> => read(k('diary', userId), {});
export const saveLogs = (userId: string, logs: Record<string, DiaryLog>) => {
  // Keep about a year of entries.
  const keys = Object.keys(logs).sort().slice(-400);
  write(k('diary', userId), Object.fromEntries(keys.map((d) => [d, logs[d]])));
};

// ---------- Routine ----------

export const getRoutine = (userId: string): UserRoutine | null => read<UserRoutine | null>(k('routine', userId), null);
export const saveRoutine = (userId: string, r: UserRoutine) => write(k('routine', userId), r);

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())).slice(0, 8);

/** Builds a starting routine from the newest skin check. */
export const routineFromScan = (scan: SkinScanItem): UserRoutine => {
  const toItem = (s: { step: string; ingredient?: string }): RoutineItem => ({ id: rid(), name: s.step, product: s.ingredient || undefined });
  const am = scan.routine.filter((r) => r.time !== 'pm').map(toItem);
  const pm = scan.routine.filter((r) => r.time !== 'am').map(toItem);
  return { am, pm, updatedAt: Date.now() };
};

export const newRoutineItem = (name: string, product?: string): RoutineItem => ({ id: rid(), name, product });

// ---------- Prefs ----------

export const getPrefs = (userId: string): DiaryPrefs => read<DiaryPrefs>(k('diaryPrefs', userId), { goals: [] });
export const savePrefs = (userId: string, p: DiaryPrefs) => write(k('diaryPrefs', userId), p);

// ---------- Photos (IndexedDB) ----------

const photoCache = new Map<string, string | null>();
const DB_NAME = 'vitalSense_photos';
const STORE = 'photos';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no idb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const savePhoto = async (id: string, dataUrl: string) => {
  photoCache.set(id, dataUrl);
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* photos are a nice-to-have */ }
};


export const loadPhoto = async (id?: string): Promise<string | null> => {
  if (!id) return null;
  if (photoCache.has(id)) return photoCache.get(id)!;
  try {
    const db = await openDb();
    const v = await new Promise<string | null>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => resolve(null);
    });
    if (v) photoCache.set(id, v);
    return v;
  } catch {
    return null;
  }
};

/** Shrinks a captured photo to a diary thumbnail. */
export const makeThumb = (dataUrl: string, size = 480): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

// ---------- Scores and insights ----------

export const scoreOf = (s: SkinScanItem) =>
  typeof s.skinScore === 'number'
    ? s.skinScore
    : Math.round((s.metrics.moisture + s.metrics.firmness + s.metrics.texture + s.metrics.poreVisibility + s.metrics.evenness) / 5);

/** Consecutive days (ending today or yesterday) with any diary activity. */
export const streak = (logs: Record<string, DiaryLog>, scans: SkinScanItem[]) => {
  const active = new Set<string>(scans.map((s) => dateKey(s.timestamp)));
  for (const [d, l] of Object.entries(logs)) {
    if (l.done.am.length || l.done.pm.length || l.feeling || l.tags.length || l.note || l.sleep !== undefined) active.add(d);
  }
  let n = 0;
  const day = new Date();
  if (!active.has(dateKey(day))) day.setDate(day.getDate() - 1);
  while (active.has(dateKey(day))) {
    n++;
    day.setDate(day.getDate() - 1);
  }
  return n;
};

export interface Insight {
  key: string; // tag or factor
  kind: 'tag' | 'sleep' | 'routine';
  withAvg: number;
  withoutAvg: number;
  diff: number;
  n: number;
}

/**
 * Compares skin scores on days with and without each factor, looking at the
 * diary entry on the day of a check and the day before it. Needs a few checks
 * on each side before saying anything.
 */
export const findInsights = (logs: Record<string, DiaryLog>, scans: SkinScanItem[], routine: UserRoutine | null): Insight[] => {
  if (scans.length < 4) return [];
  const rows = scans.map((s) => {
    const d = dateKey(s.timestamp);
    const prev = new Date(s.timestamp);
    prev.setDate(prev.getDate() - 1);
    const l1 = logs[d];
    const l0 = logs[dateKey(prev)];
    const tags = new Set([...(l1?.tags || []), ...(l0?.tags || [])]);
    const sleep = l0?.sleep ?? l1?.sleep;
    const total = routine ? routine.am.length + routine.pm.length : 0;
    const done = (l0 ? l0.done.am.length + l0.done.pm.length : 0);
    return { score: scoreOf(s), tags, sleep, routineRatio: total ? done / total : undefined };
  });

  const out: Insight[] = [];
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const compare = (key: string, kind: Insight['kind'], has: (r: (typeof rows)[number]) => boolean | undefined) => {
    const yes = rows.filter((r) => has(r) === true).map((r) => r.score);
    const no = rows.filter((r) => has(r) === false).map((r) => r.score);
    if (yes.length < 2 || no.length < 2) return;
    const w = avg(yes);
    const wo = avg(no);
    const diff = Math.round(w - wo);
    if (Math.abs(diff) >= 3) out.push({ key, kind, withAvg: Math.round(w), withoutAvg: Math.round(wo), diff, n: yes.length });
  };

  const allTags = new Set(rows.flatMap((r) => [...r.tags]));
  allTags.forEach((tag) => compare(tag, 'tag', (r) => r.tags.has(tag)));
  compare('sleep7', 'sleep', (r) => (r.sleep === undefined ? undefined : r.sleep >= 7));
  compare('routine', 'routine', (r) => (r.routineRatio === undefined ? undefined : r.routineRatio >= 0.75));

  return out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 4);
};

/** Short plain-text summary of the last week of logs, sent with a skin check. */
export const recentLogText = (logs: Record<string, DiaryLog>, days = 7) => {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < days; i++) {
    const l = logs[dateKey(d)];
    if (l) {
      const parts = [
        l.sleep !== undefined ? `sleep ${l.sleep}h` : '',
        l.stress ? `stress ${['low', 'medium', 'high'][l.stress - 1]}` : '',
        l.water !== undefined ? `water ${l.water} glasses` : '',
        l.tags.length ? l.tags.join(', ') : ''
      ].filter(Boolean);
      if (parts.length) out.push(`${i === 0 ? 'today' : `${i}d ago`}: ${parts.join('; ')}`);
    }
    d.setDate(d.getDate() - 1);
  }
  return out.join(' | ');
};
