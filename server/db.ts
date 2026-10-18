import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {
  INITIAL_EQUIPMENT,
  INITIAL_REQUESTS,
  INITIAL_MAINTENANCE_TASKS,
  INITIAL_AUDIT_LOGS,
} from '../src/data/initialData';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const DB_PATH = path.join(DATA_DIR, 'gccmedia.db');

// Initialize SQLite database instance
export const db = new DatabaseSync(DB_PATH);

// Configure SQLite for high concurrency and robustness
// 1. WAL mode: allows concurrent readers and writers without blocking each other
// 2. busy_timeout: waits up to 5000ms on locks instead of failing immediately with SQLITE_BUSY
// 3. synchronous NORMAL: safe and performant with WAL
// 4. foreign_keys ON: referential integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA cache_size = -20000;
`);

/**
 * Execute a function within an IMMEDIATE transaction to prevent write-write deadlocks
 * in concurrent environments.
 */
export function runInTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Initialize all database tables
 */
export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      color TEXT DEFAULT 'sky',
      permissions TEXT NOT NULL, -- JSON string
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT,
      head_person TEXT,
      contact_email TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      building TEXT,
      room TEXT,
      description TEXT,
      is_storage INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT,
      sub_categories TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role_id TEXT NOT NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      barcode TEXT,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      condition TEXT NOT NULL,
      purchase_date TEXT,
      replacement_cost REAL DEFAULT 0,
      assigned_to TEXT,
      assigned_role TEXT,
      borrower_department TEXT,
      checked_out_at TEXT,
      due_at TEXT,
      checkout_event TEXT,
      notes TEXT,
      maintenance_interval_days INTEGER DEFAULT 30,
      last_maintenance_date TEXT,
      next_maintenance_date TEXT,
      maintenance_notes TEXT,
      last_audited_date TEXT,
      last_audited_by TEXT,
      total_checkouts_count INTEGER DEFAULT 0,
      image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      requester_name TEXT NOT NULL,
      requester_email TEXT NOT NULL,
      requester_dept TEXT NOT NULL,
      program_name TEXT NOT NULL,
      location TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      requested_asset_ids TEXT NOT NULL, -- JSON array
      purpose TEXT NOT NULL,
      status TEXT NOT NULL,
      urgent INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      manager_notes TEXT,
      audit_trail TEXT -- JSON array of RequestAuditChange objects
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      category TEXT NOT NULL,
      task_title TEXT NOT NULL,
      interval_days INTEGER NOT NULL,
      last_performed_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      instructions TEXT NOT NULL,
      last_technician TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_trail_logs (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      program_or_event TEXT,
      department TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      condition_before TEXT,
      condition_after TEXT,
      details TEXT NOT NULL,
      offline_generated INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS concurrency_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      tx_sequence INTEGER NOT NULL,
      operation TEXT NOT NULL,
      committed_at TEXT NOT NULL
    );
  `);

  // Migrate existing SQLite table if needed
  try {
    db.exec('ALTER TABLE requests ADD COLUMN audit_trail TEXT;');
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE requests ADD COLUMN updated_at TEXT;');
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE equipment ADD COLUMN image_url TEXT;');
  } catch {
    // Column already exists
  }
}

/**
 * Seed initial data if tables are empty
 */
export function seedInitialDataIfEmpty() {
  const now = new Date().toISOString();

  // 1. Default Roles
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (roleCount.count === 0) {
    runInTransaction(() => {
      const roles = [
        {
          id: 'administrator',
          name: 'Administrator',
          description: 'Full system authorization. Manage users, security roles, categories, locations, and departments.',
          is_system: 1,
          color: 'amber',
          permissions: JSON.stringify({
            can_manage_users: true,
            can_manage_roles: true,
            can_manage_master_data: true,
            can_manage_equipment: true,
            can_approve_requests: true,
            can_checkout_checkin: true,
            can_manage_maintenance: true,
            can_perform_audits: true,
            can_view_reports: true,
          }),
        },
        {
          id: 'staff',
          name: 'Staff AV Engineer',
          description: 'Media department technicians. Equipment check-outs, maintenance repairs, routine request approvals, physical audits.',
          is_system: 1,
          color: 'sky',
          permissions: JSON.stringify({
            can_manage_users: false,
            can_manage_roles: false,
            can_manage_master_data: true,
            can_manage_equipment: true,
            can_approve_requests: true,
            can_checkout_checkin: true,
            can_manage_maintenance: true,
            can_perform_audits: true,
            can_view_reports: true,
          }),
        },
        {
          id: 'volunteer',
          name: 'Volunteer Tech',
          description: 'Sunday and midweek AV team. Scan QR barcodes to check out gear for assigned services and perform room audits.',
          is_system: 1,
          color: 'emerald',
          permissions: JSON.stringify({
            can_manage_users: false,
            can_manage_roles: false,
            can_manage_master_data: false,
            can_manage_equipment: false,
            can_approve_requests: false,
            can_checkout_checkin: true,
            can_manage_maintenance: false,
            can_perform_audits: true,
            can_view_reports: false,
          }),
        },
        {
          id: 'requester',
          name: 'Ministry Requester',
          description: 'Youth, Worship, Outreach & Children leaders. Submit program equipment requests with status tracking.',
          is_system: 1,
          color: 'purple',
          permissions: JSON.stringify({
            can_manage_users: false,
            can_manage_roles: false,
            can_manage_master_data: false,
            can_manage_equipment: false,
            can_approve_requests: false,
            can_checkout_checkin: false,
            can_manage_maintenance: false,
            can_perform_audits: false,
            can_view_reports: false,
          }),
        },
      ];

      const insertRole = db.prepare(`
        INSERT INTO roles (id, name, description, is_system, color, permissions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of roles) {
        insertRole.run(r.id, r.name, r.description, r.is_system, r.color, r.permissions, now, now);
      }
    });
  }

  // 2. Default Departments
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (deptCount.count === 0) {
    runInTransaction(() => {
      const departments = [
        { id: 'dept-media-lead', name: 'Communications & Media Leadership', code: 'CML', head: 'Pastor David Vance', email: 'media.lead@gracecommunitychurch.org', desc: 'Executive oversight, broad media distribution, streaming & production strategy' },
        { id: 'dept-av-tech', name: 'Media & Technical Arts', code: 'MTA', head: 'Sarah Jenkins', email: 'tech@gracecommunitychurch.org', desc: 'Audio, visual, broadcast cameras, stage lighting and interconnects' },
        { id: 'dept-youth', name: 'Youth Ministry', code: 'YTH', head: 'Grace Lin', email: 'youth@gracecommunitychurch.org', desc: 'High school and middle school chapel services, rallies and camps' },
        { id: 'dept-worship', name: 'Worship Team', code: 'WOR', head: 'David Kim', email: 'worship@gracecommunitychurch.org', desc: 'Vocalists, band instruments, in-ear monitor packs and stage mixes' },
        { id: 'dept-children', name: "Children's Church", code: 'KID', head: 'Rachel Edwards', email: 'kids@gracecommunitychurch.org', desc: 'Sunday school media presentations, wireless mics and activity AV' },
        { id: 'dept-outreach', name: 'Outreach & Missions', code: 'OUT', head: 'Pastor Samuel Thorne', email: 'outreach@gracecommunitychurch.org', desc: 'Community events, outdoor evangelism, mobile sound rigs' },
        { id: 'dept-pastoral', name: 'Pastoral & Executive', code: 'PAS', head: 'Senior Pastor', email: 'pastoral@gracecommunitychurch.org', desc: 'Sanctuary services, conferences, weddings and special memorial services' },
      ];

      const insertDept = db.prepare(`
        INSERT INTO departments (id, name, code, head_person, contact_email, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const d of departments) {
        insertDept.run(d.id, d.name, d.code, d.head, d.email, d.desc, now, now);
      }
    });
  }

  // 3. Default Locations
  const locCount = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number };
  if (locCount.count === 0) {
    runInTransaction(() => {
      const locations = [
        { id: 'loc-sanct-booth', name: 'Main Sanctuary Sound Booth', building: 'Main Worship Center', room: 'FOH Booth', desc: 'Primary front-of-house audio console, wireless mic racks and Dante interface' },
        { id: 'loc-vid-control', name: 'Video Broadcast Control Room', building: 'Production Wing', room: 'Suite 204', desc: 'Live video switcher, camera CCUs, streaming encoder workstations and monitors' },
        { id: 'loc-youth-rack', name: 'Youth Chapel Stage Rack', building: 'Youth Complex', room: 'Chapel Stage Left', desc: 'Dedicated youth PA, wireless handhelds and mobile stage boxes' },
        { id: 'loc-light-perch', name: 'Lighting Control Perch', building: 'Main Worship Center', room: 'Balcony North', desc: 'GrandMA / Chamsys lighting consoles, DMX gateways and hazers' },
        { id: 'loc-fellowship', name: 'Fellowship Hall Storage Lockers', building: 'East Annex', room: 'Locker Bay 4', desc: 'Mobile powered speakers, presentation wireless mics and projector carts' },
        { id: 'loc-outdoor', name: 'Outdoor Pavilion AV Vault', building: 'East Grounds', room: 'Vault A', desc: 'Weather-rated speaker enclosures and portable battery PA rigs' },
        { id: 'loc-stage-right', name: 'Sanctuary Stage Right Storage', building: 'Main Worship Center', room: 'Backstage SR', desc: 'Microphone stands, cable trunks, DI boxes, and spare guitar cables' },
      ];

      const insertLoc = db.prepare(`
        INSERT INTO locations (id, name, building, room, description, is_storage, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const l of locations) {
        insertLoc.run(l.id, l.name, l.building, l.room, l.desc, 1, now, now);
      }
    });
  }

  // 4. Default Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    runInTransaction(() => {
      const categories = [
        {
          id: 'cat-audio',
          name: 'Audio',
          description: 'Microphones, mixing consoles, digital stage boxes, in-ear monitors and speakers',
          icon: 'Mic',
          color: 'sky',
          sub_categories: JSON.stringify(['Wireless Microphones', 'In-Ear Monitors', 'Digital Consoles', 'Stage Boxes & Snakes', 'Loudspeakers & Subs', 'Microphone Stands']),
        },
        {
          id: 'cat-video',
          name: 'Video & Cameras',
          description: 'Broadcast PTZ cameras, cinema cameras, video switchers, wireless video transmitters and monitors',
          icon: 'Video',
          color: 'indigo',
          sub_categories: JSON.stringify(['Broadcast Cameras', 'PTZ Cameras', 'Video Switchers', 'Wireless Video TX/RX', 'Confidence Monitors', 'Projectors']),
        },
        {
          id: 'cat-lighting',
          name: 'Lighting',
          description: 'Moving head spots, LED stage pars, DMX consoles, atmospheric water-based hazers',
          icon: 'Sun',
          color: 'amber',
          sub_categories: JSON.stringify(['Moving Head Spot/Wash', 'LED Stage Pars', 'DMX Controllers & Nodes', 'Atmospheric Hazers', 'Follow Spots']),
        },
        {
          id: 'cat-computing',
          name: 'Computing & Media',
          description: 'ProPresenter presentation Mac rigs, livestream streaming encoders, Dante network switches',
          icon: 'Laptop',
          color: 'emerald',
          sub_categories: JSON.stringify(['ProPresenter Workstations', 'Livestream Encoders', 'Managed AV Switches', 'Audio Interface Racks']),
        },
        {
          id: 'cat-cables',
          name: 'Cables & Interconnects',
          description: 'Durable multi-core audio snakes, 12G-SDI coaxial reels, Tour-grade XLRs and optical fiber',
          icon: 'Cable',
          color: 'rose',
          sub_categories: JSON.stringify(['XLR Audio Cables', '12G SDI Video Drums', 'Cat6 Shielded EtherCON', 'Speakon Speaker Runs']),
        },
        {
          id: 'cat-staging',
          name: 'Staging & Rigging',
          description: 'Heavy duty crank truss stands, rated safety cables, stage decking risers and acoustic shields',
          icon: 'Boxes',
          color: 'teal',
          sub_categories: JSON.stringify(['Crank Stands & Truss', 'Safety Cables & Clamps', 'Drum Shields & Baffles', 'Riser Decks']),
        },
      ];

      const insertCat = db.prepare(`
        INSERT INTO categories (id, name, description, icon, color, sub_categories, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of categories) {
        insertCat.run(c.id, c.name, c.description, c.icon, c.color, c.sub_categories, now, now);
      }
    });
  }

  // 5. Default Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    runInTransaction(() => {
      const users = [
        {
          id: 'usr-admin-1',
          name: 'Pastor David Vance',
          email: 'david.vance@gracecommunitychurch.org',
          role_id: 'administrator',
          department: 'Communications & Media Leadership',
          title: 'Director of Media & Production',
          phone: '+44 1737 882001',
        },
        {
          id: 'usr-staff-1',
          name: 'Sarah Jenkins',
          email: 'sarah.j@gracecommunitychurch.org',
          role_id: 'staff',
          department: 'Media & Technical Arts',
          title: 'Lead Audio/Visual Engineer',
          phone: '+44 1737 882002',
        },
        {
          id: 'usr-vol-1',
          name: 'Marcus Cole',
          email: 'marcus.cole@volunteer.gracecommunitychurch.org',
          role_id: 'volunteer',
          department: 'Weekend Media Ministry',
          title: 'Camera & Broadcast Volunteer Tech',
          phone: '+44 1737 882003',
        },
        {
          id: 'usr-req-1',
          name: 'Grace Lin',
          email: 'grace.lin@gracecommunitychurch.org',
          role_id: 'requester',
          department: 'Youth Ministry',
          title: 'Youth Ministry Coordinator',
          phone: '+44 1737 882004',
        },
      ];

      const insertUser = db.prepare(`
        INSERT INTO users (id, name, email, role_id, department, title, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of users) {
        insertUser.run(u.id, u.name, u.email, u.role_id, u.department, u.title, u.phone, now, now);
      }
    });
  }

  // 6. Default Equipment
  const eqCount = db.prepare('SELECT COUNT(*) as count FROM equipment').get() as { count: number };
  if (eqCount.count === 0) {
    runInTransaction(() => {
      const insertEquipment = db.prepare(`
        INSERT INTO equipment (
          id, name, category, sub_category, brand, model, serial_number, barcode,
          location, status, condition, purchase_date, replacement_cost, assigned_to,
          assigned_role, borrower_department, checked_out_at, due_at, checkout_event,
          notes, maintenance_interval_days, last_maintenance_date, next_maintenance_date,
          maintenance_notes, last_audited_date, last_audited_by, total_checkouts_count,
          image_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const eq of INITIAL_EQUIPMENT) {
        insertEquipment.run(
          eq.id,
          eq.name,
          eq.category,
          eq.subCategory || '',
          eq.brand || '',
          eq.model || '',
          eq.serialNumber || '',
          eq.barcode || eq.id,
          eq.location,
          eq.status,
          eq.condition,
          eq.purchaseDate || now,
          eq.replacementCost || 0,
          eq.assignedTo || null,
          eq.assignedRole || null,
          eq.borrowerDepartment || null,
          eq.checkedOutAt || null,
          eq.dueAt || null,
          eq.checkoutEvent || null,
          eq.notes || '',
          eq.maintenanceIntervalDays || 30,
          eq.lastMaintenanceDate || '',
          eq.nextMaintenanceDate || '',
          eq.maintenanceNotes || '',
          eq.lastAuditedDate || '',
          eq.lastAuditedBy || '',
          eq.totalCheckoutsCount || 0,
          eq.imageUrl || null,
          now,
          now
        );
      }
    });
  } else {
    // Backfill images for any initial equipment items that lack one
    try {
      const updateImg = db.prepare("UPDATE equipment SET image_url = ? WHERE id = ? AND (image_url IS NULL OR image_url = '')");
      for (const eq of INITIAL_EQUIPMENT) {
        if (eq.imageUrl) {
          updateImg.run(eq.imageUrl, eq.id);
        }
      }
    } catch (e) {
      console.warn('Could not backfill equipment images:', e);
    }
  }

  // 7. Default Requests
  const reqCount = db.prepare('SELECT COUNT(*) as count FROM requests').get() as { count: number };
  if (reqCount.count === 0) {
    runInTransaction(() => {
      const insertRequest = db.prepare(`
        INSERT INTO requests (
          id, requester_name, requester_email, requester_dept, program_name, location,
          start_date, end_date, requested_asset_ids, purpose, status, urgent,
          created_at, updated_at, reviewed_by, reviewed_at, manager_notes, audit_trail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const req of INITIAL_REQUESTS) {
        insertRequest.run(
          req.id,
          req.requesterName,
          req.requesterEmail,
          req.requesterDept,
          req.programName,
          req.location,
          req.startDate,
          req.endDate,
          JSON.stringify(req.requestedAssetIds || []),
          req.purpose,
          req.status,
          req.urgent ? 1 : 0,
          req.createdAt,
          req.updatedAt || req.createdAt,
          req.reviewedBy || null,
          req.reviewedAt || null,
          req.managerNotes || null,
          JSON.stringify(req.auditTrail || [])
        );
      }
    });
  }

  // 8. Default Maintenance Tasks
  const maintCount = db.prepare('SELECT COUNT(*) as count FROM maintenance_tasks').get() as { count: number };
  if (maintCount.count === 0) {
    runInTransaction(() => {
      const insertMaint = db.prepare(`
        INSERT INTO maintenance_tasks (
          id, asset_id, asset_name, category, task_title, interval_days,
          last_performed_date, due_date, status, priority, instructions,
          last_technician, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const m of INITIAL_MAINTENANCE_TASKS) {
        insertMaint.run(
          m.id,
          m.assetId,
          m.assetName,
          m.category,
          m.taskTitle,
          m.intervalDays,
          m.lastPerformedDate,
          m.dueDate,
          m.status,
          m.priority,
          m.instructions,
          m.lastTechnician || null,
          now,
          now
        );
      }
    });
  }

  // 9. Default Audit Logs
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_trail_logs').get() as { count: number };
  if (auditCount.count === 0) {
    runInTransaction(() => {
      const insertAudit = db.prepare(`
        INSERT INTO audit_trail_logs (
          id, asset_id, asset_name, action, user_id, user_name, user_role,
          program_or_event, department, timestamp, condition_before, condition_after,
          details, offline_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of INITIAL_AUDIT_LOGS) {
        insertAudit.run(
          a.id,
          a.assetId,
          a.assetName,
          a.action,
          a.userId,
          a.userName,
          a.userRole,
          a.programOrEvent || '',
          a.department,
          a.timestamp,
          a.conditionBefore || null,
          a.conditionAfter || null,
          a.details,
          a.offlineGenerated ? 1 : 0
        );
      }
    });
  }
}

/**
 * Reset all SQLite tables and reseed with default data
 */
export function resetDatabase() {
  runInTransaction(() => {
    db.exec(`
      DELETE FROM audit_trail_logs;
      DELETE FROM maintenance_tasks;
      DELETE FROM requests;
      DELETE FROM equipment;
      DELETE FROM users;
      DELETE FROM categories;
      DELETE FROM locations;
      DELETE FROM departments;
      DELETE FROM roles;
      DELETE FROM concurrency_audit;
    `);
  });
  seedInitialDataIfEmpty();
}
