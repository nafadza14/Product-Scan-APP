import type { Entitlement } from '../types';

/**
 * Subscriptions.
 * - In the native app (Capacitor) purchases go through RevenueCat, which wraps App Store and Google Play billing.
 * - On the web there is no checkout yet: "Start free trial" runs in test mode, unlocks Premium on this device
 *   and charges nothing. This lets us measure paywall views and trial starts before real billing is switched on.
 *
 * Env:
 *   VITE_PAYWALL_MODE      soft (default, can be dismissed) or hard (must start a trial to continue)
 *   VITE_REVENUECAT_IOS_KEY / VITE_REVENUECAT_ANDROID_KEY   public SDK keys from RevenueCat
 */

export type PlanId = 'annual' | 'monthly';

export const TRIAL_DAYS = 7;
export const PAYWALL_MODE: 'soft' | 'hard' = import.meta.env.VITE_PAYWALL_MODE === 'hard' ? 'hard' : 'soft';
export const FREE_SCANS_PER_DAY = 3;

/** Display prices. Real prices come from the store in the native app. */
export const PRICES: Record<'usd' | 'idr', Record<PlanId, { price: string; perMonth: string }>> = {
  usd: { annual: { price: '$39.99', perMonth: '$3.33' }, monthly: { price: '$7.99', perMonth: '$7.99' } },
  idr: { annual: { price: 'Rp199.000', perMonth: 'Rp16.583' }, monthly: { price: 'Rp39.000', perMonth: 'Rp39.000' } }
};

const key = (userId: string) => `vitalSense_entitlement_${userId}`;

const isNative = () => {
  const cap = (window as any).Capacitor;
  return !!cap?.isNativePlatform?.();
};

export const getEntitlement = (userId: string | null): Entitlement => {
  if (!userId) return { active: false, source: 'none' };
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { active: false, source: 'none' };
    return JSON.parse(raw) as Entitlement;
  } catch {
    return { active: false, source: 'none' };
  }
};

const save = (userId: string, e: Entitlement) => {
  try {
    localStorage.setItem(key(userId), JSON.stringify(e));
  } catch { /* storage blocked */ }
};

let rcReady: Promise<any> | null = null;
const revenueCat = () => {
  if (!rcReady) {
    rcReady = (async () => {
      const mod: any = await import(/* @vite-ignore */ '@revenuecat/purchases-capacitor');
      const platform = (window as any).Capacitor.getPlatform();
      const apiKey = platform === 'ios' ? import.meta.env.VITE_REVENUECAT_IOS_KEY : import.meta.env.VITE_REVENUECAT_ANDROID_KEY;
      if (!apiKey) throw new Error('RevenueCat key missing');
      await mod.Purchases.configure({ apiKey });
      return mod.Purchases;
    })();
  }
  return rcReady;
};

/** Refreshes the entitlement from the store in the native app. No-op on the web. */
export const syncEntitlement = async (userId: string): Promise<Entitlement> => {
  if (!isNative()) return getEntitlement(userId);
  try {
    const Purchases = await revenueCat();
    await Purchases.logIn({ appUserID: userId });
    const { customerInfo } = await Purchases.getCustomerInfo();
    const active = !!customerInfo?.entitlements?.active?.premium;
    const e: Entitlement = { active, source: active ? 'store' : 'none' };
    save(userId, e);
    return e;
  } catch {
    return getEntitlement(userId);
  }
};

export const startTrial = async (userId: string, plan: PlanId): Promise<Entitlement> => {
  if (isNative()) {
    const Purchases = await revenueCat();
    const offerings = await Purchases.getOfferings();
    const pkg = plan === 'annual' ? offerings?.current?.annual : offerings?.current?.monthly;
    if (!pkg) throw new Error('No package');
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const e: Entitlement = { active: !!customerInfo?.entitlements?.active?.premium, plan, source: 'store' };
    save(userId, e);
    return e;
  }
  const e: Entitlement = { active: true, plan, trialEndsAt: Date.now() + TRIAL_DAYS * 86400000, source: 'test' };
  save(userId, e);
  return e;
};

export const restorePurchases = async (userId: string): Promise<Entitlement> => {
  if (!isNative()) return getEntitlement(userId);
  const Purchases = await revenueCat();
  const { customerInfo } = await Purchases.restorePurchases();
  const e: Entitlement = { active: !!customerInfo?.entitlements?.active?.premium, source: 'store' };
  save(userId, e);
  return e;
};

/** Cancels a test-mode trial (web only), so the paywall can be tested again. */
export const endTestTrial = (userId: string) => save(userId, { active: false, source: 'none' });

// ---------- Daily free scan allowance ----------

const scanKey = (userId: string) => `vitalSense_scans_${userId}_${new Date().toISOString().slice(0, 10)}`;
export const scansToday = (userId: string) => {
  try {
    return Number(localStorage.getItem(scanKey(userId)) || 0);
  } catch {
    return 0;
  }
};
export const countScan = (userId: string) => {
  try {
    localStorage.setItem(scanKey(userId), String(scansToday(userId) + 1));
  } catch { /* storage blocked */ }
};
