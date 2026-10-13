import React, { useState } from 'react';
import {
  Shield,
  ShieldPlus,
  Lock,
  Check,
  X,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileCheck2,
  Boxes,
  Wrench,
  BarChart3,
  ClipboardList,
  Search,
  Filter,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleDefinition, RolePermissions } from '../../types';
import { AddEditRoleModal } from './AddEditRoleModal';
import { RoleDetailModal } from './RoleDetailModal';

export const RolesManager: React.FC = () => {
  const { roles, users, deleteRole, assignUserRole, currentUser, hasPermission } = useApp();
  const canManageRoles = hasPermission('can_manage_roles');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');
  const [filterPermission, setFilterPermission] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('sanctuary_roles_view_mode') as 'cards' | 'table') || 'cards';
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleDefinition | null>(null);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<RoleDefinition | null>(null);

  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<RoleDefinition | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sanctuary_roles_view_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async (role: RoleDefinition) => {
    if (role.isSystem) {
      setFeedbackMsg({
        text: `Protected Role: System default role "${role.name}" cannot be deleted.`,
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    const assignedCount = users.filter((u) => u.roleId === role.id || u.role === role.id).length;
    if (assignedCount > 0) {
      setFeedbackMsg({
        text: `Cannot delete "${role.name}" because ${assignedCount} users are currently assigned to it. Reassign them first.`,
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    const res = await deleteRole(role.id);
    if (res.success) {
      setFeedbackMsg({ text: `Role "${role.name}" deleted successfully.`, type: 'success' });
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to delete role.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getRoleBadgeClasses = (color: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
      case 'sky':
        return 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40';
      case 'purple':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40';
      case 'rose':
        return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const permissionLabels: { key: keyof RolePermissions; label: string; icon: any }[] = [
    { key: 'can_manage_users', label: 'Users & Roles', icon: Users },
    { key: 'can_manage_master_data', label: 'Master Data', icon: Boxes },
    { key: 'can_manage_equipment', label: 'Equipment Catalog', icon: Boxes },
    { key: 'can_approve_requests', label: 'Request Approvals', icon: FileCheck2 },
    { key: 'can_checkout_checkin', label: 'Check-Out/In', icon: KeyRound },
    { key: 'can_manage_maintenance', label: 'Maintenance Log', icon: Wrench },
    { key: 'can_perform_audits', label: 'Walk Audits', icon: ClipboardList },
    { key: 'can_view_reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      role.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'system' && role.isSystem) ||
      (filterType === 'custom' && !role.isSystem);

    const matchesPermission =
      filterPermission === 'all' ||
      Boolean(role.permissions?.[filterPermission as keyof RolePermissions]);

    return matchesSearch && matchesType && matchesPermission;
  });

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

      {/* Control Bar with Search, Filters, View Switcher & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles by title, desc..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">All Roles ({roles.length})</option>
            <option value="system">System Roles</option>
            <option value="custom">Custom Roles</option>
          </select>

          {/* Permission Filter */}
          <select
            value={filterPermission}
            onChange={(e) => setFilterPermission(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">Any Permission</option>
            {permissionLabels.map((p) => (
              <option key={p.key} value={p.key}>
                Has: {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle & Create Role Button */}
        <div className="flex items-center gap-2">
          {/* Card / Table View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              aria-label="View in Card format"
              title="Card View (detailed cards with permissions matrix)"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              aria-label="View in Table format"
              title="Table View (compact table view of roles and permissions)"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          {canManageRoles && (
            <button
              onClick={() => {
                setRoleToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white hover:bg-amber-500 transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <ShieldPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Custom Role</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing {filteredRoles.length} of {roles.length} roles • Mode:{' '}
          <strong className="text-slate-700 dark:text-slate-300 capitalize">{viewMode} View</strong>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          SQLite Table: roles (WAL synced)
        </span>
      </div>

      {/* Main Content: Cards vs Table View */}
      {viewMode === 'cards' ? (
        /* ======================== CARD VIEW ======================== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoles.length === 0 ? (
            <div className="col-span-full py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400">
              No roles match your search or filter criteria.
            </div>
          ) : (
            filteredRoles.map((role) => {
              const assignedUsers = users.filter(
                (u) => u.roleId === role.id || u.role === role.id
              );

              return (
                <div
                  key={role.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold border ${getRoleBadgeClasses(
                            role.color
                          )}`}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          <span>{role.name}</span>
                        </span>
                        {role.isSystem ? (
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5">
                            System Built-in
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 rounded px-1.5 py-0.5">
                            Custom Role
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedRoleForDetail(role)}
                          title="View Role Details & Permissions Matrix"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canManageRoles && (
                          <>
                            <button
                              onClick={() => {
                                setRoleToEdit(role);
                                setIsAddModalOpen(true);
                              }}
                              title="Edit Role & Permissions"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {!role.isSystem && (
                              <button
                                onClick={() => handleDelete(role)}
                                title="Delete Custom Role"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 min-h-[32px] leading-relaxed">
                      {role.description || 'No description provided.'}
                    </p>

                    {/* Permissions Badges */}
                    <div className="mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Authorized Capabilities
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {permissionLabels.map((p) => {
                          const granted = Boolean(role.permissions?.[p.key]);
                          return (
                            <div
                              key={p.key}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border ${
                                granted
                                  ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                  : 'bg-transparent text-slate-400 dark:text-slate-600 border-transparent opacity-60'
                              }`}
                            >
                              {granted ? (
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                              ) : (
                                <X className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
                              )}
                              <span className="truncate">{p.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Users Section */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {assignedUsers.length} {assignedUsers.length === 1 ? 'user' : 'users'} assigned
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedRoleForUsers(role)}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Manage Users ({assignedUsers.length})
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ======================== TABLE VIEW ======================== */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Role & Access Level</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Permissions Active</th>
                  <th className="py-3 px-4">Assigned Members</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No roles match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => {
                    const assignedUsers = users.filter(
                      (u) => u.roleId === role.id || u.role === role.id
                    );
                    const activeCount = Object.values(role.permissions || {}).filter(Boolean).length;
                    const totalPerms = Object.keys(role.permissions || {}).length || 8;

                    return (
                      <tr
                        key={role.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Role Name */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold border ${getRoleBadgeClasses(
                              role.color
                            )}`}
                          >
                            <Shield className="h-3.5 w-3.5" />
                            <span>{role.name}</span>
                          </span>
                        </td>

                        {/* Classification */}
                        <td className="py-3 px-4">
                          {role.isSystem ? (
                            <span className="inline-block text-[10px] uppercase font-bold text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
                              System Core
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800 rounded px-1.5 py-0.5">
                              Custom Role
                            </span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-600 dark:text-slate-300 truncate" title={role.description}>
                            {role.description || '—'}
                          </p>
                        </td>

                        {/* Permissions Count & Chips */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <KeyRound className="h-3 w-3 text-amber-500" />
                            <span>{activeCount} of {totalPerms} permissions</span>
                          </span>
                        </td>

                        {/* Assigned Members */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedRoleForUsers(role)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>{assignedUsers.length} assigned</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedRoleForDetail(role)}
                              title="View Role Details & Permissions Matrix"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {canManageRoles && (
                              <>
                                <button
                                  onClick={() => {
                                    setRoleToEdit(role);
                                    setIsAddModalOpen(true);
                                  }}
                                  title="Edit Role & Permissions"
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                {!role.isSystem && (
                                  <button
                                    onClick={() => handleDelete(role)}
                                    title="Delete Custom Role"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
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
      )}

      {/* Role Assignment Modal */}
      {selectedRoleForUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Assigned Users: {selectedRoleForUsers.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quickly assign or remove church members from this role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoleForUsers(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-2">
              {users.map((u) => {
                const isAssigned = u.roleId === selectedRoleForUsers.id || u.role === selectedRoleForUsers.id;
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email} • {u.department}</div>
                    </div>
                    {isAssigned ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-800">
                        <Check className="h-3.5 w-3.5" />
                        Assigned
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          await assignUserRole(u.id, selectedRoleForUsers.id);
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-500 transition cursor-pointer shadow-2xs"
                      >
                        Assign to this Role
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRoleForUsers(null)}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Role Modal */}
      {isAddModalOpen && (
        <AddEditRoleModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setRoleToEdit(null);
          }}
          roleToEdit={roleToEdit}
        />
      )}

      {/* Role Detail Modal */}
      {selectedRoleForDetail && (
        <RoleDetailModal
          isOpen={Boolean(selectedRoleForDetail)}
          onClose={() => setSelectedRoleForDetail(null)}
          role={selectedRoleForDetail}
          onEdit={(r) => {
            setSelectedRoleForDetail(null);
            setRoleToEdit(r);
            setIsAddModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
