import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { loadPhoto, savePhoto } from '../../services/diaryService';
import { downloadPhoto } from '../../services/cloudSync';
import { TranslationKey } from '../../i18n';
import { ConcernId, SkinGoal, SkinZoneId } from '../../types';

export const TAGS: { id: string; key: TranslationKey; emoji: string }[] = [
  { id: 'period', key: 'tagPeriod', emoji: '🩸' },
  { id: 'workout', key: 'tagWorkout', emoji: '🏃' },
  { id: 'sugar', key: 'tagSugar', emoji: '🍩' },
  { id: 'dairy', key: 'tagDairy', emoji: '🥛' },
  { id: 'spicy', key: 'tagSpicy', emoji: '🌶️' },
  { id: 'alcohol', key: 'tagAlcohol', emoji: '🍷' },
  { id: 'makeup', key: 'tagMakeup', emoji: '💄' },
  { id: 'sun', key: 'tagSun', emoji: '☀️' },
  { id: 'newProduct', key: 'tagNewProduct', emoji: '🧴' },
  { id: 'travel', key: 'tagTravel', emoji: '✈️' },
  { id: 'lateNight', key: 'tagLateNight', emoji: '🌙' },
  { id: 'mask', key: 'tagMask', emoji: '🧖' }
];
export const tagKey = (id: string): TranslationKey | null => TAGS.find((x) => x.id === id)?.key || null;

export const GOALS: { id: SkinGoal; key: TranslationKey }[] = [
  { id: 'clearBreakouts', key: 'goalClearBreakouts' },
  { id: 'evenTone', key: 'goalEvenTone' },
  { id: 'hydration', key: 'goalHydration' },
  { id: 'calmRedness', key: 'goalCalmRedness' },
  { id: 'smoothTexture', key: 'goalSmoothTexture' },
  { id: 'firmness', key: 'goalFirmness' },
  { id: 'minimizePores', key: 'goalMinimizePores' }
];

export const ZONE_KEYS: Record<SkinZoneId, TranslationKey> = {
  forehead: 'zoneForehead',
  tzone: 'zoneTzone',
  leftCheek: 'zoneLeftCheek',
  rightCheek: 'zoneRightCheek',
  chin: 'zoneChin',
  underEye: 'zoneUnderEye'
};

export const CONCERN_KEYS: Record<ConcernId, TranslationKey> = {
  breakouts: 'cBreakouts',
  redness: 'cRedness',
  darkSpots: 'cDarkSpots',
  darkCircles: 'cDarkCircles',
  fineLines: 'cFineLines',
  oiliness: 'cOiliness',
  dryness: 'cDryness',
  enlargedPores: 'cEnlargedPores',
  uneven: 'cUneven'
};

export const SEV_KEYS: TranslationKey[] = ['sev0', 'sev1', 'sev2', 'sev3'];
export const SEV_COLORS = ['#A7B6B6', '#DB8F1F', '#E9733A', '#D2432F'];

export const scoreColor = (n: number) => (n >= 75 ? '#2E8C68' : n >= 55 ? '#DB8F1F' : '#D2432F');

/** A photo thumbnail loaded from this device's IndexedDB. */
export const Thumb: React.FC<{ photoId?: string; photoPath?: string; className?: string; label: string }> = ({ photoId, photoPath, className = '', label }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      let p = await loadPhoto(photoId);
      // Not on this device yet (new phone, cleared browser): fetch from private cloud storage and cache it.
      if (!p && photoPath) {
        p = await downloadPhoto(photoPath);
        if (p && photoId) savePhoto(photoId, p);
      }
      if (alive) setSrc(p);
    })();
    return () => {
      alive = false;
    };
  }, [photoId, photoPath]);
  return src ? (
    <img src={src} alt="" className={`object-cover ${className}`} />
  ) : (
    <div className={`bg-sage-soft text-ink-faint flex items-center justify-center ${className}`} aria-label={label}>
      <ImageOff size={18} />
    </div>
  );
};

/** Simple face map with the six zones, colored by score. */
export const FaceMap: React.FC<{ scores: Partial<Record<SkinZoneId, number>>; active?: SkinZoneId | null; onPick?: (z: SkinZoneId) => void }> = ({
  scores,
  active,
  onPick
}) => {
  const fill = (z: SkinZoneId) => (scores[z] === undefined ? '#DCE6E4' : scoreColor(scores[z]!));
  const op = (z: SkinZoneId) => (active && active !== z ? 0.35 : 0.9);
  const zone = (z: SkinZoneId, d: React.ReactNode) => (
    <g
      key={z}
      onClick={() => onPick?.(z)}
      style={{ cursor: onPick ? 'pointer' : undefined, opacity: op(z), transition: 'opacity .2s' }}
      role={onPick ? 'button' : undefined}
      aria-label={z}
    >
      {d}
    </g>
  );
  return (
    <svg viewBox="0 0 160 200" className="w-full h-full">
      <ellipse cx="80" cy="100" rx="70" ry="92" fill="#F4F7F6" stroke="#C3D3D1" strokeWidth="2" />
      {zone('forehead', <path d="M30 62 Q80 10 130 62 L130 68 Q80 56 30 68 Z" fill={fill('forehead')} />)}
      {zone('underEye', <g fill={fill('underEye')}><ellipse cx="54" cy="96" rx="16" ry="6" /><ellipse cx="106" cy="96" rx="16" ry="6" /></g>)}
      {zone('tzone', <path d="M70 72 L90 72 L94 132 Q80 140 66 132 Z" fill={fill('tzone')} />)}
      {zone('leftCheek', <ellipse cx="42" cy="124" rx="18" ry="20" fill={fill('leftCheek')} />)}
      {zone('rightCheek', <ellipse cx="118" cy="124" rx="18" ry="20" fill={fill('rightCheek')} />)}
      {zone('chin', <path d="M54 160 Q80 192 106 160 Q80 170 54 160 Z" fill={fill('chin')} />)}
      <g fill="#0E2B2E" opacity="0.55">
        <ellipse cx="54" cy="84" rx="8" ry="3.5" />
        <ellipse cx="106" cy="84" rx="8" ry="3.5" />
        <path d="M66 150 Q80 158 94 150" stroke="#0E2B2E" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};
