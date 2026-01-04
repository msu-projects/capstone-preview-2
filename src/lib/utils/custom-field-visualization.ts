/**
 * Custom Field Visualization Utilities
 *
 * Provides data transformation functions for rendering charts
 * based on custom field values and visualization configurations.
 */

import type { BarChartData } from '$lib/components/charts/BarChart.svelte';
import type { DonutChartData } from '$lib/components/charts/DonutChart.svelte';
import type { LineChartSeries } from '$lib/components/charts/LineChart.svelte';
import type {
  CustomFieldColorScheme,
  CustomFieldDefinition,
  CustomFieldVisualizationConfig,
  SitioRecord
} from '$lib/types';
import { DEFAULT_VISUALIZATION_CONFIG } from '$lib/types';
import { getChartColors, getDefaultSeriesColors } from './chart-colors';

// ===== COLOR UTILITIES =====

/**
 * Get colors based on color scheme
 */
export function getSchemeColors(scheme: CustomFieldColorScheme, count: number): string[] {
  const colors = getChartColors();
  const baseColors = getDefaultSeriesColors();

  switch (scheme) {
    case 'categorical':
      return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);

    case 'sequential': {
      // Generate gradient from light to dark primary
      const steps: string[] = [];
      for (let i = 0; i < count; i++) {
        const lightness = 70 - (i * 40) / Math.max(count - 1, 1);
        steps.push(`hsl(217, 91%, ${lightness}%)`);
      }
      return steps;
    }

    case 'success':
      return Array.from({ length: count }, (_, i) => {
        const lightness = 65 - (i * 30) / Math.max(count - 1, 1);
        return `hsl(142, 71%, ${lightness}%)`;
      });

    case 'warning':
      return Array.from({ length: count }, (_, i) => {
        const lightness = 65 - (i * 30) / Math.max(count - 1, 1);
        return `hsl(48, 96%, ${lightness}%)`;
      });

    case 'danger':
      return Array.from({ length: count }, (_, i) => {
        const lightness = 65 - (i * 30) / Math.max(count - 1, 1);
        return `hsl(0, 84%, ${lightness}%)`;
      });

    case 'default':
    default:
      return [
        colors.primary,
        colors.success,
        colors.warning,
        colors.purple,
        colors.cyan,
        colors.pink
      ];
  }
}

// ===== DATA TRANSFORMATION FOR SINGLE SITIO =====

/**
 * Transform a boolean field value into donut chart data
 */
export function transformBooleanToDonut(
  value: unknown,
  config: CustomFieldVisualizationConfig
): DonutChartData[] {
  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, 2);

  if (typeof value === 'boolean') {
    // For a single sitio, show 100% for the actual value
    return value
      ? [{ label: 'Yes', value: 1, color: colors[0] }]
      : [{ label: 'No', value: 1, color: colors[1] }];
  }

  return [{ label: 'Not Recorded', value: 1, color: colors[0] }];
}

/**
 * Transform a radio field value into donut chart data
 */
export function transformRadioToDonut(
  value: unknown,
  choices: string[],
  config: CustomFieldVisualizationConfig
): DonutChartData[] {
  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, choices.length);

  if (typeof value === 'string' && choices.includes(value)) {
    return choices.map((choice, i) => ({
      label: choice,
      value: choice === value ? 1 : 0,
      color: colors[i % colors.length]
    }));
  }

  return choices.map((choice, i) => ({
    label: choice,
    value: 0,
    color: colors[i % colors.length]
  }));
}

/**
 * Transform a checkbox field value into bar chart data
 */
export function transformCheckboxToBar(
  value: unknown,
  choices: string[],
  config: CustomFieldVisualizationConfig
): BarChartData[] {
  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, choices.length);

  const selected = Array.isArray(value) ? value : [];

  return choices.map((choice, i) => ({
    label: choice,
    value: selected.includes(choice) ? 1 : 0,
    color: colors[i % colors.length]
  }));
}

/**
 * Transform a number field value into a single bar (for comparison context)
 */
export function transformNumberToBar(
  value: unknown,
  label: string,
  config: CustomFieldVisualizationConfig
): BarChartData[] {
  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, 1);

  const numValue = typeof value === 'number' ? value : 0;

  return [{ label, value: numValue, color: colors[0] }];
}

/**
 * Transform text array to bar chart showing frequency
 */
export function transformArrayToBar(
  value: unknown,
  config: CustomFieldVisualizationConfig
): BarChartData[] {
  if (!Array.isArray(value)) return [];

  const frequency = new Map<string, number>();
  for (const item of value) {
    if (typeof item === 'string') {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    }
  }

  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, frequency.size);

  return Array.from(frequency.entries()).map(([label, count], i) => ({
    label,
    value: count,
    color: colors[i % colors.length]
  }));
}

// ===== TREND DATA EXTRACTION =====

/**
 * Extract trend data for a numeric custom field across years
 */
export function extractFieldTrendData(
  fieldId: string,
  sitioRecord: SitioRecord,
  trendYears: number = 5
): { series: LineChartSeries[]; categories: string[] } {
  const years = [...sitioRecord.availableYears]
    .sort((a, b) => b - a)
    .slice(0, trendYears)
    .reverse();

  const data: number[] = years.map((year) => {
    const yearData = sitioRecord.yearlyData[year.toString()];
    const value = yearData?.customFields?.[fieldId];
    return typeof value === 'number' ? value : 0;
  });

  return {
    series: [{ name: 'Value', data }],
    categories: years.map(String)
  };
}

/**
 * Extract trend data for a boolean custom field (showing true count over years)
 */
export function extractBooleanTrendData(
  fieldId: string,
  sitioRecord: SitioRecord,
  trendYears: number = 5
): { series: LineChartSeries[]; categories: string[] } {
  const years = [...sitioRecord.availableYears]
    .sort((a, b) => b - a)
    .slice(0, trendYears)
    .reverse();

  const data: number[] = years.map((year) => {
    const yearData = sitioRecord.yearlyData[year.toString()];
    const value = yearData?.customFields?.[fieldId];
    return value === true ? 1 : 0;
  });

  return {
    series: [{ name: 'Yes', data }],
    categories: years.map(String)
  };
}

// ===== AGGREGATION ACROSS SITIOS =====

export interface AggregatedFieldResult {
  type: 'donut' | 'bar' | 'number';
  donutData?: DonutChartData[];
  barData?: BarChartData[];
  numericValue?: number;
  total?: number;
}

/**
 * Aggregate a custom field across all sitios for dashboard visualization
 */
export function aggregateFieldAcrossSitios(
  fieldDef: CustomFieldDefinition,
  sitios: SitioRecord[],
  year: number
): AggregatedFieldResult {
  const config = fieldDef.visualizationConfig ?? DEFAULT_VISUALIZATION_CONFIG;
  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, 10);

  switch (fieldDef.dataType) {
    case 'boolean': {
      let yesCount = 0;
      let noCount = 0;
      let notRecorded = 0;

      for (const sitio of sitios) {
        const yearData = sitio.yearlyData[year.toString()];
        const value = yearData?.customFields?.[fieldDef.id];
        if (value === true) yesCount++;
        else if (value === false) noCount++;
        else notRecorded++;
      }

      return {
        type: 'donut',
        donutData: [
          { label: 'Yes', value: yesCount, color: colors[0] },
          { label: 'No', value: noCount, color: colors[1] },
          ...(notRecorded > 0
            ? [{ label: 'Not Recorded', value: notRecorded, color: colors[2] }]
            : [])
        ],
        total: sitios.length
      };
    }

    case 'radio': {
      const choices = fieldDef.validationRules.choices ?? [];
      const counts = new Map<string, number>();
      choices.forEach((c) => counts.set(c, 0));
      let notRecorded = 0;

      for (const sitio of sitios) {
        const yearData = sitio.yearlyData[year.toString()];
        const value = yearData?.customFields?.[fieldDef.id];
        if (typeof value === 'string' && choices.includes(value)) {
          counts.set(value, (counts.get(value) || 0) + 1);
        } else {
          notRecorded++;
        }
      }

      const donutData: DonutChartData[] = choices.map((choice, i) => ({
        label: choice,
        value: counts.get(choice) || 0,
        color: colors[i % colors.length]
      }));

      if (notRecorded > 0) {
        donutData.push({
          label: 'Not Recorded',
          value: notRecorded,
          color: colors[choices.length]
        });
      }

      return { type: 'donut', donutData, total: sitios.length };
    }

    case 'checkbox': {
      const choices = fieldDef.validationRules.choices ?? [];
      const counts = new Map<string, number>();
      choices.forEach((c) => counts.set(c, 0));

      for (const sitio of sitios) {
        const yearData = sitio.yearlyData[year.toString()];
        const value = yearData?.customFields?.[fieldDef.id];
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string' && choices.includes(item)) {
              counts.set(item, (counts.get(item) || 0) + 1);
            }
          }
        }
      }

      return {
        type: 'bar',
        barData: choices.map((choice, i) => ({
          label: choice,
          value: counts.get(choice) || 0,
          color: colors[i % colors.length]
        })),
        total: sitios.length
      };
    }

    case 'number': {
      let sum = 0;
      let count = 0;
      let min = Infinity;
      let max = -Infinity;

      for (const sitio of sitios) {
        const yearData = sitio.yearlyData[year.toString()];
        const value = yearData?.customFields?.[fieldDef.id];
        if (typeof value === 'number') {
          sum += value;
          count++;
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      }

      let numericValue: number;
      switch (fieldDef.aggregationType) {
        case 'sum':
          numericValue = sum;
          break;
        case 'average':
          numericValue = count > 0 ? sum / count : 0;
          break;
        case 'min':
          numericValue = min === Infinity ? 0 : min;
          break;
        case 'max':
          numericValue = max === -Infinity ? 0 : max;
          break;
        case 'count':
        default:
          numericValue = count;
          break;
      }

      return {
        type: 'number',
        numericValue,
        barData: [{ label: fieldDef.displayLabel, value: numericValue, color: colors[0] }],
        total: sitios.length
      };
    }

    case 'text':
    case 'array': {
      // Count frequency of unique values
      const frequency = new Map<string, number>();

      for (const sitio of sitios) {
        const yearData = sitio.yearlyData[year.toString()];
        const value = yearData?.customFields?.[fieldDef.id];

        if (fieldDef.dataType === 'array' && Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string') {
              frequency.set(item, (frequency.get(item) || 0) + 1);
            }
          }
        } else if (typeof value === 'string' && value) {
          frequency.set(value, (frequency.get(value) || 0) + 1);
        }
      }

      // Sort by frequency and take top 10
      const sorted = Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        type: 'bar',
        barData: sorted.map(([label, value], i) => ({
          label,
          value,
          color: colors[i % colors.length]
        })),
        total: sitios.length
      };
    }

    case 'date': {
      // Group by year/month
      const byYear = new Map<number, number>();

      for (const sitio of sitios) {
        const yearData = sitio.yearlyData[year.toString()];
        const value = yearData?.customFields?.[fieldDef.id];
        if (typeof value === 'string' && value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const y = date.getFullYear();
            byYear.set(y, (byYear.get(y) || 0) + 1);
          }
        }
      }

      const sorted = Array.from(byYear.entries()).sort((a, b) => a[0] - b[0]);

      return {
        type: 'bar',
        barData: sorted.map(([yr, count], i) => ({
          label: yr.toString(),
          value: count,
          color: colors[i % colors.length]
        })),
        total: sitios.length
      };
    }

    default:
      return { type: 'number', numericValue: 0, total: 0 };
  }
}

/**
 * Aggregate a numeric field across all sitios over multiple years for trend chart
 */
export function aggregateFieldTrendAcrossSitios(
  fieldDef: CustomFieldDefinition,
  sitios: SitioRecord[],
  years: number[]
): { series: LineChartSeries[]; categories: string[] } {
  const config = fieldDef.visualizationConfig ?? DEFAULT_VISUALIZATION_CONFIG;
  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, 1);

  const sortedYears = [...years].sort((a, b) => a - b);

  const data: number[] = sortedYears.map((year) => {
    let sum = 0;
    let count = 0;

    for (const sitio of sitios) {
      const yearData = sitio.yearlyData[year.toString()];
      const value = yearData?.customFields?.[fieldDef.id];

      if (fieldDef.dataType === 'number' && typeof value === 'number') {
        sum += value;
        count++;
      } else if (fieldDef.dataType === 'boolean' && value === true) {
        sum += 1;
        count++;
      }
    }

    switch (fieldDef.aggregationType) {
      case 'sum':
        return sum;
      case 'average':
        return count > 0 ? sum / count : 0;
      case 'count':
        return count;
      case 'min':
      case 'max':
        // Min/max require different logic
        return sum;
      default:
        return sum;
    }
  });

  return {
    series: [{ name: fieldDef.displayLabel, data, color: colors[0] }],
    categories: sortedYears.map(String)
  };
}

// ===== MOCK DATA FOR PREVIEW =====

/**
 * Generate sample data for chart preview in the admin config
 */
export function generatePreviewData(fieldDef: CustomFieldDefinition): {
  donutData?: DonutChartData[];
  barData?: BarChartData[];
  lineData?: { series: LineChartSeries[]; categories: string[] };
} {
  const config = fieldDef.visualizationConfig ?? DEFAULT_VISUALIZATION_CONFIG;
  const colors = config.customColors?.length
    ? config.customColors
    : getSchemeColors(config.colorScheme, 6);

  switch (fieldDef.dataType) {
    case 'boolean':
      return {
        donutData: [
          { label: 'Yes', value: 65, color: colors[0] },
          { label: 'No', value: 35, color: colors[1] }
        ]
      };

    case 'radio': {
      const choices = fieldDef.validationRules.choices ?? ['Option 1', 'Option 2', 'Option 3'];
      return {
        donutData: choices.map((choice, i) => ({
          label: choice,
          value: Math.floor(Math.random() * 50) + 10,
          color: colors[i % colors.length]
        }))
      };
    }

    case 'checkbox': {
      const choices = fieldDef.validationRules.choices ?? ['Option 1', 'Option 2', 'Option 3'];
      return {
        barData: choices.map((choice, i) => ({
          label: choice,
          value: Math.floor(Math.random() * 80) + 20,
          color: colors[i % colors.length]
        }))
      };
    }

    case 'number':
      return {
        barData: [{ label: fieldDef.displayLabel, value: 1234, color: colors[0] }],
        lineData: {
          series: [
            { name: fieldDef.displayLabel, data: [100, 120, 115, 140, 160], color: colors[0] }
          ],
          categories: ['2022', '2023', '2024', '2025', '2026']
        }
      };

    case 'text':
    case 'array':
      return {
        barData: [
          { label: 'Item A', value: 45, color: colors[0] },
          { label: 'Item B', value: 32, color: colors[1] },
          { label: 'Item C', value: 28, color: colors[2] },
          { label: 'Item D', value: 15, color: colors[3] }
        ]
      };

    case 'date':
      return {
        barData: [
          { label: '2022', value: 12, color: colors[0] },
          { label: '2023', value: 18, color: colors[1] },
          { label: '2024', value: 25, color: colors[2] },
          { label: '2025', value: 30, color: colors[3] }
        ]
      };

    default:
      return {};
  }
}
