import type { Lang, Listing, PriceUnit } from '../types';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export function formatUSD(value: number): string {
  return Number.isInteger(value) ? usd.format(value) : usdCents.format(value);
}

const UNIT_LABEL: Record<PriceUnit, { en: string; km: string }> = {
  total: { en: '', km: '' },
  month: { en: '/month', km: '/ខែ' },
  day: { en: '/day', km: '/ថ្ងៃ' },
  hour: { en: '/hour', km: '/ម៉ោង' },
  item: { en: '/unit', km: '/គ្រឿង' },
  kg: { en: '/kg', km: '/គីឡូ' },
};

/** "$1,200", "$450 - $600 /month", or null when no price is set. */
export function formatPrice(listing: Pick<Listing, 'price' | 'priceMax' | 'priceUnit'>, lang: Lang = 'en'): string | null {
  if (listing.price === null || listing.price === undefined) return null;
  const base = listing.priceMax && listing.priceMax > listing.price
    ? `${formatUSD(listing.price)} - ${formatUSD(listing.priceMax)}`
    : formatUSD(listing.price);
  const unit = UNIT_LABEL[listing.priceUnit][lang];
  return unit ? `${base} ${unit}` : base;
}

/**
 * Cambodian phone formatting: 012 345 678 / 010 234 5678 / 023 123 456.
 * Accepts +855 or 855 prefixes and strips spaces and dashes.
 */
export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('855')) digits = '0' + digits.slice(3);
  if (!digits.startsWith('0') && digits.length >= 8) digits = '0' + digits;
  if (digits.length === 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return raw.trim();
}

/** Valid Cambodian mobile or landline number (9–10 digits starting with 0). */
export function isValidPhone(raw: string): boolean {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('855')) digits = '0' + digits.slice(3);
  return /^0[1-9]\d{7,8}$/.test(digits);
}

/** tel: link in international format. */
export function telHref(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0/, '');
  return `tel:+855${digits}`;
}

/** Hide the last digits until the buyer asks to see the number. */
export function maskPhone(raw: string): string {
  const f = formatPhone(raw);
  return f.slice(0, 4) + f.slice(4).replace(/\d/g, 'x');
}

export function timeAgo(iso: string, lang: Lang = 'en', now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const km = lang === 'km';
  if (min < 1) return km ? 'ឥឡូវនេះ' : 'Just now';
  if (min < 60) return km ? `${min} នាទីមុន` : `${min} min ago`;
  if (hr < 24) return km ? `${hr} ម៉ោងមុន` : `${hr} hour${hr > 1 ? 's' : ''} ago`;
  if (day < 30) return km ? `${day} ថ្ងៃមុន` : `${day} day${day > 1 ? 's' : ''} ago`;
  return formatDate(iso, lang);
}

export function formatDate(iso: string, lang: Lang = 'en'): string {
  return new Date(iso).toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatNumber(n: number | string): string {
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v) ? v.toLocaleString('en-US') : String(n);
}
