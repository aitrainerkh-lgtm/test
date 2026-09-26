import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryBySlug, fieldsFor } from '../src/data/categories';
import { SAMPLE_LISTINGS } from '../src/data/listings';
import { PROVINCES, provinceBySlug } from '../src/data/locations';
import { SELLERS } from '../src/data/users';
import { formatPhone, formatPrice, isValidPhone, maskPhone, telHref } from '../src/lib/format';
import { EMPTY_SEARCH, filterListings, paginate, parseSearch, similarListings, toQuery } from '../src/lib/search';
import type { SearchParams } from '../src/types';

const search = (patch: Partial<SearchParams>) => filterListings(SAMPLE_LISTINGS, { ...EMPTY_SEARCH, ...patch });

describe('sample data', () => {
  it('has exactly 50 unique listings', () => {
    expect(SAMPLE_LISTINGS).toHaveLength(50);
    expect(new Set(SAMPLE_LISTINGS.map((l) => l.id)).size).toBe(50);
    expect(new Set(SAMPLE_LISTINGS.map((l) => l.ref)).size).toBe(50);
    expect(new Set(SAMPLE_LISTINGS.map((l) => l.title.toLowerCase())).size).toBe(50);
    expect(SAMPLE_LISTINGS.every((l) => l.isSample)).toBe(true);
  });

  it('covers every category', () => {
    for (const c of CATEGORIES) expect(SAMPLE_LISTINGS.some((l) => l.category === c.slug)).toBe(true);
  });

  it('uses valid categories, locations, sellers and spec options', () => {
    for (const l of SAMPLE_LISTINGS) {
      const cat = categoryBySlug(l.category);
      expect(cat, l.id).toBeDefined();
      expect(cat!.subcategories.some((s) => s.slug === l.subcategory), l.id).toBe(true);
      expect(provinceBySlug(l.province)?.districts, l.id).toContain(l.district);
      const seller = SELLERS.find((s) => s.id === l.sellerId);
      expect(seller, l.id).toBeDefined();
      expect(l.phone).toBe(seller!.phone);
      expect(isValidPhone(l.phone), l.id).toBe(true);
      const fields = fieldsFor(l.category, l.subcategory);
      for (const [k, v] of Object.entries(l.specs)) {
        const f = fields.find((x) => x.key === k);
        expect(f, `${l.id}.${k}`).toBeDefined();
        if (f!.type === 'select') expect(f!.options, `${l.id}.${k}`).toContain(v);
      }
      if (!cat!.hasCondition) expect(l.condition, l.id).toBeUndefined();
      if (cat!.hasDealType) expect(l.dealType, l.id).toBeDefined();
      if (l.discount) expect(l.price).toBe(Math.round(l.discount.oldPrice * (1 - l.discount.percent / 100)));
      expect(l.images.length).toBeGreaterThan(0);
    }
  });

  it('has 25 provinces', () => {
    expect(PROVINCES).toHaveLength(25);
  });
});

describe('search and filters', () => {
  it('returns all active listings with no filters, newest first', () => {
    const all = search({});
    expect(all).toHaveLength(50);
    for (let i = 1; i < all.length; i++) {
      expect(new Date(all[i - 1].postedAt).getTime()).toBeGreaterThanOrEqual(new Date(all[i].postedAt).getTime());
    }
  });

  it('matches keywords across title, specs and category names (case-insensitive)', () => {
    expect(search({ q: 'iphone' }).length).toBeGreaterThan(0);
    expect(search({ q: 'TOYOTA' }).every((l) => /toyota/i.test(l.title + JSON.stringify(l.specs) + l.description))).toBe(true);
    expect(search({ q: 'phnom penh' }).every((l) => l.province === 'phnom-penh' || /phnom penh/i.test(l.title + l.description))).toBe(true);
    expect(search({ q: 'zzzz-no-match' })).toHaveLength(0);
  });

  it('filters by category, subcategory, province and district', () => {
    expect(search({ category: 'jobs' }).every((l) => l.category === 'jobs')).toBe(true);
    expect(search({ category: 'cars-vehicles', subcategory: 'cars' }).every((l) => l.subcategory === 'cars')).toBe(true);
    const pp = search({ province: 'phnom-penh' });
    expect(pp.length).toBeGreaterThan(0);
    expect(pp.every((l) => l.province === 'phnom-penh')).toBe(true);
    const d = pp[0].district;
    expect(search({ province: 'phnom-penh', district: d }).every((l) => l.district === d)).toBe(true);
  });

  it('filters by price range, condition, sale/rent and date', () => {
    const r = search({ min: '100', max: '1000' });
    expect(r.every((l) => l.price !== null && l.price >= 100 && l.price <= 1000)).toBe(true);
    expect(search({ condition: 'new' }).every((l) => l.condition === 'new')).toBe(true);
    expect(search({ dealType: 'rent' }).every((l) => l.dealType === 'rent')).toBe(true);
    const week = search({ date: '7' });
    expect(week.length).toBeGreaterThan(0);
    expect(week.length).toBeLessThan(50);
  });

  it('filters by category spec fields', () => {
    const auto = search({ category: 'cars-vehicles', specs: { transmission: 'Automatic' } });
    expect(auto.every((l) => l.specs.transmission === 'Automatic')).toBe(true);
  });

  it('sorts by price', () => {
    const asc = search({ sort: 'price_asc' }).filter((l) => l.price !== null);
    for (let i = 1; i < asc.length; i++) expect(asc[i].price!).toBeGreaterThanOrEqual(asc[i - 1].price!);
    const desc = search({ sort: 'price_desc' }).filter((l) => l.price !== null);
    for (let i = 1; i < desc.length; i++) expect(desc[i].price!).toBeLessThanOrEqual(desc[i - 1].price!);
  });

  it('round-trips search state through the URL', () => {
    const p: SearchParams = { ...EMPTY_SEARCH, q: 'honda', category: 'cars-vehicles', province: 'kandal', min: '500', condition: 'used', dealType: 'sale', date: '30', sort: 'price_asc', specs: { fuel: 'Petrol' }, page: 2 };
    expect(parseSearch(new URLSearchParams(toQuery(p)))).toEqual(p);
  });

  it('paginates and finds similar listings', () => {
    const { items, pages } = paginate(search({}), 1);
    expect(items).toHaveLength(20);
    expect(pages).toBe(3);
    const target = SAMPLE_LISTINGS[0];
    const sim = similarListings(SAMPLE_LISTINGS, target);
    expect(sim.every((l) => l.category === target.category && l.id !== target.id)).toBe(true);
  });
});

describe('formatting', () => {
  it('formats Cambodian phone numbers', () => {
    expect(formatPhone('012345678')).toBe('012 345 678');
    expect(formatPhone('+855 12 345 678')).toBe('012 345 678');
    expect(formatPhone('0971234567')).toBe('097 123 4567');
    expect(isValidPhone('012 345 678')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(telHref('012 345 678')).toBe('tel:+85512345678');
    expect(maskPhone('012 345 678')).toBe('012 xxx xxx');
  });

  it('formats USD prices with units and ranges', () => {
    expect(formatPrice({ price: 12500, priceUnit: 'total' })).toBe('$12,500');
    expect(formatPrice({ price: 450, priceMax: 600, priceUnit: 'month' })).toBe('$450 - $600 /month');
    expect(formatPrice({ price: null, priceUnit: 'total' })).toBeNull();
  });
});
