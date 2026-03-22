import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../hooks/useUser';
import client from '../api/client';

export default function TosGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, refresh } = useUser();
  const [accepting, setAccepting] = useState(false);

  if (!user || user.tos_accepted_at) {
    return <>{children}</>;
  }

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await client.post('/api/users/me/accept-tos');
      refresh();
    } catch {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('tos.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('tos.subtitle')}</p>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto text-sm text-gray-700 dark:text-gray-300 space-y-4">
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tos.section1Title')}</h2>
            <p>{t('tos.section1Body')}</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tos.section2Title')}</h2>
            <p>{t('tos.section2Body')}</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tos.section3Title')}</h2>
            <p>{t('tos.section3Body')}</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tos.section4Title')}</h2>
            <p>{t('tos.section4Body')}</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tos.section5Title')}</h2>
            <p>{t('tos.section5Body')}</p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-semibold min-h-[48px]"
          >
            {accepting ? t('tos.accepting') : t('tos.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
