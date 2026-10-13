import React from 'react';
import {
  X,
  MapPin,
  Building,
  Archive,
  Edit2,
  Boxes,
  Info,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LocationDefinition } from '../../types';

interface LocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationDefinition | null;
  onEdit: (location: LocationDefinition) => void;
}

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  isOpen,
  onClose,
  location,
  onEdit,
}) => {
  const { equipment } = useApp();

  if (!isOpen || !location) return null;

  const stationedGear = equipment.filter((e) => e.location === location.name);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'checked_out':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'maintenance':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 text-white p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold border-2 border-emerald-500/30">
              <MapPin className="h-7 w-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white truncate">
                  {location.name}
                </h2>
                {location.isStorage ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold">
                    <Archive className="h-3 w-3" />
                    Storage Vault
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 text-xs font-bold">
                    Active Room
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                SQLite Record ID: <span className="font-mono">{location.id}</span> • {stationedGear.length} equipment items stationed here
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Key Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <Building className="h-4 w-4" />
                <span>Campus Building</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {location.building || 'Main Campus'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <Compass className="h-4 w-4" />
                <span>Room / Suite Number</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {location.room || 'General Area / Unassigned'}
              </div>
            </div>
          </div>

          {/* Location Notes & Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Operational Notes & Access Details
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {location.description || 'No specific operational notes recorded for this location.'}
            </p>
          </div>

          {/* Stored Equipment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Equipment Stationed At This Location ({stationedGear.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Assigned assets
              </span>
            </div>

            {stationedGear.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                No equipment items are currently assigned to this campus location.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {stationedGear.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        Category: {item.category} • SN: <span className="font-mono">{item.serialNumber || 'N/A'}</span> • Cond: {item.condition}
                      </div>
                    </div>

                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(location);
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Location Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
