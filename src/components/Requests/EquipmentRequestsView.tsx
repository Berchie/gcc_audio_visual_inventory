import React, { useState, useMemo } from 'react';
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
  Eye,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Package,
  Pencil,
  Shield,
  Filter,
  History,
} from 'lucide-react';
import { EquipmentRequest } from '../../types';
import { useApp } from '../../context/AppContext';
import { NewRequestModal } from './NewRequestModal';
import { RequestDetailModal } from './RequestDetailModal';

export const EquipmentRequestsView: React.FC = () => {
  const { requests, approveRequest, rejectRequest, equipment, currentUser, hasPermission } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<EquipmentRequest | null>(null);
  const [modalStartInEditMode, setModalStartInEditMode] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<EquipmentRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  const canAuthorize = hasPermission('can_approve_requests');
  // Requester role or users without approval rights are limited to their requests
  const isRequesterUser = currentUser.role === 'requester' || !canAuthorize;

  // Helper to determine if a request belongs to the current logged-in user
  const isUserRequest = (r: EquipmentRequest) => {
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userName = currentUser.name?.toLowerCase().trim();
    const userDept = currentUser.department?.toLowerCase().trim();
    return (
      (userEmail && r.requesterEmail?.toLowerCase().trim() === userEmail) ||
      (userName && r.requesterName?.toLowerCase().trim() === userName) ||
      ((r as any).requesterId && (r as any).requesterId === currentUser.id) ||
      (userDept && r.requesterDept?.toLowerCase().trim() === userDept)
    );
  };

  // Base list of requests accessible to the user
  const visibleRequestsBase = useMemo(() => {
    if (isRequesterUser) {
      return requests.filter(isUserRequest);
    }
    if (scopeFilter === 'mine') {
      return requests.filter(isUserRequest);
    }
    return requests;
  }, [requests, isRequesterUser, scopeFilter, currentUser]);

  const myRequestsCount = useMemo(() => {
    return requests.filter(isUserRequest).length;
  }, [requests, currentUser]);

  const filteredRequests = useMemo(() => {
    return visibleRequestsBase.filter((r) => {
      if (filterStatus === 'all') return true;
      return r.status === filterStatus;
    });
  }, [visibleRequestsBase, filterStatus]);

  const pendingCount = visibleRequestsBase.filter((r) => r.status === 'pending').length;
  const approvedCount = visibleRequestsBase.filter((r) => r.status === 'approved').length;
  const rejectedCount = visibleRequestsBase.filter((r) => r.status === 'rejected').length;

  const handleOpenDetail = (req: EquipmentRequest) => {
    setSelectedDetailRequest(req);
    setModalStartInEditMode(false);
  };

  const handleOpenEdit = (req: EquipmentRequest) => {
    setSelectedDetailRequest(req);
    setModalStartInEditMode(true);
  };

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Authorization';
      case 'approved':
        return 'Authorized';
      case 'rejected':
        return 'Declined';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-600 dark:text-amber-400 font-semibold';
      case 'approved':
        return 'text-emerald-600 dark:text-emerald-400 font-semibold';
      case 'rejected':
        return 'text-rose-600 dark:text-rose-400 font-semibold';
      default:
        return 'text-slate-500 font-medium';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {isRequesterUser ? 'My Ministry Requisitions' : 'Program Equipment Requisitions'}
            </h1>
            {pendingCount > 0 && (
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                ({pendingCount} pending)
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {isRequesterUser
              ? 'View, track, and edit your equipment requisitions while pending authorization. All updates are logged in the audit trail.'
              : 'Approve, decline, and monitor gear requests across youth, worship, and outreach ministries.'}
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Role-based Scoping Notification / Scope Switcher */}
      {isRequesterUser ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Requester Scoped: Limited to your submissions ({visibleRequestsBase.length} requisitions)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You can edit your requisitions anytime while they remain in pending status.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 self-start sm:self-auto">
            <span>Requester: </span>
            <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong>
            <span> ({currentUser.department})</span>
          </div>
        </div>
      ) : (
        /* For Directors / Approvers: Scope Switcher */
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-600 dark:text-slate-400">Scope:</span>
            <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Ministry ({requests.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('mine')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  scopeFilter === 'mine'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                My Department ({myRequestsCount})
              </button>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Director Reviewer: <strong className="text-slate-700 dark:text-slate-300">{currentUser.name}</strong>
          </span>
        </div>
      )}

      {/* Filter Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
        {/* Status Filter Tabs (Segmented Control) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded-md px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({visibleRequestsBase.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="h-3 w-3 text-amber-500" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'approved'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Authorized ({approvedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'rejected'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <XCircle className="h-3 w-3 text-rose-500" />
            <span>Declined ({rejectedCount})</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No equipment requisitions found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isRequesterUser
              ? 'You do not have any requisitions in this filter. Click below to submit an equipment request for your upcoming ministry.'
              : `No requests found matching filter status "${filterStatus}".`}
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Requisition</span>
          </button>
        </div>
      )}

      {/* Card Form View (Zero-Pill, Single-Elevation) */}
      {viewMode === 'cards' && filteredRequests.length > 0 && (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const requestedItemsDetails = req.requestedAssetIds.map((id) =>
              equipment.find((e) => e.id === id)
            );
            const hasConflict = requestedItemsDetails.some(
              (item) => item?.status === 'in_maintenance' || item?.status === 'checked_out'
            );

            const canEditThisReq = req.status === 'pending' && (isUserRequest(req) || canAuthorize);

            return (
              <div
                key={req.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  {/* Left Column: Metadata line, Title, Purpose, Timing */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Unboxed Metadata Line with typographic separators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                        {req.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{req.requesterDept}</span>
                      <span aria-hidden="true">·</span>
                      <span className={getStatusClass(req.status)}>{getStatusText(req.status)}</span>
                      {req.urgent && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">Urgent Priority</span>
                        </>
                      )}
                      {req.lastEditedAt && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-purple-600 dark:text-purple-400 inline-flex items-center gap-1">
                            <History className="h-3 w-3" />
                            <span>Edited</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Program Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {req.programName}
                    </h3>

                    {req.purpose && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                        "{req.purpose}"
                      </p>
                    )}

                    {/* Unboxed Venue & Dates */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{req.requesterName}</span>
                      </div>
                      <span aria-hidden="true">·</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>{req.location}</span>
                      </div>
                      <span aria-hidden="true">·</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="font-mono tabular-nums">
                          {new Date(req.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' — '}
                          {new Date(req.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
                    {/* In-place edit button for pending requests */}
                    {canEditThisReq && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(req)}
                        className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Edit requisition details and requested gear"
                      >
                        <Pencil className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Edit Requisition</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(req)}
                      className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>Details & Audit</span>
                    </button>

                    {/* Authorize / Decline for leadership */}
                    {req.status === 'pending' && canAuthorize && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenReview(req, 'approve')}
                          className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                        >
                          Authorize
                        </button>
                        <button
                          onClick={() => handleOpenReview(req, 'reject')}
                          className="rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requested Gear Strip */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      Requested Items ({req.requestedAssetIds.length}):
                    </span>
                    {requestedItemsDetails.slice(0, 4).map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 tabular-nums bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/60"
                      >
                        {item?.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-3.5 w-3.5 rounded object-cover shrink-0"
                          />
                        )}
                        <span>{item ? item.name : req.requestedAssetIds[idx]}</span>
                        {idx < Math.min(requestedItemsDetails.length, 4) - 1 ? '' : ''}
                      </span>
                    ))}
                    {req.requestedAssetIds.length > 4 && (
                      <span className="text-[11px] text-slate-400">
                        +{req.requestedAssetIds.length - 4} more
                      </span>
                    )}
                  </div>

                  {hasConflict && req.status === 'pending' && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3" /> Gear overlap detected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Form View (High-Density, Tabular Numerals) */}
      {viewMode === 'table' && filteredRequests.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/80 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">ID & Program</th>
                  <th className="px-4 py-2.5">Requester</th>
                  <th className="px-4 py-2.5">Venue</th>
                  <th className="px-4 py-2.5">Schedule</th>
                  <th className="px-4 py-2.5">Gear Items</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredRequests.map((req) => {
                  const canEditThisReq = req.status === 'pending' && (isUserRequest(req) || canAuthorize);

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {req.id}
                          {req.urgent && (
                            <span className="text-rose-600 text-[10px] font-bold">Urgent</span>
                          )}
                          {req.lastEditedAt && (
                            <span className="text-purple-600 text-[10px]">Edited</span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {req.programName}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium text-slate-900 dark:text-white">{req.requesterName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{req.requesterDept}</div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className="truncate max-w-[140px] block">{req.location}</span>
                      </td>

                      <td className="px-4 py-3 align-middle font-mono tabular-nums whitespace-nowrap">
                        <div>
                          {new Date(req.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          to {new Date(req.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle font-mono tabular-nums">
                        <span>{req.requestedAssetIds.length} item(s)</span>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className={getStatusClass(req.status)}>{getStatusText(req.status)}</span>
                      </td>

                      <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEditThisReq && (
                            <button
                              onClick={() => handleOpenEdit(req)}
                              className="px-2 py-1 rounded text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(req)}
                            className="px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Confirmation Modal for Approvers */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedRequestForReview(null)}
          />
          <div className="relative w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl z-10 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {reviewAction === 'approve' ? 'Authorize Requisition' : 'Decline Requisition'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {reviewAction === 'approve'
                ? `Confirm authorization for "${selectedRequestForReview.programName}". Equipment will be flagged as reserved.`
                : `Provide reason for declining "${selectedRequestForReview.programName}".`}
            </p>

            <form onSubmit={handleConfirmReview} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Manager Authorization Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReview(null)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {reviewAction === 'approve' ? 'Confirm Authorization' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail and Edit Modal */}
      <RequestDetailModal
        request={selectedDetailRequest}
        isOpen={Boolean(selectedDetailRequest)}
        onClose={() => {
          setSelectedDetailRequest(null);
          setModalStartInEditMode(false);
        }}
        onAuthorize={(id, notes) => approveRequest(id, notes || '')}
        onDecline={(id, notes) => rejectRequest(id, notes || '')}
        startInEditMode={modalStartInEditMode}
      />

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </div>
  );
};
