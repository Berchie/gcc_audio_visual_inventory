import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Boxes,
  MapPin,
  Building,
  Database,
  Lock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UsersManager } from './UsersManager';
import { RolesManager } from './RolesManager';
import { CategoriesManager } from './CategoriesManager';
import { LocationsManager } from './LocationsManager';
import { DepartmentsManager } from './DepartmentsManager';
import { SQLiteDiagnostics } from './SQLiteDiagnostics';

export type AdminSubTab = 'users' | 'roles' | 'categories' | 'locations' | 'departments' | 'sqlite';

export const AdminManagementView: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers, hasAdminPermission, hasPermission } = useApp();

  const allSubTabs: { id: AdminSubTab; label: string; icon: any; isAllowed: boolean }[] = [
    { id: 'users', label: '1. Users', icon: Users, isAllowed: hasPermission('can_manage_users') },
    { id: 'roles', label: '2. Roles & Access', icon: Shield, isAllowed: hasPermission('can_manage_roles') },
    { id: 'categories', label: '3. Categories', icon: Boxes, isAllowed: hasPermission('can_manage_master_data') },
    { id: 'locations', label: '4. Locations', icon: MapPin, isAllowed: hasPermission('can_manage_master_data') },
    { id: 'departments', label: '5. Departments', icon: Building, isAllowed: hasPermission('can_manage_master_data') },
    {
      id: 'sqlite',
      label: 'SQLite WAL Engine',
      icon: Database,
      isAllowed: currentUser.role === 'administrator' || currentUser.roleId === 'administrator' || hasPermission('can_manage_roles'),
    },
  ];

  const subTabs = allSubTabs.filter((t) => t.isAllowed);
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>(() => {
    return subTabs.length > 0 ? subTabs[0].id : 'users';
  });

  // Keep activeSubTab in sync if role permissions change
  useEffect(() => {
    if (subTabs.length > 0 && !subTabs.some((t) => t.id === activeSubTab)) {
      setActiveSubTab(subTabs[0].id);
    }
  }, [subTabs, activeSubTab]);

  const isAdminOrAssigned = subTabs.length > 0;

  // If user does not have any administrative authority:
  if (!isAdminOrAssigned) {
    const adminUser = availableUsers.find(
      (u) => u.role === 'administrator' || u.roleId === 'administrator'
    );

    return (
      <div className="mx-auto max-w-2xl py-12 px-4 text-center">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Administrative Access Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()}).
            Administrative management of Users, Security Roles, Categories, Locations, and Departments requires an Administrator account or assigned administrative authority.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {adminUser && (
              <button
                onClick={() => setCurrentUser(adminUser)}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <UserCheck className="h-4 w-4" />
                <span>Switch to {adminUser.name} (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center rounded-md bg-amber-500/20 px-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
              GOVERNANCE & MASTER DATA
            </span>
            <span className="text-xs text-slate-400">• SQLite WAL Transactional Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            System Administration & Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full add, edit, update, and delete authority for Users, Roles, Categories, Locations, and Departments.
          </p>
        </div>

        {/* Current Auth Badge */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs self-start md:self-auto">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-none">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">
              {currentUser.role} Clearanced
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-sky-500/20 dark:text-sky-300 dark:border dark:border-sky-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IconComp className={`h-4 w-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Sub-Tab View */}
      <div>
        {activeSubTab === 'users' && <UsersManager />}
        {activeSubTab === 'roles' && <RolesManager />}
        {activeSubTab === 'categories' && <CategoriesManager />}
        {activeSubTab === 'locations' && <LocationsManager />}
        {activeSubTab === 'departments' && <DepartmentsManager />}
        {activeSubTab === 'sqlite' && <SQLiteDiagnostics />}
      </div>
    </div>
  );
};
