import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { PROVINCES } from '../data/locations';
import { EMPTY_SEARCH, parseSearch, toQuery } from '../lib/search';
import { Icon } from './Icon';

interface Props { variant?: 'header' | 'hero'; }

/** Keyword + category + location search. Submits to /search. */
export function SearchBar({ variant = 'header' }: Props) {
  const { t, p } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');

  // Keep the header search in sync with the current results page.
  useEffect(() => {
    if (variant !== 'header' || location.pathname !== '/search') return;
    const s = parseSearch(new URLSearchParams(location.search));
    setQ(s.q);
    setCategory(s.category);
    setProvince(s.province);
  }, [location, variant]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?${toQuery({ ...EMPTY_SEARCH, q, category, province })}`);
  };

  return (
    <form className={`searchbar searchbar-${variant}`} onSubmit={submit} role="search">
      <select className="sb-cat" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('category')}>
        <option value="">{t('allCategories')}</option>
        {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{p(c.name)}</option>)}
      </select>
      <input
        className="sb-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('search')}
      />
      <select className="sb-loc" value={province} onChange={(e) => setProvince(e.target.value)} aria-label={t('location')}>
        <option value="">{t('allLocations')}</option>
        {PROVINCES.map((pr) => <option key={pr.slug} value={pr.slug}>{p(pr.name)}</option>)}
      </select>
      <button className="sb-submit" type="submit" aria-label={t('search')}>
        <Icon name="search" size={18} /> <span className="sb-submit-label">{t('search')}</span>
      </button>
    </form>
  );
}
