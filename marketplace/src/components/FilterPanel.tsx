import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, categoryBySlug, fieldsFor } from '../data/categories';
import { PROVINCES, provinceBySlug } from '../data/locations';
import type { SearchParams } from '../types';

interface Props {
  params: SearchParams;
  onChange: (patch: Partial<SearchParams>) => void;
  onClear: () => void;
}

/** Search filters. Every change updates the URL so results can be shared. */
export function FilterPanel({ params, onChange, onClear }: Props) {
  const { t, p } = useApp();
  const cat = categoryBySlug(params.category);
  const province = provinceBySlug(params.province);
  const specFilters = cat ? fieldsFor(cat.slug, params.subcategory).filter((f) => f.filterable && f.type === 'select') : [];
  const showCondition = !cat || cat.hasCondition;
  const showDeal = !cat || cat.hasDealType;

  const [min, setMin] = useState(params.min);
  const [max, setMax] = useState(params.max);
  useEffect(() => { setMin(params.min); setMax(params.max); }, [params.min, params.max]);

  const applyPrice = (e?: FormEvent) => {
    e?.preventDefault();
    onChange({ min: min.trim(), max: max.trim() });
  };

  return (
    <div className="filters">
      <div className="filter-group">
        <label htmlFor="f-cat">{t('category')}</label>
        <select id="f-cat" value={params.category} onChange={(e) => onChange({ category: e.target.value, subcategory: '', specs: {}, condition: '', dealType: '' })}>
          <option value="">{t('allCategories')}</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{p(c.name)}</option>)}
        </select>
      </div>

      {cat && (
        <div className="filter-group">
          <label htmlFor="f-sub">{t('subcategory')}</label>
          <select id="f-sub" value={params.subcategory} onChange={(e) => onChange({ subcategory: e.target.value, specs: {} })}>
            <option value="">{t('allSubcategories')}</option>
            {cat.subcategories.map((s) => <option key={s.slug} value={s.slug}>{p(s.name)}</option>)}
          </select>
        </div>
      )}

      <div className="filter-group">
        <label htmlFor="f-prov">{t('province')}</label>
        <select id="f-prov" value={params.province} onChange={(e) => onChange({ province: e.target.value, district: '' })}>
          <option value="">{t('allLocations')}</option>
          {PROVINCES.map((pr) => <option key={pr.slug} value={pr.slug}>{p(pr.name)}</option>)}
        </select>
      </div>

      {province && (
        <div className="filter-group">
          <label htmlFor="f-dist">{t('district')}</label>
          <select id="f-dist" value={params.district} onChange={(e) => onChange({ district: e.target.value })}>
            <option value="">{t('allDistricts')}</option>
            {province.districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      <form className="filter-group" onSubmit={applyPrice}>
        <label>{cat?.priceLabel ? p(cat.priceLabel) : t('price')} (USD)</label>
        <div className="price-range">
          <input type="number" min="0" inputMode="numeric" placeholder={t('minPrice')} value={min} onChange={(e) => setMin(e.target.value)} onBlur={() => applyPrice()} aria-label={t('minPrice')} />
          <span aria-hidden="true">–</span>
          <input type="number" min="0" inputMode="numeric" placeholder={t('maxPrice')} value={max} onChange={(e) => setMax(e.target.value)} onBlur={() => applyPrice()} aria-label={t('maxPrice')} />
          <button type="submit" className="btn btn-ghost btn-sm">OK</button>
        </div>
      </form>

      {showDeal && (
        <fieldset className="filter-group">
          <legend>{t('dealType')}</legend>
          <div className="segmented">
            {([['', t('any')], ['sale', t('forSale')], ['rent', t('forRent')]] as const).map(([v, label]) => (
              <button key={v} type="button" className={params.dealType === v ? 'active' : ''} onClick={() => onChange({ dealType: v })}>{label}</button>
            ))}
          </div>
        </fieldset>
      )}

      {showCondition && (
        <fieldset className="filter-group">
          <legend>{t('condition')}</legend>
          <div className="segmented">
            {([['', t('any')], ['new', t('new')], ['used', t('used')]] as const).map(([v, label]) => (
              <button key={v} type="button" className={params.condition === v ? 'active' : ''} onClick={() => onChange({ condition: v })}>{label}</button>
            ))}
          </div>
        </fieldset>
      )}

      {specFilters.map((f) => (
        <div className="filter-group" key={f.key}>
          <label htmlFor={`f-${f.key}`}>{p(f.label)}</label>
          <select id={`f-${f.key}`} value={params.specs[f.key] ?? ''} onChange={(e) => onChange({ specs: { ...params.specs, [f.key]: e.target.value } })}>
            <option value="">{t('any')}</option>
            {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}

      <div className="filter-group">
        <label htmlFor="f-date">{t('datePosted')}</label>
        <select id="f-date" value={params.date} onChange={(e) => onChange({ date: e.target.value as SearchParams['date'] })}>
          <option value="">{t('anyTime')}</option>
          <option value="1">{t('last24h')}</option>
          <option value="7">{t('last7d')}</option>
          <option value="30">{t('last30d')}</option>
        </select>
      </div>

      <button type="button" className="btn btn-ghost btn-block" onClick={onClear}>{t('clearFilters')}</button>
    </div>
  );
}
