import type { ChartDataItem } from './audit.js';
import type { PriorityLevel } from './recommendations.js';

// ==========================================
// DASHBOARD & STATISTICS TYPES
// ==========================================

/**
 * Filter Context for Sitio Dashboard
 */
export interface SitioFilterContext {
  municipality?: string;
  barangay?: string;
  needLevel?: PriorityLevel;
  classification?: {
    gida?: boolean;
    indigenous?: boolean;
    conflict?: boolean;
  };
}

/**
 * Aggregate Dashboard Data
 */
export interface SitioDashboardData {
  /** Current filter context */
  filters: SitioFilterContext;

  /** Quick statistics */
  stats: {
    totalSitios: number;
    totalPopulation: number;
    totalHouseholds: number;
    avgNeedScore: number;
    electrificationRate: number;
    toiletAccessRate: number;
  };

  /** Chart data */
  charts: {
    needLevelDistribution: ChartDataItem[];
    demographicsOverview: ChartDataItem[];
    utilitiesCoverage: ChartDataItem[];
    infrastructureSummary: ChartDataItem[];
  };

  /** Sitio markers for map */
  sitioMarkers: Array<{
    id: string;
    sitioName: string;
    latitude: number;
    longitude: number;
    needLevel: PriorityLevel;
    needScore: number;
  }>;
}
