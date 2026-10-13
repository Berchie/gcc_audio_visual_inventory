import React, { useState } from 'react';
import { X, CheckCircle2, MapPin, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';
import { EquipmentItem, EquipmentCondition } from '../../types';
import { useApp } from '../../context/AppContext';

interface CheckInModalProps {
  item: EquipmentItem | null;
  onClose: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ item, onClose }) => {
  const { checkInItem } = useApp();

  const [condition, setCondition] = useState<EquipmentCondition>(item?.condition || 'good');
  const [returnLocation, setReturnLocation] = useState(item?.location || 'Main Sanctuary Sound Booth');
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkInItem(item.id, condition, returnLocation, notes.trim());
    onClose();
  };

  const churchStorageLocations = [
    'Main Sanctuary Sound Booth',
    'Main Sanctuary Sanctuary Balcony',
    'Main Sanctuary Lighting Truss A',
    'Video Control Room Rack 1',
    'Video Control Room / Center Platform',
    'Video Control Room Shelf 2',
    'Video Control Room Shelf 3',
    'Media Office Safe',
    'Media Office Dry Cabinet A',
    'Media Office Dry Cabinet B',
    'Media Studio A Storage',
    'Youth Chapel Stage Rack',
    'Stage Storage Locker A',
    'Stage Storage Locker C',
    'Fellowship Hall AV Closet',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Check In / Return Equipment</h2>
              <p className="text-xs text-slate-400">Verify item condition and restore to active rotation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Target Item Pill */}
          <div className="rounded-xl border border-slate-800 bg-slate-850 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-sky-400" />
              <div>
                <p className="text-xs font-mono font-bold text-sky-400">{item.id}</p>
                <p className="text-xs font-semibold text-white">{item.name}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Borrower:</span>
              <p className="text-xs text-white font-medium">{item.assignedTo || 'Volunteer'}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Inspected Condition Upon Return *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['mint', 'good', 'fair', 'needs_attention', 'damaged'] as EquipmentCondition[]).map((cond) => {
                const isSelected = condition === cond;
                const isWarning = cond === 'needs_attention' || cond === 'damaged';
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`rounded-xl border p-2.5 text-xs font-medium capitalize text-center transition ${
                      isSelected
                        ? isWarning
                          ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold'
                          : 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'border-slate-800 bg-slate-850 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {cond.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
            {(condition === 'needs_attention' || condition === 'damaged') && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Selecting this will automatically flag the item for technician maintenance.</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Returned Storage Location *
            </label>
            <select
              value={returnLocation}
              onChange={(e) => setReturnLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              {churchStorageLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Check-In Notes / Teardown Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. Cables neatly coiled and wiped down. Battery returned in charging bay."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete Check-In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
