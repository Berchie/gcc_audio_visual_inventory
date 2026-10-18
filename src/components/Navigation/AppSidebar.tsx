import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  FileCheck2,
  Wrench,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  QrCode,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Server,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import type { ActiveTab } from '../../types';

interface AppSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenNewRequest: () => void;
  onOpenUserModal: () => void;
  onOpenHostingGuide: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenNewRequest,
  onOpenUserModal,
  onOpenHostingGuide,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    currentUser,
    isOnline,
    forcedOffline,
    toggleForcedOffline,
    pendingOfflineAudits,
    theme,
    toggleTheme,
    requests,
    maintenanceTasks,
    canAccessTab,
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

  const navGroups = [
    {
      group: 'Core Operations',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'catalog' as ActiveTab,
          label: 'Equipment & Assets',
          icon: Boxes,
        },
        {
          id: 'requests' as ActiveTab,
          label: isRequesterUser ? 'My Requisitions' : 'Program Requests',
          icon: FileCheck2,
          count: pendingRequestsCount,
          countVariant: 'amber',
        },
      ],
    },
    {
      group: 'Logistics & Integrity',
      items: [
        {
          id: 'maintenance' as ActiveTab,
          label: 'Maintenance',
          icon: Wrench,
          count: overdueMaintenanceCount,
          countVariant: 'rose',
        },
        {
          id: 'audit' as ActiveTab,
          label: 'Walk-Around Audit',
          icon: ClipboardList,
          count: pendingOfflineAudits.length > 0 ? pendingOfflineAudits.length : undefined,
          countVariant: 'indigo',
        },
      ],
    },
    {
      group: 'Governance & Insights',
      items: [
        {
          id: 'reports' as ActiveTab,
          label: 'Utilization Reports',
          icon: BarChart3,
        },
        {
          id: 'admin' as ActiveTab,
          label: 'Admin & Access',
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrator';
      case 'staff':
        return 'Ministry Staff';
      case 'volunteer':
        return 'Production Volunteer';
      case 'requester':
        return 'Program Requester';
      default:
        return role;
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none transition-all duration-200">
      {/* Brand & Workspace Title */}
      <div className="flex items-center justify-between px-3.5 py-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs tracking-wider shadow-xs">
            GCC
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-slate-900 dark:text-white truncate tracking-tight">
                Sanctuary Operations
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Media & Production Gear
              </p>
            </div>
          )}
        </div>
        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Quick Action Button */}
      {!isCollapsed ? (
        <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            onClick={onOpenNewRequest}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Requisition</span>
          </button>
          <button
            onClick={onOpenScanner}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5 text-slate-500" />
            <span>Scan Asset QR</span>
          </button>
        </div>
      ) : (
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5">
          <button
            onClick={onOpenNewRequest}
            title="New Requisition"
            className="h-8 w-8 flex items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onOpenScanner}
            title="Scan Asset QR"
            className="h-8 w-8 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccessTab(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} className="space-y-0.5">
              {!isCollapsed && (
                <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {group.group}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!isCollapsed && item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded font-medium ${
                          item.countVariant === 'amber'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : item.countVariant === 'rose'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Card & System Controls */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-2 space-y-1.5">
        {/* User Card */}
        <div
          onClick={onOpenUserModal}
          title="Switch User Profile or View Permissions"
          className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
            {currentUser.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                {getRoleDisplayName(currentUser.role)}
              </div>
            </div>
          )}
        </div>

        {/* System Bar */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-1.5' : 'justify-between px-1'}`}>
          {/* Offline simulator */}
          <button
            onClick={toggleForcedOffline}
            title={
              forcedOffline
                ? 'Simulation: Offline mode is active. Click to return online.'
                : 'Click to simulate offline field audit operations.'
            }
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
          >
            {isOnline ? (
              <Wifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="h-3 w-3 text-amber-500" />
            )}
            {!isCollapsed && (
              <span className="text-[10px]">{isOnline ? 'Online' : 'Offline'}</span>
            )}
          </button>

          {/* Theme & Guide */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </button>
            <button
              onClick={onOpenHostingGuide}
              title="Self-Hosting & Architecture"
              className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Server className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Fixed Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 fixed left-0 top-0 bottom-0 z-30 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
