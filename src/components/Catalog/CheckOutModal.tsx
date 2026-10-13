import React, { useState } from 'react';
import { X, ArrowRight, User, Calendar, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { EquipmentItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface CheckOutModalProps {
  item: EquipmentItem | null;
  onClose: () => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({ item, onClose }) => {
  const { checkOutItem, currentUser } = useApp();

  const [borrowerName, setBorrowerName] = useState(currentUser.name);
  const [borrowerDept, setBorrowerDept] = useState(currentUser.department);
  const [eventName, setEventName] = useState('Sunday Morning 10:30 AM Service');
  const [dueDate, setDueDate] = useState(() => {
    // Default: next Sunday or tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setError('Please provide borrower name.');
      return;
    }
    if (!eventName.trim()) {
      setError('Please specify the church service or program name.');
      return;
    }

    const success = checkOutItem(
      item.id,
      borrowerName.trim(),
      borrowerDept.trim(),
      new Date(dueDate).toISOString(),
      eventName.trim(),
      notes.trim()
    );

    if (success) {
      onClose();
    } else {
      setError('Failed to checkout item. Please try again.');
    }
  };

  const churchDepartments = [
    'Media & Technical Arts',
    'Weekend Media Ministry',
    'Worship Team',
    'Youth Ministry',
    'Children\'s Church',
    'Outreach & Missions',
    'Pastoral & Executive',
    'Sanctuary Facilities',
  ];

  const commonEvents = [
    'Sunday Morning 9:00 AM Service',
    'Sunday Morning 10:30 AM Service',
    'Wednesday Midweek Prayer & Worship',
    'Friday Youth Rally & Fellowship',
    'Saturday Choir & Band Rehearsal',
    'Community Outreach & Food Distribution',
    'Baptism & Special Testimonial Stream',
    'Pastoral Studio Announcement Recording',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Check Out Equipment</h2>
              <p className="text-xs text-slate-400">Log authorized custody and event usage</p>
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
            <span className="text-[11px] text-slate-400 font-medium">{item.location}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Borrower / Custodian Name *
            </label>
            <input
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. Marcus Cole, Sarah Jenkins"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Department *
            </label>
            <select
              value={borrowerDept}
              onChange={(e) => setBorrowerDept(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              {churchDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Church Service / Program *
            </label>
            <input
              type="text"
              list="events-list"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. Sunday 10:30 AM Service"
            />
            <datalist id="events-list">
              {commonEvents.map((ev) => (
                <option key={ev} value={ev} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Return Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Operational Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. Taken with 2 extra rechargeable batteries and Pelican case."
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
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Check-Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
