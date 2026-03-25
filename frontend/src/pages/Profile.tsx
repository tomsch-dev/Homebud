import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLogto } from '@logto/react';
import client from '../api/client';
import { useUser } from '../hooks/useUser';
import { useToast } from '../components/Toast';
import { SUPPORTED_CURRENCIES, currencySymbol } from '../utils/currency';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

interface HouseholdData {
  id: string;
  name: string;
  invite_code: string;
  members: { user_id: string; name: string | null; email: string | null; role: string }[];
  share_food_items: boolean;
  share_grocery_trips: boolean;
  share_eating_out: boolean;
  share_subscriptions: boolean;
  share_recipes: boolean;
  share_shopping_list: boolean;
  share_calendar: boolean;
}

const SHARING_KEYS = [
  { key: 'share_food_items', emoji: '🧊', i18n: 'profile.shareFoodItems' },
  { key: 'share_grocery_trips', emoji: '🛒', i18n: 'profile.shareGroceryTrips' },
  { key: 'share_eating_out', emoji: '🍽️', i18n: 'profile.shareEatingOut' },
  { key: 'share_subscriptions', emoji: '💳', i18n: 'profile.shareSubscriptions' },
  { key: 'share_recipes', emoji: '📖', i18n: 'profile.shareRecipes' },
  { key: 'share_shopping_list', emoji: '📝', i18n: 'profile.shareShoppingList' },
  { key: 'share_calendar', emoji: '📅', i18n: 'profile.shareCalendar' },
] as const;

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, refresh } = useUser();
  const { signOut } = useLogto();
  const toast = useToast();

  const CURRENCIES = SUPPORTED_CURRENCIES;
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.preferred_currency || 'EUR');
  const [language, setLanguage] = useState(i18n.language?.startsWith('de') ? 'de' : 'en');
  const [saving, setSaving] = useState(false);
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [householdLoading, setHouseholdLoading] = useState(true);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);
  useEffect(() => { if (user?.preferred_currency) setCurrency(user.preferred_currency); }, [user?.preferred_currency]);

  useEffect(() => {
    client.get('/api/households/my')
      .then((r) => setHousehold(r.data))
      .catch(() => {})
      .finally(() => setHouseholdLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await client.patch('/api/users/me', { name, preferred_currency: currency });
      i18n.changeLanguage(language);
      localStorage.setItem('language', language);
      toast.success(t('profile.saved'));
      refresh();
    } catch { toast.error(t('profile.saveFailed')); }
    setSaving(false);
  };

  const createHousehold = async () => {
    if (!newHouseholdName.trim()) return;
    try {
      const res = await client.post('/api/households/', { name: newHouseholdName });
      setHousehold(res.data);
      setShowCreate(false);
      setNewHouseholdName('');
    } catch { toast.error(t('profile.householdError')); }
  };

  const joinHousehold = async () => {
    if (!inviteCode.trim()) return;
    try {
      const res = await client.post('/api/households/join', { invite_code: inviteCode });
      setHousehold(res.data);
      setShowJoin(false);
      setInviteCode('');
    } catch { toast.error(t('profile.invalidInvite')); }
  };

  const leaveHousehold = async () => {
    const confirmed = await toast.confirm(t('profile.leaveConfirm'));
    if (!confirmed) return;
    try {
      await client.post('/api/households/leave');
      setHousehold(null);
    } catch { toast.error(t('profile.householdError')); }
  };

  const copyInvite = () => {
    if (!household) return;
    const link = `${window.location.origin}/join?code=${household.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success(t('profile.linkCopied'));
  };

  const toggleSharing = async (key: string, value: boolean) => {
    try {
      const res = await client.patch('/api/households/settings', { [key]: value });
      setHousehold(res.data);
    } catch { toast.error(t('profile.householdError')); }
  };

  const inputClass = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-8 pb-24 lg:pb-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>

      {!user?.name && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('profile.nameRequired')}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('profile.nameRequiredHint')}</p>
        </div>
      )}

      {/* Profile */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('profile.personalInfo')}</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('profile.name')} *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder={t('profile.namePlaceholder')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('profile.preferredCurrency')}</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c} ({currencySymbol(c)})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('profile.language')}</label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  language === l.code
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving || !name.trim()}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      {/* Household */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('profile.household')}</h2>

        {householdLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : household ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{household.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{household.members.length} {t('profile.members')}</p>
              </div>
              <button onClick={copyInvite} className="px-3 py-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
                {t('profile.copyInvite')}
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
              {household.members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                      {(m.name || m.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name || m.email || m.user_id}</p>
                  </div>
                  {m.role === 'owner' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {t('profile.owner')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Sharing Settings */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/40">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('profile.sharingSettings')}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{t('profile.sharingHint')}</p>
              <div className="space-y-2">
                {SHARING_KEYS.map(({ key, emoji, i18n }) => (
                  <label key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span>{emoji}</span>
                      <span>{t(i18n)}</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={household[key as keyof HouseholdData] as boolean}
                      onClick={() => toggleSharing(key, !(household[key as keyof HouseholdData] as boolean))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        household[key as keyof HouseholdData] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        household[key as keyof HouseholdData] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={leaveHousehold} className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              {t('profile.leaveHousehold')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.noHousehold')}</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                {t('profile.createHousehold')}
              </button>
              <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {t('profile.joinHousehold')}
              </button>
            </div>

            {showCreate && (
              <div className="flex gap-2 mt-2">
                <input type="text" value={newHouseholdName} onChange={(e) => setNewHouseholdName(e.target.value)} className={inputClass} placeholder={t('profile.householdName')} />
                <button onClick={createHousehold} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 whitespace-nowrap">
                  {t('common.save')}
                </button>
              </div>
            )}

            {showJoin && (
              <div className="flex gap-2 mt-2">
                <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className={inputClass} placeholder={t('profile.inviteCodePlaceholder')} />
                <button onClick={joinHousehold} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 whitespace-nowrap">
                  {t('profile.join')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut(window.location.origin)}
        className="w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors"
      >
        {t('nav.signOut')}
      </button>
    </div>
  );
}
