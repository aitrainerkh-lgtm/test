# PsarOnline — Cambodian classified marketplace (demo)

A working classified-ads website for Cambodia: browse by category and province, search with filters, view listings, save favorites, register/login, and post, edit or delete ads through a 10-step workflow. Interface in English and Khmer. Prices in USD.

"PsarOnline" is **temporary branding**. Change it in `src/config/brand.ts` (name, tagline, contacts) and the logo in `src/components/Logo.tsx`.

## Run it

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # production build in dist/ (static files, works on any host)
npm test           # unit tests: data, search, filters, formatting
npm run test:e2e   # browser test of the whole site (needs a build + Chromium)
```

For the browser test, set `CHROMIUM_PATH` to a Chromium/Chrome binary if Playwright's browser is not installed. Screenshots go to `test-results/`.

Demo login: `demo@example.com` / `demo1234` (owns 3 sample ads).

## Project structure

```
src/
  config/brand.ts        Branding (replace to rebrand)
  data/
    categories.ts        12 categories, subcategories and per-category spec fields
    locations.ts         25 provinces with districts
    listings.ts          50 SAMPLE listings (fictional)
    users.ts             SAMPLE sellers + demo account
  lib/
    search.ts            Search, filter, sort, pagination, URL <-> filter state
    format.ts            USD prices, Cambodian phone numbers, dates
    i18n.ts              English / Khmer interface strings
    specs.ts             Spec display helpers
    images.ts            Generated placeholder photos for sample ads
    photos.ts            Photo upload resize
    storage.ts           localStorage wrapper, password hashing
  context/AppContext.tsx App state: language, auth, listings, favorites
  components/            Reusable UI (Header, SearchBar, ListingCard, FilterPanel, Gallery, Modal…)
  pages/                 Home, Search (also category/location pages), Listing, Seller,
                         Login, Register, Post/Edit wizard, Account dashboard
  styles/global.css      Mobile-first styles
tests/
  unit.test.ts           Vitest unit tests
  e2e.mjs                Playwright browser test (all 50 listings, links, mobile)
```

## Pages (hash routes)

| Route | Page |
|---|---|
| `#/` | Home: search, categories, top ads, promo, latest ads, locations |
| `#/search?q=…` | Search results with filters |
| `#/c/:category/:sub?` | Category / subcategory browsing |
| `#/l/:province` | Location browsing |
| `#/categories`, `#/locations` | Full category and province directories |
| `#/listing/:id` | Listing detail |
| `#/seller/:id` | Seller profile |
| `#/login`, `#/register` | Account access |
| `#/post`, `#/edit/:id` | Post / edit ad (login required) |
| `#/account`, `/listings`, `/saved`, `/settings` | User dashboard (login required) |

## Adding categories and fields

Each category in `src/data/categories.ts` lists its spec fields. A field marked `filterable` becomes a search filter; `onCard` shows it on listing cards. The post workflow builds its form from the same definitions, so a new field appears everywhere automatically.

## Data and backend

- All 50 listings, sellers and phone numbers are **fictional sample data**. They were not copied from Khmer24 or any other website. Sample photos are generated placeholders marked "SAMPLE PHOTO".
- There is no server. Accounts, new ads, favorites, messages and reports are saved in the browser (localStorage). To go live, replace the functions in `src/context/AppContext.tsx` with API calls; the pages do not need to change.
- Passwords are hashed in the browser for the demo only. A real site needs server-side authentication.
