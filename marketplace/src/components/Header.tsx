import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { MAJOR_PROVINCES, provinceBySlug } from '../data/locations';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { LanguageSwitch } from './LanguageSwitch';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';

export function Header() {
  const { t, p, user, logout, notify } = useApp();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close menus on navigation.
  useEffect(() => { setDrawer(false); setMenu(false); }, [location]);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', drawer);
  }, [drawer]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const doLogout = () => {
    logout();
    notify('You have logged out.');
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="header-main container">
        <button className="icon-btn only-mobile" onClick={() => setDrawer(true)} aria-label={t('menu')} aria-expanded={drawer}>
          <Icon name="menu" size={24} />
        </button>
        <Logo />
        <div className="header-search only-desktop"><SearchBar /></div>
        <div className="header-actions">
          <span className="only-desktop"><LanguageSwitch /></span>
          {user ? (
            <div className="account-menu only-desktop" ref={menuRef}>
              <button className="account-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu">
                <Avatar name={user.name} color="#0a5c8c" size={30} />
                <span className="account-name">{user.name.split(' ')[0]}</span>
                <Icon name="chevronDown" size={16} />
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <Link role="menuitem" to="/account"><Icon name="user" size={16} /> {t('profile')}</Link>
                  <Link role="menuitem" to="/account/listings"><Icon name="list" size={16} /> {t('myListings')}</Link>
                  <Link role="menuitem" to="/account/saved"><Icon name="heart" size={16} /> {t('savedListings')}</Link>
                  <Link role="menuitem" to="/account/settings"><Icon name="settings" size={16} /> {t('settings')}</Link>
                  <button role="menuitem" onClick={doLogout}><Icon name="logout" size={16} /> {t('logout')}</button>
                </div>
              )}
            </div>
          ) : (
            <span className="auth-links only-desktop">
              <Link to="/login">{t('login')}</Link>
              <span aria-hidden="true">|</span>
              <Link to="/register">{t('register')}</Link>
            </span>
          )}
          <Link to="/post" className="btn btn-accent post-btn">
            <Icon name="plus" size={18} /> <span>{t('postAd')}</span>
          </Link>
        </div>
      </div>
      <div className="container only-mobile mobile-search"><SearchBar /></div>
      <nav className="category-strip only-desktop" aria-label={t('categories')}>
        <div className="container">
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/c/${c.slug}`}>{p(c.name)}</NavLink>
          ))}
        </div>
      </nav>

      {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} />}
      <aside className={`drawer ${drawer ? 'open' : ''}`} aria-hidden={!drawer} aria-label={t('menu')}>
        <div className="drawer-head">
          <Logo />
          <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu"><Icon name="x" size={24} /></button>
        </div>
        <div className="drawer-section">
          {user ? (
            <>
              <div className="drawer-user"><Avatar name={user.name} color="#0a5c8c" size={40} /> <strong>{user.name}</strong></div>
              <Link to="/account"><Icon name="user" size={18} /> {t('myAccount')}</Link>
              <Link to="/account/listings"><Icon name="list" size={18} /> {t('myListings')}</Link>
              <Link to="/account/saved"><Icon name="heart" size={18} /> {t('savedListings')}</Link>
              <Link to="/account/settings"><Icon name="settings" size={18} /> {t('settings')}</Link>
              <button onClick={doLogout}><Icon name="logout" size={18} /> {t('logout')}</button>
            </>
          ) : (
            <div className="drawer-auth">
              <Link to="/login" className="btn btn-primary">{t('login')}</Link>
              <Link to="/register" className="btn btn-outline">{t('register')}</Link>
            </div>
          )}
        </div>
        <div className="drawer-section">
          <h4>{t('categories')}</h4>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/c/${c.slug}`}><Icon name={c.icon} size={18} /> {p(c.name)}</Link>
          ))}
        </div>
        <div className="drawer-section">
          <h4>{t('locations')}</h4>
          {MAJOR_PROVINCES.map((slug) => (
            <Link key={slug} to={`/l/${slug}`}><Icon name="pin" size={18} /> {p(provinceBySlug(slug)!.name)}</Link>
          ))}
          <Link to="/locations"><Icon name="grid" size={18} /> {t('viewAll')}</Link>
        </div>
        <div className="drawer-section"><h4>{t('language')}</h4><LanguageSwitch /></div>
      </aside>
    </header>
  );
}
