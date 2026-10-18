import React from 'react';
import {
  Boxes,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  Wrench,
  QrCode,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
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
  } = useApp();

  // Metrics
  const totalItems = equipment.length;
  const availableItems = equipment.filter((e) => e.status === 'available').length;
  const checkedOutItems = equipment.filter((e) => e.status === 'checked_out').length;
  const inMaintenanceItems = equipment.filter((e) => e.status === 'in_maintenance').length;
  const reservedItems = equipment.filter((e) => e.status === 'reserved').length;

  const totalValue = equipment.reduce((sum, item) => sum + item.replacementCost, 0);
  const checkoutRate = totalItems > 0 ? Math.round((checkedOutItems / totalItems) * 100) : 0;
  
  const isRequesterUser = currentUser.role === 'requester' || !hasPermission('can_approve_requests');
  const isUserRequest = (r: any) => {
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userName = currentUser.name?.toLowerCase().trim();
    const userDept = currentUser.department?.toLowerCase().trim();
    return (
      (userEmail && r.requesterEmail?.toLowerCase().trim() === userEmail) ||
      (userName && r.requesterName?.toLowerCase().trim() === userName) ||
      (r.requesterId && r.requesterId === currentUser.id) ||
      (userDept && r.requesterDept?.toLowerCase().trim() === userDept)
    );
  };

  const userScopedRequests = isRequesterUser ? requests.filter(isUserRequest) : requests;
  const pendingRequests = userScopedRequests.filter((r) => r.status === 'pending');
  const overdueMaintenance = maintenanceTasks.filter((m) => m.status === 'overdue');

  // Days of week utilization cycle
  const utilizationDays = [
    { day: 'Mon', percent: 18, checkouts: 3, label: 'Teardown' },
    { day: 'Tue', percent: 25, checkouts: 4, label: 'Studio Shoots' },
    { day: 'Wed', percent: 55, checkouts: 9, label: 'Midweek Rehearsal' },
    { day: 'Thu', percent: 40, checkouts: 6, label: 'Tech Prep' },
    { day: 'Fri', percent: 65, checkouts: 11, label: 'Youth Ministry' },
    { day: 'Sat', percent: 78, checkouts: 14, label: 'Soundcheck' },
    { day: 'Sun', percent: 94, checkouts: 18, label: 'Sunday Worship' },
  ];

  // Category distribution
  const categoriesCount = equipment.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-12">
      {/* Header Welcome Bar */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Grace Community Church</span>
              <span aria-hidden="true">·</span>
              <span>Media & Production Operations</span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Hello, {currentUser.name}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {currentUser.role === 'administrator' && 'Full administrator control over gear deployments, requisition approvals, and inventory audits.'}
              {currentUser.role === 'staff' && 'Ministry staff workspace: Active gear checkout, maintenance tracking, and audit operations.'}
              {currentUser.role === 'volunteer' && 'Volunteer tech workspace: Scan asset QR codes for services and perform walk-around audits.'}
              {currentUser.role === 'requester' && 'Requisition workspace: Submit and edit gear requests for your upcoming ministries.'}
            </p>
          </div>

          {/* Direct Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {(hasPermission('can_checkout_checkin') || hasPermission('can_perform_audits')) && (
              <button
                onClick={onOpenScanner}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Scan Equipment</span>
              </button>
            )}
            <button
              onClick={onOpenNewRequest}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" />
              <span>New Requisition</span>
            </button>
            {(hasPermission('can_manage_equipment') || hasPermission('can_manage_master_data')) && (
              <button
                onClick={onOpenPrintLabels}
                className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <span>Print QR Sheets</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (Single-Elevation, hairline borders, tabular numerals) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Assets */}
        <div
          onClick={() => onNavigate('catalog')}
          className="group cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Total Assets</span>
            <Boxes className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white sm:text-3xl">
              {totalItems}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {availableItems} ready
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Audio, Video, Lighting & Rigging
          </p>
        </div>

        {/* Current Deployment Rate */}
        <div
          onClick={() => {
            if (canAccessTab('reports')) onNavigate('reports');
          }}
          className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition shadow-xs ${
            canAccessTab('reports') ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Active Deployment</span>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white sm:text-3xl">
              {checkoutRate}%
            </span>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              {checkedOutItems} deployed
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${checkoutRate}%` }}
            />
          </div>
        </div>

        {/* Pending Requests & Approvals */}
        <div
          onClick={() => onNavigate('requests')}
          className="group cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">{isRequesterUser ? 'My Requisitions' : 'Pending Approvals'}</span>
            <FileCheck2 className={`h-4 w-4 ${pendingRequests.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white sm:text-3xl">
              {pendingRequests.length}
            </span>
            <span className={`text-xs font-medium ${pendingRequests.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {pendingRequests.length > 0 ? (isRequesterUser ? 'Pending review' : 'Awaiting action') : 'All clear'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {isRequesterUser ? `${userScopedRequests.length} total request(s)` : 'Workflow authorization queue'}
          </p>
        </div>

        {/* Maintenance / Overdue */}
        <div
          onClick={() => {
            if (canAccessTab('maintenance')) onNavigate('maintenance');
          }}
          className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition shadow-xs ${
            canAccessTab('maintenance') ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Maintenance Alerts</span>
            <AlertTriangle className={`h-4 w-4 ${overdueMaintenance.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white sm:text-3xl">
              {inMaintenanceItems + overdueMaintenance.length}
            </span>
            <span className={`text-xs font-medium ${overdueMaintenance.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {overdueMaintenance.length > 0 ? `${overdueMaintenance.length} overdue` : 'System healthy'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Sensor, RF & cable health
          </p>
        </div>
      </div>

      {/* Pending Requisitions Action Alert */}
      {pendingRequests.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileCheck2 className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                  {isRequesterUser
                    ? `${pendingRequests.length} Requisition${pendingRequests.length > 1 ? 's' : ''} Pending Authorization`
                    : `${pendingRequests.length} Pending Equipment Request${pendingRequests.length > 1 ? 's' : ''} Awaiting Review`}
                </h4>
                <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300/80">
                  {isRequesterUser
                    ? `Your requisition for "${pendingRequests[0].programName}" is pending authorization. You can edit dates, location, or requested gear.`
                    : `${pendingRequests[0].requesterName} (${pendingRequests[0].requesterDept}) requested gear for "${pendingRequests[0].programName}".`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasPermission('can_approve_requests') && (
                <button
                  onClick={() => approveRequest(pendingRequests[0].id, 'Authorized via Dashboard')}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Quick Approve
                </button>
              )}
              <button
                onClick={() => onNavigate('requests')}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {isRequesterUser ? 'View & Edit' : 'Review Queue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Status Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Utilization Cycle */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Weekly Utilization Cycle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Equipment demand across rehearsals, youth nights, and weekend worship
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">Peak: Sunday 94%</span>
            </div>
          </div>

          {/* Bar Graph */}
          <div className="mt-6">
            <div className="grid grid-cols-7 gap-2 items-end min-h-48 pt-4 pb-2">
              {utilizationDays.map((item) => {
                const isSunday = item.day === 'Sun';
                return (
                  <div key={item.day} className="flex flex-col items-center justify-end group">
                    <span className="text-[10px] text-slate-500 font-mono tabular-nums mb-1">
                      {item.percent}%
                    </span>
                    <div className="w-full max-w-[32px] bg-slate-100 dark:bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-32">
                      <div
                        className={`w-full transition-all duration-300 ${
                          isSunday
                            ? 'bg-indigo-600'
                            : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500/70'
                        }`}
                        style={{ height: `${item.percent}%` }}
                      />
                    </div>
                    <span className={`mt-2 text-xs font-semibold ${isSunday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {item.day}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block text-center leading-tight truncate w-full">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Sanctuary & Youth Chapel Broadcast Cycle</span>
            </div>
            {canAccessTab('reports') && (
              <button
                onClick={() => onNavigate('reports')}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                <span>Full Reports</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Asset Status Breakdown */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Status Breakdown</h3>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">{totalItems} Total</span>
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Available (In Storage)</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">{availableItems}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(availableItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Checked Out (In Use)</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">{checkedOutItems}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${(checkedOutItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Reserved for Programs</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">{reservedItems}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(reservedItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">In Maintenance / Servicing</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">{inMaintenanceItems}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(inMaintenanceItems / totalItems) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Catalog valuation */}
            <div className="mt-6 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">Total Catalog Value</span>
              <span className="text-xs font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                £{totalValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onNavigate('catalog')}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Browse Equipment Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Audit Trail & Category Inventory */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Audit Trail */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Audit Trail</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Verified log of checkouts, returns, and maintenance</p>
            </div>
            {canAccessTab('reports') && (
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                All Logs
              </button>
            )}
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {auditLogs.slice(0, 5).map((log) => {
              return (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {log.assetName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        ({log.assetId})
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                      {log.details}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{log.userName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{log.userRole}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{log.programOrEvent}</span>
                      {log.offlineGenerated && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Offline Sync</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Categories</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory balance by production discipline</p>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {Object.entries(categoriesCount).map(([category, count]) => (
              <div
                key={category}
                onClick={() => onNavigate('catalog')}
                className="py-2 flex items-center justify-between text-xs cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <span className="text-slate-700 dark:text-slate-300 font-medium">{category}</span>
                <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 font-semibold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
