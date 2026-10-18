import React, { useState } from 'react';
import {
  Menu,
  Bell,
  RefreshCw,
  CheckCircle2,
  QrCode,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';

interface TopHeaderProps {
  activeTab: ActiveTab;
  isCollapsed: boolean;
  onOpenMobileMenu: () => void;
  onOpenScanner: () => void;
  onOpenNotifications: () => void;
  onOpenNewRequest: () => void;
  onOpenUserModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  isCollapsed,
  onOpenMobileMenu,
  onOpenScanner,
  onOpenNotifications,
  onOpenNewRequest,
  onOpenUserModal,
}) => {
  const {
    currentUser,
    isOnline,
    pendingOfflineAudits,
    syncPendingAudits,
    unreadNotificationsCount,
    hasPermission,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  const handleSync = async () => {
    if (pendingOfflineAudits.length === 0 || !isOnline) return;
    setIsSyncing(true);
    try {
      await syncPendingAudits();
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Operations Dashboard';
      case 'catalog':
        return 'Equipment & Asset Catalog';
      case 'requests':
        return currentUser.role === 'requester' ? 'My Requisitions' : 'Program Requisitions';
      case 'maintenance':
        return 'Preventive Maintenance';
      case 'audit':
        return 'Walk-Around Audit';
      case 'reports':
        return 'Asset Utilization Reports';
      case 'admin':
        return 'System Administration';
      default:
        return 'Workspace';
    }
  };

  return (
    <header
      className={`sticky top-0 z-20 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md transition-all duration-200 ${
        isCollapsed ? 'md:pl-16' : 'md:pl-60'
      }`}
    >
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Contextual Title / Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
              Sanctuary
            </span>
            <span className="hidden sm:inline" aria-hidden="true">/</span>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right Zone: Offline Sync, Quick Actions, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pending Offline Sync Button */}
          {pendingOfflineAudits.length > 0 && (
            <button
              onClick={handleSync}
              disabled={!isOnline || isSyncing}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                isOnline
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-70'
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-mono tabular-nums">{pendingOfflineAudits.length}</span>
              <span className="hidden sm:inline">Sync Pending</span>
            </button>
          )}

          {showSyncSuccess && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Synced</span>
            </div>
          )}

          {/* New Requisition quick button in header on desktop */}
          <button
            onClick={onOpenNewRequest}
            title="New Equipment Requisition"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Requisition</span>
          </button>

          {/* Quick Scanner */}
          <button
            onClick={onOpenScanner}
            title="Scan Asset QR Code"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            title="Notifications"
            className="relative p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-mono font-bold text-white tabular-nums">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Mini Trigger */}
          <button
            onClick={onOpenUserModal}
            title={`Logged in as ${currentUser.name} (${currentUser.role})`}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px]">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
              {currentUser.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
