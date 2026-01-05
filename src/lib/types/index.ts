// ==========================================
// CENTRALIZED TYPE RE-EXPORTS
// ==========================================
// This file serves as the main entry point for all type definitions
// All types are organized into separate files by domain

// Sitio Profile Types
export type {
  BackyardCropCategory,
  FacilityDetails,
  HazardDetails,
  PriorityItem,
  PriorityName,
  PriorityRating,
  RoadDetails,
  SitioProfile,
  WaterSourceStatus
} from './sitio-profile';

// Custom Field Types (Dynamic Form Builder)
export {
  AGGREGATION_TYPE_LABELS,
  CHART_TYPES_BY_DATA_TYPE,
  CHART_TYPE_LABELS,
  COLOR_SCHEME_LABELS,
  DATA_TYPE_LABELS,
  DEFAULT_AGGREGATION_TYPE,
  DEFAULT_GROUP_VALUES,
  DEFAULT_VALIDATION_RULES,
  DEFAULT_VISUALIZATION_CONFIG,
  DISPLAY_MODE_LABELS,
  GROUP_ICON_OPTIONS,
  generateFieldName,
  getApplicableAggregationTypes,
  getDefaultChartTypeForDataType,
  validateCustomFieldValue
} from './custom-fields';
export type {
  CustomFieldAggregationType,
  CustomFieldChartType,
  CustomFieldColorScheme,
  CustomFieldData,
  CustomFieldDataType,
  CustomFieldDefinition,
  CustomFieldDisplayMode,
  CustomFieldFormData,
  CustomFieldGroup,
  CustomFieldGroupFormData,
  CustomFieldValidationRules,
  CustomFieldVisualizationConfig
} from './custom-fields';

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

// Report Generation Types
export { DEFAULT_REPORT_CONFIG, SECTION_DESCRIPTIONS, SECTION_LABELS } from './report';
export type {
  ReportChartImage,
  ReportChartType,
  ReportConfig,
  ReportFilters,
  ReportGenerationState,
  ReportMetadata,
  ReportSection,
  ReportType
} from './report';

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

// Project Types
export type { Project, ProjectFormData, ProjectWithSitios } from './project';

// Comparison Types
export { DEFAULT_COMPARISON_LIMITS, METRIC_GROUP_LABELS } from './comparison';
export type {
  AggregateComparisonResult,
  AggregateLevel,
  AggregatedEntityData,
  ComparisonBarChartData,
  ComparisonConfig,
  ComparisonDiff,
  ComparisonExportConfig,
  ComparisonLimits,
  ComparisonLineChartData,
  ComparisonMetricGroup,
  ComparisonMetricValue,
  ComparisonRadarChartData,
  ComparisonResult,
  ComparisonType,
  SerializedComparisonConfig,
  SpatialComparisonResult,
  TemporalComparisonResult
} from './comparison';

// Pending Changes & Approval Workflow
export type {
  ConflictResolution,
  PendingChange,
  PendingChangeFilters,
  PendingChangeResourceType,
  PendingChangeStatus,
  PendingChangeSummary,
  RevisionAction,
  RevisionHistoryEntry
} from './pending-changes';
