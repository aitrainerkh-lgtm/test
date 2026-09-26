import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { countBy } from '../lib/search';
import { Icon } from './Icon';

export function CategoryGrid() {
  const { p, t, listings } = useApp();
  const counts = countBy(listings, 'category');
  return (
    <div className="category-grid">
      {CATEGORIES.map((c) => (
        <Link key={c.slug} to={`/c/${c.slug}`} className="category-tile">
          <span className="category-icon" style={{ color: c.color, background: `${c.color}14` }}>
            <Icon name={c.icon} size={28} />
          </span>
          <span className="category-name">{p(c.name)}</span>
          <span className="category-count">{counts[c.slug] ?? 0} {t('ads')}</span>
        </Link>
      ))}
    </div>
  );
}
