/**
 * Pending Changes / Approval Workflow Types
 *
 * This module defines types for managing a change approval workflow
 * where field workers submit changes that require admin review.
 */

/** Status of a pending change request */
export type PendingChangeStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'superseded'
  | 'conflict'
  | 'needs_revision';

/** Type of resource being modified */
export type PendingChangeResourceType = 'sitio' | 'project';

/** Action taken on a revision (for history tracking) */
export type RevisionAction =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'resubmitted';

/** A single entry in the revision history */
export interface RevisionHistoryEntry {
  /** Action taken */
  action: RevisionAction;
  /** Comment/reason for the action */
  comment?: string;
  /** ISO timestamp of when the action occurred */
  timestamp: string;
  /** User who performed the action */
  userId: number;
  userName: string;
}

/** A pending change request awaiting review */
export interface PendingChange {
  /** Unique identifier (nanoid generated) */
  id: string;
  /** Type of resource being modified */
  resourceType: PendingChangeResourceType;
  /** The sitio or project ID */
  resourceId: number;
  /** Display name of the resource */
  resourceName: string;
  /** Current status of the change request */
  status: PendingChangeStatus;
  /** Snapshot of data at time of submission */
  originalData: unknown;
  /** The proposed changes */
  proposedData: unknown;
  /** Hash of original data for conflict detection */
  baseVersionHash: string;
  /** User who submitted the change */
  submittedBy: {
    userId: number;
    userName: string;
  };
  /** ISO timestamp of submission */
  submittedAt: string;
  /** User who reviewed the change (filled on review) */
  reviewedBy?: {
    userId: number;
    userName: string;
  };
  /** ISO timestamp of review */
  reviewedAt?: string;
  /** Optional comment from submitter explaining the change */
  submitterComment?: string;
  /** Optional comment from reviewer explaining the decision */
  reviewerComment?: string;
  /** Details about conflicts when status is 'conflict' */
  conflictDetails?: {
    field: string;
    currentValue: unknown;
    proposedValue: unknown;
  }[];
  /** History of all revisions/reviews for this change */
  revisionHistory?: RevisionHistoryEntry[];
  /** Whether the submitter has seen the latest status change */
  statusChangeSeenBySubmitter?: boolean;
  /** For rejected resubmissions, link to the original submission */
  originalSubmissionId?: string;
  /** Number of times this change has been resubmitted */
  resubmitCount?: number;
}

/** Filters for querying pending changes */
export interface PendingChangeFilters {
  /** Filter by status */
  status?: PendingChangeStatus | PendingChangeStatus[];
  /** Filter by resource type */
  resourceType?: PendingChangeResourceType;
  /** Filter by submitter user ID */
  submittedByUserId?: number;
  /** Filter by start date (ISO string) */
  startDate?: string;
  /** Filter by end date (ISO string) */
  endDate?: string;
  /** Only get changes with unseen status updates */
  unseenOnly?: boolean;
}

/** Resolution strategy for handling conflicts */
export type ConflictResolution = 'apply_proposed' | 'discard' | 'manual_merge';

/** Summary statistics for pending changes dashboard */
export interface PendingChangeSummary {
  /** Number of pending changes */
  pending: number;
  /** Number of approved changes */
  approved: number;
  /** Number of rejected changes */
  rejected: number;
  /** Number of changes with conflicts */
  conflict: number;
  /** Number of changes needing revision */
  needsRevision: number;
  /** Number of superseded changes */
  superseded: number;
}
