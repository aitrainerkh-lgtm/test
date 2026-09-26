import { useApp } from '../context/AppContext';

export function LanguageSwitch() {
  const { lang, setLang, t } = useApp();
  return (
    <div className="lang-switch" role="group" aria-label={t('language')}>
      <button className={lang === 'km' ? 'active' : ''} onClick={() => setLang('km')} lang="km">ខ្មែរ</button>
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}
