import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Printer,
  Grid,
  List,
  MapPin,
  Tag,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  QrCode,
  SlidersHorizontal,
} from 'lucide-react';
import { EquipmentItem, EquipmentCategory, EquipmentStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { CheckOutModal } from './CheckOutModal';
import { CheckInModal } from './CheckInModal';
import { AddEditEquipmentModal } from './AddEditEquipmentModal';
import { PrintLabelsModal } from './PrintLabelsModal';

interface EquipmentCatalogProps {
  onOpenScanner: () => void;
}

export const EquipmentCatalog: React.FC<EquipmentCatalogProps> = ({ onOpenScanner }) => {
  const { equipment, currentUser, hasPermission } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [detailItem, setDetailItem] = useState<EquipmentItem | null>(null);
  const [checkOutItemTarget, setCheckOutItemTarget] = useState<EquipmentItem | null>(null);
  const [checkInItemTarget, setCheckInItemTarget] = useState<EquipmentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<EquipmentItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Categories list
  const categories: string[] = [
    'all',
    'Audio',
    'Video & Cameras',
    'Lighting',
    'Computing & Media',
    'Cables & Interconnects',
    'Staging & Rigging',
  ];

  // Locations list
  const locations = useMemo(() => {
    const locSet = new Set<string>();
    equipment.forEach((e) => locSet.add(e.location));
    return ['all', ...Array.from(locSet)];
  }, [equipment]);

  // Filtering
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // Search
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedTo && item.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      // Status
      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus;

      // Location
      const matchesLocation =
        selectedLocation === 'all' || item.location === selectedLocation;

      return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
    });
  }, [equipment, searchQuery, selectedCategory, selectedStatus, selectedLocation]);

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'checked_out':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'in_maintenance':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'reserved':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const canManageGear = hasPermission('can_manage_equipment');
  const canCheckout = hasPermission('can_checkout_checkin');
  const canPrintLabels = hasPermission('can_manage_equipment') || hasPermission('can_manage_master_data');

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Church Equipment & Assets Catalog
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time tracking of sanctuary broadcast, audio, lighting, and media rigs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canPrintLabels && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              <Printer className="h-4 w-4 text-sky-400" />
              <span>Print QR Labels</span>
            </button>
          )}

          {canManageGear && (
            <button
              onClick={() => {
                setItemToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. AUD-MIC-01), name, brand, serial, or borrower..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Location Dropdown & View Mode */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">All Locations</option>
              {locations.filter((l) => l !== 'all').map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Grid / Table View Switcher */}
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Discipline:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Gear' : cat}
              </button>
            ))}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Status:
            </span>
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'available', label: 'Available (In Booth)' },
              { id: 'checked_out', label: 'Checked Out' },
              { id: 'in_maintenance', label: 'In Maintenance' },
              { id: 'reserved', label: 'Reserved' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                  selectedStatus === st.id
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredEquipment.length}</strong> of{' '}
          <strong className="text-white">{equipment.length}</strong> assets
        </span>
        {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedLocation !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSelectedLocation('all');
            }}
            className="text-sky-400 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Equipment View Mode: Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700 hover:bg-slate-850 shadow-md"
            >
              <div>
                {/* Top ID & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {item.id}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                      {item.brand}
                    </span>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Name */}
                <h3
                  onClick={() => setDetailItem(item)}
                  className="mt-2.5 text-sm font-bold text-white group-hover:text-sky-400 transition cursor-pointer line-clamp-2"
                >
                  {item.name}
                </h3>

                {/* Location & Specs */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  {item.status === 'checked_out' && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-sky-950/40 p-2 text-sky-300 border border-sky-500/20">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold">{item.assignedTo}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Event: {item.checkoutEvent || 'Service'}
                        </span>
                      </div>
                    </div>
                  )}

                  {item.status === 'in_maintenance' && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-rose-950/40 p-2 text-rose-300 border border-rose-500/20 text-[11px]">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.maintenanceNotes || 'Service Required'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-[11px] font-mono text-slate-400">
                  £{item.replacementCost.toLocaleString()}
                </div>

                <div className="flex items-center gap-1.5">
                  {canCheckout && item.status === 'available' && (
                    <button
                      onClick={() => setCheckOutItemTarget(item)}
                      className="flex items-center gap-1 rounded-lg bg-sky-600/90 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-500 transition cursor-pointer"
                    >
                      <ArrowRight className="h-3 w-3" />
                      <span>Check Out</span>
                    </button>
                  )}

                  {canCheckout && item.status === 'checked_out' && (
                    <button
                      onClick={() => setCheckInItemTarget(item)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600/90 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Check In</span>
                    </button>
                  )}

                  <button
                    onClick={() => setDetailItem(item)}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-1 text-slate-300 hover:text-white transition cursor-pointer"
                    title="View QR Code & Specs"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Equipment View Mode: Table */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-850/80 text-[11px] font-semibold uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Asset ID</th>
                <th className="px-4 py-3">Equipment Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Custodian / Borrower</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailItem(item)}
                      className="font-semibold text-white hover:text-sky-400 transition text-left line-clamp-1"
                    >
                      {item.name}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">
                      S/N: {item.serialNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {item.location}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.assignedTo ? (
                      <span className="font-medium text-white">{item.assignedTo}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {canCheckout && item.status === 'available' && (
                        <button
                          onClick={() => setCheckOutItemTarget(item)}
                          className="rounded-lg bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-sky-500 transition cursor-pointer"
                        >
                          Check Out
                        </button>
                      )}
                      {canCheckout && item.status === 'checked_out' && (
                        <button
                          onClick={() => setCheckInItemTarget(item)}
                          className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => setDetailItem(item)}
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1 text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredEquipment.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-white">No Equipment Found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            No assets match your search filters. Try adjusting your query or resetting category selection.
          </p>
        </div>
      )}

      {/* Modals */}
      {detailItem && (
        <EquipmentDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onOpenCheckOut={(item) => setCheckOutItemTarget(item)}
          onOpenCheckIn={(item) => setCheckInItemTarget(item)}
          onFlagMaintenance={(item) => {
            // Flag maintenance
            setDetailItem(null);
          }}
        />
      )}

      {checkOutItemTarget && (
        <CheckOutModal
          item={checkOutItemTarget}
          onClose={() => setCheckOutItemTarget(null)}
        />
      )}

      {checkInItemTarget && (
        <CheckInModal
          item={checkInItemTarget}
          onClose={() => setCheckInItemTarget(null)}
        />
      )}

      {isAddModalOpen && (
        <AddEditEquipmentModal
          itemToEdit={itemToEdit}
          onClose={() => {
            setIsAddModalOpen(false);
            setItemToEdit(null);
          }}
        />
      )}

      {isPrintModalOpen && (
        <PrintLabelsModal onClose={() => setIsPrintModalOpen(false)} />
      )}
    </div>
  );
};
