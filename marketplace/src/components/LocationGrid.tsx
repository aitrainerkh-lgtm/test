import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PROVINCES } from '../data/locations';
import { countBy } from '../lib/search';
import { Icon } from './Icon';

interface Props { slugs?: string[]; }

export function LocationGrid({ slugs }: Props) {
  const { p, t, listings } = useApp();
  const counts = countBy(listings, 'province');
  const list = slugs ? PROVINCES.filter((pr) => slugs.includes(pr.slug)) : PROVINCES;
  return (
    <div className="location-grid">
      {list.map((pr) => (
        <Link key={pr.slug} to={`/l/${pr.slug}`} className="location-tile">
          <Icon name="pin" size={18} />
          <span className="location-name">{p(pr.name)}</span>
          <span className="location-count">{counts[pr.slug] ?? 0} {t('ads')}</span>
        </Link>
      ))}
    </div>
  );
}
