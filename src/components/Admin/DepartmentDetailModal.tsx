import React from 'react';
import {
  X,
  Building,
  User,
  Mail,
  Users,
  Edit2,
  Calendar,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DepartmentDefinition } from '../../types';

interface DepartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentDefinition | null;
  onEdit: (department: DepartmentDefinition) => void;
}

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  isOpen,
  onClose,
  department,
  onEdit,
}) => {
  const { users } = useApp();

  if (!isOpen || !department) return null;

  const assignedMembers = users.filter((u) => u.department === department.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 text-white p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 font-bold border-2 border-purple-500/30 text-lg">
              {department.code || 'MIN'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white truncate">
                  {department.name}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-xs font-bold">
                  Code: {department.code || 'GEN'}
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-1">
                SQLite Record ID: <span className="font-mono">{department.id}</span> • {assignedMembers.length} team members registered
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
                <User className="h-4 w-4" />
                <span>Department Head / Leader</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {department.headPerson || 'None appointed (Unassigned)'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <Mail className="h-4 w-4" />
                <span>Notification Contact Email</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {department.contactEmail || 'No contact email configured'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Ministry Scope & Description
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {department.description || 'No description provided for this ministry department.'}
            </p>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Department Members ({assignedMembers.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Active ministry staff & volunteers
              </span>
            </div>

            {assignedMembers.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                No users are currently assigned to this department.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {assignedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {member.title} • {member.email}
                        </div>
                      </div>
                    </div>

                    <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {member.role}
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
              onEdit(department);
            }}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-sm cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Department</span>
          </button>
        </div>
      </div>
    </div>
  );
};
