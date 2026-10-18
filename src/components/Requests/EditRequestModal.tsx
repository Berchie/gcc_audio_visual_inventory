import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Tag,
  Check,
  AlertCircle,
  Edit3,
  Clock,
  Package,
  Layers,
  Search,
  AlertTriangle,
  History,
} from 'lucide-react';
import { EquipmentRequest, EquipmentItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface EditRequestModalProps {
  request: EquipmentRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedRequest: EquipmentRequest) => void;
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({
  request,
  isOpen,
  onClose,
  onSaved,
}) => {
  const {
    equipment,
    updateRequest,
    currentUser,
    departments: dynamicDepartments,
  } = useApp();

  const [programName, setProgramName] = useState('');
  const [requesterDept, setRequesterDept] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('all');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state when request changes or modal opens
  useEffect(() => {
    if (request) {
      setProgramName(request.programName || '');
      setRequesterDept(request.requesterDept || '');
      setLocation(request.location || '');
      setStartDate(request.startDate ? request.startDate.slice(0, 16) : '');
      setEndDate(request.endDate ? request.endDate.slice(0, 16) : '');
      setSelectedAssetIds(request.requestedAssetIds || []);
      setPurpose(request.purpose || '');
      setUrgent(Boolean(request.urgent));
      setEditReason('');
      setError('');
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const departmentList =
    dynamicDepartments && dynamicDepartments.length > 0
      ? dynamicDepartments.map((d) => d.name)
      : [
          'Youth Ministry',
          "Children's Church",
          'Worship Team',
          'Outreach & Missions',
          'Pastoral & Executive',
          'Media & Technical Arts',
        ];

  // Distinct equipment categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach((e) => set.add(e.category));
    return ['all', ...Array.from(set)];
  }, [equipment]);

  // Filtered equipment catalog for asset selection
  const filteredGear = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(assetSearchQuery.toLowerCase());

      const matchesCat =
        assetCategoryFilter === 'all' || item.category === assetCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [equipment, assetSearchQuery, assetCategoryFilter]);

  // Compute live change diff
  const changesSummary = useMemo(() => {
    const list: string[] = [];
    if (programName.trim() !== request.programName) {
      list.push(`Program Name: "${request.programName}" → "${programName.trim()}"`);
    }
    if (requesterDept !== request.requesterDept) {
      list.push(`Department: "${request.requesterDept}" → "${requesterDept}"`);
    }
    if (location.trim() !== request.location) {
      list.push(`Location: "${request.location}" → "${location.trim()}"`);
    }
    const originalStart = request.startDate ? request.startDate.slice(0, 16) : '';
    if (startDate !== originalStart) {
      list.push('Event start date/time adjusted');
    }
    const originalEnd = request.endDate ? request.endDate.slice(0, 16) : '';
    if (endDate !== originalEnd) {
      list.push('Event end date/time adjusted');
    }
    if (purpose.trim() !== request.purpose) {
      list.push('Purpose description revised');
    }
    if (urgent !== request.urgent) {
      list.push(urgent ? 'Set to Urgent Priority' : 'Urgent priority cleared');
    }

    const oldSet = new Set(request.requestedAssetIds);
    const newSet = new Set(selectedAssetIds);
    const added = selectedAssetIds.filter((x) => !oldSet.has(x));
    const removed = request.requestedAssetIds.filter((x) => !newSet.has(x));
    if (added.length > 0) list.push(`+${added.length} asset(s) added: ${added.join(', ')}`);
    if (removed.length > 0) list.push(`-${removed.length} asset(s) removed: ${removed.join(', ')}`);

    return list;
  }, [
    programName,
    requesterDept,
    location,
    startDate,
    endDate,
    purpose,
    urgent,
    selectedAssetIds,
    request,
  ]);

  const hasModifications = changesSummary.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName.trim()) {
      setError('Please provide the church program or event name.');
      return;
    }
    if (selectedAssetIds.length === 0) {
      setError('Please select at least one equipment asset for your request.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('Program end date must be after start date.');
      return;
    }

    if (!hasModifications) {
      setError('No changes detected compared to the current requisition.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedFields: Partial<EquipmentRequest> = {
        programName: programName.trim(),
        requesterDept,
        location: location.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        requestedAssetIds: selectedAssetIds,
        purpose: purpose.trim(),
        urgent,
      };

      const success = await updateRequest(request.id, updatedFields, editReason.trim());
      if (success) {
        if (onSaved) {
          onSaved({
            ...request,
            ...updatedFields,
          });
        }
        onClose();
      } else {
        setError('Failed to update request. Please verify the request is still pending.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving requisition changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Pending Requisition
                </h2>
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-500/20">
                  {request.id}
                </span>
                <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  Pending Authorization
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modifications will be timestamped, tracked, and visible in the audit trail.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Requester Identity Info (Read-only reference) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                Original Requester
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {request.requesterName}
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-mono text-[11px]">
                ({request.requesterEmail})
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                Editor Context
              </span>
              <span className="font-semibold text-sky-700 dark:text-sky-300">
                {currentUser.name} ({currentUser.role.toUpperCase()})
              </span>
            </div>
          </div>

          {/* Program Name & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Church Program / Event Title *
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                value={requesterDept}
                onChange={(e) => setRequesterDept(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none cursor-pointer"
              >
                {departmentList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Venue Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Setup Venue / Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Program Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Program End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Equipment Asset Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Requested Assets ({selectedAssetIds.length} selected) *
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Select or unselect gear
              </span>
            </div>

            {/* Asset Search & Filter */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <select
                value={assetCategoryFilter}
                onChange={(e) => setAssetCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Gear Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850/50">
              {filteredGear.map((item) => {
                const isSelected = selectedAssetIds.includes(item.id);
                const isUnavailable =
                  item.status === 'in_maintenance' || item.status === 'checked_out';

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleAsset(item.id)}
                    className={`flex items-start justify-between p-2 rounded-lg border text-left cursor-pointer transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/15'
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">
                          {item.id}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          • {item.category}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                        {item.name}
                      </p>
                      {isUnavailable && (
                        <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" /> Overlap: currently {item.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purpose & Requisition Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose & Setup Requirements *
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Urgent Priority Flag */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-urgent-priority"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <label
              htmlFor="edit-urgent-priority"
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Urgent Requisition (Requires expedited review within 24 hours)
            </label>
          </div>

          {/* Reason for Modification (Logged in Audit Trail) */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/20 p-3.5 space-y-1.5">
            <label className="block text-xs font-bold text-sky-900 dark:text-sky-300">
              Reason for Modification / Edit Note (Recorded in Audit Trail)
            </label>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Explain why this pending requisition was changed so the media approval team has clear context.
            </p>
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g. Added backup direct box, adjusted schedule for Saturday rehearsal"
              className="w-full rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Real-time Diff Preview */}
          {hasModifications && (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Detected Changes to be Logged ({changesSummary.length}):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-950 dark:text-emerald-200/90 pl-1">
                {changesSummary.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasModifications}
              className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition flex items-center gap-1.5 ${
                hasModifications && !isSubmitting
                  ? 'bg-sky-600 hover:bg-sky-500 cursor-pointer'
                  : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-75'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Requisition Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
