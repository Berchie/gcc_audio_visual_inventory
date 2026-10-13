import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Tag,
  Eye,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Package,
} from 'lucide-react';
import { EquipmentRequest } from '../../types';
import { useApp } from '../../context/AppContext';
import { NewRequestModal } from './NewRequestModal';
import { RequestDetailModal } from './RequestDetailModal';

export const EquipmentRequestsView: React.FC = () => {
  const { requests, approveRequest, rejectRequest, equipment, currentUser, hasPermission } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<EquipmentRequest | null>(null);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<EquipmentRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  const canAuthorize = hasPermission('can_approve_requests');

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleOpenReview = (req: EquipmentRequest, action: 'approve' | 'reject') => {
    setSelectedRequestForReview(req);
    setReviewAction(action);
    setReviewNotes(
      action === 'approve'
        ? 'Approved. Equipment checked and reserved for program.'
        : 'Unavailable for requested dates due to sanctuary broadcast conflict.'
    );
  };

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;

    if (reviewAction === 'approve') {
      approveRequest(selectedRequestForReview.id, reviewNotes.trim());
    } else {
      rejectRequest(selectedRequestForReview.id, reviewNotes.trim());
    }

    setSelectedRequestForReview(null);
    setReviewNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40';
      case 'approved':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40';
      case 'rejected':
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40';
      default:
        return 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Program Equipment Requests & Approvals
            </h1>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Automated workflow routing requests from Youth, Worship, Outreach, and Children's ministries
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-400 hover:to-indigo-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Department Request</span>
        </button>
      </div>

      {/* Filter Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded-lg px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>Pending Authorization ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'approved'
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Approved ({approvedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'rejected'
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <XCircle className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
            <span>Declined ({rejectedCount})</span>
          </button>
        </div>

        {/* View Mode Toggle: Cards vs Table (List) Form */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-sky-600 text-sky-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Card View"
            aria-label="Card View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Card Form</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-sky-600 text-sky-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Table View"
            aria-label="Table View"
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>List (Table Form)</span>
          </button>
        </div>
      </div>

      {/* Card Form View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            // Check conflict status for requested items
            const requestedItemsDetails = req.requestedAssetIds.map((id) =>
              equipment.find((e) => e.id === id)
            );
            const hasConflict = requestedItemsDetails.some(
              (item) => item?.status === 'in_maintenance' || item?.status === 'checked_out'
            );

            return (
              <div
                key={req.id}
                className={`rounded-2xl border p-5 transition-all duration-200 shadow-xs ${
                  req.status === 'pending'
                    ? 'border-amber-300 dark:border-amber-500/40 bg-white dark:bg-slate-900/90'
                    : req.status === 'approved'
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70'
                    : 'border-slate-200 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-900/40 opacity-85'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Left Request Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-500/20">
                        {req.id}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {req.requesterDept}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                      {req.urgent && (
                        <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                          Urgent Priority
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                      {req.programName}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                      "{req.purpose}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{req.requesterName} ({req.requesterEmail})</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{req.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>
                          {new Date(req.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} -{' '}
                          {new Date(req.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Authorization Controls & View Details Component */}
                  <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailRequest(req)}
                      className="group/btn inline-flex items-center gap-2 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/80 dark:bg-sky-950/40 px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 hover:text-sky-800 dark:hover:text-sky-200 hover:border-sky-300 dark:hover:border-sky-600 shadow-xs transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 active:scale-98"
                      title="View Request Details"
                    >
                      <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400 transition-transform group-hover/btn:scale-110" />
                      <span>View Request Details</span>
                      <ChevronRight className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>

                    {req.status === 'pending' && canAuthorize && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenReview(req, 'approve')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Authorize</span>
                        </button>
                        <button
                          onClick={() => handleOpenReview(req, 'reject')}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:border-rose-500/40 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}

                    {req.status === 'approved' && (
                      <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 text-right text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Authorized by {req.reviewedBy}
                        </span>
                        {req.managerNotes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                            "{req.managerNotes}"
                          </p>
                        )}
                      </div>
                    )}

                    {req.status === 'rejected' && (
                      <div className="rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 p-2.5 text-right text-xs">
                        <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-end gap-1">
                          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Declined by {req.reviewedBy}
                        </span>
                        {req.managerNotes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                            "{req.managerNotes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Requested Gear Badges */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Requested Media Assets ({req.requestedAssetIds.length})
                    </span>
                    {hasConflict && req.status === 'pending' && (
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Potential gear overlap detected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {requestedItemsDetails.map((item, idx) => {
                      if (!item) {
                        return (
                          <div key={idx} className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-2 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent">
                            {req.requestedAssetIds[idx]} (Uncataloged)
                          </div>
                        );
                      }
                      const isAvail = item.status === 'available' || item.status === 'reserved';
                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 p-2 text-xs flex items-center justify-between"
                        >
                          <div className="truncate mr-2">
                            <span className="font-mono text-sky-600 dark:text-sky-400 font-bold block text-[10px]">
                              {item.id}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-white truncate block">
                              {item.name}
                            </span>
                          </div>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase shrink-0 ${
                              isAvail
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table (List Form) View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/90 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">Requisition ID</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Requester & Ministry</th>
                <th className="px-4 py-3.5 min-w-[200px]">Program & Purpose</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Reserved Dates</th>
                <th className="px-4 py-3.5 min-w-[170px]">Requested Assets</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filteredRequests.map((req) => {
                const requestedItemsDetails = req.requestedAssetIds.map((id) =>
                  equipment.find((e) => e.id === id)
                );
                const hasConflict = requestedItemsDetails.some(
                  (item) => item?.status === 'in_maintenance' || item?.status === 'checked_out'
                );

                return (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Requisition ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-500/20 group-hover:border-sky-400 transition-colors">
                          {req.id}
                        </span>
                        {req.urgent && (
                          <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                            Urgent
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </td>

                    {/* Requester & Ministry */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {req.requesterName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {req.requesterEmail}
                      </div>
                      <span className="inline-block mt-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {req.requesterDept}
                      </span>
                    </td>

                    {/* Program & Purpose */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                        {req.programName}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2 mt-0.5">
                        "{req.purpose}"
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{req.location}</span>
                      </div>
                    </td>

                    {/* Reserved Dates */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(req.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                        to {new Date(req.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Requested Assets */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="font-medium text-slate-900 dark:text-white text-xs flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                          {req.requestedAssetIds.length} {req.requestedAssetIds.length === 1 ? 'Asset' : 'Assets'}
                        </span>
                        {hasConflict && req.status === 'pending' && (
                          <span className="rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-semibold px-1.5 py-0.5 flex items-center gap-1 border border-amber-300 dark:border-amber-500/40" title="Equipment conflict detected">
                            <AlertTriangle className="h-3 w-3" /> Overlap
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {requestedItemsDetails.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[120px]"
                            title={item ? `${item.id}: ${item.name}` : req.requestedAssetIds[idx]}
                          >
                            {item ? item.id : req.requestedAssetIds[idx]}
                          </span>
                        ))}
                        {req.requestedAssetIds.length > 3 && (
                          <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            +{req.requestedAssetIds.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                      {req.reviewedBy && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          by {req.reviewedBy}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailRequest(req)}
                          className="rounded-lg border border-sky-200 dark:border-sky-800/70 bg-sky-50/80 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 hover:text-sky-800 dark:hover:text-sky-200 text-sky-700 dark:text-sky-300 px-2.5 py-1.5 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                          title="View Request Details"
                        >
                          <Eye className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                          <span>View Details</span>
                        </button>
                        {req.status === 'pending' && canAuthorize && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReview(req, 'approve');
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                              title="Authorize Request"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Authorize</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReview(req, 'reject');
                              }}
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/40 px-2 py-1 transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                              title="Decline Request"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center shadow-xs">
          <FileCheck2 className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">No Requests Found</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            There are no equipment requests under the selected filter.
          </p>
        </div>
      )}

      {/* Review & Authorize Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {reviewAction === 'approve' ? 'Authorize Equipment Request' : 'Decline Request'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {reviewAction === 'approve'
                ? `You are authorizing ${selectedRequestForReview.requestedAssetIds.length} items for "${selectedRequestForReview.programName}". Managers and requester will receive push notifications.`
                : `Provide reasons for declining "${selectedRequestForReview.programName}".`}
            </p>

            <form onSubmit={handleConfirmReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Instructions / Review Notes *
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  placeholder="e.g. Approved. Pick up on Friday 4 PM at sound booth."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReview(null)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedDetailRequest}
        isOpen={!!selectedDetailRequest}
        onClose={() => setSelectedDetailRequest(null)}
        onAuthorize={(id, notes) => {
          const validNotes = notes || 'Authorized by Church Media Leadership';
          approveRequest(id, validNotes);
          setSelectedDetailRequest((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'approved',
                  reviewedBy: currentUser.name,
                  reviewedAt: new Date().toISOString(),
                  managerNotes: validNotes,
                }
              : null
          );
        }}
        onDecline={(id, notes) => {
          const validNotes = notes || 'Declined by Church Media Leadership';
          rejectRequest(id, validNotes);
          setSelectedDetailRequest((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'rejected',
                  reviewedBy: currentUser.name,
                  reviewedAt: new Date().toISOString(),
                  managerNotes: validNotes,
                }
              : null
          );
        }}
      />

      {/* New Request Modal */}
      <NewRequestModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
    </div>
  );
};
