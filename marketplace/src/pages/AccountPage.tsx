import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { ListingGrid } from '../components/ListingGrid';
import { Modal } from '../components/Modal';
import { PriceTag } from '../components/PriceTag';
import { useApp } from '../context/AppContext';
import { PROVINCES, provinceBySlug } from '../data/locations';
import { formatDate, formatNumber, formatPhone, isValidPhone, timeAgo } from '../lib/format';
import { listingImage } from '../lib/images';
import { sortListings } from '../lib/search';
import type { Listing } from '../types';
import { NotFoundPage } from './NotFoundPage';

type Tab = 'profile' | 'listings' | 'saved' | 'settings';

export function AccountPage() {
  const { tab = 'profile' } = useParams();
  const { t, user } = useApp();
  if (!user) return null; // guarded by RequireAuth
  if (!['profile', 'listings', 'saved', 'settings'].includes(tab)) return <NotFoundPage />;

  const tabs: { id: Tab; to: string; label: string; icon: string }[] = [
    { id: 'profile', to: '/account', label: t('profile'), icon: 'user' },
    { id: 'listings', to: '/account/listings', label: t('myListings'), icon: 'list' },
    { id: 'saved', to: '/account/saved', label: t('savedListings'), icon: 'heart' },
    { id: 'settings', to: '/account/settings', label: t('settings'), icon: 'settings' },
  ];

  return (
    <div className="container page account-page">
      <nav className="account-tabs" aria-label={t('myAccount')}>
        {tabs.map((x) => (
          <NavLink key={x.id} to={x.to} end><Icon name={x.icon} size={18} /> <span>{x.label}</span></NavLink>
        ))}
      </nav>
      <div className="account-content">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'listings' && <MyListingsTab />}
        {tab === 'saved' && <SavedTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { t, p, lang, user, listings, favorites, getSeller } = useApp();
  const u = user!;
  const seller = getSeller(u.sellerId);
  const mine = listings.filter((l) => l.sellerId === u.sellerId);
  const province = provinceBySlug(u.province);
  const stats = [
    { label: t('activeAds'), value: mine.filter((l) => l.status === 'active').length, to: '/account/listings' },
    { label: t('savedListings'), value: favorites.length, to: '/account/saved' },
    { label: t('views'), value: formatNumber(mine.reduce((sum, l) => sum + l.views, 0)) },
  ];
  return (
    <>
      <section className="card profile-card">
        <Avatar name={u.name} color={seller?.avatarColor ?? '#0a5c8c'} size={80} />
        <div>
          <h1>{u.name}</h1>
          <p className="muted">{u.email} · {formatPhone(u.phone)}</p>
          <p className="muted small"><Icon name="pin" size={13} /> {u.district ? `${u.district}, ` : ''}{province ? p(province.name) : ''} · {t('memberSince')} {formatDate(u.joinedAt, lang)}</p>
          {u.bio && <p>{u.bio}</p>}
          <div className="row-gap">
            <Link to={`/seller/${u.sellerId}`} className="btn btn-outline btn-sm">View public profile</Link>
            <Link to="/account/settings" className="btn btn-ghost btn-sm"><Icon name="edit" size={16} /> {t('edit')}</Link>
          </div>
        </div>
      </section>
      <div className="stats">
        {stats.map((s) => {
          const inner = <><strong>{s.value}</strong><span>{s.label}</span></>;
          return s.to ? <Link key={s.label} to={s.to} className="card stat">{inner}</Link> : <div key={s.label} className="card stat">{inner}</div>;
        })}
      </div>
      <div className="card promo-card promo-sell">
        <div><h3>{t('promoTitle')}</h3><p>{t('promoText')}</p></div>
        <Link to="/post" className="btn btn-accent"><Icon name="plus" size={18} /> {t('postAd')}</Link>
      </div>
    </>
  );
}

function MyListingsTab() {
  const { t, lang, user, listings, saveListing, deleteListing, notify } = useApp();
  const [filter, setFilter] = useState<'all' | Listing['status']>('all');
  const [toDelete, setToDelete] = useState<Listing | null>(null);
  const mine = sortListings(listings.filter((l) => l.sellerId === user!.sellerId), 'newest');
  const shown = filter === 'all' ? mine : mine.filter((l) => l.status === filter);

  const setStatus = (l: Listing, status: Listing['status']) => {
    saveListing({ ...l, status });
    notify(status === 'sold' ? 'Marked as sold.' : status === 'hidden' ? 'Ad hidden from search.' : 'Ad is active again.');
  };

  return (
    <>
      <div className="section-head">
        <h1>{t('myListings')} ({mine.length})</h1>
        <Link to="/post" className="btn btn-accent btn-sm"><Icon name="plus" size={16} /> {t('postAd')}</Link>
      </div>
      <div className="segmented mb">
        {(['all', 'active', 'sold', 'hidden'] as const).map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)} ({f === 'all' ? mine.length : mine.filter((l) => l.status === f).length})
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="list" title="No ads here yet" text="Post an ad and it will appear here." action={<Link to="/post" className="btn btn-primary">{t('postAd')}</Link>} />
      ) : (
        <ul className="manage-list">
          {shown.map((l) => (
            <li key={l.id} className="card manage-item">
              <Link to={`/listing/${l.id}`} className="manage-thumb"><img src={listingImage(l)} alt="" /></Link>
              <div className="manage-info">
                <Link to={`/listing/${l.id}`} className="manage-title">{l.title}</Link>
                <PriceTag listing={l} />
                <div className="muted small">
                  <span className={`status status-${l.status}`}>{l.status}</span> · {l.ref} · {timeAgo(l.postedAt, lang)} · <Icon name="eye" size={13} /> {formatNumber(l.views)}
                </div>
              </div>
              <div className="manage-actions">
                <Link to={`/edit/${l.id}`} className="btn btn-outline btn-sm"><Icon name="edit" size={16} /> {t('edit')}</Link>
                {l.status === 'active' ? (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setStatus(l, 'sold')}>Mark sold</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setStatus(l, 'hidden')}>Hide</button>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(l, 'active')}>Reactivate</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => setToDelete(l)} aria-label={`${t('delete')} ${l.title}`}><Icon name="trash" size={16} /> {t('delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {toDelete && (
        <Modal title={t('delete')} onClose={() => setToDelete(null)}>
          <p>Delete “{toDelete.title}”? This cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setToDelete(null)}>{t('cancel')}</button>
            <button className="btn btn-danger" onClick={() => { deleteListing(toDelete.id); setToDelete(null); notify('Ad deleted.'); }}>{t('delete')}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function SavedTab() {
  const { t, favorites, listings } = useApp();
  // Keep the order in which items were saved; skip deleted ads.
  const saved = favorites.map((id) => listings.find((l) => l.id === id)).filter((l): l is Listing => !!l);
  return (
    <>
      <h1>{t('savedListings')} ({saved.length})</h1>
      {saved.length ? <ListingGrid listings={saved} /> : (
        <EmptyState icon="heart" title="No saved ads yet" text="Tap the heart on any ad to save it here." action={<Link to="/search" className="btn btn-primary">Browse ads</Link>} />
      )}
    </>
  );
}

function SettingsTab() {
  const { t, p, user, updateProfile, changePassword, logout, notify } = useApp();
  const navigate = useNavigate();
  const u = user!;
  const [form, setForm] = useState({ name: u.name, phone: u.phone, province: u.province, district: u.district ?? '', telegram: u.telegram ?? '', bio: u.bio ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const province = provinceBySlug(form.province);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your name.';
    if (!isValidPhone(form.phone)) errs.phone = 'Enter a Cambodian phone number, e.g. 012 345 678.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    updateProfile({ ...form, name: form.name.trim(), phone: formatPhone(form.phone), district: form.district || undefined });
    notify('Profile saved.');
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 6) { setPwMsg('New password must have at least 6 characters.'); return; }
    if (pw.next !== pw.confirm) { setPwMsg('Passwords do not match.'); return; }
    const ok = await changePassword(pw.current, pw.next);
    setPwMsg(ok ? '' : 'Current password is wrong.');
    if (ok) { setPw({ current: '', next: '', confirm: '' }); notify('Password changed.'); }
  };

  return (
    <>
      <h1>{t('settings')}</h1>
      <section className="card detail-section">
        <h2>{t('profile')}</h2>
        <form className="form form-grid" onSubmit={saveProfile} noValidate>
          <label>Full name<input value={form.name} onChange={(e) => set('name', e.target.value)} />{errors.name && <span className="field-error">{errors.name}</span>}</label>
          <label>Email<input value={u.email} disabled /></label>
          <label>Phone number<input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => set('phone', formatPhone(form.phone))} />{errors.phone && <span className="field-error">{errors.phone}</span>}</label>
          <label>Telegram username<input value={form.telegram} onChange={(e) => set('telegram', e.target.value.replace(/^@/, ''))} /></label>
          <label>{t('province')}
            <select value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value, district: '' }))}>
              {PROVINCES.map((pr) => <option key={pr.slug} value={pr.slug}>{p(pr.name)}</option>)}
            </select>
          </label>
          <label>{t('district')}
            <select value={form.district} onChange={(e) => set('district', e.target.value)}>
              <option value="">—</option>
              {province?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="span-2">About you / your shop<textarea rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} /></label>
          <div className="span-2"><button className="btn btn-primary">{t('saveChanges')}</button></div>
        </form>
      </section>

      <section className="card detail-section">
        <h2>Change password</h2>
        <form className="form form-grid" onSubmit={savePassword}>
          <label className="span-2">Current password<input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></label>
          <label>New password<input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></label>
          {pwMsg && <p className="form-error span-2" role="alert">{pwMsg}</p>}
          <div className="span-2"><button className="btn btn-primary">Update password</button></div>
        </form>
      </section>

      <section className="card detail-section">
        <h2>{t('language')}</h2>
        <LanguageSwitch />
      </section>

      <button className="btn btn-danger" onClick={() => { logout(); notify('You have logged out.'); navigate('/'); }}>
        <Icon name="logout" size={18} /> {t('logout')}
      </button>
    </>
  );
}
