import type { AvoidKey } from '../types';

export interface AvoidItem {
  key: AvoidKey;
  group: 'food' | 'skin';
  /** Plain-English description sent to the model. */
  label: string;
  /** Lower-case fragments matched against the ingredient list (EN and ID label terms). */
  terms: string[];
}

export const AVOID_ITEMS: AvoidItem[] = [
  { key: 'addedSugar', group: 'food', label: 'added sugar or syrups', terms: ['sugar', 'gula', 'sucrose', 'sukrosa', 'glucose syrup', 'sirup glukosa', 'corn syrup', 'fructose', 'fruktosa', 'dextrose', 'dekstrosa', 'maltodextrin'] },
  { key: 'dairy', group: 'food', label: 'dairy (milk, whey, casein, lactose)', terms: ['milk', 'susu', 'whey', 'casein', 'kasein', 'lactose', 'laktosa', 'butterfat', 'ghee', 'cheese', 'keju', 'milk solids'] },
  { key: 'gluten', group: 'food', label: 'gluten (wheat, barley, rye, malt)', terms: ['wheat', 'gandum', 'terigu', 'barley', 'jelai', 'rye', 'malt extract', 'barley malt', 'ekstrak malt', 'gluten'] },
  { key: 'palmOil', group: 'food', label: 'palm oil', terms: ['palm oil', 'palm olein', 'palm kernel', 'minyak sawit', 'kelapa sawit', 'sawit'] },
  { key: 'sweeteners', group: 'food', label: 'artificial sweeteners', terms: ['aspartame', 'aspartam', 'sucralose', 'sukralosa', 'acesulfame', 'asesulfam', 'saccharin', 'sakarin', 'cyclamate', 'siklamat'] },
  { key: 'caffeine', group: 'food', label: 'caffeine', terms: ['caffeine', 'kafein', 'coffee', 'kopi', 'guarana'] },
  { key: 'fragrance', group: 'skin', label: 'fragrance or parfum', terms: ['fragrance', 'parfum', 'perfume', 'pewangi'] },
  { key: 'alcohol', group: 'skin', label: 'drying alcohols (alcohol denat, ethanol)', terms: ['alcohol denat', 'denatured alcohol', 'sd alcohol', 'ethanol', 'isopropyl alcohol'] },
  { key: 'essentialOils', group: 'skin', label: 'essential oils and their allergens', terms: ['essential oil', 'limonene', 'linalool', 'citral', 'eugenol', 'geraniol', 'citronellol'] },
  { key: 'parabens', group: 'skin', label: 'parabens', terms: ['paraben'] },
  { key: 'sulfates', group: 'skin', label: 'sulfates (SLS, SLES)', terms: ['sulfate', 'sulphate', 'sulfat'] },
  { key: 'silicones', group: 'skin', label: 'silicones', terms: ['dimethicone', 'cyclopentasiloxane', 'cyclohexasiloxane', 'siloxane', 'silicone'] },
  { key: 'retinoids', group: 'skin', label: 'retinoids (avoid in pregnancy)', terms: ['retinol', 'retinal', 'retinyl', 'tretinoin', 'adapalene'] },
  { key: 'comedogenic', group: 'skin', label: 'pore-clogging oils and esters', terms: ['coconut oil', 'cocos nucifera', 'isopropyl myristate', 'isopropyl palmitate', 'cocoa butter', 'theobroma cacao', 'lanolin'] }
];

const byKey = new Map(AVOID_ITEMS.map((i) => [i.key, i]));
export const isAvoidKey = (k: unknown): k is AvoidKey => typeof k === 'string' && byKey.has(k as AvoidKey);
export const avoidLabel = (k: AvoidKey) => byKey.get(k)?.label || k;

/** Finds avoid-list items in an ingredient list by keyword. A safety net next to the model's own check. */
export const detectAvoid = (ingredients: string, keys: AvoidKey[], category: 'Food' | 'Cosmetic' | 'Other'): AvoidKey[] => {
  const text = ` ${ingredients.toLowerCase()} `;
  if (!text.trim()) return [];
  return keys.filter((k) => {
    const item = byKey.get(k);
    if (!item) return false;
    if (category === 'Food' && item.group === 'skin') return false;
    if (category === 'Cosmetic' && item.group === 'food' && k !== 'caffeine') return false;
    return item.terms.some((term) => {
      // "sugar" must not match "sugar-free"; "gula" must not match "tanpa gula".
      const i = text.indexOf(term);
      if (i < 0) return false;
      const after = text.slice(i + term.length, i + term.length + 6);
      const before = text.slice(Math.max(0, i - 6), i);
      return !/^[- ]?free/.test(after) && !/tanpa $/.test(before);
    });
  });
};
