import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FavoriteButton } from '../components/FavoriteButton';
import { Gallery } from '../components/Gallery';
import { Icon } from '../components/Icon';
import { ListingGrid } from '../components/ListingGrid';
import { Modal } from '../components/Modal';
import { PriceTag } from '../components/PriceTag';
import { SellerCard } from '../components/SellerCard';
import { useApp } from '../context/AppContext';
import { categoryBySlug } from '../data/categories';
import { provinceBySlug } from '../data/locations';
import { formatDate, formatNumber, formatPhone, maskPhone, telHref, timeAgo } from '../lib/format';
import { similarListings } from '../lib/search';
import { specEntries } from '../lib/specs';
import { NotFoundPage } from './NotFoundPage';

const REPORT_REASONS = ['Scam or fraud', 'Wrong category', 'Item already sold', 'Duplicate ad', 'Offensive content', 'Other'];

export function ListingPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const app = useApp();
  const { t, p, lang, user, getListing, getSeller, listings, markViewed, notify } = app;
  const listing = getListing(id);
  const [showPhone, setShowPhone] = useState(false);
  const [dialog, setDialog] = useState<null | 'message' | 'share' | 'report' | 'delete'>(null);
  const viewed = useRef<string | null>(null);

  useEffect(() => {
    setShowPhone(false);
    if (listing && viewed.current !== listing.id) {
      viewed.current = listing.id;
      markViewed(listing.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (!listing) return <NotFoundPage title="Ad not found" text="This ad was removed or the link is wrong." />;

  const seller = getSeller(listing.sellerId);
  const cat = categoryBySlug(listing.category);
  const sub = cat?.subcategories.find((s) => s.slug === listing.subcategory);
  const province = provinceBySlug(listing.province);
  const isOwner = !!user && user.sellerId === listing.sellerId;
  const sellerAds = listings.filter((l) => l.sellerId === listing.sellerId && l.status === 'active').length;
  const similar = similarListings(listings, listing);
  const url = window.location.href;
  const location = `${listing.district}, ${province ? p(province.name) : ''}`;

  const details: { label: string; value: string }[] = [
    { label: t('adId'), value: listing.ref },
    { label: t('category'), value: `${cat ? p(cat.name) : ''} › ${sub ? p(sub.name) : ''}` },
    ...(listing.condition ? [{ label: t('condition'), value: t(listing.condition) }] : []),
    ...(listing.dealType ? [{ label: t('dealType'), value: t(listing.dealType === 'sale' ? 'forSale' : 'forRent') }] : []),
    ...specEntries(listing, lang),
    { label: t('location'), value: location },
    ...(listing.sku ? [{ label: t('sku'), value: listing.sku }] : []),
    ...(listing.delivery ? [{ label: t('delivery'), value: listing.delivery }] : []),
    { label: t('posted'), value: formatDate(listing.postedAt, lang) },
  ];

  const revealPhone = () => setShowPhone(true);

  return (
    <div className="container page listing-page">
      <Breadcrumbs items={[
        { label: t('home'), to: '/' },
        ...(cat ? [{ label: p(cat.name), to: `/c/${cat.slug}` }] : []),
        ...(cat && sub ? [{ label: p(sub.name), to: `/c/${cat.slug}/${sub.slug}` }] : []),
        { label: listing.title },
      ]} />

      {listing.status !== 'active' && (
        <div className="notice">This ad is {listing.status === 'sold' ? 'marked as sold' : 'hidden'} and does not appear in search.</div>
      )}

      <div className="listing-layout">
        <div className="listing-left">
          <Gallery listing={listing} />

          <section className="card detail-section">
            <h1 className="detail-title">{listing.title}</h1>
            <PriceTag listing={listing} large />
            {listing.discount?.note && <p className="discount-note"><Icon name="tag" size={16} /> {listing.discount.note}</p>}
            <div className="detail-meta">
              <span><Icon name="pin" size={15} /> {location}</span>
              <span><Icon name="clock" size={15} /> {timeAgo(listing.postedAt, lang)}</span>
              <span><Icon name="eye" size={15} /> {formatNumber(listing.views)} {t('views').toLowerCase()}</span>
              <span>{t('adId')}: {listing.ref}</span>
            </div>
            <div className="detail-actions">
              <FavoriteButton listingId={listing.id} variant="button" />
              <button className="btn btn-outline" onClick={() => setDialog('share')}><Icon name="share" size={18} /> {t('share')}</button>
              <button className="btn btn-outline" onClick={() => setDialog('report')}><Icon name="flag" size={18} /> {t('report')}</button>
            </div>
            {isOwner && (
              <div className="owner-bar">
                <span>This is your ad.</span>
                <Link to={`/edit/${listing.id}`} className="btn btn-primary btn-sm"><Icon name="edit" size={16} /> {t('edit')}</Link>
                <button className="btn btn-danger btn-sm" onClick={() => setDialog('delete')}><Icon name="trash" size={16} /> {t('delete')}</button>
              </div>
            )}
          </section>

          <section className="card detail-section">
            <h2>{t('specifications')}</h2>
            <dl className="spec-table">
              {details.map((d) => (
                <div key={d.label}><dt>{d.label}</dt><dd>{d.value}</dd></div>
              ))}
            </dl>
          </section>

          <section className="card detail-section">
            <h2>{t('description')}</h2>
            <div className="description">{listing.description}</div>
          </section>
        </div>

        <aside className="listing-right">
          <section className="card detail-section contact-box">
            {seller && <SellerCard seller={seller} adCount={sellerAds} />}
            <div className="contact-buttons">
              {showPhone ? (
                <a className="btn btn-success btn-block btn-lg" href={telHref(listing.phone)}>
                  <Icon name="call" size={18} /> {formatPhone(listing.phone)}
                </a>
              ) : (
                <button className="btn btn-success btn-block btn-lg" onClick={revealPhone}>
                  <Icon name="call" size={18} /> {maskPhone(listing.phone)} · {t('showPhone')}
                </button>
              )}
              {showPhone && seller?.phone2 && (
                <a className="btn btn-outline btn-block" href={telHref(seller.phone2)}><Icon name="call" size={18} /> {formatPhone(seller.phone2)}</a>
              )}
              <button className="btn btn-primary btn-block btn-lg" onClick={() => setDialog('message')}>
                <Icon name="message" size={18} /> {t('contactSeller')}
              </button>
              {seller?.telegram && (
                <a className="btn btn-outline btn-block" href={`https://t.me/${seller.telegram}`} target="_blank" rel="noreferrer">
                  <Icon name="telegram" size={18} /> Telegram
                </a>
              )}
            </div>
            {seller && <Link to={`/seller/${seller.id}`} className="link-more">{t('viewProfile')} <Icon name="chevronRight" size={14} /></Link>}
          </section>
          <section className="card detail-section safety">
            <h3><Icon name="verified" size={18} /> {t('safetyTitle')}</h3>
            <p className="small">{t('safetyText')}</p>
          </section>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>{t('similarAds')}</h2></div>
          <ListingGrid listings={similar} />
        </section>
      )}

      <div className="contact-sticky only-mobile">
        {showPhone
          ? <a className="btn btn-success" href={telHref(listing.phone)}><Icon name="call" size={18} /> {t('call')}</a>
          : <button className="btn btn-success" onClick={revealPhone}><Icon name="call" size={18} /> {t('call')}</button>}
        <button className="btn btn-primary" onClick={() => setDialog('message')}><Icon name="message" size={18} /> {t('contactSeller')}</button>
      </div>

      {dialog === 'message' && (
        <MessageDialog
          defaultName={user?.name ?? ''}
          defaultPhone={user?.phone ?? ''}
          title={listing.title}
          onClose={() => setDialog(null)}
          onSend={(name, phone, text) => {
            app.sendMessage({ listingId: listing.id, fromUserId: user?.id ?? null, name, phone, text });
            setDialog(null);
            notify('Message sent to the seller.');
          }}
        />
      )}
      {dialog === 'share' && <ShareDialog url={url} title={listing.title} onClose={() => setDialog(null)} onCopied={() => notify('Link copied.')} />}
      {dialog === 'report' && (
        <ReportDialog
          onClose={() => setDialog(null)}
          onSubmit={(reason, detailsText) => {
            app.reportListing({ listingId: listing.id, reason, details: detailsText });
            setDialog(null);
            notify('Thank you. Our team will review this ad.');
          }}
        />
      )}
      {dialog === 'delete' && (
        <Modal title={t('delete')} onClose={() => setDialog(null)}>
          <p>Delete “{listing.title}”? This cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setDialog(null)}>{t('cancel')}</button>
            <button className="btn btn-danger" onClick={() => { app.deleteListing(listing.id); notify('Ad deleted.'); navigate('/account/listings'); }}>{t('delete')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MessageDialog({ title, defaultName, defaultPhone, onClose, onSend }: {
  title: string; defaultName: string; defaultPhone: string;
  onClose: () => void; onSend: (name: string, phone: string, text: string) => void;
}) {
  const { t } = useApp();
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [text, setText] = useState(`Hello, is "${title}" still available?`);
  const submit = (e: FormEvent) => { e.preventDefault(); if (name.trim() && text.trim()) onSend(name.trim(), phone.trim(), text.trim()); };
  return (
    <Modal title={t('contactSeller')} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>Your name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Your phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="012 345 678" inputMode="tel" /></label>
        <label>Message<textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} required /></label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="btn btn-primary">Send</button>
        </div>
      </form>
    </Modal>
  );
}

function ShareDialog({ url, title, onClose, onCopied }: { url: string; title: string; onClose: () => void; onCopied: () => void }) {
  const { t } = useApp();
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked; the link is visible to copy by hand */ }
    onCopied();
  };
  const enc = encodeURIComponent;
  return (
    <Modal title={t('share')} onClose={onClose}>
      <div className="share-options">
        <a className="btn btn-outline" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noreferrer"><Icon name="facebook" size={18} /> Facebook</a>
        <a className="btn btn-outline" href={`https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`} target="_blank" rel="noreferrer"><Icon name="telegram" size={18} /> Telegram</a>
        {typeof navigator.share === 'function' && (
          <button className="btn btn-outline" onClick={() => navigator.share({ title, url }).catch(() => undefined)}><Icon name="share" size={18} /> More…</button>
        )}
      </div>
      <div className="copy-row">
        <input readOnly value={url} aria-label="Link" onFocus={(e) => e.target.select()} />
        <button className="btn btn-primary" onClick={copy}><Icon name="copy" size={16} /> Copy</button>
      </div>
    </Modal>
  );
}

function ReportDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string, details: string) => void }) {
  const { t } = useApp();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  return (
    <Modal title={t('report')} onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); if (reason) onSubmit(reason, details); }}>
        <fieldset className="radio-list">
          <legend>Why are you reporting this ad?</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r} className="radio"><input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} required /> {r}</label>
          ))}
        </fieldset>
        <label>Details (optional)<textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} /></label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="btn btn-danger">Submit report</button>
        </div>
      </form>
    </Modal>
  );
}
