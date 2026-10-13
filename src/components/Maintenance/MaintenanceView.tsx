import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Tag,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { MaintenanceTask, EquipmentCondition } from '../../types';
import { useApp } from '../../context/AppContext';

export const MaintenanceView: React.FC = () => {
  const { maintenanceTasks, completeMaintenanceTask, equipment, currentUser } = useApp();

  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'due_soon' | 'healthy'>('all');
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState<MaintenanceTask | null>(null);
  const [technicianName, setTechnicianName] = useState(currentUser.name);
  const [serviceNotes, setServiceNotes] = useState('');
  const [newCondition, setNewCondition] = useState<EquipmentCondition>('mint');

  const overdueTasks = maintenanceTasks.filter((t) => t.status === 'overdue');
  const dueSoonTasks = maintenanceTasks.filter((t) => t.status === 'due_soon');
  const healthyTasks = maintenanceTasks.filter((t) => t.status === 'healthy');

  const filteredTasks = maintenanceTasks.filter((t) => {
    if (filterTab === 'all') return true;
    return t.status === filterTab;
  });

  const handleOpenCompleteModal = (task: MaintenanceTask) => {
    setSelectedTaskToComplete(task);
    setTechnicianName(currentUser.name);
    setServiceNotes('Standard maintenance inspection complete. All ports, connectors, and firmware verified.');
    setNewCondition('mint');
  };

  const handleConfirmComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToComplete) return;

    completeMaintenanceTask(
      selectedTaskToComplete.id,
      technicianName.trim(),
      serviceNotes.trim(),
      newCondition
    );

    setSelectedTaskToComplete(null);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Automated Maintenance & Servicing Schedules
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Preventative hardware testing, RF scans, sensor cleanings, and safety cable audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {overdueTasks.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-1.5 text-xs font-bold text-rose-300 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              <span>{overdueTasks.length} Overdue Service Task{overdueTasks.length > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilterTab('all')}
          className={`rounded-lg px-3 py-1.5 font-medium transition ${
            filterTab === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Tasks ({maintenanceTasks.length})
        </button>

        <button
          onClick={() => setFilterTab('overdue')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
            filterTab === 'overdue'
              ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          <span>Overdue ({overdueTasks.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('due_soon')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
            filterTab === 'due_soon'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span>Due Soon ({dueSoonTasks.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('healthy')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
            filterTab === 'healthy'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Compliant / Healthy ({healthyTasks.length})</span>
        </button>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredTasks.map((task) => {
          const item = equipment.find((e) => e.id === task.assetId);
          const isOverdue = task.status === 'overdue';
          const isDueSoon = task.status === 'due_soon';

          return (
            <div
              key={task.id}
              className={`rounded-2xl border p-5 transition shadow-lg flex flex-col justify-between ${
                isOverdue
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : isDueSoon
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-slate-800 bg-slate-900/70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {task.assetId}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {task.category}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isOverdue
                        ? 'bg-rose-500 text-white'
                        : isDueSoon
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-white">
                  {task.taskTitle}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {task.assetName}
                </p>

                <div className="mt-3 rounded-xl bg-slate-900/80 p-3 text-xs text-slate-300 border border-slate-800/80">
                  <span className="font-semibold text-slate-400 block mb-1">
                    Standard Operating Procedure:
                  </span>
                  <p>{task.instructions}</p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cycle Interval:</span>
                    <span className="font-semibold text-slate-200">Every {task.intervalDays} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Next Due Date:</span>
                    <span className={`font-semibold ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Last Tech: {task.lastTechnician || 'Staff'} ({task.lastPerformedDate})
                </span>

                <button
                  onClick={() => handleOpenCompleteModal(task)}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition cursor-pointer"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Log Service & Reset</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Service Modal */}
      {selectedTaskToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log Maintenance Completion</h3>
                <p className="text-xs text-slate-400">
                  {selectedTaskToComplete.assetName} ({selectedTaskToComplete.assetId})
                </p>
              </div>
              <button
                onClick={() => setSelectedTaskToComplete(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmComplete} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Technician / Audio-Visual Engineer Name *
                </label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Inspected Hardware Condition Post-Service *
                </label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value as EquipmentCondition)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white capitalize focus:border-sky-500 focus:outline-none"
                >
                  <option value="mint">Mint (Like New / Verified Fully Operational)</option>
                  <option value="good">Good (Normal Sanctuary Wear)</option>
                  <option value="fair">Fair (Usable with Minor Cosmetical Wear)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Service Notes / Findings *
                </label>
                <textarea
                  rows={3}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  placeholder="Detail test results, replaced parts, cable solder joints, or firmware updates..."
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-850 p-3 text-[11px] text-slate-400">
                <span className="font-semibold text-sky-400 block mb-0.5">Automated Timer Reset:</span>
                Next maintenance cycle will be set {selectedTaskToComplete.intervalDays} days from today. If gear was marked "In Maintenance", it will automatically be restored to "Available".
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskToComplete(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  Complete Service & Reset Timer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
