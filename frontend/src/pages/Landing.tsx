import { useEffect, useRef } from 'react';
import { useLogto } from '@logto/react';
import { useTranslation } from 'react-i18next';

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0');
          el.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeIn({ children, className = '', delay = '' }: { children: React.ReactNode; className?: string; delay?: string }) {
  const ref = useFadeIn();
  return (
    <div ref={ref} className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${delay} ${className}`}>
      {children}
    </div>
  );
}

const features = [
  {
    emoji: '🗄️',
    titleKey: 'landing.featureKitchen',
    descKey: 'landing.featureKitchenDesc',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    emoji: '📷',
    titleKey: 'landing.featureScan',
    descKey: 'landing.featureScanDesc',
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
  },
  {
    emoji: '🤖',
    titleKey: 'landing.featureAI',
    descKey: 'landing.featureAIDesc',
    color: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
  },
  {
    emoji: '🛒',
    titleKey: 'landing.featureGrocery',
    descKey: 'landing.featureGroceryDesc',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    emoji: '🍽️',
    titleKey: 'landing.featureEatingOut',
    descKey: 'landing.featureEatingOutDesc',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
  },
  {
    emoji: '🔄',
    titleKey: 'landing.featureSubscriptions',
    descKey: 'landing.featureSubscriptionsDesc',
    color: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
  {
    emoji: '📊',
    titleKey: 'landing.featureSpending',
    descKey: 'landing.featureSpendingDesc',
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50 dark:bg-teal-500/10',
  },
  {
    emoji: '📖',
    titleKey: 'landing.featureRecipes',
    descKey: 'landing.featureRecipesDesc',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
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
              {currentLang === 'de' ? '🇬🇧' : '🇩🇪'}
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
        <FadeIn>
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
        </FadeIn>

        {/* Hero preview — app tabs */}
        <FadeIn>
        <div className="mt-12 sm:mt-16 relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-2xl blur-3xl -z-10" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-emerald-500/10 overflow-hidden p-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8">
              {/* Mock stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: t('landing.mockItems'), value: '24', emoji: '🗄️', bg: 'bg-emerald-100 dark:bg-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: t('landing.mockRecipes'), value: '12', emoji: '📖', bg: 'bg-amber-100 dark:bg-amber-500/20', color: 'text-amber-600 dark:text-amber-400' },
                  { label: t('landing.mockBudget'), value: '€340', emoji: '📊', bg: 'bg-blue-100 dark:bg-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
                  { label: t('landing.mockSaved'), value: '47%', emoji: '🌱', bg: 'bg-teal-100 dark:bg-teal-500/20', color: 'text-teal-600 dark:text-teal-400' },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.bg} rounded-xl p-3 sm:p-4 text-center`}>
                    <div className="text-xl mb-1">{stat.emoji}</div>
                    <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
              {/* Mock nav tabs */}
              <div className="mt-4 flex gap-2 sm:gap-3 overflow-x-auto">
                {[
                  { label: t('landing.mockTabKitchen'), emoji: '🏠', active: true },
                  { label: t('landing.mockTabRecipes'), emoji: '📖', active: false },
                  { label: t('landing.mockTabSpending'), emoji: '💰', active: false },
                ].map((tab) => (
                  <div
                    key={tab.label}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${
                      tab.active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60'
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <FadeIn>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
          {t('landing.featuresTitle')}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center max-w-xl mx-auto mb-10 sm:mb-14">
          {t('landing.featuresSubtitle')}
        </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.titleKey} delay={`delay-[${i * 75}ms]`}>
            <div
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all h-full"
            >
              <div className={`w-10 h-10 ${f.bg} rounded-lg flex items-center justify-center mb-3 text-xl`}>
                {f.emoji}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm">{t(f.titleKey)}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t(f.descKey)}</p>
            </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <FadeIn>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-10 sm:mb-14">
          {t('landing.howItWorksTitle')}
        </h2>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 max-w-3xl mx-auto">
          {[
            { step: '1', emoji: '📱', titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
            { step: '2', emoji: '📷', titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
            { step: '3', emoji: '🤖', titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
          ].map((s, i) => (
            <FadeIn key={s.step} delay={`delay-[${i * 150}ms]`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl relative">
                {s.emoji}
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{s.step}</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{t(s.titleKey)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(s.descKey)}</p>
            </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <FadeIn>
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
        </FadeIn>
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
