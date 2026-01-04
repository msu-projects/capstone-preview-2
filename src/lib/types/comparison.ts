/**
 * Comparison Feature Types
 *
 * Defines types for temporal, spatial, and aggregate comparisons
 * of sitio data across years, locations, and administrative levels.
 */

import type { YoYTrend } from '$lib/utils/sitio-chart-aggregation';
import type { SitioRecord } from './sitio-storage';

// ==========================================
// COMPARISON CONFIGURATION
// ==========================================

/**
 * Types of comparisons available
 * - temporal: Single sitio across multiple years
 * - spatial: Multiple sitios for the same year
 * - aggregate: Compare aggregated data between municipalities or barangays
 */
export type ComparisonType = 'temporal' | 'spatial' | 'aggregate';

/**
 * Aggregate level for comparison
 */
export type AggregateLevel = 'municipality' | 'barangay';

/**
 * Metric groups available for comparison
 */
export type ComparisonMetricGroup =
  | 'demographics'
  | 'utilities'
  | 'infrastructure'
  | 'facilities'
  | 'livelihood'
  | 'safety'
  | 'education'
  | 'customFields';

/**
 * Human-readable labels for metric groups
 */
export const METRIC_GROUP_LABELS: Record<ComparisonMetricGroup, string> = {
  demographics: 'Demographics & Population',
  utilities: 'Basic Utilities & Connectivity',
  infrastructure: 'Roads & Infrastructure',
  facilities: 'Community Facilities',
  livelihood: 'Livelihood & Agriculture',
  safety: 'Safety & Risk Context',
  education: 'Education Status',
  customFields: 'Custom Fields'
};

/**
 * Configuration for a comparison request
 */
export interface ComparisonConfig {
  /** Type of comparison */
  type: ComparisonType;

  /** Array of sitio IDs to compare (1 for temporal, 2-4 for spatial) */
  sitioIds: number[];

  /** Years to compare (multiple for temporal, 1 for spatial) */
  years: number[];

  /** Metric groups to include in comparison */
  metricGroups: ComparisonMetricGroup[];

  /** Aggregate level (only for aggregate type) */
  aggregateLevel?: AggregateLevel;

  /** Selected aggregate entities for comparison (municipality names or barangay names) */
  aggregateEntities?: string[];
}

/**
 * System-wide limits for comparisons (admin-configurable)
 */
export interface ComparisonLimits {
  /** Maximum number of sitios for spatial comparison */
  maxSitios: number;

  /** Maximum number of years for temporal comparison */
  maxYears: number;
}

/**
 * Default comparison limits
 */
export const DEFAULT_COMPARISON_LIMITS: ComparisonLimits = {
  maxSitios: 4,
  maxYears: 5
};

// ==========================================
// COMPARISON RESULTS
// ==========================================

/**
 * A single metric's comparison data
 */
export interface ComparisonMetricValue {
  /** Metric identifier */
  key: string;

  /** Human-readable label */
  label: string;

  /** Value for each comparison subject (sitio or year) */
  values: Array<{
    /** Subject identifier (sitio ID or year) */
    subjectId: string;

    /** Subject label (sitio name or year) */
    subjectLabel: string;

    /** The value */
    value: number | string | null;

    /** Formatted display value */
    displayValue: string;
  }>;

  /** Unit of measurement (%, km, count, etc.) */
  unit?: string;

  /** Format type for display */
  format?: 'number' | 'percent' | 'currency' | 'decimal';

  /** Higher values are better (for trend indicators) */
  higherIsBetter?: boolean;
}

/**
 * Comparison between two specific values with trend calculation
 */
export interface ComparisonDiff {
  /** Current/primary value */
  currentValue: number;

  /** Previous/comparison value */
  previousValue: number;

  /** Absolute change */
  change: number;

  /** Percentage change */
  changePercent: number;

  /** Trend indicator */
  trend: YoYTrend | null;

  /** Is this change positive (considering context) */
  isPositive: boolean;
}

/**
 * Result of a temporal comparison (single sitio across years)
 */
export interface TemporalComparisonResult {
  type: 'temporal';

  /** The sitio being compared */
  sitio: SitioRecord;

  /** Years being compared (sorted ascending) */
  years: number[];

  /** Metrics organized by group */
  metricsByGroup: Record<ComparisonMetricGroup, ComparisonMetricValue[]>;

  /** Year-over-year changes for each consecutive year pair */
  yearChanges: Array<{
    fromYear: number;
    toYear: number;
    changes: Record<string, ComparisonDiff>;
  }>;

  /** Overall trend from first to last year */
  overallTrend: Record<string, ComparisonDiff>;
}

/**
 * Result of a spatial comparison (multiple sitios for same year)
 */
export interface SpatialComparisonResult {
  type: 'spatial';

  /** Sitios being compared */
  sitios: SitioRecord[];

  /** The year being compared */
  year: number;

  /** Metrics organized by group */
  metricsByGroup: Record<ComparisonMetricGroup, ComparisonMetricValue[]>;

  /** Rankings for each metric (sitio ID -> rank) */
  rankings: Record<string, Record<number, number>>;

  /** Aggregate stats for context */
  aggregateStats: {
    min: Record<string, number>;
    max: Record<string, number>;
    average: Record<string, number>;
  };
}

/**
 * Aggregated entity data for aggregate comparison
 */
export interface AggregatedEntityData {
  /** Entity name (municipality or barangay name) */
  name: string;

  /** Total population across all sitios */
  totalPopulation: number;

  /** Total households */
  totalHouseholds: number;

  /** Number of sitios */
  sitioCount: number;

  /** Aggregated metrics */
  metrics: Record<string, number>;
}

/**
 * Result of an aggregate comparison (municipality vs municipality or barangay vs barangay)
 */
export interface AggregateComparisonResult {
  type: 'aggregate';

  /** Aggregate level used */
  aggregateLevel: AggregateLevel;

  /** The year being compared */
  year: number;

  /** Aggregated data for each entity */
  entities: AggregatedEntityData[];

  /** Metrics organized by group */
  metricsByGroup: Record<ComparisonMetricGroup, ComparisonMetricValue[]>;

  /** Rankings for each metric (entity name -> rank) */
  rankings: Record<string, Record<string, number>>;

  /** Aggregate stats for context */
  aggregateStats: {
    min: Record<string, number>;
    max: Record<string, number>;
    average: Record<string, number>;
  };
}

/**
 * Union type for all comparison results
 */
export type ComparisonResult =
  | TemporalComparisonResult
  | SpatialComparisonResult
  | AggregateComparisonResult;

// ==========================================
// CHART DATA TYPES FOR COMPARISONS
// ==========================================

/**
 * Data structure for comparison line charts (temporal)
 */
export interface ComparisonLineChartData {
  /** X-axis categories (years) */
  categories: string[];

  /** Series data */
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
}

/**
 * Data structure for comparison bar charts (spatial)
 */
export interface ComparisonBarChartData {
  /** Categories (sitio names or metric names) */
  categories: string[];

  /** Series data */
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
}

/**
 * Data structure for radar charts
 */
export interface ComparisonRadarChartData {
  /** Categories (metric names) */
  categories: string[];

  /** Series data for each subject */
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
}

// ==========================================
// URL SERIALIZATION
// ==========================================

/**
 * URL-serializable comparison config
 * Used for shareable comparison links
 */
export interface SerializedComparisonConfig {
  /** 't' for temporal, 's' for spatial, 'a' for aggregate */
  t: 't' | 's' | 'a';

  /** Sitio IDs (comma-separated) */
  s: string;

  /** Years (comma-separated) */
  y: string;

  /** Metric groups (comma-separated first letters) */
  m: string;

  /** Aggregate level (first letter) - 'm' for municipality, 'b' for barangay */
  al?: string;

  /** Aggregate entities (comma-separated) */
  ae?: string;
}

// ==========================================
// EXPORT TYPES
// ==========================================

/**
 * Configuration for comparison PDF export
 */
export interface ComparisonExportConfig {
  /** Include charts in export */
  includeCharts: boolean;

  /** Include detailed data tables */
  includeDetailedTables: boolean;

  /** Include trend analysis */
  includeTrendAnalysis: boolean;

  /** Report title override */
  title?: string;
}
