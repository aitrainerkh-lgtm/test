import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { provinceBySlug } from '../data/locations';
import { formatDate } from '../lib/format';
import type { Seller } from '../types';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

interface Props { seller: Seller; adCount: number; showLink?: boolean; }

export function SellerCard({ seller, adCount, showLink = true }: Props) {
  const { t, p, lang } = useApp();
  const province = provinceBySlug(seller.province);
  return (
    <div className="seller-card">
      <Avatar name={seller.name} color={seller.avatarColor} size={56} />
      <div className="seller-info">
        <div className="seller-name">
          {showLink ? <Link to={`/seller/${seller.id}`}>{seller.name}</Link> : seller.name}
          {seller.verified && <span className="verified" title={t('verified')}><Icon name="verified" size={16} /> {t('verified')}</span>}
        </div>
        <div className="muted small">
          {seller.type === 'business' ? 'Business' : 'Individual'} · {t('memberSince')} {formatDate(seller.joinedAt, lang)}
        </div>
        <div className="muted small">
          <Icon name="pin" size={13} /> {province ? p(province.name) : ''}{seller.district ? `, ${seller.district}` : ''} · {adCount} {t('activeAds').toLowerCase()}
        </div>
      </div>
    </div>
  );
}
