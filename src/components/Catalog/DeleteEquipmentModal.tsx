import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, CheckCircle2, User, MapPin } from 'lucide-react';
import { EquipmentItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface DeleteEquipmentModalProps {
  item: EquipmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (deletedId: string) => void;
}

export const DeleteEquipmentModal: React.FC<DeleteEquipmentModalProps> = ({
  item,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { deleteEquipment } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const isCheckedOut = item.status === 'checked_out';

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const success = deleteEquipment(item.id);
      if (success) {
        if (onDeleted) onDeleted(item.id);
        onClose();
      } else {
        setError('Failed to delete equipment item. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/30 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Delete Equipment Asset</h2>
              <p className="text-xs text-rose-300">Permanent inventory removal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete this equipment item? This action will permanently remove it from the church gear database and barcode registry.
          </p>

          {/* Asset Preview Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-start gap-3.5">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-16 w-16 rounded-lg object-cover border border-slate-800 bg-slate-900 shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 shrink-0 font-mono text-xs font-bold">
                {item.id.slice(0, 3)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {item.id}
                </span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  {item.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1 truncate">{item.name}</h3>
              <p className="text-xs text-slate-400 truncate">
                {item.brand} {item.model} • S/N: {item.serialNumber || 'N/A'}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  <span className="truncate">{item.location}</span>
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  £{item.replacementCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Checked Out Warning */}
          {isCheckedOut && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Asset Currently Checked Out!</span>
              </div>
              <p>
                This asset is currently in active possession of{' '}
                <strong className="text-white">{item.assignedTo}</strong> for{' '}
                <strong className="text-white">{item.checkoutEvent || 'active ministry service'}</strong>.
              </p>
              <p className="text-[11px] text-amber-300/80">
                Deleting this item now will bypass return verification and immediately remove all checkout records for this asset.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/90 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
