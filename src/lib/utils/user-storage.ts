import type { User, UserPermissions, UserRole } from '$lib/types';

const USERS_STORAGE_KEY = 'sccdp_users';

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  superadmin: {
    sitios: { read: true, write: true, delete: true },
    users: { read: true, write: true, delete: true },
    audit_logs: { read: true, write: true, delete: true },
    canReview: true
  },
  admin: {
    sitios: { read: true, write: true, delete: false },
    users: { read: true, write: false, delete: false },
    audit_logs: { read: true, write: false, delete: false },
    canReview: false
  },
  viewer: {
    sitios: { read: true, write: false, delete: false },
    users: { read: false, write: false, delete: false },
    audit_logs: { read: false, write: false, delete: false },
    canReview: false
  }
};

// Default users for prototype
const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'Super Administrator',
    email: 'superadmin@southcotabato.gov.ph',
    password_hash: 'admin123', // Plain text for prototype
    role: 'superadmin',
    permissions: DEFAULT_PERMISSIONS.superadmin,
    department: 'IT Department',
    is_active: true,
    last_login: new Date().toISOString(),
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@southcotabato.gov.ph',
    password_hash: 'admin123',
    role: 'admin',
    permissions: DEFAULT_PERMISSIONS.admin,
    department: 'DILG',
    is_active: true,
    last_login: '2024-11-15T09:30:00Z',
    created_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 3,
    name: 'Maria Santos',
    email: 'maria.santos@southcotabato.gov.ph',
    password_hash: 'admin123',
    role: 'admin',
    permissions: DEFAULT_PERMISSIONS.admin,
    department: 'DPWH',
    is_active: true,
    last_login: '2024-11-14T14:20:00Z',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 4,
    name: 'Pedro Reyes',
    email: 'pedro.reyes@southcotabato.gov.ph',
    password_hash: 'viewer123',
    role: 'viewer',
    permissions: DEFAULT_PERMISSIONS.viewer,
    department: 'DepEd',
    is_active: true,
    last_login: '2024-11-13T11:00:00Z',
    created_at: '2024-02-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Ana Garcia',
    email: 'ana.garcia@southcotabato.gov.ph',
    password_hash: 'admin123',
    role: 'admin',
    permissions: {
      ...DEFAULT_PERMISSIONS.admin
    },
    department: 'DA',
    is_active: true,
    last_login: '2024-11-12T08:45:00Z',
    created_at: '2024-02-10T00:00:00Z'
  },
  {
    id: 6,
    name: 'Inactive User',
    email: 'inactive@southcotabato.gov.ph',
    password_hash: 'inactive123',
    role: 'viewer',
    permissions: DEFAULT_PERMISSIONS.viewer,
    department: 'Testing',
    is_active: false,
    last_login: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z'
  }
];

/**
 * Initialize users storage with defaults if empty
 */
function initializeUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;

  try {
    const json = localStorage.getItem(USERS_STORAGE_KEY);
    if (json) {
      return JSON.parse(json);
    }
    // Initialize with default users
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  } catch (error) {
    console.error('Failed to initialize users:', error);
    return DEFAULT_USERS;
  }
}

/**
 * Load users from LocalStorage
 */
export function loadUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;

  try {
    const json = localStorage.getItem(USERS_STORAGE_KEY);
    if (!json) {
      return initializeUsers();
    }
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to load users:', error);
    return DEFAULT_USERS;
  }
}

/**
 * Save users to LocalStorage
 */
export function saveUsers(users: User[]): boolean {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Failed to save users:', error);
    return false;
  }
}

/**
 * Get user by ID
 */
export function getUserById(id: number): User | undefined {
  const users = loadUsers();
  return users.find((u) => u.id === id);
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | undefined {
  const users = loadUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Add a new user
 */
export function addUser(user: Omit<User, 'id' | 'created_at'>): User | null {
  const users = loadUsers();

  // Check for duplicate email
  if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    console.error('User with this email already exists');
    return null;
  }

  const newUser: User = {
    ...user,
    id: Math.max(0, ...users.map((u) => u.id)) + 1,
    created_at: new Date().toISOString()
  };

  users.push(newUser);

  if (saveUsers(users)) {
    return newUser;
  }
  return null;
}

/**
 * Update an existing user
 */
export function updateUser(id: number, updates: Partial<User>): boolean {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    console.error(`User with id ${id} not found`);
    return false;
  }

  // Prevent email duplicate if changing email
  if (updates.email) {
    const existingWithEmail = users.find(
      (u) => u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== id
    );
    if (existingWithEmail) {
      console.error('Another user with this email already exists');
      return false;
    }
  }

  users[index] = {
    ...users[index],
    ...updates,
    updated_at: new Date().toISOString()
  };

  return saveUsers(users);
}

/**
 * Delete a user (soft delete by setting is_active to false)
 */
export function deleteUser(id: number): boolean {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    console.error(`User with id ${id} not found`);
    return false;
  }

  // Prevent deleting the last superadmin
  const user = users[index];
  if (user.role === 'superadmin') {
    const superadminCount = users.filter((u) => u.role === 'superadmin' && u.is_active).length;
    if (superadminCount <= 1) {
      console.error('Cannot delete the last superadmin');
      return false;
    }
  }

  users[index].is_active = false;
  users[index].updated_at = new Date().toISOString();

  return saveUsers(users);
}

/**
 * Permanently delete a user (hard delete)
 */
export function permanentlyDeleteUser(id: number): boolean {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    console.error(`User with id ${id} not found`);
    return false;
  }

  // Prevent deleting the last superadmin
  const user = users[index];
  if (user.role === 'superadmin') {
    const superadminCount = users.filter((u) => u.role === 'superadmin').length;
    if (superadminCount <= 1) {
      console.error('Cannot delete the last superadmin');
      return false;
    }
  }

  users.splice(index, 1);
  return saveUsers(users);
}

/**
 * Reset users to defaults
 */
export function resetUsers(): boolean {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return true;
  } catch (error) {
    console.error('Failed to reset users:', error);
    return false;
  }
}

/**
 * Get users by role
 */
export function getUsersByRole(role: UserRole): User[] {
  const users = loadUsers();
  return users.filter((u) => u.role === role);
}

/**
 * Get active users only
 */
export function getActiveUsers(): User[] {
  const users = loadUsers();
  return users.filter((u) => u.is_active);
}

/**
 * Update user's last login timestamp
 */
export function updateLastLogin(id: number): boolean {
  return updateUser(id, { last_login: new Date().toISOString() });
}
