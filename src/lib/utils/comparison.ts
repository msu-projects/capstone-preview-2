/**
 * Comparison Utilities
 *
 * Functions for calculating temporal, spatial, and aggregate comparisons
 * of sitio data. Includes URL serialization for shareable comparison links.
 */

import type { SitioRecord } from '$lib/types';
import type {
  AggregateComparisonResult,
  AggregatedEntityData,
  AggregateLevel,
  ComparisonBarChartData,
  ComparisonConfig,
  ComparisonDiff,
  ComparisonLimits,
  ComparisonLineChartData,
  ComparisonMetricGroup,
  ComparisonMetricValue,
  ComparisonRadarChartData,
  ComparisonResult,
  SerializedComparisonConfig,
  SpatialComparisonResult,
  TemporalComparisonResult
} from '$lib/types/comparison';
import {
  aggregateMetricsForYear,
  calculateYoYChange,
  getDataForYear
} from './sitio-chart-aggregation';

// ==========================================
// URL SERIALIZATION
// ==========================================

/**
 * Serialize comparison config to URL search params
 */
export function serializeConfigToURL(config: ComparisonConfig): URLSearchParams {
  const serialized: SerializedComparisonConfig = {
    t: config.type === 'temporal' ? 't' : config.type === 'spatial' ? 's' : 'a',
    s: config.sitioIds.join(','),
    y: config.years.join(','),
    m: config.metricGroups.map((g) => g.charAt(0)).join('')
  };

  if (config.aggregateLevel) {
    serialized.al = config.aggregateLevel.charAt(0);
  }

  if (config.aggregateEntities && config.aggregateEntities.length > 0) {
    serialized.ae = config.aggregateEntities.join(',');
  }

  const params = new URLSearchParams();
  params.set('t', serialized.t);
  params.set('s', serialized.s);
  params.set('y', serialized.y);
  params.set('m', serialized.m);
  if (serialized.al) {
    params.set('al', serialized.al);
  }
  if (serialized.ae) {
    params.set('ae', serialized.ae);
  }
  if (config.municipalityFilter) {
    params.set('mf', config.municipalityFilter);
  }

  return params;
}

/**
 * Parse comparison config from URL search params
 */
export function parseConfigFromURL(params: URLSearchParams): ComparisonConfig | null {
  const type = params.get('t');
  const sitioIds = params.get('s');
  const years = params.get('y');
  const metrics = params.get('m');

  if (!type || !sitioIds || !years || !metrics) {
    return null;
  }

  const metricGroupMap: Record<string, ComparisonMetricGroup> = {
    d: 'demographics',
    u: 'utilities',
    i: 'infrastructure',
    f: 'facilities',
    l: 'livelihood',
    s: 'safety',
    e: 'education',
    c: 'customFields'
  };

  const aggregateLevelMap: Record<string, AggregateLevel> = {
    m: 'municipality',
    b: 'barangay'
  };

  const config: ComparisonConfig = {
    type: type === 't' ? 'temporal' : type === 's' ? 'spatial' : 'aggregate',
    sitioIds: sitioIds
      .split(',')
      .map(Number)
      .filter((id) => !isNaN(id)),
    years: years
      .split(',')
      .map(Number)
      .filter((y) => !isNaN(y)),
    metricGroups: metrics
      .split('')
      .map((c) => metricGroupMap[c])
      .filter(Boolean) as ComparisonMetricGroup[]
  };

  const aggregateLevel = params.get('al');
  if (aggregateLevel && aggregateLevelMap[aggregateLevel]) {
    config.aggregateLevel = aggregateLevelMap[aggregateLevel];
  }

  const aggregateEntities = params.get('ae');
  if (aggregateEntities) {
    config.aggregateEntities = aggregateEntities.split(',').filter(Boolean);
  }

  const municipalityFilter = params.get('mf');
  if (municipalityFilter) {
    config.municipalityFilter = municipalityFilter;
  }

  return config;
}

/**
 * Validate comparison config against limits
 */
export function validateComparisonConfig(
  config: ComparisonConfig,
  limits: ComparisonLimits
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.type === 'temporal') {
    if (config.sitioIds.length !== 1) {
      errors.push('Temporal comparison requires exactly 1 sitio');
    }
    if (config.years.length < 2) {
      errors.push('Temporal comparison requires at least 2 years');
    }
    if (config.years.length > limits.maxYears) {
      errors.push(`Maximum ${limits.maxYears} years allowed`);
    }
  }

  if (config.type === 'spatial') {
    if (config.sitioIds.length < 2) {
      errors.push('Spatial comparison requires at least 2 sitios');
    }
    if (config.sitioIds.length > limits.maxSitios) {
      errors.push(`Maximum ${limits.maxSitios} sitios allowed`);
    }
    if (config.years.length !== 1) {
      errors.push('Spatial comparison requires exactly 1 year');
    }
  }

  if (config.type === 'aggregate') {
    if (!config.aggregateLevel) {
      errors.push('Aggregate level is required');
    }
    if (!config.aggregateEntities || config.aggregateEntities.length < 2) {
      errors.push('Select at least 2 entities to compare');
    }
    if (config.aggregateEntities && config.aggregateEntities.length > limits.maxSitios) {
      errors.push(`Maximum ${limits.maxSitios} entities allowed`);
    }
    if (config.years.length !== 1) {
      errors.push('Aggregate comparison requires exactly 1 year');
    }
  }

  if (config.metricGroups.length === 0) {
    errors.push('At least one metric group must be selected');
  }

  return { valid: errors.length === 0, errors };
}

// ==========================================
// COMPARISON CALCULATIONS
// ==========================================

/**
 * Calculate difference between two values
 */
export function calculateDiff(
  currentValue: number,
  previousValue: number,
  higherIsBetter: boolean = true
): ComparisonDiff {
  const change = currentValue - previousValue;
  const changePercent =
    previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  const trend = calculateYoYChange(currentValue, previousValue);

  // Determine if the change is positive based on context
  let isPositive: boolean;
  if (higherIsBetter) {
    isPositive = change >= 0;
  } else {
    isPositive = change <= 0;
  }

  return {
    currentValue,
    previousValue,
    change,
    changePercent: Math.round(changePercent * 10) / 10,
    trend,
    isPositive
  };
}

/**
 * Format a value for display
 */
export function formatComparisonValue(
  value: number | string | null,
  format?: 'number' | 'percent' | 'currency' | 'decimal'
): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;

  switch (format) {
    case 'percent':
      return `${Math.round(value * 10) / 10}%`;
    case 'currency':
      return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    case 'decimal':
      return value.toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    case 'number':
    default:
      return value.toLocaleString('en-PH');
  }
}

// ==========================================
// METRIC EXTRACTORS
// ==========================================

/**
 * Get demographic metrics for a sitio at a given year
 */
function getDemographicMetrics(sitio: SitioRecord, year: number): ComparisonMetricValue[] {
  const profile = getDataForYear(sitio, year);
  if (!profile) return [];

  const totalHouseholds = profile.totalHouseholds || 0;

  return [
    {
      key: 'totalPopulation',
      label: 'Total Population',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.totalPopulation,
          displayValue: formatComparisonValue(profile.totalPopulation, 'number')
        }
      ],
      format: 'number',
      higherIsBetter: undefined // Contextual
    },
    {
      key: 'totalHouseholds',
      label: 'Total Households',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.totalHouseholds,
          displayValue: formatComparisonValue(profile.totalHouseholds, 'number')
        }
      ],
      format: 'number'
    },
    {
      key: 'totalMale',
      label: 'Male Population',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.population.totalMale,
          displayValue: formatComparisonValue(profile.population.totalMale, 'number')
        }
      ],
      format: 'number'
    },
    {
      key: 'totalFemale',
      label: 'Female Population',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.population.totalFemale,
          displayValue: formatComparisonValue(profile.population.totalFemale, 'number')
        }
      ],
      format: 'number'
    },
    {
      key: 'registeredVoters',
      label: 'Registered Voters',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.registeredVoters,
          displayValue: formatComparisonValue(profile.registeredVoters, 'number')
        }
      ],
      format: 'number'
    },
    {
      key: 'laborForceCount',
      label: 'Labor Force',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.laborForceCount,
          displayValue: formatComparisonValue(profile.laborForceCount, 'number')
        }
      ],
      format: 'number',
      higherIsBetter: true
    },
    {
      key: 'unemployedCount',
      label: 'Unemployed',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.vulnerableGroups.unemployedCount,
          displayValue: formatComparisonValue(profile.vulnerableGroups.unemployedCount, 'number')
        }
      ],
      format: 'number',
      higherIsBetter: false
    },
    {
      key: 'unemploymentRate',
      label: 'Unemployment Rate',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value:
            profile.laborForceCount > 0
              ? (profile.vulnerableGroups.unemployedCount / profile.laborForceCount) * 100
              : 0,
          displayValue: formatComparisonValue(
            profile.laborForceCount > 0
              ? (profile.vulnerableGroups.unemployedCount / profile.laborForceCount) * 100
              : 0,
            'percent'
          )
        }
      ],
      format: 'percent',
      unit: '%',
      higherIsBetter: false
    },
    {
      key: 'averageHouseholdSize',
      label: 'Avg Household Size',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: totalHouseholds > 0 ? profile.totalPopulation / totalHouseholds : 0,
          displayValue: formatComparisonValue(
            totalHouseholds > 0 ? profile.totalPopulation / totalHouseholds : 0,
            'decimal'
          )
        }
      ],
      format: 'decimal'
    }
  ];
}

/**
 * Get utility metrics for a sitio at a given year
 */
function getUtilityMetrics(sitio: SitioRecord, year: number): ComparisonMetricValue[] {
  const profile = getDataForYear(sitio, year);
  if (!profile) return [];

  const totalHouseholds = profile.totalHouseholds || 1;

  return [
    {
      key: 'electricityRate',
      label: 'Electrification Rate',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: (profile.householdsWithElectricity / totalHouseholds) * 100,
          displayValue: formatComparisonValue(
            (profile.householdsWithElectricity / totalHouseholds) * 100,
            'percent'
          )
        }
      ],
      format: 'percent',
      unit: '%',
      higherIsBetter: true
    },
    {
      key: 'householdsWithElectricity',
      label: 'Electrified Households',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.householdsWithElectricity,
          displayValue: formatComparisonValue(profile.householdsWithElectricity, 'number')
        }
      ],
      format: 'number',
      higherIsBetter: true
    },
    {
      key: 'toiletRate',
      label: 'Toilet Access Rate',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: (profile.householdsWithToilet / totalHouseholds) * 100,
          displayValue: formatComparisonValue(
            (profile.householdsWithToilet / totalHouseholds) * 100,
            'percent'
          )
        }
      ],
      format: 'percent',
      unit: '%',
      higherIsBetter: true
    },
    {
      key: 'householdsWithToilet',
      label: 'Households with Toilet',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.householdsWithToilet,
          displayValue: formatComparisonValue(profile.householdsWithToilet, 'number')
        }
      ],
      format: 'number',
      higherIsBetter: true
    },
    {
      key: 'internetRate',
      label: 'Internet Access Rate',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: (profile.householdsWithInternet / totalHouseholds) * 100,
          displayValue: formatComparisonValue(
            (profile.householdsWithInternet / totalHouseholds) * 100,
            'percent'
          )
        }
      ],
      format: 'percent',
      unit: '%',
      higherIsBetter: true
    },
    {
      key: 'householdsWithInternet',
      label: 'Households with Internet',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.householdsWithInternet,
          displayValue: formatComparisonValue(profile.householdsWithInternet, 'number')
        }
      ],
      format: 'number',
      higherIsBetter: true
    },
    {
      key: 'mobileSignal',
      label: 'Mobile Signal',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.mobileSignal,
          displayValue:
            profile.mobileSignal === 'none' ? 'None' : profile.mobileSignal.toUpperCase()
        }
      ]
    }
  ];
}

/**
 * Get infrastructure metrics for a sitio at a given year
 */
function getInfrastructureMetrics(sitio: SitioRecord, year: number): ComparisonMetricValue[] {
  const profile = getDataForYear(sitio, year);
  if (!profile) return [];

  const concreteLength = profile.infrastructure?.concrete?.length || 0;
  const asphaltLength = profile.infrastructure?.asphalt?.length || 0;
  const gravelLength = profile.infrastructure?.gravel?.length || 0;
  const naturalLength = profile.infrastructure?.natural?.length || 0;
  const totalRoadLength = concreteLength + asphaltLength + gravelLength + naturalLength;

  return [
    {
      key: 'totalRoadLength',
      label: 'Total Road Length',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: totalRoadLength,
          displayValue: `${formatComparisonValue(totalRoadLength, 'decimal')} km`
        }
      ],
      unit: 'km',
      format: 'decimal',
      higherIsBetter: true
    },
    {
      key: 'concreteRoadLength',
      label: 'Concrete Road',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: concreteLength,
          displayValue: `${formatComparisonValue(concreteLength, 'decimal')} km`
        }
      ],
      unit: 'km',
      format: 'decimal'
    },
    {
      key: 'asphaltRoadLength',
      label: 'Asphalt Road',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: asphaltLength,
          displayValue: `${formatComparisonValue(asphaltLength, 'decimal')} km`
        }
      ],
      unit: 'km',
      format: 'decimal'
    },
    {
      key: 'gravelRoadLength',
      label: 'Gravel Road',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: gravelLength,
          displayValue: `${formatComparisonValue(gravelLength, 'decimal')} km`
        }
      ],
      unit: 'km',
      format: 'decimal'
    },
    {
      key: 'naturalRoadLength',
      label: 'Natural/Earth Road',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: naturalLength,
          displayValue: `${formatComparisonValue(naturalLength, 'decimal')} km`
        }
      ],
      unit: 'km',
      format: 'decimal'
    },
    {
      key: 'pavedRoadPercent',
      label: 'Paved Road %',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value:
            totalRoadLength > 0 ? ((concreteLength + asphaltLength) / totalRoadLength) * 100 : 0,
          displayValue: formatComparisonValue(
            totalRoadLength > 0 ? ((concreteLength + asphaltLength) / totalRoadLength) * 100 : 0,
            'percent'
          )
        }
      ],
      unit: '%',
      format: 'percent',
      higherIsBetter: true
    }
  ];
}

/**
 * Get livelihood metrics for a sitio at a given year
 */
function getLivelihoodMetrics(sitio: SitioRecord, year: number): ComparisonMetricValue[] {
  const profile = getDataForYear(sitio, year);
  if (!profile) return [];

  return [
    {
      key: 'averageDailyIncome',
      label: 'Avg Daily Income',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.averageDailyIncome,
          displayValue: formatComparisonValue(profile.averageDailyIncome, 'currency')
        }
      ],
      format: 'currency',
      higherIsBetter: true
    },
    {
      key: 'numberOfFarmers',
      label: 'Number of Farmers',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.agriculture?.numberOfFarmers || 0,
          displayValue: formatComparisonValue(profile.agriculture?.numberOfFarmers || 0, 'number')
        }
      ],
      format: 'number'
    },
    {
      key: 'farmAreaHectares',
      label: 'Farm Area',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.agriculture?.estimatedFarmAreaHectares || 0,
          displayValue: `${formatComparisonValue(profile.agriculture?.estimatedFarmAreaHectares || 0, 'decimal')} ha`
        }
      ],
      unit: 'ha',
      format: 'decimal'
    },
    {
      key: 'numberOfAssociations',
      label: 'Farmer Associations',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.agriculture?.numberOfAssociations || 0,
          displayValue: formatComparisonValue(
            profile.agriculture?.numberOfAssociations || 0,
            'number'
          )
        }
      ],
      format: 'number'
    },
    {
      key: 'belowPovertyLine',
      label: 'Below Poverty Line',
      values: [
        {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value: profile.averageDailyIncome < 668 ? 'Yes' : 'No',
          displayValue: profile.averageDailyIncome < 668 ? 'Yes' : 'No'
        }
      ],
      higherIsBetter: false
    }
  ];
}

/**
 * Get all metrics for a metric group
 */
function getMetricsForGroup(
  sitio: SitioRecord,
  year: number,
  group: ComparisonMetricGroup
): ComparisonMetricValue[] {
  switch (group) {
    case 'demographics':
      return getDemographicMetrics(sitio, year);
    case 'utilities':
      return getUtilityMetrics(sitio, year);
    case 'infrastructure':
      return getInfrastructureMetrics(sitio, year);
    case 'livelihood':
      return getLivelihoodMetrics(sitio, year);
    case 'facilities':
    case 'safety':
    case 'education':
    case 'customFields':
      // TODO: Implement other metric groups
      return [];
    default:
      return [];
  }
}

// ==========================================
// TEMPORAL COMPARISON
// ==========================================

/**
 * Calculate temporal comparison (single sitio across multiple years)
 */
export function calculateTemporalComparison(
  sitio: SitioRecord,
  years: number[],
  metricGroups: ComparisonMetricGroup[]
): TemporalComparisonResult {
  const sortedYears = [...years].sort((a, b) => a - b);

  // Build metrics by group with all years
  const metricsByGroup: Record<ComparisonMetricGroup, ComparisonMetricValue[]> = {
    demographics: [],
    utilities: [],
    infrastructure: [],
    facilities: [],
    livelihood: [],
    safety: [],
    education: [],
    customFields: []
  };

  // For each metric group, collect data for all years
  for (const group of metricGroups) {
    const firstYearMetrics = getMetricsForGroup(sitio, sortedYears[0], group);

    // For each metric in the first year, collect values for all years
    const mergedMetrics: ComparisonMetricValue[] = firstYearMetrics.map((metric) => {
      const values = sortedYears.map((year) => {
        const yearMetrics = getMetricsForGroup(sitio, year, group);
        const matchingMetric = yearMetrics.find((m) => m.key === metric.key);
        const value = matchingMetric?.values[0]?.value ?? null;

        return {
          subjectId: year.toString(),
          subjectLabel: year.toString(),
          value,
          displayValue: matchingMetric?.values[0]?.displayValue ?? 'N/A'
        };
      });

      return {
        ...metric,
        values
      };
    });

    metricsByGroup[group] = mergedMetrics;
  }

  // Calculate year-over-year changes
  const yearChanges: TemporalComparisonResult['yearChanges'] = [];

  for (let i = 1; i < sortedYears.length; i++) {
    const fromYear = sortedYears[i - 1];
    const toYear = sortedYears[i];
    const changes: Record<string, ComparisonDiff> = {};

    for (const group of metricGroups) {
      const metrics = metricsByGroup[group];
      for (const metric of metrics) {
        const fromValue = metric.values.find((v) => v.subjectId === fromYear.toString())?.value;
        const toValue = metric.values.find((v) => v.subjectId === toYear.toString())?.value;

        if (typeof fromValue === 'number' && typeof toValue === 'number') {
          changes[metric.key] = calculateDiff(toValue, fromValue, metric.higherIsBetter ?? true);
        }
      }
    }

    yearChanges.push({ fromYear, toYear, changes });
  }

  // Calculate overall trend (first to last year)
  const overallTrend: Record<string, ComparisonDiff> = {};
  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];

  for (const group of metricGroups) {
    const metrics = metricsByGroup[group];
    for (const metric of metrics) {
      const firstValue = metric.values.find((v) => v.subjectId === firstYear.toString())?.value;
      const lastValue = metric.values.find((v) => v.subjectId === lastYear.toString())?.value;

      if (typeof firstValue === 'number' && typeof lastValue === 'number') {
        overallTrend[metric.key] = calculateDiff(
          lastValue,
          firstValue,
          metric.higherIsBetter ?? true
        );
      }
    }
  }

  return {
    type: 'temporal',
    sitio,
    years: sortedYears,
    metricsByGroup,
    yearChanges,
    overallTrend
  };
}

// ==========================================
// SPATIAL COMPARISON
// ==========================================

/**
 * Calculate spatial comparison (multiple sitios for same year)
 */
export function calculateSpatialComparison(
  sitios: SitioRecord[],
  year: number,
  metricGroups: ComparisonMetricGroup[]
): SpatialComparisonResult {
  // Build metrics by group with all sitios
  const metricsByGroup: Record<ComparisonMetricGroup, ComparisonMetricValue[]> = {
    demographics: [],
    utilities: [],
    infrastructure: [],
    facilities: [],
    livelihood: [],
    safety: [],
    education: [],
    customFields: []
  };

  // Get sitio labels
  const sitioLabels: Record<number, string> = {};
  for (const sitio of sitios) {
    sitioLabels[sitio.id] = `${sitio.sitioName}, ${sitio.barangay}`;
  }

  // For each metric group, collect data for all sitios
  for (const group of metricGroups) {
    const firstSitioMetrics = getMetricsForGroup(sitios[0], year, group);

    // For each metric, collect values for all sitios
    const mergedMetrics: ComparisonMetricValue[] = firstSitioMetrics.map((metric) => {
      const values = sitios.map((sitio) => {
        const sitioMetrics = getMetricsForGroup(sitio, year, group);
        const matchingMetric = sitioMetrics.find((m) => m.key === metric.key);
        const value = matchingMetric?.values[0]?.value ?? null;

        return {
          subjectId: sitio.id.toString(),
          subjectLabel: sitioLabels[sitio.id],
          value,
          displayValue: matchingMetric?.values[0]?.displayValue ?? 'N/A'
        };
      });

      return {
        ...metric,
        values
      };
    });

    metricsByGroup[group] = mergedMetrics;
  }

  // Calculate rankings for each metric
  const rankings: Record<string, Record<number, number>> = {};
  const aggregateStats: SpatialComparisonResult['aggregateStats'] = {
    min: {},
    max: {},
    average: {}
  };

  for (const group of metricGroups) {
    const metrics = metricsByGroup[group];
    for (const metric of metrics) {
      const numericValues = metric.values
        .filter((v) => typeof v.value === 'number')
        .map((v) => ({ id: parseInt(v.subjectId), value: v.value as number }));

      if (numericValues.length > 0) {
        // Calculate aggregate stats
        const values = numericValues.map((v) => v.value);
        aggregateStats.min[metric.key] = Math.min(...values);
        aggregateStats.max[metric.key] = Math.max(...values);
        aggregateStats.average[metric.key] = values.reduce((a, b) => a + b, 0) / values.length;

        // Calculate rankings (higher is better by default)
        const sorted = [...numericValues].sort((a, b) =>
          metric.higherIsBetter === false ? a.value - b.value : b.value - a.value
        );

        rankings[metric.key] = {};
        sorted.forEach((item, index) => {
          rankings[metric.key][item.id] = index + 1;
        });
      }
    }
  }

  return {
    type: 'spatial',
    sitios,
    year,
    metricsByGroup,
    rankings,
    aggregateStats
  };
}

// ==========================================
// AGGREGATE COMPARISON
// ==========================================

/**
 * Calculate aggregate comparison (municipality vs municipality or barangay vs barangay)
 */
export function calculateAggregateComparison(
  sitios: SitioRecord[],
  year: number,
  aggregateLevel: AggregateLevel,
  entities: string[],
  metricGroups: ComparisonMetricGroup[],
  municipalityFilter?: string
): AggregateComparisonResult {
  // Build aggregated data for each entity
  const aggregatedEntities: AggregatedEntityData[] = [];

  for (const entityName of entities) {
    // Filter sitios by entity
    const entitySitios = sitios.filter((s) => {
      if (aggregateLevel === 'municipality') {
        return s.municipality === entityName;
      }
      // For barangay level, also filter by municipality if specified
      if (municipalityFilter && s.municipality !== municipalityFilter) {
        return false;
      }
      return s.barangay === entityName;
    });

    if (entitySitios.length === 0) continue;

    // Aggregate metrics
    const aggregated = aggregateMetricsForYear(entitySitios, year);

    aggregatedEntities.push({
      name: entityName,
      totalPopulation: aggregated.totalPopulation,
      totalHouseholds: aggregated.totalHouseholds,
      sitioCount: entitySitios.length,
      metrics: {
        totalPopulation: aggregated.totalPopulation,
        totalHouseholds: aggregated.totalHouseholds,
        totalMale: aggregated.totalMale,
        totalFemale: aggregated.totalFemale,
        electricityRate: aggregated.electricityPercent,
        toiletRate: aggregated.toiletPercent,
        internetRate: aggregated.internetPercent,
        laborForceCount: aggregated.totalLaborWorkforce,
        unemployedCount: aggregated.totalUnemployed,
        unemploymentRate:
          aggregated.totalLaborWorkforce > 0
            ? (aggregated.totalUnemployed / aggregated.totalLaborWorkforce) * 100
            : 0,
        totalRoadLength: aggregated.totalRoadLength,
        concreteRoadLength: aggregated.roadConcrete,
        asphaltRoadLength: aggregated.roadAsphalt,
        gravelRoadLength: aggregated.roadGravel,
        naturalRoadLength: aggregated.roadNatural,
        averageDailyIncome: aggregated.averageDailyIncome
      }
    });
  }

  // Build metrics by group
  const metricsByGroup: Record<ComparisonMetricGroup, ComparisonMetricValue[]> = {
    demographics: [],
    utilities: [],
    infrastructure: [],
    facilities: [],
    livelihood: [],
    safety: [],
    education: [],
    customFields: []
  };

  // Define metrics for each group
  const metricDefinitions: Record<
    ComparisonMetricGroup,
    Array<{
      key: string;
      label: string;
      format?: 'number' | 'percent' | 'currency' | 'decimal';
      unit?: string;
      higherIsBetter?: boolean;
    }>
  > = {
    demographics: [
      { key: 'totalPopulation', label: 'Total Population', format: 'number' },
      { key: 'totalHouseholds', label: 'Total Households', format: 'number' },
      { key: 'totalMale', label: 'Male Population', format: 'number' },
      { key: 'totalFemale', label: 'Female Population', format: 'number' },
      { key: 'laborForceCount', label: 'Labor Force', format: 'number', higherIsBetter: true },
      { key: 'unemployedCount', label: 'Unemployed', format: 'number', higherIsBetter: false },
      {
        key: 'unemploymentRate',
        label: 'Unemployment Rate',
        format: 'percent',
        unit: '%',
        higherIsBetter: false
      }
    ],
    utilities: [
      {
        key: 'electricityRate',
        label: 'Electrification Rate',
        format: 'percent',
        unit: '%',
        higherIsBetter: true
      },
      {
        key: 'toiletRate',
        label: 'Toilet Access Rate',
        format: 'percent',
        unit: '%',
        higherIsBetter: true
      },
      {
        key: 'internetRate',
        label: 'Internet Access Rate',
        format: 'percent',
        unit: '%',
        higherIsBetter: true
      }
    ],
    infrastructure: [
      {
        key: 'totalRoadLength',
        label: 'Total Road Length',
        format: 'decimal',
        unit: 'km',
        higherIsBetter: true
      },
      { key: 'concreteRoadLength', label: 'Concrete Road', format: 'decimal', unit: 'km' },
      { key: 'asphaltRoadLength', label: 'Asphalt Road', format: 'decimal', unit: 'km' },
      { key: 'gravelRoadLength', label: 'Gravel Road', format: 'decimal', unit: 'km' },
      { key: 'naturalRoadLength', label: 'Natural/Earth Road', format: 'decimal', unit: 'km' }
    ],
    livelihood: [
      {
        key: 'averageDailyIncome',
        label: 'Avg Daily Income',
        format: 'currency',
        higherIsBetter: true
      }
    ],
    facilities: [],
    safety: [],
    education: [],
    customFields: []
  };

  // Build metrics for each group
  for (const group of metricGroups) {
    const definitions = metricDefinitions[group];
    if (!definitions) continue;

    for (const def of definitions) {
      const values = aggregatedEntities.map((entity) => {
        const value = entity.metrics[def.key] ?? 0;
        let displayValue: string;

        switch (def.format) {
          case 'percent':
            displayValue = `${Math.round(value * 10) / 10}%`;
            break;
          case 'currency':
            displayValue = `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
            break;
          case 'decimal':
            displayValue = def.unit
              ? `${value.toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${def.unit}`
              : value.toLocaleString('en-PH', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                });
            break;
          default:
            displayValue = value.toLocaleString('en-PH');
        }

        return {
          subjectId: entity.name,
          subjectLabel: entity.name,
          value,
          displayValue
        };
      });

      metricsByGroup[group].push({
        key: def.key,
        label: def.label,
        values,
        format: def.format,
        unit: def.unit,
        higherIsBetter: def.higherIsBetter
      });
    }
  }

  // Calculate rankings for each metric
  const rankings: Record<string, Record<string, number>> = {};
  const aggregateStats: AggregateComparisonResult['aggregateStats'] = {
    min: {},
    max: {},
    average: {}
  };

  for (const group of metricGroups) {
    const metrics = metricsByGroup[group];
    for (const metric of metrics) {
      const numericValues = metric.values
        .filter((v) => typeof v.value === 'number')
        .map((v) => ({ name: v.subjectId, value: v.value as number }));

      if (numericValues.length > 0) {
        // Calculate aggregate stats
        const values = numericValues.map((v) => v.value);
        aggregateStats.min[metric.key] = Math.min(...values);
        aggregateStats.max[metric.key] = Math.max(...values);
        aggregateStats.average[metric.key] = values.reduce((a, b) => a + b, 0) / values.length;

        // Calculate rankings (higher is better by default)
        const sorted = [...numericValues].sort((a, b) =>
          metric.higherIsBetter === false ? a.value - b.value : b.value - a.value
        );

        rankings[metric.key] = {};
        sorted.forEach((item, index) => {
          rankings[metric.key][item.name] = index + 1;
        });
      }
    }
  }

  return {
    type: 'aggregate',
    aggregateLevel,
    year,
    entities: aggregatedEntities,
    metricsByGroup,
    rankings,
    aggregateStats
  };
}

// ==========================================
// MAIN COMPARISON FUNCTION
// ==========================================

/**
 * Execute a comparison based on configuration
 */
export function executeComparison(
  config: ComparisonConfig,
  sitios: SitioRecord[]
): ComparisonResult | null {
  switch (config.type) {
    case 'temporal': {
      const selectedSitios = sitios.filter((s) => config.sitioIds.includes(s.id));
      if (selectedSitios.length === 0) return null;
      return calculateTemporalComparison(selectedSitios[0], config.years, config.metricGroups);
    }

    case 'spatial': {
      const selectedSitios = sitios.filter((s) => config.sitioIds.includes(s.id));
      if (selectedSitios.length === 0) return null;
      return calculateSpatialComparison(selectedSitios, config.years[0], config.metricGroups);
    }

    case 'aggregate': {
      if (!config.aggregateLevel || !config.aggregateEntities) return null;
      return calculateAggregateComparison(
        sitios,
        config.years[0],
        config.aggregateLevel,
        config.aggregateEntities,
        config.metricGroups,
        config.municipalityFilter
      );
    }

    default:
      return null;
  }
}

// ==========================================
// CHART DATA GENERATORS
// ==========================================

/**
 * Generate line chart data for temporal comparison
 */
export function generateTemporalLineChartData(
  result: TemporalComparisonResult,
  metricKeys: string[]
): ComparisonLineChartData {
  const categories = result.years.map(String);
  const series: ComparisonLineChartData['series'] = [];

  for (const group of Object.keys(result.metricsByGroup) as ComparisonMetricGroup[]) {
    const metrics = result.metricsByGroup[group];
    for (const metric of metrics) {
      if (metricKeys.includes(metric.key)) {
        series.push({
          name: metric.label,
          data: metric.values.map((v) => (typeof v.value === 'number' ? v.value : 0))
        });
      }
    }
  }

  return { categories, series };
}

/**
 * Generate bar chart data for spatial comparison
 */
export function generateSpatialBarChartData(
  result: SpatialComparisonResult,
  metricKey: string
): ComparisonBarChartData {
  const categories: string[] = [];
  const data: number[] = [];

  for (const group of Object.keys(result.metricsByGroup) as ComparisonMetricGroup[]) {
    const metrics = result.metricsByGroup[group];
    const metric = metrics.find((m) => m.key === metricKey);

    if (metric) {
      for (const value of metric.values) {
        categories.push(value.subjectLabel);
        data.push(typeof value.value === 'number' ? value.value : 0);
      }
      break;
    }
  }

  return {
    categories,
    series: [{ name: metricKey, data }]
  };
}

/**
 * Generate bar chart data for aggregate comparison
 */
export function generateAggregateBarChartData(
  result: AggregateComparisonResult,
  metricKey: string
): ComparisonBarChartData {
  const categories: string[] = [];
  const data: number[] = [];

  for (const group of Object.keys(result.metricsByGroup) as ComparisonMetricGroup[]) {
    const metrics = result.metricsByGroup[group];
    const metric = metrics.find((m) => m.key === metricKey);

    if (metric) {
      for (const value of metric.values) {
        categories.push(value.subjectLabel);
        data.push(typeof value.value === 'number' ? value.value : 0);
      }
      break;
    }
  }

  return {
    categories,
    series: [{ name: metricKey, data }]
  };
}

/**
 * Get chart data for a single metric across all subjects
 * Works for any comparison type
 */
export function generateSingleMetricChartData(
  result: ComparisonResult,
  metricKey: string
): { labels: string[]; values: number[]; metricLabel: string } | null {
  const labels: string[] = [];
  const values: number[] = [];
  let metricLabel = '';

  for (const group of Object.keys(result.metricsByGroup) as ComparisonMetricGroup[]) {
    const metrics = result.metricsByGroup[group];
    const metric = metrics.find((m) => m.key === metricKey);

    if (metric) {
      // Include unit in the label if available
      metricLabel = metric.unit ? `${metric.label} (${metric.unit})` : metric.label;
      for (const value of metric.values) {
        labels.push(value.subjectLabel);
        values.push(typeof value.value === 'number' ? value.value : 0);
      }
      return { labels, values, metricLabel };
    }
  }

  return null;
}

/**
 * Generate radar chart data for comparison overview
 */
export function generateRadarChartData(
  result: SpatialComparisonResult | TemporalComparisonResult | AggregateComparisonResult,
  normalizedMetricKeys: string[]
): ComparisonRadarChartData {
  const categories = normalizedMetricKeys;
  const series: ComparisonRadarChartData['series'] = [];

  if (result.type === 'spatial') {
    for (const sitio of result.sitios) {
      const data: number[] = [];
      for (const key of normalizedMetricKeys) {
        for (const group of Object.keys(result.metricsByGroup) as ComparisonMetricGroup[]) {
          const metric = result.metricsByGroup[group].find((m) => m.key === key);
          if (metric) {
            const value = metric.values.find((v) => v.subjectId === sitio.id.toString());
            // Normalize to 0-100 scale
            const numValue = typeof value?.value === 'number' ? value.value : 0;
            const max = result.aggregateStats.max[key] || 100;
            data.push(max > 0 ? (numValue / max) * 100 : 0);
            break;
          }
        }
      }
      series.push({
        name: `${sitio.sitioName}, ${sitio.barangay}`,
        data
      });
    }
  } else if (result.type === 'aggregate') {
    for (const entity of result.entities) {
      const data: number[] = [];
      for (const key of normalizedMetricKeys) {
        for (const group of Object.keys(result.metricsByGroup) as ComparisonMetricGroup[]) {
          const metric = result.metricsByGroup[group].find((m) => m.key === key);
          if (metric) {
            const value = metric.values.find((v) => v.subjectId === entity.name);
            // Normalize to 0-100 scale
            const numValue = typeof value?.value === 'number' ? value.value : 0;
            const max = result.aggregateStats.max[key] || 100;
            data.push(max > 0 ? (numValue / max) * 100 : 0);
            break;
          }
        }
      }
      series.push({
        name: entity.name,
        data
      });
    }
  }

  return { categories, series };
}
