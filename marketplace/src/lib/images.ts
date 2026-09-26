// Sample listings use generated placeholder photos ("sample:<caption>").
// Uploaded photos are stored as data: URLs and returned unchanged.
import { ICONS } from '../components/icons';
import { categoryBySlug, subcategoryBySlug } from '../data/categories';
import type { Listing } from '../types';

const cache = new Map<string, string>();

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

function sampleImage(listing: Pick<Listing, 'category' | 'subcategory'>, caption: string, index: number): string {
  const cat = categoryBySlug(listing.category);
  const sub = subcategoryBySlug(listing.category, listing.subcategory);
  const base = cat?.color ?? '#0a5c8c';
  const light = shade(base, 0.82 - (index % 3) * 0.08);
  const mid = shade(base, 0.55);
  const icon = ICONS[cat?.icon ?? 'image'];
  const label = escapeXml(sub?.name.en ?? cat?.name.en ?? '');
  const cap = escapeXml(caption);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#g)"/>
<circle cx="${620 - index * 60}" cy="${140 + index * 40}" r="180" fill="#fff" opacity=".18"/>
<g transform="translate(290 170) scale(9)" fill="none" stroke="${shade(base, -0.25)}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
<text x="400" y="500" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="600" fill="${shade(base, -0.45)}" text-anchor="middle">${cap}</text>
<text x="400" y="542" font-family="Inter,Arial,sans-serif" font-size="22" fill="${shade(base, -0.3)}" text-anchor="middle">${label}</text>
<rect x="24" y="24" width="150" height="34" rx="17" fill="#fff" opacity=".8"/>
<text x="99" y="47" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="600" fill="#495057" text-anchor="middle">SAMPLE PHOTO</text>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** URL for the image at `index` of a listing. */
export function listingImage(listing: Pick<Listing, 'id' | 'category' | 'subcategory' | 'images'>, index = 0): string {
  const token = listing.images[index] ?? listing.images[0];
  if (!token || token.startsWith('sample:')) {
    const caption = token ? token.slice(7) : 'No photo';
    const key = `${listing.category}|${listing.subcategory}|${caption}|${index}`;
    if (!cache.has(key)) cache.set(key, sampleImage(listing, caption, index));
    return cache.get(key)!;
  }
  return token;
}

/** Caption for sample images, used as alt text. */
export function imageCaption(token: string | undefined): string {
  return token?.startsWith('sample:') ? token.slice(7) : 'Photo';
}
