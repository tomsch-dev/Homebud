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

  // Edit modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

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

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setActionLoading(`${editingUser.id}-edit`);
    try {
      const res = await client.patch(`/api/admin/users/${editingUser.id}`, {
        name: editName,
        email: editEmail,
      });
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? res.data : u));
      setEditingUser(null);
    } catch {}
    setActionLoading(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(`${deleteTarget.id}-delete`);
    try {
      await client.delete(`/api/admin/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
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
      <div className="grid grid-cols-2 gap-3 mb-6">
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
                <div key={user.id} className="px-4 py-3 flex items-center gap-4">
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

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      title={t('admin.editUser')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title={t('admin.deleteUser')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.editUser')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.editName')}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.editEmail')}
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={saveEdit}
                disabled={actionLoading === `${editingUser.id}-edit`}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === `${editingUser.id}-edit` ? '...' : t('admin.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.deleteConfirm')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t('admin.deleteConfirmText', { name: deleteTarget.name || deleteTarget.email || deleteTarget.id })}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading === `${deleteTarget.id}-delete`}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === `${deleteTarget.id}-delete` ? '...' : t('admin.deleteUser')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
