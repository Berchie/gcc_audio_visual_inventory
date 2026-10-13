import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Archive,
  Compass,
  Search,
  Filter,
  LayoutGrid,
  List,
  Eye,
  Boxes,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LocationDefinition } from '../../types';
import { AddEditLocationModal } from './AddEditLocationModal';
import { LocationDetailModal } from './LocationDetailModal';

export const LocationsManager: React.FC = () => {
  const { locations, equipment, deleteLocation, hasPermission } = useApp();
  const canManageMaster = hasPermission('can_manage_master_data');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'vault' | 'room'>('all');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<'all' | 'with_gear' | 'empty'>('all');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('sanctuary_locations_view_mode') as 'cards' | 'table') || 'cards';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<LocationDefinition | null>(null);
  const [selectedLocationForDetail, setSelectedLocationForDetail] = useState<LocationDefinition | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sanctuary_locations_view_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  const getLocationEquipmentCount = (locName: string) => {
    return equipment.filter((e) => e.location === locName).length;
  };

  // Derive unique building list
  const uniqueBuildings = useMemo(() => {
    const bSet = new Set<string>();
    locations.forEach((loc) => {
      if (loc.building) bSet.add(loc.building);
    });
    return Array.from(bSet).sort();
  }, [locations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        loc.name.toLowerCase().includes(q) ||
        (loc.building && loc.building.toLowerCase().includes(q)) ||
        (loc.room && loc.room.toLowerCase().includes(q)) ||
        (loc.description && loc.description.toLowerCase().includes(q));

      const matchesBuilding =
        selectedBuilding === 'all' || loc.building === selectedBuilding;

      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'vault' && loc.isStorage) ||
        (selectedType === 'room' && !loc.isStorage);

      const gearCount = getLocationEquipmentCount(loc.name);
      const matchesAssetFilter =
        selectedAssetFilter === 'all' ||
        (selectedAssetFilter === 'with_gear' && gearCount > 0) ||
        (selectedAssetFilter === 'empty' && gearCount === 0);

      return matchesSearch && matchesBuilding && matchesType && matchesAssetFilter;
    });
  }, [locations, searchQuery, selectedBuilding, selectedType, selectedAssetFilter, equipment]);

  const handleDelete = async (location: LocationDefinition) => {
    const gearCount = getLocationEquipmentCount(location.name);
    if (gearCount > 0) {
      setFeedbackMsg({
        text: `Safety Validation: Cannot delete "${location.name}" because ${gearCount} equipment items are currently located there. Reassign the gear location first.`,
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
      return;
    }

    if (!confirm(`Are you sure you want to delete campus location "${location.name}"?`)) return;

    const res = await deleteLocation(location.id);
    if (res.success) {
      setFeedbackMsg({ text: `Location "${location.name}" deleted successfully.`, type: 'success' });
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to delete location.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border transition animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Control Bar with Search, Filters, View Switcher & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, building, room, notes..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Building Filter */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Buildings ({uniqueBuildings.length})</option>
            {uniqueBuildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Type Filter (Storage vs Active Room) */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Room Types</option>
            <option value="vault">Storage Vaults Only</option>
            <option value="room">Production / Active Rooms</option>
          </select>

          {/* Gear Presence Filter */}
          <select
            value={selectedAssetFilter}
            onChange={(e) => setSelectedAssetFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Inventory Status</option>
            <option value="with_gear">Has Equipment (&gt;0)</option>
            <option value="empty">Empty / 0 Gear</option>
          </select>
        </div>

        {/* View Mode Toggle & Add Location Button */}
        <div className="flex items-center gap-2">
          {/* Card / Table View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              aria-label="View in Card format"
              title="Card View (grid cards with location details)"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              aria-label="View in Table format"
              title="Table View (compact table view)"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          {canManageMaster && (
            <button
              onClick={() => {
                setLocationToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Campus Location</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing {filteredLocations.length} of {locations.length} campus locations • Mode:{' '}
          <strong className="text-slate-700 dark:text-slate-300 capitalize">{viewMode} View</strong>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          SQLite Table: locations (WAL synced)
        </span>
      </div>

      {/* Main Content: Cards vs Table View */}
      {viewMode === 'cards' ? (
        /* ======================== CARD VIEW ======================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.length === 0 ? (
            <div className="col-span-full py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400">
              No campus locations match your search or filter criteria.
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const gearCount = getLocationEquipmentCount(loc.name);

              return (
                <div
                  key={loc.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {loc.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {gearCount} {gearCount === 1 ? 'item' : 'items'} stored here
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedLocationForDetail(loc)}
                          title="View Location Details & Assigned Gear"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canManageMaster && (
                          <>
                            <button
                              onClick={() => {
                                setLocationToEdit(loc);
                                setIsModalOpen(true);
                              }}
                              title="Edit Location"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(loc)}
                              title="Delete Location"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 my-2">
                      <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        <Building className="h-3 w-3 text-slate-400" />
                        {loc.building || 'Main Campus'}
                      </span>
                      {loc.room && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          Room: {loc.room}
                        </span>
                      )}
                      {loc.isStorage && (
                        <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                          <Archive className="h-2.5 w-2.5" />
                          Storage Vault
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[30px] leading-relaxed">
                      {loc.description || 'No additional access instructions provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">ID: {loc.id}</span>
                    <button
                      onClick={() => setSelectedLocationForDetail(loc)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ======================== TABLE VIEW ======================== */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Campus Location</th>
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-4">Room / Suite</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Stationed Assets</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No campus locations match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((loc) => {
                    const gearCount = getLocationEquipmentCount(loc.name);

                    return (
                      <tr
                        key={loc.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                              <MapPin className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {loc.name}
                            </span>
                          </div>
                        </td>

                        {/* Building */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Building className="h-3 w-3 text-slate-400" />
                            <span>{loc.building || 'Main Campus'}</span>
                          </span>
                        </td>

                        {/* Room */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {loc.room || '—'}
                        </td>

                        {/* Classification */}
                        <td className="py-3 px-4">
                          {loc.isStorage ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                              <Archive className="h-2.5 w-2.5" />
                              Storage Vault
                            </span>
                          ) : (
                            <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold">
                              Active Room
                            </span>
                          )}
                        </td>

                        {/* Stationed Assets */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                              gearCount > 0
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <Boxes className="h-3 w-3" />
                            <span>{gearCount} {gearCount === 1 ? 'item' : 'items'}</span>
                          </span>
                        </td>

                        {/* Notes / Description */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-500 dark:text-slate-400 truncate" title={loc.description}>
                            {loc.description || '—'}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedLocationForDetail(loc)}
                              title="View Location Details"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {canManageMaster && (
                              <>
                                <button
                                  onClick={() => {
                                    setLocationToEdit(loc);
                                    setIsModalOpen(true);
                                  }}
                                  title="Edit Location"
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(loc)}
                                  title="Delete Location"
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Location Modal */}
      {isModalOpen && (
        <AddEditLocationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setLocationToEdit(null);
          }}
          locationToEdit={locationToEdit}
        />
      )}

      {/* Location Detail Modal */}
      {selectedLocationForDetail && (
        <LocationDetailModal
          isOpen={Boolean(selectedLocationForDetail)}
          onClose={() => setSelectedLocationForDetail(null)}
          location={selectedLocationForDetail}
          onEdit={(loc) => {
            setSelectedLocationForDetail(null);
            setLocationToEdit(loc);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
