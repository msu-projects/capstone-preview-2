import type { AuditAction, AuditFieldChange, AuditLog, AuditResourceType } from '$lib/types';
import { nanoid } from 'nanoid';

const AUDIT_LOGS_STORAGE_KEY = 'sccdp_audit_logs';
const MAX_AUDIT_LOGS = 500; // Keep last 500 entries to prevent localStorage overflow

/**
 * Load audit logs from LocalStorage
 */
export function loadAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return [];

  try {
    const json = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    return [];
  }
}

/**
 * Save audit logs to LocalStorage
 */
function saveAuditLogs(logs: AuditLog[]): boolean {
  try {
    // Keep only the most recent entries
    const trimmedLogs = logs.slice(-MAX_AUDIT_LOGS);
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));
    return true;
  } catch (error) {
    console.error('Failed to save audit logs:', error);
    return false;
  }
}

/**
 * Log an audit action
 */
export function logAuditAction(
  action: AuditAction,
  resourceType: AuditResourceType,
  resourceId?: number | string,
  resourceName?: string,
  details?: string,
  changes?: AuditFieldChange[]
): AuditLog | null {
  if (typeof window === 'undefined') return null;

  // Get current user from session (avoid circular dependency)
  let userId = 0;
  let userName = 'System';

  try {
    const sessionData = localStorage.getItem('sccdp_auth_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session.user) {
        userId = session.user.id;
        userName = session.user.name;
      }
    }
  } catch {
    // Use default system user
  }

  const auditLog: AuditLog = {
    id: nanoid(),
    user_id: userId,
    user_name: userName,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    details,
    changes,
    ip_address: '127.0.0.1', // Placeholder for prototype
    timestamp: new Date().toISOString()
  };

  const logs = loadAuditLogs();
  logs.push(auditLog);
  saveAuditLogs(logs);

  return auditLog;
}

/**
 * Calculate field changes between two objects
 */
export function calculateChanges<T extends object>(
  oldObj: T,
  newObj: Partial<T>,
  fieldsToTrack?: (keyof T)[]
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];
  const keys = fieldsToTrack || (Object.keys(newObj) as (keyof T)[]);

  for (const key of keys) {
    if (key in newObj) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      // Deep comparison for objects/arrays
      const oldStr = JSON.stringify(oldValue);
      const newStr = JSON.stringify(newValue);

      if (oldStr !== newStr) {
        changes.push({
          field: String(key),
          oldValue,
          newValue
        });
      }
    }
  }

  return changes;
}

/**
 * Get audit logs filtered by user
 */
export function getAuditLogsByUser(userId: number): AuditLog[] {
  const logs = loadAuditLogs();
  return logs.filter((log) => log.user_id === userId);
}

/**
 * Get audit logs filtered by resource type
 */
export function getAuditLogsByResource(resourceType: AuditResourceType): AuditLog[] {
  const logs = loadAuditLogs();
  return logs.filter((log) => log.resource_type === resourceType);
}

/**
 * Get audit logs filtered by action
 */
export function getAuditLogsByAction(action: AuditAction): AuditLog[] {
  const logs = loadAuditLogs();
  return logs.filter((log) => log.action === action);
}

/**
 * Get audit logs within a date range
 */
export function getAuditLogsByDateRange(startDate: Date, endDate: Date): AuditLog[] {
  const logs = loadAuditLogs();
  return logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
}

/**
 * Clear all audit logs (superadmin only)
 */
export function clearAuditLogs(): boolean {
  try {
    localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear audit logs:', error);
    return false;
  }
}

/**
 * Get audit log statistics
 */
export function getAuditLogStats(): {
  total: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byUser: Record<string, number>;
} {
  const logs = loadAuditLogs();

  const byAction: Record<string, number> = {};
  const byResource: Record<string, number> = {};
  const byUser: Record<string, number> = {};

  logs.forEach((log) => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    byResource[log.resource_type] = (byResource[log.resource_type] || 0) + 1;
    byUser[log.user_name] = (byUser[log.user_name] || 0) + 1;
  });

  return {
    total: logs.length,
    byAction,
    byResource,
    byUser
  };
}

/**
 * Initialize mock audit logs with rollback examples
 */
export function initializeMockAuditLogs(): void {
  const existingLogs = loadAuditLogs();

  // Only initialize if no logs exist
  if (existingLogs.length > 0) return;

  const now = new Date();
  const mockLogs: AuditLog[] = [
    // Recent rollback action
    {
      id: 'mock_rollback_001',
      user_id: 1,
      user_name: 'Admin User',
      action: 'rollback',
      resource_type: 'sitio',
      resource_id: 15,
      resource_name: 'Sitio Maligaya, Brgy. San Isidro',
      details: 'Rolled back incorrect population update from March 2025',
      changes: [
        {
          field: 'totalPopulation',
          oldValue: 850,
          newValue: 720
        },
        {
          field: 'totalHouseholds',
          oldValue: 210,
          newValue: 180
        },
        {
          field: 'povertyRate',
          oldValue: 28.5,
          newValue: 32.1
        }
      ],
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    // Original update that was rolled back
    {
      id: 'mock_update_001',
      user_id: 2,
      user_name: 'Maria Santos',
      action: 'update',
      resource_type: 'sitio',
      resource_id: 15,
      resource_name: 'Sitio Maligaya, Brgy. San Isidro',
      details: 'Updated demographic data based on field survey',
      changes: [
        {
          field: 'totalPopulation',
          oldValue: 720,
          newValue: 850
        },
        {
          field: 'totalHouseholds',
          oldValue: 180,
          newValue: 210
        },
        {
          field: 'povertyRate',
          oldValue: 32.1,
          newValue: 28.5
        }
      ],
      ip_address: '192.168.1.105',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
    },
    // Another rollback for a project
    {
      id: 'mock_rollback_002',
      user_id: 1,
      user_name: 'Admin User',
      action: 'rollback',
      resource_type: 'project',
      resource_id: 8,
      resource_name: 'Water System Installation - Phase 2',
      details: 'Reverted accidental project completion marking',
      changes: [
        {
          field: 'status',
          oldValue: 'completed',
          newValue: 'ongoing'
        },
        {
          field: 'completionPercentage',
          oldValue: 100,
          newValue: 75
        },
        {
          field: 'completedAt',
          oldValue: '2026-01-04T10:30:00Z',
          newValue: null
        }
      ],
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    // The action that was rolled back
    {
      id: 'mock_update_002',
      user_id: 3,
      user_name: 'Juan Dela Cruz',
      action: 'update',
      resource_type: 'project',
      resource_id: 8,
      resource_name: 'Water System Installation - Phase 2',
      details: 'Marked project as completed',
      changes: [
        {
          field: 'status',
          oldValue: 'ongoing',
          newValue: 'completed'
        },
        {
          field: 'completionPercentage',
          oldValue: 75,
          newValue: 100
        },
        {
          field: 'completedAt',
          oldValue: null,
          newValue: '2026-01-04T10:30:00Z'
        }
      ],
      ip_address: '192.168.1.110',
      timestamp: new Date(now.getTime() - 1.2 * 24 * 60 * 60 * 1000).toISOString()
    },
    // Rollback of a delete action
    {
      id: 'mock_rollback_003',
      user_id: 1,
      user_name: 'Admin User',
      action: 'rollback',
      resource_type: 'sitio',
      resource_id: 23,
      resource_name: 'Sitio Riverside, Brgy. Poblacion',
      details: 'Restored accidentally deleted sitio profile',
      changes: [
        {
          field: 'deleted',
          oldValue: true,
          newValue: false
        }
      ],
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    // Some regular audit entries
    {
      id: 'mock_login_001',
      user_id: 1,
      user_name: 'Admin User',
      action: 'login',
      resource_type: 'system',
      details: 'Successful login',
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    },
    {
      id: 'mock_create_001',
      user_id: 2,
      user_name: 'Maria Santos',
      action: 'create',
      resource_type: 'sitio',
      resource_id: 45,
      resource_name: 'Sitio New Dawn, Brgy. Esperanza',
      details: 'Created new sitio profile',
      ip_address: '192.168.1.105',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
    },
    {
      id: 'mock_export_001',
      user_id: 1,
      user_name: 'Admin User',
      action: 'export',
      resource_type: 'report',
      resource_name: 'Q4 2025 Vulnerability Assessment',
      details: 'Exported report as PDF',
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }
  ];

  saveAuditLogs(mockLogs);
}
