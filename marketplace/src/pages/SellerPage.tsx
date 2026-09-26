import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { ListingGrid } from '../components/ListingGrid';
import { useApp } from '../context/AppContext';
import { provinceBySlug } from '../data/locations';
import { formatDate, formatPhone, maskPhone, telHref } from '../lib/format';
import { sortListings } from '../lib/search';
import { NotFoundPage } from './NotFoundPage';

export function SellerPage() {
  const { id = '' } = useParams();
  const { t, p, lang, getSeller, listings } = useApp();
  const [showPhone, setShowPhone] = useState(false);
  const seller = getSeller(id);
  if (!seller) return <NotFoundPage title="Seller not found" />;

  const ads = sortListings(listings.filter((l) => l.sellerId === seller.id && l.status === 'active'), 'newest');
  const province = provinceBySlug(seller.province);

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: t('home'), to: '/' }, { label: seller.name }]} />
      <section className="card seller-hero">
        <Avatar name={seller.name} color={seller.avatarColor} size={88} />
        <div className="seller-hero-info">
          <h1>
            {seller.name}
            {seller.verified && <span className="verified"><Icon name="verified" size={18} /> {t('verified')}</span>}
          </h1>
          <p className="muted">
            {seller.type === 'business' ? 'Business seller' : 'Individual seller'} ·{' '}
            <span className={`status status-${seller.status}`}>{seller.status === 'active' ? 'Active account' : 'Suspended'}</span>
          </p>
          <ul className="seller-facts">
            <li><Icon name="clock" size={15} /> {t('memberSince')} {formatDate(seller.joinedAt, lang)}</li>
            <li><Icon name="pin" size={15} /> {seller.district ? `${seller.district}, ` : ''}{province ? p(province.name) : ''}</li>
            <li><Icon name="list" size={15} /> {ads.length} {t('activeAds').toLowerCase()}</li>
            {seller.email && <li><Icon name="message" size={15} /> <a href={`mailto:${seller.email}`}>{seller.email}</a></li>}
          </ul>
          {seller.bio && <p>{seller.bio}</p>}
        </div>
        <div className="seller-hero-actions">
          {showPhone ? (
            <a className="btn btn-success" href={telHref(seller.phone)}><Icon name="call" size={18} /> {formatPhone(seller.phone)}</a>
          ) : (
            <button className="btn btn-success" onClick={() => setShowPhone(true)}><Icon name="call" size={18} /> {maskPhone(seller.phone)}</button>
          )}
          {seller.telegram && (
            <a className="btn btn-outline" href={`https://t.me/${seller.telegram}`} target="_blank" rel="noreferrer"><Icon name="telegram" size={18} /> Telegram</a>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>{t('activeAds')} ({ads.length})</h2></div>
        {ads.length ? <ListingGrid listings={ads} /> : <EmptyState icon="list" title="No active ads" />}
      </section>
    </div>
  );
}
