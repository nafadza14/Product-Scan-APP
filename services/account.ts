import { supabase } from './supabaseClient';

/**
 * Permanently deletes the signed-in account (required by the App Store and Google Play).
 * 1. Removes the person's skin photos from private storage (Storage API; SQL cannot delete storage objects).
 * 2. Calls the delete_my_account() database function (supabase/setup.sql), which deletes every row
 *    the person owns and the auth user itself.
 * 3. Clears what this device kept and signs out.
 */
export const deleteAccount = async (userId: string) => {
  const bucket = supabase.storage.from('skin-photos');
  const { data: files } = await bucket.list(userId, { limit: 1000 });
  if (files && files.length) {
    await bucket.remove(files.map((f) => `${userId}/${f.name}`));
  }

  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;

  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('vitalSense_') && k.includes(userId)) localStorage.removeItem(k);
    }
  } catch { /* storage blocked */ }
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase('vitalSense_photos');
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
  await supabase.auth.signOut();
};
