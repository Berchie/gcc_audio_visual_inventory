import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  MapPin,
  Clock,
  User,
  Mail,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Sparkles,
  FileText,
  Radio,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { EquipmentRequest } from '../../types';
import { useApp } from '../../context/AppContext';

interface RequestDetailModalProps {
  request: EquipmentRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAuthorize?: (requestId: string, notes?: string) => void;
  onDecline?: (requestId: string, notes?: string) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onAuthorize,
  onDecline,
}) => {
  const { equipment, currentUser, hasPermission } = useApp();
  const [copied, setCopied] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [managerNotes, setManagerNotes] = useState('');

  if (!isOpen || !request) return null;

  const canAuthorize = hasPermission('can_approve_requests');

  // Retrieve full equipment details for all requested asset IDs
  const requestedItems = request.requestedAssetIds.map((id) => {
    const item = equipment.find((e) => e.id === id);
    return {
      id,
      item,
    };
  });

  const totalValue = requestedItems.reduce((acc, { item }) => {
    return acc + (item?.replacementCost || 0);
  }, 0);

  const hasConflict = requestedItems.some(
    ({ item }) => item?.status === 'in_maintenance' || item?.status === 'checked_out'
  );

  const handleCopyId = () => {
    navigator.clipboard.writeText(request.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStartReview = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setManagerNotes(
      action === 'approve'
        ? 'Approved. Equipment checked, fully charged, and reserved for program.'
        : 'Unavailable for requested dates due to sanctuary broadcast conflict.'
    );
    setIsReviewing(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewAction === 'approve' && onAuthorize) {
      onAuthorize(request.id, managerNotes.trim());
    } else if (reviewAction === 'reject' && onDecline) {
      onDecline(request.id, managerNotes.trim());
    }
    setIsReviewing(false);
  };

  const startDateFormatted = new Date(request.startDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const endDateFormatted = new Date(request.endDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate duration in days
  const durationMs = new Date(request.endDate).getTime() - new Date(request.startDate).getTime();
  const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col transition-colors">
        
        {/* Printable Voucher Header (Only shown during print) */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                Grace Community Church
              </h1>
              <p className="text-xs font-semibold text-slate-600">
                Communications & Media Department • Technical Equipment Dispatch Voucher
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-slate-900">{request.id}</span>
              <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4 bg-slate-50 dark:bg-slate-900/90 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/10 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-500/20">
                  {request.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    request.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                      : request.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
                  }`}
                >
                  {request.status}
                </span>
                {request.urgent && (
                  <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                    Urgent Priority
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                {request.programName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyId}
              title="Copy Request ID"
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'ID'}</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print Dispatch Voucher"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <Printer className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* Quick Review Form if Manager triggered review */}
          {isReviewing && (
            <div className="rounded-xl border border-sky-300 dark:border-sky-500/40 bg-sky-50/60 dark:bg-sky-950/20 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {reviewAction === 'approve' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                  <span>
                    {reviewAction === 'approve' ? 'Authorize Requisition' : 'Decline Requisition'}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsReviewing(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Director / Manager Notes & Instructions *
                  </label>
                  <textarea
                    rows={2}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
                    placeholder="Enter instructions, handover location, or reason..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewing(false)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white transition shadow-sm ${
                      reviewAction === 'approve'
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-rose-600 hover:bg-rose-500'
                    }`}
                  >
                    Confirm {reviewAction === 'approve' ? 'Authorization' : 'Decline'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ministry & Program Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Requester & Department Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 p-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                Requester Information
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {request.requesterName}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    {request.requesterDept}
                  </span>
                  <a
                    href={`mailto:${request.requesterEmail}`}
                    className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    <span>{request.requesterEmail}</span>
                  </a>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>Submitted:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(request.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Program Schedule & Venue Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 p-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                Program Schedule & Venue
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>{request.location}</span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Pickup Date:</span>
                    <span className="font-semibold">{startDateFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Expected Return:</span>
                    <span className="font-semibold">{endDateFormatted}</span>
                  </div>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>Total Requisition Duration:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {durationDays} Day{durationDays > 1 ? 's' : ''}
                </span>
              </div>
            </div>

          </div>

          {/* Ministry Purpose & Technical Scope */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/30 p-4 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              Ministry Purpose & Technical Requisition Scope
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 italic bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 leading-relaxed">
              "{request.purpose}"
            </p>
          </div>

          {/* Requested Media Assets Manifest */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Requested Media Assets
                </span>
                <span className="rounded-full bg-sky-100 dark:bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                  {request.requestedAssetIds.length} Assets
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Total Package Value:{' '}
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    £{totalValue.toLocaleString()}
                  </span>
                </span>
                {hasConflict && request.status === 'pending' && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Conflict detected
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {requestedItems.map(({ id, item }, idx) => {
                if (!item) {
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 p-3 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-400" />
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {id}
                        </span>
                        <span className="text-slate-500">(Uncataloged Asset)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Custom request</span>
                    </div>
                  );
                }

                const isAvail = item.status === 'available' || item.status === 'reserved';

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/70 p-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shrink-0">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                              {item.id}
                            </span>
                            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600 dark:text-slate-300 capitalize">
                              {item.category.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{item.model}</p>
                        </div>
                      </div>

                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase shrink-0 ${
                          isAvail
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40'
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {item.location}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        £{item.replacementCost.toLocaleString()}
                      </span>
                    </div>

                    {item.status === 'checked_out' && (
                      <div className="rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 p-1.5 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                        <span>Currently deployed to: {item.assignedTo || 'Ministry Team'}</span>
                        <span>Due: {item.dueAt ? item.dueAt.slice(0, 10) : 'Pending Return'}</span>
                      </div>
                    )}

                    {item.status === 'in_maintenance' && (
                      <div className="rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 p-1.5 text-[10px] text-rose-800 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Asset flagged for maintenance service</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Authorization & Review Status Box */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Department Requisition Status & Audit Trail
            </span>

            {request.status === 'approved' && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Officially Authorized by {request.reviewedBy || 'Media Leadership'}</span>
                  </div>
                  {request.reviewedAt && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">
                      {new Date(request.reviewedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {request.managerNotes && (
                  <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-emerald-200 dark:border-emerald-500/30">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                      Director Instructions:
                    </span>
                    "{request.managerNotes}"
                  </div>
                )}
              </div>
            )}

            {request.status === 'rejected' && (
              <div className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    <span>Declined by {request.reviewedBy || 'Media Leadership'}</span>
                  </div>
                  {request.reviewedAt && (
                    <span className="text-xs text-rose-700 dark:text-rose-400">
                      {new Date(request.reviewedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {request.managerNotes && (
                  <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-rose-200 dark:border-rose-500/30">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                      Decline Reason:
                    </span>
                    "{request.managerNotes}"
                  </div>
                )}
              </div>
            )}

            {request.status === 'pending' && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Awaiting Church Media Department Review
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      This requisition is pending authorization before gear can be released from storage.
                    </p>
                  </div>
                </div>

                {canAuthorize && !isReviewing && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStartReview('approve')}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Authorize</span>
                    </button>
                    <button
                      onClick={() => handleStartReview('reject')}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/40 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Printable Handover Slip Section (Only in print view) */}
          <div className="hidden print:block pt-4 border-t-2 border-slate-900 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Technical Dispatch Handover Checklist
            </h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-400 text-left">
                  <th className="py-1">Asset ID</th>
                  <th className="py-1">Description / Model</th>
                  <th className="py-1">Storage Location</th>
                  <th className="py-1 text-center">Outbound Check [✓]</th>
                  <th className="py-1 text-center">Inbound Return [✓]</th>
                </tr>
              </thead>
              <tbody>
                {requestedItems.map(({ id, item }) => (
                  <tr key={id} className="border-b border-slate-200">
                    <td className="py-1.5 font-mono font-bold">{id}</td>
                    <td className="py-1.5">{item?.name || 'Uncataloged Asset'}</td>
                    <td className="py-1.5">{item?.location || '-'}</td>
                    <td className="py-1.5 text-center">[   ]</td>
                    <td className="py-1.5 text-center">[   ]</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-700">Released by (Media Team Lead):</p>
                <div className="border-b border-slate-400 pt-6"></div>
                <p className="text-[10px] text-slate-500">Sign & Date</p>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-700">Received by (Ministry Custodian):</p>
                <div className="border-b border-slate-400 pt-6"></div>
                <p className="text-[10px] text-slate-500">{request.requesterName} • Sign & Date</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between print:hidden shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Grace Community Church • Communications & Media Platform
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
