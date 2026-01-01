import type { AuditAction, AuditResourceType, User, UserPermissions } from '$lib/types';
import { logAuditAction } from '$lib/utils/audit';
import { loadUsers } from '$lib/utils/user-storage';

const AUTH_SESSION_KEY = 'sccdp_auth_session';

// Auth state using Svelte 5 runes
let currentUser = $state<User | null>(null);

// Derived states
const isAuthenticated = $derived(currentUser !== null);
const isSuperadmin = $derived(currentUser?.role === 'superadmin');
const isAdmin = $derived(currentUser?.role === 'admin' || currentUser?.role === 'superadmin');
const isViewer = $derived(currentUser?.role === 'viewer');

// Initialize from session storage on module load
function initializeFromSession(): void {
	if (typeof window === 'undefined') return;

	try {
		const sessionData = localStorage.getItem(AUTH_SESSION_KEY);
		if (sessionData) {
			const session = JSON.parse(sessionData);
			// Validate session (simple timestamp check - 24 hours)
			if (session.expires && new Date(session.expires) > new Date()) {
				currentUser = session.user;
			} else {
				// Session expired
				localStorage.removeItem(AUTH_SESSION_KEY);
			}
		}
	} catch (error) {
		console.error('Failed to restore session:', error);
		localStorage.removeItem(AUTH_SESSION_KEY);
	}
}

// Login function
function login(email: string, password: string): { success: boolean; error?: string } {
	const users = loadUsers();
	const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

	if (!user) {
		return { success: false, error: 'User not found' };
	}

	if (!user.is_active) {
		return { success: false, error: 'Account is deactivated' };
	}

	// For prototype, plain text comparison
	if (user.password_hash !== password) {
		return { success: false, error: 'Invalid password' };
	}

	// Set current user
	currentUser = {
		...user,
		last_login: new Date().toISOString()
	};

	// Save session
	const session = {
		user: currentUser,
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
	};
	localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

	// Log audit action
	logAuditAction('login', 'system', undefined, undefined, `User logged in: ${user.email}`);

	return { success: true };
}

// Logout function
function logout(): void {
	if (currentUser) {
		logAuditAction(
			'logout',
			'system',
			undefined,
			undefined,
			`User logged out: ${currentUser.email}`
		);
	}

	currentUser = null;
	localStorage.removeItem(AUTH_SESSION_KEY);
}

// Check permission
function hasPermission(
	resource: keyof UserPermissions,
	action: 'read' | 'write' | 'delete'
): boolean {
	if (!currentUser) return false;

	// Superadmin has all permissions
	if (currentUser.role === 'superadmin') return true;

	return currentUser.permissions[resource]?.[action] ?? false;
}

// Check if user can perform action (for UI conditional rendering)
function canPerform(resource: keyof UserPermissions, action: 'read' | 'write' | 'delete'): boolean {
	return hasPermission(resource, action);
}

// Log action helper (wraps audit utility with current user)
function logAction(
	action: AuditAction,
	resourceType: AuditResourceType,
	resourceId?: number | string,
	resourceName?: string,
	details?: string
): void {
	logAuditAction(action, resourceType, resourceId, resourceName, details);
}

// Export reactive getters and functions
export const authStore = {
	get currentUser() {
		return currentUser;
	},
	get isAuthenticated() {
		return isAuthenticated;
	},
	get isSuperadmin() {
		return isSuperadmin;
	},
	get isAdmin() {
		return isAdmin;
	},
	get isViewer() {
		return isViewer;
	},
	initialize: initializeFromSession,
	login,
	logout,
	hasPermission,
	canPerform,
	logAction
};
