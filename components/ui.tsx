import React, { useEffect, useId, useState } from 'react';
import { motion, animate, useMotionValue, useTransform, HTMLMotionProps, MotionValue } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

// ---------- Motion tokens ----------

// The easing iOS uses for navigation pushes and sheet presentation.
export const IOS_EASE = [0.32, 0.72, 0, 1] as const;
export const pushTransition = { type: 'tween', ease: IOS_EASE, duration: 0.5 } as const;
export const sheetTransition = { type: 'spring', stiffness: 380, damping: 40, mass: 1 } as const;
export const softSpring = { type: 'spring', stiffness: 500, damping: 34 } as const;

export const haptic = (ms = 8) => {
  try {
    if ('vibrate' in navigator) navigator.vibrate(ms);
  } catch { /* unsupported */ }
};

// ---------- Pressable ----------

type PressableProps = HTMLMotionProps<'button'> & { haptics?: boolean };

export const Pressable = React.forwardRef<HTMLButtonElement, PressableProps>(
  ({ haptics = true, onClick, className = '', type = 'button', ...rest }, ref) => (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.96 }}
      transition={softSpring}
      onClick={(e) => {
        if (haptics) haptic();
        onClick?.(e);
      }}
      className={`touch-manipulation disabled:opacity-40 disabled:pointer-events-none ${className}`}
      {...rest}
    />
  )
);
Pressable.displayName = 'Pressable';

// ---------- Buttons ----------

export const PrimaryButton: React.FC<PressableProps> = ({ className = '', children, ...rest }) => (
  <Pressable
    className={`h-14 w-full rounded-full bg-ink text-white font-semibold text-[16px] flex items-center justify-center gap-2 shadow-lift ${className}`}
    {...rest}
  >
    {children}
  </Pressable>
);

export const SecondaryButton: React.FC<PressableProps> = ({ className = '', children, ...rest }) => (
  <Pressable
    className={`h-14 w-full rounded-full bg-white text-ink font-semibold text-[16px] flex items-center justify-center gap-2 shadow-soft ${className}`}
    {...rest}
  >
    {children}
  </Pressable>
);

export const IconButton: React.FC<PressableProps & { tone?: 'dark' | 'light' | 'glass'; label: string }> = ({
  tone = 'dark',
  label,
  className = '',
  children,
  ...rest
}) => {
  const tones = {
    dark: 'bg-ink text-white',
    light: 'bg-white text-ink shadow-soft',
    glass: 'bg-white/20 text-white backdrop-blur-xl border border-white/25'
  };
  return (
    <Pressable aria-label={label} title={label} className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tones[tone]} ${className}`} {...rest}>
      {children}
    </Pressable>
  );
};

// ---------- Nav bar for pushed pages and sheets ----------

export const NavBar: React.FC<{
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  backLabel: string;
  closeLabel: string;
  right?: React.ReactNode;
  scrolled?: boolean;
  rtl?: boolean;
}> = ({ title, onBack, onClose, backLabel, closeLabel, right, scrolled, rtl }) => (
  <div
    className={`sticky top-0 z-20 px-5 pt-safe pb-3 flex items-center justify-between transition-colors duration-300 ${
      scrolled ? 'blur-bar' : 'bg-transparent'
    }`}
  >
    <div className="w-11">
      {onBack && (
        <IconButton label={backLabel} onClick={onBack}>
          <ChevronLeft size={22} className={rtl ? 'rotate-180' : ''} />
        </IconButton>
      )}
    </div>
    <motion.h2
      className="text-[17px] font-semibold text-ink truncate px-3"
      animate={{ opacity: title ? 1 : 0 }}
    >
      {title}
    </motion.h2>
    <div className="w-11 flex justify-end">
      {right}
      {onClose && (
        <IconButton label={closeLabel} onClick={onClose}>
          <X size={20} />
        </IconButton>
      )}
    </div>
  </div>
);

// ---------- Ring gauge ----------

export const useCountUp = (to: number, delay = 0.15, duration = 1.1) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v))
    });
    return () => controls.stop();
  }, [to, delay, duration]);
  return value;
};

export const Ring: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  color?: 'coral' | string;
  track?: string;
  delay?: number;
  children?: React.ReactNode;
}> = ({ value, size = 56, stroke = 6, color = 'coral', track = '#E4EBE9', delay = 0.15, children }) => {
  const gid = useId().replace(/:/g, '');
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F6A04D" />
            <stop offset="100%" stopColor="#EE5F3B" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color === 'coral' ? `url(#g${gid})` : color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
};

// ---------- Segmented control ----------

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  dark = false,
  layoutId
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  dark?: boolean;
  layoutId: string;
}) {
  return (
    <div className={`inline-flex p-1 rounded-full ${dark ? 'bg-black/35 backdrop-blur-xl' : 'bg-sage-soft'}`} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) haptic(6);
              onChange(o.value);
            }}
            className={`relative px-4 h-9 rounded-full text-[14px] font-semibold transition-colors ${
              active ? (dark ? 'text-ink' : 'text-ink') : dark ? 'text-white/80' : 'text-ink-muted'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className={`absolute inset-0 rounded-full ${dark ? 'bg-white' : 'bg-white shadow-soft'}`}
                transition={softSpring}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Chips ----------

export const Chip: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ active, onClick, children, className = '' }) => (
  <Pressable
    onClick={onClick}
    aria-pressed={active}
    className={`h-10 px-4 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${
      active ? 'bg-ink text-white' : 'bg-white text-ink shadow-soft'
    } ${className}`}
  >
    {children}
  </Pressable>
);

export const Tag: React.FC<{ children: React.ReactNode; tone?: 'ink' | 'sage' | 'coral' }> = ({ children, tone = 'ink' }) => {
  const tones = {
    ink: 'bg-ink text-white',
    sage: 'bg-sage-soft text-ink',
    coral: 'bg-coral/10 text-coral'
  };
  return <span className={`inline-flex items-center h-9 px-4 rounded-full text-[14px] font-semibold ${tones[tone]}`}>{children}</span>;
};

// ---------- Empty state ----------

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }> = ({
  icon,
  title,
  body,
  action
}) => (
  <div className="flex flex-col items-center text-center px-8 py-12">
    <div className="w-16 h-16 rounded-3xl bg-white shadow-soft flex items-center justify-center text-ink-muted mb-5">{icon}</div>
    <p className="text-[17px] font-semibold text-ink mb-1.5">{title}</p>
    <p className="text-[15px] text-ink-muted leading-relaxed max-w-[280px]">{body}</p>
    {action && <div className="mt-6 w-full max-w-[260px]">{action}</div>}
  </div>
);

// ---------- Product thumbnail ----------

export const ProductIcon: React.FC<{ icon?: string; size?: number; className?: string }> = ({ icon, size = 56, className = '' }) => {
  const ok = icon && [...icon].length <= 4 && !icon.includes('_');
  return (
    <div
      className={`rounded-2xl bg-sage-soft flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      {ok ? icon : '🥫'}
    </div>
  );
};

// ---------- Sheet (iOS card presentation, drag down to dismiss) ----------

export const Sheet: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  height?: 'full' | 'auto';
  label: string;
  bg?: string;
}> = ({ onClose, children, height = 'full', label, bg = 'bg-canvas' }) => {
  const y = useMotionValue(0);
  const backdrop = useTransform(y, [0, 400], [1, 0]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <motion.div
        className="absolute inset-0 bg-black/35"
        style={{ opacity: backdrop }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        className={`absolute bottom-0 w-full max-w-[450px] ${bg} rounded-t-[28px] shadow-sheet flex flex-col overflow-hidden ${
          height === 'full' ? 'top-[max(env(safe-area-inset-top),12px)]' : 'max-h-[88dvh]'
        }`}
        style={{ y }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={sheetTransition}
      >
        <SheetGrabber y={y} onClose={onClose} />
        {children}
      </motion.div>
    </div>
  );
};

// The grabber area is the drag handle, so scrolling content inside the sheet never fights the gesture.
const SheetGrabber: React.FC<{ y: MotionValue<number>; onClose: () => void }> = ({ y, onClose }) => (
  <motion.div
    className="absolute top-0 inset-x-0 h-7 z-30 flex justify-center pt-2 cursor-grab active:cursor-grabbing touch-none"
    onPan={(_, info) => y.set(Math.max(0, info.offset.y))}
    onPanEnd={(_, info) => {
      if (info.offset.y > 120 || info.velocity.y > 500) onClose();
      else animate(y, 0, sheetTransition);
    }}
  >
    <span className="w-10 h-[5px] rounded-full bg-ink/20" />
  </motion.div>
);

// ---------- Push page (slides in from the trailing edge, swipe from the edge to go back) ----------

export const PushPage: React.FC<{
  onBack: () => void;
  children: React.ReactNode;
  rtl?: boolean;
  label: string;
  className?: string;
}> = ({ onBack, children, rtl, label, className = 'bg-canvas' }) => {
  const x = useMotionValue(0);
  const dir = rtl ? -1 : 1;
  return (
    <div className="fixed inset-0 z-40 flex justify-center pointer-events-none">
    <motion.div
      className={`relative h-full w-full max-w-[450px] pointer-events-auto shadow-[-12px_0_40px_rgba(0,0,0,0.12)] ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      initial={{ x: `${100 * dir}%` }}
      animate={{ x: 0 }}
      exit={{ x: `${100 * dir}%` }}
      transition={pushTransition}
      style={{ x }}
    >
      {/* Edge swipe zone, like the iOS interactive pop gesture */}
      <motion.div
        className={`absolute inset-y-0 ${rtl ? 'right-0' : 'left-0'} w-5 z-50 touch-none`}
        onPan={(_, info) => x.set(Math.max(0, info.offset.x * dir) * dir)}
        onPanEnd={(_, info) => {
          if (info.offset.x * dir > 110 || info.velocity.x * dir > 500) onBack();
          else animate(x, 0, pushTransition);
        }}
      />
      {children}
    </motion.div>
    </div>
  );
};

// ---------- Avatar ----------

export const Avatar: React.FC<{ name?: string; size?: number }> = ({ name, size = 48 }) => {
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <div
      className="rounded-2xl bg-sage flex items-center justify-center text-ink font-semibold ring-4 ring-white shadow-soft"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials || '🙂'}
    </div>
  );
};
