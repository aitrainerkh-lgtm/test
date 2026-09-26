import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

interface Props { listingId: string; variant?: 'icon' | 'button'; }

export function FavoriteButton({ listingId, variant = 'icon' }: Props) {
  const { isFavorite, toggleFavorite, notify, t, user } = useApp();
  const navigate = useNavigate();
  const active = isFavorite(listingId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      notify(t('loginRequired'));
      navigate(`/login?next=${encodeURIComponent(`/listing/${listingId}`)}`);
      return;
    }
    toggleFavorite(listingId);
    notify(active ? 'Removed from saved listings' : 'Saved to your list');
  };

  const label = active ? 'Remove from saved' : t('save');
  if (variant === 'button') {
    return (
      <button className={`btn btn-outline ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}>
        <Icon name="heart" filled={active} size={18} /> {active ? t('saved') : t('save')}
      </button>
    );
  }
  return (
    <button className={`fav-btn ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active} aria-label={label} title={label}>
      <Icon name="heart" filled={active} size={18} />
    </button>
  );
}
