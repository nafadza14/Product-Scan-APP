import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Copy, Check, Eye, EyeOff, MailCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { isNative, NATIVE_AUTH_REDIRECT, openAuthBrowser } from '../services/native';
import { Translator } from '../i18n';
import { legalUrl } from '../services/legal';
import { NavBar, Pressable, PrimaryButton, SecondaryButton } from './ui';

interface Props {
  t: Translator;
  rtl: boolean;
  initialMode: 'signin' | 'signup';
  onClose: () => void;
}

const redirectUrl = () => {
  const origin = window.location.origin.startsWith('http') ? window.location.origin : `https://${window.location.origin}`;
  return origin.endsWith('/') ? origin : `${origin}/`;
};

const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; trailing?: React.ReactNode }> = ({ label, trailing, id, ...rest }) => (
  <label htmlFor={id} className="flex items-center gap-3 px-4 h-[60px]">
    <span className="flex-1 min-w-0">
      <span className="block text-[12px] text-ink-muted leading-none mb-1">{label}</span>
      <input id={id} className="w-full bg-transparent outline-none text-[16px] text-ink placeholder:text-ink-faint" {...rest} />
    </span>
    {trailing}
  </label>
);

const Auth: React.FC<Props> = ({ t, rtl, initialMode, onClose }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState<'email' | 'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectError, setRedirectError] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSignUp = mode === 'signup';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError(null);
    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: redirectUrl() }
        });
        if (err) throw err;
        // With email confirmation on, Supabase returns no session until the link is opened.
        if (!data.session) setConfirmSent(true);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err: any) {
      setError(err?.message || t('errAuthGeneric'));
    } finally {
      setLoading(null);
    }
  };

  const oauth = async (provider: 'google' | 'apple') => {
    setLoading(provider);
    setError(null);
    setRedirectError(false);
    // Native app: Supabase returns the URL, we open it in the in-app browser and come back via the
    // online.scanything.app://auth-callback deep link (handled in services/native.ts).
    const native = isNative();
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: native ? NATIVE_AUTH_REDIRECT : redirectUrl(),
        skipBrowserRedirect: native,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'select_account' } : undefined
      }
    });
    if (!err && native && data?.url) {
      await openAuthBrowser(data.url, () => setLoading(null));
      return;
    }
    if (err) {
      setError(t('errRedirect'));
      setRedirectError(true);
      setLoading(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(redirectUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  };

  if (confirmSent) {
    return (
      <div className="flex-1 overflow-y-auto">
        <NavBar onClose={onClose} backLabel={t('back')} closeLabel={t('close')} rtl={rtl} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-6 pt-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-[28px] bg-sage flex items-center justify-center text-ink mb-6">
            <MailCheck size={34} />
          </div>
          <h1 className="text-[26px] font-semibold text-ink mb-2">{t('checkEmailTitle')}</h1>
          <p className="text-[16px] text-ink-muted leading-relaxed mb-8">{t('checkEmailBody', { email })}</p>
          <PrimaryButton onClick={onClose}>{t('done')}</PrimaryButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <NavBar onClose={onClose} backLabel={t('back')} closeLabel={t('close')} rtl={rtl} />
      <div className="px-5 pb-10">
        <img src="/icon.svg" alt="" aria-hidden className="w-16 h-16 rounded-[22px] mb-6 shadow-lift" />

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: rtl ? -12 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: rtl ? 12 : -12 }} transition={{ duration: 0.22 }}>
            <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em] text-ink">{isSignUp ? t('authCreate') : t('authWelcomeBack')}</h1>
            <p className="text-[16px] text-ink-muted mt-1.5 mb-7">{isSignUp ? t('authCreateSub') : t('authWelcomeBackSub')}</p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              role="alert"
            >
              <div className="rounded-2xl bg-avoid/10 p-3.5 mb-4">
                <p className="flex gap-2 text-[14px] text-avoid font-medium">
                  <AlertCircle size={18} className="shrink-0 mt-px" /> {error}
                </p>
                {redirectError && (
                  <div className="mt-3">
                    <p className="text-[13px] text-ink-soft mb-2">{t('redirectHelp')}</p>
                    <div className="flex items-center gap-2 rounded-xl bg-white px-3 h-10">
                      <code className="flex-1 truncate text-[12px] text-ink">{redirectUrl()}</code>
                      <button onClick={copy} className="text-[13px] font-semibold text-coral flex items-center gap-1">
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t('copied') : t('copy')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit}>
          <div className="rounded-3xl bg-mist divide-y divide-canvas mb-5 overflow-hidden">
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <Field id="name" label={t('fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
                </motion.div>
              )}
            </AnimatePresence>
            <Field id="email" label={t('email')} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field
              id="password"
              label={t('password')}
              type={showPw ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={isSignUp ? t('passwordHint') : undefined}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              trailing={
                <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? t('hidePassword') : t('showPassword')} className="text-ink-muted p-1">
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </div>

          <PrimaryButton type="submit" disabled={!!loading}>
            {loading === 'email' ? t('working') : isSignUp ? t('createAccount') : t('signIn')}
          </PrimaryButton>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="h-px flex-1 bg-sage-deep/40" />
          <span className="text-[13px] text-ink-muted">{t('or')}</span>
          <span className="h-px flex-1 bg-sage-deep/40" />
        </div>

        <SecondaryButton onClick={() => oauth('google')} disabled={!!loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {loading === 'google' ? t('working') : t('google')}
        </SecondaryButton>

        <Pressable
          onClick={() => oauth('apple')}
          disabled={!!loading}
          className="mt-3 h-14 w-full rounded-full bg-black text-white font-semibold text-[16px] flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.17-1.54 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5ZM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.49 2.56-1.23Z"
            />
          </svg>
          {loading === 'apple' ? t('working') : t('apple')}
        </Pressable>

        <p className="text-center text-[12.5px] leading-relaxed text-ink-muted mt-4" data-testid="legal-note">
          {t('legalAgreePrefix')}{' '}
          <a href={legalUrl('terms')} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-ink">
            {t('termsLink')}
          </a>{' '}
          {t('legalAnd')}{' '}
          <a href={legalUrl('privacy')} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-ink">
            {t('privacyLink')}
          </a>
          .
        </p>

        <p className="text-center text-[15px] text-ink-muted mt-7">
          {isSignUp ? t('haveAccount') : t('newHere')}{' '}
          <Pressable
            haptics={false}
            onClick={() => {
              setMode(isSignUp ? 'signin' : 'signup');
              setError(null);
              setRedirectError(false);
            }}
            className="font-semibold text-coral inline"
          >
            {isSignUp ? t('signIn') : t('createAccount')}
          </Pressable>
        </p>
      </div>
    </div>
  );
};

export default Auth;
