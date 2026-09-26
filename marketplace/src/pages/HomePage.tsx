import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { CategoryGrid } from '../components/CategoryGrid';
import { ListingGrid } from '../components/ListingGrid';
import { LocationGrid } from '../components/LocationGrid';
import { SearchBar } from '../components/SearchBar';
import { BRAND } from '../config/brand';
import { useApp } from '../context/AppContext';
import { MAJOR_PROVINCES } from '../data/locations';
import { sortListings } from '../lib/search';

const POPULAR_SEARCHES = ['iPhone', 'Toyota Prius', 'Condo for rent', 'Land', 'Laptop', 'Motorbike'];

export function HomePage() {
  const { t, p, listings } = useApp();
  const active = listings.filter((l) => l.status === 'active');
  const featured = sortListings(active.filter((l) => l.featured), 'newest').slice(0, 8);
  const latest = sortListings(active, 'newest').slice(0, 12);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{p(BRAND.tagline)}</h1>
          <p className="hero-sub">{active.length} {t('ads')} · 25 {t('locations').toLowerCase()}</p>
          <SearchBar variant="hero" />
          <div className="popular">
            {POPULAR_SEARCHES.map((q) => (
              <Link key={q} to={`/search?q=${encodeURIComponent(q)}`} className="chip chip-light">{q}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>{t('browseByCategory')}</h2>
          <Link to="/categories">{t('viewAll')} <Icon name="chevronRight" size={16} /></Link>
        </div>
        <CategoryGrid />
      </section>

      <section className="container section">
        <div className="section-head">
          <h2><Icon name="star" size={20} filled className="text-accent" /> {t('featuredListings')}</h2>
          <Link to="/search?sort=newest">{t('viewAll')} <Icon name="chevronRight" size={16} /></Link>
        </div>
        <ListingGrid listings={featured} />
      </section>

      <section className="container section">
        <div className="promo">
          <div className="promo-card promo-sell">
            <div>
              <h3>{t('promoTitle')}</h3>
              <p>{t('promoText')}</p>
            </div>
            <Link to="/post" className="btn btn-accent"><Icon name="plus" size={18} /> {t('postAd')}</Link>
          </div>
          <div className="promo-card promo-safe">
            <div>
              <h3><Icon name="verified" size={20} /> {t('safetyTitle')}</h3>
              <p>{t('safetyText')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>{t('latestListings')}</h2>
          <Link to="/search">{t('viewAll')} <Icon name="chevronRight" size={16} /></Link>
        </div>
        <ListingGrid listings={latest} />
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>{t('browseByLocation')}</h2>
          <Link to="/locations">{t('viewAll')} <Icon name="chevronRight" size={16} /></Link>
        </div>
        <LocationGrid slugs={MAJOR_PROVINCES} />
      </section>
    </>
  );
}
