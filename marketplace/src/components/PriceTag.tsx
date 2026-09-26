import { useApp } from '../context/AppContext';
import { formatPrice, formatUSD } from '../lib/format';
import type { Listing } from '../types';

interface Props { listing: Listing; large?: boolean; }

export function PriceTag({ listing, large }: Props) {
  const { t, lang } = useApp();
  const price = formatPrice(listing, lang);
  return (
    <div className={`price ${large ? 'price-lg' : ''}`}>
      <span className="price-value">{price ?? t('contactForPrice')}</span>
      {listing.discount && (
        <>
          <s className="price-old">{formatUSD(listing.discount.oldPrice)}</s>
          <span className="badge badge-sale">-{listing.discount.percent}%</span>
        </>
      )}
      {large && listing.negotiable && <span className="badge badge-soft">{t('negotiable')}</span>}
    </div>
  );
}
