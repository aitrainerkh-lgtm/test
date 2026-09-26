// Shared domain types for the marketplace.

export type Lang = 'en' | 'km';

/** Text available in both interface languages. */
export interface Bilingual {
  en: string;
  km: string;
}

export type Condition = 'new' | 'used';
export type DealType = 'sale' | 'rent';
export type PriceUnit = 'total' | 'month' | 'day' | 'hour' | 'item' | 'kg';

/** One field in a category's specification form. */
export interface SpecField {
  key: string;
  label: Bilingual;
  type: 'text' | 'number' | 'select';
  options?: string[];
  unit?: string;
  required?: boolean;
  /** Show as a filter on search results when this category is selected. */
  filterable?: boolean;
  /** Show on listing cards as a key spec. */
  onCard?: boolean;
}

export interface Subcategory {
  slug: string;
  name: Bilingual;
  /** Extra fields that only apply to this subcategory. */
  fields?: SpecField[];
}

export interface Category {
  slug: string;
  name: Bilingual;
  icon: string; // key into the icon set in components/Icon.tsx
  color: string;
  subcategories: Subcategory[];
  fields: SpecField[];
  /** Whether listings in this category have a New/Used condition. */
  hasCondition: boolean;
  /** Whether listings can be for sale or for rent. */
  hasDealType: boolean;
  /** Default unit for price when not "total". */
  defaultPriceUnit?: PriceUnit;
  /** Label used for the price field in this category. */
  priceLabel?: Bilingual;
}

export interface Province {
  slug: string;
  name: Bilingual;
  districts: string[];
}

export interface Seller {
  id: string;
  name: string;
  type: 'individual' | 'business';
  phone: string;
  phone2?: string;
  email?: string;
  telegram?: string;
  province: string; // province slug
  district?: string;
  joinedAt: string; // ISO date
  verified: boolean;
  status: 'active' | 'suspended';
  bio?: string;
  avatarColor: string;
}

export interface Listing {
  id: string;
  /** Short public reference shown as "Ad ID". */
  ref: string;
  title: string;
  category: string; // category slug
  subcategory: string; // subcategory slug
  price: number | null; // USD; null = contact for price
  priceMax?: number; // for salary ranges
  priceUnit: PriceUnit;
  negotiable: boolean;
  condition?: Condition;
  dealType?: DealType;
  description: string;
  province: string; // province slug
  district: string;
  address?: string;
  sellerId: string;
  phone: string;
  postedAt: string; // ISO date-time
  images: string[]; // "sample:<seed>" tokens or data: URLs from uploads
  specs: Record<string, string>;
  sku?: string;
  delivery?: string;
  discount?: { percent: number; oldPrice: number; note?: string };
  featured?: boolean;
  views: number;
  status: 'active' | 'sold' | 'hidden';
  /** True for built-in demonstration data. */
  isSample?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  province: string;
  district?: string;
  telegram?: string;
  bio?: string;
  joinedAt: string;
  /** Links this account to a seller profile. */
  sellerId: string;
}

export type SortKey = 'newest' | 'oldest' | 'price_asc' | 'price_desc';
export type DateRange = '' | '1' | '7' | '30';

export interface SearchParams {
  q: string;
  category: string;
  subcategory: string;
  province: string;
  district: string;
  min: string;
  max: string;
  condition: '' | Condition;
  dealType: '' | DealType;
  date: DateRange;
  sort: SortKey;
  specs: Record<string, string>;
  page: number;
}
