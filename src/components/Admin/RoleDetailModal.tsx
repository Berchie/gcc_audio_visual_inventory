import React from 'react';
import {
  X,
  Shield,
  Users,
  Edit2,
  CheckCircle2,
  XCircle,
  KeyRound,
  FileCheck2,
  Boxes,
  Wrench,
  ClipboardList,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleDefinition, RolePermissions } from '../../types';

interface RoleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleDefinition | null;
  onEdit: (role: RoleDefinition) => void;
}

export const RoleDetailModal: React.FC<RoleDetailModalProps> = ({
  isOpen,
  onClose,
  role,
  onEdit,
}) => {
  const { users, hasPermission } = useApp();
  const canManageRoles = hasPermission('can_manage_roles');

  if (!isOpen || !role) return null;

  const assignedUsers = users.filter(
    (u) => u.roleId === role.id || u.role === role.id
  );

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

  const permissionItems: {
    key: keyof RolePermissions;
    label: string;
    desc: string;
    icon: any;
  }[] = [
    {
      key: 'can_manage_users',
      label: 'Users Directory Management',
      desc: 'Add, edit, delete, and reassign team member profiles',
      icon: Users,
    },
    {
      key: 'can_manage_roles',
      label: 'Security Roles & Permissions',
      desc: 'Create and configure custom permission matrixes',
      icon: Shield,
    },
    {
      key: 'can_manage_master_data',
      label: 'Master Data Governance',
      desc: 'Configure AV categories, campus locations, and ministry departments',
      icon: Boxes,
    },
    {
      key: 'can_manage_equipment',
      label: 'Equipment Inventory Catalog',
      desc: 'Register assets, barcode tags, and edit specifications',
      icon: Boxes,
    },
    {
      key: 'can_approve_requests',
      label: 'Reservation Approvals',
      desc: 'Authorize or reject departmental reservation bookings',
      icon: FileCheck2,
    },
    {
      key: 'can_checkout_checkin',
      label: 'Equipment Circulation',
      desc: 'Check out and return gear to custody storage',
      icon: KeyRound,
    },
    {
      key: 'can_manage_maintenance',
      label: 'Maintenance & Servicing',
      desc: 'Schedule repairs, track routine servicing, and sign off logs',
      icon: Wrench,
    },
    {
      key: 'can_perform_audits',
      label: 'Walk-Around Physical Audits',
      desc: 'Verify location tags and equipment condition checks',
      icon: ClipboardList,
    },
    {
      key: 'can_view_reports',
      label: 'Reports & Analytics',
      desc: 'Access utilization metrics, asset depreciation, and audits',
      icon: BarChart3,
    },
  ];

  const activePermissionsCount = Object.values(role.permissions || {}).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-amber-950/60 to-slate-900 text-white p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 font-bold border-2 border-amber-500/30">
              <Shield className="h-7 w-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white truncate">
                  {role.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${getRoleBadgeClasses(
                    role.color
                  )}`}
                >
                  {role.isSystem ? 'System Core Role' : 'Custom Role'}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                SQLite Record ID: <span className="font-mono">{role.id}</span> • {activePermissionsCount} of {permissionItems.length} permissions granted
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Role Purpose & Description
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {role.description || 'No description entered for this role.'}
            </p>
          </div>

          {/* Permissions Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Authorized Permissions ({activePermissionsCount}/{permissionItems.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Enforced by UI router & SQLite API
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {permissionItems.map((item) => {
                const isGranted = Boolean(role.permissions?.[item.key]);
                const IconComp = item.icon;

                return (
                  <div
                    key={item.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                      isGranted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isGranted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        {isGranted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Members */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Assigned Members ({assignedUsers.length})</span>
            </h3>

            {assignedUsers.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                No users are currently assigned to this role.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {assignedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {u.department} • {u.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>

          {canManageRoles && (
            <button
              onClick={() => {
                onClose();
                onEdit(role);
              }}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 transition shadow-sm cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Role & Permissions</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
