import { fieldsFor } from '../data/categories';
import type { Lang, Listing, SpecField } from '../types';
import { formatNumber } from './format';

export function formatSpec(field: SpecField, value: string): string {
  if (!value) return '';
  if (field.type === 'number' && field.key !== 'year') {
    const n = formatNumber(value);
    return field.unit ? `${n} ${field.unit}` : n;
  }
  return value;
}

/** All filled-in specifications of a listing with labels. */
export function specEntries(listing: Listing, lang: Lang) {
  return fieldsFor(listing.category, listing.subcategory)
    .filter((f) => listing.specs[f.key])
    .map((f) => ({ key: f.key, label: f.label[lang], value: formatSpec(f, listing.specs[f.key]) }));
}

/** Up to three short specs shown on listing cards. */
export function cardSpecs(listing: Listing, lang: Lang): string[] {
  const fields = fieldsFor(listing.category, listing.subcategory).filter((f) => f.onCard && listing.specs[f.key]);
  return fields.slice(0, 3).map((f) => {
    const v = formatSpec(f, listing.specs[f.key]);
    // Bare numbers need their label to make sense ("3 Bedrooms").
    return f.type === 'number' && !f.unit && f.key !== 'year' ? `${v} ${f.label[lang]}` : v;
  });
}
