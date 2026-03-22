import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLogto } from '@logto/react';
import client from '../api/client';
import { useUser } from '../hooks/useUser';
import { useToast } from '../components/Toast';
import { SUPPORTED_CURRENCIES, currencySymbol } from '../utils/currency';

interface HouseholdData {
  id: string;
  name: string;
  invite_code: string;
  members: { user_id: string; name: string | null; email: string | null; role: string }[];
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, refresh } = useUser();
  const { signOut } = useLogto();
  const toast = useToast();

  const CURRENCIES = SUPPORTED_CURRENCIES;
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.preferred_currency || 'EUR');
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
