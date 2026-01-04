/**
 * Sitio Indicators Configuration
 * Defines all sortable/filterable indicators with their categories,
 * accessor functions, and display formatting.
 */

import type { SitioProfile } from '$lib/types/sitio-profile';

// ==========================================
// INDICATOR CATEGORIES
// ==========================================

export const INDICATOR_CATEGORIES = {
  demographic: {
    key: 'demographic',
    label: 'Demographics & Population',
    description: 'Population, households, and vulnerable groups'
  },
  infrastructure: {
    key: 'infrastructure',
    label: 'Infrastructure & Utilities',
    description: 'Electricity, internet, roads, and facilities'
  },
  economic: {
    key: 'economic',
    label: 'Economic & Livelihood',
    description: 'Income, employment, and agriculture'
  },
  education: {
    key: 'education',
    label: 'Education',
    description: 'School facilities and education metrics'
  },
  waterSanitation: {
    key: 'waterSanitation',
    label: 'Water & Sanitation',
    description: 'Water sources and sanitation access'
  },
  safetyRisk: {
    key: 'safetyRisk',
    label: 'Safety & Risk',
    description: 'Hazards, food security, and safety concerns'
  },
  // priorityNeeds: {
  //   key: 'priorityNeeds',
  //   label: 'Priority Needs',
  //   description: 'Community-identified priority interventions'
  // },
  classification: {
    key: 'classification',
    label: 'Classification',
    description: 'GIDA, Indigenous, and Conflict-Affected status'
  }
} as const;

export type IndicatorCategory = keyof typeof INDICATOR_CATEGORIES;

// ==========================================
// INDICATOR DEFINITION TYPE
// ==========================================

export interface SitioIndicator {
  /** Unique identifier for the indicator */
  key: string;
  /** Display label */
  label: string;
  /** Short label for table headers */
  shortLabel: string;
  /** Category this indicator belongs to */
  category: IndicatorCategory;
  /** Function to extract value from SitioProfile */
  accessor: (profile: SitioProfile) => number;
  /** Default sort order */
  defaultOrder: 'asc' | 'desc';
  /** Format function for display */
  format: (value: number, profile?: SitioProfile) => string;
  /** Description/tooltip */
  description: string;
  /** Whether this is a percentage (0-100) */
  isPercentage?: boolean;
  /** Whether higher is better (for ranking context) */
  higherIsBetter?: boolean;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatCurrency = (value: number): string => {
  return `₱${value.toLocaleString()}`;
};

const formatDecimal = (value: number, decimals = 1): string => {
  return value.toFixed(decimals);
};

// Safe percentage calculation
const safePercent = (numerator: number, denominator: number): number => {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
};

// Count facilities that exist
const countExistingFacilities = (profile: SitioProfile): number => {
  const facilities = profile.facilities;
  return Object.values(facilities).filter((f) => f.exists === 'yes').length;
};

// Calculate average facility condition
const avgFacilityCondition = (profile: SitioProfile): number => {
  const facilities = Object.values(profile.facilities).filter(
    (f) => f.exists === 'yes' && f.condition
  );
  if (facilities.length === 0) return 0;
  const sum = facilities.reduce((acc, f) => acc + (f.condition || 0), 0);
  return sum / facilities.length;
};

// Calculate total road length
const totalRoadLength = (profile: SitioProfile): number => {
  return Object.values(profile.infrastructure).reduce((acc, road) => {
    return acc + (road.exists === 'yes' ? road.length || 0 : 0);
  }, 0);
};

// Calculate paved road percentage
const pavedRoadPercent = (profile: SitioProfile): number => {
  const total = totalRoadLength(profile);
  if (total === 0) return 0;
  const paved =
    (profile.infrastructure.asphalt.exists === 'yes'
      ? profile.infrastructure.asphalt.length || 0
      : 0) +
    (profile.infrastructure.concrete.exists === 'yes'
      ? profile.infrastructure.concrete.length || 0
      : 0);
  return (paved / total) * 100;
};

// Count water source levels available
const waterSourcesCount = (profile: SitioProfile): number => {
  return Object.values(profile.waterSources).filter((ws) => ws.exists === 'yes').length;
};

// Get highest water level (0-3)
const highestWaterLevel = (profile: SitioProfile): number => {
  if (profile.waterSources.level3.exists === 'yes') return 3;
  if (profile.waterSources.level2.exists === 'yes') return 2;
  if (profile.waterSources.level1.exists === 'yes') return 1;
  if (profile.waterSources.natural.exists === 'yes') return 0;
  return -1;
};

// Mobile signal to numeric (for sorting)
const mobileSignalToNumber = (signal: SitioProfile['mobileSignal']): number => {
  const map: Record<string, number> = { none: 0, '2g': 1, '3g': 2, '4g': 3, '5g': 4 };
  return map[signal] ?? 0;
};

// Total hazard frequency
const totalHazardFrequency = (profile: SitioProfile): number => {
  return (
    profile.hazards.flood.frequency +
    profile.hazards.landslide.frequency +
    profile.hazards.drought.frequency +
    profile.hazards.earthquake.frequency
  );
};

// Food security to numeric
const foodSecurityToNumber = (security: SitioProfile['foodSecurity']): number => {
  const map: Record<string, number> = { secure: 3, seasonal_scarcity: 2, critical_shortage: 1 };
  return map[security] ?? 0;
};

// Get priority rating by name
// const getPriorityRating = (profile: SitioProfile, name: string): number => {
//   const priority = profile.priorities.find((p) => p.name === name);
//   return priority?.rating ?? 0;
// };

// Total workers
const totalWorkers = (profile: SitioProfile): number => {
  const wc = profile.workerClass;
  return (
    wc.privateHousehold +
    wc.privateEstablishment +
    wc.government +
    wc.selfEmployed +
    wc.employer +
    wc.ofw
  );
};

// Employment rate
const employmentRate = (profile: SitioProfile): number => {
  if (profile.laborForceCount === 0) return 0;
  const employed = profile.laborForceCount - profile.vulnerableGroups.unemployedCount;
  return safePercent(employed, profile.laborForceCount);
};

// ==========================================
// INDICATOR DEFINITIONS
// ==========================================

export const SITIO_INDICATORS: SitioIndicator[] = [
  // ==========================================
  // DEMOGRAPHIC INDICATORS
  // ==========================================
  {
    key: 'totalPopulation',
    label: 'Total Population',
    shortLabel: 'Population',
    category: 'demographic',
    accessor: (p) => p.totalPopulation,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Total population of the sitio',
    higherIsBetter: undefined // Neutral
  },
  {
    key: 'totalHouseholds',
    label: 'Total Households',
    shortLabel: 'Households',
    category: 'demographic',
    accessor: (p) => p.totalHouseholds,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Total number of households',
    higherIsBetter: undefined
  },
  {
    key: 'registeredVoters',
    label: 'Registered Voters',
    shortLabel: 'Voters',
    category: 'demographic',
    accessor: (p) => p.registeredVoters,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of registered voters',
    higherIsBetter: undefined
  },
  {
    key: 'laborForceCount',
    label: 'Labor Force',
    shortLabel: 'Labor Force',
    category: 'demographic',
    accessor: (p) => p.laborForceCount,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Total labor force population',
    higherIsBetter: undefined
  },
  {
    key: 'schoolAgeChildren',
    label: 'School-Age Children',
    shortLabel: 'School Age',
    category: 'demographic',
    accessor: (p) => p.schoolAgeChildren,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of school-age children',
    higherIsBetter: undefined
  },
  {
    key: 'seniorsCount',
    label: 'Senior Citizens',
    shortLabel: 'Seniors',
    category: 'demographic',
    accessor: (p) => p.vulnerableGroups.seniorsCount,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of seniors (60+ years)',
    higherIsBetter: undefined
  },
  {
    key: 'ipCount',
    label: 'Indigenous Peoples',
    shortLabel: 'IP Count',
    category: 'demographic',
    accessor: (p) => p.vulnerableGroups.ipCount,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Indigenous peoples population',
    higherIsBetter: undefined
  },
  {
    key: 'muslimCount',
    label: 'Muslim Population',
    shortLabel: 'Muslim',
    category: 'demographic',
    accessor: (p) => p.vulnerableGroups.muslimCount,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Muslim population count',
    higherIsBetter: undefined
  },
  {
    key: 'outOfSchoolYouth',
    label: 'Out-of-School Youth',
    shortLabel: 'OSY',
    category: 'demographic',
    accessor: (p) => p.vulnerableGroups.outOfSchoolYouth,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of out-of-school youth',
    higherIsBetter: false
  },
  {
    key: 'noBirthCertCount',
    label: 'Without Birth Certificate',
    shortLabel: 'No Birth Cert',
    category: 'demographic',
    accessor: (p) => p.vulnerableGroups.noBirthCertCount,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Individuals without birth certificates',
    higherIsBetter: false
  },
  {
    key: 'noNationalIDCount',
    label: 'Without National ID',
    shortLabel: "No Nat'l ID",
    category: 'demographic',
    accessor: (p) => p.vulnerableGroups.noNationalIDCount,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Individuals without National ID',
    higherIsBetter: false
  },

  // ==========================================
  // INFRASTRUCTURE INDICATORS
  // ==========================================
  {
    key: 'electricityPercent',
    label: 'Electricity Access',
    shortLabel: 'Electricity %',
    category: 'infrastructure',
    accessor: (p) => safePercent(p.householdsWithElectricity, p.totalHouseholds),
    defaultOrder: 'desc',
    format: formatPercent,
    description: 'Percentage of households with electricity',
    isPercentage: true,
    higherIsBetter: true
  },
  {
    key: 'householdsWithElectricity',
    label: 'Households with Electricity',
    shortLabel: 'HH w/ Elec',
    category: 'infrastructure',
    accessor: (p) => p.householdsWithElectricity,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of households with electricity',
    higherIsBetter: true
  },
  {
    key: 'internetPercent',
    label: 'Internet Access',
    shortLabel: 'Internet %',
    category: 'infrastructure',
    accessor: (p) => safePercent(p.householdsWithInternet, p.totalHouseholds),
    defaultOrder: 'desc',
    format: formatPercent,
    description: 'Percentage of households with internet',
    isPercentage: true,
    higherIsBetter: true
  },
  {
    key: 'householdsWithInternet',
    label: 'Households with Internet',
    shortLabel: 'HH w/ Internet',
    category: 'infrastructure',
    accessor: (p) => p.householdsWithInternet,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of households with internet',
    higherIsBetter: true
  },
  {
    key: 'mobileSignal',
    label: 'Mobile Signal Quality',
    shortLabel: 'Signal',
    category: 'infrastructure',
    accessor: (p) => mobileSignalToNumber(p.mobileSignal),
    defaultOrder: 'desc',
    format: (v) => {
      const labels = ['None', '2G', '3G', '4G', '5G'];
      return labels[v] || 'Unknown';
    },
    description: 'Best available mobile signal',
    higherIsBetter: true
  },
  {
    key: 'facilityCount',
    label: 'Facilities Available',
    shortLabel: 'Facilities',
    category: 'infrastructure',
    accessor: countExistingFacilities,
    defaultOrder: 'desc',
    format: (v) => `${v}/8`,
    description: 'Number of community facilities (out of 8)',
    higherIsBetter: true
  },
  {
    key: 'avgFacilityCondition',
    label: 'Avg Facility Condition',
    shortLabel: 'Facility Cond',
    category: 'infrastructure',
    accessor: avgFacilityCondition,
    defaultOrder: 'desc',
    format: (v) => (v === 0 ? 'N/A' : formatDecimal(v, 1)),
    description: 'Average condition of facilities (1-5 scale)',
    higherIsBetter: true
  },
  {
    key: 'totalRoadLength',
    label: 'Total Road Length',
    shortLabel: 'Road Length',
    category: 'infrastructure',
    accessor: totalRoadLength,
    defaultOrder: 'desc',
    format: (v) => `${formatDecimal(v, 2)} km`,
    description: 'Total length of all road types',
    higherIsBetter: true
  },
  {
    key: 'pavedRoadPercent',
    label: 'Paved Road Coverage',
    shortLabel: 'Paved %',
    category: 'infrastructure',
    accessor: pavedRoadPercent,
    defaultOrder: 'desc',
    format: formatPercent,
    description: 'Percentage of roads that are paved (asphalt/concrete)',
    isPercentage: true,
    higherIsBetter: true
  },

  // ==========================================
  // ECONOMIC INDICATORS
  // ==========================================
  {
    key: 'averageDailyIncome',
    label: 'Average Daily Income',
    shortLabel: 'Daily Income',
    category: 'economic',
    accessor: (p) => p.averageDailyIncome,
    defaultOrder: 'desc',
    format: formatCurrency,
    description: 'Average household daily income',
    higherIsBetter: true
  },
  {
    key: 'employmentRate',
    label: 'Employment Rate',
    shortLabel: 'Employment %',
    category: 'economic',
    accessor: employmentRate,
    defaultOrder: 'desc',
    format: formatPercent,
    description: 'Percentage of labor force employed',
    isPercentage: true,
    higherIsBetter: true
  },
  {
    key: 'unemployedCount',
    label: 'Unemployed Count',
    shortLabel: 'Unemployed',
    category: 'economic',
    accessor: (p) => p.vulnerableGroups.unemployedCount,
    defaultOrder: 'asc',
    format: formatNumber,
    description: 'Number of unemployed persons',
    higherIsBetter: false
  },
  {
    key: 'ofwCount',
    label: 'OFW Count',
    shortLabel: 'OFWs',
    category: 'economic',
    accessor: (p) => p.workerClass.ofw,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of overseas Filipino workers',
    higherIsBetter: undefined
  },
  {
    key: 'totalWorkers',
    label: 'Total Workers',
    shortLabel: 'Workers',
    category: 'economic',
    accessor: totalWorkers,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Total employed workers',
    higherIsBetter: true
  },
  {
    key: 'numberOfFarmers',
    label: 'Number of Farmers',
    shortLabel: 'Farmers',
    category: 'economic',
    accessor: (p) => p.agriculture.numberOfFarmers,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of farmers in the sitio',
    higherIsBetter: undefined
  },
  {
    key: 'farmAreaHectares',
    label: 'Farm Area (Hectares)',
    shortLabel: 'Farm Area',
    category: 'economic',
    accessor: (p) => p.agriculture.estimatedFarmAreaHectares,
    defaultOrder: 'desc',
    format: (v) => `${formatDecimal(v, 1)} ha`,
    description: 'Estimated total farm area',
    higherIsBetter: undefined
  },
  {
    key: 'numberOfAssociations',
    label: 'Farmer Associations',
    shortLabel: 'Associations',
    category: 'economic',
    accessor: (p) => p.agriculture.numberOfAssociations,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of farmer associations',
    higherIsBetter: true
  },

  // ==========================================
  // EDUCATION INDICATORS
  // ==========================================
  {
    key: 'schoolAgeChildrenEducation',
    label: 'School-Age Children',
    shortLabel: 'School Age',
    category: 'education',
    accessor: (p) => p.schoolAgeChildren,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of school-age children',
    higherIsBetter: undefined
  },
  {
    key: 'outOfSchoolYouthEducation',
    label: 'Out-of-School Youth',
    shortLabel: 'OSY',
    category: 'education',
    accessor: (p) => p.vulnerableGroups.outOfSchoolYouth,
    defaultOrder: 'asc',
    format: formatNumber,
    description: 'Number of out-of-school youth',
    higherIsBetter: false
  },
  {
    key: 'hasKindergarten',
    label: 'Has Kindergarten',
    shortLabel: 'Kinder',
    category: 'education',
    accessor: (p) => (p.facilities.kindergarten.exists === 'yes' ? 1 : 0),
    defaultOrder: 'desc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Whether kindergarten facility exists',
    higherIsBetter: true
  },
  {
    key: 'hasElementarySchool',
    label: 'Has Elementary School',
    shortLabel: 'Elem School',
    category: 'education',
    accessor: (p) => (p.facilities.elementarySchool.exists === 'yes' ? 1 : 0),
    defaultOrder: 'desc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Whether elementary school exists',
    higherIsBetter: true
  },
  {
    key: 'hasHighSchool',
    label: 'Has High School',
    shortLabel: 'High School',
    category: 'education',
    accessor: (p) => (p.facilities.highSchool.exists === 'yes' ? 1 : 0),
    defaultOrder: 'desc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Whether high school exists',
    higherIsBetter: true
  },

  // ==========================================
  // WATER & SANITATION INDICATORS
  // ==========================================
  {
    key: 'toiletAccessPercent',
    label: 'Toilet Access',
    shortLabel: 'Toilet %',
    category: 'waterSanitation',
    accessor: (p) => safePercent(p.householdsWithToilet, p.totalHouseholds),
    defaultOrder: 'desc',
    format: formatPercent,
    description: 'Percentage of households with toilet',
    isPercentage: true,
    higherIsBetter: true
  },
  {
    key: 'householdsWithToilet',
    label: 'Households with Toilet',
    shortLabel: 'HH w/ Toilet',
    category: 'waterSanitation',
    accessor: (p) => p.householdsWithToilet,
    defaultOrder: 'desc',
    format: formatNumber,
    description: 'Number of households with toilet',
    higherIsBetter: true
  },
  {
    key: 'waterSourcesAvailable',
    label: 'Water Sources Available',
    shortLabel: 'Water Sources',
    category: 'waterSanitation',
    accessor: waterSourcesCount,
    defaultOrder: 'desc',
    format: (v) => `${v}/4`,
    description: 'Number of water source types available',
    higherIsBetter: true
  },
  {
    key: 'highestWaterLevel',
    label: 'Highest Water Level',
    shortLabel: 'Water Level',
    category: 'waterSanitation',
    accessor: highestWaterLevel,
    defaultOrder: 'desc',
    format: (v) => {
      if (v === -1) return 'None';
      if (v === 0) return 'Natural';
      return `Level ${v}`;
    },
    description: 'Highest water service level (0=Natural, 1-3=Levels)',
    higherIsBetter: true
  },
  {
    key: 'hasWaterSealed',
    label: 'Has Water-Sealed Toilet',
    shortLabel: 'Water Sealed',
    category: 'waterSanitation',
    accessor: (p) => (p.sanitationTypes.waterSealed ? 1 : 0),
    defaultOrder: 'desc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Whether water-sealed toilets are used',
    higherIsBetter: true
  },
  {
    key: 'hasOpenDefecation',
    label: 'Has Open Defecation',
    shortLabel: 'Open Defecation',
    category: 'waterSanitation',
    accessor: (p) => (p.sanitationTypes.openDefecation ? 1 : 0),
    defaultOrder: 'asc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Whether open defecation is practiced',
    higherIsBetter: false
  },

  // ==========================================
  // SAFETY & RISK INDICATORS
  // ==========================================
  {
    key: 'totalHazardFrequency',
    label: 'Total Hazard Frequency',
    shortLabel: 'Hazard Freq',
    category: 'safetyRisk',
    accessor: totalHazardFrequency,
    defaultOrder: 'asc',
    format: (v) => `${v} events`,
    description: 'Total hazard occurrences in past 12 months',
    higherIsBetter: false
  },
  {
    key: 'floodFrequency',
    label: 'Flood Frequency',
    shortLabel: 'Floods',
    category: 'safetyRisk',
    accessor: (p) => p.hazards.flood.frequency,
    defaultOrder: 'asc',
    format: (v) => `${v}x`,
    description: 'Flood occurrences in past 12 months',
    higherIsBetter: false
  },
  {
    key: 'landslideFrequency',
    label: 'Landslide Frequency',
    shortLabel: 'Landslides',
    category: 'safetyRisk',
    accessor: (p) => p.hazards.landslide.frequency,
    defaultOrder: 'asc',
    format: (v) => `${v}x`,
    description: 'Landslide occurrences in past 12 months',
    higherIsBetter: false
  },
  {
    key: 'droughtFrequency',
    label: 'Drought Frequency',
    shortLabel: 'Droughts',
    category: 'safetyRisk',
    accessor: (p) => p.hazards.drought.frequency,
    defaultOrder: 'asc',
    format: (v) => `${v}x`,
    description: 'Drought occurrences in past 12 months',
    higherIsBetter: false
  },
  {
    key: 'foodSecurityLevel',
    label: 'Food Security Level',
    shortLabel: 'Food Security',
    category: 'safetyRisk',
    accessor: (p) => foodSecurityToNumber(p.foodSecurity),
    defaultOrder: 'desc',
    format: (v) => {
      const labels: Record<number, string> = { 3: 'Secure', 2: 'Seasonal Scarcity', 1: 'Critical' };
      return labels[v] || 'Unknown';
    },
    description: 'Food security status',
    higherIsBetter: true
  },

  // ==========================================
  // PRIORITY NEEDS INDICATORS
  // ==========================================
  // {
  //   key: 'averageNeedScore',
  //   label: 'Average Need Score',
  //   shortLabel: 'Need Score',
  //   category: 'priorityNeeds',
  //   accessor: (p) => p.averageNeedScore,
  //   defaultOrder: 'desc',
  //   format: (v) => formatDecimal(v, 2),
  //   description: 'Overall average priority need score',
  //   higherIsBetter: false // Higher need = more urgent
  // },
  // {
  //   key: 'waterSystemPriority',
  //   label: 'Water System Priority',
  //   shortLabel: 'Water Priority',
  //   category: 'priorityNeeds',
  //   accessor: (p) => getPriorityRating(p, 'waterSystem'),
  //   defaultOrder: 'desc',
  //   format: (v) => {
  //     const labels = ['Not Needed', 'Low', 'Medium', 'Very Urgent'];
  //     return labels[v] || 'Unknown';
  //   },
  //   description: 'Water system intervention priority (0-3)',
  //   higherIsBetter: false
  // },
  // {
  //   key: 'communityCRPriority',
  //   label: 'Community CR Priority',
  //   shortLabel: 'CR Priority',
  //   category: 'priorityNeeds',
  //   accessor: (p) => getPriorityRating(p, 'communityCR'),
  //   defaultOrder: 'desc',
  //   format: (v) => {
  //     const labels = ['Not Needed', 'Low', 'Medium', 'Very Urgent'];
  //     return labels[v] || 'Unknown';
  //   },
  //   description: 'Community comfort room priority (0-3)',
  //   higherIsBetter: false
  // },
  // {
  //   key: 'roadOpeningPriority',
  //   label: 'Road Opening Priority',
  //   shortLabel: 'Road Priority',
  //   category: 'priorityNeeds',
  //   accessor: (p) => getPriorityRating(p, 'roadOpening'),
  //   defaultOrder: 'desc',
  //   format: (v) => {
  //     const labels = ['Not Needed', 'Low', 'Medium', 'Very Urgent'];
  //     return labels[v] || 'Unknown';
  //   },
  //   description: 'Road opening intervention priority (0-3)',
  //   higherIsBetter: false
  // },
  // {
  //   key: 'healthServicesPriority',
  //   label: 'Health Services Priority',
  //   shortLabel: 'Health Priority',
  //   category: 'priorityNeeds',
  //   accessor: (p) => getPriorityRating(p, 'healthServices'),
  //   defaultOrder: 'desc',
  //   format: (v) => {
  //     const labels = ['Not Needed', 'Low', 'Medium', 'Very Urgent'];
  //     return labels[v] || 'Unknown';
  //   },
  //   description: 'Health services intervention priority (0-3)',
  //   higherIsBetter: false
  // },
  // {
  //   key: 'educationSupportPriority',
  //   label: 'Education Support Priority',
  //   shortLabel: 'Edu Priority',
  //   category: 'priorityNeeds',
  //   accessor: (p) => getPriorityRating(p, 'educationSupport'),
  //   defaultOrder: 'desc',
  //   format: (v) => {
  //     const labels = ['Not Needed', 'Low', 'Medium', 'Very Urgent'];
  //     return labels[v] || 'Unknown';
  //   },
  //   description: 'Education support priority (0-3)',
  //   higherIsBetter: false
  // },

  // ==========================================
  // CLASSIFICATION INDICATORS
  // ==========================================
  {
    key: 'isGIDA',
    label: 'GIDA Classification',
    shortLabel: 'GIDA',
    category: 'classification',
    accessor: (p) => (p.sitioClassification.gida ? 1 : 0),
    defaultOrder: 'desc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Geographically Isolated and Disadvantaged Area',
    higherIsBetter: undefined
  },
  {
    key: 'isIndigenous',
    label: 'Indigenous Community',
    shortLabel: 'Indigenous',
    category: 'classification',
    accessor: (p) => (p.sitioClassification.indigenous ? 1 : 0),
    defaultOrder: 'desc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Indigenous peoples community',
    higherIsBetter: undefined
  },
  {
    key: 'isConflictAffected',
    label: 'Conflict-Affected',
    shortLabel: 'Conflict',
    category: 'classification',
    accessor: (p) => (p.sitioClassification.conflict ? 1 : 0),
    defaultOrder: 'desc',
    format: (v) => (v === 1 ? 'Yes' : 'No'),
    description: 'Conflict-affected area (past 3 years)',
    higherIsBetter: undefined
  }
];

// ==========================================
// HELPER MAPS AND UTILITIES
// ==========================================

/** Map of indicator key to indicator definition */
export const INDICATORS_MAP = new Map<string, SitioIndicator>(
  SITIO_INDICATORS.map((ind) => [ind.key, ind])
);

/** Get indicator by key */
export function getIndicator(key: string): SitioIndicator | undefined {
  return INDICATORS_MAP.get(key);
}

/** Get indicators by category */
export function getIndicatorsByCategory(category: IndicatorCategory): SitioIndicator[] {
  return SITIO_INDICATORS.filter((ind) => ind.category === category);
}

/** Get all categories with their indicators */
export function getCategorizedIndicators(): Array<{
  category: (typeof INDICATOR_CATEGORIES)[IndicatorCategory];
  indicators: SitioIndicator[];
}> {
  return Object.values(INDICATOR_CATEGORIES).map((cat) => ({
    category: cat,
    indicators: getIndicatorsByCategory(cat.key as IndicatorCategory)
  }));
}

// ==========================================
// PRESET SORT CONFIGURATIONS
// ==========================================

export interface SortPreset {
  key: string;
  label: string;
  description: string;
  indicators: Array<{ key: string; order: 'asc' | 'desc' }>;
}

export const SORT_PRESETS: SortPreset[] = [
  {
    key: 'highest-need',
    label: 'Highest Need',
    description: 'Sitios with highest priority needs',
    indicators: [
      { key: 'averageNeedScore', order: 'desc' },
      { key: 'totalPopulation', order: 'desc' }
    ]
  },
  {
    key: 'lowest-infrastructure',
    label: 'Lowest Infrastructure',
    description: 'Sitios with least infrastructure',
    indicators: [
      { key: 'electricityPercent', order: 'asc' },
      { key: 'toiletAccessPercent', order: 'asc' },
      { key: 'internetPercent', order: 'asc' }
    ]
  },
  {
    key: 'population-ranking',
    label: 'Population Ranking',
    description: 'Largest sitios by population',
    indicators: [
      { key: 'totalPopulation', order: 'desc' },
      { key: 'totalHouseholds', order: 'desc' }
    ]
  },
  {
    key: 'economic-priority',
    label: 'Economic Priority',
    description: 'Sitios needing economic intervention',
    indicators: [
      { key: 'averageDailyIncome', order: 'asc' },
      { key: 'unemployedCount', order: 'desc' },
      { key: 'totalPopulation', order: 'desc' }
    ]
  }
];
