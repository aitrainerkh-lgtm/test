import type { Listing } from '../types';
import { ListingCard } from './ListingCard';

interface Props { listings: Listing[]; layout?: 'grid' | 'list'; }

export function ListingGrid({ listings, layout = 'grid' }: Props) {
  return (
    <div className={layout === 'list' ? 'listing-list' : 'listing-grid'}>
      {listings.map((l) => <ListingCard key={l.id} listing={l} layout={layout} />)}
    </div>
  );
}
