// ==========================================
// REPORT GENERATION TYPES
// ==========================================

/**
 * Report types available in the system
 */
export type ReportType = 'aggregate' | 'comparative' | 'sitio-profile';

/**
 * Report sections that can be included
 */
export type ReportSection =
  | 'overview'
  | 'demographics'
  | 'utilities'
  | 'facilities'
  | 'infrastructure'
  | 'livelihood'
  | 'safety'
  | 'priorities';

/**
 * Chart types that can be embedded in reports
 */
export type ReportChartType =
  | 'demographics-gender'
  | 'demographics-age'
  | 'demographics-vulnerable'
  | 'utilities-coverage'
  | 'utilities-electricity-sources'
  | 'utilities-mobile-signal'
  | 'facilities-existence'
  | 'facilities-condition'
  | 'infrastructure-roads'
  | 'infrastructure-water'
  | 'livelihood-workers'
  | 'livelihood-income'
  | 'safety-hazards'
  | 'safety-food-security'
  | 'priorities-scores';

/**
 * Geographic filter options for reports
 */
export interface ReportFilters {
  /** Primary year for the report data (treated as "as of [year]") */
  year: number;
  /** Filter by municipality (optional) */
  municipality?: string;
  /** Filter by barangay (optional, requires municipality) */
  barangay?: string;
  /** Filter by specific sitio coding (optional, requires municipality and barangay) */
  sitioCoding?: string;
}

/**
 * Chart image data for embedding in PDF
 */
export interface ReportChartImage {
  type: ReportChartType;
  title: string;
  imageBase64: string;
  width?: number;
}

/**
 * Main report configuration
 */
export interface ReportConfig {
  /** Type of report to generate */
  type: ReportType;
  /** Report title (auto-generated if not provided) */
  title?: string;
  /** Sections to include in the report */
  sections: ReportSection[];
  /** Geographic and time filters */
  filters: ReportFilters;
  /** Whether to include charts in the report */
  includeCharts: boolean;
  /** Chart images to embed (populated during generation) */
  chartImages?: ReportChartImage[];
  /** Whether to include year-over-year trend comparisons */
  includeTrends: boolean;
}

/**
 * Report generation progress state
 */
export interface ReportGenerationState {
  isGenerating: boolean;
  currentStep: string;
  progress: number; // 0-100
  error?: string;
}

/**
 * Report metadata for audit logging
 */
export interface ReportMetadata {
  reportType: ReportType;
  sections: ReportSection[];
  filters: ReportFilters;
  sitioCount: number;
  generatedAt: string;
  generatedBy: string;
}

/**
 * Section display names for UI
 */
export const SECTION_LABELS: Record<ReportSection, string> = {
  overview: 'Overview & Summary',
  demographics: 'Demographics & Population',
  utilities: 'Utilities & Connectivity',
  facilities: 'Community Facilities',
  infrastructure: 'Roads & Infrastructure',
  livelihood: 'Livelihood & Agriculture',
  safety: 'Safety & Risk Context',
  priorities: 'Priority Interventions'
};

/**
 * Section descriptions for UI
 */
export const SECTION_DESCRIPTIONS: Record<ReportSection, string> = {
  overview: 'Key statistics, sitio counts, and geographic coverage',
  demographics: 'Population breakdown, gender distribution, vulnerable groups',
  utilities: 'Electricity, water, internet access, and mobile signal coverage',
  facilities: 'Health centers, schools, markets, and facility conditions',
  infrastructure: 'Road types, conditions, water sources, and sanitation',
  livelihood: 'Worker distribution, income levels, agriculture, and crops',
  safety: 'Natural hazards, food security, and risk factors',
  priorities: 'Community priority needs and intervention urgency scores'
};

/**
 * Default report configuration
 */
export const DEFAULT_REPORT_CONFIG: Omit<ReportConfig, 'filters'> = {
  type: 'aggregate',
  sections: [
    'overview',
    'demographics',
    'utilities',
    'facilities',
    'infrastructure',
    'livelihood',
    'safety',
    'priorities'
  ],
  includeCharts: true,
  includeTrends: true
};
