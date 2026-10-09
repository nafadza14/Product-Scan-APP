import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, ScanLine, NotebookPen, UserRound } from 'lucide-react';
import { Translator } from '../i18n';
import { Pressable, haptic, softSpring } from './ui';

export type Tab = 'home' | 'explore' | 'diary' | 'profile';

const ITEMS: { id: Tab; icon: React.ElementType; label: 'tabHome' | 'tabExplore' | 'tabDiary' | 'tabProfile' }[] = [
  { id: 'home', icon: Home, label: 'tabHome' },
  { id: 'explore', icon: Compass, label: 'tabExplore' },
  { id: 'diary', icon: NotebookPen, label: 'tabDiary' },
  { id: 'profile', icon: UserRound, label: 'tabProfile' }
];

const TabBar: React.FC<{ t: Translator; tab: Tab; onTab: (t: Tab) => void; onScan: () => void }> = ({ t, tab, onTab, onScan }) => {
  const render = (item: (typeof ITEMS)[number]) => {
    const active = tab === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => {
          if (!active) haptic(6);
          onTab(item.id);
        }}
        aria-label={t(item.label)}
        aria-current={active ? 'page' : undefined}
        className="relative w-12 h-12 flex items-center justify-center"
      >
        {active && <motion.span layoutId="tab-bubble" className="absolute inset-0 rounded-full bg-white shadow-soft" transition={softSpring} />}
        <Icon size={22} strokeWidth={active ? 2.2 : 1.8} className={`relative z-10 transition-colors ${active ? 'text-ink' : 'text-ink-muted'}`} />
      </button>
    );
  };

  return (
    <nav className="absolute bottom-0 inset-x-0 z-30 px-4 pb-safe pointer-events-none" aria-label="Main">
      <div className="pointer-events-auto mx-auto max-w-[400px] mb-1 h-[68px] rounded-full bg-[#F4F7F6]/85 backdrop-blur-2xl border border-white/70 shadow-lift flex items-center justify-between px-2.5">
        {ITEMS.slice(0, 2).map(render)}
        <Pressable onClick={onScan} aria-label={t('tabScan')} className="w-[52px] h-[52px] rounded-full bg-ink text-white flex items-center justify-center shadow-lift">
          <ScanLine size={24} />
        </Pressable>
        {ITEMS.slice(2).map(render)}
      </div>
    </nav>
  );
};

export default TabBar;
