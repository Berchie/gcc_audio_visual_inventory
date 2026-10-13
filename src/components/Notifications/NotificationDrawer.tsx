import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRequests: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToRequests,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    approveRequest,
    currentUser,
  } = useApp();

  const [permissionState, setPermissionState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermissionState(perm);
    }
  };

  if (!isOpen) return null;

  const canAuthorize =
    currentUser.role === 'administrator' || currentUser.role === 'staff';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Media Manager Notifications</h3>
                <p className="text-xs text-slate-400">Push authorization alerts & maintenance warnings</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Web Push Permission Banner */}
          {permissionState !== 'granted' && (
            <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 flex items-center justify-between text-xs text-slate-300">
              <div>
                <span className="font-semibold text-white block">Enable Desktop / Mobile Push</span>
                <span className="text-[11px] text-slate-400">Get instant approval notifications</span>
              </div>
              <button
                onClick={handleRequestPushPermission}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
              >
                Enable
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pb-2">
            <span>{notifications.length} notifications</span>
            <button
              onClick={markAllNotificationsAsRead}
              className="text-sky-400 hover:underline font-medium"
            >
              Mark all read
            </button>
          </div>

          {/* Notifications Feed */}
          <div className="mt-3 space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {notifications.map((n) => {
              const isRequest = n.type === 'request';
              const isMaint = n.type === 'maintenance';

              return (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n.id)}
                  className={`rounded-xl border p-3.5 transition text-xs space-y-2 cursor-pointer ${
                    !n.read
                      ? 'border-sky-500/40 bg-slate-850 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          !n.read ? 'bg-sky-400 animate-pulse' : 'bg-transparent'
                        }`}
                      />
                      <span className="font-semibold text-white">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs pl-4">{n.message}</p>

                  {/* 1-Click Quick Authorize inside notification! */}
                  {isRequest && n.requestId && canAuthorize && (
                    <div className="pl-4 pt-1 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveRequest(n.requestId!, 'Quick-authorized from Notification push');
                          markNotificationAsRead(n.id);
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
                      >
                        Authorize in 1-Click
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onNavigateToRequests();
                        }}
                        className="text-[11px] text-sky-400 hover:underline"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-xs">
                No notifications right now.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Close Notification Center
          </button>
        </div>
      </div>
    </div>
  );
};
