// ==========================================
// AUDIT LOG TYPES
// ==========================================

export type AuditAction =
	| 'login'
	| 'logout'
	| 'create'
	| 'update'
	| 'delete'
	| 'view'
	| 'export'
	| 'import';

export type AuditResourceType = 'user' | 'sitio' | 'system';

export interface AuditFieldChange {
	field: string;
	oldValue: unknown;
	newValue: unknown;
}

export interface AuditLog {
	id: string;
	user_id: number;
	user_name: string;
	action: AuditAction;
	resource_type: AuditResourceType;
	resource_id?: number | string;
	resource_name?: string;
	details?: string;
	changes?: AuditFieldChange[];
	ip_address?: string;
	timestamp: string;
}

export interface Activity {
	id: number;
	user: string;
	action: string;
	target: string;
	icon: string;
	timestamp: string;
}

export interface Stats {
	total_sitios: number;
	total_projects?: number;
	total_beneficiaries: number;
	average_completion?: number;
	municipalities?: number;
}

export interface ChartDataItem {
	category?: string;
	count: number;
	status?: string;
	municipality?: string;
	month?: string;
	completed?: number;
	label?: string;
	value?: number;
}
