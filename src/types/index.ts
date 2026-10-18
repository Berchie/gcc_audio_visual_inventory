export type UserRole = 'administrator' | 'staff' | 'volunteer' | 'requester' | string;

export interface RolePermissions {
  can_manage_users: boolean;
  can_manage_roles: boolean;
  can_manage_master_data: boolean;
  can_manage_equipment: boolean;
  can_approve_requests: boolean;
  can_checkout_checkin: boolean;
  can_manage_maintenance: boolean;
  can_perform_audits: boolean;
  can_view_reports: boolean;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  color: string;
  permissions: RolePermissions;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  subCategories: string[];
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationDefinition {
  id: string;
  name: string;
  building?: string;
  room?: string;
  description?: string;
  isStorage: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentDefinition {
  id: string;
  name: string;
  code?: string;
  headPerson?: string;
  contactEmail?: string;
  description?: string;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleId?: string;
  roleName?: string;
  roleColor?: string;
  rolePermissions?: Partial<RolePermissions>;
  department: string;
  avatar?: string;
  title: string;
  phone?: string;
  status?: string;
}

export type EquipmentCategory = 
  | 'Audio'
  | 'Video & Cameras'
  | 'Lighting'
  | 'Computing & Media'
  | 'Cables & Interconnects'
  | 'Staging & Rigging'
  | string;

export type EquipmentStatus = 
  | 'available'
  | 'checked_out'
  | 'in_maintenance'
  | 'reserved'
  | 'retired';

export type EquipmentCondition = 
  | 'mint'
  | 'good'
  | 'fair'
  | 'needs_attention'
  | 'damaged';

export interface EquipmentItem {
  id: string; // e.g. "AUD-MIC-01"
  name: string;
  category: EquipmentCategory;
  subCategory: string;
  brand: string;
  model: string;
  serialNumber: string;
  barcode: string; // scanned string
  location: string; // e.g. "Sound Booth Rack A", "Video Control Room Shelf 2"
  status: EquipmentStatus;
  condition: EquipmentCondition;
  purchaseDate: string;
  replacementCost: number; // GBP (£)
  assignedTo?: string; // name of current borrower
  assignedRole?: string;
  borrowerDepartment?: string;
  checkedOutAt?: string;
  dueAt?: string;
  checkoutEvent?: string; // e.g. "Sunday 10:30 AM Service"
  notes?: string;
  
  // Maintenance tracking
  maintenanceIntervalDays: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceNotes?: string;
  
  // Audit
  lastAuditedDate: string;
  lastAuditedBy?: string;
  totalCheckoutsCount: number;

  // Media
  imageUrl?: string;
}

export type AuditActionType = 
  | 'check_out'
  | 'check_in'
  | 'maintenance_completed'
  | 'maintenance_flagged'
  | 'inventory_audited'
  | 'request_approved'
  | 'request_rejected'
  | 'request_edited'
  | 'item_created'
  | 'item_updated'
  | 'status_changed';

export interface RequestFieldDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

export interface RequestAuditChange {
  id?: string;
  timestamp: string;
  editorId: string;
  editorName: string;
  editorRole: string;
  action: 'created' | 'edited' | 'status_change';
  summary: string;
  changes?: RequestFieldDiff[];
}

export interface AuditTrailLog {
  id: string;
  assetId: string;
  assetName: string;
  action: AuditActionType;
  userId: string;
  userName: string;
  userRole: UserRole;
  programOrEvent: string;
  department: string;
  timestamp: string;
  conditionBefore?: EquipmentCondition;
  conditionAfter?: EquipmentCondition;
  details: string;
  offlineGenerated?: boolean;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';

export interface EquipmentRequest {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterDept: string; // e.g. "Youth Ministry", "Children's Church", "Worship Team", "Outreach", "Pastoral"
  programName: string; // e.g. "Youth Summer Camp Kickoff", "Easter Outdoor Sunrise Service"
  location: string;
  startDate: string;
  endDate: string;
  requestedAssetIds: string[];
  purpose: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  managerNotes?: string;
  urgent: boolean;
  auditTrail?: RequestAuditChange[];
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface MaintenanceTask {
  id: string;
  assetId: string;
  assetName: string;
  category: EquipmentCategory;
  taskTitle: string;
  intervalDays: number;
  lastPerformedDate: string;
  dueDate: string;
  status: 'healthy' | 'due_soon' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  instructions: string;
  lastTechnician?: string;
}

export interface OfflineAuditEntry {
  id: string;
  assetId: string;
  assetName: string;
  scannedAt: string;
  venueLocation: string;
  verifiedCondition: EquipmentCondition;
  notes?: string;
  status: 'pending_sync' | 'synced';
}

export interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'request' | 'maintenance' | 'checkout' | 'system';
  read: boolean;
  actionUrl?: string;
  requestId?: string;
  assetId?: string;
}

export interface WeeklyUtilizationSummary {
  weekLabel: string;
  totalCheckouts: number;
  mostUsedCategory: string;
  topBorrowedItem: string;
  utilizationRatePercentage: number;
  activeItemsCount: number;
  totalAssetValue: number;
  maintenanceCompleted: number;
  auditedCount: number;
}

export type ActiveTab = 
  | 'dashboard'
  | 'catalog'
  | 'requests'
  | 'maintenance'
  | 'audit'
  | 'reports'
  | 'admin';
