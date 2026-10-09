import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, ScanLine, Smile, Library } from 'lucide-react';
import { ScanHistoryItem, SkinScanItem } from '../types';
import { Translator, TranslationKey, timeAgo } from '../i18n';
import { Chip, EmptyState, Pressable, PrimaryButton, ProductIcon, Ring, Segmented } from './ui';
import { statusColor } from './HomeView';

type Filter = 'all' | 'food' | 'skincare' | 'skin' | 'saved';
type Sort = 'recent' | 'best';

interface Props {
  t: Translator;
  history: ScanHistoryItem[];
  skinHistory: SkinScanItem[];
  signedIn: boolean;
  onOpenProduct: (item: ScanHistoryItem) => void;
  onOpenSkin: (item: SkinScanItem) => void;
  onToggleFavorite: (id: string) => void;
  onScan: () => void;
  embedded?: boolean;
}

type Row = { kind: 'product'; item: ScanHistoryItem; ts: number; score: number } | { kind: 'skin'; item: SkinScanItem; ts: number; score: number };

const skinScore = (s: SkinScanItem) =>
  Math.round((s.metrics.moisture + s.metrics.firmness + s.metrics.texture + s.metrics.poreVisibility + s.metrics.evenness) / 5);

const LibraryView: React.FC<Props> = ({ t, history, skinHistory, signedIn, onOpenProduct, onOpenSkin, onToggleFavorite, onScan, embedded }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');

  const rows = useMemo(() => {
    let r: Row[] = [];
    if (filter !== 'skin') {
      r = history
        .filter((h) =>
          filter === 'food' ? h.category !== 'Cosmetic' : filter === 'skincare' ? h.category === 'Cosmetic' : filter === 'saved' ? h.isFavorite : true
        )
        .map((h) => ({ kind: 'product' as const, item: h, ts: h.timestamp, score: h.score }));
    }
    if (filter === 'all' || filter === 'skin') {
      r = r.concat(skinHistory.map((s) => ({ kind: 'skin' as const, item: s, ts: s.timestamp, score: skinScore(s) })));
    }
    return r.sort((a, b) => (sort === 'best' ? b.score - a.score : b.ts - a.ts));
  }, [history, skinHistory, filter, sort]);

  const filters: [Filter, TranslationKey][] = [
    ['all', 'filterAll'],
    ['food', 'filterFood'],
    ['skincare', 'filterSkincare'],
    ['skin', 'filterSkin'],
    ['saved', 'filterSaved']
  ];

  const total = history.length + skinHistory.length;

  return (
    <div className={embedded ? 'pb-16' : 'pt-safe pb-36'}>
      <div className={`px-5 flex items-end justify-between mb-4 ${embedded ? 'pt-1' : 'pt-3'}`}>
        <h1 className={`${embedded ? 'text-[24px]' : 'text-[32px]'} leading-none font-semibold tracking-[-0.02em] text-ink`}>{embedded ? t('productScans') : t('libraryTitle')}</h1>
        {total > 1 && (
          <Segmented
            layoutId="library-sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: t('sortRecent') },
              { value: 'best', label: t('sortBest') }
            ]}
          />
        )}
      </div>

      {total > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-4">
          {filters.map(([f, k]) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {t(k)}
            </Chip>
          ))}
        </div>
      )}

      {total === 0 ? (
        <EmptyState
          icon={<Library size={28} />}
          title={t('emptyLibraryTitle')}
          body={t('emptyLibraryBody')}
          action={
            <PrimaryButton onClick={onScan}>
              <ScanLine size={20} /> {signedIn ? t('scanProduct') : t('signInToScan')}
            </PrimaryButton>
          }
        />
      ) : rows.length === 0 ? (
        filter === 'saved' ? (
          <EmptyState icon={<Star size={28} />} title={t('emptySavedTitle')} body={t('emptySavedBody')} />
        ) : (
          <EmptyState icon={<Library size={28} />} title={t('emptyFilterTitle')} body={t('emptyFilterBody')} />
        )
      ) : (
        <motion.ul layout className="px-5 space-y-2.5">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.li
                key={r.item.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              >
                {r.kind === 'product' ? (
                  <div className="rounded-3xl bg-white shadow-soft flex items-center">
                    <Pressable onClick={() => onOpenProduct(r.item)} className="flex-1 min-w-0 flex items-center gap-3 p-3 text-start">
                      <ProductIcon icon={r.item.icon} size={52} />
                      <span className="min-w-0">
                        <span className="block text-[16px] font-semibold text-ink truncate">{r.item.productName}</span>
                        <span className="block text-[13px] text-ink-muted mt-0.5">
                          {r.item.category === 'Cosmetic' ? t('filterSkincare') : t('filterFood')}, {timeAgo(t, r.item.timestamp)}
                        </span>
                      </span>
                    </Pressable>
                    <Pressable
                      aria-label={r.item.isFavorite ? t('saved') : t('save')}
                      aria-pressed={!!r.item.isFavorite}
                      onClick={() => onToggleFavorite(r.item.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${r.item.isFavorite ? 'text-coral' : 'text-ink-faint'}`}
                    >
                      <Star size={20} fill={r.item.isFavorite ? 'currentColor' : 'none'} />
                    </Pressable>
                    <span className="pe-3">
                      <Ring value={r.item.score} size={42} stroke={4} color={statusColor(r.item.status)}>
                        <span className="text-[13px] font-semibold text-ink">{r.item.score}</span>
                      </Ring>
                    </span>
                  </div>
                ) : (
                  <Pressable onClick={() => onOpenSkin(r.item)} className="w-full rounded-3xl bg-white shadow-soft flex items-center gap-3 p-3 text-start">
                    <span className="w-[52px] h-[52px] rounded-2xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
                      <Smile size={24} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[16px] font-semibold text-ink">{t('skinCheck')}</span>
                      <span className="block text-[13px] text-ink-muted mt-0.5 truncate">
                        {r.item.concerns.slice(0, 2).join(', ') || timeAgo(t, r.item.timestamp)}
                      </span>
                    </span>
                    <Ring value={r.score} size={42} stroke={4}>
                      <span className="text-[13px] font-semibold text-ink">{r.score}</span>
                    </Ring>
                  </Pressable>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
};

export default LibraryView;
