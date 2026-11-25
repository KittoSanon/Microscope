import { useTranslation } from 'react-i18next';

export default function SwitchLanguage() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('th') ? 'th' : 'en';

  const change = (lang: 'en' | 'th') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  };

  const base =
    'px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer';
  const active = 'bg-cyan-500/20 text-cyan-300 border border-cyan-400';
  const inactive =
    'text-slate-400 border border-transparent hover:text-slate-200';

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1">
      <button
        type="button"
        onClick={() => change('en')}
        className={`${base} ${current === 'en' ? active : inactive}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => change('th')}
        className={`${base} ${current === 'th' ? active : inactive}`}
      >
        TH
      </button>
    </div>
  );
}