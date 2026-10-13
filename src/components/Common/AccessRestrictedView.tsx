import React from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab, RolePermissions } from '../../types';

interface AccessRestrictedViewProps {
  tab: ActiveTab;
  onReturnDashboard: () => void;
  onOpenUserModal: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  tab,
  onReturnDashboard,
  onOpenUserModal,
}) => {
  const { currentUser, userPermissions, availableUsers, setCurrentUser } = useApp();

  const tabDetails: Record<ActiveTab, { name: string; requiredPermission: string; desc: string }> = {
    dashboard: {
      name: 'Live Production Hub',
      requiredPermission: 'Standard Access',
      desc: 'Live church broadcast overview and telemetry.',
    },
    catalog: {
      name: 'Equipment Catalog',
      requiredPermission: 'Standard Access',
      desc: 'Browse inventory, specifications, and asset locations.',
    },
    requests: {
      name: 'Program Requests',
      requiredPermission: 'can_approve_requests',
      desc: 'Ministry equipment booking approval workflow.',
    },
    maintenance: {
      name: 'Automated Maintenance Schedules',
      requiredPermission: 'can_manage_maintenance',
      desc: 'Preventative hardware servicing, RF scanning, and repairs.',
    },
    audit: {
      name: 'Walk-Around Room Audits',
      requiredPermission: 'can_perform_audits',
      desc: 'Physical room scanning and offline asset reconciliation.',
    },
    reports: {
      name: 'Utilization & Asset Reports',
      requiredPermission: 'can_view_reports',
      desc: 'Historical check-out trends, financial valuation, and audits.',
    },
    admin: {
      name: 'Admin & System Governance',
      requiredPermission: 'can_manage_users, can_manage_roles, or can_manage_master_data',
      desc: 'Master directory management for users, roles, categories, and SQLite.',
    },
  };

  const currentTabInfo = tabDetails[tab] || {
    name: 'Restricted Section',
    requiredPermission: 'Authorized Role',
    desc: 'This application module is protected by security clearance rules.',
  };

  const adminUser = availableUsers.find(
    (u) => u.role === 'administrator' || u.roleId === 'administrator'
  );
  const staffUser = availableUsers.find(
    (u) => u.role === 'staff' || u.roleId === 'staff'
  );

  const permissionList: { key: keyof RolePermissions; label: string }[] = [
    { key: 'can_manage_users', label: 'Manage Users & Permissions' },
    { key: 'can_manage_roles', label: 'Manage Security Access Roles' },
    { key: 'can_manage_master_data', label: 'Manage Categories, Locations & Departments' },
    { key: 'can_manage_equipment', label: 'Add, Edit & Retire Assets' },
    { key: 'can_approve_requests', label: 'Authorize Equipment Requests' },
    { key: 'can_checkout_checkin', label: 'Check Out & Return Equipment' },
    { key: 'can_manage_maintenance', label: 'Manage Maintenance Schedules' },
    { key: 'can_perform_audits', label: 'Conduct Walk-Around Audits' },
    { key: 'can_view_reports', label: 'View Analytics & Utilization Reports' },
  ];

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        {/* Lock Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
          <Lock className="h-7 w-7" />
        </div>

        {/* Title */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider mb-2">
            Role Access Restricted
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {currentTabInfo.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Your current account <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()}) does not have permission to view or manage this section.
          </p>
        </div>

        {/* Permission Required Callout */}
        <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Required Security Clearance
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                This component requires <code className="font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">{currentTabInfo.requiredPermission}</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Current Role Clearance Matrix */}
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {currentUser.name}'s Active Permissions Matrix
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Role: {currentUser.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {permissionList.map((perm) => {
              const isGranted = Boolean(userPermissions[perm.key]);
              return (
                <div
                  key={perm.key}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                    isGranted
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-500/30 dark:text-emerald-300'
                      : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-500'
                  }`}
                >
                  {isGranted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />
                  )}
                  <span className={`text-[11px] truncate ${isGranted ? 'font-semibold' : ''}`}>
                    {perm.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onReturnDashboard}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>

          {adminUser && currentUser.id !== adminUser.id && (
            <button
              onClick={() => setCurrentUser(adminUser)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-sm shadow-amber-600/20 cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Switch to {adminUser.name} (Admin)</span>
            </button>
          )}

          {staffUser && currentUser.id !== staffUser.id && (
            <button
              onClick={() => setCurrentUser(staffUser)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-sm shadow-sky-600/20 cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Switch to {staffUser.name} (Staff)</span>
            </button>
          )}

          <button
            onClick={onOpenUserModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400 transition cursor-pointer"
          >
            <span>All Users</span>
          </button>
        </div>
      </div>
    </div>
  );
};
