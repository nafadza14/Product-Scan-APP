import React from 'react';
import { ChevronRight, Cloud, Globe, HeartPulse, LogOut, Pencil, ScanLine, UserRound } from 'lucide-react';
import { AppLanguage, UserProfile } from '../types';
import { Translator, conditionLabel, languageOptions, optionLabel } from '../i18n';
import { Avatar, Pressable, PrimaryButton, SecondaryButton } from './ui';

interface Props {
  t: Translator;
  rtl: boolean;
  user: UserProfile | null;
  language: AppLanguage;
  email?: string;
  stats: { scans: number; saved: number; skin: number };
  hasApiKey: boolean;
  cloudStatus?: 'unknown' | 'on' | 'not_set_up' | 'offline';
  onSignIn: (mode: 'signin' | 'signup') => void;
  onEditProfile: () => void;
  onUpdateSymptoms: () => void;
  onLanguage: () => void;
  onSignOut: () => void;
}

const Row: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  rtl?: boolean;
}> = ({ icon, label, value, onClick, danger, rtl }) => {
  const content = (
    <>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-avoid/10 text-avoid' : 'bg-sage-soft text-ink'}`}>{icon}</span>
      <span className={`flex-1 text-[16px] font-medium ${danger ? 'text-avoid' : 'text-ink'}`}>{label}</span>
      {value && <span className="text-[15px] text-ink-muted truncate max-w-[45%]">{value}</span>}
      {onClick && !danger && <ChevronRight size={18} className={`text-ink-faint shrink-0 ${rtl ? 'rotate-180' : ''}`} />}
    </>
  );
  return onClick ? (
    <Pressable onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-start">
      {content}
    </Pressable>
  ) : (
    <div className="w-full flex items-center gap-3 px-4 py-3">{content}</div>
  );
};

const ProfileView: React.FC<Props> = ({ t, rtl, user, language, email, stats, hasApiKey, cloudStatus = 'unknown', onSignIn, onEditProfile, onUpdateSymptoms, onLanguage, onSignOut }) => {
  const langName = languageOptions.find((l) => l.code === language)?.native;

  if (!user) {
    return (
      <div className="px-5 pt-safe pb-36">
        <h1 className="pt-3 text-[32px] leading-none font-semibold tracking-[-0.02em] text-ink mb-6">{t('profileTitle')}</h1>
        <div className="rounded-[28px] bg-sage p-6 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-ink mb-5">
            <UserRound size={26} />
          </div>
          <h2 className="text-[24px] leading-tight font-semibold text-ink mb-2">{t('signedOutTitle')}</h2>
          <p className="text-[15px] text-ink-soft leading-relaxed mb-6">{t('signedOutBody')}</p>
          <div className="space-y-3">
            <PrimaryButton onClick={() => onSignIn('signup')}>{t('createAccount')}</PrimaryButton>
            <SecondaryButton onClick={() => onSignIn('signin')}>{t('signIn')}</SecondaryButton>
          </div>
        </div>
        <div className="rounded-3xl bg-white shadow-soft overflow-hidden">
          <Row icon={<Globe size={18} />} label={t('language')} value={langName} onClick={onLanguage} rtl={rtl} />
        </div>
      </div>
    );
  }

  const details = user.additionalContext.filter((c) => !c.startsWith('Description:')).map((c) => optionLabel(c, user.language));
  const symptoms = user.currentSymptoms.map((s) => optionLabel(s, user.language));

  return (
    <div className="px-5 pt-safe pb-36">
      <h1 className="pt-3 text-[32px] leading-none font-semibold tracking-[-0.02em] text-ink mb-6">{t('profileTitle')}</h1>

      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user.name} size={68} />
        <div className="min-w-0">
          <p className="text-[22px] font-semibold text-ink truncate">{user.name || t('hiGuest')}</p>
          {email && <p className="text-[14px] text-ink-muted truncate">{email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {(
          [
            [stats.scans, t('statScans')],
            [stats.saved, t('statSaved')],
            [stats.skin, t('statSkin')]
          ] as const
        ).map(([n, label]) => (
          <div key={label} className="rounded-3xl bg-white p-4 shadow-soft">
            <p className="text-[26px] leading-none font-semibold text-ink tabular-nums">{n}</p>
            <p className="text-[13px] text-ink-muted mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-[15px] font-semibold text-ink-muted px-1 mb-2">{t('healthProfile')}</h2>
      <div className="rounded-3xl bg-white shadow-soft mb-6 overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-canvas">
          <p className="text-[13px] text-ink-muted">{t('focus')}</p>
          <p className="text-[19px] font-semibold text-ink mt-0.5">{conditionLabel(t, user)}</p>
          {details.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {details.map((d) => (
                <span key={d} className="h-8 px-3 rounded-full bg-sage-soft text-ink text-[13px] font-medium inline-flex items-center">
                  {d}
                </span>
              ))}
            </div>
          )}
          <p className="text-[13px] text-ink-muted mt-4">{t('symptomsToday')}</p>
          <p className="text-[15px] text-ink mt-0.5">{symptoms.length ? symptoms.join(', ') : t('none')}</p>
        </div>
        <div className="divide-y divide-canvas">
          <Row icon={<HeartPulse size={18} />} label={t('updateSymptoms')} onClick={onUpdateSymptoms} rtl={rtl} />
          <Row icon={<Pencil size={18} />} label={t('editProfile')} onClick={onEditProfile} rtl={rtl} />
        </div>
      </div>

      <h2 className="text-[15px] font-semibold text-ink-muted px-1 mb-2">{t('settings')}</h2>
      <div className="rounded-3xl bg-white shadow-soft divide-y divide-canvas mb-6 overflow-hidden">
        <Row icon={<Globe size={18} />} label={t('language')} value={langName} onClick={onLanguage} rtl={rtl} />
        <Row icon={<ScanLine size={18} />} label={t('scanning')} value={hasApiKey ? t('scanningReady') : t('scanningOff')} />
        <Row
          icon={<Cloud size={18} />}
          label={t('backup')}
          value={t(cloudStatus === 'on' ? 'backupOn' : cloudStatus === 'not_set_up' ? 'backupNotSetUp' : cloudStatus === 'offline' ? 'backupOffline' : 'backupChecking')}
        />
      </div>

      <div className="rounded-3xl bg-white shadow-soft overflow-hidden">
        <Row icon={<LogOut size={18} />} label={t('signOut')} onClick={onSignOut} danger />
      </div>
    </div>
  );
};

export default ProfileView;
