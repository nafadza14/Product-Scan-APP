/** Asks the server whether the AI key is set. Never exposes the key itself. */
export const checkAiConfigured = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/chat', { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.configured;
  } catch {
    return false;
  }
};
