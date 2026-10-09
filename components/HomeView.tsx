import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine, ArrowRight, Smile, ChevronRight, KeyRound, HeartPulse } from 'lucide-react';
import { ScanHistoryItem, SkinScanItem, UserProfile, ScanMode, ScanStatus } from '../types';
import { Translator, conditionLabel, timeAgo } from '../i18n';
import { Avatar, Pressable, ProductIcon, Ring } from './ui';
import { Thumb } from './diary/shared';
import { scoreOf } from '../services/diaryService';

interface Props {
  t: Translator;
  rtl: boolean;
  user: UserProfile | null;
  history: ScanHistoryItem[];
  skinHistory: SkinScanItem[];
  hasApiKey: boolean;
  onScan: (mode: ScanMode) => void;
  onOpenProduct: (item: ScanHistoryItem) => void;
  onOpenSkin: (item: SkinScanItem) => void;
  onSeeAll: () => void;
  onFeeling: () => void;
  onProfile: () => void;
}

export const statusColor = (s: ScanStatus) => (s === ScanStatus.SAFE ? '#2E8C68' : s === ScanStatus.CAUTION ? '#DB8F1F' : '#D2432F');

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const HomeView: React.FC<Props> = ({
  t,
  rtl,
  user,
  history,
  skinHistory,
  hasApiKey,
  onScan,
  onOpenProduct,
  onOpenSkin,
  onSeeAll,
  onFeeling,
  onProfile
}) => {
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const recent = [...history.map((h) => ({ kind: 'product' as const, ts: h.timestamp, item: h })), ...skinHistory.map((s) => ({ kind: 'skin' as const, ts: s.timestamp, item: s }))]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8);
  const topPicks = history.filter((h) => h.status === ScanStatus.SAFE).sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="px-5 pt-safe pb-36">
      {/* Greeting */}
      <motion.header variants={rise} className="flex items-start justify-between pt-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] text-ink truncate">
            {firstName ? t('hi', { name: firstName }) : t('hiGuest')} <span aria-hidden>👋</span>
          </h1>
          <p className="text-[16px] text-ink-muted mt-1.5">{t('homeSub')}</p>
        </div>
        <Pressable onClick={onProfile} aria-label={t('tabProfile')} className="shrink-0 ms-3 rounded-2xl">
          <Avatar name={user?.name} size={52} />
        </Pressable>
      </motion.header>

      {!hasApiKey && (
        <motion.div variants={rise} className="mb-4 rounded-3xl bg-white p-4 shadow-soft flex gap-3 items-start">
          <div className="w-10 h-10 rounded-2xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink text-[15px]">{t('apiMissingTitle')}</p>
            <p className="text-[14px] text-ink-muted leading-snug mt-0.5">{t('apiMissingBody')}</p>
          </div>
        </motion.div>
      )}

      {/* Hero */}
      <motion.section variants={rise} className="relative rounded-[28px] bg-sage overflow-hidden mb-4 min-h-[188px] flex">
        <div className="relative w-[44%] shrink-0">
          <div className="absolute inset-y-5 start-4 end-1 rotate-[-4deg] rounded-xl bg-white p-1.5 shadow-lift">
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=70"
              alt=""
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -top-2 start-6 w-12 h-4 bg-[#B49AD8]/70 rotate-[-12deg] rounded-sm" aria-hidden />
          </div>
        </div>
        <div className="flex-1 py-6 pe-5 ps-3 flex flex-col justify-center">
          <h2 className="text-[22px] leading-[1.15] font-medium text-ink tracking-[-0.01em]">{t('heroTitle')}</h2>
          <p className="text-[14px] text-ink-soft mt-2 leading-snug">
            {user ? t('heroBodyProfile', { condition: conditionLabel(t, user) }) : t('heroBodyGuest')}
          </p>
        </div>
      </motion.section>

      {/* Primary actions */}
      <motion.div variants={rise} className="space-y-3 mb-8">
        <Pressable
          onClick={() => onScan('product')}
          className="w-full h-[72px] rounded-full bg-ink text-white flex items-center gap-4 ps-2.5 pe-6 shadow-lift"
        >
          <span className="w-[54px] h-[54px] rounded-full bg-[#27484B] flex items-center justify-center">
            <ScanLine size={24} />
          </span>
          <span className="flex-1 text-start">
            <span className="block text-[17px] font-semibold leading-tight">{user ? t('scanProduct') : t('signInToScan')}</span>
            <span className="block text-[13px] text-white/60 mt-0.5">{t('scanProductSub')}</span>
          </span>
          <ArrowRight size={22} className={rtl ? 'rotate-180' : ''} />
        </Pressable>

        <Pressable
          onClick={() => onScan('skin')}
          className="w-full h-[64px] rounded-full bg-white text-ink flex items-center gap-4 ps-2 pe-6 shadow-soft"
        >
          <span className="w-[48px] h-[48px] rounded-full bg-coral/10 text-coral flex items-center justify-center">
            <Smile size={22} />
          </span>
          <span className="flex-1 text-start">
            <span className="block text-[16px] font-semibold leading-tight">{t('scanSkin')}</span>
            <span className="block text-[13px] text-ink-muted mt-0.5">{t('scanSkinSub')}</span>
          </span>
          <ArrowRight size={20} className={`text-ink-faint ${rtl ? 'rotate-180' : ''}`} />
        </Pressable>
      </motion.div>

      {/* Recent scans */}
      <motion.section variants={rise} className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-[20px] font-semibold text-ink tracking-[-0.01em]">{t('recentScans')}</h3>
          {recent.length > 0 && (
            <button onClick={onSeeAll} className="text-[15px] font-semibold text-coral flex items-center gap-0.5">
              {t('seeAll')} <ChevronRight size={16} className={rtl ? 'rotate-180' : ''} />
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-sage-deep/50 px-5 py-6">
            <p className="text-[16px] font-semibold text-ink">{t('emptyRecentTitle')}</p>
            <p className="text-[14px] text-ink-muted mt-1 leading-relaxed">{t('emptyRecentBody')}</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2 snap-x snap-mandatory">
            {recent.map((r) =>
              r.kind === 'product' ? (
                <Pressable
                  key={r.item.id}
                  onClick={() => onOpenProduct(r.item)}
                  className="snap-start shrink-0 w-[156px] rounded-3xl bg-white p-3 text-start shadow-soft"
                >
                  <div className="h-[112px] rounded-2xl bg-sage-soft flex items-center justify-center text-[52px] mb-3 relative">
                    <ProductIcon icon={r.item.icon} size={80} className="bg-transparent" />
                    <span className="absolute top-2 end-2">
                      <Ring value={r.item.score} size={34} stroke={4} color={statusColor(r.item.status)} track="#fff">
                        <span className="text-[10px] font-semibold text-ink">{r.item.score}</span>
                      </Ring>
                    </span>
                  </div>
                  <p className="text-[15px] font-semibold text-ink leading-tight line-clamp-2 min-h-[2.5em]">{r.item.productName}</p>
                  <p className="text-[13px] text-ink-muted mt-1">{timeAgo(t, r.item.timestamp)}</p>
                </Pressable>
              ) : (
                <Pressable
                  key={r.item.id}
                  onClick={() => onOpenSkin(r.item)}
                  className="snap-start shrink-0 w-[156px] rounded-3xl bg-white p-3 text-start shadow-soft"
                >
                  <div className="h-[112px] rounded-2xl bg-coral/10 flex items-center justify-center mb-3 relative overflow-hidden">
                    {r.item.photoId ? (
                      <Thumb photoId={r.item.photoId} className="absolute inset-0 w-full h-full" label={t('skinCheck')} />
                    ) : (
                      <Smile size={30} className="text-coral" />
                    )}
                    <span className="absolute top-2 end-2">
                      <Ring value={scoreOf(r.item)} size={34} stroke={4} track="#fff">
                        <span className="text-[10px] font-semibold text-ink">{scoreOf(r.item)}</span>
                      </Ring>
                    </span>
                  </div>
                  <p className="text-[15px] font-semibold text-ink leading-tight min-h-[2.5em]">{t('skinCheck')}</p>
                  <p className="text-[13px] text-ink-muted mt-1">{timeAgo(t, r.item.timestamp)}</p>
                </Pressable>
              )
            )}
          </div>
        )}
      </motion.section>

      {/* Daily check-in */}
      {user && (
        <motion.section variants={rise} className="mb-8">
          <Pressable onClick={onFeeling} className="w-full rounded-3xl bg-white p-4 flex items-center gap-4 text-start shadow-soft">
            <span className="w-12 h-12 rounded-2xl bg-sage-soft text-ink flex items-center justify-center shrink-0">
              <HeartPulse size={22} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[16px] font-semibold text-ink">{t('feelingTitle')}</span>
              <span className="block text-[14px] text-ink-muted mt-0.5 truncate">{t('feelingBody')}</span>
            </span>
            <span className="text-[14px] font-semibold text-coral shrink-0">{t('feelingUpdate')}</span>
          </Pressable>
        </motion.section>
      )}

      {/* Best matches */}
      {topPicks.length > 0 && (
        <motion.section variants={rise}>
          <h3 className="text-[20px] font-semibold text-ink tracking-[-0.01em] mb-3">{t('topPicks')}</h3>
          <div className="rounded-3xl bg-white shadow-soft divide-y divide-canvas">
            {topPicks.map((item) => (
              <Pressable key={item.id} onClick={() => onOpenProduct(item)} className="w-full flex items-center gap-3 p-3 text-start">
                <ProductIcon icon={item.icon} size={48} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-ink truncate">{item.productName}</span>
                  <span className="block text-[13px] text-ink-muted">{t('verdictSafe')}</span>
                </span>
                <Ring value={item.score} size={40} stroke={4} color={statusColor(item.status)}>
                  <span className="text-[12px] font-semibold text-ink">{item.score}</span>
                </Ring>
              </Pressable>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default HomeView;
