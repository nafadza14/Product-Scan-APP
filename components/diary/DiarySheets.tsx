import React, { useState } from 'react';
import { Check, Plus, Sparkles, Trash2 } from 'lucide-react';
import { RoutineItem, SkinGoal, SkinScanItem, UserRoutine } from '../../types';
import { Translator, TranslationKey } from '../../i18n';
import { newRoutineItem, scoreOf } from '../../services/diaryService';
import { NavBar, Pressable, PrimaryButton, Ring, Segmented } from '../ui';
import { GOALS, Thumb, scoreColor } from './shared';

// ---------- Routine editor ----------

export const RoutineEditor: React.FC<{
  t: Translator;
  rtl: boolean;
  initial: UserRoutine | null;
  latestScan?: SkinScanItem;
  fromScan: (s: SkinScanItem) => UserRoutine;
  onSave: (r: UserRoutine) => void;
  onClose: () => void;
}> = ({ t, rtl, initial, latestScan, fromScan, onSave, onClose }) => {
  const [r, setR] = useState<UserRoutine>(initial || { am: [], pm: [], updatedAt: Date.now() });
  const [time, setTime] = useState<'am' | 'pm'>('am');
  const [name, setName] = useState('');
  const [product, setProduct] = useState('');

  const update = (list: RoutineItem[]) => setR((prev) => ({ ...prev, [time]: list }));
  const add = () => {
    if (!name.trim()) return;
    update([...r[time], newRoutineItem(name.trim(), product.trim() || undefined)]);
    setName('');
    setProduct('');
  };
  const edit = (id: string, patch: Partial<RoutineItem>) => update(r[time].map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="h-full flex flex-col">
      <NavBar title={t('routineEdit')} onClose={onClose} backLabel={t('back')} closeLabel={t('close')} rtl={rtl} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-36">
        <div className="mb-4">
          <Segmented
            layoutId="edit-time"
            value={time}
            onChange={setTime}
            options={[
              { value: 'am', label: `☀️ ${t('routineAm')}` },
              { value: 'pm', label: `🌙 ${t('routinePm')}` }
            ]}
          />
        </div>

        {latestScan && (
          <Pressable onClick={() => setR(fromScan(latestScan))} className="w-full mb-4 h-11 rounded-full bg-coral/10 text-coral text-[14px] font-semibold flex items-center justify-center gap-1.5">
            <Sparkles size={16} /> {t('routineFromScan')}
          </Pressable>
        )}

        <ol className="rounded-3xl bg-white shadow-soft divide-y divide-canvas overflow-hidden mb-4">
          {r[time].map((it, i) => (
            <li key={it.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-7 h-7 rounded-full bg-sage-soft text-ink text-[13px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="flex-1 min-w-0">
                <input
                  value={it.name}
                  onChange={(e) => edit(it.id, { name: e.target.value })}
                  aria-label={t('routineStepPh')}
                  className="w-full bg-transparent outline-none text-[15px] font-semibold text-ink"
                />
                <input
                  value={it.product || ''}
                  onChange={(e) => edit(it.id, { product: e.target.value || undefined })}
                  placeholder={t('routineProductPh')}
                  aria-label={t('routineProductPh')}
                  className="w-full bg-transparent outline-none text-[13px] text-ink-muted placeholder:text-ink-faint"
                />
              </span>
              <Pressable aria-label={t('routineRemove')} onClick={() => update(r[time].filter((x) => x.id !== it.id))} className="w-9 h-9 rounded-full text-avoid flex items-center justify-center">
                <Trash2 size={17} />
              </Pressable>
            </li>
          ))}
          {r[time].length === 0 && <li className="px-4 py-5 text-[14px] text-ink-muted">{t('routineEmptyBody')}</li>}
        </ol>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="rounded-3xl bg-white shadow-soft p-3 space-y-2"
        >
          <input
            id="new-step"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('routineStepPh')}
            className="w-full rounded-2xl bg-sage-soft/70 px-3.5 h-11 outline-none text-[15px] text-ink placeholder:text-ink-faint"
          />
          <input
            id="new-product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder={t('routineProductPh')}
            className="w-full rounded-2xl bg-sage-soft/70 px-3.5 h-11 outline-none text-[15px] text-ink placeholder:text-ink-faint"
          />
          <Pressable type="submit" disabled={!name.trim()} className="w-full h-11 rounded-full bg-sage-soft text-ink text-[14px] font-semibold flex items-center justify-center gap-1.5">
            <Plus size={16} /> {t('routineAddStep')}
          </Pressable>
        </form>
      </div>
      <div className="absolute bottom-0 inset-x-0 px-5 pt-3 pb-safe blur-bar">
        <div className="pb-1">
          <PrimaryButton onClick={() => onSave({ ...r, updatedAt: Date.now() })}>{t('saveChanges')}</PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// ---------- Goals ----------

export const GoalsSheet: React.FC<{ t: Translator; initial: SkinGoal[]; onSave: (g: SkinGoal[]) => void }> = ({ t, initial, onSave }) => {
  const [goals, setGoals] = useState<SkinGoal[]>(initial);
  return (
    <div className="px-5 pt-9 pb-safe">
      <h2 className="text-[22px] font-semibold text-ink">{t('goalsTitle')}</h2>
      <p className="text-[15px] text-ink-muted mt-1 mb-4">{t('goalsSub')}</p>
      <div className="rounded-3xl bg-white shadow-soft divide-y divide-canvas overflow-hidden mb-4">
        {GOALS.map((g) => {
          const on = goals.includes(g.id);
          return (
            <Pressable
              key={g.id}
              role="checkbox"
              aria-checked={on}
              haptics={false}
              onClick={() => setGoals((prev) => (on ? prev.filter((x) => x !== g.id) : [...prev, g.id]))}
              className="w-full flex items-center justify-between px-4 h-14 text-start"
            >
              <span className="text-[16px] font-medium text-ink">{t(g.key)}</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${on ? 'bg-ink text-white' : 'border-2 border-sage'}`}>{on && <Check size={14} strokeWidth={3} />}</span>
            </Pressable>
          );
        })}
      </div>
      <div className="pb-2">
        <PrimaryButton onClick={() => onSave(goals)}>{t('saveChanges')}</PrimaryButton>
      </div>
    </div>
  );
};

// ---------- Compare ----------

export const CompareView: React.FC<{
  t: Translator;
  rtl: boolean;
  a: SkinScanItem;
  b: SkinScanItem;
  formatDate: (ts: number) => string;
  onClose: () => void;
}> = ({ t, rtl, a, b, formatDate, onClose }) => {
  const rows: [TranslationKey, number, number][] = [
    ['skinScore', scoreOf(a), scoreOf(b)],
    ['moisture', a.metrics.moisture, b.metrics.moisture],
    ['firmness', a.metrics.firmness, b.metrics.firmness],
    ['texture', a.metrics.texture, b.metrics.texture],
    ['pores', a.metrics.poreVisibility, b.metrics.poreVisibility],
    ['evenness', a.metrics.evenness, b.metrics.evenness]
  ];
  const col = (s: SkinScanItem, label: TranslationKey) => (
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-ink-muted mb-1.5">{t(label)}</p>
      <div className="relative">
        <Thumb photoId={s.photoId} className="w-full aspect-[3/4] rounded-3xl" label={t('noPhoto')} />
        <span className="absolute bottom-2 start-2 h-8 px-3 rounded-full bg-white/90 backdrop-blur text-[13px] font-semibold text-ink inline-flex items-center">{formatDate(s.timestamp)}</span>
      </div>
    </div>
  );
  return (
    <div className="h-full flex flex-col">
      <NavBar title={t('compareTitle')} onClose={onClose} backLabel={t('back')} closeLabel={t('close')} rtl={rtl} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-12">
        <div className="flex gap-3 mb-5">
          {col(a, 'compareBefore')}
          {col(b, 'compareAfter')}
        </div>
        <div className="rounded-3xl bg-white shadow-soft divide-y divide-canvas">
          {rows.map(([k, x, y]) => {
            const d = y - x;
            return (
              <div key={k} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 text-[15px] font-medium text-ink">{t(k)}</span>
                <span className="w-9 text-end text-[15px] text-ink-muted tabular-nums">{x}</span>
                <span className="text-ink-faint" aria-hidden>
                  {rtl ? '←' : '→'}
                </span>
                <Ring value={y} size={36} stroke={4} color={scoreColor(y)}>
                  <span className="text-[11px] font-semibold text-ink tabular-nums">{y}</span>
                </Ring>
                <span className="w-11 text-end text-[14px] font-semibold tabular-nums" style={{ color: d > 0 ? '#2E8C68' : d < 0 ? '#D2432F' : '#6E8283' }}>
                  {d > 0 ? '+' : ''}
                  {d}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[13px] text-ink-faint leading-relaxed mt-4">{t('skinDisclaimer')}</p>
      </div>
    </div>
  );
};
