import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Calendar,
  MapPin,
  Tag,
  Check,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  RotateCcw,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose }) => {
  const { equipment, createRequest, currentUser, departments: dynamicDepartments, locations: dynamicLocations } = useApp();

  const [requesterName, setRequesterName] = useState(currentUser.name);
  const [requesterEmail, setRequesterEmail] = useState(currentUser.email);
  const [requesterDept, setRequesterDept] = useState(
    currentUser.department.includes('Youth')
      ? 'Youth Ministry'
      : currentUser.department.includes('Children')
      ? 'Children\'s Church'
      : 'Worship Team'
  );
  const [programName, setProgramName] = useState('');
  const [location, setLocation] = useState('Youth Chapel Stage');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 16);
  });
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter state for equipment records
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'selected'>('all');

  // Extract distinct categories from catalog
  const categories = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['all', ...Array.from(set)];
  }, [equipment]);

  // Filtered equipment records based on search, category and availability
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // Search query across name, id, category, brand, model, and location
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.model.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'available') {
        return item.status === 'available';
      }
      if (statusFilter === 'selected') {
        return selectedAssetIds.includes(item.id);
      }

      return true;
    });
  }, [equipment, searchQuery, categoryFilter, statusFilter, selectedAssetIds]);

  const availableCount = useMemo(() => {
    return equipment.filter((e) => e.status === 'available').length;
  }, [equipment]);

  if (!isOpen) return null;

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName.trim()) {
      setError('Please provide the church program or event name.');
      return;
    }
    if (selectedAssetIds.length === 0) {
      setError('Please select at least one equipment asset for your request.');
      return;
    }

    createRequest({
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim(),
      requesterDept,
      programName: programName.trim(),
      location,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      requestedAssetIds: selectedAssetIds,
      purpose: purpose.trim() || 'Required for church department ministry program.',
      urgent,
    });

    onClose();
  };

  const departmentList = dynamicDepartments && dynamicDepartments.length > 0
    ? dynamicDepartments.map((d) => d.name)
    : [
        'Youth Ministry',
        'Children\'s Church',
        'Worship Team',
        'Outreach & Missions',
        'Pastoral & Executive',
        'Media & Technical Arts',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Request Media Equipment for Program
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated authorization workflow for Grace Community Church ministries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Requester Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requester Name *
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
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
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              >
                {departmentList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Email
              </label>
              <input
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Program Name & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Church Program / Event Title *
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                required
                placeholder="e.g. Youth Fall Retreat, Children's Camp"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue / Setup Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="e.g. Youth Chapel, Fellowship Hall, Outdoor Lawn"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Date & Time Window */}
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
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Program End / Return Date & Time *
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Gear Picker with Search, Filter & Live Availability Indicators */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>Select Equipment Needed ({selectedAssetIds.length} chosen) *</span>
                </label>
                <span className="text-[11px] text-slate-500">Live availability status • Click item to toggle</span>
              </div>

              {selectedAssetIds.length > 0 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedAssetIds([])}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear Selection</span>
                  </button>
                  <span className="rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 text-[10px]">
                    {selectedAssetIds.length} item{selectedAssetIds.length > 1 ? 's' : ''} chosen
                  </span>
                </div>
              )}
            </div>

            {/* Filter Controls Bar */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-2.5 space-y-2 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by gear name, model, asset ID, or room..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Dropdown Filter */}
                <div className="sm:w-44">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="all">All Categories ({equipment.length})</option>
                    {categories
                      .filter((c) => c !== 'all')
                      .map((cat) => {
                        const count = equipment.filter((e) => e.category === cat).length;
                        return (
                          <option key={cat} value={cat}>
                            {cat} ({count})
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* Status & Availability Quick Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`rounded-md px-2 py-0.5 font-medium transition cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All ({equipment.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('available')}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition cursor-pointer ${
                      statusFilter === 'available'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Available ({availableCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('selected')}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition cursor-pointer ${
                      statusFilter === 'selected'
                        ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-500/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Check className="h-3 w-3 text-sky-500" />
                    <span>Selected ({selectedAssetIds.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span>
                    Showing {filteredEquipment.length} of {equipment.length}
                  </span>
                  {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Equipment Records List */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-2">
              {filteredEquipment.length === 0 ? (
                <div className="p-6 text-center text-xs space-y-2">
                  <p className="text-slate-500 dark:text-slate-400">
                    No equipment found matching your search or filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-100 dark:bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-200"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset search & filters</span>
                  </button>
                </div>
              ) : (
                filteredEquipment.map((item) => {
                  const isSelected = selectedAssetIds.includes(item.id);
                  const isUnavailable = item.status === 'in_maintenance';
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isUnavailable && toggleAsset(item.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/15 text-slate-900 dark:text-white shadow-xs'
                          : isUnavailable
                          ? 'border-slate-200 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-900/40 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border shrink-0 ${
                            isSelected
                              ? 'border-sky-500 bg-sky-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-1 rounded">
                              {item.id}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.brand} • {item.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500 capitalize hidden sm:inline">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                            item.status === 'available'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                              : item.status === 'in_maintenance'
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Purpose & Urgent toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose & Production Requirements
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Need wireless handheld for speaker + camera tripod for sermon recording."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="urgent-check"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="urgent-check" className="text-xs font-semibold text-amber-700 dark:text-amber-400 cursor-pointer">
              Mark as Urgent / Priority (Alerts Media Director immediately via Push)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:from-sky-400 hover:to-indigo-500 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Submit for Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
