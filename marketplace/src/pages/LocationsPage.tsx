import { Breadcrumbs } from '../components/Breadcrumbs';
import { LocationGrid } from '../components/LocationGrid';
import { useApp } from '../context/AppContext';

export function LocationsPage() {
  const { t } = useApp();
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: t('home'), to: '/' }, { label: t('locations') }]} />
      <h1>{t('browseByLocation')}</h1>
      <LocationGrid />
    </div>
  );
}
