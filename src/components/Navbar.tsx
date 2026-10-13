import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Bell,
  ShieldCheck,
  UserCheck,
  Globe,
  RefreshCw,
  QrCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  onOpenScanner: () => void;
  onOpenNotifications: () => void;
  onOpenHostingGuide: () => void;
  onOpenUserModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  onOpenNotifications,
  onOpenHostingGuide,
  onOpenUserModal,
}) => {
  const {
    currentUser,
    isOnline,
    forcedOffline,
    toggleForcedOffline,
    pendingOfflineAudits,
    syncPendingAudits,
    unreadNotificationsCount,
    theme,
    toggleTheme,
    hasPermission,
  } = useApp();

  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'staff':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'volunteer':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'requester':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-xs dark:shadow-none transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <Radio className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                GCC<span className="text-sky-600 dark:text-sky-400">Media</span>
              </span>
              <span className="hidden rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 sm:inline-block border border-slate-200 dark:border-slate-700">
                PROD-HUB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Grace Community Church • Media & Comms
            </p>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline/Online Status Pill */}
          <button
            onClick={toggleForcedOffline}
            title={forcedOffline ? "Click to disable simulated offline mode" : "Click to simulate offline mode for remote walk-arounds"}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40 dark:hover:bg-emerald-900/50'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-500/40 dark:hover:bg-amber-900/50 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline font-semibold">Cloud Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold">Offline Mode</span>
              </>
            )}
          </button>

          {/* Pending Offline Audits Sync Button */}
          {pendingOfflineAudits.length > 0 && (
            <button
              onClick={handleSync}
              disabled={!isOnline || isSyncing}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition shadow-sm ${
                isOnline
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-500/40 cursor-not-allowed opacity-80'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                Sync ({pendingOfflineAudits.length})
              </span>
            </button>
          )}

          {showSyncSuccess && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Synced!</span>
            </div>
          )}

          {/* Rapid QR Scanner Trigger - Only for roles with check out or audit permissions */}
          {(hasPermission('can_checkout_checkin') || hasPermission('can_perform_audits')) && (
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-600/30 hover:bg-sky-500 active:scale-95 transition cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden md:inline">Scan QR / Barcode</span>
            </button>
          )}

          {/* Subdomain Hosting Info */}
          <button
            onClick={onOpenHostingGuide}
            title="Cloud Subdomain Deployment Guide"
            className="hidden lg:flex items-center gap-1 rounded-lg border border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>media.church.org</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-lg border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-700 p-2 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="h-4 w-4 text-sky-600 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative rounded-lg border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-700 p-2 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-indigo-300 hover:border-indigo-400 dark:border-indigo-500/50 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Current User & Role Switcher */}
          <button
            onClick={onOpenUserModal}
            className="flex items-center gap-2 rounded-lg border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 p-1.5 sm:px-2.5 transition cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-none text-slate-900 dark:text-white">
                {currentUser.name}
              </p>
              <span
                className={`mt-1 inline-block rounded border px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${getRoleBadge(
                  currentUser.role
                )}`}
              >
                {currentUser.role}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
