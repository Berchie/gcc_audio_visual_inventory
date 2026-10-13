import React, { useState } from 'react';
import { X, Shield, Save, AlertCircle, Check, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleDefinition, RolePermissions } from '../../types';

interface AddEditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: RoleDefinition | null;
}

export const AddEditRoleModal: React.FC<AddEditRoleModalProps> = ({
  isOpen,
  onClose,
  roleToEdit,
}) => {
  const { addRole, updateRole } = useApp();

  const [name, setName] = useState(roleToEdit?.name || '');
  const [description, setDescription] = useState(roleToEdit?.description || '');
  const [color, setColor] = useState(roleToEdit?.color || 'sky');

  const [permissions, setPermissions] = useState<RolePermissions>({
    can_manage_users: Boolean(roleToEdit?.permissions?.can_manage_users),
    can_manage_roles: Boolean(roleToEdit?.permissions?.can_manage_roles),
    can_manage_master_data: Boolean(roleToEdit?.permissions?.can_manage_master_data),
    can_manage_equipment: Boolean(roleToEdit?.permissions?.can_manage_equipment),
    can_approve_requests: Boolean(roleToEdit?.permissions?.can_approve_requests),
    can_checkout_checkin: roleToEdit ? Boolean(roleToEdit?.permissions?.can_checkout_checkin) : true,
    can_manage_maintenance: Boolean(roleToEdit?.permissions?.can_manage_maintenance),
    can_perform_audits: roleToEdit ? Boolean(roleToEdit?.permissions?.can_perform_audits) : true,
    can_view_reports: Boolean(roleToEdit?.permissions?.can_view_reports),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePermission = (key: keyof RolePermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Role name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: Partial<RoleDefinition> = {
      name: name.trim(),
      description: description.trim(),
      color,
      permissions,
    };

    let res;
    if (roleToEdit) {
      res = await updateRole(roleToEdit.id, payload);
    } else {
      res = await addRole(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to save role');
    }
  };

  const permissionItems: { key: keyof RolePermissions; label: string; desc: string; category: string }[] = [
    {
      key: 'can_manage_users',
      label: 'User Directory Management',
      desc: 'Add, update, and remove church staff & volunteer accounts.',
      category: 'Governance & Security',
    },
    {
      key: 'can_manage_roles',
      label: 'Security Roles & Access Policies',
      desc: 'Create security roles and reassign granular system permissions.',
      category: 'Governance & Security',
    },
    {
      key: 'can_manage_master_data',
      label: 'Master Data (Categories, Locations, Departments)',
      desc: 'Create, update and delete equipment categories, campus locations and ministries.',
      category: 'Governance & Security',
    },
    {
      key: 'can_manage_equipment',
      label: 'Equipment Catalog Authoring',
      desc: 'Create new gear records, edit specs, retire old assets, and print barcodes.',
      category: 'Operations',
    },
    {
      key: 'can_approve_requests',
      label: 'Program Equipment Request Approvals',
      desc: 'Authorize or reject gear requests submitted by ministries & youth programs.',
      category: 'Operations',
    },
    {
      key: 'can_checkout_checkin',
      label: 'Check-Out & Check-In Authority',
      desc: 'Issue gear to volunteers for services and verify returns.',
      category: 'Operations',
    },
    {
      key: 'can_manage_maintenance',
      label: 'Maintenance & Repairs Logging',
      desc: 'Schedule preventive maintenance and record technical service notes.',
      category: 'Maintenance & Audit',
    },
    {
      key: 'can_perform_audits',
      label: 'Physical Audits & QR Scanning',
      desc: 'Conduct physical walk-around inspections and offline audit syncing.',
      category: 'Maintenance & Audit',
    },
    {
      key: 'can_view_reports',
      label: 'Utilization & Asset Reports',
      desc: 'Access weekly utilization metrics, financial depreciation, and export CSVs.',
      category: 'Analytics',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {roleToEdit ? `Edit Role: ${roleToEdit.name}` : 'Create Security Role'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure role access privileges and permissions matrix
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Media Production Supervisor"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Badge Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="amber">Amber (Executive/Admin)</option>
                <option value="sky">Sky Blue (Staff/Engineer)</option>
                <option value="emerald">Emerald (Volunteer/Team)</option>
                <option value="purple">Purple (Ministry Leader)</option>
                <option value="indigo">Indigo (Technical Arts)</option>
                <option value="rose">Rose (High Security)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Scope of Authority
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the functional responsibilities and clearance level of this role..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Granular Permissions Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Access Permissions Matrix
              </h3>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Checked grants access
              </span>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
              {permissionItems.map((item) => {
                const isChecked = permissions[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => togglePermission(item.key)}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition cursor-pointer ${
                      isChecked
                        ? 'border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition mt-0.5 ${
                        isChecked
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-slate-400 dark:border-slate-600 bg-transparent'
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
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
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-500 transition shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : roleToEdit ? 'Update Role' : 'Create Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
