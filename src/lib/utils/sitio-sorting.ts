/**
 * Sitio Sorting Utilities
 * Provides multi-sort functionality and URL state management for sitio lists.
 */

import {
  INDICATORS_MAP,
  SORT_PRESETS,
  type SitioIndicator,
  type SortPreset
} from '$lib/config/sitio-indicators';
import type { SitioProfile } from '$lib/types/sitio-profile';
import type { SitioRecord } from '$lib/types/sitio-storage';

// ==========================================
// SORT CONFIGURATION TYPES
// ==========================================

export interface SortConfig {
  /** Indicator key */
  key: string;
  /** Sort direction */
  order: 'asc' | 'desc';
}

export interface FilterConfig {
  /** Text search query */
  searchQuery: string;
  /** Municipality filter */
  municipality: string;
  /** Barangay filter */
  barangay: string;
  /** Classification filters */
  classifications: {
    gida: boolean | null;
    indigenous: boolean | null;
    conflict: boolean | null;
  };
}

export interface SitioListConfig {
  /** Selected sort indicators (max 5, first = primary) */
  sortIndicators: SortConfig[];
  /** Filter configuration */
  filters: FilterConfig;
  /** Selected year for data */
  year: string;
}

// ==========================================
// DEFAULT CONFIGURATION
// ==========================================

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  searchQuery: '',
  municipality: 'all',
  barangay: 'all',
  classifications: {
    gida: null,
    indigenous: null,
    conflict: null
  }
};

export const DEFAULT_SORT_CONFIG: SortConfig[] = [];

export const DEFAULT_LIST_CONFIG: SitioListConfig = {
  sortIndicators: DEFAULT_SORT_CONFIG,
  filters: DEFAULT_FILTER_CONFIG,
  year: 'latest'
};

export const MAX_SORT_INDICATORS = 5;

// ==========================================
// URL PARAMETER HANDLING
// ==========================================

/**
 * Parse sort indicators from URL search params
 * Format: sort=key1:asc,key2:desc
 */
export function parseSortFromURL(searchParams: URLSearchParams): SortConfig[] {
  const sortParam = searchParams.get('sort');
  if (!sortParam) return DEFAULT_SORT_CONFIG;

  const configs: SortConfig[] = [];
  const parts = sortParam.split(',');

  for (const part of parts) {
    const [key, order] = part.split(':');
    if (key && INDICATORS_MAP.has(key)) {
      configs.push({
        key,
        order: order === 'asc' ? 'asc' : 'desc'
      });
    }
    if (configs.length >= MAX_SORT_INDICATORS) break;
  }

  return configs.length > 0 ? configs : DEFAULT_SORT_CONFIG;
}

/**
 * Parse filter config from URL search params
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): FilterConfig {
  return {
    searchQuery: searchParams.get('q') || '',
    municipality: searchParams.get('municipality') || 'all',
    barangay: searchParams.get('barangay') || 'all',
    classifications: {
      gida: parseTriState(searchParams.get('gida')),
      indigenous: parseTriState(searchParams.get('indigenous')),
      conflict: parseTriState(searchParams.get('conflict'))
    }
  };
}

/**
 * Parse full list config from URL
 */
export function parseListConfigFromURL(searchParams: URLSearchParams): SitioListConfig {
  return {
    sortIndicators: parseSortFromURL(searchParams),
    filters: parseFiltersFromURL(searchParams),
    year: searchParams.get('year') || 'latest'
  };
}

/**
 * Serialize sort config to URL param
 */
export function serializeSortToURL(sortConfigs: SortConfig[]): string {
  return sortConfigs.map((c) => `${c.key}:${c.order}`).join(',');
}

/**
 * Serialize full config to URL search params
 */
export function serializeConfigToURL(config: SitioListConfig): URLSearchParams {
  const params = new URLSearchParams();

  // Sort indicators
  if (config.sortIndicators.length > 0) {
    params.set('sort', serializeSortToURL(config.sortIndicators));
  }

  // Filters
  if (config.filters.searchQuery) {
    params.set('q', config.filters.searchQuery);
  }
  if (config.filters.municipality !== 'all') {
    params.set('municipality', config.filters.municipality);
  }
  if (config.filters.barangay !== 'all') {
    params.set('barangay', config.filters.barangay);
  }

  // Classification filters
  if (config.filters.classifications.gida !== null) {
    params.set('gida', config.filters.classifications.gida ? '1' : '0');
  }
  if (config.filters.classifications.indigenous !== null) {
    params.set('indigenous', config.filters.classifications.indigenous ? '1' : '0');
  }
  if (config.filters.classifications.conflict !== null) {
    params.set('conflict', config.filters.classifications.conflict ? '1' : '0');
  }

  // Year
  if (config.year !== 'latest') {
    params.set('year', config.year);
  }

  return params;
}

/**
 * Build URL with config params
 */
export function buildURLWithConfig(basePath: string, config: SitioListConfig): string {
  const params = serializeConfigToURL(config);
  const paramStr = params.toString();
  return paramStr ? `${basePath}?${paramStr}` : basePath;
}

// Helper to parse tri-state boolean from URL
function parseTriState(value: string | null): boolean | null {
  if (value === '1') return true;
  if (value === '0') return false;
  return null;
}

// ==========================================
// SORTING FUNCTIONS
// ==========================================

export interface SitioWithProfile extends SitioRecord {
  /** The profile data for the selected year */
  profile: SitioProfile;
  /** Computed indicator values cache */
  indicatorValues: Map<string, number>;
  /** Cached project count for this sitio */
  _projectCount: number;
  /** Cached latest project date timestamp for this sitio */
  _latestProjectDate: number;
}

/**
 * Prepare sitios with profile data for the selected year
 */
export function prepareSitiosForSort(sitios: SitioRecord[], year: string): SitioWithProfile[] {
  // Load projects for counting
  let projects: Array<{ sitioIds?: number[] }> = [];
  try {
    // Dynamically import project storage to avoid circular dependencies
    const projectsData = localStorage.getItem('sccdp_projects');
    if (projectsData) {
      projects = JSON.parse(projectsData);
    }
  } catch (error) {
    console.warn('Failed to load projects for sorting:', error);
  }

  return sitios
    .map((sitio) => {
      // Get the year to use
      const targetYear =
        year === 'latest' || year === 'all'
          ? sitio.availableYears.length > 0
            ? Math.max(...sitio.availableYears).toString()
            : null
          : year;

      if (!targetYear || !sitio.yearlyData[targetYear]) {
        return null;
      }

      const profile = sitio.yearlyData[targetYear];
      const indicatorValues = new Map<string, number>();

      // Calculate project count and latest project date for extendedAccessor
      const sitioProjects = projects.filter((p) => p.sitioIds && p.sitioIds.includes(sitio.id));
      const projectCount = sitioProjects.length;

      // Find the most recent project date
      let latestProjectDate = 0;
      sitioProjects.forEach((p: any) => {
        if (p.projectDate) {
          const timestamp = new Date(p.projectDate).getTime();
          if (timestamp > latestProjectDate) {
            latestProjectDate = timestamp;
          }
        }
      });

      return {
        ...sitio,
        profile,
        indicatorValues,
        _projectCount: projectCount,
        _latestProjectDate: latestProjectDate
      };
    })
    .filter((s): s is SitioWithProfile => s !== null);
}

/**
 * Get indicator value for a sitio, with caching
 */
function getIndicatorValue(sitio: SitioWithProfile, indicator: SitioIndicator): number {
  // Check cache
  if (sitio.indicatorValues.has(indicator.key)) {
    return sitio.indicatorValues.get(indicator.key)!;
  }

  // Compute and cache
  // Use extendedAccessor if available, otherwise use regular accessor
  const value = indicator.extendedAccessor
    ? indicator.extendedAccessor(sitio, sitio.profile)
    : indicator.accessor(sitio.profile);
  sitio.indicatorValues.set(indicator.key, value);
  return value;
}

/**
 * Multi-sort sitios by selected indicators
 * First indicator is primary, subsequent are tie-breakers
 */
export function multiSortSitios(
  sitios: SitioWithProfile[],
  sortConfigs: SortConfig[]
): SitioWithProfile[] {
  if (sortConfigs.length === 0) return sitios;

  // Build comparators
  const comparators = sortConfigs
    .map((config) => {
      const indicator = INDICATORS_MAP.get(config.key);
      if (!indicator) return null;
      return { indicator, order: config.order };
    })
    .filter((c): c is { indicator: SitioIndicator; order: 'asc' | 'desc' } => c !== null);

  if (comparators.length === 0) return sitios;

  return [...sitios].sort((a, b) => {
    for (const { indicator, order } of comparators) {
      const valueA = getIndicatorValue(a, indicator);
      const valueB = getIndicatorValue(b, indicator);

      if (valueA !== valueB) {
        const diff = valueA - valueB;
        return order === 'asc' ? diff : -diff;
      }
    }
    // Final tie-breaker: sitio name
    return a.sitioName.localeCompare(b.sitioName);
  });
}

// ==========================================
// FILTERING FUNCTIONS
// ==========================================

/**
 * Apply filters to sitios
 */
export function filterSitios(
  sitios: SitioWithProfile[],
  filters: FilterConfig
): SitioWithProfile[] {
  return sitios.filter((sitio) => {
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
        sitio.sitioName.toLowerCase().includes(query) ||
        sitio.barangay.toLowerCase().includes(query) ||
        sitio.municipality.toLowerCase().includes(query) ||
        sitio.coding.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Municipality filter
    if (filters.municipality !== 'all' && sitio.municipality !== filters.municipality) {
      return false;
    }

    // Barangay filter
    if (filters.barangay !== 'all' && sitio.barangay !== filters.barangay) {
      return false;
    }

    // Classification filters
    const { gida, indigenous, conflict } = filters.classifications;

    if (gida !== null && sitio.sitioClassification.gida !== gida) {
      return false;
    }
    if (indigenous !== null && sitio.sitioClassification.indigenous !== indigenous) {
      return false;
    }
    if (conflict !== null && sitio.sitioClassification.conflict !== conflict) {
      return false;
    }

    return true;
  });
}

/**
 * Full pipeline: prepare, filter, sort sitios
 */
export function processSitios(sitios: SitioRecord[], config: SitioListConfig): SitioWithProfile[] {
  // Prepare with profile data
  let processed = prepareSitiosForSort(sitios, config.year);

  // Apply filters
  processed = filterSitios(processed, config.filters);

  // Apply multi-sort
  processed = multiSortSitios(processed, config.sortIndicators);

  return processed;
}

// ==========================================
// PRESET UTILITIES
// ==========================================

/**
 * Get sort config from preset
 */
export function getSortPreset(presetKey: string): SortPreset | undefined {
  return SORT_PRESETS.find((p) => p.key === presetKey);
}

/**
 * Apply preset to config
 */
export function applyPreset(config: SitioListConfig, presetKey: string): SitioListConfig {
  const preset = getSortPreset(presetKey);
  if (!preset) return config;

  return {
    ...config,
    sortIndicators: preset.indicators
  };
}

// ==========================================
// DISPLAY UTILITIES
// ==========================================

/**
 * Get display values for selected indicators
 */
export function getIndicatorDisplayValues(
  sitio: SitioWithProfile,
  indicatorKeys: string[]
): Array<{ key: string; label: string; value: string; rawValue: number }> {
  return indicatorKeys
    .map((key) => {
      const indicator = INDICATORS_MAP.get(key);
      if (!indicator) return null;

      const rawValue = getIndicatorValue(sitio, indicator);
      const value = indicator.format(rawValue, sitio.profile);

      return {
        key: indicator.key,
        label: indicator.shortLabel,
        value,
        rawValue
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

/**
 * Check if config has active filters
 */
export function hasActiveFilters(config: SitioListConfig): boolean {
  const { filters, sortIndicators } = config;

  return (
    filters.searchQuery !== '' ||
    filters.municipality !== 'all' ||
    filters.barangay !== 'all' ||
    filters.classifications.gida !== null ||
    filters.classifications.indigenous !== null ||
    filters.classifications.conflict !== null ||
    sortIndicators.length > 1 ||
    (sortIndicators.length === 1 && sortIndicators[0].key !== 'totalPopulation')
  );
}

/**
 * Reset config to defaults
 */
export function resetConfig(): SitioListConfig {
  return { ...DEFAULT_LIST_CONFIG };
}
