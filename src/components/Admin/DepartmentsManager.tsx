import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Users,
  Search,
  Filter,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DepartmentDefinition } from '../../types';
import { AddEditDepartmentModal } from './AddEditDepartmentModal';
import { DepartmentDetailModal } from './DepartmentDetailModal';

export const DepartmentsManager: React.FC = () => {
  const { departments, users, deleteDepartment, hasPermission } = useApp();
  const canManageMaster = hasPermission('can_manage_master_data');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadershipFilter, setSelectedLeadershipFilter] = useState<'all' | 'with_head' | 'no_head'>('all');
  const [selectedMembershipFilter, setSelectedMembershipFilter] = useState<'all' | 'with_members' | 'empty'>('all');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('sanctuary_departments_view_mode') as 'cards' | 'table') || 'cards';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<DepartmentDefinition | null>(null);
  const [selectedDeptForDetail, setSelectedDeptForDetail] = useState<DepartmentDefinition | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sanctuary_departments_view_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  const getDepartmentUserCount = (deptName: string) => {
    return users.filter((u) => u.department === deptName).length;
  };

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        dept.name.toLowerCase().includes(q) ||
        (dept.code && dept.code.toLowerCase().includes(q)) ||
        (dept.headPerson && dept.headPerson.toLowerCase().includes(q)) ||
        (dept.contactEmail && dept.contactEmail.toLowerCase().includes(q)) ||
        (dept.description && dept.description.toLowerCase().includes(q));

      const matchesLeadership =
        selectedLeadershipFilter === 'all' ||
        (selectedLeadershipFilter === 'with_head' && Boolean(dept.headPerson && dept.headPerson.trim())) ||
        (selectedLeadershipFilter === 'no_head' && (!dept.headPerson || !dept.headPerson.trim()));

      const userCount = getDepartmentUserCount(dept.name);
      const matchesMembership =
        selectedMembershipFilter === 'all' ||
        (selectedMembershipFilter === 'with_members' && userCount > 0) ||
        (selectedMembershipFilter === 'empty' && userCount === 0);

      return matchesSearch && matchesLeadership && matchesMembership;
    });
  }, [departments, searchQuery, selectedLeadershipFilter, selectedMembershipFilter, users]);

  const handleDelete = async (dept: DepartmentDefinition) => {
    const userCount = getDepartmentUserCount(dept.name);
    if (userCount > 0) {
      setFeedbackMsg({
        text: `Safety Validation: Cannot delete "${dept.name}" because ${userCount} users are currently assigned to it. Reassign them first.`,
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
      return;
    }

    if (!confirm(`Are you sure you want to delete department "${dept.name}"?`)) return;

    const res = await deleteDepartment(dept.id);
    if (res.success) {
      setFeedbackMsg({ text: `Department "${dept.name}" deleted successfully.`, type: 'success' });
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to delete department.', type: 'error' });
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
              placeholder="Search ministry name, code, head, email..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Leadership Filter */}
          <select
            value={selectedLeadershipFilter}
            onChange={(e) => setSelectedLeadershipFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">All Leadership States</option>
            <option value="with_head">Appointed Ministry Head</option>
            <option value="no_head">No Appointed Head</option>
          </select>

          {/* Membership Filter */}
          <select
            value={selectedMembershipFilter}
            onChange={(e) => setSelectedMembershipFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">All Member Allocations</option>
            <option value="with_members">Has Assigned Members (&gt;0)</option>
            <option value="empty">0 Members Assigned</option>
          </select>
        </div>

        {/* View Mode Toggle & Add Department Button */}
        <div className="flex items-center gap-2">
          {/* Card / Table View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              aria-label="View in Card format"
              title="Card View (grid cards with ministry info)"
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
                setDeptToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Department</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing {filteredDepartments.length} of {departments.length} departments • Mode:{' '}
          <strong className="text-slate-700 dark:text-slate-300 capitalize">{viewMode} View</strong>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          SQLite Table: departments (WAL synced)
        </span>
      </div>

      {/* Main Content: Cards vs Table View */}
      {viewMode === 'cards' ? (
        /* ======================== CARD VIEW ======================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.length === 0 ? (
            <div className="col-span-full py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400">
              No departments match your search or filter criteria.
            </div>
          ) : (
            filteredDepartments.map((dept) => {
              const userCount = getDepartmentUserCount(dept.name);

              return (
                <div
                  key={dept.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 font-bold text-xs">
                          {dept.code || 'MIN'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {dept.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                            {userCount} {userCount === 1 ? 'member' : 'members'} assigned
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedDeptForDetail(dept)}
                          title="View Department Details & Members"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-600 dark:hover:text-purple-400 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canManageMaster && (
                          <>
                            <button
                              onClick={() => {
                                setDeptToEdit(dept);
                                setIsModalOpen(true);
                              }}
                              title="Edit Department"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(dept)}
                              title="Delete Department"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 my-3 text-xs text-slate-600 dark:text-slate-300">
                      {dept.headPerson ? (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>
                            Head: <strong className="text-slate-800 dark:text-slate-200">{dept.headPerson}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 italic">
                          <User className="h-3 w-3 shrink-0" />
                          <span>No head appointed</span>
                        </div>
                      )}
                      {dept.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{dept.contactEmail}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[30px] leading-relaxed">
                      {dept.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">ID: {dept.id}</span>
                    <button
                      onClick={() => setSelectedDeptForDetail(dept)}
                      className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
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
                  <th className="py-3 px-4">Ministry Department</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Ministry Head</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Assigned Members</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No departments match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => {
                    const userCount = getDepartmentUserCount(dept.name);

                    return (
                      <tr
                        key={dept.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs border border-purple-200 dark:border-purple-800/60">
                              <Building className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {dept.name}
                            </span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-3 px-4">
                          <span className="inline-block rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-[10px]">
                            {dept.code || 'GEN'}
                          </span>
                        </td>

                        {/* Head */}
                        <td className="py-3 px-4">
                          {dept.headPerson ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span>{dept.headPerson}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None appointed</span>
                          )}
                        </td>

                        {/* Contact Email */}
                        <td className="py-3 px-4">
                          {dept.contactEmail ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{dept.contactEmail}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Assigned Members */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                              userCount > 0
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <Users className="h-3 w-3" />
                            <span>{userCount} {userCount === 1 ? 'member' : 'members'}</span>
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-500 dark:text-slate-400 truncate" title={dept.description}>
                            {dept.description || '—'}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedDeptForDetail(dept)}
                              title="View Department Details"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-600 dark:hover:text-purple-400 transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {canManageMaster && (
                              <>
                                <button
                                  onClick={() => {
                                    setDeptToEdit(dept);
                                    setIsModalOpen(true);
                                  }}
                                  title="Edit Department"
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(dept)}
                                  title="Delete Department"
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

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <AddEditDepartmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setDeptToEdit(null);
          }}
          departmentToEdit={deptToEdit}
        />
      )}

      {/* Department Detail Modal */}
      {selectedDeptForDetail && (
        <DepartmentDetailModal
          isOpen={Boolean(selectedDeptForDetail)}
          onClose={() => setSelectedDeptForDetail(null)}
          department={selectedDeptForDetail}
          onEdit={(dept) => {
            setSelectedDeptForDetail(null);
            setDeptToEdit(dept);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
