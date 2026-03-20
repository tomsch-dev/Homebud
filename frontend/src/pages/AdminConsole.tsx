import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../api/client';

interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  created_at: string;
  roles: string[];
  is_suspended: boolean;
}

export default function AdminConsole() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = () => {
    client.get('/api/admin/users')
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (userId: string, role: string, hasRole: boolean) => {
    setActionLoading(`${userId}-${role}`);
    try {
      const res = await client.patch(`/api/admin/users/${userId}/role`, {
        role,
        action: hasRole ? 'revoke' : 'grant',
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? res.data : u));
    } catch {}
    setActionLoading(null);
  };

  const toggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    setActionLoading(`${userId}-suspend`);
    try {
      const res = await client.patch(`/api/admin/users/${userId}/suspend`, {
        suspended: !currentlySuspended,
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? res.data : u));
    } catch {}
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('admin.totalUsers')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 p-4">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {users.filter((u) => u.roles.includes('premium')).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('admin.premiumUsers')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 p-4">
          <div className="text-2xl font-bold text-red-500">
            {users.filter((u) => u.is_suspended).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('admin.suspendedUsers')}</div>
        </div>
      </div>

      {/* Users list */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/40">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('admin.allUsers')}</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            {t('admin.noUsers')}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {users.map((user) => {
              const hasPremium = user.roles.includes('premium');
              const hasAdmin = user.roles.includes('admin');

              return (
                <div key={user.id} className={`px-4 py-3 flex items-center gap-4 ${user.is_suspended ? 'opacity-60' : ''}`}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-300">
                        {(user.name || user.email || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name || user.email || user.id}
                      </span>
                      {/* Role badges */}
                      {hasAdmin && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                          ADMIN
                        </span>
                      )}
                      {hasPremium && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          PREMIUM
                        </span>
                      )}
                      {user.is_suspended && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                          {t('admin.suspended')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email || user.id}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle premium */}
                    <button
                      onClick={() => toggleRole(user.id, 'premium', hasPremium)}
                      disabled={actionLoading === `${user.id}-premium`}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        hasPremium
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title={hasPremium ? t('admin.revokePremium') : t('admin.grantPremium')}
                    >
                      {actionLoading === `${user.id}-premium` ? '...' : (
                        hasPremium ? t('admin.revokePremium') : t('admin.grantPremium')
                      )}
                    </button>

                    {/* Suspend / Unsuspend */}
                    <button
                      onClick={() => toggleSuspend(user.id, user.is_suspended)}
                      disabled={actionLoading === `${user.id}-suspend`}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        user.is_suspended
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                      }`}
                      title={user.is_suspended ? t('admin.unsuspend') : t('admin.suspend')}
                    >
                      {actionLoading === `${user.id}-suspend` ? '...' : (
                        user.is_suspended ? t('admin.unsuspend') : t('admin.suspend')
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
