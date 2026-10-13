import React, { useState } from 'react';
import { X, Building, Save, AlertCircle, Mail, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DepartmentDefinition } from '../../types';

interface AddEditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentToEdit?: DepartmentDefinition | null;
}

export const AddEditDepartmentModal: React.FC<AddEditDepartmentModalProps> = ({
  isOpen,
  onClose,
  departmentToEdit,
}) => {
  const { addDepartment, updateDepartment } = useApp();

  const [name, setName] = useState(departmentToEdit?.name || '');
  const [code, setCode] = useState(departmentToEdit?.code || '');
  const [headPerson, setHeadPerson] = useState(departmentToEdit?.headPerson || '');
  const [contactEmail, setContactEmail] = useState(departmentToEdit?.contactEmail || '');
  const [description, setDescription] = useState(departmentToEdit?.description || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Department name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: Partial<DepartmentDefinition> = {
      name: name.trim(),
      code: (code.trim() || name.slice(0, 3)).toUpperCase(),
      headPerson: headPerson.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      description: description.trim(),
    };

    let res;
    if (departmentToEdit) {
      res = await updateDepartment(departmentToEdit.id, payload);
    } else {
      res = await addDepartment(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to save department');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {departmentToEdit ? 'Edit Ministry Department' : 'Add Ministry Department'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grace Community Church Ministry Units & Program Teams
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department / Ministry Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Young Adults Ministry"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dept Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="YAM"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" />
                  Ministry Head / Leader
                </span>
              </label>
              <input
                type="text"
                value={headPerson}
                onChange={(e) => setHeadPerson(e.target.value)}
                placeholder="e.g. Pastor Johnathan Doe"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  Contact Email
                </span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="ministry@gracecommunitychurch.org"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose & Media Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary recurring events, room assignments, typical equipment needs..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : departmentToEdit ? 'Update Department' : 'Save Department'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
