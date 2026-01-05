import type {
  ConflictResolution,
  PendingChange,
  PendingChangeFilters,
  PendingChangeResourceType,
  PendingChangeSummary
} from '$lib/types/pending-changes';
import { nanoid } from 'nanoid';
import { logAuditAction } from './audit';

const PENDING_CHANGES_STORAGE_KEY = 'sccdp_pending_changes';
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Get current user from session
 */
function getCurrentUser(): { userId: number; userName: string } {
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
    // Use default
  }
  return { userId, userName };
}

/**
 * Load all pending changes from localStorage
 */
export function loadPendingChanges(): PendingChange[] {
  if (typeof window === 'undefined') return [];

  try {
    const json = localStorage.getItem(PENDING_CHANGES_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to load pending changes:', error);
    return [];
  }
}

/**
 * Save pending changes to localStorage with 2MB limit
 */
export function savePendingChanges(changes: PendingChange[]): boolean {
  try {
    const json = JSON.stringify(changes);
    if (json.length > MAX_STORAGE_SIZE) {
      console.error('Pending changes data exceeds storage limit (2MB)');
      return false;
    }
    localStorage.setItem(PENDING_CHANGES_STORAGE_KEY, json);
    return true;
  } catch (error) {
    console.error('Failed to save pending changes:', error);
    return false;
  }
}

/**
 * Generate a simple hash of data for conflict detection
 */
export function generateVersionHash(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Submit a change for review
 */
export function submitForReview(params: {
  resourceType: PendingChangeResourceType;
  resourceId: number;
  resourceName: string;
  originalData: unknown;
  proposedData: unknown;
  submitterComment?: string;
}): PendingChange | null {
  if (typeof window === 'undefined') return null;

  const { userId, userName } = getCurrentUser();
  const changes = loadPendingChanges();

  // Supersede any existing pending changes for the same resource
  for (const change of changes) {
    if (
      change.resourceType === params.resourceType &&
      change.resourceId === params.resourceId &&
      change.status === 'pending'
    ) {
      change.status = 'superseded';
    }
  }

  const newChange: PendingChange = {
    id: nanoid(),
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    resourceName: params.resourceName,
    status: 'pending',
    originalData: params.originalData,
    proposedData: params.proposedData,
    baseVersionHash: generateVersionHash(params.originalData),
    submittedBy: {
      userId,
      userName
    },
    submittedAt: new Date().toISOString(),
    submitterComment: params.submitterComment
  };

  changes.push(newChange);

  const success = savePendingChanges(changes);
  if (success) {
    logAuditAction(
      'submit_for_review',
      params.resourceType,
      params.resourceId,
      params.resourceName,
      params.submitterComment || 'Submitted change for review'
    );
    return newChange;
  }

  return null;
}

/**
 * Get pending changes with optional filters
 */
export function getPendingChanges(filters?: PendingChangeFilters): PendingChange[] {
  let changes = loadPendingChanges();

  if (filters) {
    if (filters.status) {
      changes = changes.filter((c) => c.status === filters.status);
    }
    if (filters.resourceType) {
      changes = changes.filter((c) => c.resourceType === filters.resourceType);
    }
    if (filters.submittedByUserId !== undefined) {
      changes = changes.filter((c) => c.submittedBy.userId === filters.submittedByUserId);
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      changes = changes.filter((c) => new Date(c.submittedAt) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      changes = changes.filter((c) => new Date(c.submittedAt) <= endDate);
    }
  }

  // Sort by submittedAt descending (newest first)
  changes.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return changes;
}

/**
 * Get a pending change by ID
 */
export function getPendingChangeById(id: string): PendingChange | null {
  const changes = loadPendingChanges();
  return changes.find((c) => c.id === id) || null;
}

/**
 * Get current live data for a resource (for conflict detection)
 * This is a helper that should be extended based on resource type
 */
function getCurrentLiveData(
  resourceType: PendingChangeResourceType,
  resourceId: number
): unknown | null {
  try {
    if (resourceType === 'sitio') {
      const sitiosJson = localStorage.getItem('sccdp_sitios');
      if (sitiosJson) {
        const sitios = JSON.parse(sitiosJson);
        return sitios.find((s: { coding: number }) => s.coding === resourceId) || null;
      }
    } else if (resourceType === 'project') {
      const projectsJson = localStorage.getItem('sccdp_projects');
      if (projectsJson) {
        const projects = JSON.parse(projectsJson);
        return projects.find((p: { id: number }) => p.id === resourceId) || null;
      }
    }
  } catch (error) {
    console.error('Failed to get current live data:', error);
  }
  return null;
}

/**
 * Approve a pending change
 */
export function approveChange(
  changeId: string,
  reviewerComment?: string
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser environment' };

  const changes = loadPendingChanges();
  const changeIndex = changes.findIndex((c) => c.id === changeId);

  if (changeIndex === -1) {
    return { success: false, error: 'Change not found' };
  }

  const change = changes[changeIndex];

  if (change.status !== 'pending') {
    return { success: false, error: `Cannot approve change with status: ${change.status}` };
  }

  const { userId, userName } = getCurrentUser();

  // Verify reviewer is not the submitter
  if (userId === change.submittedBy.userId) {
    return { success: false, error: 'Cannot approve your own change submission' };
  }

  // Check for conflicts
  const currentLiveData = getCurrentLiveData(change.resourceType, change.resourceId);
  if (currentLiveData) {
    const currentHash = generateVersionHash(currentLiveData);
    if (currentHash !== change.baseVersionHash) {
      // Conflict detected
      change.status = 'conflict';
      change.conflictDetails = [
        {
          field: 'data',
          currentValue: currentLiveData,
          proposedValue: change.proposedData
        }
      ];
      savePendingChanges(changes);

      logAuditAction(
        'update',
        change.resourceType,
        change.resourceId,
        change.resourceName,
        'Conflict detected during approval - data has been modified since submission'
      );

      return {
        success: false,
        error: 'Conflict detected: The resource has been modified since this change was submitted'
      };
    }
  }

  // Approve the change
  change.status = 'approved';
  change.reviewedBy = { userId, userName };
  change.reviewedAt = new Date().toISOString();
  change.reviewerComment = reviewerComment;

  const success = savePendingChanges(changes);
  if (success) {
    logAuditAction(
      'approve',
      change.resourceType,
      change.resourceId,
      change.resourceName,
      reviewerComment || 'Approved pending change'
    );
    return { success: true };
  }

  return { success: false, error: 'Failed to save changes' };
}

/**
 * Reject a pending change
 */
export function rejectChange(
  changeId: string,
  reviewerComment?: string
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser environment' };

  const changes = loadPendingChanges();
  const changeIndex = changes.findIndex((c) => c.id === changeId);

  if (changeIndex === -1) {
    return { success: false, error: 'Change not found' };
  }

  const change = changes[changeIndex];

  if (change.status !== 'pending' && change.status !== 'conflict') {
    return { success: false, error: `Cannot reject change with status: ${change.status}` };
  }

  const { userId, userName } = getCurrentUser();

  // Reject the change
  change.status = 'rejected';
  change.reviewedBy = { userId, userName };
  change.reviewedAt = new Date().toISOString();
  change.reviewerComment = reviewerComment;

  const success = savePendingChanges(changes);
  if (success) {
    logAuditAction(
      'reject',
      change.resourceType,
      change.resourceId,
      change.resourceName,
      reviewerComment || 'Rejected pending change'
    );
    return { success: true };
  }

  return { success: false, error: 'Failed to save changes' };
}

/**
 * Resolve a conflict in a pending change
 */
export function resolveConflict(
  changeId: string,
  resolution: ConflictResolution,
  mergedData?: unknown
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser environment' };

  const changes = loadPendingChanges();
  const changeIndex = changes.findIndex((c) => c.id === changeId);

  if (changeIndex === -1) {
    return { success: false, error: 'Change not found' };
  }

  const change = changes[changeIndex];

  if (change.status !== 'conflict') {
    return { success: false, error: 'Change does not have a conflict to resolve' };
  }

  const { userId, userName } = getCurrentUser();

  switch (resolution) {
    case 'apply_proposed':
      // Apply proposed data anyway
      change.status = 'approved';
      change.reviewedBy = { userId, userName };
      change.reviewedAt = new Date().toISOString();
      change.reviewerComment = 'Conflict resolved: Applied proposed changes';
      break;

    case 'discard':
      // Discard the change
      change.status = 'rejected';
      change.reviewedBy = { userId, userName };
      change.reviewedAt = new Date().toISOString();
      change.reviewerComment = 'Conflict resolved: Discarded proposed changes';
      break;

    case 'manual_merge':
      if (mergedData === undefined) {
        return { success: false, error: 'Merged data required for manual merge resolution' };
      }
      // Apply merged data
      change.proposedData = mergedData;
      change.status = 'approved';
      change.reviewedBy = { userId, userName };
      change.reviewedAt = new Date().toISOString();
      change.reviewerComment = 'Conflict resolved: Applied manually merged changes';
      break;

    default:
      return { success: false, error: 'Invalid resolution strategy' };
  }

  // Clear conflict details after resolution
  change.conflictDetails = undefined;

  const success = savePendingChanges(changes);
  if (success) {
    logAuditAction(
      'resolve_conflict',
      change.resourceType,
      change.resourceId,
      change.resourceName,
      `Conflict resolved using strategy: ${resolution}`
    );
    return { success: true };
  }

  return { success: false, error: 'Failed to save changes' };
}

/**
 * Get summary statistics for pending changes
 */
export function getPendingChangeSummary(): PendingChangeSummary {
  const changes = loadPendingChanges();

  return {
    pending: changes.filter((c) => c.status === 'pending').length,
    approved: changes.filter((c) => c.status === 'approved').length,
    rejected: changes.filter((c) => c.status === 'rejected').length,
    conflict: changes.filter((c) => c.status === 'conflict').length
  };
}

/**
 * Check if there are any pending changes for a specific resource
 */
export function hasPendingChangesForResource(
  resourceType: PendingChangeResourceType,
  resourceId: number
): boolean {
  const changes = loadPendingChanges();
  return changes.some(
    (c) =>
      c.resourceType === resourceType &&
      c.resourceId === resourceId &&
      (c.status === 'pending' || c.status === 'conflict')
  );
}
