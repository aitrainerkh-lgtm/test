import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Icon } from '../components/Icon';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { countBy } from '../lib/search';

export function CategoriesPage() {
  const { t, p, listings } = useApp();
  const byCat = countBy(listings, 'category');
  const bySub = countBy(listings, 'subcategory');
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: t('home'), to: '/' }, { label: t('categories') }]} />
      <h1>{t('categories')}</h1>
      <div className="category-directory">
        {CATEGORIES.map((c) => (
          <section key={c.slug} className="card category-block">
            <Link to={`/c/${c.slug}`} className="category-block-head">
              <span className="category-icon" style={{ color: c.color, background: `${c.color}14` }}><Icon name={c.icon} size={24} /></span>
              <span><strong>{p(c.name)}</strong><span className="muted small"> ({byCat[c.slug] ?? 0})</span></span>
            </Link>
            <ul>
              {c.subcategories.map((s) => (
                <li key={s.slug}>
                  <Link to={`/c/${c.slug}/${s.slug}`}>{p(s.name)} <span className="muted small">({bySub[s.slug] ?? 0})</span></Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
