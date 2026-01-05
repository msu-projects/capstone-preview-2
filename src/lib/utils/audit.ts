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
 * Initialize mock audit logs with comprehensive workflow examples
 */
export function initializeMockAuditLogs(): void {
  const existingLogs = loadAuditLogs();

  // Only initialize if no logs exist
  if (existingLogs.length > 0) return;

  const now = new Date();
  const mockLogs: AuditLog[] = [];

  // ===== SUBMISSION WORKFLOW EXAMPLES =====

  // Example 1: Complete approval workflow
  const sitioId1 = 12;
  const sitioName1 = 'Sitio Bagong Silang, Brgy. Magsaysay';
  const fieldWorker1 = { id: 4, name: 'Pedro Reyes' };
  const reviewer1 = { id: 1, name: 'Admin User' };

  // Step 1: Field worker submits changes
  mockLogs.push({
    id: 'mock_submit_001',
    user_id: fieldWorker1.id,
    user_name: fieldWorker1.name,
    action: 'submit_for_review',
    resource_type: 'sitio',
    resource_id: sitioId1,
    resource_name: sitioName1,
    details:
      'Submitted demographic data updates for review. Comment: Updated household count based on recent barangay census',
    changes: [
      { field: 'totalHouseholds', oldValue: 145, newValue: 158 },
      { field: 'totalPopulation', oldValue: 682, newValue: 735 },
      { field: 'indigenousHouseholds', oldValue: 23, newValue: 28 }
    ],
    ip_address: '192.168.1.115',
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Step 2: Admin approves
  mockLogs.push({
    id: 'mock_approve_001',
    user_id: reviewer1.id,
    user_name: reviewer1.name,
    action: 'approve',
    resource_type: 'sitio',
    resource_id: sitioId1,
    resource_name: sitioName1,
    details:
      'Approved submitted changes. Reviewer comment: Data verified against barangay records - approved',
    changes: [{ field: 'status', oldValue: 'pending', newValue: 'approved' }],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Example 2: Rejection workflow
  const sitioId2 = 18;
  const sitioName2 = 'Sitio Maharlika, Brgy. San Miguel';
  const fieldWorker2 = { id: 5, name: 'Ana Garcia' };

  mockLogs.push({
    id: 'mock_submit_002',
    user_id: fieldWorker2.id,
    user_name: fieldWorker2.name,
    action: 'submit_for_review',
    resource_type: 'sitio',
    resource_id: sitioId2,
    resource_name: sitioName2,
    details:
      'Submitted infrastructure updates. Comment: Updated water source and road access information',
    changes: [
      { field: 'waterSource', oldValue: 'Deep Well', newValue: 'Level I - Point Source' },
      { field: 'roadAccess', oldValue: 'Dirt Road', newValue: 'Concrete Road' }
    ],
    ip_address: '192.168.1.116',
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });

  mockLogs.push({
    id: 'mock_reject_001',
    user_id: reviewer1.id,
    user_name: reviewer1.name,
    action: 'reject',
    resource_type: 'sitio',
    resource_id: sitioId2,
    resource_name: sitioName2,
    details:
      'Rejected submitted changes. Reviewer comment: Infrastructure improvements not yet completed according to municipal engineer office',
    changes: [{ field: 'status', oldValue: 'pending', newValue: 'rejected' }],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 4.8 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Example 3: Revision request workflow with multiple rounds
  const sitioId3 = 25;
  const sitioName3 = 'Sitio Sampaguita, Brgy. Santa Cruz';
  const fieldWorker3 = { id: 6, name: 'Roberto Cruz' };

  // Round 1: Initial submission
  mockLogs.push({
    id: 'mock_submit_003',
    user_id: fieldWorker3.id,
    user_name: fieldWorker3.name,
    action: 'submit_for_review',
    resource_type: 'sitio',
    resource_id: sitioId3,
    resource_name: sitioName3,
    details:
      'Submitted comprehensive data updates. Comment: Complete facility and livelihood program updates',
    changes: [
      { field: 'healthFacilities', oldValue: 0, newValue: 1 },
      { field: 'livelihoodPrograms', oldValue: 2, newValue: 5 },
      { field: 'beneficiaryCount', oldValue: 45, newValue: 120 }
    ],
    ip_address: '192.168.1.117',
    timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Round 1: Request revision
  mockLogs.push({
    id: 'mock_revision_001',
    user_id: reviewer1.id,
    user_name: reviewer1.name,
    action: 'request_revision',
    resource_type: 'sitio',
    resource_id: sitioId3,
    resource_name: sitioName3,
    details:
      'Requested revisions. Reviewer comment: Please provide documentation for the new health facility and verify beneficiary count',
    changes: [{ field: 'status', oldValue: 'pending', newValue: 'needs_revision' }],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 9.5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Round 2: Resubmission
  mockLogs.push({
    id: 'mock_resubmit_001',
    user_id: fieldWorker3.id,
    user_name: fieldWorker3.name,
    action: 'resubmit',
    resource_type: 'sitio',
    resource_id: sitioId3,
    resource_name: sitioName3,
    details:
      'Resubmitted with corrections (Round 2). Comment: Attached health facility license and updated beneficiary list from DSWD',
    changes: [
      { field: 'status', oldValue: 'needs_revision', newValue: 'pending' },
      { field: 'beneficiaryCount', oldValue: 120, newValue: 98 }
    ],
    ip_address: '192.168.1.117',
    timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Round 2: Another revision request
  mockLogs.push({
    id: 'mock_revision_002',
    user_id: reviewer1.id,
    user_name: reviewer1.name,
    action: 'request_revision',
    resource_type: 'sitio',
    resource_id: sitioId3,
    resource_name: sitioName3,
    details:
      'Requested additional revisions. Reviewer comment: Documentation is good, but dates on some documents are from last year. Please provide current year validation',
    changes: [{ field: 'status', oldValue: 'pending', newValue: 'needs_revision' }],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 7.5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Round 3: Final resubmission
  mockLogs.push({
    id: 'mock_resubmit_002',
    user_id: fieldWorker3.id,
    user_name: fieldWorker3.name,
    action: 'resubmit',
    resource_type: 'sitio',
    resource_id: sitioId3,
    resource_name: sitioName3,
    details:
      'Resubmitted with updated documentation (Round 3). Comment: Obtained current year certification from barangay captain',
    changes: [{ field: 'status', oldValue: 'needs_revision', newValue: 'pending' }],
    ip_address: '192.168.1.117',
    timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Round 3: Final approval
  mockLogs.push({
    id: 'mock_approve_002',
    user_id: reviewer1.id,
    user_name: reviewer1.name,
    action: 'approve',
    resource_type: 'sitio',
    resource_id: sitioId3,
    resource_name: sitioName3,
    details:
      'Approved after 2 revision rounds. Reviewer comment: All documentation verified and current - approved',
    changes: [{ field: 'status', oldValue: 'pending', newValue: 'approved' }],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 5.5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Example 4: Project submission and approval
  const projectId1 = 15;
  const projectName1 = 'Solar Street Lighting Project - Phase 3';

  mockLogs.push({
    id: 'mock_submit_004',
    user_id: fieldWorker1.id,
    user_name: fieldWorker1.name,
    action: 'submit_for_review',
    resource_type: 'project',
    resource_id: projectId1,
    resource_name: projectName1,
    details:
      'Submitted project progress update. Comment: Updated completion percentage based on latest progress report',
    changes: [
      { field: 'completionPercentage', oldValue: 45, newValue: 68 },
      { field: 'status', oldValue: 'planning', newValue: 'ongoing' },
      { field: 'currentPhase', oldValue: 'Site Preparation', newValue: 'Installation' }
    ],
    ip_address: '192.168.1.115',
    timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
  });

  mockLogs.push({
    id: 'mock_approve_003',
    user_id: reviewer1.id,
    user_name: reviewer1.name,
    action: 'approve',
    resource_type: 'project',
    resource_id: projectId1,
    resource_name: projectName1,
    details:
      'Approved project update. Reviewer comment: Progress verified with project engineer - approved',
    changes: [{ field: 'status', oldValue: 'pending', newValue: 'approved' }],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 3.8 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Example 5: Conflict resolution
  const sitioId4 = 33;
  const sitioName4 = 'Sitio Harmony, Brgy. Bonifacio';

  mockLogs.push({
    id: 'mock_submit_005',
    user_id: fieldWorker2.id,
    user_name: fieldWorker2.name,
    action: 'submit_for_review',
    resource_type: 'sitio',
    resource_id: sitioId4,
    resource_name: sitioName4,
    details:
      'Submitted poverty data updates. Comment: Updated poverty indicators from recent household survey',
    changes: [
      { field: 'povertyRate', oldValue: 35.2, newValue: 31.8 },
      { field: 'foodPoorHouseholds', oldValue: 42, newValue: 38 }
    ],
    ip_address: '192.168.1.116',
    timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  mockLogs.push({
    id: 'mock_conflict_001',
    user_id: reviewer1.id,
    user_name: reviewer1.name,
    action: 'resolve_conflict',
    resource_type: 'sitio',
    resource_id: sitioId4,
    resource_name: sitioName4,
    details:
      'Detected and resolved data conflict. Base data was modified by another user during review. Applied proposed changes after verification',
    changes: [
      { field: 'status', oldValue: 'conflict', newValue: 'approved' },
      { field: 'conflictResolution', oldValue: null, newValue: 'apply_proposed' }
    ],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 6.7 * 24 * 60 * 60 * 1000).toISOString()
  });

  // ===== ROLLBACK EXAMPLES =====

  // Rollback after incorrect approval
  mockLogs.push({
    id: 'mock_rollback_001',
    user_id: 1,
    user_name: 'Admin User',
    action: 'rollback',
    resource_type: 'sitio',
    resource_id: 15,
    resource_name: 'Sitio Maligaya, Brgy. San Isidro',
    details:
      'Rolled back incorrect population update from March 2025. Data was based on preliminary estimates, not final census',
    changes: [
      { field: 'totalPopulation', oldValue: 850, newValue: 720 },
      { field: 'totalHouseholds', oldValue: 210, newValue: 180 },
      { field: 'povertyRate', oldValue: 28.5, newValue: 32.1 }
    ],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
  });

  // Project rollback
  mockLogs.push({
    id: 'mock_rollback_002',
    user_id: 1,
    user_name: 'Admin User',
    action: 'rollback',
    resource_type: 'project',
    resource_id: 8,
    resource_name: 'Water System Installation - Phase 2',
    details:
      'Reverted accidental project completion marking. Project still has pending inspections',
    changes: [
      { field: 'status', oldValue: 'completed', newValue: 'ongoing' },
      { field: 'completionPercentage', oldValue: 100, newValue: 75 },
      { field: 'completedAt', oldValue: '2026-01-04T10:30:00Z', newValue: null }
    ],
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  });

  // ===== REGULAR OPERATIONS =====

  // Login activities
  mockLogs.push(
    {
      id: 'mock_login_001',
      user_id: 1,
      user_name: 'Admin User',
      action: 'login',
      resource_type: 'system',
      details: 'Successful login',
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_login_002',
      user_id: 4,
      user_name: 'Pedro Reyes',
      action: 'login',
      resource_type: 'system',
      details: 'Successful login',
      ip_address: '192.168.1.115',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_login_003',
      user_id: 5,
      user_name: 'Ana Garcia',
      action: 'login',
      resource_type: 'system',
      details: 'Successful login',
      ip_address: '192.168.1.116',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    }
  );

  // Create operations
  mockLogs.push(
    {
      id: 'mock_create_001',
      user_id: 2,
      user_name: 'Maria Santos',
      action: 'create',
      resource_type: 'sitio',
      resource_id: 45,
      resource_name: 'Sitio New Dawn, Brgy. Esperanza',
      details: 'Created new sitio profile with initial demographic data',
      ip_address: '192.168.1.105',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_create_002',
      user_id: 1,
      user_name: 'Admin User',
      action: 'create',
      resource_type: 'project',
      resource_id: 28,
      resource_name: 'Community Health Center Construction',
      details: 'Created new project targeting 3 barangays',
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
    }
  );

  // Update operations (direct admin updates, not through approval workflow)
  mockLogs.push(
    {
      id: 'mock_update_001',
      user_id: 1,
      user_name: 'Admin User',
      action: 'update',
      resource_type: 'sitio',
      resource_id: 7,
      resource_name: 'Sitio Riverside, Brgy. Poblacion',
      details: 'Updated hazard vulnerability assessment based on DRRM report',
      changes: [
        { field: 'floodRisk', oldValue: 'Low', newValue: 'Moderate' },
        { field: 'landslideRisk', oldValue: 'Moderate', newValue: 'High' },
        { field: 'lastAssessmentDate', oldValue: '2024-06-15', newValue: '2025-12-20' }
      ],
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_update_002',
      user_id: 2,
      user_name: 'Maria Santos',
      action: 'update',
      resource_type: 'project',
      resource_id: 12,
      resource_name: 'Farm-to-Market Road Rehabilitation',
      details: 'Updated project budget allocation after procurement',
      changes: [
        { field: 'budget', oldValue: 2500000, newValue: 2350000 },
        { field: 'fundingSource', oldValue: 'Provincial', newValue: 'Provincial + LGU' }
      ],
      ip_address: '192.168.1.105',
      timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  );

  // View operations (for sensitive data tracking)
  mockLogs.push({
    id: 'mock_view_001',
    user_id: 3,
    user_name: 'Juan Dela Cruz',
    action: 'view',
    resource_type: 'report',
    resource_name: 'Detailed Poverty Analysis - All Sitios',
    details: 'Accessed comprehensive poverty data report',
    ip_address: '192.168.1.110',
    timestamp: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Export operations
  mockLogs.push(
    {
      id: 'mock_export_001',
      user_id: 1,
      user_name: 'Admin User',
      action: 'export',
      resource_type: 'report',
      resource_name: 'Q4 2025 Vulnerability Assessment',
      details: 'Exported comprehensive assessment report as PDF',
      ip_address: '192.168.1.100',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_export_002',
      user_id: 2,
      user_name: 'Maria Santos',
      action: 'export',
      resource_type: 'sitio',
      resource_name: 'Sitio Demographics - Municipality of Koronadal',
      details: 'Exported sitio data for 12 barangays as CSV',
      ip_address: '192.168.1.105',
      timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  );

  // Import operations
  mockLogs.push({
    id: 'mock_import_001',
    user_id: 1,
    user_name: 'Admin User',
    action: 'import',
    resource_type: 'sitio',
    details: 'Imported 45 sitio records from 2025 census CSV file',
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Delete operations
  mockLogs.push({
    id: 'mock_delete_001',
    user_id: 1,
    user_name: 'Admin User',
    action: 'delete',
    resource_type: 'sitio',
    resource_id: 99,
    resource_name: 'Sitio Duplicate Entry, Brgy. Test',
    details: 'Deleted duplicate sitio entry created by mistake',
    ip_address: '192.168.1.100',
    timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Logout activities
  mockLogs.push(
    {
      id: 'mock_logout_001',
      user_id: 5,
      user_name: 'Ana Garcia',
      action: 'logout',
      resource_type: 'system',
      details: 'User logged out',
      ip_address: '192.168.1.116',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_logout_002',
      user_id: 4,
      user_name: 'Pedro Reyes',
      action: 'logout',
      resource_type: 'system',
      details: 'User logged out',
      ip_address: '192.168.1.115',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
    }
  );

  // Sort by timestamp (oldest first) for logical order
  mockLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  saveAuditLogs(mockLogs);
}
