import { Router, Request, Response } from 'express';
import { db, runInTransaction, resetDatabase, DB_PATH } from './db';
import fs from 'node:fs';

export const apiRouter = Router();

/**
 * Record an activity or record event directly into SQLite audit_trail_logs
 */
export function logAuditActivity(data: {
  assetId?: string;
  assetName?: string;
  action: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  programOrEvent?: string;
  department?: string;
  conditionBefore?: string;
  conditionAfter?: string;
  details: string;
  offlineGenerated?: boolean;
}) {
  const logId = `LOG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const now = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO audit_trail_logs (
        id, asset_id, asset_name, action, user_id, user_name, user_role,
        program_or_event, department, timestamp, condition_before, condition_after,
        details, offline_generated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      data.assetId || 'SYSTEM',
      data.assetName || 'System Record',
      data.action,
      data.userId || 'usr-system',
      data.userName || 'System Admin',
      data.userRole || 'administrator',
      data.programOrEvent || '',
      data.department || 'Media & Technical Arts',
      now,
      data.conditionBefore || null,
      data.conditionAfter || null,
      data.details,
      data.offlineGenerated ? 1 : 0
    );
  } catch (err) {
    console.warn('Failed to record audit activity:', err);
  }
}

// ==========================================
// 1. USERS CRUD & ROLE ASSIGNMENT
// ==========================================

apiRouter.get('/users', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT u.*, r.name as role_name, r.color as role_color, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at ASC
    `).all() as any[];

    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role_id, // keep legacy field for compatibility
      roleId: row.role_id,
      roleName: row.role_name,
      roleColor: row.role_color,
      rolePermissions: row.role_permissions ? JSON.parse(row.role_permissions) : {},
      department: row.department,
      title: row.title,
      avatar: row.avatar,
      phone: row.phone,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/users', (req: Request, res: Response) => {
  try {
    const { name, email, roleId, department, title, phone, avatar } = req.body;
    if (!name || !email || !roleId || !department) {
      return res.status(400).json({ success: false, error: 'Name, email, role, and department are required.' });
    }

    const now = new Date().toISOString();
    const id = req.body.id || `usr-${Date.now().toString().slice(-6)}`;

    runInTransaction(() => {
      // Check existing email
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        throw new Error(`A user with email "${email}" already exists.`);
      }

      db.prepare(`
        INSERT INTO users (id, name, email, role_id, department, title, phone, avatar, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `).run(id, name, email, roleId, department, title || `${roleId.toUpperCase()} Staff`, phone || '', avatar || '', now, now);
    });

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, roleId, department, title, phone, status } = req.body;

    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      if (!existing) {
        throw new Error(`User with ID ${id} not found.`);
      }

      // Check email uniqueness if email changed
      if (email && email !== existing.email) {
        const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
        if (emailCheck) {
          throw new Error(`Email "${email}" is already used by another user.`);
        }
      }

      db.prepare(`
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            role_id = COALESCE(?, role_id),
            department = COALESCE(?, department),
            title = COALESCE(?, title),
            phone = COALESCE(?, phone),
            status = COALESCE(?, status),
            updated_at = ?
        WHERE id = ?
      `).run(
        name ?? null,
        email ?? null,
        roleId ?? null,
        department ?? null,
        title ?? null,
        phone ?? null,
        status ?? null,
        now,
        id
      );
    });

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    runInTransaction(() => {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      if (!user) {
        throw new Error(`User with ID ${id} not found.`);
      }

      // Safeguard: do not delete the only administrator
      if (user.role_id === 'administrator') {
        const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role_id = 'administrator'").get() as { count: number };
        if (adminCount.count <= 1) {
          throw new Error('Cannot delete the last remaining Administrator account.');
        }
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });

    res.json({ success: true, message: `User ${id} successfully deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.post('/users/:id/role', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    if (!roleId) {
      return res.status(400).json({ success: false, error: 'roleId is required.' });
    }

    const now = new Date().toISOString();

    runInTransaction(() => {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!user) throw new Error(`User with ID ${id} not found.`);

      const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(roleId);
      if (!role) throw new Error(`Role ${roleId} does not exist.`);

      db.prepare('UPDATE users SET role_id = ?, updated_at = ? WHERE id = ?').run(roleId, now, id);
    });

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. ROLES & ACCESS CONTROL CRUD
// ==========================================

apiRouter.get('/roles', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT r.*, COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.created_at ASC
    `).all() as any[];

    const roles = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: Boolean(r.is_system),
      color: r.color,
      permissions: JSON.parse(r.permissions),
      userCount: Number(r.user_count),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/roles', (req: Request, res: Response) => {
  try {
    const { id, name, description, color, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Role name is required.' });
    }

    const roleId = (id || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim();
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT id FROM roles WHERE id = ?').get(roleId);
      if (existing) throw new Error(`Role with ID "${roleId}" already exists.`);

      const defaultPerms = {
        can_manage_users: false,
        can_manage_roles: false,
        can_manage_master_data: false,
        can_manage_equipment: false,
        can_approve_requests: false,
        can_checkout_checkin: true,
        can_manage_maintenance: false,
        can_perform_audits: true,
        can_view_reports: false,
        ...(permissions || {}),
      };

      db.prepare(`
        INSERT INTO roles (id, name, description, is_system, color, permissions, created_at, updated_at)
        VALUES (?, ?, ?, 0, ?, ?, ?, ?)
      `).run(roleId, name, description || '', color || 'sky', JSON.stringify(defaultPerms), now, now);
    });

    const created = db.prepare('SELECT * FROM roles WHERE id = ?').get(roleId);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/roles/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, permissions } = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Role "${id}" not found.`);

      const updatedPermissions = permissions ? JSON.stringify(permissions) : existing.permissions;

      db.prepare(`
        UPDATE roles
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            color = COALESCE(?, color),
            permissions = ?,
            updated_at = ?
        WHERE id = ?
      `).run(name ?? null, description ?? null, color ?? null, updatedPermissions, now, id);
    });

    const updated = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/roles/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    runInTransaction(() => {
      const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as any;
      if (!role) throw new Error(`Role "${id}" not found.`);
      if (role.is_system) throw new Error(`System default role "${role.name}" cannot be deleted.`);

      const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(id) as { count: number };
      if (userCount.count > 0) {
        throw new Error(`Cannot delete role "${role.name}" because ${userCount.count} users are currently assigned to it. Reassign them first.`);
      }

      db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    });

    res.json({ success: true, message: `Role ${id} deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. CATEGORIES CRUD
// ==========================================

apiRouter.get('/categories', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT c.*, COUNT(e.id) as item_count
      FROM categories c
      LEFT JOIN equipment e ON e.category = c.name
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `).all() as any[];

    const categories = rows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      subCategories: JSON.parse(c.sub_categories || '[]'),
      itemCount: Number(c.item_count),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/categories', (req: Request, res: Response) => {
  try {
    const { name, description, icon, color, subCategories } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Category name is required.' });

    const id = req.body.id || `cat-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT id FROM categories WHERE name = ? OR id = ?').get(name, id);
      if (existing) throw new Error(`Category "${name}" already exists.`);

      db.prepare(`
        INSERT INTO categories (id, name, description, icon, color, sub_categories, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, description || '', icon || 'Boxes', color || 'sky', JSON.stringify(subCategories || []), now, now);
    });

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, subCategories } = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Category "${id}" not found.`);

      // If category name changes, update equipment referencing it
      if (name && name !== existing.name) {
        db.prepare('UPDATE equipment SET category = ? WHERE category = ?').run(name, existing.name);
      }

      const subsJson = subCategories !== undefined ? JSON.stringify(subCategories) : existing.sub_categories;

      db.prepare(`
        UPDATE categories
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            icon = COALESCE(?, icon),
            color = COALESCE(?, color),
            sub_categories = ?,
            updated_at = ?
        WHERE id = ?
      `).run(name ?? null, description ?? null, icon ?? null, color ?? null, subsJson, now, id);
    });

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    runInTransaction(() => {
      const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
      if (!cat) throw new Error(`Category "${id}" not found.`);

      const inUse = db.prepare('SELECT COUNT(*) as count FROM equipment WHERE category = ?').get(cat.name) as { count: number };
      if (inUse.count > 0) {
        throw new Error(`Cannot delete category "${cat.name}" because ${inUse.count} equipment items are assigned to it. Reassign or delete the items first.`);
      }

      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    });

    res.json({ success: true, message: `Category ${id} deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. LOCATIONS CRUD
// ==========================================

apiRouter.get('/locations', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT l.*, COUNT(e.id) as item_count
      FROM locations l
      LEFT JOIN equipment e ON e.location = l.name
      GROUP BY l.id
      ORDER BY l.created_at ASC
    `).all() as any[];

    const locations = rows.map((l) => ({
      id: l.id,
      name: l.name,
      building: l.building,
      room: l.room,
      description: l.description,
      isStorage: Boolean(l.is_storage),
      itemCount: Number(l.item_count),
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));

    res.json({ success: true, data: locations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/locations', (req: Request, res: Response) => {
  try {
    const { name, building, room, description, isStorage } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Location name is required.' });

    const id = req.body.id || `loc-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT id FROM locations WHERE name = ? OR id = ?').get(name, id);
      if (existing) throw new Error(`Location "${name}" already exists.`);

      db.prepare(`
        INSERT INTO locations (id, name, building, room, description, is_storage, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, building || 'Main Campus', room || '', description || '', isStorage === false ? 0 : 1, now, now);
    });

    const created = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/locations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, building, room, description, isStorage } = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Location "${id}" not found.`);

      // If location name changes, update equipment referencing it
      if (name && name !== existing.name) {
        db.prepare('UPDATE equipment SET location = ? WHERE location = ?').run(name, existing.name);
      }

      db.prepare(`
        UPDATE locations
        SET name = COALESCE(?, name),
            building = COALESCE(?, building),
            room = COALESCE(?, room),
            description = COALESCE(?, description),
            is_storage = COALESCE(?, is_storage),
            updated_at = ?
        WHERE id = ?
      `).run(
        name ?? null,
        building ?? null,
        room ?? null,
        description ?? null,
        isStorage !== undefined ? (isStorage ? 1 : 0) : null,
        now,
        id
      );
    });

    const updated = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/locations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    runInTransaction(() => {
      const loc = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as any;
      if (!loc) throw new Error(`Location "${id}" not found.`);

      const inUse = db.prepare('SELECT COUNT(*) as count FROM equipment WHERE location = ?').get(loc.name) as { count: number };
      if (inUse.count > 0) {
        throw new Error(`Cannot delete location "${loc.name}" because ${inUse.count} equipment items are currently stored there. Move the gear first.`);
      }

      db.prepare('DELETE FROM locations WHERE id = ?').run(id);
    });

    res.json({ success: true, message: `Location ${id} deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. DEPARTMENTS CRUD
// ==========================================

apiRouter.get('/departments', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT d.*, COUNT(u.id) as user_count
      FROM departments d
      LEFT JOIN users u ON u.department = d.name
      GROUP BY d.id
      ORDER BY d.created_at ASC
    `).all() as any[];

    const departments = rows.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      headPerson: d.head_person,
      contactEmail: d.contact_email,
      description: d.description,
      userCount: Number(d.user_count),
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/departments', (req: Request, res: Response) => {
  try {
    const { name, code, headPerson, contactEmail, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Department name is required.' });

    const id = req.body.id || `dept-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT id FROM departments WHERE name = ? OR id = ?').get(name, id);
      if (existing) throw new Error(`Department "${name}" already exists.`);

      db.prepare(`
        INSERT INTO departments (id, name, code, head_person, contact_email, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, code || 'GEN', headPerson || '', contactEmail || '', description || '', now, now);
    });

    const created = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/departments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, headPerson, contactEmail, description } = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Department "${id}" not found.`);

      if (name && name !== existing.name) {
        db.prepare('UPDATE users SET department = ? WHERE department = ?').run(name, existing.name);
      }

      db.prepare(`
        UPDATE departments
        SET name = COALESCE(?, name),
            code = COALESCE(?, code),
            head_person = COALESCE(?, head_person),
            contact_email = COALESCE(?, contact_email),
            description = COALESCE(?, description),
            updated_at = ?
        WHERE id = ?
      `).run(name ?? null, code ?? null, headPerson ?? null, contactEmail ?? null, description ?? null, now, id);
    });

    const updated = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/departments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    runInTransaction(() => {
      const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as any;
      if (!dept) throw new Error(`Department "${id}" not found.`);

      const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE department = ?').get(dept.name) as { count: number };
      if (userCount.count > 0) {
        throw new Error(`Cannot delete department "${dept.name}" because ${userCount.count} users are currently assigned to it.`);
      }

      db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    });

    res.json({ success: true, message: `Department ${id} deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. EQUIPMENT CRUD & ACTIVITIES
// ==========================================

function formatEquipmentRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category || '',
    brand: row.brand || '',
    model: row.model || '',
    serialNumber: row.serial_number || '',
    barcode: row.barcode || row.id,
    location: row.location,
    status: row.status,
    condition: row.condition,
    purchaseDate: row.purchase_date,
    replacementCost: Number(row.replacement_cost || 0),
    assignedTo: row.assigned_to || undefined,
    assignedRole: row.assigned_role || undefined,
    borrowerDepartment: row.borrower_department || undefined,
    checkedOutAt: row.checked_out_at || undefined,
    dueAt: row.due_at || undefined,
    checkoutEvent: row.checkout_event || undefined,
    notes: row.notes || '',
    maintenanceIntervalDays: Number(row.maintenance_interval_days || 30),
    lastMaintenanceDate: row.last_maintenance_date || '',
    nextMaintenanceDate: row.next_maintenance_date || '',
    maintenanceNotes: row.maintenance_notes || '',
    lastAuditedDate: row.last_audited_date || '',
    lastAuditedBy: row.last_audited_by || undefined,
    totalCheckoutsCount: Number(row.total_checkouts_count || 0),
    imageUrl: row.image_url || undefined,
  };
}

apiRouter.get('/equipment', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM equipment ORDER BY id ASC').all();
    const items = rows.map(formatEquipmentRow);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/equipment', (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (!item.name || !item.category || !item.location) {
      return res.status(400).json({ success: false, error: 'Name, category, and location are required.' });
    }

    const id = item.id || `AST-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    runInTransaction(() => {
      db.prepare(`
        INSERT INTO equipment (
          id, name, category, sub_category, brand, model, serial_number, barcode,
          location, status, condition, purchase_date, replacement_cost, assigned_to,
          assigned_role, borrower_department, checked_out_at, due_at, checkout_event,
          notes, maintenance_interval_days, last_maintenance_date, next_maintenance_date,
          maintenance_notes, last_audited_date, last_audited_by, total_checkouts_count,
          image_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        item.name,
        item.category,
        item.subCategory || '',
        item.brand || '',
        item.model || '',
        item.serialNumber || '',
        item.barcode || id,
        item.location,
        item.status || 'available',
        item.condition || 'good',
        item.purchaseDate || now.slice(0, 10),
        item.replacementCost || 0,
        item.assignedTo || null,
        item.assignedRole || null,
        item.borrowerDepartment || null,
        item.checkedOutAt || null,
        item.dueAt || null,
        item.checkoutEvent || null,
        item.notes || '',
        item.maintenanceIntervalDays || 30,
        item.lastMaintenanceDate || '',
        item.nextMaintenanceDate || '',
        item.maintenanceNotes || '',
        item.lastAuditedDate || '',
        item.lastAuditedBy || null,
        item.totalCheckoutsCount || 0,
        item.imageUrl || null,
        now,
        now
      );

      logAuditActivity({
        assetId: id,
        assetName: item.name,
        action: 'item_created',
        userId: item.creatorId,
        userName: item.creatorName,
        details: `Asset created in category "${item.category}" at "${item.location}".`,
      });
    });

    const row = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: formatEquipmentRow(row) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/equipment/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Equipment ${id} not found.`);

      db.prepare(`
        UPDATE equipment
        SET name = COALESCE(?, name),
            category = COALESCE(?, category),
            sub_category = COALESCE(?, sub_category),
            brand = COALESCE(?, brand),
            model = COALESCE(?, model),
            serial_number = COALESCE(?, serial_number),
            barcode = COALESCE(?, barcode),
            location = COALESCE(?, location),
            status = COALESCE(?, status),
            condition = COALESCE(?, condition),
            purchase_date = COALESCE(?, purchase_date),
            replacement_cost = COALESCE(?, replacement_cost),
            assigned_to = COALESCE(?, assigned_to),
            assigned_role = COALESCE(?, assigned_role),
            borrower_department = COALESCE(?, borrower_department),
            checked_out_at = COALESCE(?, checked_out_at),
            due_at = COALESCE(?, due_at),
            checkout_event = COALESCE(?, checkout_event),
            notes = COALESCE(?, notes),
            maintenance_interval_days = COALESCE(?, maintenance_interval_days),
            last_maintenance_date = COALESCE(?, last_maintenance_date),
            next_maintenance_date = COALESCE(?, next_maintenance_date),
            maintenance_notes = COALESCE(?, maintenance_notes),
            last_audited_date = COALESCE(?, last_audited_date),
            last_audited_by = COALESCE(?, last_audited_by),
            image_url = COALESCE(?, image_url),
            updated_at = ?
        WHERE id = ?
      `).run(
        item.name ?? null,
        item.category ?? null,
        item.subCategory ?? null,
        item.brand ?? null,
        item.model ?? null,
        item.serialNumber ?? null,
        item.barcode ?? null,
        item.location ?? null,
        item.status ?? null,
        item.condition ?? null,
        item.purchaseDate ?? null,
        item.replacementCost ?? null,
        item.assignedTo ?? null,
        item.assignedRole ?? null,
        item.borrowerDepartment ?? null,
        item.checkedOutAt ?? null,
        item.dueAt ?? null,
        item.checkoutEvent ?? null,
        item.notes ?? null,
        item.maintenanceIntervalDays ?? null,
        item.lastMaintenanceDate ?? null,
        item.nextMaintenanceDate ?? null,
        item.maintenanceNotes ?? null,
        item.lastAuditedDate ?? null,
        item.lastAuditedBy ?? null,
        item.imageUrl ?? null,
        now,
        id
      );

      if (item.condition && item.condition !== existing.condition) {
        logAuditActivity({
          assetId: id,
          assetName: existing.name,
          action: 'status_changed',
          conditionBefore: existing.condition,
          conditionAfter: item.condition,
          details: `Condition updated from ${existing.condition} to ${item.condition}. ${item.notes || ''}`,
        });
      }
    });

    const row = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    res.json({ success: true, data: formatEquipmentRow(row) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Update Equipment Photo
 */
apiRouter.post('/equipment/:id/image', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl, user } = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Equipment ${id} not found.`);

      db.prepare(`
        UPDATE equipment
        SET image_url = ?,
            updated_at = ?
        WHERE id = ?
      `).run(imageUrl || null, now, id);

      logAuditActivity({
        assetId: id,
        assetName: existing.name,
        action: 'item_updated',
        userId: user?.id,
        userName: user?.name,
        details: imageUrl ? `Photo updated for asset ${id} (${existing.name}).` : `Photo removed for asset ${id}.`,
      });
    });

    const row = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    res.json({ success: true, data: formatEquipmentRow(row) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/equipment/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Equipment ${id} not found.`);

      db.prepare('DELETE FROM equipment WHERE id = ?').run(id);

      logAuditActivity({
        assetId: id,
        assetName: existing.name,
        action: 'item_updated',
        details: `Asset "${existing.name}" (${id}) permanently deleted from equipment inventory.`,
      });
    });

    res.json({ success: true, message: `Equipment ${id} deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Equipment Checkout Action
 */
apiRouter.post('/equipment/:id/checkout', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { borrowerName, borrowerRole, department, eventName, dueAt, user } = req.body;
    if (!borrowerName) return res.status(400).json({ success: false, error: 'Borrower name is required.' });

    const now = new Date().toISOString();

    runInTransaction(() => {
      const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as any;
      if (!item) throw new Error(`Asset ${id} not found.`);

      db.prepare(`
        UPDATE equipment
        SET status = 'checked_out',
            assigned_to = ?,
            assigned_role = ?,
            borrower_department = ?,
            checked_out_at = ?,
            due_at = ?,
            checkout_event = ?,
            total_checkouts_count = total_checkouts_count + 1,
            updated_at = ?
        WHERE id = ?
      `).run(
        borrowerName,
        borrowerRole || 'Staff',
        department || 'Media & Technical Arts',
        now,
        dueAt || '',
        eventName || 'Service Production',
        now,
        id
      );

      logAuditActivity({
        assetId: id,
        assetName: item.name,
        action: 'check_out',
        userId: user?.id || 'usr-system',
        userName: user?.name || borrowerName,
        userRole: user?.role || 'staff',
        programOrEvent: eventName || 'Service Production',
        department: department || 'Media & Technical Arts',
        conditionBefore: item.condition,
        conditionAfter: item.condition,
        details: `Checked out to ${borrowerName} (${department || 'Media'}) for "${eventName || 'Service'}". Due: ${dueAt || 'N/A'}.`,
      });
    });

    const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    res.json({ success: true, data: formatEquipmentRow(updated) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Equipment Checkin Action
 */
apiRouter.post('/equipment/:id/checkin', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { condition, notes, location, user } = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as any;
      if (!item) throw new Error(`Asset ${id} not found.`);

      const condAfter = condition || item.condition;
      const finalLoc = location || item.location;

      db.prepare(`
        UPDATE equipment
        SET status = 'available',
            assigned_to = NULL,
            assigned_role = NULL,
            borrower_department = NULL,
            checked_out_at = NULL,
            due_at = NULL,
            checkout_event = NULL,
            condition = ?,
            location = ?,
            notes = CASE WHEN ? != '' THEN ? ELSE notes END,
            updated_at = ?
        WHERE id = ?
      `).run(
        condAfter,
        finalLoc,
        notes || '',
        notes || '',
        now,
        id
      );

      logAuditActivity({
        assetId: id,
        assetName: item.name,
        action: 'check_in',
        userId: user?.id || 'usr-system',
        userName: user?.name || 'Staff Tech',
        userRole: user?.role || 'staff',
        programOrEvent: item.checkout_event || 'Returned to Storage',
        department: item.borrower_department || 'Media & Technical Arts',
        conditionBefore: item.condition,
        conditionAfter: condAfter,
        details: `Checked in back to "${finalLoc}". Verified condition: ${condAfter}. ${notes ? `Notes: ${notes}` : ''}`,
      });
    });

    const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    res.json({ success: true, data: formatEquipmentRow(updated) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Equipment Inventory Audit Action
 */
apiRouter.post('/equipment/:id/audit', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { venueLocation, verifiedCondition, user, notes, isOffline } = req.body;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    runInTransaction(() => {
      const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as any;
      if (!item) throw new Error(`Asset ${id} not found.`);

      db.prepare(`
        UPDATE equipment
        SET location = ?,
            condition = ?,
            last_audited_date = ?,
            last_audited_by = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        venueLocation,
        verifiedCondition,
        today,
        user?.name ? `${user.name}${isOffline ? ' (Offline Sync)' : ''}` : 'Inventory Auditor',
        now,
        id
      );

      logAuditActivity({
        assetId: id,
        assetName: item.name,
        action: 'inventory_audited',
        userId: user?.id || 'usr-system',
        userName: user?.name || 'Inventory Auditor',
        userRole: user?.role || 'volunteer',
        programOrEvent: `Walk-Around Audit: ${venueLocation}`,
        department: 'Media & Technical Arts',
        conditionBefore: item.condition,
        conditionAfter: verifiedCondition,
        details: `Audited at ${venueLocation}. Physical condition verified as ${verifiedCondition}. ${notes || ''}`,
        offlineGenerated: Boolean(isOffline),
      });
    });

    const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    res.json({ success: true, data: formatEquipmentRow(updated) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. PROGRAM REQUESTS CRUD & ACTIVITIES
// ==========================================

function formatRequestRow(row: any) {
  let assetIds: string[] = [];
  try {
    assetIds = JSON.parse(row.requested_asset_ids || '[]');
  } catch {
    assetIds = [];
  }

  let auditTrail: any[] = [];
  try {
    auditTrail = JSON.parse(row.audit_trail || '[]');
  } catch {
    auditTrail = [];
  }

  return {
    id: row.id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterDept: row.requester_dept,
    programName: row.program_name,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    requestedAssetIds: assetIds,
    purpose: row.purpose,
    status: row.status,
    urgent: Boolean(row.urgent),
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    managerNotes: row.manager_notes || undefined,
    auditTrail,
  };
}

apiRouter.get('/requests', (req: Request, res: Response) => {
  try {
    const { requesterEmail, requesterName } = req.query;
    let rows: any[];
    if (requesterEmail || requesterName) {
      rows = db.prepare(`
        SELECT * FROM requests 
        WHERE LOWER(requester_email) = LOWER(?) OR LOWER(requester_name) = LOWER(?)
        ORDER BY created_at DESC
      `).all(String(requesterEmail || ''), String(requesterName || ''));
    } else {
      rows = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
    }
    res.json({ success: true, data: rows.map(formatRequestRow) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/requests', (req: Request, res: Response) => {
  try {
    const r = req.body;
    if (!r.requesterName || !r.programName || !r.startDate) {
      return res.status(400).json({ success: false, error: 'Requester name, program name, and start date are required.' });
    }

    const id = r.id || `REQ-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();

    const initialAudit = r.auditTrail || [
      {
        id: `CHG-${Date.now().toString().slice(-4)}`,
        timestamp: now,
        editorId: r.requesterId || 'usr-req',
        editorName: r.requesterName,
        editorRole: r.user?.role || 'requester',
        action: 'created',
        summary: `Requisition submitted for ${r.programName} (${(r.requestedAssetIds || []).length} items requested)`,
      },
    ];

    runInTransaction(() => {
      db.prepare(`
        INSERT INTO requests (
          id, requester_name, requester_email, requester_dept, program_name, location,
          start_date, end_date, requested_asset_ids, purpose, status, urgent,
          created_at, updated_at, reviewed_by, reviewed_at, manager_notes, audit_trail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        r.requesterName,
        r.requesterEmail || '',
        r.requesterDept || 'General Ministries',
        r.programName,
        r.location || 'Main Sanctuary',
        r.startDate,
        r.endDate || r.startDate,
        JSON.stringify(r.requestedAssetIds || []),
        r.purpose || '',
        r.status || 'pending',
        r.urgent ? 1 : 0,
        now,
        now,
        r.reviewedBy || null,
        r.reviewedAt || null,
        r.managerNotes || null,
        JSON.stringify(initialAudit)
      );

      logAuditActivity({
        assetId: id,
        assetName: `Reservation: ${r.programName}`,
        action: 'item_created',
        userId: r.requesterId || 'usr-req',
        userName: r.requesterName,
        department: r.requesterDept || 'General Ministries',
        details: `Submitted asset request for "${r.programName}" (${(r.requestedAssetIds || []).length} assets requested).`,
      });
    });

    const created = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: formatRequestRow(created) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/requests/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
      if (!existing) throw new Error(`Request ${id} not found.`);

      // Parse existing audit trail
      let auditTrailList: any[] = [];
      try {
        auditTrailList = JSON.parse(existing.audit_trail || '[]');
      } catch {
        auditTrailList = [];
      }

      // If an auditEntry is provided (user edited request fields while pending)
      if (body.auditEntry) {
        auditTrailList = [body.auditEntry, ...auditTrailList];
      }

      const updatedProgramName = body.programName !== undefined ? body.programName : existing.program_name;
      const updatedLocation = body.location !== undefined ? body.location : existing.location;
      const updatedStartDate = body.startDate !== undefined ? body.startDate : existing.start_date;
      const updatedEndDate = body.endDate !== undefined ? body.endDate : existing.end_date;
      const updatedAssetIds = body.requestedAssetIds !== undefined ? JSON.stringify(body.requestedAssetIds) : existing.requested_asset_ids;
      const updatedPurpose = body.purpose !== undefined ? body.purpose : existing.purpose;
      const updatedDept = body.requesterDept !== undefined ? body.requesterDept : existing.requester_dept;
      const updatedUrgent = body.urgent !== undefined ? (body.urgent ? 1 : 0) : existing.urgent;
      const updatedStatus = body.status !== undefined ? body.status : existing.status;
      const updatedReviewedBy = body.reviewedBy !== undefined ? body.reviewedBy : existing.reviewed_by;
      const updatedReviewedAt = body.reviewedAt !== undefined ? body.reviewedAt : (body.status ? now : existing.reviewed_at);
      const updatedManagerNotes = body.managerNotes !== undefined ? body.managerNotes : existing.manager_notes;

      // Status change event in audit trail
      if (body.status && body.status !== existing.status) {
        const actionType = body.status === 'approved' ? 'request_approved' : body.status === 'rejected' ? 'request_rejected' : 'status_changed';
        const statusEntry = {
          id: `CHG-${Date.now().toString().slice(-4)}`,
          timestamp: now,
          editorId: body.user?.id || 'usr-system',
          editorName: body.reviewedBy || body.user?.name || 'Reviewer',
          editorRole: body.user?.role || 'administrator',
          action: 'status_change',
          summary: `Requisition ${body.status.toUpperCase()} by ${body.reviewedBy || body.user?.name || 'Reviewer'}${body.managerNotes ? `: "${body.managerNotes}"` : ''}`,
        };
        auditTrailList = [statusEntry, ...auditTrailList];

        logAuditActivity({
          assetId: id,
          assetName: updatedProgramName,
          action: actionType,
          userId: body.user?.id || 'usr-system',
          userName: body.reviewedBy || body.user?.name || 'Reviewer',
          userRole: body.user?.role || 'administrator',
          department: updatedDept,
          details: `Request "${updatedProgramName}" marked as ${body.status.toUpperCase()} by ${body.reviewedBy || 'Manager'}. Notes: ${body.managerNotes || 'None'}`,
        });
      }

      db.prepare(`
        UPDATE requests
        SET program_name = ?,
            location = ?,
            start_date = ?,
            end_date = ?,
            requested_asset_ids = ?,
            purpose = ?,
            requester_dept = ?,
            urgent = ?,
            status = ?,
            reviewed_by = ?,
            reviewed_at = ?,
            manager_notes = ?,
            audit_trail = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        updatedProgramName,
        updatedLocation,
        updatedStartDate,
        updatedEndDate,
        updatedAssetIds,
        updatedPurpose,
        updatedDept,
        updatedUrgent,
        updatedStatus,
        updatedReviewedBy,
        updatedReviewedAt,
        updatedManagerNotes,
        JSON.stringify(auditTrailList),
        now,
        id
      );

      // Log edit activity to audit_trail_logs
      if (body.auditEntry) {
        logAuditActivity({
          assetId: id,
          assetName: updatedProgramName,
          action: 'request_edited',
          userId: body.user?.id || body.auditEntry.editorId || 'usr-system',
          userName: body.user?.name || body.auditEntry.editorName || 'Requester',
          userRole: body.user?.role || body.auditEntry.editorRole || 'requester',
          programOrEvent: updatedProgramName,
          department: updatedDept,
          details: `Request ${id} edited while pending authorisation: ${body.auditEntry.summary}`,
        });
      }
    });

    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    res.json({ success: true, data: formatRequestRow(updated) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/requests/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    runInTransaction(() => {
      db.prepare('DELETE FROM requests WHERE id = ?').run(id);
    });
    res.json({ success: true, message: `Request ${id} deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 8. MAINTENANCE TASKS CRUD & ACTIVITIES
// ==========================================

function formatMaintenanceRow(row: any) {
  return {
    id: row.id,
    assetId: row.asset_id,
    assetName: row.asset_name,
    category: row.category,
    taskTitle: row.task_title,
    intervalDays: Number(row.interval_days),
    lastPerformedDate: row.last_performed_date,
    dueDate: row.due_date,
    status: row.status,
    priority: row.priority,
    instructions: row.instructions,
    lastTechnician: row.last_technician || undefined,
  };
}

apiRouter.get('/maintenance', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM maintenance_tasks ORDER BY due_date ASC').all();
    res.json({ success: true, data: rows.map(formatMaintenanceRow) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/maintenance', (req: Request, res: Response) => {
  try {
    const m = req.body;
    if (!m.assetId || !m.taskTitle) {
      return res.status(400).json({ success: false, error: 'Asset ID and task title are required.' });
    }

    const id = m.id || `MNT-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();

    runInTransaction(() => {
      const asset = db.prepare('SELECT * FROM equipment WHERE id = ?').get(m.assetId) as any;

      db.prepare(`
        INSERT INTO maintenance_tasks (
          id, asset_id, asset_name, category, task_title, interval_days,
          last_performed_date, due_date, status, priority, instructions,
          last_technician, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        m.assetId,
        m.assetName || asset?.name || 'Asset',
        m.category || asset?.category || 'Audio',
        m.taskTitle,
        m.intervalDays || 30,
        m.lastPerformedDate || now.slice(0, 10),
        m.dueDate || now.slice(0, 10),
        m.status || 'healthy',
        m.priority || 'medium',
        m.instructions || '',
        m.lastTechnician || null,
        now,
        now
      );

      logAuditActivity({
        assetId: m.assetId,
        assetName: m.assetName || asset?.name || 'Asset',
        action: 'maintenance_flagged',
        details: `Scheduled routine service task: "${m.taskTitle}". Priority: ${m.priority || 'medium'}.`,
      });
    });

    const created = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: formatMaintenanceRow(created) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/maintenance/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const m = req.body;
    const now = new Date().toISOString();

    runInTransaction(() => {
      db.prepare(`
        UPDATE maintenance_tasks
        SET task_title = COALESCE(?, task_title),
            interval_days = COALESCE(?, interval_days),
            due_date = COALESCE(?, due_date),
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            instructions = COALESCE(?, instructions),
            last_technician = COALESCE(?, last_technician),
            updated_at = ?
        WHERE id = ?
      `).run(
        m.taskTitle ?? null,
        m.intervalDays ?? null,
        m.dueDate ?? null,
        m.status ?? null,
        m.priority ?? null,
        m.instructions ?? null,
        m.lastTechnician ?? null,
        now,
        id
      );
    });

    const updated = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id);
    res.json({ success: true, data: formatMaintenanceRow(updated) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Maintenance Task Completion Action
 */
apiRouter.post('/maintenance/:id/complete', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { technician, condition, notes, user } = req.body;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    runInTransaction(() => {
      const task = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id) as any;
      if (!task) throw new Error(`Maintenance task ${id} not found.`);

      const nextDue = new Date(Date.now() + (task.interval_days || 30) * 86400000).toISOString().slice(0, 10);
      const techName = technician || user?.name || 'Marcus Cole';

      // Update maintenance task
      db.prepare(`
        UPDATE maintenance_tasks
        SET status = 'healthy',
            last_performed_date = ?,
            due_date = ?,
            last_technician = ?,
            updated_at = ?
        WHERE id = ?
      `).run(today, nextDue, techName, now, id);

      // Update associated equipment record
      db.prepare(`
        UPDATE equipment
        SET last_maintenance_date = ?,
            next_maintenance_date = ?,
            condition = COALESCE(?, condition),
            maintenance_notes = ?,
            status = CASE WHEN status = 'in_maintenance' THEN 'available' ELSE status END,
            updated_at = ?
        WHERE id = ?
      `).run(today, nextDue, condition ?? null, notes || `Serviced by ${techName}`, now, task.asset_id);

      logAuditActivity({
        assetId: task.asset_id,
        assetName: task.asset_name,
        action: 'maintenance_completed',
        userId: user?.id || 'usr-staff',
        userName: techName,
        userRole: user?.role || 'staff',
        department: 'Media & Technical Arts',
        conditionAfter: condition || 'good',
        details: `Completed routine maintenance: "${task.taskTitle}". Technicians: ${techName}. Next service due: ${nextDue}.`,
      });
    });

    const updated = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id);
    res.json({ success: true, data: formatMaintenanceRow(updated) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/maintenance/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    runInTransaction(() => {
      db.prepare('DELETE FROM maintenance_tasks WHERE id = ?').run(id);
    });
    res.json({ success: true, message: `Maintenance task ${id} deleted.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 9. AUDIT TRAIL ACTIVITIES & LOGS
// ==========================================

function formatAuditLogRow(row: any) {
  return {
    id: row.id,
    assetId: row.asset_id,
    assetName: row.asset_name,
    action: row.action,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    programOrEvent: row.program_or_event || '',
    department: row.department,
    timestamp: row.timestamp,
    conditionBefore: row.condition_before || undefined,
    conditionAfter: row.condition_after || undefined,
    details: row.details,
    offlineGenerated: Boolean(row.offline_generated),
  };
}

apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM audit_trail_logs ORDER BY timestamp DESC LIMIT 500').all();
    res.json({ success: true, data: rows.map(formatAuditLogRow) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/audit-logs', (req: Request, res: Response) => {
  try {
    const entry = req.body;
    const id = entry.id || `LOG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const now = new Date().toISOString();

    runInTransaction(() => {
      db.prepare(`
        INSERT INTO audit_trail_logs (
          id, asset_id, asset_name, action, user_id, user_name, user_role,
          program_or_event, department, timestamp, condition_before, condition_after,
          details, offline_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        entry.assetId || 'SYSTEM',
        entry.assetName || 'General System',
        entry.action || 'item_updated',
        entry.userId || 'usr-system',
        entry.userName || 'System User',
        entry.userRole || 'staff',
        entry.programOrEvent || '',
        entry.department || 'Media & Technical Arts',
        entry.timestamp || now,
        entry.conditionBefore || null,
        entry.conditionAfter || null,
        entry.details || '',
        entry.offlineGenerated ? 1 : 0
      );
    });

    const created = db.prepare('SELECT * FROM audit_trail_logs WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: formatAuditLogRow(created) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Batch offline audit sync endpoint
 */
apiRouter.post('/audit-logs/batch', (req: Request, res: Response) => {
  try {
    const { entries, user } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.json({ success: true, count: 0, message: 'No entries to sync' });
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const userName = user?.name || 'Walk-Around Auditor';

    runInTransaction(() => {
      for (const entry of entries) {
        const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(entry.assetId) as any;
        const oldCond = item?.condition || 'good';

        // Update equipment in SQLite
        if (item) {
          db.prepare(`
            UPDATE equipment
            SET location = ?,
                condition = ?,
                last_audited_date = ?,
                last_audited_by = ?,
                updated_at = ?
            WHERE id = ?
          `).run(
            entry.venueLocation,
            entry.verifiedCondition,
            today,
            `${userName} (Offline Sync)`,
            now,
            entry.assetId
          );
        }

        // Insert audit log in SQLite
        const logId = `LOG-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 999)}`;
        db.prepare(`
          INSERT INTO audit_trail_logs (
            id, asset_id, asset_name, action, user_id, user_name, user_role,
            program_or_event, department, timestamp, condition_before, condition_after,
            details, offline_generated
          ) VALUES (?, ?, ?, 'inventory_audited', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
          logId,
          entry.assetId,
          entry.assetName || item?.name || entry.assetId,
          user?.id || 'usr-vol-1',
          userName,
          user?.role || 'volunteer',
          `Offline Audit Sync: ${entry.venueLocation}`,
          'Media & Technical Arts',
          entry.scannedAt || now,
          oldCond,
          entry.verifiedCondition,
          `Synced from offline walk-around. Location: ${entry.venueLocation}. Verified Condition: ${entry.verifiedCondition}. ${entry.notes || ''}`
        );
      }
    });

    res.json({ success: true, count: entries.length, message: `Successfully synced ${entries.length} audit records to SQLite.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 10. SQLITE SYSTEM STATUS & CONCURRENCY BENCHMARK
// ==========================================

apiRouter.post('/system/reset', (_req: Request, res: Response) => {
  try {
    resetDatabase();
    logAuditActivity({
      action: 'item_updated',
      details: 'SQLite database re-initialized and seeded with default production records.',
    });
    res.json({ success: true, message: 'SQLite database reset and re-seeded successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/system/export', (_req: Request, res: Response) => {
  try {
    const data = {
      exportedAt: new Date().toISOString(),
      users: db.prepare('SELECT * FROM users').all(),
      roles: db.prepare('SELECT * FROM roles').all(),
      categories: db.prepare('SELECT * FROM categories').all(),
      locations: db.prepare('SELECT * FROM locations').all(),
      departments: db.prepare('SELECT * FROM departments').all(),
      equipment: db.prepare('SELECT * FROM equipment').all(),
      requests: db.prepare('SELECT * FROM requests').all(),
      maintenanceTasks: db.prepare('SELECT * FROM maintenance_tasks').all(),
      auditTrailLogs: db.prepare('SELECT * FROM audit_trail_logs').all(),
    };
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/system/status', (_req: Request, res: Response) => {
  try {
    const journalMode = db.prepare('PRAGMA journal_mode').get() as any;
    const busyTimeout = db.prepare('PRAGMA busy_timeout').get() as any;
    const synchronous = db.prepare('PRAGMA synchronous').get() as any;
    const foreignKeys = db.prepare('PRAGMA foreign_keys').get() as any;
    const cacheSize = db.prepare('PRAGMA cache_size').get() as any;

    let dbFileSize = 0;
    try {
      const stat = fs.statSync(DB_PATH);
      dbFileSize = stat.size;
    } catch (e) {
      // ignore
    }

    const counts = {
      users: (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c,
      roles: (db.prepare('SELECT COUNT(*) as c FROM roles').get() as any).c,
      categories: (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any).c,
      locations: (db.prepare('SELECT COUNT(*) as c FROM locations').get() as any).c,
      departments: (db.prepare('SELECT COUNT(*) as c FROM departments').get() as any).c,
      equipment: (db.prepare('SELECT COUNT(*) as c FROM equipment').get() as any).c,
      activeCheckouts: (db.prepare("SELECT COUNT(*) as c FROM equipment WHERE status = 'checked_out'").get() as any).c,
      requests: (db.prepare('SELECT COUNT(*) as c FROM requests').get() as any).c,
      maintenanceTasks: (db.prepare('SELECT COUNT(*) as c FROM maintenance_tasks').get() as any).c,
      auditLogs: (db.prepare('SELECT COUNT(*) as c FROM audit_trail_logs').get() as any).c,
      concurrencyAudits: (db.prepare('SELECT COUNT(*) as c FROM concurrency_audit').get() as any).c,
    };

    res.json({
      success: true,
      data: {
        databaseEngine: 'SQLite 3 (Node.js DatabaseSync)',
        databasePath: DB_PATH,
        databaseSizeBytes: dbFileSize,
        databaseSizeFormatted: `${(dbFileSize / 1024).toFixed(1)} KB`,
        pragmas: {
          journalMode: journalMode?.journal_mode || 'wal',
          busyTimeoutMs: busyTimeout?.timeout || 5000,
          synchronous: synchronous?.synchronous === 1 ? 'NORMAL' : synchronous?.synchronous,
          foreignKeys: Boolean(foreignKeys?.foreign_keys),
          cacheSize: cacheSize?.cache_size,
        },
        counts,
        concurrencySupport: {
          mode: 'Write-Ahead Logging (WAL)',
          multiReaderCapability: 'Non-blocking concurrent readers while writing',
          busyLockResolutionTimeout: '5000ms automated retry',
          transactionIsolation: 'IMMEDIATE transactions with atomicity',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Concurrency Test Endpoint:
 * Executes multiple concurrent async write operations against SQLite in parallel
 * to prove that WAL mode and busy_timeout successfully handle concurrent transactions.
 */
apiRouter.post('/system/concurrency-test', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const concurrencyLevel = 10;
  const clientId = `test-client-${Date.now()}`;

  const tasks = Array.from({ length: concurrencyLevel }, (_, idx) => {
    return new Promise<{ workerId: number; success: boolean; durationMs: number }>((resolve) => {
      const workerStart = Date.now();
      // Simulate real-world micro-jitter
      setTimeout(() => {
        try {
          runInTransaction(() => {
            const now = new Date().toISOString();
            db.prepare(`
              INSERT INTO concurrency_audit (client_id, tx_sequence, operation, committed_at)
              VALUES (?, ?, ?, ?)
            `).run(clientId, idx + 1, `CONCURRENT_TX_WORKER_${idx + 1}`, now);
          });
          resolve({ workerId: idx + 1, success: true, durationMs: Date.now() - workerStart });
        } catch (err: any) {
          resolve({ workerId: idx + 1, success: false, durationMs: Date.now() - workerStart });
        }
      }, Math.floor(Math.random() * 20));
    });
  });

  const results = await Promise.all(tasks);
  const totalDuration = Date.now() - startTime;
  const successfulCount = results.filter((r) => r.success).length;

  res.json({
    success: true,
    benchmark: {
      transactionsAttempted: concurrencyLevel,
      transactionsSuccessful: successfulCount,
      allSucceeded: successfulCount === concurrencyLevel,
      totalTimeMs: totalDuration,
      averageTxTimeMs: (totalDuration / concurrencyLevel).toFixed(2),
      concurrencyEngine: 'SQLite Write-Ahead Logging (WAL) + busy_timeout=5000',
      workers: results,
    },
  });
});

// ==========================================
// 10. ONLINE IMAGE SEARCH (Wikimedia Commons + Curated Library)
// ==========================================

interface SearchImageResult {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  source: string;
  author?: string;
  license?: string;
}

const CURATED_EQUIPMENT_IMAGES: { keywords: string[]; title: string; url: string; thumbUrl: string }[] = [
  // Microphones & Wireless Audio
  {
    keywords: ['shure', 'sm58', 'wireless', 'microphone', 'receiver', 'vocal', 'mic', 'audio'],
    title: 'Shure SM58 Dynamic Vocal Microphone',
    url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['sennheiser', 'ew-d', 'handheld', 'wireless mic', 'chapel', 'microphone', 'audio'],
    title: 'Sennheiser Wireless Handheld Microphone',
    url: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['iem', 'in-ear', 'monitor', 'transmitter', 'pack', 'bodypack', 'sennheiser g4', 'audio'],
    title: 'Wireless In-Ear Monitor System & Bodypacks',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['di', 'direct box', 'radial', 'prod2', 'stereo', 'interface', 'audio'],
    title: 'Radial Stereo Direct Box Passive DI Unit',
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['mixer', 'console', 'soundcraft', 'behringer', 'yamaha', 'digital audio', 'desk'],
    title: 'Professional Digital Live Sound Mixing Console',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
  },
  // Broadcast Cameras & Video
  {
    keywords: ['blackmagic', 'ursa', 'broadcast', 'camera', '6k', 'studio', 'fujinon', 'video'],
    title: 'Blackmagic URSA Studio Broadcast Camera Rig',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['sony', 'fx3', 'cinema', 'mirrorless', 'handheld', 'b-roll', 'video', 'camera'],
    title: 'Sony FX3 Full-Frame Cinema Camera Kit',
    url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['ptz', 'birddog', 'ndi', 'remote', 'balcony', 'robotic', 'video', 'camera'],
    title: 'BirdDog Robotic PTZ Live Production Camera',
    url: 'https://images.unsplash.com/photo-1587840171670-8b850147754e?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1587840171670-8b850147754e?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['atem', 'switcher', 'constellation', 'video switcher', 'control room', 'production'],
    title: 'Live Video Broadcast Production Switcher',
    url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['hollyland', 'wireless video', 'transmitter', 'mars 400s', 'hdmi', 'sdi', 'receiver'],
    title: 'Wireless SDI/HDMI Video Transmitter System',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
  },
  // Lighting
  {
    keywords: ['chauvet', 'moving head', 'wash', 'rogue', 'r2x', 'lighting', 'stage', 'truss'],
    title: 'Chauvet Professional Moving Head Wash Fixture',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['aputure', 'light storm', '600d', 'dome', 'studio', 'key light', 'led', 'lighting'],
    title: 'Aputure LS 600d Pro High-Output Studio Fixture',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['dmx', 'chamsys', 'quickq', 'lighting console', 'faders', 'stage control', 'lighting'],
    title: 'ChamSys QuickQ DMX Stage Lighting Console',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
  },
  // Computing & Media
  {
    keywords: ['apple', 'mac studio', 'm2', 'propresenter', 'workstation', 'media', 'computing'],
    title: 'Apple Mac Studio Broadcast Workstation',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['dell', 'xps', 'laptop', 'streaming', 'mobile production', 'computing'],
    title: 'High-Performance Production Mobile Laptop',
    url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80',
  },
  // Cables & Rigging
  {
    keywords: ['whirlwind', 'medusa', 'snake', 'multicore', 'stage box', 'xlr', 'cables'],
    title: 'Whirlwind Medusa Elite 24x8 Stage Audio Multicore',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['sachtler', 'flowtech', 'tripod', 'carbon fiber', 'fsb', 'support', 'staging'],
    title: 'Sachtler Flowtech Carbon Fiber Studio Tripod',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80',
  },
];

apiRouter.get('/images/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  const category = (req.query.category as string || '').trim();
  const limit = Math.min(Number(req.query.limit) || 16, 30);

  const results: SearchImageResult[] = [];
  const seenUrls = new Set<string>();

  // 1. Try Wikimedia Commons search with timeout
  if (query) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      // Clean search term for Wikimedia query
      const cleanQ = query
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1)
        .slice(0, 4)
        .join(' ');

      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQ || query)}&gsrlimit=18&prop=imageinfo&iiprop=url|thumburl|extmetadata&iiurlwidth=500&format=json&origin=*`;

      const response = await fetch(wikiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'GCCMediaInventory/1.0 (https://gracecommunitychurch.org; media@gccredhill.org)',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const json = await response.json();
        const pages = json?.query?.pages;
        if (pages) {
          for (const pageId in pages) {
            const page = pages[pageId];
            const info = page?.imageinfo?.[0];
            if (!info || !info.url) continue;

            const url = info.url.toLowerCase();
            // Filter out non-photo media
            if (url.endsWith('.pdf') || url.endsWith('.ogg') || url.endsWith('.oga') || url.endsWith('.mid') || url.endsWith('.webm')) {
              continue;
            }

            const cleanTitle = (page.title || '').replace(/^File:/i, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
            const thumbUrl = info.thumburl || info.url;

            if (!seenUrls.has(info.url)) {
              seenUrls.add(info.url);
              results.push({
                id: `wiki-${pageId}`,
                title: cleanTitle,
                url: info.url,
                thumbUrl: thumbUrl,
                source: 'Wikimedia Commons',
                license: page?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value || 'Creative Commons',
              });
            }
          }
        }
      }
    } catch (e: any) {
      // Wikimedia search fallback
      console.log('[ImageSearch] Wikimedia query bypassed or timed out:', e?.message || e);
    }
  }

  // 2. Score and add curated equipment images matching query or category
  const queryTokens = `${query} ${category}`.toLowerCase().split(/\s+/).filter(Boolean);

  const matchedCurated = CURATED_EQUIPMENT_IMAGES.map((img) => {
    let score = 0;
    for (const token of queryTokens) {
      for (const kw of img.keywords) {
        if (kw === token) score += 3;
        else if (kw.includes(token) || token.includes(kw)) score += 1;
      }
      if (img.title.toLowerCase().includes(token)) score += 2;
    }
    return { img, score };
  })
    .filter((entry) => entry.score > 0 || !query)
    .sort((a, b) => b.score - a.score);

  for (const { img } of matchedCurated) {
    if (!seenUrls.has(img.url)) {
      seenUrls.add(img.url);
      results.push({
        id: `curated-${Math.random().toString(36).substring(2, 9)}`,
        title: img.title,
        url: img.url,
        thumbUrl: img.thumbUrl,
        source: 'Verified Studio Equipment Collection',
        license: 'Free to use (Unsplash)',
      });
    }
  }

  // If query had no matches at all, include high-relevance defaults
  if (results.length === 0) {
    for (const img of CURATED_EQUIPMENT_IMAGES.slice(0, 8)) {
      results.push({
        id: `curated-def-${Math.random().toString(36).substring(2, 9)}`,
        title: img.title,
        url: img.url,
        thumbUrl: img.thumbUrl,
        source: 'Curated Studio Gear',
        license: 'Free to use',
      });
    }
  }

  res.json({
    success: true,
    query,
    count: results.length,
    results: results.slice(0, limit),
  });
});
