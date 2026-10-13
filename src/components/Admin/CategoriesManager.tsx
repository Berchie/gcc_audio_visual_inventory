import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Mic,
  Video,
  Sun,
  Laptop,
  Cable,
  Search,
  Filter,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryDefinition } from '../../types';
import { AddEditCategoryModal } from './AddEditCategoryModal';
import { CategoryDetailModal } from './CategoryDetailModal';

export const CategoriesManager: React.FC = () => {
  const { categories, equipment, deleteCategory, hasPermission } = useApp();
  const canManageMaster = hasPermission('can_manage_master_data');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterUsage, setFilterUsage] = useState<'all' | 'with_gear' | 'empty'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('sanctuary_categories_view_mode') as 'cards' | 'table') || 'cards';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryDefinition | null>(null);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<CategoryDefinition | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sanctuary_categories_view_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  const getCategoryEquipmentCount = (catName: string) => {
    return equipment.filter((e) => e.category === catName).length;
  };

  const handleDelete = async (category: CategoryDefinition) => {
    const gearCount = getCategoryEquipmentCount(category.name);
    if (gearCount > 0) {
      setFeedbackMsg({
        text: `Safety Validation: Cannot delete "${category.name}" because ${gearCount} equipment items are currently assigned to it. Reassign or delete the gear first.`,
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) return;

    const res = await deleteCategory(category.id);
    if (res.success) {
      setFeedbackMsg({ text: `Category "${category.name}" deleted successfully.`, type: 'success' });
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to delete category.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'audio':
        return <Mic className="h-5 w-5 text-sky-500" />;
      case 'video & cameras':
        return <Video className="h-5 w-5 text-indigo-500" />;
      case 'lighting':
        return <Sun className="h-5 w-5 text-amber-500" />;
      case 'computing & media':
        return <Laptop className="h-5 w-5 text-emerald-500" />;
      case 'cables & interconnects':
        return <Cable className="h-5 w-5 text-rose-500" />;
      default:
        return <Boxes className="h-5 w-5 text-sky-500" />;
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cat.subCategories.some((sub) => sub.toLowerCase().includes(searchQuery.toLowerCase()));

    const gearCount = getCategoryEquipmentCount(cat.name);
    const matchesUsage =
      filterUsage === 'all' ||
      (filterUsage === 'with_gear' && gearCount > 0) ||
      (filterUsage === 'empty' && gearCount === 0);

    return matchesSearch && matchesUsage;
  });

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

      {/* Control Bar with Search, Filter, View Mode Toggle & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category or subcategory..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Asset Usage Filter */}
          <select
            value={filterUsage}
            onChange={(e) => setFilterUsage(e.target.value as any)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">All Categories ({categories.length})</option>
            <option value="with_gear">Active in Catalog (&gt;0 assets)</option>
            <option value="empty">Empty Categories (0 assets)</option>
          </select>
        </div>

        {/* View Mode Toggle & Add Button */}
        <div className="flex items-center gap-2">
          {/* Card / Table View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              aria-label="View in Card format"
              title="Card View (detailed cards with subcategory chips)"
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
                setCategoryToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New Category</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing {filteredCategories.length} of {categories.length} categories • Mode:{' '}
          <strong className="text-slate-700 dark:text-slate-300 capitalize">{viewMode} View</strong>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          SQLite Table: categories (WAL synced)
        </span>
      </div>

      {/* Main Content: Cards vs Table View */}
      {viewMode === 'cards' ? (
        /* ======================== CARD VIEW ======================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400">
              No categories match your search or filter criteria.
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const gearCount = getCategoryEquipmentCount(cat.name);

              return (
                <div
                  key={cat.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {getCategoryIcon(cat.name)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {cat.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            {gearCount} {gearCount === 1 ? 'asset' : 'assets'} in catalog
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedCategoryForDetail(cat)}
                          title="View Category Details & Catalog Equipment"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canManageMaster && (
                          <>
                            <button
                              onClick={() => {
                                setCategoryToEdit(cat);
                                setIsModalOpen(true);
                              }}
                              title="Edit Category & Subcategories"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              title="Delete Category"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 min-h-[32px] leading-relaxed">
                      {cat.description || 'No description provided.'}
                    </p>

                    {/* Subcategories list */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Subcategories ({cat.subCategories.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cat.subCategories.map((sub) => (
                          <span
                            key={sub}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            <Tag className="h-2.5 w-2.5 text-slate-400" />
                            <span>{sub}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>SQLite ID: {cat.id}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Ready in Add Gear Form</span>
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
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Subcategories</th>
                  <th className="py-3 px-4">Catalog Assets</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No categories match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => {
                    const gearCount = getCategoryEquipmentCount(cat.name);

                    return (
                      <tr
                        key={cat.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Name + Icon */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {getCategoryIcon(cat.name)}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-600 dark:text-slate-300 truncate" title={cat.description}>
                            {cat.description || '—'}
                          </p>
                        </td>

                        {/* Subcategories */}
                        <td className="py-3 px-4 max-w-sm">
                          <div className="flex flex-wrap gap-1">
                            {cat.subCategories.slice(0, 3).map((sub) => (
                              <span
                                key={sub}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {sub}
                              </span>
                            ))}
                            {cat.subCategories.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{cat.subCategories.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Catalog Assets Count */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                              gearCount > 0
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span>{gearCount} {gearCount === 1 ? 'asset' : 'assets'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedCategoryForDetail(cat)}
                              title="View Category Details & Catalog Equipment"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {canManageMaster && (
                              <>
                                <button
                                  onClick={() => {
                                    setCategoryToEdit(cat);
                                    setIsModalOpen(true);
                                  }}
                                  title="Edit Category & Subcategories"
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(cat)}
                                  title="Delete Category"
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <AddEditCategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setCategoryToEdit(null);
          }}
          categoryToEdit={categoryToEdit}
        />
      )}

      {/* Category Detail Modal */}
      {selectedCategoryForDetail && (
        <CategoryDetailModal
          isOpen={Boolean(selectedCategoryForDetail)}
          onClose={() => setSelectedCategoryForDetail(null)}
          category={selectedCategoryForDetail}
          onEdit={(cat) => {
            setSelectedCategoryForDetail(null);
            setCategoryToEdit(cat);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
