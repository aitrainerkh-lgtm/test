import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label={`${BRAND.name} home`}>
      <span className="logo-mark" aria-hidden="true">P</span>
      <span className="logo-text">{BRAND.name}</span>
    </Link>
  );
}
