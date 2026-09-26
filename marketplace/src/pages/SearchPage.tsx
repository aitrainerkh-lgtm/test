import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Breadcrumbs, type Crumb } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { FilterPanel } from '../components/FilterPanel';
import { Icon } from '../components/Icon';
import { ListingGrid } from '../components/ListingGrid';
import { Pagination } from '../components/Pagination';
import { useApp } from '../context/AppContext';
import { categoryBySlug, fieldsFor } from '../data/categories';
import { provinceBySlug } from '../data/locations';
import { countBy, EMPTY_SEARCH, filterListings, paginate, parseSearch, toQuery } from '../lib/search';
import type { SearchParams, SortKey } from '../types';
import { NotFoundPage } from './NotFoundPage';

/**
 * Results page for keyword search (/search), category browsing (/c/:cat/:sub)
 * and location browsing (/l/:province). Path segments act as default filters.
 */
export function SearchPage() {
  const { cat: catParam, sub: subParam, province: provParam } = useParams();
  const [qs] = useSearchParams();
  const navigate = useNavigate();
  const { t, p, listings } = useApp();
  const [sheet, setSheet] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const params = useMemo(
    () => parseSearch(qs, { category: catParam ?? '', subcategory: subParam ?? '', province: provParam ?? '' }),
    [qs, catParam, subParam, provParam],
  );
  const results = useMemo(() => filterListings(listings, params), [listings, params]);
  const { items, pages, current } = paginate(results, params.page);

  const cat = categoryBySlug(params.category);
  const sub = cat?.subcategories.find((s) => s.slug === params.subcategory);
  const province = provinceBySlug(params.province);

  if ((catParam && !categoryBySlug(catParam)) || (subParam && !sub) || (provParam && !province)) {
    return <NotFoundPage title="Not found" text="This category or location does not exist." />;
  }

  const update = (patch: Partial<SearchParams>) => {
    navigate(`/search?${toQuery({ ...params, ...patch, page: patch.page ?? 1 })}`);
  };
  const clear = () => navigate(`/search?${toQuery({ ...EMPTY_SEARCH, q: params.q })}`);

  const title = params.q
    ? `“${params.q}”`
    : sub ? p(sub.name) : cat ? p(cat.name) : province ? `${t('ads')} — ${p(province.name)}` : t('search');

  const crumbs: Crumb[] = [{ label: t('home'), to: '/' }];
  if (cat) crumbs.push({ label: p(cat.name), to: `/c/${cat.slug}` });
  if (sub) crumbs.push({ label: p(sub.name), to: `/c/${cat!.slug}/${sub.slug}` });
  if (province) crumbs.push({ label: p(province.name), to: `/l/${province.slug}` });
  if (crumbs.length === 1) crumbs.push({ label: t('search') });

  const subCounts = countBy(filterListings(listings, { ...params, subcategory: '', specs: {} }), 'subcategory');

  // Removable chips for active filters.
  const chips: { label: string; clear: Partial<SearchParams> }[] = [];
  if (params.q) chips.push({ label: `"${params.q}"`, clear: { q: '' } });
  if (cat) chips.push({ label: p(cat.name), clear: { category: '', subcategory: '', specs: {} } });
  if (sub) chips.push({ label: p(sub.name), clear: { subcategory: '' } });
  if (province) chips.push({ label: p(province.name), clear: { province: '', district: '' } });
  if (params.district) chips.push({ label: params.district, clear: { district: '' } });
  if (params.min || params.max) chips.push({ label: `$${params.min || '0'} – ${params.max ? '$' + params.max : '∞'}`, clear: { min: '', max: '' } });
  if (params.condition) chips.push({ label: t(params.condition), clear: { condition: '' } });
  if (params.dealType) chips.push({ label: t(params.dealType === 'sale' ? 'forSale' : 'forRent'), clear: { dealType: '' } });
  if (params.date) chips.push({ label: t(params.date === '1' ? 'last24h' : params.date === '7' ? 'last7d' : 'last30d'), clear: { date: '' } });
  const specLabels = Object.fromEntries(fieldsFor(params.category, params.subcategory).map((f) => [f.key, p(f.label)]));
  Object.entries(params.specs).forEach(([k, v]) => {
    if (v) chips.push({ label: `${specLabels[k] ?? k}: ${v}`, clear: { specs: { ...params.specs, [k]: '' } } });
  });

  return (
    <div className="container page">
      <Breadcrumbs items={crumbs} />
      <div className="results-head">
        <h1>{title}</h1>
        <span className="muted">{results.length} {t('results')}</span>
      </div>

      {cat && (
        <div className="sub-chips" aria-label={t('subcategory')}>
          <Link to={`/c/${cat.slug}`} className={`chip ${!sub ? 'chip-active' : ''}`}>{t('allSubcategories')}</Link>
          {cat.subcategories.map((s) => (
            <Link key={s.slug} to={`/search?${toQuery({ ...params, subcategory: s.slug, specs: {}, page: 1 })}`} className={`chip ${sub?.slug === s.slug ? 'chip-active' : ''}`}>
              {p(s.name)} <span className="muted">({subCounts[s.slug] ?? 0})</span>
            </Link>
          ))}
        </div>
      )}

      <div className="results-layout">
        <aside className={`filter-sidebar ${sheet ? 'open' : ''}`} aria-label={t('filters')}>
          <div className="sheet-head only-mobile">
            <h2>{t('filters')}</h2>
            <button className="icon-btn" onClick={() => setSheet(false)} aria-label="Close filters"><Icon name="x" size={24} /></button>
          </div>
          <FilterPanel params={params} onChange={update} onClear={clear} />
          <div className="sheet-foot only-mobile">
            <button className="btn btn-primary btn-block" onClick={() => setSheet(false)}>{t('applyFilters')} ({results.length})</button>
          </div>
        </aside>
        {sheet && <div className="drawer-backdrop only-mobile" onClick={() => setSheet(false)} />}

        <section className="results-main">
          <div className="results-toolbar">
            <button className="btn btn-outline only-mobile" onClick={() => setSheet(true)}>
              <Icon name="filter" size={16} /> {t('filters')}{chips.length ? ` (${chips.length})` : ''}
            </button>
            <label className="sort">
              <span className="only-desktop">{t('sortBy')}</span>
              <select value={params.sort} onChange={(e) => update({ sort: e.target.value as SortKey })} aria-label={t('sortBy')}>
                <option value="newest">{t('newest')}</option>
                <option value="oldest">{t('oldest')}</option>
                <option value="price_asc">{t('priceLow')}</option>
                <option value="price_desc">{t('priceHigh')}</option>
              </select>
            </label>
            <div className="layout-toggle" role="group" aria-label="Layout">
              <button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')} aria-label="Grid view"><Icon name="grid" size={18} /></button>
              <button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')} aria-label="List view"><Icon name="list" size={18} /></button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="active-filters">
              {chips.map((c) => (
                <button key={c.label} className="chip chip-removable" onClick={() => update(c.clear)}>
                  {c.label} <Icon name="x" size={12} />
                </button>
              ))}
              <button className="link-btn" onClick={clear}>{t('clearFilters')}</button>
            </div>
          )}

          {items.length ? (
            <>
              <ListingGrid listings={items} layout={layout} />
              <Pagination page={current} pages={pages} onChange={(n) => { update({ page: n }); window.scrollTo(0, 0); }} />
            </>
          ) : (
            <EmptyState title={t('noResults')} text={t('noResultsHint')} action={<button className="btn btn-primary" onClick={clear}>{t('clearFilters')}</button>} />
          )}
        </section>
      </div>
    </div>
  );
}
