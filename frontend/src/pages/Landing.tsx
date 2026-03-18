import { useLogto } from '@logto/react';
import { useTranslation } from 'react-i18next';

const features = [
  {
    icon: 'M4 7h16M4 7V5a1 1 0 011-1h14a1 1 0 011 1v2M4 7l1 12a2 2 0 002 2h10a2 2 0 002-2l1-12',
    titleKey: 'landing.featureKitchen',
    descKey: 'landing.featureKitchenDesc',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    titleKey: 'landing.featureRecipes',
    descKey: 'landing.featureRecipesDesc',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
    titleKey: 'landing.featureAI',
    descKey: 'landing.featureAIDesc',
    color: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
  },
  {
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
    titleKey: 'landing.featureGrocery',
    descKey: 'landing.featureGroceryDesc',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
    titleKey: 'landing.featureScan',
    descKey: 'landing.featureScanDesc',
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    titleKey: 'landing.featureSpending',
    descKey: 'landing.featureSpendingDesc',
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50 dark:bg-teal-500/10',
  },
];

export default function Landing() {
  const { signIn } = useLogto();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('de') ? 'de' : 'en';
  const toggleLang = () => {
    const next = currentLang === 'de' ? 'en' : 'de';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                <path d="M10 22C10 22 11 25 16 25C21 25 22 22 22 22L21 20H11Z" fill="white" opacity="0.95"/>
                <rect x="9" y="19" width="14" height="2.5" rx="1.25" fill="white"/>
                <line x1="16" y1="19" x2="16" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M16 14C14 12 10 11.5 9 13C8 14.5 10 16.5 16 14" fill="white" opacity="0.9"/>
                <path d="M16 11.5C18 9.5 22 9 23 10.5C24 12 22 14 16 11.5" fill="white" opacity="0.9"/>
                <circle cx="16" cy="9.5" r="1.5" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">HomeBud</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="px-2 py-1.5 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              {currentLang === 'de' ? 'EN' : 'DE'}
            </button>
            <button
              onClick={() => signIn(`${window.location.origin}/callback`)}
              className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              {t('nav.signIn')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-6">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          {t('landing.badge')}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1]">
          {t('landing.heroTitle1')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
            {t('landing.heroTitle2')}
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {t('landing.heroDescription')}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => signIn(`${window.location.origin}/callback`)}
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
          >
            {t('landing.getStarted')}
          </button>
        </div>

        {/* Hero image */}
        <div className="mt-12 sm:mt-16 relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-2xl blur-3xl -z-10" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-emerald-500/10 overflow-hidden p-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8">
              {/* Mock dashboard preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: t('landing.mockItems'), value: '24', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
                  { label: t('landing.mockExpiring'), value: '3', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20' },
                  { label: t('landing.mockRecipes'), value: '12', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20' },
                  { label: t('landing.mockSaved'), value: '€47', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-500/20' },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.bg} rounded-xl p-3 sm:p-4 text-center`}>
                    <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/60">
                    <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-500/30 rounded-full mb-2" />
                    <div className="w-2/3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
          {t('landing.featuresTitle')}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center max-w-xl mx-auto mb-10 sm:mb-14">
          {t('landing.featuresSubtitle')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f) => (
            <div
              key={f.titleKey}
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all"
            >
              <div className={`w-10 h-10 ${f.bg} rounded-lg flex items-center justify-center mb-4`}>
                <svg className={`w-5 h-5 text-transparent bg-clip-text`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <defs>
                    <linearGradient id={`grad-${f.titleKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className={f.color.split(' ')[0].replace('from-', 'text-')} />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} className={`${f.color.includes('emerald') ? 'stroke-emerald-500' : f.color.includes('amber') ? 'stroke-amber-500' : f.color.includes('purple') ? 'stroke-purple-500' : f.color.includes('blue') ? 'stroke-blue-500' : f.color.includes('rose') ? 'stroke-rose-500' : 'stroke-teal-500'}`} />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{t(f.titleKey)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t('landing.ctaTitle')}</h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-lg mx-auto mb-6">{t('landing.ctaDescription')}</p>
          <button
            onClick={() => signIn(`${window.location.origin}/callback`)}
            className="px-8 py-3.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg active:scale-[0.98]"
          >
            {t('landing.ctaButton')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5" viewBox="0 0 32 32" fill="none">
                <path d="M10 22C10 22 11 25 16 25C21 25 22 22 22 22L21 20H11Z" fill="white" opacity="0.95"/>
                <rect x="9" y="19" width="14" height="2.5" rx="1.25" fill="white"/>
                <line x1="16" y1="19" x2="16" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M16 14C14 12 10 11.5 9 13C8 14.5 10 16.5 16 14" fill="white" opacity="0.9"/>
                <path d="M16 11.5C18 9.5 22 9 23 10.5C24 12 22 14 16 11.5" fill="white" opacity="0.9"/>
                <circle cx="16" cy="9.5" r="1.5" fill="white" opacity="0.9"/>
              </svg>
            </div>
            HomeBud
          </div>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
