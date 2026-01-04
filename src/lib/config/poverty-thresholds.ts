/**
 * Poverty Line Thresholds Configuration
 *
 * These thresholds are used to determine poverty status based on average daily income.
 * Values are based on official poverty thresholds and may be updated periodically.
 */

export const POVERTY_THRESHOLDS = {
  /**
   * Daily poverty threshold in Philippine Pesos (₱)
   * Based on 2025 DEPDev poverty threshold for a family of 5
   */
  DAILY_THRESHOLD: 668,

  /**
   * Monthly poverty threshold in Philippine Pesos (₱)
   * Calculated as: DAILY_THRESHOLD × 30 days
   */
  MONTHLY_THRESHOLD: 20000,

  /**
   * Reference year for the current threshold
   */
  REFERENCE_YEAR: 2025,

  /**
   * Source of the threshold data
   */
  SOURCE: 'DEPDev',

  /**
   * Description of the poverty line
   */
  DESCRIPTION: 'Poverty threshold for a family of 5'
} as const;

/**
 * Income Cluster Types based on multiples of the poverty threshold
 *
 * Classification based on per-capita income relative to poverty line:
 * - Poor: Less than 1x poverty threshold
 * - Low-income (not poor): 1x to 2x poverty threshold
 * - Lower middle-income: 2x to 4x poverty threshold
 * - Middle middle-income: 4x to 7x poverty threshold
 * - Upper middle-income: 7x to 12x poverty threshold
 * - Upper-income (not rich): 12x to 20x poverty threshold
 * - Rich: 20x+ poverty threshold
 */
export type IncomeCluster =
  | 'poor'
  | 'low_income'
  | 'lower_middle'
  | 'middle_middle'
  | 'upper_middle'
  | 'upper_income'
  | 'rich';

/**
 * Income cluster threshold multipliers (relative to DAILY_THRESHOLD)
 */
export const INCOME_CLUSTER_MULTIPLIERS = {
  poor: { max: 1 },
  low_income: { min: 1, max: 2 },
  lower_middle: { min: 2, max: 4 },
  middle_middle: { min: 4, max: 7 },
  upper_middle: { min: 7, max: 12 },
  upper_income: { min: 12, max: 20 },
  rich: { min: 20 }
} as const;

/**
 * Income cluster configuration with labels, colors (red→green gradient), and icons
 */
export const INCOME_CLUSTER_CONFIG: Record<
  IncomeCluster,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    textColor: string;
    bgLight: string;
    description: string;
  }
> = {
  poor: {
    label: 'Poor',
    shortLabel: 'Poor',
    color: 'hsl(0, 84%, 60%)', // Red
    bgColor: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    bgLight: 'bg-red-100 dark:bg-red-900/40',
    description: `Less than official poverty threshold (<₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD}/day)`
  },
  low_income: {
    label: 'Low-Income (Not Poor)',
    shortLabel: 'Low-Income',
    color: 'hsl(25, 95%, 53%)', // Orange
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-100 dark:bg-orange-900/40',
    description: `Between poverty line and twice the poverty line (₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD}–₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 2}/day)`
  },
  lower_middle: {
    label: 'Lower Middle-Income',
    shortLabel: 'Lower Middle',
    color: 'hsl(38, 92%, 50%)', // Amber
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-100 dark:bg-amber-900/40',
    description: `Between two and four times the poverty line (₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 2}–₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 4}/day)`
  },
  middle_middle: {
    label: 'Middle Middle-Income',
    shortLabel: 'Middle',
    color: 'hsl(60, 70%, 45%)', // Yellow-green
    bgColor: 'bg-lime-500',
    textColor: 'text-lime-600 dark:text-lime-400',
    bgLight: 'bg-lime-100 dark:bg-lime-900/40',
    description: `Between four and seven times the poverty line (₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 4}–₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 7}/day)`
  },
  upper_middle: {
    label: 'Upper Middle-Income',
    shortLabel: 'Upper Middle',
    color: 'hsl(142, 71%, 45%)', // Green
    bgColor: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
    bgLight: 'bg-green-100 dark:bg-green-900/40',
    description: `Between seven and twelve times the poverty line (₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 7}–₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 12}/day)`
  },
  upper_income: {
    label: 'Upper-Income (Not Rich)',
    shortLabel: 'Upper-Income',
    color: 'hsl(173, 80%, 40%)', // Teal
    bgColor: 'bg-teal-500',
    textColor: 'text-teal-600 dark:text-teal-400',
    bgLight: 'bg-teal-100 dark:bg-teal-900/40',
    description: `Between twelve and twenty times the poverty line (₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 12}–₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 20}/day)`
  },
  rich: {
    label: 'Rich',
    shortLabel: 'Rich',
    color: 'hsl(217, 91%, 60%)', // Blue
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-100 dark:bg-blue-900/40',
    description: `At least twenty times the poverty line (≥₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD * 20}/day)`
  }
} as const;

/**
 * Get income cluster based on daily income
 */
export function getIncomeCluster(dailyIncome: number): IncomeCluster {
  const threshold = POVERTY_THRESHOLDS.DAILY_THRESHOLD;
  const ratio = dailyIncome / threshold;

  if (ratio < 1) return 'poor';
  if (ratio < 2) return 'low_income';
  if (ratio < 4) return 'lower_middle';
  if (ratio < 7) return 'middle_middle';
  if (ratio < 12) return 'upper_middle';
  if (ratio < 20) return 'upper_income';
  return 'rich';
}

/**
 * Get income cluster label for display
 */
export function getIncomeClusterLabel(cluster: IncomeCluster): string {
  return INCOME_CLUSTER_CONFIG[cluster].label;
}

/**
 * Get short income cluster label for compact display
 */
export function getIncomeClusterShortLabel(cluster: IncomeCluster): string {
  return INCOME_CLUSTER_CONFIG[cluster].shortLabel;
}

/**
 * Get income cluster color (HSL string)
 */
export function getIncomeClusterColor(cluster: IncomeCluster): string {
  return INCOME_CLUSTER_CONFIG[cluster].color;
}

/**
 * Get income cluster configuration
 */
export function getIncomeClusterConfig(cluster: IncomeCluster) {
  return INCOME_CLUSTER_CONFIG[cluster];
}

/**
 * Get all income clusters in order from poorest to richest
 */
export const INCOME_CLUSTERS_ORDERED: IncomeCluster[] = [
  'poor',
  'low_income',
  'lower_middle',
  'middle_middle',
  'upper_middle',
  'upper_income',
  'rich'
];

/**
 * Income cluster counts interface for aggregation
 */
export interface IncomeClusterCounts {
  poor: number;
  low_income: number;
  lower_middle: number;
  middle_middle: number;
  upper_middle: number;
  upper_income: number;
  rich: number;
}

/**
 * Create empty income cluster counts
 */
export function createEmptyIncomeClusterCounts(): IncomeClusterCounts {
  return {
    poor: 0,
    low_income: 0,
    lower_middle: 0,
    middle_middle: 0,
    upper_middle: 0,
    upper_income: 0,
    rich: 0
  };
}

/**
 * Get formatted poverty threshold text for display
 */
export function getPovertyThresholdLabel(): string {
  return `₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD.toLocaleString()}/day`;
}

/**
 * Get full poverty threshold description
 */
export function getPovertyThresholdDescription(): string {
  return `Based on ${POVERTY_THRESHOLDS.REFERENCE_YEAR} ${POVERTY_THRESHOLDS.SOURCE} poverty threshold of ₱${POVERTY_THRESHOLDS.DAILY_THRESHOLD}/day (₱${POVERTY_THRESHOLDS.MONTHLY_THRESHOLD.toLocaleString()}/month) for a ${POVERTY_THRESHOLDS.DESCRIPTION.toLowerCase()}`;
}

/**
 * Get daily income range for a given income cluster
 */
export function getIncomeClusterRange(cluster: IncomeCluster): { min: number; max: number | null } {
  const threshold = POVERTY_THRESHOLDS.DAILY_THRESHOLD;
  const multipliers = INCOME_CLUSTER_MULTIPLIERS[cluster];

  return {
    min: 'min' in multipliers ? threshold * multipliers.min : 0,
    max: 'max' in multipliers ? threshold * multipliers.max : null
  };
}

/**
 * Get formatted income range string for a given income cluster
 */
export function getIncomeClusterRangeLabel(cluster: IncomeCluster): string {
  const range = getIncomeClusterRange(cluster);
  if (range.max === null) {
    return `≥₱${range.min.toLocaleString()}/day`;
  }
  if (range.min === 0) {
    return `<₱${range.max.toLocaleString()}/day`;
  }
  return `₱${range.min.toLocaleString()}–₱${range.max.toLocaleString()}/day`;
}
