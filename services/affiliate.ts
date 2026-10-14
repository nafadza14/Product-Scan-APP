import { AppLanguage } from '../types';

/**
 * Shop links for recommendations. Scores are never influenced by these links.
 * Env:
 *   VITE_AMAZON_TAG      Amazon Associates tracking id (global)
 *   VITE_SHOPEE_AFF_ID   Shopee affiliate id (Indonesia), appended as af_id when set
 * Without ids the links still work as plain search links.
 */
export const shopUrl = (query: string, lang: AppLanguage): string => {
  const q = encodeURIComponent(query.trim());
  if (lang === AppLanguage.ID) {
    const aff = import.meta.env.VITE_SHOPEE_AFF_ID;
    return `https://shopee.co.id/search?keyword=${q}${aff ? `&af_id=${encodeURIComponent(aff)}` : ''}`;
  }
  const tag = import.meta.env.VITE_AMAZON_TAG;
  return `https://www.amazon.com/s?k=${q}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`;
};
