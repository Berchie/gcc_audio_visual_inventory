import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  FileCheck2,
  Wrench,
  ClipboardList,
  BarChart3,
  QrCode,
  ShieldCheck,
  Shield,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ActiveTab } from '../types';

export type { ActiveTab };

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenUserModal?: () => void;
  onOpenNewRequest?: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenUserModal,
  onOpenNewRequest,
}) => {
  const {
    requests,
    maintenanceTasks,
    pendingOfflineAudits,
    currentUser,
    canAccessTab,
    activePermissionsCount,
    hasPermission,
  } = useApp();

  const isRequesterUser = currentUser.role === 'requester' || !hasPermission('can_approve_requests');
  const userScopedRequests = isRequesterUser
    ? requests.filter((r) => {
        const userEmail = currentUser.email?.toLowerCase().trim();
        const userName = currentUser.name?.toLowerCase().trim();
        const userDept = currentUser.department?.toLowerCase().trim();
        return (
          (userEmail && r.requesterEmail?.toLowerCase().trim() === userEmail) ||
          (userName && r.requesterName?.toLowerCase().trim() === userName) ||
          ((r as any).requesterId && (r as any).requesterId === currentUser.id) ||
          (userDept && r.requesterDept?.toLowerCase().trim() === userDept)
        );
      })
    : requests;

  const pendingRequestsCount = userScopedRequests.filter((r) => r.status === 'pending').length;
  const overdueMaintenanceCount = maintenanceTasks.filter((m) => m.status === 'overdue').length;

  const allTabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'catalog',
      label: 'Equipment & Assets',
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      id: 'requests',
      label: 'Program Requests',
      icon: <FileCheck2 className="h-4 w-4" />,
      badge: pendingRequestsCount,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: <Wrench className="h-4 w-4" />,
      badge: overdueMaintenanceCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'audit',
      label: 'Walk-Around Audit',
      icon: <ClipboardList className="h-4 w-4" />,
      badge: pendingOfflineAudits.length > 0 ? pendingOfflineAudits.length : undefined,
      badgeColor: 'bg-sky-500 text-slate-950',
    },
    {
      id: 'reports',
      label: 'Utilization Reports',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: 'admin',
      label: 'Admin & Governance',
      icon: <ShieldCheck className="h-4 w-4 text-amber-500" />,
    },
  ];

  // Strictly enforce role-based access: only render tabs the current user has access to
  const permittedTabs = allTabs.filter((tab) => canAccessTab(tab.id));

  const getRoleColorBadge = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
      case 'staff':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30';
      case 'volunteer':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
      case 'requester':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <>
      {/* Desktop / Tablet Sub-Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hidden md:block backdrop-blur-xs transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex-1 min-w-0 flex space-x-1 py-1.5 overflow-x-auto scrollbar-none">
            {permittedTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        tab.badgeColor || 'bg-slate-700 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Role Access Indicator Pill */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 py-1.5">
            <button
              onClick={onOpenUserModal}
              title={`Role: ${currentUser.role.toUpperCase()} • ${activePermissionsCount} of 9 permissions granted. Click to view or switch role.`}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${getRoleColorBadge(
                currentUser.role
              )}`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="capitalize">{currentUser.roleName || currentUser.role}</span>
              <span className="text-[10px] opacity-75">
                • {activePermissionsCount}/9 perms
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg md:hidden">
        <div className={`grid items-center px-1 py-1.5 ${
          permittedTabs.length <= 4 ? 'grid-cols-4' : 'grid-cols-5'
        }`}>
          {/* Always Dashboard */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center py-1 text-[10px] font-medium transition cursor-pointer ${
              activeTab === 'dashboard' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mb-0.5" />
            <span>Overview</span>
          </button>

          {/* Catalog */}
          <button
            onClick={() => onTabChange('catalog')}
            className={`flex flex-col items-center justify-center py-1 text-[10px] font-medium transition cursor-pointer ${
              activeTab === 'catalog' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Boxes className="h-5 w-5 mb-0.5" />
            <span>Catalog</span>
          </button>

          {/* Center Scan / Action Button: Scan if permitted, else Quick Request if requester */}
          <div className="flex justify-center -mt-5">
            {(hasPermission('can_checkout_checkin') || hasPermission('can_perform_audits')) ? (
              <button
                onClick={onOpenScanner}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/40 border-2 border-white dark:border-slate-950 active:scale-95 transition cursor-pointer"
                aria-label="Scan Barcode"
                title="Scan Equipment"
              >
                <QrCode className="h-6 w-6" />
              </button>
            ) : (
              <button
                onClick={onOpenNewRequest || (() => onTabChange('requests'))}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/40 border-2 border-white dark:border-slate-950 active:scale-95 transition cursor-pointer"
                aria-label="Request Equipment"
                title="Request Equipment"
              >
                <FileCheck2 className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Requests */}
          <button
            onClick={() => onTabChange('requests')}
            className={`relative flex flex-col items-center justify-center py-1 text-[10px] font-medium transition cursor-pointer ${
              activeTab === 'requests' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileCheck2 className="h-5 w-5 mb-0.5" />
            <span>Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute top-0 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-slate-950">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {/* 5th slot: Audit if permitted, else Reports if permitted, else Admin if permitted */}
          {canAccessTab('audit') ? (
            <button
              onClick={() => onTabChange('audit')}
              className={`relative flex flex-col items-center justify-center py-1 text-[10px] font-medium transition cursor-pointer ${
                activeTab === 'audit' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ClipboardList className="h-5 w-5 mb-0.5" />
              <span>Audit</span>
              {pendingOfflineAudits.length > 0 && (
                <span className="absolute top-0 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-slate-950">
                  {pendingOfflineAudits.length}
                </span>
              )}
            </button>
          ) : canAccessTab('reports') ? (
            <button
              onClick={() => onTabChange('reports')}
              className={`flex flex-col items-center justify-center py-1 text-[10px] font-medium transition cursor-pointer ${
                activeTab === 'reports' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <BarChart3 className="h-5 w-5 mb-0.5" />
              <span>Reports</span>
            </button>
          ) : canAccessTab('admin') ? (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex flex-col items-center justify-center py-1 text-[10px] font-medium transition cursor-pointer ${
                activeTab === 'admin' ? 'text-amber-500 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="h-5 w-5 mb-0.5" />
              <span>Admin</span>
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
};

