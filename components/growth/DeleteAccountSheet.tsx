import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Translator } from '../../i18n';
import { Pressable, SecondaryButton } from '../ui';

interface Props {
  t: Translator;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

/** Confirmation for permanent account deletion. The person types a word so it is never accidental. */
const DeleteAccountSheet: React.FC<Props> = ({ t, onDelete, onCancel }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const ok = text.trim().toUpperCase() === t('deleteWord');

  const run = async () => {
    setBusy(true);
    setError(false);
    try {
      await onDelete();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div className="px-5 pt-9 pb-safe" data-testid="delete-account">
      <span className="w-12 h-12 rounded-2xl bg-avoid/10 text-avoid flex items-center justify-center mb-4">
        <AlertTriangle size={22} />
      </span>
      <h2 className="text-[22px] font-semibold text-ink">{t('deleteTitle')}</h2>
      <p className="text-[15px] text-ink-muted mt-1.5 mb-5 leading-relaxed">{t('deleteBody')}</p>
      <label className="block text-[13px] font-semibold text-ink-muted mb-2" htmlFor="delete-confirm">
        {t('deleteTypeHint')}
      </label>
      <input
        id="delete-confirm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoCapitalize="characters"
        autoComplete="off"
        className="w-full h-14 rounded-2xl bg-mist px-4 text-[16px] font-semibold tracking-[0.08em] text-ink outline-none focus:ring-2 focus:ring-avoid/40"
      />
      {error && (
        <p className="text-[13.5px] text-avoid mt-3" role="alert">
          {t('deleteError')}
        </p>
      )}
      <div className="mt-5 space-y-2.5 pb-2">
        <Pressable
          onClick={run}
          disabled={!ok || busy}
          className="h-14 w-full rounded-full bg-avoid text-white font-semibold text-[16px] flex items-center justify-center"
        >
          {busy ? t('deleting') : t('deleteConfirm')}
        </Pressable>
        <SecondaryButton onClick={onCancel} disabled={busy}>
          {t('cancel')}
        </SecondaryButton>
      </div>
    </div>
  );
};

export default DeleteAccountSheet;
