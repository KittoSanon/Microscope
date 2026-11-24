import { useTranslation } from 'react-i18next';

export const LanguageSwitch = () => {
  const { i18n } = useTranslation();
  const change = (lng: 'th' | 'en') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng); // remember the choice
  };

  return (
    <div className="flex gap-1">
      {(['th', 'en'] as const).map((lng) => (
        <button
          key={lng}
          onClick={() => change(lng)}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium cursor-pointer ${
            i18n.language === lng
              ? 'border-cyan-500/50 bg-cyan-950/70 text-cyan-300'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {lng === 'th' ? 'ไทย' : 'EN'}
        </button>
      ))}
    </div>
  );
};