import React from 'react';
import {
  X,
  Boxes,
  Tag,
  Edit2,
  Mic,
  Video,
  Sun,
  Laptop,
  Cable,
  HardDrive,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryDefinition } from '../../types';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryDefinition | null;
  onEdit: (category: CategoryDefinition) => void;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  onEdit,
}) => {
  const { equipment } = useApp();

  if (!isOpen || !category) return null;

  const categoryGear = equipment.filter((e) => e.category === category.name);

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'audio':
        return <Mic className="h-6 w-6 text-sky-500" />;
      case 'video & cameras':
        return <Video className="h-6 w-6 text-indigo-500" />;
      case 'lighting':
        return <Sun className="h-6 w-6 text-amber-500" />;
      case 'computing & media':
        return <Laptop className="h-6 w-6 text-emerald-500" />;
      case 'cables & interconnects':
        return <Cable className="h-6 w-6 text-rose-500" />;
      default:
        return <Boxes className="h-6 w-6 text-sky-500" />;
    }
  };

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
        <div className="relative bg-gradient-to-r from-slate-900 via-sky-950/70 to-slate-900 text-white p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 dark:bg-slate-800/80 border border-white/20">
              {getCategoryIcon(category.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white truncate">
                  {category.name}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 text-xs font-bold">
                  {categoryGear.length} Items in Catalog
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-1">
                SQLite Record ID: <span className="font-mono">{category.id}</span> • {category.subCategories.length} subcategories registered
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Category Scope & Description
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {category.description || 'No description provided.'}
            </p>
          </div>

          {/* Subcategories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Registered Subcategories ({category.subCategories.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              {category.subCategories.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <Tag className="h-3 w-3 text-sky-500" />
                  <span>{sub}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Catalog Assets in this Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Equipment Catalog Assets ({categoryGear.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Live catalog inventory
              </span>
            </div>

            {categoryGear.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                No equipment is currently registered under this category.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {categoryGear.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        SN: <span className="font-mono">{item.serialNumber || 'N/A'}</span> • Loc: {item.location} • Cond: {item.condition}
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

        {/* Footer */}
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
              onEdit(category);
            }}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-sm cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Category Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
