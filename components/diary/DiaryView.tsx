import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, ChevronRight, Flame, GitCompare, Minus, NotebookPen, Pencil, Plus, ScanLine, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { AppLanguage, DiaryLog, DiaryPrefs, SkinScanItem, UserRoutine } from '../../types';
import { Translator, TranslationKey } from '../../i18n';
import { dateKey, emptyLog, findInsights, scoreOf, streak } from '../../services/diaryService';
import { Chip, EmptyState, Pressable, PrimaryButton, Ring, Segmented, haptic } from '../ui';
import { GOALS, TAGS, Thumb, scoreColor, tagKey } from './shared';
import TrendChart from './TrendChart';

type Seg = 'today' | 'history' | 'trends';

interface Props {
  t: Translator;
  rtl: boolean;
  lang: AppLanguage;
  signedIn: boolean;
  scans: SkinScanItem[];
  logs: Record<string, DiaryLog>;
  routine: UserRoutine | null;
  prefs: DiaryPrefs;
  productCount: number;
  onCheckSkin: () => void;
  onOpenSkin: (s: SkinScanItem) => void;
  onUpdateLog: (date: string, patch: Partial<DiaryLog>) => void;
  onEditRoutine: () => void;
  onUseScanRoutine: () => void;
  onEditGoals: () => void;
  onCompare: (a: SkinScanItem, b: SkinScanItem) => void;
  onOpenProducts: () => void;
  onSignIn: () => void;
}

const FEELINGS: { v: 1 | 2 | 3 | 4 | 5; emoji: string; key: TranslationKey }[] = [
  { v: 1, emoji: '😣', key: 'feel1' },
  { v: 2, emoji: '😕', key: 'feel2' },
  { v: 3, emoji: '😐', key: 'feel3' },
  { v: 4, emoji: '🙂', key: 'feel4' },
  { v: 5, emoji: '😊', key: 'feel5' }
];

const card = 'rounded-[26px] bg-white shadow-soft';

const Stepper: React.FC<{ label: string; value?: number; unit: (n: number) => string; step: number; max: number; onChange: (n: number) => void; lessLabel: string; moreLabel: string }> = ({
  label,
  value,
  unit,
  step,
  max,
  onChange,
  lessLabel,
  moreLabel
}) => (
  <div className="flex-1 min-w-0 rounded-2xl bg-sage-soft/70 p-3">
    <p className="text-[13px] text-ink-muted mb-1.5">{label}</p>
    <div className="flex items-center justify-between gap-1">
      <Pressable aria-label={`${lessLabel} ${label}`} onClick={() => onChange(Math.max(0, (value ?? 0) - step))} className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-soft">
        <Minus size={15} />
      </Pressable>
      <span className={`text-[16px] font-semibold tabular-nums ${value === undefined ? 'text-ink-faint' : 'text-ink'}`}>{value === undefined ? '-' : unit(value)}</span>
      <Pressable aria-label={`${moreLabel} ${label}`} onClick={() => onChange(Math.min(max, (value ?? 0) + step))} className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-soft">
        <Plus size={15} />
      </Pressable>
    </div>
  </div>
);

const DiaryView: React.FC<Props> = (p) => {
  const { t, rtl, lang, scans, logs, routine, prefs } = p;
  const [seg, setSeg] = useState<Seg>('today');
  const [routineTime, setRoutineTime] = useState<'am' | 'pm'>(() => (new Date().getHours() >= 15 ? 'pm' : 'am'));
  const [compareMode, setCompareMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [range, setRange] = useState<'7' | '30' | 'all'>('30');

  const today = dateKey();
  const log = logs[today] || emptyLog(today);
  const sortedScans = useMemo(() => [...scans].sort((a, b) => b.timestamp - a.timestamp), [scans]);
  const todayScan = sortedScans.find((s) => dateKey(s.timestamp) === today);
  const prevScan = todayScan ? sortedScans.find((s) => s.timestamp < todayScan.timestamp) : undefined;
  const days = streak(logs, scans);

  const locale = lang === AppLanguage.ZH ? 'zh-CN' : lang;
  const fmtDay = (ts: number) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(ts);
  const fmtDayLong = (ts: number) => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(ts);
  const fmtTime = (ts: number) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(ts);
  const fmtMonth = (ts: number) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(ts);

  // ---------- note field with debounced save ----------
  const [note, setNote] = useState(log.note || '');
  const noteTimer = useRef<number>();
  useEffect(() => setNote(logs[today]?.note || ''), [today]); // eslint-disable-line react-hooks/exhaustive-deps
  const onNote = (v: string) => {
    setNote(v);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => p.onUpdateLog(today, { note: v }), 500);
  };

  const historyDays = useMemo(() => {
    const keys = new Set<string>([...scans.map((s) => dateKey(s.timestamp)), ...Object.keys(logs).filter((d) => {
      const l = logs[d];
      return l.feeling || l.tags.length || l.note || l.done.am.length || l.done.pm.length || l.sleep !== undefined;
    })]);
    return Array.from(keys)
      .sort()
      .reverse()
      .map((d) => ({ d, scans: sortedScans.filter((s) => dateKey(s.timestamp) === d), log: logs[d] }));
  }, [scans, logs, sortedScans]);
  const insights = useMemo(() => findInsights(logs, scans, routine), [logs, scans, routine]);

  if (!p.signedIn) {
    return (
      <div className="px-5 pt-safe pb-36">
        <h1 className="pt-3 text-[32px] leading-none font-semibold tracking-[-0.02em] text-ink mb-2">{t('diaryTitle')}</h1>
        <p className="text-[16px] text-ink-muted mb-4">{t('diarySub')}</p>
        <EmptyState icon={<NotebookPen size={28} />} title={t('historyEmptyTitle')} body={t('historyEmptyBody')} action={<PrimaryButton onClick={p.onSignIn}>{t('signIn')}</PrimaryButton>} />
      </div>
    );
  }

  // ---------- Today ----------
  const items = routine ? routine[routineTime] : [];
  const done = log.done[routineTime];
  const totalAll = routine ? routine.am.length + routine.pm.length : 0;
  const doneAll = log.done.am.length + log.done.pm.length;

  const toggleStep = (id: string) => {
    haptic(6);
    const cur = new Set(done);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    p.onUpdateLog(today, { done: { ...log.done, [routineTime]: Array.from(cur) } });
  };

  const todayView = (
    <div className="space-y-4">
      {/* Today's check */}
      <section className={`${card} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-semibold text-ink">{t('todayCheckTitle')}</h2>
          <span className="text-[13px] text-ink-muted">{fmtDayLong(Date.now())}</span>
        </div>
        {todayScan ? (
          <Pressable onClick={() => p.onOpenSkin(todayScan)} className="w-full flex items-center gap-3.5 text-start">
            <Thumb photoId={todayScan.photoId} className="w-[68px] h-[68px] rounded-2xl" label={t('noPhoto')} />
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] text-ink-muted">{t('todayChecked', { time: fmtTime(todayScan.timestamp) })}</span>
              <span className="block text-[15px] font-semibold text-ink truncate mt-0.5">{todayScan.concerns.slice(0, 3).join(', ')}</span>
              {prevScan && (
                <span className="block text-[13px] mt-0.5" style={{ color: scoreOf(todayScan) >= scoreOf(prevScan) ? '#2E8C68' : '#D2432F' }}>
                  {scoreOf(todayScan) === scoreOf(prevScan)
                    ? t('sinceLastSame')
                    : scoreOf(todayScan) > scoreOf(prevScan)
                      ? t('sinceLastUp', { n: scoreOf(todayScan) - scoreOf(prevScan) })
                      : t('sinceLastDown', { n: scoreOf(todayScan) - scoreOf(prevScan) })}
                </span>
              )}
            </span>
            <Ring value={scoreOf(todayScan)} size={54} stroke={6} color={scoreColor(scoreOf(todayScan))}>
              <span className="text-[16px] font-semibold text-ink tabular-nums">{scoreOf(todayScan)}</span>
            </Ring>
          </Pressable>
        ) : (
          <div className="flex items-center gap-4">
            <p className="flex-1 text-[14px] text-ink-muted leading-snug">{t('todayCheckNone')}</p>
            <Pressable onClick={p.onCheckSkin} className="shrink-0 h-11 px-4 rounded-full bg-ink text-white text-[14px] font-semibold flex items-center gap-2">
              <Camera size={17} /> {t('todayCheckCta')}
            </Pressable>
          </div>
        )}
      </section>

      {/* Routine */}
      <section className={`${card} p-4`}>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-[17px] font-semibold text-ink">{t('routineTitle')}</h2>
          {routine && totalAll > 0 && (
            <Pressable onClick={p.onEditRoutine} aria-label={t('routineEdit')} className="w-9 h-9 rounded-full bg-sage-soft text-ink flex items-center justify-center">
              <Pencil size={16} />
            </Pressable>
          )}
        </div>
        {!routine || totalAll === 0 ? (
          <div>
            <p className="text-[15px] font-semibold text-ink">{t('routineEmptyTitle')}</p>
            <p className="text-[14px] text-ink-muted leading-snug mt-1 mb-4">{t('routineEmptyBody')}</p>
            <div className="flex flex-wrap gap-2">
              {sortedScans[0] && (
                <Pressable onClick={p.onUseScanRoutine} className="h-10 px-4 rounded-full bg-ink text-white text-[14px] font-semibold flex items-center gap-1.5">
                  <Sparkles size={15} /> {t('routineFromScan')}
                </Pressable>
              )}
              <Pressable onClick={p.onEditRoutine} className="h-10 px-4 rounded-full bg-sage-soft text-ink text-[14px] font-semibold flex items-center gap-1.5">
                <Plus size={15} /> {t('routineAddStep')}
              </Pressable>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <Segmented
                layoutId="routine-time"
                value={routineTime}
                onChange={setRoutineTime}
                options={[
                  { value: 'am', label: `☀️ ${t('routineAm')}` },
                  { value: 'pm', label: `🌙 ${t('routinePm')}` }
                ]}
              />
              <span className="text-[13px] text-ink-muted tabular-nums">{t('routineProgress', { done: done.length, total: items.length })}</span>
            </div>
            <ul className="space-y-1.5">
              {items.map((it, i) => {
                const on = done.includes(it.id);
                return (
                  <li key={it.id}>
                    <Pressable haptics={false} role="checkbox" aria-checked={on} onClick={() => toggleStep(it.id)} className="w-full flex items-center gap-3 rounded-2xl px-2 py-2 text-start">
                      <motion.span
                        animate={{ scale: on ? [1, 1.25, 1] : 1, backgroundColor: on ? '#0E2B2E' : 'rgba(0,0,0,0)' }}
                        transition={{ duration: 0.3 }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${on ? 'text-white' : 'border-2 border-sage'}`}
                      >
                        {on ? <Check size={15} strokeWidth={3} /> : <span className="text-[12px] font-semibold text-ink-faint">{i + 1}</span>}
                      </motion.span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-[15px] font-semibold ${on ? 'text-ink-muted line-through decoration-1' : 'text-ink'}`}>{it.name}</span>
                        {it.product && <span className="block text-[13px] text-ink-muted truncate">{it.product}</span>}
                      </span>
                    </Pressable>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* Daily log */}
      <section className={`${card} p-4`}>
        <h2 className="text-[17px] font-semibold text-ink mb-3">{t('logTitle')}</h2>
        <p className="text-[13px] text-ink-muted mb-2">{t('feelingQ')}</p>
        <div className="grid grid-cols-5 gap-1.5 mb-4" role="radiogroup" aria-label={t('feelingQ')}>
          {FEELINGS.map((f) => {
            const on = log.feeling === f.v;
            return (
              <Pressable
                key={f.v}
                role="radio"
                aria-checked={on}
                aria-label={t(f.key)}
                onClick={() => p.onUpdateLog(today, { feeling: on ? undefined : f.v })}
                className={`rounded-2xl py-2 flex flex-col items-center gap-1 transition-colors ${on ? 'bg-ink text-white' : 'bg-sage-soft/70 text-ink'}`}
              >
                <span className={`text-[24px] transition-transform ${on ? 'scale-110' : 'grayscale-[30%]'}`}>{f.emoji}</span>
                <span className="text-[11px] font-medium leading-none">{t(f.key)}</span>
              </Pressable>
            );
          })}
        </div>

        <div className="flex gap-2 mb-3">
          <Stepper label={t('sleepQ')} value={log.sleep} step={0.5} max={14} unit={(n) => t('hours', { n })} onChange={(n) => p.onUpdateLog(today, { sleep: n })} lessLabel={t('less')} moreLabel={t('more')} />
          <Stepper label={t('waterQ')} value={log.water} step={1} max={20} unit={(n) => t('glasses', { n })} onChange={(n) => p.onUpdateLog(today, { water: n })} lessLabel={t('less')} moreLabel={t('more')} />
        </div>

        <p className="text-[13px] text-ink-muted mb-2">{t('stressQ')}</p>
        <div className="flex gap-2 mb-4">
          {([1, 2, 3] as const).map((s) => (
            <Chip key={s} active={log.stress === s} onClick={() => p.onUpdateLog(today, { stress: log.stress === s ? undefined : s })} className="flex-1">
              {t(s === 1 ? 'stressLow' : s === 2 ? 'stressMed' : 'stressHigh')}
            </Chip>
          ))}
        </div>

        <p className="text-[13px] text-ink-muted mb-2">{t('tagsQ')}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {TAGS.map((tag) => {
            const on = log.tags.includes(tag.id);
            return (
              <Chip
                key={tag.id}
                active={on}
                onClick={() => p.onUpdateLog(today, { tags: on ? log.tags.filter((x) => x !== tag.id) : [...log.tags, tag.id] })}
                className="!h-9 !px-3 !text-[13.5px]"
              >
                <span aria-hidden>{tag.emoji}</span> {t(tag.key)}
              </Chip>
            );
          })}
        </div>

        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder={t('notePh')}
          rows={3}
          aria-label={t('notePh')}
          className="w-full rounded-2xl bg-sage-soft/70 px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-faint outline-none resize-none focus:ring-2 focus:ring-coral/40"
        />
      </section>

      {/* Goals */}
      <Pressable onClick={p.onEditGoals} className={`${card} w-full p-4 text-start flex items-center gap-3`}>
        <span className="w-10 h-10 rounded-2xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
          <Target size={20} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold text-ink">{t('goalsTitle')}</span>
          <span className="block text-[13px] text-ink-muted truncate">
            {prefs.goals.length ? prefs.goals.map((g) => t(GOALS.find((x) => x.id === g)!.key)).join(', ') : t('goalsNone')}
          </span>
        </span>
        <ChevronRight size={18} className={`text-ink-faint ${rtl ? 'rotate-180' : ''}`} />
      </Pressable>

      {p.productCount > 0 && (
        <Pressable onClick={p.onOpenProducts} className={`${card} w-full p-4 text-start flex items-center gap-3`}>
          <span className="w-10 h-10 rounded-2xl bg-sage-soft text-ink flex items-center justify-center shrink-0">
            <ScanLine size={20} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-ink">{t('productScans')}</span>
            <span className="block text-[13px] text-ink-muted">{t('productScansSub', { n: p.productCount })}</span>
          </span>
          <ChevronRight size={18} className={`text-ink-faint ${rtl ? 'rotate-180' : ''}`} />
        </Pressable>
      )}
    </div>
  );

  // ---------- History ----------

  const togglePick = (s: SkinScanItem) => {
    haptic(6);
    setPicked((prev) => {
      const next = prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id].slice(-2);
      if (next.length === 2) {
        const [a, b] = next.map((id) => scans.find((x) => x.id === id)!).sort((x, y) => x.timestamp - y.timestamp);
        window.setTimeout(() => {
          p.onCompare(a, b);
          setCompareMode(false);
          setPicked([]);
        }, 250);
      }
      return next;
    });
  };

  let lastMonth = '';
  const historyView =
    historyDays.length === 0 ? (
      <EmptyState icon={<NotebookPen size={28} />} title={t('historyEmptyTitle')} body={t('historyEmptyBody')} action={<PrimaryButton onClick={p.onCheckSkin}><Camera size={19} /> {t('todayCheckCta')}</PrimaryButton>} />
    ) : (
      <div>
        {scans.length >= 2 && (
          <div className="flex items-center justify-between mb-3 min-h-[40px]">
            <AnimatePresence mode="wait">
              {compareMode ? (
                <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[14px] text-ink-muted">
                  {t('comparePick')} ({picked.length}/2)
                </motion.p>
              ) : (
                <motion.span key="sp" />
              )}
            </AnimatePresence>
            <Pressable
              onClick={() => {
                setCompareMode((m) => !m);
                setPicked([]);
              }}
              className={`h-10 px-4 rounded-full text-[14px] font-semibold flex items-center gap-1.5 ${compareMode ? 'bg-sage-soft text-ink' : 'bg-ink text-white'}`}
            >
              {compareMode ? <X size={15} /> : <GitCompare size={15} />} {compareMode ? t('compareCancel') : t('compare')}
            </Pressable>
          </div>
        )}
        <ol className="relative">
          {historyDays.map(({ d, scans: dayScans, log: l }) => {
            const ts = new Date(`${d}T12:00:00`).getTime();
            const month = fmtMonth(ts);
            const header = month !== lastMonth ? month : null;
            lastMonth = month;
            const feeling = l?.feeling ? FEELINGS.find((f) => f.v === l.feeling) : null;
            const doneN = l ? l.done.am.length + l.done.pm.length : 0;
            return (
              <li key={d}>
                {header && <p className="text-[13px] font-semibold text-ink-muted mt-5 mb-2 first:mt-0 px-1">{header}</p>}
                <div className={`${card} p-3 mb-2.5`}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[14px] font-semibold text-ink">{fmtDayLong(ts)}</span>
                    <span className="flex items-center gap-2 text-[13px] text-ink-muted">
                      {feeling && <span aria-label={t(feeling.key)}>{feeling.emoji}</span>}
                      {totalAll > 0 && doneN > 0 && <span className="tabular-nums">{t('routineDoneShort', { done: doneN, total: totalAll })}</span>}
                    </span>
                  </div>
                  {dayScans.map((s) => {
                    const sel = picked.includes(s.id);
                    return (
                      <Pressable
                        key={s.id}
                        onClick={() => (compareMode ? togglePick(s) : p.onOpenSkin(s))}
                        aria-pressed={compareMode ? sel : undefined}
                        className={`w-full flex items-center gap-3 rounded-2xl p-1.5 text-start transition-colors ${sel ? 'bg-coral/10 ring-2 ring-coral' : ''}`}
                      >
                        <Thumb photoId={s.photoId} className="w-14 h-14 rounded-xl" label={t('noPhoto')} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] text-ink-muted">{fmtTime(s.timestamp)}</span>
                          <span className="block text-[14.5px] font-semibold text-ink truncate">{s.concerns.slice(0, 3).join(', ') || t('skinCheck')}</span>
                        </span>
                        <Ring value={scoreOf(s)} size={44} stroke={5} color={scoreColor(scoreOf(s))}>
                          <span className="text-[13px] font-semibold text-ink tabular-nums">{scoreOf(s)}</span>
                        </Ring>
                      </Pressable>
                    );
                  })}
                  {(l?.tags.length || l?.note || l?.sleep !== undefined) && (
                    <div className="px-1 pt-1.5">
                      {l!.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {l!.tags.map((tg) => {
                            const tk = tagKey(tg);
                            const tag = TAGS.find((x) => x.id === tg);
                            return tk ? (
                              <span key={tg} className="h-7 px-2.5 rounded-full bg-sage-soft text-ink text-[12.5px] font-medium inline-flex items-center gap-1">
                                <span aria-hidden>{tag?.emoji}</span> {t(tk)}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      {(l!.sleep !== undefined || l!.water !== undefined) && (
                        <p className="text-[13px] text-ink-muted">
                          {[l!.sleep !== undefined ? `${t('sleepQ')} ${t('hours', { n: l!.sleep })}` : '', l!.water !== undefined ? `${t('waterQ')} ${t('glasses', { n: l!.water })}` : ''].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {l!.note && <p className="text-[14px] text-ink-soft leading-snug mt-1 whitespace-pre-line">{l!.note}</p>}
                    </div>
                  )}
                  {dayScans.length === 0 && !l?.tags.length && !l?.note && l?.sleep === undefined && (
                    <p className="px-1 text-[13px] text-ink-muted">{t('logOnly')}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );

  // ---------- Trends ----------
  const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * 86400000;
  const inRange = sortedScans.filter((s) => s.timestamp >= cutoff).reverse();
  const first = inRange[0];
  const lastS = inRange[inRange.length - 1];

  const metricRows: [TranslationKey, (s: SkinScanItem) => number][] = [
    ['moisture', (s) => s.metrics.moisture],
    ['firmness', (s) => s.metrics.firmness],
    ['texture', (s) => s.metrics.texture],
    ['pores', (s) => s.metrics.poreVisibility],
    ['evenness', (s) => s.metrics.evenness]
  ];

  const insightText = (i: ReturnType<typeof findInsights>[number]) => {
    const vars = { with: i.withAvg, without: i.withoutAvg };
    if (i.kind === 'sleep') return t('insightSleep', vars);
    if (i.kind === 'routine') return t('insightRoutine', vars);
    const tk = tagKey(i.key);
    return t('insightTag', { ...vars, tag: tk ? t(tk).toLowerCase() : i.key });
  };

  const trendsView =
    scans.length < 2 ? (
      <EmptyState icon={<TrendingUp size={28} />} title={t('trendEmptyTitle')} body={t('trendEmptyBody')} action={<PrimaryButton onClick={p.onCheckSkin}><Camera size={19} /> {t('todayCheckCta')}</PrimaryButton>} />
    ) : (
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['7', '30', 'all'] as const).map((r) => (
            <Chip key={r} active={range === r} onClick={() => setRange(r)}>
              {t(r === '7' ? 'range7' : r === '30' ? 'range30' : 'rangeAll')}
            </Chip>
          ))}
        </div>

        <section className={`${card} p-4`}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[14px] text-ink-muted">{t('skinScore')}</p>
              <p className="text-[34px] leading-none font-semibold text-ink tabular-nums mt-1">{lastS ? scoreOf(lastS) : '-'}</p>
            </div>
            {first && lastS && first !== lastS && (
              <span
                className="h-8 px-3 rounded-full text-[14px] font-semibold inline-flex items-center tabular-nums"
                style={{ background: scoreOf(lastS) >= scoreOf(first) ? 'rgba(46,140,104,.12)' : 'rgba(210,67,47,.12)', color: scoreOf(lastS) >= scoreOf(first) ? '#2E8C68' : '#D2432F' }}
              >
                {scoreOf(lastS) - scoreOf(first) > 0 ? '+' : ''}
                {scoreOf(lastS) - scoreOf(first)}
              </span>
            )}
          </div>
          {inRange.length > 0 ? (
            <TrendChart points={inRange.map((s) => ({ t: s.timestamp, v: scoreOf(s) }))} formatDate={fmtDay} label={t('skinScore')} />
          ) : (
            <p className="text-[14px] text-ink-muted py-6 text-center">{t('trendEmptyBody')}</p>
          )}
        </section>

        <section className={`${card} p-4`}>
          <h2 className="text-[17px] font-semibold text-ink mb-2 flex items-center gap-2">
            <Sparkles size={17} className="text-coral" /> {t('insightsTitle')}
          </h2>
          {insights.length === 0 ? (
            <p className="text-[14px] text-ink-muted leading-snug">{t('insightsWaiting')}</p>
          ) : (
            <>
              <ul className="space-y-2.5 mb-3">
                {insights.map((i) => (
                  <li key={i.key} className="flex gap-3">
                    <span
                      className="mt-0.5 w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[13px] font-semibold tabular-nums"
                      style={{ background: i.diff > 0 ? 'rgba(46,140,104,.12)' : 'rgba(210,67,47,.12)', color: i.diff > 0 ? '#2E8C68' : '#D2432F' }}
                    >
                      {i.diff > 0 ? '+' : ''}
                      {i.diff}
                    </span>
                    <p className="text-[14.5px] text-ink leading-snug">{insightText(i)}</p>
                  </li>
                ))}
              </ul>
              <p className="text-[12.5px] text-ink-muted">{t('insightNote')}</p>
            </>
          )}
        </section>

        {inRange.length >= 2 && (
          <section className={`${card} p-4`}>
            <h2 className="text-[17px] font-semibold text-ink mb-3">{t('metricsOverTime')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {metricRows.map(([key, get], mi) => {
                const pts = inRange.map((s) => ({ t: s.timestamp, v: get(s) }));
                const delta = pts[pts.length - 1].v - pts[0].v;
                return (
                  <div key={key} className={`rounded-2xl bg-sage-soft/60 p-3 min-w-0 ${mi === metricRows.length - 1 ? 'col-span-2' : ''}`}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[13px] text-ink-muted truncate">{t(key)}</span>
                      <span className="text-[12px] font-semibold tabular-nums" style={{ color: delta >= 0 ? '#2E8C68' : '#D2432F' }}>
                        {delta > 0 ? '+' : ''}
                        {delta}
                      </span>
                    </div>
                    <p className="text-[20px] font-semibold text-ink tabular-nums leading-none mb-1">{pts[pts.length - 1].v}</p>
                    <TrendChart points={pts} compact height={70} formatDate={fmtDay} label={t(key)} />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );

  return (
    <div className="px-5 pt-safe pb-36">
      <div className="pt-3 flex items-start justify-between gap-3 mb-1">
        <h1 className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-ink">{t('diaryTitle')}</h1>
        <span
          className={`shrink-0 h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-[13.5px] font-semibold ${days > 0 ? 'bg-coral/10 text-coral' : 'bg-white text-ink-muted shadow-soft'}`}
        >
          <Flame size={16} /> {days > 0 ? t('streakDays', { n: days }) : t('streakStart')}
        </span>
      </div>
      <p className="text-[16px] text-ink-muted mb-4">{t('diarySub')}</p>

      <div className="mb-4">
        <Segmented
          layoutId="diary-seg"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'today', label: t('segToday') },
            { value: 'history', label: t('segHistory') },
            { value: 'trends', label: t('segTrends') }
          ]}
        />
      </div>

      <motion.div key={seg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {seg === 'today' ? todayView : seg === 'history' ? historyView : trendsView}
      </motion.div>
    </div>
  );
};

export default DiaryView;
