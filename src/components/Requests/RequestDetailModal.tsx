import React, { useState, useEffect, useMemo } from 'react';
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
  Pencil,
  History,
  ArrowRight,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  Undo2,
  FileEdit,
} from 'lucide-react';
import { EquipmentRequest, RequestAuditChange, RequestFieldDiff } from '../../types';
import { useApp } from '../../context/AppContext';

interface RequestDetailModalProps {
  request: EquipmentRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAuthorize?: (requestId: string, notes?: string) => void;
  onDecline?: (requestId: string, notes?: string) => void;
  startInEditMode?: boolean;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onAuthorize,
  onDecline,
  startInEditMode = false,
}) => {
  const {
    requests,
    equipment,
    currentUser,
    hasPermission,
    updateRequest,
    departments,
    locations,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [managerNotes, setManagerNotes] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editProgramName, setEditProgramName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editUrgent, setEditUrgent] = useState(false);
  const [editAssetIds, setEditAssetIds] = useState<string[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync latest request from state
  const activeRequest = useMemo(() => {
    if (!request) return null;
    return requests.find((r) => r.id === request.id) || request;
  }, [requests, request]);

  // Sync form inputs when activeRequest changes or modal opens
  useEffect(() => {
    if (activeRequest && isOpen) {
      setEditProgramName(activeRequest.programName || '');
      setEditLocation(activeRequest.location || '');
      setEditPurpose(activeRequest.purpose || '');
      setEditDept(activeRequest.requesterDept || '');
      setEditUrgent(Boolean(activeRequest.urgent));
      setEditAssetIds(activeRequest.requestedAssetIds ? [...activeRequest.requestedAssetIds] : []);
      setChangeReason('');
      setSaveError(null);
      setSaveSuccess(false);

      // Format ISO dates to YYYY-MM-DDTHH:mm for datetime-local input
      try {
        const start = new Date(activeRequest.startDate);
        const sYear = start.getFullYear();
        const sMonth = String(start.getMonth() + 1).padStart(2, '0');
        const sDay = String(start.getDate()).padStart(2, '0');
        const sHours = String(start.getHours()).padStart(2, '0');
        const sMinutes = String(start.getMinutes()).padStart(2, '0');
        setEditStartDate(`${sYear}-${sMonth}-${sDay}T${sHours}:${sMinutes}`);
      } catch {
        setEditStartDate('');
      }

      try {
        const end = new Date(activeRequest.endDate);
        const eYear = end.getFullYear();
        const eMonth = String(end.getMonth() + 1).padStart(2, '0');
        const eDay = String(end.getDate()).padStart(2, '0');
        const eHours = String(end.getHours()).padStart(2, '0');
        const eMinutes = String(end.getMinutes()).padStart(2, '0');
        setEditEndDate(`${eYear}-${eMonth}-${eDay}T${eHours}:${eMinutes}`);
      } catch {
        setEditEndDate('');
      }

      setIsEditing(Boolean(startInEditMode && activeRequest.status === 'pending'));
    }
  }, [activeRequest, isOpen, startInEditMode]);

  // Build full chronological audit trail unconditionally before any early returns
  const fullAuditTrail: RequestAuditChange[] = useMemo(() => {
    if (!activeRequest) return [];
    if (activeRequest.auditTrail && activeRequest.auditTrail.length > 0) {
      return activeRequest.auditTrail;
    }
    return [
      {
        id: `CHG-${activeRequest.id.slice(-4)}-INIT`,
        timestamp: activeRequest.createdAt,
        editorId: (activeRequest as any).requesterId || 'usr-req',
        editorName: activeRequest.requesterName,
        editorRole: 'requester',
        action: 'created',
        summary: `Requisition initiated for ${activeRequest.programName} (${activeRequest.requestedAssetIds.length} item(s) requested)`,
      },
    ];
  }, [activeRequest]);

  if (!isOpen || !activeRequest) return null;

  const canAuthorize = hasPermission('can_approve_requests');

  // Check if current user is the requester of this request
  const isRequesterOwner =
    (currentUser.email && activeRequest.requesterEmail?.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
    (currentUser.name && activeRequest.requesterName?.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
    ((activeRequest as any).requesterId && (activeRequest as any).requesterId === currentUser.id) ||
    (currentUser.role === 'requester' && activeRequest.requesterDept?.toLowerCase().trim() === currentUser.department?.toLowerCase().trim());

  const isPending = activeRequest.status === 'pending';
  // User can edit their request while it is pending authorization
  const canEdit = isPending && (isRequesterOwner || canAuthorize);

  // Retrieve full equipment details for all requested asset IDs
  const requestedItems = activeRequest.requestedAssetIds.map((id) => {
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
    navigator.clipboard.writeText(activeRequest.id);
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
      onAuthorize(activeRequest.id, managerNotes.trim());
    } else if (reviewAction === 'reject' && onDecline) {
      onDecline(activeRequest.id, managerNotes.trim());
    }
    setIsReviewing(false);
  };

  const handleToggleAsset = (assetId: string) => {
    setEditAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProgramName.trim()) {
      setSaveError('Please enter a program or event name.');
      return;
    }
    if (editAssetIds.length === 0) {
      setSaveError('Please select at least one equipment asset for this requisition.');
      return;
    }
    if (!editStartDate || !editEndDate) {
      setSaveError('Please specify valid start and end dates.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const success = await updateRequest(
        activeRequest.id,
        {
          programName: editProgramName.trim(),
          location: editLocation.trim(),
          startDate: new Date(editStartDate).toISOString(),
          endDate: new Date(editEndDate).toISOString(),
          purpose: editPurpose.trim(),
          requesterDept: editDept,
          urgent: editUrgent,
          requestedAssetIds: editAssetIds,
        },
        changeReason.trim()
      );

      if (success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsEditing(false);
        }, 800);
      } else {
        setSaveError('Failed to save changes. Ensure request is still pending.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const startDateFormatted = new Date(activeRequest.startDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const endDateFormatted = new Date(activeRequest.endDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate duration in days
  const durationMs = new Date(activeRequest.endDate).getTime() - new Date(activeRequest.startDate).getTime();
  const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));

  // Available equipment for asset selector during edit
  const filteredCatalogEquipment = equipment.filter((eq) => {
    if (!assetSearchQuery.trim()) return true;
    const q = assetSearchQuery.toLowerCase();
    return (
      eq.name.toLowerCase().includes(q) ||
      eq.id.toLowerCase().includes(q) ||
      eq.category.toLowerCase().includes(q) ||
      eq.subCategory.toLowerCase().includes(q)
    );
  });

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
              <span className="font-mono text-sm font-bold text-slate-900">{activeRequest.id}</span>
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
                  {activeRequest.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    activeRequest.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                      : activeRequest.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
                  }`}
                >
                  {activeRequest.status}
                </span>
                {activeRequest.urgent && (
                  <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                    Urgent Priority
                  </span>
                )}
                {activeRequest.lastEditedAt && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                    <History className="h-3 w-3" />
                    <span>Edited</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                {activeRequest.programName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Requisition Button (Enabled for user when pending authorization) */}
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                title="Edit request details (pending authorization)"
                className="flex items-center gap-1.5 rounded-lg border border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 transition cursor-pointer shadow-xs"
              >
                <Pencil className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Edit Request</span>
              </button>
            )}

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

          {/* EDIT FORM (Visible when in editing mode) */}
          {isEditing ? (
            <div className="rounded-2xl border-2 border-purple-400/80 dark:border-purple-500/60 bg-purple-50/40 dark:bg-purple-950/15 p-5 space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-200 dark:border-purple-800/60">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white font-bold">
                    <FileEdit className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Edit Requisition Details
                    </h3>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Modifying request while pending authorization. All changes will be logged to the audit trail.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="self-start sm:self-auto flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Cancel Editing</span>
                </button>
              </div>

              {saveError && (
                <div className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Requisition successfully updated and recorded in audit trail!</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Program Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Program / Event Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editProgramName}
                      onChange={(e) => setEditProgramName(e.target.value)}
                      placeholder="e.g., Youth Summer Camp Kickoff, Easter Outdoor Service"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                    />
                  </div>

                  {/* Setup Venue / Location */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Setup Venue / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g., Youth Chapel Stage, Outdoor Patio, Sanctuary Balcony"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Department / Ministry *
                    </label>
                    <select
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {departments && departments.length > 0 ? (
                        departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Youth Ministry">Youth Ministry</option>
                          <option value="Children's Church">Children's Church</option>
                          <option value="Worship Team">Worship Team</option>
                          <option value="Outreach & Missions">Outreach & Missions</option>
                          <option value="Pastoral & Executive">Pastoral & Executive</option>
                          <option value="Media & Technical Arts">Media & Technical Arts</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Start Date & Time */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Equipment Pickup Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* End Date & Time */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Expected Return Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Requisition Purpose & Technical Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={editPurpose}
                    onChange={(e) => setEditPurpose(e.target.value)}
                    placeholder="Describe how the gear will be utilized and technical details..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Urgent Priority Checkbox */}
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3">
                  <input
                    type="checkbox"
                    id="editUrgentCheckbox"
                    checked={editUrgent}
                    onChange={(e) => setEditUrgent(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="editUrgentCheckbox" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Flag as <span className="text-rose-600 dark:text-rose-400 font-bold">Urgent Priority</span> (immediate technical team attention required)
                  </label>
                </div>

                {/* Equipment Asset Picker & Modification */}
                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/60 p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>Requested Equipment Items ({editAssetIds.length} Selected) *</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Tap an item to add or remove
                    </span>
                  </div>

                  {/* Selected Asset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {editAssetIds.length === 0 ? (
                      <span className="text-xs text-rose-500 italic">No equipment selected. Please select gear below.</span>
                    ) : (
                      editAssetIds.map((id) => {
                        const item = equipment.find((eq) => eq.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-500/40 px-2.5 py-1 text-xs font-semibold text-purple-900 dark:text-purple-200"
                          >
                            <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">{id}</span>
                            <span className="max-w-[160px] truncate">{item?.name || id}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleAsset(id)}
                              className="text-purple-600 hover:text-rose-600 dark:text-purple-400 dark:hover:text-rose-400 ml-1"
                              title="Remove item"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  {/* Asset Search & Catalog Quick-add */}
                  <div className="pt-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={assetSearchQuery}
                        onChange={(e) => setAssetSearchQuery(e.target.value)}
                        placeholder="Search equipment catalog to add or swap gear..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                      {filteredCatalogEquipment.slice(0, 15).map((item) => {
                        const isSelected = editAssetIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleAsset(item.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                {item.id}
                              </span>
                              <span className="truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-400">({item.category})</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-slate-500">£{item.replacementCost}</span>
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                                  <Check className="h-3.5 w-3.5" /> Added
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-purple-600">
                                  <Plus className="h-3.5 w-3.5" /> Select
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reason for Change (Logged to Audit Trail) */}
                <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1">
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                    Reason for Revision / Change Note *
                  </label>
                  <input
                    type="text"
                    required
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="e.g., Added extra wireless mic for guest speaker; adjusted setup time for soundcheck"
                    className="w-full rounded-lg border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                    This justification will be saved and displayed in the audit trail of changes below.
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-200 dark:border-purple-800/60">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isSaving ? 'Logging Changes...' : 'Save Requisition Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Quick Review Form if Manager triggered review */}
          {isReviewing && !isEditing && (
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
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  Requester Information
                </span>
                {isRequesterOwner && (
                  <span className="rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2 py-0.5 text-[10px] font-bold">
                    Your Request
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeRequest.requesterName}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    {activeRequest.requesterDept}
                  </span>
                  {activeRequest.requesterEmail && (
                    <a
                      href={`mailto:${activeRequest.requesterEmail}`}
                      className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{activeRequest.requesterEmail}</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>Originally Submitted:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(activeRequest.createdAt).toLocaleDateString('en-GB', {
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
                  <span>{activeRequest.location}</span>
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
              "{activeRequest.purpose}"
            </p>
          </div>

          {/* Requested Media Assets Manifest */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>Requested Media Assets Manifest ({requestedItems.length} Items)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total replacement coverage value: £{totalValue.toLocaleString()}
                </p>
              </div>

              {hasConflict && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Scheduling Conflict Detected</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {requestedItems.map(({ id, item }) => {
                if (!item) {
                  return (
                    <div
                      key={id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-500">{id}</span>
                        <p className="text-slate-400 text-[11px]">Uncataloged Asset / External</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/70 p-3 shadow-xs flex gap-3 items-start"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-14 w-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700/80 shrink-0 bg-slate-900"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/10 px-1.5 py-0.5 rounded">
                            {item.id}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.brand} • {item.category}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            £{item.replacementCost}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {item.location}
                          </span>
                        </div>
                      </div>

                      {item.status === 'in_maintenance' && (
                        <div className="rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 p-1.5 text-[10px] text-rose-800 dark:text-rose-300 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>Asset flagged for maintenance service</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Authorization & Review Status Box */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Department Requisition Status
            </span>

            {activeRequest.status === 'approved' && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Officially Authorized by {activeRequest.reviewedBy || 'Media Leadership'}</span>
                  </div>
                  {activeRequest.reviewedAt && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">
                      {new Date(activeRequest.reviewedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {activeRequest.managerNotes && (
                  <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-emerald-200 dark:border-emerald-500/30">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                      Director Instructions:
                    </span>
                    "{activeRequest.managerNotes}"
                  </div>
                )}
              </div>
            )}

            {activeRequest.status === 'rejected' && (
              <div className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    <span>Declined by {activeRequest.reviewedBy || 'Media Leadership'}</span>
                  </div>
                  {activeRequest.reviewedAt && (
                    <span className="text-xs text-rose-700 dark:text-rose-400">
                      {new Date(activeRequest.reviewedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {activeRequest.managerNotes && (
                  <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 border border-rose-200 dark:border-rose-500/30">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                      Decline Reason:
                    </span>
                    "{activeRequest.managerNotes}"
                  </div>
                )}
              </div>
            )}

            {activeRequest.status === 'pending' && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Awaiting Church Media Department Review & Authorization
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      This requisition is pending authorization. You can edit dates, gear manifest, and venue details prior to director approval.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-purple-300 dark:border-purple-500/40 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 px-3.5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 transition shadow-xs cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit Request</span>
                    </button>
                  )}

                  {canAuthorize && !isReviewing && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* AUDIT TRAIL OF CHANGES (Core user requirement) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Audit Trail & Revision History
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chronological audit log tracking every user edit, field diff, and authorization event
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                {fullAuditTrail.length} Recorded Event{fullAuditTrail.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Timeline List */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {fullAuditTrail.map((entry, idx) => {
                const isCreation = entry.action === 'created';
                const isEdited = entry.action === 'edited';
                const isStatusChange = entry.action === 'status_change';

                return (
                  <div key={entry.id || idx} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-[27px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                        isCreation
                          ? 'border-sky-500 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                          : isEdited
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                          : 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isCreation ? (
                        <Sparkles className="h-3 w-3" />
                      ) : isEdited ? (
                        <Pencil className="h-3 w-3" />
                      ) : (
                        <ShieldCheck className="h-3 w-3" />
                      )}
                    </div>

                    {/* Entry Card */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-850/60 p-4 space-y-2.5 shadow-xs">
                      {/* Top Row: Action Title, User Attribution & Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isCreation
                                ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300'
                                : isEdited
                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300'
                                : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {isCreation ? 'Initial Creation' : isEdited ? 'Requisition Edited' : 'Status Decision'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {entry.editorName}
                          </span>
                          <span className="rounded-full bg-slate-200 dark:bg-slate-700/60 px-2 py-0.2 text-[10px] font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {entry.editorRole}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {new Date(entry.timestamp).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Summary text / Change Note */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                        {entry.summary}
                      </p>

                      {/* Field-level Diffs (Old Value vs New Value) */}
                      {entry.changes && entry.changes.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Tracked Field Modifications ({entry.changes.length}):
                          </span>
                          <div className="space-y-1.5">
                            {entry.changes.map((change, cIdx) => {
                              const isAssets = change.field === 'requestedAssetIds';
                              
                              let oldDisplay = String(change.oldValue);
                              let newDisplay = String(change.newValue);

                              if (isAssets && Array.isArray(change.oldValue) && Array.isArray(change.newValue)) {
                                const oldNames = change.oldValue.map(
                                  (id: string) => equipment.find((eq) => eq.id === id)?.name || id
                                );
                                const newNames = change.newValue.map(
                                  (id: string) => equipment.find((eq) => eq.id === id)?.name || id
                                );
                                oldDisplay = oldNames.join(', ') || 'None';
                                newDisplay = newNames.join(', ') || 'None';
                              }

                              return (
                                <div
                                  key={cIdx}
                                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                                >
                                  <div className="sm:col-span-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                    <span>{change.label}</span>
                                  </div>
                                  <div className="sm:col-span-9 flex flex-col sm:flex-row sm:items-center gap-1.5 text-[11px]">
                                    <div className="flex-1 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 px-2 py-1 text-rose-800 dark:text-rose-300 line-through truncate" title={oldDisplay}>
                                      {oldDisplay}
                                    </div>
                                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
                                    <div className="flex-1 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 text-emerald-800 dark:text-emerald-300 font-semibold truncate" title={newDisplay}>
                                      {newDisplay}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
                <p className="text-[10px] text-slate-500">{activeRequest.requesterName} • Sign & Date</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between print:hidden shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Grace Community Church • Requisition & Governance</span>
            {canEdit && (
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                • Pending Authorisation (Editable)
              </span>
            )}
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
