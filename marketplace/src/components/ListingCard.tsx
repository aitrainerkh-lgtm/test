import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { provinceBySlug } from '../data/locations';
import { timeAgo } from '../lib/format';
import { imageCaption, listingImage } from '../lib/images';
import { cardSpecs } from '../lib/specs';
import type { Listing } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { Icon } from './Icon';
import { PriceTag } from './PriceTag';

interface Props { listing: Listing; layout?: 'grid' | 'list'; }

export function ListingCard({ listing, layout = 'grid' }: Props) {
  const { t, p, lang } = useApp();
  const province = provinceBySlug(listing.province);
  const specs = cardSpecs(listing, lang);
  const tags = [
    listing.condition && t(listing.condition),
    listing.dealType && t(listing.dealType === 'sale' ? 'forSale' : 'forRent'),
  ].filter(Boolean);

  return (
    <article className={`card listing-card ${layout}`}>
      <Link to={`/listing/${listing.id}`} className="listing-link" aria-label={listing.title}>
        <div className="listing-thumb">
          <img src={listingImage(listing)} alt={imageCaption(listing.images[0])} loading="lazy" />
          {listing.featured && <span className="badge badge-top"><Icon name="star" size={12} filled /> {t('featured')}</span>}
          {listing.images.length > 1 && (
            <span className="photo-count"><Icon name="camera" size={12} /> {listing.images.length}</span>
          )}
        </div>
        <div className="listing-body">
          <h3 className="listing-title">{listing.title}</h3>
          <PriceTag listing={listing} />
          {specs.length > 0 && <p className="listing-specs">{specs.join(' · ')}</p>}
          <div className="listing-meta">
            <span><Icon name="pin" size={13} /> {province ? p(province.name) : ''}{listing.district ? `, ${listing.district}` : ''}</span>
            <span><Icon name="clock" size={13} /> {timeAgo(listing.postedAt, lang)}</span>
          </div>
          {tags.length > 0 && (
            <div className="listing-tags">{tags.map((tag) => <span key={tag as string} className="chip">{tag}</span>)}</div>
          )}
        </div>
      </Link>
      <FavoriteButton listingId={listing.id} />
    </article>
  );
}
