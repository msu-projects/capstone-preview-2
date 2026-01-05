// ==========================================
// USER MANAGEMENT & AUTH TYPES
// ==========================================

export type UserRole = 'superadmin' | 'admin' | 'viewer';

export interface ResourcePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface UserPermissions {
  sitios: ResourcePermissions;
  users: ResourcePermissions;
  audit_logs: ResourcePermissions;
  canReview: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string; // For prototype, plain text comparison
  role: UserRole;
  permissions: UserPermissions;
  department: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
  updated_at?: string;
}
