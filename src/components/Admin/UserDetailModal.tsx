import React from 'react';
import {
  X,
  User,
  Shield,
  Building,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  Database,
  Edit2,
  Clock,
  Activity,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile, RolePermissions } from '../../types';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onEdit: (user: UserProfile) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  onEdit,
}) => {
  const { roles, auditLogs, currentUser, hasPermission } = useApp();
  const canManageUsers = hasPermission('can_manage_users');

  if (!isOpen || !user) return null;

  const roleObj = roles.find((r) => r.id === (user.roleId || user.role));
  const isCurrent = user.id === currentUser.id;

  // Filter audit records associated with this user
  const userActivities = auditLogs
    .filter((log) => log.userId === user.id || log.userName.toLowerCase() === user.name.toLowerCase())
    .slice(0, 5);

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

  const permissionItems: { key: keyof RolePermissions; label: string; desc: string }[] = [
    { key: 'can_manage_users', label: 'User Directory Management', desc: 'Add, edit, delete, and reassign user accounts' },
    { key: 'can_manage_roles', label: 'Role & Access Control', desc: 'Define roles and customize security permissions' },
    { key: 'can_manage_master_data', label: 'Master Data Governance', desc: 'Configure categories, locations, and departments' },
    { key: 'can_manage_equipment', label: 'Equipment Catalog', desc: 'Ingest new assets, modify specs, and manage inventory' },
    { key: 'can_approve_requests', label: 'Request Approvals', desc: 'Authorize or reject ministry reservation bookings' },
    { key: 'can_checkout_checkin', label: 'Equipment Circulation', desc: 'Check out and check in production gear' },
    { key: 'can_manage_maintenance', label: 'Maintenance & Repairs', desc: 'Schedule, log, and sign off routine servicing' },
    { key: 'can_perform_audits', label: 'Physical Walk-Around Audits', desc: 'Verify item condition and location tags' },
    { key: 'can_view_reports', label: 'Analytics & Utilization', desc: 'Access departmental metrics and valuation reports' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Modal Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-lg text-xl border-2 border-white/20">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white truncate">
                  {user.name}
                </h2>
                {isCurrent && (
                  <span className="rounded bg-sky-500/30 text-sky-200 border border-sky-400/40 px-2 py-0.5 text-[10px] font-bold">
                    Current Account (You)
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                    user.status !== 'inactive'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{user.status === 'inactive' ? 'Inactive' : 'Active Account'}</span>
                </span>
              </div>

              <p className="text-xs text-sky-200/80 mt-1 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span className="font-medium">{user.title}</span>
                <span className="text-white/40">•</span>
                <span>{user.department}</span>
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${getRoleBadgeClasses(
                    user.roleId || (user.role as string)
                  )}`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Role: {roleObj?.name || user.role}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                  ID: {user.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Contact & Organizational Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-sky-500" />
              <span>Contact & Department Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <Mail className="h-3.5 w-3.5 text-sky-500" />
                  <span className="font-semibold">Email Address</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white break-all">
                  {user.email}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-semibold">Contact Phone</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {user.phone || 'Not specified'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <Building className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-semibold">Ministry Department</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {user.department}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                  <span className="font-semibold">Official Title</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {user.title}
                </div>
              </div>
            </div>
          </div>

          {/* Granular Permissions Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <span>Security Access & Permissions</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Granted via "{roleObj?.name || user.role}"
              </span>
            </div>

            {roleObj?.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 mb-3 leading-relaxed">
                {roleObj.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionItems.map((perm) => {
                const isGranted = Boolean(
                  user.role === 'administrator' ||
                  user.roleId === 'administrator' ||
                  roleObj?.permissions?.[perm.key]
                );

                return (
                  <div
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition ${
                      isGranted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-75'
                    }`}
                  >
                    {isGranted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                    )}
                    <div>
                      <div className={`font-semibold ${isGranted ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                        {perm.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {perm.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SQLite Record Metadata */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-emerald-500" />
              <span>SQLite Persistent Record Specifications</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Table</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">users</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Primary Key (id)</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{user.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Foreign Key</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">role_id: {user.roleId || user.role}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Engine Mode</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">WAL Concurrent</span>
              </div>
            </div>
          </div>

          {/* User Recent Activities in SQLite */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              <span>Recent Activity History in SQLite ({userActivities.length})</span>
            </h3>

            {userActivities.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No recent activity records logged for this user in SQLite.
              </div>
            ) : (
              <div className="space-y-2">
                {userActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-sky-500" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {act.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2 text-[11px]">
                          {act.details}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Close
          </button>

          {canManageUsers && (
            <button
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-sm cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit User Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
