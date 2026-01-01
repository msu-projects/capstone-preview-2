// ==========================================
// CENTRALIZED TYPE RE-EXPORTS
// ==========================================
// This file serves as the main entry point for all type definitions
// All types are organized into separate files by domain

// Sitio Profile Types
export type {
	FacilityDetails,
	HazardDetails,
	PriorityItem,
	PriorityName,
	PriorityRating,
	RoadDetails,
	SitioProfile,
	WaterSourceStatus
} from './sitio-profile';

// Sitio Storage & Multi-year Data
export type {
	LocalStorageSchema,
	SitioCoreIdentifier,
	SitioEditMode,
	SitioRecord
} from './sitio-storage';

// Progress Tracking Types
export type { InfrastructureProgress, ProgressMetric, ProgressReport } from './progress-tracking';

// User Management & Authentication
export type { ResourcePermissions, User, UserPermissions, UserRole } from './user-auth';

// Audit Logs & Activity Tracking
export type {
	Activity,
	AuditAction,
	AuditFieldChange,
	AuditLog,
	AuditResourceType,
	ChartDataItem,
	Stats
} from './audit';

// Project Recommendation System
export type {
	CriterionResult,
	InfrastructureProjectType,
	NeedLevel,
	PPARecommendation,
	PPAType,
	PriorityLevel,
	ServiceProjectType
} from './recommendations';

export { getPriorityLevel } from '$lib/recommendation';

// Dashboard & Statistics
export type { SitioDashboardData, SitioFilterContext } from './dashboard';
