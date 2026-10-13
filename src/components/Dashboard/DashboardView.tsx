import React from 'react';
import {
  Boxes,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PoundSterling,
  TrendingUp,
  FileCheck2,
  Wrench,
  QrCode,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../NavigationTabs';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenPrintLabels: () => void;
  onOpenNewRequest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenScanner,
  onOpenPrintLabels,
  onOpenNewRequest,
}) => {
  const {
    equipment,
    requests,
    maintenanceTasks,
    auditLogs,
    currentUser,
    approveRequest,
    hasPermission,
    canAccessTab,
    activePermissionsCount,
  } = useApp();

  // Metrics
  const totalItems = equipment.length;
  const availableItems = equipment.filter((e) => e.status === 'available').length;
  const checkedOutItems = equipment.filter((e) => e.status === 'checked_out').length;
  const inMaintenanceItems = equipment.filter((e) => e.status === 'in_maintenance').length;
  const reservedItems = equipment.filter((e) => e.status === 'reserved').length;

  const totalValue = equipment.reduce((sum, item) => sum + item.replacementCost, 0);
  const checkoutRate = totalItems > 0 ? Math.round((checkedOutItems / totalItems) * 100) : 0;
  
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const overdueMaintenance = maintenanceTasks.filter((m) => m.status === 'overdue');

  // Days of week utilization data (simulated authentic church schedule: Sunday peak, Midweek Wednesday rehearsal peak, Friday youth)
  const utilizationDays = [
    { day: 'Mon', percent: 18, checkouts: 3, label: 'Teardown/Rest' },
    { day: 'Tue', percent: 25, checkouts: 4, label: 'Studio Shoots' },
    { day: 'Wed', percent: 55, checkouts: 9, label: 'Midweek Rehearsal' },
    { day: 'Thu', percent: 40, checkouts: 6, label: 'Tech Prep' },
    { day: 'Fri', percent: 65, checkouts: 11, label: 'Youth Ministry' },
    { day: 'Sat', percent: 78, checkouts: 14, label: 'Soundcheck & Weddings' },
    { day: 'Sun', percent: 94, checkouts: 18, label: 'Sunday Services' },
  ];

  // Category distribution
  const categoriesCount = equipment.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  // Status donut calculation
  const totalStatus = totalItems || 1;
  const availableAngle = (availableItems / totalStatus) * 360;
  const checkedOutAngle = (checkedOutItems / totalStatus) * 360;
  const maintAngle = (inMaintenanceItems / totalStatus) * 360;
  const reservedAngle = (reservedItems / totalStatus) * 360;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Welcome & Role Callout Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/[0.04] via-transparent to-indigo-500/[0.06] dark:from-sky-500/10 dark:via-transparent dark:to-indigo-950/40 pointer-events-none" />
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 px-2.5 py-0.5 text-xs font-bold">
                <Sparkles className="h-3 w-3 text-sky-600 dark:text-sky-400" /> Live Production Hub
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Grace Community Church Communications & Broadcast
              </span>
            </div>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Hello, {currentUser.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl">
              {currentUser.role === 'administrator' && 'Full administrative authority for equipment deployments, approvals, and inventory audits.'}
              {currentUser.role === 'staff' && 'Media Staff access: Active gear checkout, maintenance tracking, and audit operations.'}
              {currentUser.role === 'volunteer' && 'Volunteer Tech access: Scan QR codes to check out gear for services and perform walk-around audits.'}
              {currentUser.role === 'requester' && 'Department requester mode: Submit and track equipment requests for programs.'}
            </p>
          </div>

          {/* Rapid Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {(hasPermission('can_checkout_checkin') || hasPermission('can_perform_audits')) && (
              <button
                onClick={onOpenScanner}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm shadow-sky-600/25 hover:from-sky-500 hover:to-indigo-500 active:scale-95 transition cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan Equipment</span>
              </button>
            )}
            <button
              onClick={onOpenNewRequest}
              className="flex items-center gap-2 rounded-xl border border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileCheck2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Request Gear</span>
            </button>
            {(hasPermission('can_manage_equipment') || hasPermission('can_manage_master_data')) && (
              <button
                onClick={onOpenPrintLabels}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>QR Tag Sheets</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Total Assets */}
        <div
          onClick={() => onNavigate('catalog')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900/80 dark:hover:bg-slate-800 p-4 transition-all shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Assets</span>
            <div className="rounded-lg bg-sky-100 dark:bg-sky-500/10 p-2 text-sky-700 dark:text-sky-400 group-hover:bg-sky-200 dark:group-hover:bg-sky-500/20 transition">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{totalItems}</span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {availableItems} ready
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Audio, Video, Lighting & Rigging
          </p>
        </div>

        {/* Current Utilization (Reports permission guarded) */}
        <div
          onClick={() => {
            if (canAccessTab('reports')) {
              onNavigate('reports');
            }
          }}
          className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 transition-all shadow-xs ${
            canAccessTab('reports')
              ? 'hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer hover:shadow-sm'
              : 'opacity-90 cursor-default'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Active Deployed</span>
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20 transition">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{checkoutRate}%</span>
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
              {checkedOutItems} deployed
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${checkoutRate}%` }}
            />
          </div>
        </div>

        {/* Pending Requests & Approvals */}
        <div
          onClick={() => onNavigate('requests')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900/80 dark:hover:bg-slate-800 p-4 transition-all shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Department Requests</span>
            <div className={`rounded-lg p-2 transition ${
              pendingRequests.length > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {pendingRequests.length}
            </span>
            <span className={`text-xs font-semibold ${pendingRequests.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {pendingRequests.length > 0 ? 'Action required' : 'All clear'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Automated approval workflow
          </p>
        </div>

        {/* Maintenance / Overdue (Guarded by Maintenance permission) */}
        <div
          onClick={() => {
            if (canAccessTab('maintenance')) {
              onNavigate('maintenance');
            }
          }}
          className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 transition-all shadow-xs ${
            canAccessTab('maintenance')
              ? 'hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer hover:shadow-sm'
              : 'opacity-90 cursor-default'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Maintenance Alerts</span>
            <div className={`rounded-lg p-2 transition ${
              overdueMaintenance.length > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            }`}>
              {overdueMaintenance.length > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {inMaintenanceItems + overdueMaintenance.length}
            </span>
            <span className={`text-xs font-semibold ${overdueMaintenance.length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {overdueMaintenance.length > 0 ? `${overdueMaintenance.length} overdue` : 'System healthy'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Sensor, RF & cable checks
          </p>
        </div>
      </div>

      {/* Urgent Action Banner if Requests are Pending */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-4 shadow-sm backdrop-blur-sm transition-colors">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 p-2 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {pendingRequests.length} Pending Equipment Request{pendingRequests.length > 1 ? 's' : ''} Awaiting Authorization
                </h4>
                <p className="mt-0.5 text-xs text-amber-900 dark:text-amber-200/80">
                  {pendingRequests[0].requesterName} from {pendingRequests[0].requesterDept} requested gear for "{pendingRequests[0].programName}".
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasPermission('can_approve_requests') && (
                <button
                  onClick={() => approveRequest(pendingRequests[0].id, 'Quick authorized via Dashboard by Manager')}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                >
                  Quick Approve
                </button>
              )}
              <button
                onClick={() => onNavigate('requests')}
                className="rounded-lg border border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white transition-colors cursor-pointer"
              >
                Review All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Utilization Trends */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm dark:shadow-lg lg:col-span-2 transition-colors">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Weekly Equipment Utilization Cycle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracking gear demand across midweeks, youth nights, and weekend worship services
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Live Services
              </span>
              <span className="text-slate-300 dark:text-slate-500">|</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">Peak: Sunday 94%</span>
            </div>
          </div>

          {/* Custom SVG / Bar Graph */}
          <div className="mt-6">
            <div className="grid grid-cols-7 gap-1 sm:gap-3 items-end min-h-52 pt-4 pb-2 px-1">
              {utilizationDays.map((item) => {
                const isSunday = item.day === 'Sun';
                return (
                  <div key={item.day} className="flex flex-col items-center justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-sky-600 dark:text-sky-300 font-mono mb-1 font-bold">
                      {item.percent}%
                    </div>
                    <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end relative h-32 sm:h-36">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isSunday
                            ? 'bg-gradient-to-t from-sky-500 via-indigo-500 to-emerald-400'
                            : 'bg-gradient-to-t from-slate-300 to-sky-500 dark:from-slate-700 dark:to-sky-500 group-hover:from-sky-600 group-hover:to-sky-400'
                        }`}
                        style={{ height: `${item.percent}%` }}
                      />
                    </div>
                    <span className={`mt-2 text-xs font-semibold ${isSunday ? 'text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {item.day}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block text-center leading-tight whitespace-normal mt-0.5 w-full">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Current Cycle: Week 41 (Sanctuary, Youth Chapel & Streaming)</span>
            </div>
            {canAccessTab('reports') && (
              <button
                onClick={() => onNavigate('reports')}
                className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold cursor-pointer"
              >
                <span>View Full Report</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Current Item Status Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm dark:shadow-lg flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Current Asset Status</h3>
              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{totalItems} Total</span>
            </div>

            {/* Visual breakdown bars */}
            <div className="mt-5 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Available (In Booth/Storage)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{availableItems}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(availableItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    Checked Out (In Use)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{checkedOutItems}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${(checkedOutItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                    Reserved for Programs
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{reservedItems}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(reservedItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    In Maintenance / Servicing
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{inMaintenanceItems}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(inMaintenanceItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Valuation stat */}
            <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/40 p-1.5 text-emerald-700 dark:text-emerald-400">
                  <PoundSterling className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catalog Valuation</span>
              </div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                £{totalValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onNavigate('catalog')}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 py-2.5 text-xs font-bold text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white shadow-xs transition-colors cursor-pointer"
            >
              Browse Full Catalog & Filter
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Audit Logs & Categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Audit Trail Feed */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm dark:shadow-lg lg:col-span-2 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Audit Trail & Usage Logs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Immutable transaction log of check-outs, returns, and maintenance</p>
            </div>
            {canAccessTab('reports') && (
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold cursor-pointer"
              >
                All Logs
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {auditLogs.slice(0, 5).map((log) => {
              const isCheckout = log.action === 'check_out';
              const isCheckin = log.action === 'check_in';
              const isMaint = log.action.includes('maintenance');

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-800/80 dark:hover:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850/60 dark:hover:bg-slate-800/60 p-3 transition-colors cursor-pointer"
                >
                  <div
                    className={`mt-0.5 rounded-lg p-2 shrink-0 ${
                      isCheckout
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
                        : isCheckin
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : isMaint
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400'
                    }`}
                  >
                    {isCheckout ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : isCheckin ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isMaint ? (
                      <Wrench className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {log.assetName}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                      {log.details}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{log.userName}</span>
                      <span>•</span>
                      <span className="capitalize">{log.userRole}</span>
                      <span>•</span>
                      <span className="truncate">{log.programOrEvent}</span>
                      {log.offlineGenerated && (
                        <span className="rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 px-1 py-0.2 text-[9px] font-bold">
                          Offline Sync
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Media Department Categories */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm dark:shadow-lg transition-colors">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Media Department Categories</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory balance by production discipline</p>
          </div>

          <div className="mt-4 space-y-2.5">
            {Object.entries(categoriesCount).map(([category, count]) => (
              <div
                key={category}
                onClick={() => onNavigate('catalog')}
                className="flex items-center justify-between rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-800/70 dark:hover:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850/50 dark:hover:bg-slate-800 p-2.5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-sky-100 dark:bg-sky-500/10 p-1.5 text-sky-700 dark:text-sky-400">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{category}</span>
                </div>
                <span className="rounded-md bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {count}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-950/20 p-3.5 text-xs text-indigo-900 dark:text-indigo-300">
            <p className="font-bold text-slate-900 dark:text-white">Need gear for this Sunday?</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Submit your program request at least 48 hours prior to allow technical rehearsal checks.
            </p>
            <button
              onClick={onOpenNewRequest}
              className="mt-2.5 block w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-1.5 text-center text-xs font-bold text-white transition cursor-pointer"
            >
              Open Request Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
