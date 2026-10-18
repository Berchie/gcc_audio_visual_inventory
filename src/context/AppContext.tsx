import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  EquipmentItem,
  EquipmentRequest,
  AuditTrailLog,
  MaintenanceTask,
  OfflineAuditEntry,
  PushNotificationItem,
  EquipmentCondition,
  RoleDefinition,
  RolePermissions,
  CategoryDefinition,
  LocationDefinition,
  DepartmentDefinition,
  ActiveTab,
  RequestAuditChange,
  RequestFieldDiff,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EQUIPMENT,
  INITIAL_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MAINTENANCE_TASKS,
  INITIAL_ROLES,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_DEPARTMENTS,
} from '../data/initialData';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  
  // Users Management
  users: UserProfile[];
  addUser: (userData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, userData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  assignUserRole: (userId: string, roleId: string) => Promise<{ success: boolean; error?: string }>;

  // Roles & Security Access
  roles: RoleDefinition[];
  addRole: (roleData: Partial<RoleDefinition>) => Promise<{ success: boolean; error?: string }>;
  updateRole: (id: string, roleData: Partial<RoleDefinition>) => Promise<{ success: boolean; error?: string }>;
  deleteRole: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Categories
  categories: CategoryDefinition[];
  addCategory: (categoryData: Partial<CategoryDefinition>) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (id: string, categoryData: Partial<CategoryDefinition>) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Locations
  locations: LocationDefinition[];
  addLocation: (locationData: Partial<LocationDefinition>) => Promise<{ success: boolean; error?: string }>;
  updateLocation: (id: string, locationData: Partial<LocationDefinition>) => Promise<{ success: boolean; error?: string }>;
  deleteLocation: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Departments
  departments: DepartmentDefinition[];
  addDepartment: (departmentData: Partial<DepartmentDefinition>) => Promise<{ success: boolean; error?: string }>;
  updateDepartment: (id: string, departmentData: Partial<DepartmentDefinition>) => Promise<{ success: boolean; error?: string }>;
  deleteDepartment: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Governance & Permissions
  hasAdminPermission: (permission?: keyof RolePermissions) => boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  canAccessTab: (tab: ActiveTab) => boolean;
  userPermissions: RolePermissions;
  activePermissionsCount: number;

  // SQLite Engine Diagnostics
  sqliteStatus: any;
  refreshSqliteStatus: () => Promise<void>;
  runConcurrencyBenchmark: () => Promise<any>;

  // Equipment
  equipment: EquipmentItem[];
  getEquipmentById: (id: string) => EquipmentItem | undefined;
  checkOutItem: (
    assetId: string,
    borrowerName: string,
    borrowerDept: string,
    dueAt: string,
    eventName: string,
    notes?: string
  ) => boolean;
  checkInItem: (
    assetId: string,
    condition: EquipmentCondition,
    location: string,
    notes?: string
  ) => boolean;
  addEquipment: (item: Omit<EquipmentItem, 'totalCheckoutsCount'>) => void;
  updateEquipment: (item: EquipmentItem) => void;
  updateEquipmentImage: (assetId: string, imageUrl: string) => Promise<boolean>;
  deleteEquipment: (id: string) => boolean;
  
  // Requests & Approval Workflow
  requests: EquipmentRequest[];
  createRequest: (data: Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateRequest: (
    requestId: string,
    updatedData: Partial<EquipmentRequest>,
    changeReason?: string
  ) => Promise<boolean>;
  approveRequest: (requestId: string, notes: string) => void;
  rejectRequest: (requestId: string, notes: string) => void;
  
  // Maintenance
  maintenanceTasks: MaintenanceTask[];
  completeMaintenanceTask: (
    taskId: string,
    technician: string,
    notes: string,
    newCondition?: EquipmentCondition
  ) => void;
  flagItemMaintenance: (assetId: string, reason: string) => void;
  
  // Audit Trails
  auditLogs: AuditTrailLog[];
  
  // Offline Audits
  isOnline: boolean;
  forcedOffline: boolean;
  toggleForcedOffline: () => void;
  pendingOfflineAudits: OfflineAuditEntry[];
  recordAuditScan: (
    assetId: string,
    venueLocation: string,
    condition: EquipmentCondition,
    notes?: string
  ) => { success: boolean; isOffline: boolean; message: string };
  syncPendingAudits: () => Promise<number>;
  clearPendingAudits: () => void;

  // Push Notifications
  notifications: PushNotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  sendPushNotification: (title: string, message: string, type?: PushNotificationItem['type'], extra?: { requestId?: string; assetId?: string }) => void;
  
  // Theme (Light / Dark)
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // System Tools
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'sanctuary_user_v1',
  USERS: 'sanctuary_users_v2',
  ROLES: 'sanctuary_roles_v2',
  CATEGORIES: 'sanctuary_categories_v2',
  LOCATIONS: 'sanctuary_locations_v2',
  DEPARTMENTS: 'sanctuary_departments_v2',
  EQUIPMENT: 'sanctuary_equipment_v1',
  REQUESTS: 'sanctuary_requests_v1',
  LOGS: 'sanctuary_logs_v1',
  MAINTENANCE: 'sanctuary_maintenance_v1',
  OFFLINE_AUDITS: 'sanctuary_offline_audits_v1',
  NOTIFICATIONS: 'sanctuary_notifications_v1',
  THEME: 'gccmedia_theme_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state (Dark by default for church media booth environment)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. Users state
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_USERS;
  });

  // 2. Roles state
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_ROLES;
  });

  // 3. Categories state
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_CATEGORIES;
  });

  // 4. Locations state
  const [locations, setLocations] = useState<LocationDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_LOCATIONS;
  });

  // 5. Departments state
  const [departments, setDepartments] = useState<DepartmentDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_DEPARTMENTS;
  });

  // SQLite stats state
  const [sqliteStatus, setSqliteStatus] = useState<any>(null);

  // Current user
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_USERS[0]; // Admin by default
  });

  // Equipment catalog
  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_EQUIPMENT;
  });

  // Requests
  const [requests, setRequests] = useState<EquipmentRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_REQUESTS;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditTrailLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Maintenance Tasks
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_MAINTENANCE_TASKS;
  });

  // Offline Pending Audits
  const [pendingOfflineAudits, setPendingOfflineAudits] = useState<OfflineAuditEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_AUDITS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Notifications
  const [notifications, setNotifications] = useState<PushNotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: 'notif-1',
        title: 'New Equipment Request',
        message: 'Grace Lin (Youth Ministry) requested 3 items for Youth Fall Retreat.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        type: 'request',
        read: false,
        requestId: 'REQ-2026-104',
      },
      {
        id: 'notif-2',
        title: 'Maintenance Overdue',
        message: 'Hollyland Mars 400S Pro antenna connector inspection is overdue.',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        type: 'maintenance',
        read: false,
        assetId: 'VID-TX-01',
      },
    ];
  });

  // Connectivity
  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [forcedOffline, setForcedOffline] = useState<boolean>(false);
  const isOnline = browserOnline && !forcedOffline;

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save states to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenanceTasks));
  }, [maintenanceTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_AUDITS, JSON.stringify(pendingOfflineAudits));
  }, [pendingOfflineAudits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const toggleForcedOffline = () => {
    setForcedOffline((prev) => !prev);
  };

  const getEquipmentById = (id: string) => {
    return equipment.find((item) => item.id.toLowerCase() === id.toLowerCase() || item.barcode.toLowerCase() === id.toLowerCase());
  };

  // Push notifications helper
  const sendPushNotification = (
    title: string,
    message: string,
    type: PushNotificationItem['type'] = 'system',
    extra?: { requestId?: string; assetId?: string }
  ) => {
    const newNotif: PushNotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
      requestId: extra?.requestId,
      assetId: extra?.assetId,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Native browser push notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/icon.svg',
        });
      } catch (err) {
        // Ignored in non-supporting contexts
      }
    }
  };

  // Check out equipment
  const checkOutItem = (
    assetId: string,
    borrowerName: string,
    borrowerDept: string,
    dueAt: string,
    eventName: string,
    notes?: string
  ): boolean => {
    const item = getEquipmentById(assetId);
    if (!item) return false;

    const now = new Date().toISOString();
    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === item.id) {
          return {
            ...eq,
            status: 'checked_out',
            assignedTo: borrowerName,
            borrowerDepartment: borrowerDept,
            checkedOutAt: now,
            dueAt: dueAt,
            checkoutEvent: eventName,
            totalCheckoutsCount: eq.totalCheckoutsCount + 1,
            notes: notes ? `${notes} (Checked out by ${currentUser.name})` : eq.notes,
          };
        }
        return eq;
      })
    );

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: item.id,
      assetName: item.name,
      action: 'check_out',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: eventName,
      department: borrowerDept,
      timestamp: now,
      conditionBefore: item.condition,
      conditionAfter: item.condition,
      details: `Checked out to ${borrowerName} (${borrowerDept}) for '${eventName}'. Due: ${new Date(dueAt).toLocaleDateString()}`,
      offlineGenerated: !isOnline,
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Persist to SQLite
    if (isOnline) {
      fetch(`/api/equipment/${encodeURIComponent(assetId)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowerName,
          borrowerRole: 'Staff',
          department: borrowerDept,
          eventName,
          dueAt,
          user: currentUser,
        }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite checkout sync error:', e));
    }

    sendPushNotification(
      'Gear Checked Out',
      `${item.name} checked out to ${borrowerName} for ${eventName}.`,
      'checkout',
      { assetId: item.id }
    );

    return true;
  };

  // Check in equipment
  const checkInItem = (
    assetId: string,
    condition: EquipmentCondition,
    location: string,
    notes?: string
  ): boolean => {
    const item = getEquipmentById(assetId);
    if (!item) return false;

    const now = new Date().toISOString();
    const oldCondition = item.condition;
    const oldBorrower = item.assignedTo || 'Unknown';
    const oldEvent = item.checkoutEvent || 'Recent Service';

    const willNeedMaintenance = condition === 'damaged' || condition === 'needs_attention';

    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === item.id) {
          return {
            ...eq,
            status: willNeedMaintenance ? 'in_maintenance' : 'available',
            condition: condition,
            location: location || eq.location,
            assignedTo: undefined,
            assignedRole: undefined,
            borrowerDepartment: undefined,
            checkedOutAt: undefined,
            dueAt: undefined,
            checkoutEvent: undefined,
            notes: notes || eq.notes,
          };
        }
        return eq;
      })
    );

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: item.id,
      assetName: item.name,
      action: 'check_in',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: oldEvent,
      department: item.borrowerDepartment || 'Media Ministry',
      timestamp: now,
      conditionBefore: oldCondition,
      conditionAfter: condition,
      details: `Returned from ${oldBorrower}. Stored at ${location || item.location}. Condition: ${condition}. ${notes || ''}`,
      offlineGenerated: !isOnline,
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Persist to SQLite
    if (isOnline) {
      fetch(`/api/equipment/${encodeURIComponent(assetId)}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition,
          notes,
          location,
          user: currentUser,
        }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite checkin sync error:', e));
    }

    if (willNeedMaintenance) {
      flagItemMaintenance(item.id, `Reported ${condition} on check-in: ${notes || 'Visual wear or malfunction noted'}`);
    }

    sendPushNotification(
      'Gear Checked In',
      `${item.name} checked back in. Condition: ${condition}.`,
      'checkout',
      { assetId: item.id }
    );

    return true;
  };

  // Flag maintenance
  const flagItemMaintenance = (assetId: string, reason: string) => {
    const item = getEquipmentById(assetId);
    if (!item) return;

    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === item.id) {
          return {
            ...eq,
            status: 'in_maintenance',
            maintenanceNotes: reason,
          };
        }
        return eq;
      })
    );

    const newTask: MaintenanceTask = {
      id: `MAINT-${Date.now().toString().slice(-4)}`,
      assetId: item.id,
      assetName: item.name,
      category: item.category,
      taskTitle: `Inspect & Repair: ${reason.slice(0, 40)}`,
      intervalDays: 30,
      lastPerformedDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      status: 'overdue',
      priority: 'high',
      instructions: reason,
    };

    setMaintenanceTasks((prev) => [newTask, ...prev]);

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: item.id,
      assetName: item.name,
      action: 'maintenance_flagged',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: 'Maintenance Queue',
      department: 'Media & Technical Arts',
      timestamp: new Date().toISOString(),
      details: `Flagged for maintenance: ${reason}`,
      offlineGenerated: !isOnline,
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isOnline) {
      fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite maintenance sync error:', e));
    }

    sendPushNotification(
      'Maintenance Alert',
      `${item.name} requires maintenance: ${reason}`,
      'maintenance',
      { assetId: item.id }
    );
  };

  // Complete maintenance task
  const completeMaintenanceTask = (
    taskId: string,
    technician: string,
    notes: string,
    newCondition: EquipmentCondition = 'mint'
  ) => {
    const task = maintenanceTasks.find((t) => t.id === taskId);
    if (!task) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const nextDue = new Date(Date.now() + task.intervalDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    setMaintenanceTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            lastPerformedDate: todayStr,
            dueDate: nextDue,
            status: 'healthy',
            lastTechnician: technician,
          };
        }
        return t;
      })
    );

    // Update gear item
    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === task.assetId) {
          return {
            ...eq,
            status: eq.status === 'in_maintenance' ? 'available' : eq.status,
            condition: newCondition,
            lastMaintenanceDate: todayStr,
            nextMaintenanceDate: nextDue,
            maintenanceNotes: notes,
          };
        }
        return eq;
      })
    );

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: task.assetId,
      assetName: task.assetName,
      action: 'maintenance_completed',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: 'Scheduled Servicing',
      department: 'Media & Technical Arts',
      timestamp: new Date().toISOString(),
      conditionAfter: newCondition,
      details: `Serviced by ${technician}: ${notes}. Next due: ${nextDue}`,
      offlineGenerated: !isOnline,
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isOnline) {
      fetch(`/api/maintenance/${encodeURIComponent(taskId)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician,
          condition: newCondition,
          notes,
          user: currentUser,
        }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite maintenance complete sync error:', e));
    }

    sendPushNotification(
      'Maintenance Completed',
      `${task.assetName} serviced by ${technician}. Restored to active rotation.`,
      'maintenance',
      { assetId: task.assetId }
    );
  };

  // Add equipment
  const addEquipment = (newItemData: Omit<EquipmentItem, 'totalCheckoutsCount'>) => {
    const item: EquipmentItem = {
      ...newItemData,
      totalCheckoutsCount: 0,
    };
    setEquipment((prev) => [item, ...prev]);

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: item.id,
      assetName: item.name,
      action: 'item_created',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: 'Catalog Ingestion',
      department: 'Media & Technical Arts',
      timestamp: new Date().toISOString(),
      details: `New asset added: ${item.name} (${item.category}) with ID ${item.id}`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isOnline) {
      fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, creatorId: currentUser.id, creatorName: currentUser.name }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite addEquipment error:', e));
    }
  };

  // Update equipment
  const updateEquipment = (updatedItem: EquipmentItem) => {
    setEquipment((prev) => prev.map((eq) => (eq.id === updatedItem.id ? updatedItem : eq)));

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: updatedItem.id,
      assetName: updatedItem.name,
      action: 'item_updated',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: 'Asset Record Update',
      department: 'Media & Technical Arts',
      timestamp: new Date().toISOString(),
      details: `Asset details updated for ${updatedItem.id} by ${currentUser.name}`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isOnline) {
      fetch(`/api/equipment/${encodeURIComponent(updatedItem.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite updateEquipment error:', e));
    }
  };

  // Update equipment image
  const updateEquipmentImage = async (assetId: string, imageUrl: string): Promise<boolean> => {
    setEquipment((prev) =>
      prev.map((eq) => (eq.id === assetId ? { ...eq, imageUrl: imageUrl || undefined } : eq))
    );

    const item = getEquipmentById(assetId);
    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId,
      assetName: item?.name || 'Asset',
      action: 'item_updated',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: 'Asset Photo Update',
      department: 'Media & Technical Arts',
      timestamp: new Date().toISOString(),
      details: imageUrl ? `Photo updated for ${assetId} by ${currentUser.name}` : `Photo removed for ${assetId}`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isOnline) {
      try {
        await fetch(`/api/equipment/${encodeURIComponent(assetId)}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, user: currentUser }),
        });
        refreshSqliteStatus();
      } catch (e) {
        console.warn('SQLite updateEquipmentImage error:', e);
      }
    }
    return true;
  };

  // Delete equipment
  const deleteEquipment = (id: string): boolean => {
    const item = getEquipmentById(id);
    if (!item) return false;
    setEquipment((prev) => prev.filter((eq) => eq.id !== id));

    if (isOnline) {
      fetch(`/api/equipment/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite deleteEquipment error:', e));
    }
    return true;
  };

  // Create request (from another church department)
  const createRequest = (data: Omit<EquipmentRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: EquipmentRequest = {
      ...data,
      id: `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);

    if (isOnline) {
      fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newReq, requesterId: currentUser.id }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite createRequest error:', e));
    }

    // Push notification to Media Manager / Admins
    sendPushNotification(
      `New Request: ${newReq.programName}`,
      `${newReq.requesterName} (${newReq.requesterDept}) requested ${newReq.requestedAssetIds.length} item(s). Requires authorization.`,
      'request',
      { requestId: newReq.id }
    );
  };

  // Approve request
  const approveRequest = (requestId: string, notes: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'approved',
            reviewedBy: currentUser.name,
            reviewedAt: new Date().toISOString(),
            managerNotes: notes,
          };
        }
        return r;
      })
    );

    // Reserve available gear
    setEquipment((prev) =>
      prev.map((eq) => {
        if (req.requestedAssetIds.includes(eq.id) && eq.status === 'available') {
          return {
            ...eq,
            status: 'reserved',
            notes: `Reserved for ${req.programName} (${req.requesterDept})`,
          };
        }
        return eq;
      })
    );

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: req.requestedAssetIds.join(','),
      assetName: `${req.requestedAssetIds.length} assets for ${req.programName}`,
      action: 'request_approved',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: req.programName,
      department: req.requesterDept,
      timestamp: new Date().toISOString(),
      details: `Approved by ${currentUser.name}: ${notes || 'Authorization granted'}`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isOnline) {
      fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          reviewedBy: currentUser.name,
          managerNotes: notes,
          user: currentUser,
        }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite approveRequest error:', e));
    }

    sendPushNotification(
      'Request Approved',
      `Equipment request for "${req.programName}" approved by ${currentUser.name}.`,
      'request',
      { requestId: req.id }
    );
  };

  // Reject request
  const rejectRequest = (requestId: string, notes: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'rejected',
            reviewedBy: currentUser.name,
            reviewedAt: new Date().toISOString(),
            managerNotes: notes,
          };
        }
        return r;
      })
    );

    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: req.requestedAssetIds.join(','),
      assetName: req.programName,
      action: 'request_rejected',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: req.programName,
      department: req.requesterDept,
      timestamp: new Date().toISOString(),
      details: `Declined by ${currentUser.name}: ${notes}`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    if (isOnline) {
      fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          reviewedBy: currentUser.name,
          managerNotes: notes,
          user: currentUser,
        }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite rejectRequest error:', e));
    }

    sendPushNotification(
      'Request Declined',
      `Request for "${req.programName}" declined: ${notes}`,
      'request',
      { requestId: req.id }
    );
  };

  // Edit request while pending authorization
  const updateRequest = async (
    requestId: string,
    updatedData: Partial<EquipmentRequest>,
    changeReason?: string
  ): Promise<boolean> => {
    const existing = requests.find((r) => r.id === requestId);
    if (!existing) return false;

    // Check if status is pending
    if (existing.status !== 'pending') {
      console.warn('Cannot edit request that is not pending authorization.');
      return false;
    }

    // Build diff of changes
    const changes: RequestFieldDiff[] = [];
    const changeSummaryParts: string[] = [];

    if (updatedData.programName !== undefined && updatedData.programName !== existing.programName) {
      changes.push({
        field: 'programName',
        label: 'Program / Event Title',
        oldValue: existing.programName,
        newValue: updatedData.programName,
      });
      changeSummaryParts.push(`Program title changed to "${updatedData.programName}"`);
    }

    if (updatedData.location !== undefined && updatedData.location !== existing.location) {
      changes.push({
        field: 'location',
        label: 'Setup Location',
        oldValue: existing.location,
        newValue: updatedData.location,
      });
      changeSummaryParts.push(`Location changed to "${updatedData.location}"`);
    }

    if (updatedData.startDate !== undefined && updatedData.startDate !== existing.startDate) {
      changes.push({
        field: 'startDate',
        label: 'Start Date & Time',
        oldValue: existing.startDate,
        newValue: updatedData.startDate,
      });
      changeSummaryParts.push('Start time adjusted');
    }

    if (updatedData.endDate !== undefined && updatedData.endDate !== existing.endDate) {
      changes.push({
        field: 'endDate',
        label: 'End Date & Time',
        oldValue: existing.endDate,
        newValue: updatedData.endDate,
      });
      changeSummaryParts.push('End time adjusted');
    }

    if (updatedData.purpose !== undefined && updatedData.purpose !== existing.purpose) {
      changes.push({
        field: 'purpose',
        label: 'Requisition Purpose',
        oldValue: existing.purpose,
        newValue: updatedData.purpose,
      });
      changeSummaryParts.push('Purpose description updated');
    }

    if (updatedData.requesterDept !== undefined && updatedData.requesterDept !== existing.requesterDept) {
      changes.push({
        field: 'requesterDept',
        label: 'Department',
        oldValue: existing.requesterDept,
        newValue: updatedData.requesterDept,
      });
      changeSummaryParts.push(`Department changed to "${updatedData.requesterDept}"`);
    }

    if (updatedData.urgent !== undefined && updatedData.urgent !== existing.urgent) {
      changes.push({
        field: 'urgent',
        label: 'Urgent Priority',
        oldValue: existing.urgent ? 'Yes' : 'No',
        newValue: updatedData.urgent ? 'Yes' : 'No',
      });
      changeSummaryParts.push(updatedData.urgent ? 'Flagged as Urgent Priority' : 'Urgent flag removed');
    }

    if (updatedData.requestedAssetIds !== undefined) {
      const oldSet = new Set(existing.requestedAssetIds);
      const newSet = new Set(updatedData.requestedAssetIds);
      const added = updatedData.requestedAssetIds.filter((x) => !oldSet.has(x));
      const removed = existing.requestedAssetIds.filter((x) => !newSet.has(x));

      if (added.length > 0 || removed.length > 0) {
        changes.push({
          field: 'requestedAssetIds',
          label: 'Requested Assets',
          oldValue: existing.requestedAssetIds,
          newValue: updatedData.requestedAssetIds,
        });

        const assetParts: string[] = [];
        if (added.length > 0) assetParts.push(`+${added.length} added (${added.join(', ')})`);
        if (removed.length > 0) assetParts.push(`-${removed.length} removed (${removed.join(', ')})`);
        changeSummaryParts.push(`Assets modified: ${assetParts.join(', ')}`);
      }
    }

    const defaultSummary = changeSummaryParts.length > 0
      ? changeSummaryParts.join('; ')
      : 'Requisition details updated';

    const fullSummary = changeReason?.trim()
      ? `${defaultSummary} • Reason: ${changeReason.trim()}`
      : defaultSummary;

    const now = new Date().toISOString();
    const auditEntry: RequestAuditChange = {
      id: `CHG-${Date.now().toString().slice(-4)}`,
      timestamp: now,
      editorId: currentUser.id,
      editorName: currentUser.name,
      editorRole: currentUser.role,
      action: 'edited',
      summary: fullSummary,
      changes,
    };

    const updatedRequest: EquipmentRequest = {
      ...existing,
      ...updatedData,
      updatedAt: now,
      lastEditedBy: currentUser.name,
      lastEditedAt: now,
      auditTrail: [auditEntry, ...(existing.auditTrail || [])],
    };

    // Update in React State
    setRequests((prev) => prev.map((r) => (r.id === requestId ? updatedRequest : r)));

    // Record in global Audit Trail Logs
    const log: AuditTrailLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      assetId: (updatedData.requestedAssetIds || existing.requestedAssetIds).join(','),
      assetName: `Requisition: ${updatedRequest.programName}`,
      action: 'request_edited',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      programOrEvent: updatedRequest.programName,
      department: updatedRequest.requesterDept,
      timestamp: now,
      details: `Request ${requestId} modified while pending authorisation by ${currentUser.name} (${currentUser.role}): ${fullSummary}`,
      offlineGenerated: !isOnline,
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Persist to SQLite
    if (isOnline) {
      try {
        await fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updatedData,
            auditEntry,
            user: currentUser,
          }),
        });
        refreshSqliteStatus();
      } catch (e) {
        console.warn('SQLite updateRequest error:', e);
      }
    }

    sendPushNotification(
      'Requisition Modified',
      `Pending request for "${updatedRequest.programName}" was edited by ${currentUser.name}.`,
      'request',
      { requestId }
    );

    return true;
  };

  // Audit scanning (Supports both Online and Offline walk-arounds)
  const recordAuditScan = (
    assetId: string,
    venueLocation: string,
    condition: EquipmentCondition,
    notes?: string
  ): { success: boolean; isOffline: boolean; message: string } => {
    const item = getEquipmentById(assetId);
    if (!item) {
      return { success: false, isOffline: !isOnline, message: `Asset "${assetId}" not recognized in catalog.` };
    }

    const scanTimestamp = new Date().toISOString();

    if (!isOnline) {
      // Store in offline sync queue
      const offlineEntry: OfflineAuditEntry = {
        id: `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        assetId: item.id,
        assetName: item.name,
        scannedAt: scanTimestamp,
        venueLocation,
        verifiedCondition: condition,
        notes,
        status: 'pending_sync',
      };
      setPendingOfflineAudits((prev) => [...prev, offlineEntry]);

      return {
        success: true,
        isOffline: true,
        message: `Offline walk-around: Saved ${item.id} to local queue. Will sync when online.`,
      };
    } else {
      // Online direct update
      const today = scanTimestamp.slice(0, 10);
      setEquipment((prev) =>
        prev.map((eq) => {
          if (eq.id === item.id) {
            return {
              ...eq,
              location: venueLocation,
              condition: condition,
              lastAuditedDate: today,
              lastAuditedBy: currentUser.name,
            };
          }
          return eq;
        })
      );

      const log: AuditTrailLog = {
        id: `LOG-${Date.now().toString().slice(-5)}`,
        assetId: item.id,
        assetName: item.name,
        action: 'inventory_audited',
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        programOrEvent: `Audit: ${venueLocation}`,
        department: 'Media & Technical Arts',
        timestamp: scanTimestamp,
        conditionBefore: item.condition,
        conditionAfter: condition,
        details: `Audited at ${venueLocation}. Physical condition: ${condition}. ${notes || ''}`,
      };
      setAuditLogs((prev) => [log, ...prev]);

      fetch(`/api/equipment/${encodeURIComponent(item.id)}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueLocation,
          verifiedCondition: condition,
          notes,
          user: currentUser,
          isOffline: false,
        }),
      })
        .then(() => refreshSqliteStatus())
        .catch((e) => console.warn('SQLite audit scan sync error:', e));

      return {
        success: true,
        isOffline: false,
        message: `Direct Sync: Audited ${item.id} at ${venueLocation}.`,
      };
    }
  };

  // Sync pending offline audits when back online
  const syncPendingAudits = async (): Promise<number> => {
    if (pendingOfflineAudits.length === 0) return 0;

    const count = pendingOfflineAudits.length;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    // Apply all offline audits to equipment and log them locally
    const newLogs: AuditTrailLog[] = [];

    setEquipment((prev) => {
      const map = new Map(prev.map((item) => [item.id, { ...item }]));

      for (const entry of pendingOfflineAudits) {
        const item = map.get(entry.assetId);
        if (item) {
          const oldCond = item.condition;
          item.location = entry.venueLocation;
          item.condition = entry.verifiedCondition;
          item.lastAuditedDate = today;
          item.lastAuditedBy = `${currentUser.name} (Offline Sync)`;

          newLogs.push({
            id: `LOG-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 999)}`,
            assetId: item.id,
            assetName: item.name,
            action: 'inventory_audited',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            programOrEvent: `Offline Audit Sync: ${entry.venueLocation}`,
            department: 'Media & Technical Arts',
            timestamp: entry.scannedAt,
            conditionBefore: oldCond,
            conditionAfter: entry.verifiedCondition,
            details: `Synced from offline walk-around. Location: ${entry.venueLocation}. Condition: ${entry.verifiedCondition}.`,
            offlineGenerated: true,
          });
        }
      }

      return Array.from(map.values());
    });

    if (newLogs.length > 0) {
      setAuditLogs((prev) => [...newLogs, ...prev]);
    }

    // Persist batch to SQLite
    try {
      await fetch('/api/audit-logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: pendingOfflineAudits, user: currentUser }),
      });
      await fetchAllData();
    } catch (e) {
      console.warn('Batch audit SQLite sync warning:', e);
    }

    setPendingOfflineAudits([]);

    sendPushNotification(
      'Offline Audits Synced',
      `Successfully synced ${count} item audit records to SQLite database.`,
      'system'
    );

    return count;
  };

  const clearPendingAudits = () => {
    setPendingOfflineAudits([]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Sync master data to LocalStorage cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  }, [departments]);

  // Load from SQLite server
  const fetchAllData = useCallback(async () => {
    try {
      const [uRes, rRes, cRes, lRes, dRes, eqRes, reqRes, mntRes, logRes, sRes] = await Promise.all([
        fetch('/api/users').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/roles').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/categories').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/locations').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/departments').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/equipment').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/requests').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/maintenance').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/audit-logs').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/system/status').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (uRes?.success && Array.isArray(uRes.data)) {
        setUsers(uRes.data);
      }
      if (rRes?.success && Array.isArray(rRes.data)) {
        setRoles(rRes.data);
      }
      if (cRes?.success && Array.isArray(cRes.data)) {
        setCategories(cRes.data);
      }
      if (lRes?.success && Array.isArray(lRes.data)) {
        setLocations(lRes.data);
      }
      if (dRes?.success && Array.isArray(dRes.data)) {
        setDepartments(dRes.data);
      }
      if (eqRes?.success && Array.isArray(eqRes.data)) {
        setEquipment(eqRes.data);
      }
      if (reqRes?.success && Array.isArray(reqRes.data)) {
        setRequests(reqRes.data);
      }
      if (mntRes?.success && Array.isArray(mntRes.data)) {
        setMaintenanceTasks(mntRes.data);
      }
      if (logRes?.success && Array.isArray(logRes.data)) {
        setAuditLogs(logRes.data);
      }
      if (sRes?.success && sRes.data) {
        setSqliteStatus(sRes.data);
      }
    } catch (err) {
      console.warn('Backend SQLite sync warning:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refresh SQLite status
  const refreshSqliteStatus = async () => {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSqliteStatus(json.data);
      }
    } catch (e) {
      // ignore
    }
  };

  // Run SQLite concurrency benchmark
  const runConcurrencyBenchmark = async () => {
    try {
      const res = await fetch('/api/system/concurrency-test', { method: 'POST' });
      const json = await res.json();
      await fetchAllData();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Comprehensive Permission evaluation
  const hasPermission = useCallback(
    (permission: keyof RolePermissions): boolean => {
      if (!currentUser) return false;

      // 1. Direct Administrator role has full system authority
      if (currentUser.role === 'administrator' || currentUser.roleId === 'administrator') {
        return true;
      }

      // 2. Check if user object has explicit rolePermissions assigned
      if (
        currentUser.rolePermissions &&
        currentUser.rolePermissions[permission] !== undefined
      ) {
        return Boolean(currentUser.rolePermissions[permission]);
      }

      // 3. Look up assigned role in roles table
      const targetRole = roles.find(
        (r) => r.id === (currentUser.roleId || currentUser.role)
      );
      if (
        targetRole &&
        targetRole.permissions &&
        targetRole.permissions[permission] !== undefined
      ) {
        return Boolean(targetRole.permissions[permission]);
      }

      // 4. Default baseline fallback if not in custom roles
      switch (currentUser.role) {
        case 'administrator':
          return true;
        case 'staff':
          return permission !== 'can_manage_users' && permission !== 'can_manage_roles';
        case 'volunteer':
          return permission === 'can_checkout_checkin' || permission === 'can_perform_audits';
        case 'requester':
          return false;
        default:
          return false;
      }
    },
    [currentUser, roles]
  );

  // Active permissions snapshot
  const userPermissions = useMemo<RolePermissions>(() => {
    return {
      can_manage_users: hasPermission('can_manage_users'),
      can_manage_roles: hasPermission('can_manage_roles'),
      can_manage_master_data: hasPermission('can_manage_master_data'),
      can_manage_equipment: hasPermission('can_manage_equipment'),
      can_approve_requests: hasPermission('can_approve_requests'),
      can_checkout_checkin: hasPermission('can_checkout_checkin'),
      can_manage_maintenance: hasPermission('can_manage_maintenance'),
      can_perform_audits: hasPermission('can_perform_audits'),
      can_view_reports: hasPermission('can_view_reports'),
    };
  }, [hasPermission]);

  const activePermissionsCount = useMemo(() => {
    return Object.values(userPermissions).filter(Boolean).length;
  }, [userPermissions]);

  // Tab Access verification based on roles & permissions
  const canAccessTab = useCallback(
    (tab: ActiveTab): boolean => {
      if (!currentUser) return false;
      switch (tab) {
        case 'dashboard':
          return true; // Live production hub visible to all signed-in users
        case 'catalog':
          return true; // Equipment directory browseable by all users
        case 'requests':
          return true; // All users can submit and track ministry requests
        case 'maintenance':
          return hasPermission('can_manage_maintenance');
        case 'audit':
          return hasPermission('can_perform_audits');
        case 'reports':
          return hasPermission('can_view_reports');
        case 'admin':
          return (
            currentUser.role === 'administrator' ||
            currentUser.roleId === 'administrator' ||
            hasPermission('can_manage_users') ||
            hasPermission('can_manage_roles') ||
            hasPermission('can_manage_master_data')
          );
        default:
          return false;
      }
    },
    [currentUser, hasPermission]
  );

  const hasAdminPermission = useCallback(
    (permission?: keyof RolePermissions) => {
      if (!currentUser) return false;
      if (!permission) {
        return (
          currentUser.role === 'administrator' ||
          currentUser.roleId === 'administrator' ||
          hasPermission('can_manage_users') ||
          hasPermission('can_manage_roles') ||
          hasPermission('can_manage_master_data')
        );
      }
      return hasPermission(permission);
    },
    [currentUser, hasPermission]
  );

  // 1. Users CRUD
  const addUser = async (userData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add user');
      }
      await fetchAllData();
      sendPushNotification('New User Added', `${userData.name} was added to the media directory.`, 'system');
      return { success: true };
    } catch (err: any) {
      // Local fallback if offline
      const newU: UserProfile = {
        id: userData.id || `usr-${Date.now().toString().slice(-6)}`,
        name: userData.name || 'New User',
        email: userData.email || '',
        role: (userData.roleId || userData.role || 'staff') as any,
        roleId: userData.roleId || (userData.role as string) || 'staff',
        department: userData.department || 'Media & Technical Arts',
        title: userData.title || 'Team Member',
        phone: userData.phone,
        status: 'active',
      };
      setUsers((prev) => [...prev, newU]);
      return { success: true };
    }
  };

  const updateUser = async (id: string, userData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user');
      }
      await fetchAllData();
      // If updating current active user, sync currentUser state
      if (currentUser.id === id) {
        setCurrentUser((prev) => ({ ...prev, ...userData }));
      }
      return { success: true };
    } catch (err: any) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...userData } : u)));
      if (currentUser.id === id) {
        setCurrentUser((prev) => ({ ...prev, ...userData }));
      }
      return { success: true };
    }
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      if (id === currentUser.id) {
        return { success: false, error: 'Cannot delete the currently logged in user.' };
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return { success: true };
    }
  };

  const assignUserRole = async (userId: string, roleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign role');
      }
      await fetchAllData();
      if (currentUser.id === userId) {
        setCurrentUser((prev) => ({ ...prev, role: roleId as any, roleId }));
      }
      return { success: true };
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: roleId as any, roleId } : u))
      );
      if (currentUser.id === userId) {
        setCurrentUser((prev) => ({ ...prev, role: roleId as any, roleId }));
      }
      return { success: true };
    }
  };

  // 2. Roles CRUD
  const addRole = async (roleData: Partial<RoleDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add role');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      const newR: RoleDefinition = {
        id: roleData.id || `role-${Date.now()}`,
        name: roleData.name || 'Custom Role',
        description: roleData.description || '',
        isSystem: false,
        color: roleData.color || 'sky',
        permissions: roleData.permissions || {
          can_manage_users: false,
          can_manage_roles: false,
          can_manage_master_data: false,
          can_manage_equipment: false,
          can_approve_requests: false,
          can_checkout_checkin: true,
          can_manage_maintenance: false,
          can_perform_audits: true,
          can_view_reports: false,
        },
      };
      setRoles((prev) => [...prev, newR]);
      return { success: true };
    }
  };

  const updateRole = async (id: string, roleData: Partial<RoleDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/roles/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update role');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...roleData } : r)));
      return { success: true };
    }
  };

  const deleteRole = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/roles/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete role');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setRoles((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    }
  };

  // 3. Categories CRUD
  const addCategory = async (categoryData: Partial<CategoryDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add category');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      const newCat: CategoryDefinition = {
        id: categoryData.id || `cat-${Date.now()}`,
        name: categoryData.name || 'New Category',
        description: categoryData.description || '',
        icon: categoryData.icon || 'Boxes',
        color: categoryData.color || 'sky',
        subCategories: categoryData.subCategories || [],
        itemCount: 0,
      };
      setCategories((prev) => [...prev, newCat]);
      return { success: true };
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CategoryDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update category');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...categoryData } : c)));
      return { success: true };
    }
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete category');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    }
  };

  // 4. Locations CRUD
  const addLocation = async (locationData: Partial<LocationDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add location');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      const newLoc: LocationDefinition = {
        id: locationData.id || `loc-${Date.now()}`,
        name: locationData.name || 'New Location',
        building: locationData.building || 'Main Worship Center',
        room: locationData.room || '',
        description: locationData.description || '',
        isStorage: locationData.isStorage !== false,
        itemCount: 0,
      };
      setLocations((prev) => [...prev, newLoc]);
      return { success: true };
    }
  };

  const updateLocation = async (id: string, locationData: Partial<LocationDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/locations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update location');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...locationData } : l)));
      return { success: true };
    }
  };

  const deleteLocation = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/locations/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete location');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setLocations((prev) => prev.filter((l) => l.id !== id));
      return { success: true };
    }
  };

  // 5. Departments CRUD
  const addDepartment = async (departmentData: Partial<DepartmentDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add department');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      const newDept: DepartmentDefinition = {
        id: departmentData.id || `dept-${Date.now()}`,
        name: departmentData.name || 'New Department',
        code: departmentData.code || 'GEN',
        headPerson: departmentData.headPerson || '',
        contactEmail: departmentData.contactEmail || '',
        description: departmentData.description || '',
        userCount: 0,
      };
      setDepartments((prev) => [...prev, newDept]);
      return { success: true };
    }
  };

  const updateDepartment = async (id: string, departmentData: Partial<DepartmentDefinition>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/departments/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update department');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...departmentData } : d)));
      return { success: true };
    }
  };

  const deleteDepartment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/departments/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete department');
      }
      await fetchAllData();
      return { success: true };
    } catch (err: any) {
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      return { success: true };
    }
  };

  const resetToDefaultData = async () => {
    try {
      await fetch('/api/system/reset', { method: 'POST' });
    } catch (e) {
      console.warn('SQLite system reset offline fallback:', e);
    }
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ROLES);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_AUDITS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    setUsers(INITIAL_USERS);
    setRoles(INITIAL_ROLES);
    setCategories(INITIAL_CATEGORIES);
    setLocations(INITIAL_LOCATIONS);
    setDepartments(INITIAL_DEPARTMENTS);
    setEquipment(INITIAL_EQUIPMENT);
    setRequests(INITIAL_REQUESTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setMaintenanceTasks(INITIAL_MAINTENANCE_TASKS);
    setPendingOfflineAudits([]);
    setNotifications([]);
    await fetchAllData();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers: users,
        users,
        addUser,
        updateUser,
        deleteUser,
        assignUserRole,
        roles,
        addRole,
        updateRole,
        deleteRole,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        locations,
        addLocation,
        updateLocation,
        deleteLocation,
        departments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        hasAdminPermission,
        hasPermission,
        canAccessTab,
        userPermissions,
        activePermissionsCount,
        sqliteStatus,
        refreshSqliteStatus,
        runConcurrencyBenchmark,
        equipment,
        getEquipmentById,
        checkOutItem,
        checkInItem,
        addEquipment,
        updateEquipment,
        updateEquipmentImage,
        deleteEquipment,
        requests,
        createRequest,
        updateRequest,
        approveRequest,
        rejectRequest,
        maintenanceTasks,
        completeMaintenanceTask,
        flagItemMaintenance,
        auditLogs,
        isOnline,
        forcedOffline,
        toggleForcedOffline,
        pendingOfflineAudits,
        recordAuditScan,
        syncPendingAudits,
        clearPendingAudits,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendPushNotification,
        theme,
        setTheme,
        toggleTheme,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
