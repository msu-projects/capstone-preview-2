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
