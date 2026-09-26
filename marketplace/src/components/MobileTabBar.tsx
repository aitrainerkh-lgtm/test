import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

export function MobileTabBar() {
  const { t } = useApp();
  return (
    <nav className="tabbar only-mobile" aria-label="Main">
      <NavLink to="/" end><Icon name="home" size={22} /><span>{t('home')}</span></NavLink>
      <NavLink to="/categories"><Icon name="grid" size={22} /><span>{t('categories')}</span></NavLink>
      <NavLink to="/post" className="tab-post"><span className="tab-post-circle"><Icon name="plus" size={24} /></span><span>{t('sell')}</span></NavLink>
      <NavLink to="/account/saved"><Icon name="heart" size={22} /><span>{t('saved')}</span></NavLink>
      <NavLink to="/account" end><Icon name="user" size={22} /><span>{t('account')}</span></NavLink>
    </nav>
  );
}
