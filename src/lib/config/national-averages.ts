import {
  CONFIG_STORAGE_KEYS,
  getConfigWithOverrides,
  hasConfigOverride,
  resetConfigToDefault,
  saveConfigOverride,
  type LaborEmploymentAveragesConfig,
  type NationalAveragesConfig
} from '$lib/utils/config-storage';

/**
 * Philippine National Averages - Default Values
 *
 * Reference data for utility access and infrastructure benchmarks
 * Used for comparison analytics across sitio profiles and dashboards
 */

const DEFAULT_NATIONAL_AVERAGES: NationalAveragesConfig = {
  electricity: {
    percent: 93.12,
    source: 'Department of Energy (DOE), 2024',
    url: 'https://www.pna.gov.ph/articles/1228482'
  },
  sanitaryToilet: {
    percent: 91.7,
    source: 'PSA 2020 Census of Population and Housing',
    url: 'https://psa.gov.ph/content/household-characteristics-2020-census-population-and-housing'
  },
  internet: {
    percent: 48.8,
    source: 'PSA/DICT 2024 NICTHS Survey',
    url: 'https://ptvnews.ph/psa-dict-record-spike-in-internet-connected-households-increased-online-access-among-filipino-populace/'
  },
  pavedRoads: {
    percent: 99.11,
    source: 'DPWH Atlas 2024',
    url: 'https://www.dpwh.gov.ph/dpwh/DPWH_ATLAS_2024/Road%20Data%202024/index.htm'
  },
  unpavedRoads: {
    percent: 0.89,
    source: 'DPWH Atlas 2024',
    url: 'https://www.dpwh.gov.ph/dpwh/DPWH_ATLAS_2024/Road%20Data%202024/index.htm'
  }
} as const;

/**
 * Philippine Labor & Employment Averages - Default Values
 *
 * Reference data for labor force participation, employment, and dependency metrics
 * Used for comparison analytics across sitio profiles and dashboards
 *
 * Sources:
 * - Philippine Statistics Authority (PSA) Labor Force Survey
 * - World Bank Age Dependency Ratio Data
 * - Trading Economics Philippines Economic Indicators
 */
const DEFAULT_LABOR_EMPLOYMENT_AVERAGES: LaborEmploymentAveragesConfig = {
  /**
   * Unemployment Rate
   * Note: This is a target value, not an average
   */
  unemploymentRate: {
    target: true,
    percent: 4.1,
    source: 'Philippine Statistics Authority (PSA), October 2024',
    url: 'https://tradingeconomics.com/philippines/unemployment-rate',
    description: 'Current unemployment rate in the Philippines'
  },

  /**
   * Age Dependency Ratio (Total)
   * Ratio of dependents (0-14 and 65+) to working-age population (15-64)
   * Source: World Bank, 2025
   */
  ageDependencyRatio: {
    percent: 48.9,
    source: 'World Bank, 2025',
    url: 'https://www.worldeconomics.com/Demographics/Age-Dependency-Ratio-Total/Philippines.aspx',
    description:
      'Ratio of dependents (youth 0-14 + elderly 65+) per 100 working-age population (15-64)'
  },

  /**
   * Youth Dependency Ratio
   * Ratio of youth population (0-14) to working-age population (15-64)
   */
  youthDependencyRatio: {
    percent: 42.5,
    source: 'World Bank, 2025',
    url: 'https://data.worldbank.org/indicator/SP.POP.DPND.YG?locations=PH',
    description: 'Young dependents (0-14) per 100 working-age population'
  },

  /**
   * Old-Age Dependency Ratio
   * Ratio of elderly population (65+) to working-age population (15-64)
   */
  oldAgeDependencyRatio: {
    percent: 6.4,
    source: 'World Bank, 2025',
    url: 'https://data.worldbank.org/indicator/SP.POP.DPND.OL?locations=PH',
    description: 'Old-age dependents (65+) per 100 working-age population'
  },

  /**
   * Working Age Population Percentage
   * Source: PSA 2025
   */
  workingAgePercent: {
    percent: 67.2,
    source: 'Philippine Statistics Authority (PSA), 2025',
    url: 'https://www.worldeconomics.com/Population-Of-Working-Age/Philippines.aspx',
    description: 'Percentage of population aged 15-64'
  }
} as const;

/**
 * Get national averages configuration with overrides
 */
export function getNationalAverages(): NationalAveragesConfig {
  return getConfigWithOverrides(CONFIG_STORAGE_KEYS.NATIONAL_AVERAGES, DEFAULT_NATIONAL_AVERAGES);
}

/**
 * Get labor employment averages configuration with overrides
 */
export function getLaborEmploymentAverages(): LaborEmploymentAveragesConfig {
  return getConfigWithOverrides(
    CONFIG_STORAGE_KEYS.NATIONAL_AVERAGES,
    DEFAULT_LABOR_EMPLOYMENT_AVERAGES
  );
}

/**
 * Save national averages configuration (both infrastructure and labor)
 */
export function saveNationalAveragesConfig(
  config: NationalAveragesConfig & LaborEmploymentAveragesConfig,
  changeDescription?: string
): boolean {
  return saveConfigOverride(
    CONFIG_STORAGE_KEYS.NATIONAL_AVERAGES,
    config,
    'nationalAverages',
    changeDescription || 'Updated national averages configuration'
  );
}

/**
 * Reset national averages to default values
 */
export function resetNationalAveragesConfig(): boolean {
  return resetConfigToDefault(CONFIG_STORAGE_KEYS.NATIONAL_AVERAGES, 'nationalAverages');
}

/**
 * Check if national averages has custom overrides
 */
export function hasNationalAveragesOverride(): boolean {
  return hasConfigOverride(CONFIG_STORAGE_KEYS.NATIONAL_AVERAGES);
}

/**
 * Legacy exports for backward compatibility
 * @deprecated Use getNationalAverages() instead
 */
export const NATIONAL_AVERAGES = DEFAULT_NATIONAL_AVERAGES;

/**
 * @deprecated Use getLaborEmploymentAverages() instead
 */
export const LABOR_EMPLOYMENT_AVERAGES = DEFAULT_LABOR_EMPLOYMENT_AVERAGES;

/**
 * Helper function to get labor analytics comparison status
 * @param isTarget - When true, labels refer to "national target" instead of "national average"
 */
export function getLaborComparisonStatus(
  localValue: number,
  nationalValue: number,
  metric: 'unemployment' | 'employment' | 'participation' | 'dependency',
  isTarget: boolean = false
): {
  status: 'better' | 'worse' | 'similar';
  difference: number;
  label: string;
  isTarget: boolean;
} {
  const difference = localValue - nationalValue;
  const absDiff = Math.abs(difference);
  const referenceLabel = isTarget ? 'national target' : 'national average';

  // Threshold for "similar" status (within 2%)
  const threshold = 2;

  if (absDiff <= threshold) {
    return {
      status: 'similar',
      difference,
      label: isTarget ? 'Near national target' : 'Similar to national average',
      isTarget
    };
  }

  // For unemployment and dependency, lower is better
  if (metric === 'unemployment' || metric === 'dependency') {
    if (difference < 0) {
      return {
        status: 'better',
        difference,
        label: `${absDiff.toFixed(1)}% below ${referenceLabel}`,
        isTarget
      };
    }
    return {
      status: 'worse',
      difference,
      label: `${absDiff.toFixed(1)}% above ${referenceLabel}`,
      isTarget
    };
  }

  // For employment and participation, higher is better
  if (difference > 0) {
    return {
      status: 'better',
      difference,
      label: `${absDiff.toFixed(1)}% above ${referenceLabel}`,
      isTarget
    };
  }
  return {
    status: 'worse',
    difference,
    label: `${absDiff.toFixed(1)}% below ${referenceLabel}`,
    isTarget
  };
}
