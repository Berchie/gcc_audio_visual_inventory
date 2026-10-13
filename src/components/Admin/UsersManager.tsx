import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Building,
  Mail,
  Phone,
  Briefcase,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  KeyRound,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';
import { AddEditUserModal } from './AddEditUserModal';
import { UserDetailModal } from './UserDetailModal';

export const UsersManager: React.FC = () => {
  const { users, roles, departments, deleteUser, assignUserRole, currentUser, hasPermission } = useApp();
  const canManageUsers = hasPermission('can_manage_users');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    return (localStorage.getItem('sanctuary_users_view_mode') as 'table' | 'cards') || 'table';
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleViewModeChange = (mode: 'table' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sanctuary_users_view_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      selectedRoleFilter === 'all' ||
      u.roleId === selectedRoleFilter ||
      u.role === selectedRoleFilter;
    const matchesDept =
      selectedDeptFilter === 'all' || u.department === selectedDeptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  const handleDelete = async (user: UserProfile) => {
    if (user.id === currentUser.id) {
      setFeedbackMsg({
        text: 'Security Protection: You cannot delete your currently active account.',
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently remove "${user.name}" (${user.email}) from SQLite database?`
      )
    ) {
      return;
    }

    setDeletingUserId(user.id);
    const res = await deleteUser(user.id);
    setDeletingUserId(null);

    if (res.success) {
      setFeedbackMsg({ text: `User "${user.name}" was successfully removed.`, type: 'success' });
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to delete user.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleRoleQuickChange = async (userId: string, newRoleId: string) => {
    const res = await assignUserRole(userId, newRoleId);
    if (res.success) {
      setFeedbackMsg({ text: 'User role & permissions updated successfully.', type: 'success' });
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to update role.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const getRoleBadgeClasses = (roleId?: string) => {
    switch (roleId) {
      case 'administrator':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
      case 'staff':
        return 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40';
      case 'volunteer':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40';
      case 'requester':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border transition animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, title..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">All Roles ({roles.length})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle & Add User Button */}
        <div className="flex items-center gap-2">
          {/* Card / Table View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              aria-label="View in Table format"
              title="Table View (compact view without email, phone, or official title)"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              aria-label="View in Card format"
              title="Card View (detailed card view with contact & position)"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Add User Button */}
          {canManageUsers && (
            <button
              onClick={() => {
                setUserToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New User</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Count Summary & View Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing {filteredUsers.length} of {users.length} registered church media members • Mode:{' '}
          <strong className="text-slate-700 dark:text-slate-300 capitalize">{viewMode} View</strong>
          {viewMode === 'table' && ' (compact without email, phone, or title)'}
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          SQLite Table: users (WAL synced)
        </span>
      </div>

      {/* View Container: Table Form vs Card Form */}
      {viewMode === 'table' ? (
        /* ======================== TABLE VIEW ========================
           NOTE: As specifically requested, in Table view, email, phone, and official title are omitted!
        */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Ministry Department</th>
                  <th className="py-3 px-4">Assigned Role & Access</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No users match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleObj = roles.find((r) => r.id === (user.roleId || user.role));
                    const isCurrent = user.id === currentUser.id;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* User Name & Avatar (In table view: NO email, NO phone, NO title!) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-2xs text-xs">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedUserForDetail(user)}
                                className="font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer text-left"
                                title="Click to view full record details"
                              >
                                {user.name}
                              </button>
                              {isCurrent && (
                                <span className="rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-1.5 py-0.2 text-[10px] font-bold border border-sky-300 dark:border-sky-800">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ministry Department (In table view: Department ONLY, NO official title!) */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {user.department}
                          </span>
                        </td>

                        {/* Assigned Role + Quick Reassign Dropdown */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${getRoleBadgeClasses(
                                user.roleId || (user.role as string)
                              )}`}
                            >
                              <Shield className="h-3 w-3" />
                              <span>{roleObj?.name || user.role}</span>
                            </span>

                            {/* Quick Role Reassignment */}
                            {canManageUsers && (
                              <select
                                value={user.roleId || (user.role as string)}
                                onChange={(e) => handleRoleQuickChange(user.id, e.target.value)}
                                title="Quickly reassign access role in SQLite"
                                className="text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    Reassign: {r.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              user.status !== 'inactive'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            <span>{user.status === 'inactive' ? 'Inactive' : 'Active'}</span>
                          </span>
                        </td>

                        {/* Actions (Detail View, Edit, Delete) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedUserForDetail(user)}
                              title="View Record Details"
                              className="flex items-center gap-1 rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50 transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="text-[11px] font-semibold hidden md:inline">Details</span>
                            </button>
                            {canManageUsers && (
                              <>
                                <button
                                  onClick={() => {
                                    setUserToEdit(user);
                                    setIsAddModalOpen(true);
                                  }}
                                  title="Edit User Profile"
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(user)}
                                  disabled={deletingUserId === user.id || isCurrent}
                                  title={isCurrent ? 'Cannot delete yourself' : 'Delete user from SQLite'}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================== CARD VIEW ========================
           Card format showing full details including official title, email, and phone!
        */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400">
              No users match your filter criteria.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const roleObj = roles.find((r) => r.id === (user.roleId || user.role));
              const isCurrent = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top: Avatar, Name, Status, Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-md text-sm">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                              {user.name}
                            </h3>
                            {isCurrent && (
                              <span className="rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-1.5 py-0.2 text-[9px] font-bold border border-sky-300 dark:border-sky-800">
                                You
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border mt-1 ${getRoleBadgeClasses(
                              user.roleId || (user.role as string)
                            )}`}
                          >
                            <Shield className="h-3 w-3" />
                            <span>{roleObj?.name || user.role}</span>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                          user.status !== 'inactive'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{user.status === 'inactive' ? 'Inactive' : 'Active'}</span>
                      </span>
                    </div>

                    {/* Official Title & Ministry Department */}
                    <div className="space-y-1 py-2 border-y border-slate-100 dark:border-slate-800/80 my-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Briefcase className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                        <span className="font-medium truncate">{user.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                        <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{user.department}</span>
                      </div>
                    </div>

                    {/* Contact Details (Email & Phone) */}
                    <div className="space-y-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700 dark:text-slate-300">{user.email}</span>
                      </div>
                      {user.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{user.phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 italic">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>No phone recorded</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Role Reassignment */}
                    {canManageUsers && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Role Access:
                        </span>
                        <select
                          value={user.roleId || (user.role as string)}
                          onChange={(e) => handleRoleQuickChange(user.id, e.target.value)}
                          className="text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 hover:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedUserForDetail(user)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>

                    {canManageUsers && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setUserToEdit(user);
                            setIsAddModalOpen(true);
                          }}
                          title="Edit User Profile"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deletingUserId === user.id || isCurrent}
                          title={isCurrent ? 'Cannot delete yourself' : 'Delete user from SQLite'}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Detail View Modal */}
      {selectedUserForDetail && (
        <UserDetailModal
          isOpen={Boolean(selectedUserForDetail)}
          onClose={() => setSelectedUserForDetail(null)}
          user={selectedUserForDetail}
          onEdit={(user) => {
            setUserToEdit(user);
            setIsAddModalOpen(true);
          }}
        />
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <AddEditUserModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setUserToEdit(null);
          }}
          userToEdit={userToEdit}
        />
      )}
    </div>
  );
};
