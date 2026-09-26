// Pure search, filter and sort logic. No React here so it is easy to test.
import { categoryBySlug, subcategoryBySlug } from '../data/categories';
import { provinceBySlug } from '../data/locations';
import type { DateRange, Listing, SearchParams, SortKey } from '../types';

export const PAGE_SIZE = 20;

export const EMPTY_SEARCH: SearchParams = {
  q: '', category: '', subcategory: '', province: '', district: '',
  min: '', max: '', condition: '', dealType: '', date: '', sort: 'newest',
  specs: {}, page: 1,
};

const SORTS: SortKey[] = ['newest', 'oldest', 'price_asc', 'price_desc'];
const DATES: DateRange[] = ['', '1', '7', '30'];

/** Read search state from URL query parameters (spec filters use the "s." prefix). */
export function parseSearch(qs: URLSearchParams, defaults: Partial<SearchParams> = {}): SearchParams {
  const get = (k: string) => qs.get(k) ?? '';
  const specs: Record<string, string> = {};
  qs.forEach((v, k) => { if (k.startsWith('s.') && v) specs[k.slice(2)] = v; });
  const cond = get('condition');
  const deal = get('deal');
  const sort = get('sort') as SortKey;
  const date = get('date') as DateRange;
  return {
    ...EMPTY_SEARCH,
    ...defaults,
    q: get('q'),
    ...(get('category') ? { category: get('category') } : {}),
    ...(get('sub') ? { subcategory: get('sub') } : {}),
    ...(get('province') ? { province: get('province') } : {}),
    district: get('district'),
    min: get('min'),
    max: get('max'),
    condition: cond === 'new' || cond === 'used' ? cond : '',
    dealType: deal === 'sale' || deal === 'rent' ? deal : '',
    date: DATES.includes(date) ? date : '',
    sort: SORTS.includes(sort) ? sort : 'newest',
    specs,
    page: Math.max(1, parseInt(get('page'), 10) || 1),
  };
}

/** Write search state to query parameters, leaving out empty values. */
export function toQuery(p: SearchParams): string {
  const qs = new URLSearchParams();
  const set = (k: string, v: string) => { if (v) qs.set(k, v); };
  set('q', p.q.trim());
  set('category', p.category);
  set('sub', p.subcategory);
  set('province', p.province);
  set('district', p.district);
  set('min', p.min);
  set('max', p.max);
  set('condition', p.condition);
  set('deal', p.dealType);
  set('date', p.date);
  if (p.sort !== 'newest') qs.set('sort', p.sort);
  Object.entries(p.specs).forEach(([k, v]) => set(`s.${k}`, v));
  if (p.page > 1) qs.set('page', String(p.page));
  return qs.toString();
}

/** Text a keyword search matches against, in English and Khmer. */
function searchableText(l: Listing): string {
  const cat = categoryBySlug(l.category);
  const sub = subcategoryBySlug(l.category, l.subcategory);
  const prov = provinceBySlug(l.province);
  return [
    l.title, l.description, l.ref, l.sku ?? '', l.district,
    cat?.name.en, cat?.name.km, sub?.name.en, sub?.name.km, prov?.name.en, prov?.name.km,
    ...Object.values(l.specs),
  ].join(' ').toLowerCase();
}

export function matchesKeyword(l: Listing, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = searchableText(l);
  return terms.every((t) => text.includes(t));
}

export function filterListings(all: Listing[], p: SearchParams, now = Date.now()): Listing[] {
  const min = p.min === '' ? null : Number(p.min);
  const max = p.max === '' ? null : Number(p.max);
  const maxAgeMs = p.date ? Number(p.date) * 24 * 3600_000 : null;

  const out = all.filter((l) => {
    if (l.status !== 'active') return false;
    if (p.category && l.category !== p.category) return false;
    if (p.subcategory && l.subcategory !== p.subcategory) return false;
    if (p.province && l.province !== p.province) return false;
    if (p.district && l.district !== p.district) return false;
    if (p.condition && l.condition !== p.condition) return false;
    if (p.dealType && l.dealType !== p.dealType) return false;
    if (min !== null && !Number.isNaN(min) && (l.price === null || l.price < min)) return false;
    if (max !== null && !Number.isNaN(max) && (l.price === null || l.price > max)) return false;
    if (maxAgeMs !== null && now - new Date(l.postedAt).getTime() > maxAgeMs) return false;
    for (const [k, v] of Object.entries(p.specs)) {
      if (v && (l.specs[k] ?? '') !== v) return false;
    }
    return matchesKeyword(l, p.q);
  });

  return sortListings(out, p.sort);
}

export function sortListings(list: Listing[], sort: SortKey): Listing[] {
  const byDate = (a: Listing, b: Listing) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
  // Listings without a price go last for price sorts.
  const priceOf = (l: Listing, fallback: number) => (l.price === null ? fallback : l.price);
  const sorted = [...list];
  switch (sort) {
    case 'oldest': return sorted.sort((a, b) => -byDate(a, b));
    case 'price_asc': return sorted.sort((a, b) => priceOf(a, Infinity) - priceOf(b, Infinity) || byDate(a, b));
    case 'price_desc': return sorted.sort((a, b) => priceOf(b, -Infinity) - priceOf(a, -Infinity) || byDate(a, b));
    default: return sorted.sort(byDate);
  }
}

export function paginate<T>(list: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: list.slice((current - 1) * size, current * size), pages, current };
}

/** Listings in the same subcategory first, then the same category. */
export function similarListings(all: Listing[], target: Listing, limit = 4): Listing[] {
  const score = (l: Listing) =>
    (l.subcategory === target.subcategory ? 2 : 0) + (l.province === target.province ? 1 : 0);
  return all
    .filter((l) => l.id !== target.id && l.status === 'active' && l.category === target.category)
    .sort((a, b) => score(b) - score(a) || new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, limit);
}

/** Number of active listings per key, e.g. per category or province. */
export function countBy(all: Listing[], key: 'category' | 'province' | 'subcategory'): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of all) if (l.status === 'active') counts[l[key]] = (counts[l[key]] ?? 0) + 1;
  return counts;
}
