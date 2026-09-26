import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRAND } from '../config/brand';
import { CATEGORIES } from '../data/categories';
import { MAJOR_PROVINCES, provinceBySlug } from '../data/locations';
import { Icon } from './Icon';
import { Logo } from './Logo';

export function Footer() {
  const { t, p } = useApp();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted">{p(BRAND.tagline)}</p>
          <p className="small"><Icon name="call" size={14} /> {BRAND.supportPhone}</p>
          <p className="small"><Icon name="message" size={14} /> {BRAND.supportEmail}</p>
          <div className="social">
            <a href={BRAND.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Icon name="facebook" /></a>
            <a href={BRAND.social.telegram} target="_blank" rel="noreferrer" aria-label="Telegram"><Icon name="telegram" /></a>
          </div>
        </div>
        <div>
          <h4>{t('categories')}</h4>
          <ul>{CATEGORIES.slice(0, 6).map((c) => <li key={c.slug}><Link to={`/c/${c.slug}`}>{p(c.name)}</Link></li>)}</ul>
        </div>
        <div>
          <h4>&nbsp;</h4>
          <ul>{CATEGORIES.slice(6).map((c) => <li key={c.slug}><Link to={`/c/${c.slug}`}>{p(c.name)}</Link></li>)}</ul>
        </div>
        <div>
          <h4>{t('locations')}</h4>
          <ul>
            {MAJOR_PROVINCES.slice(0, 5).map((s) => <li key={s}><Link to={`/l/${s}`}>{p(provinceBySlug(s)!.name)}</Link></li>)}
            <li><Link to="/locations">{t('viewAll')}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{t('myAccount')}</h4>
          <ul>
            <li><Link to="/post">{t('postAd')}</Link></li>
            <li><Link to="/account/listings">{t('myListings')}</Link></li>
            <li><Link to="/account/saved">{t('savedListings')}</Link></li>
            <li><Link to="/login">{t('login')}</Link></li>
            <li><Link to="/register">{t('register')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {BRAND.name}. Demo marketplace with sample listings.</span>
        <span>{t('safetyText')}</span>
      </div>
    </footer>
  );
}
