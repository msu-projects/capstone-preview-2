/**
 * Sitio Chart Aggregation Utilities
 * Comprehensive aggregation functions for public sitios dashboard charts
 * Processes SitioRecord[] data with yearlyData structure for visualization
 * Updated to match new SitioProfile interface
 */

import {
  type IncomeClusterCounts,
  createEmptyIncomeClusterCounts,
  getIncomeCluster
} from '$lib/config/poverty-thresholds';
import type { SitioProfile, SitioRecord } from '$lib/types';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get the latest year's data from a SitioRecord
 */
export function getLatestYearData(sitioRecord: SitioRecord): SitioProfile | null {
  if (!sitioRecord.availableYears || sitioRecord.availableYears.length === 0) {
    return null;
  }

  const latestYear = Math.max(...sitioRecord.availableYears);
  return sitioRecord.yearlyData[latestYear.toString()] || null;
}

/**
 * Get data for a specific year from a SitioRecord
 */
export function getDataForYear(sitioRecord: SitioRecord, year: number): SitioProfile | null {
  return sitioRecord.yearlyData[year.toString()] || null;
}

/**
 * Get data for a specific year or latest year if no year is specified
 * This is the recommended function to use in aggregation functions
 */
export function getDataForYearOrLatest(
  sitioRecord: SitioRecord,
  year?: number
): SitioProfile | null {
  if (year !== undefined) {
    return getDataForYear(sitioRecord, year);
  }
  return getLatestYearData(sitioRecord);
}

// ==========================================
// YEAR-OVER-YEAR COMPARISON TYPES & FUNCTIONS
// ==========================================

/**
 * Represents a trend/change from one period to another
 */
export interface YoYTrend {
  value: number;
  label: string;
  isPositive: boolean;
}

/**
 * Calculate year-over-year percentage change
 */
export function calculateYoYChange(currentValue: number, previousValue: number): YoYTrend | null {
  if (previousValue === 0 && currentValue === 0) return null;
  if (previousValue === 0) {
    return { value: 100, label: 'vs last year', isPositive: currentValue > 0 };
  }

  const change = ((currentValue - previousValue) / previousValue) * 100;
  return {
    value: Math.round(change * 10) / 10,
    label: 'vs last year',
    isPositive: change >= 0
  };
}

/**
 * Data point for time series charts
 */
export interface TimeSeriesDataPoint {
  year: number;
  value: number;
}

/**
 * Multi-series time series for charts with multiple lines
 */
export interface MultiSeriesTimeData {
  name: string;
  data: number[];
  color?: string;
}

/**
 * Aggregated metrics for a specific year
 */
export interface YearlyMetrics {
  year: number;
  totalPopulation: number;
  totalMale: number;
  totalFemale: number;
  totalHouseholds: number;
  totalLaborWorkforce: number;
  totalUnemployed: number;
  employmentRate: number;
  participationRate: number;
  averageDailyIncome: number;
  sitiosWithIncome: number;
  electricityPercent: number;
  toiletPercent: number;
  internetPercent: number;
  householdsWithElectricity: number;
  householdsWithToilet: number;
  householdsWithInternet: number;
  totalRoadLength: number;
  roadConcrete: number;
  roadAsphalt: number;
  roadGravel: number;
  roadNatural: number;
  incomeClusterCounts: IncomeClusterCounts;
  sitioCount: number;
  // Age groups
  youth: number;
  workingAge: number;
  elderly: number;
  // Cultural & demographic groups
  totalSchoolAgeChildren: number;
  totalMuslim: number;
  totalIP: number;
  totalVoters: number;
  // Vulnerable sectors
  totalSeniors: number;
  totalOSY: number;
  totalNoBirthCert: number;
  totalNoNationalID: number;
  // Agriculture metrics
  totalFarmers: number;
  totalFarmerOrgs: number;
  totalFarmArea: number;
  // Pets metrics
  totalDogs: number;
  totalCats: number;
  vaccinatedDogs: number;
  vaccinatedCats: number;
  // Water sources (functional counts)
  waterNaturalFunctioning: number;
  waterLevel1Functioning: number;
  waterLevel2Functioning: number;
  waterLevel3Functioning: number;
  // Sanitation types
  sanitationWaterSealed: number;
  sanitationPitLatrine: number;
  sanitationCommunityCR: number;
  sanitationOpenDefecation: number;
  // Mobile signal coverage
  signal5G: number;
  signal4G: number;
  signal3G: number;
  signal2G: number;
  signalNone: number;
  // Classroom density
  studentsPerRoomLessThan46: number;
  studentsPerRoom46_50: number;
  studentsPerRoom51_55: number;
  studentsPerRoomMoreThan56: number;
  studentsPerRoomNoClassroom: number;
}

/**
 * Aggregate metrics for a specific year across all sitios
 */
export function aggregateMetricsForYear(sitios: SitioRecord[], year: number): YearlyMetrics {
  let totalPopulation = 0;
  let totalMale = 0;
  let totalFemale = 0;
  let totalHouseholds = 0;
  let totalLaborWorkforce = 0;
  let totalUnemployed = 0;
  let householdsWithElectricity = 0;
  let householdsWithToilet = 0;
  let householdsWithInternet = 0;
  let totalDailyIncome = 0;
  let sitiosWithIncome = 0;
  let totalRoadLength = 0;
  let roadConcrete = 0;
  let roadAsphalt = 0;
  let roadGravel = 0;
  let roadNatural = 0;
  const incomeClusterCounts = createEmptyIncomeClusterCounts();
  let sitioCount = 0;
  // Cultural & demographic groups
  let totalSchoolAgeChildren = 0;
  let totalMuslim = 0;
  let totalIP = 0;
  let totalVoters = 0;
  // Vulnerable sectors
  let totalSeniors = 0;
  let totalOSY = 0;
  let totalNoBirthCert = 0;
  let totalNoNationalID = 0;
  let totalLaborForce60to64 = 0;
  // Agriculture metrics
  let totalFarmers = 0;
  let totalFarmerOrgs = 0;
  let totalFarmArea = 0;
  // Pets metrics
  let totalDogs = 0;
  let totalCats = 0;
  let vaccinatedDogs = 0;
  let vaccinatedCats = 0;
  // Water sources (functional counts)
  let waterNaturalFunctioning = 0;
  let waterLevel1Functioning = 0;
  let waterLevel2Functioning = 0;
  let waterLevel3Functioning = 0;
  // Sanitation types
  let sanitationWaterSealed = 0;
  let sanitationPitLatrine = 0;
  let sanitationCommunityCR = 0;
  let sanitationOpenDefecation = 0;
  // Mobile signal coverage
  let signal5G = 0;
  let signal4G = 0;
  let signal3G = 0;
  let signal2G = 0;
  let signalNone = 0;
  // Classroom density
  let studentsPerRoomLessThan46 = 0;
  let studentsPerRoom46_50 = 0;
  let studentsPerRoom51_55 = 0;
  let studentsPerRoomMoreThan56 = 0;
  let studentsPerRoomNoClassroom = 0;

  for (const sitio of sitios) {
    const profile = getDataForYear(sitio, year);
    if (!profile) continue;

    sitioCount++;
    totalPopulation += profile.totalPopulation || 0;
    totalMale += profile.population?.totalMale || 0;
    totalFemale += profile.population?.totalFemale || 0;
    totalHouseholds += profile.totalHouseholds || 0;
    totalLaborWorkforce += profile.laborForceCount || 0;
    totalUnemployed += profile.vulnerableGroups?.unemployedCount || 0;
    householdsWithElectricity += profile.householdsWithElectricity || 0;
    householdsWithToilet += profile.householdsWithToilet || 0;
    householdsWithInternet += profile.householdsWithInternet || 0;

    // Cultural & demographic groups
    totalSchoolAgeChildren += profile.schoolAgeChildren || 0;
    totalMuslim += profile.vulnerableGroups?.muslimCount || 0;
    totalIP += profile.vulnerableGroups?.ipCount || 0;
    totalVoters += profile.registeredVoters || 0;

    // Vulnerable sectors
    totalSeniors += profile.vulnerableGroups?.seniorsCount || 0;
    totalOSY += profile.vulnerableGroups?.outOfSchoolYouth || 0;
    totalNoBirthCert += profile.vulnerableGroups?.noBirthCertCount || 0;
    totalNoNationalID += profile.vulnerableGroups?.noNationalIDCount || 0;
    totalLaborForce60to64 += profile.vulnerableGroups?.laborForce60to64Count || 0;

    // Road lengths
    const concreteLength = profile.infrastructure?.concrete?.length || 0;
    const asphaltLength = profile.infrastructure?.asphalt?.length || 0;
    const gravelLength = profile.infrastructure?.gravel?.length || 0;
    const naturalLength = profile.infrastructure?.natural?.length || 0;

    roadConcrete += concreteLength;
    roadAsphalt += asphaltLength;
    roadGravel += gravelLength;
    roadNatural += naturalLength;
    totalRoadLength += concreteLength + asphaltLength + gravelLength + naturalLength;

    // Income data
    if (profile.averageDailyIncome && profile.averageDailyIncome > 0) {
      totalDailyIncome += profile.averageDailyIncome;
      sitiosWithIncome++;

      // Income cluster classification (7-tier system)
      const cluster = getIncomeCluster(profile.averageDailyIncome);
      incomeClusterCounts[cluster]++;
    }

    // Agriculture metrics
    totalFarmers += profile.agriculture?.numberOfFarmers || 0;
    totalFarmerOrgs += profile.agriculture?.numberOfAssociations || 0;
    totalFarmArea += profile.agriculture?.estimatedFarmAreaHectares || 0;

    // Pets metrics
    totalDogs += profile.pets?.dogsCount || 0;
    totalCats += profile.pets?.catsCount || 0;
    vaccinatedDogs += profile.pets?.vaccinatedDogs || 0;
    vaccinatedCats += profile.pets?.vaccinatedCats || 0;

    // Water sources (functional counts)
    waterNaturalFunctioning += profile.waterSources?.natural?.functioningCount || 0;
    waterLevel1Functioning += profile.waterSources?.level1?.functioningCount || 0;
    waterLevel2Functioning += profile.waterSources?.level2?.functioningCount || 0;
    waterLevel3Functioning += profile.waterSources?.level3?.functioningCount || 0;

    // Sanitation types (count sitios using each type)
    if (profile.sanitationTypes?.waterSealed) sanitationWaterSealed++;
    if (profile.sanitationTypes?.pitLatrine) sanitationPitLatrine++;
    if (profile.sanitationTypes?.communityCR) sanitationCommunityCR++;
    if (profile.sanitationTypes?.openDefecation) sanitationOpenDefecation++;

    // Mobile signal coverage
    const signal = profile.mobileSignal;
    if (signal === '5g') signal5G++;
    else if (signal === '4g') signal4G++;
    else if (signal === '3g') signal3G++;
    else if (signal === '2g') signal2G++;
    else if (signal === 'none' || !signal) signalNone++;

    // Classroom density (students per room ratio)
    const studentsPerRoom = profile.studentsPerRoom;
    if (!studentsPerRoom || studentsPerRoom === 'no_classroom') {
      studentsPerRoomNoClassroom++;
    } else if (studentsPerRoom === 'less_than_46') {
      studentsPerRoomLessThan46++;
    } else if (studentsPerRoom === '46_50') {
      studentsPerRoom46_50++;
    } else if (studentsPerRoom === '51_55') {
      studentsPerRoom51_55++;
    } else if (studentsPerRoom === 'more_than_56') {
      studentsPerRoomMoreThan56++;
    }
  }

  const employed = totalLaborWorkforce - totalUnemployed;

  // Calculate age groups based on available data (same logic as aggregateDemographics)
  // Working Age (15-64) = laborForceCount
  const workingAge = totalLaborWorkforce;
  // Elderly (65+) = seniorsCount (60+) - laborForce60to64Count (60-64 who still work)
  const elderly = Math.max(0, totalSeniors - totalLaborForce60to64);
  // Youth (0-14) = totalPopulation - workingAge - elderly
  const youth = Math.max(0, totalPopulation - workingAge - elderly);

  return {
    year,
    totalPopulation,
    totalMale,
    totalFemale,
    totalHouseholds,
    totalLaborWorkforce,
    totalUnemployed,
    employmentRate: totalLaborWorkforce > 0 ? (employed / totalLaborWorkforce) * 100 : 0,
    participationRate: totalPopulation > 0 ? (totalLaborWorkforce / totalPopulation) * 100 : 0,
    averageDailyIncome: sitiosWithIncome > 0 ? totalDailyIncome / sitiosWithIncome : 0,
    sitiosWithIncome,
    electricityPercent:
      totalHouseholds > 0 ? (householdsWithElectricity / totalHouseholds) * 100 : 0,
    toiletPercent: totalHouseholds > 0 ? (householdsWithToilet / totalHouseholds) * 100 : 0,
    internetPercent: totalHouseholds > 0 ? (householdsWithInternet / totalHouseholds) * 100 : 0,
    householdsWithElectricity,
    householdsWithToilet,
    householdsWithInternet,
    totalRoadLength,
    roadConcrete,
    roadAsphalt,
    roadGravel,
    roadNatural,
    incomeClusterCounts,
    sitioCount,
    // Age groups
    youth,
    workingAge,
    elderly,
    // Cultural & demographic groups
    totalSchoolAgeChildren,
    totalMuslim,
    totalIP,
    totalVoters,
    // Vulnerable sectors
    totalSeniors,
    totalOSY,
    totalNoBirthCert,
    totalNoNationalID,
    // Agriculture metrics
    totalFarmers,
    totalFarmerOrgs,
    totalFarmArea,
    // Pets metrics
    totalDogs,
    totalCats,
    vaccinatedDogs,
    vaccinatedCats,
    // Water sources
    waterNaturalFunctioning,
    waterLevel1Functioning,
    waterLevel2Functioning,
    waterLevel3Functioning,
    // Sanitation types
    sanitationWaterSealed,
    sanitationPitLatrine,
    sanitationCommunityCR,
    sanitationOpenDefecation,
    // Mobile signal coverage
    signal5G,
    signal4G,
    signal3G,
    signal2G,
    signalNone,
    // Classroom density
    studentsPerRoomLessThan46,
    studentsPerRoom46_50,
    studentsPerRoom51_55,
    studentsPerRoomMoreThan56,
    studentsPerRoomNoClassroom
  };
}

/**
 * Get metrics for multiple years for time-series charts
 */
export function getMultiYearMetrics(sitios: SitioRecord[]): YearlyMetrics[] {
  const years = getAllAvailableYears(sitios);
  return years.map((year) => aggregateMetricsForYear(sitios, year)).reverse(); // oldest first
}

/**
 * Get comparison between two years
 */
export interface YearComparison {
  current: YearlyMetrics;
  previous: YearlyMetrics | null;
  trends: {
    population: YoYTrend | null;
    households: YoYTrend | null;
    voters: YoYTrend | null;
    laborWorkforce: YoYTrend | null;
    employmentRate: YoYTrend | null;
    averageIncome: YoYTrend | null;
    electricityAccess: YoYTrend | null;
    toiletAccess: YoYTrend | null;
    internetAccess: YoYTrend | null;
    roadLength: YoYTrend | null;
    poorCount: YoYTrend | null;
  };
}

/**
 * Get year-over-year comparison data
 */
export function getYearComparison(sitios: SitioRecord[], currentYear: number): YearComparison {
  const years = getAllAvailableYears(sitios).sort((a, b) => b - a);
  const currentYearIndex = years.indexOf(currentYear);
  const previousYear = currentYearIndex < years.length - 1 ? years[currentYearIndex + 1] : null;

  const current = aggregateMetricsForYear(sitios, currentYear);
  const previous = previousYear ? aggregateMetricsForYear(sitios, previousYear) : null;

  return {
    current,
    previous,
    trends: {
      population: previous
        ? calculateYoYChange(current.totalPopulation, previous.totalPopulation)
        : null,
      households: previous
        ? calculateYoYChange(current.totalHouseholds, previous.totalHouseholds)
        : null,
      voters: previous ? calculateYoYChange(current.totalVoters, previous.totalVoters) : null,
      laborWorkforce: previous
        ? calculateYoYChange(current.totalLaborWorkforce, previous.totalLaborWorkforce)
        : null,
      employmentRate: previous
        ? calculateYoYChange(current.employmentRate, previous.employmentRate)
        : null,
      averageIncome: previous
        ? calculateYoYChange(current.averageDailyIncome, previous.averageDailyIncome)
        : null,
      electricityAccess: previous
        ? calculateYoYChange(current.electricityPercent, previous.electricityPercent)
        : null,
      toiletAccess: previous
        ? calculateYoYChange(current.toiletPercent, previous.toiletPercent)
        : null,
      internetAccess: previous
        ? calculateYoYChange(current.internetPercent, previous.internetPercent)
        : null,
      roadLength: previous
        ? calculateYoYChange(current.totalRoadLength, previous.totalRoadLength)
        : null,
      poorCount: previous
        ? {
            ...calculateYoYChange(
              current.incomeClusterCounts.poor,
              previous.incomeClusterCounts.poor
            )!,
            // For poverty, decrease is positive
            isPositive: current.incomeClusterCounts.poor <= previous.incomeClusterCounts.poor
          }
        : null
    }
  };
}

/**
 * Prepare time-series data for LineChart component
 */
export function prepareTimeSeriesData(
  sitios: SitioRecord[],
  metrics: (keyof YearlyMetrics)[]
): { categories: string[]; series: MultiSeriesTimeData[] } {
  const yearlyMetrics = getMultiYearMetrics(sitios);
  const categories = yearlyMetrics.map((m) => m.year.toString());

  const metricLabels: Record<string, string> = {
    totalPopulation: 'Population',
    totalMale: 'Male',
    totalFemale: 'Female',
    totalHouseholds: 'Households',
    totalLaborWorkforce: 'Labor Force',
    totalUnemployed: 'Unemployed',
    employmentRate: 'Employment Rate',
    participationRate: 'Participation Rate',
    averageDailyIncome: 'Avg Daily Income',
    electricityPercent: 'Electricity',
    toiletPercent: 'Sanitation',
    internetPercent: 'Internet',
    householdsWithElectricity: 'Electricity',
    householdsWithToilet: 'Sanitary Toilet',
    householdsWithInternet: 'Internet',
    totalRoadLength: 'Road Length (km)',
    roadConcrete: 'Concrete Roads',
    roadAsphalt: 'Asphalt Roads',
    roadGravel: 'Gravel Roads',
    roadNatural: 'Natural Roads',
    povertyCount: 'Below Poverty',
    // Age groups
    youth: 'Youth (0-14)',
    workingAge: 'Working Age (15-64)',
    elderly: 'Elderly (65+)',
    // Cultural & demographic groups
    totalSchoolAgeChildren: 'School-Age Children',
    totalMuslim: 'Muslim',
    totalIP: 'Indigenous People',
    totalVoters: 'Registered Voters',
    // Vulnerable sectors
    totalSeniors: 'Senior Citizens',
    totalOSY: 'Out of School Youth',
    totalNoBirthCert: 'No Birth Certificate',
    totalNoNationalID: 'No PhilSys ID',
    // Agriculture
    totalFarmers: 'Farmers',
    totalFarmerOrgs: 'Farmer Organizations',
    totalFarmArea: 'Farm Area (ha)',
    // Pets
    totalDogs: 'Dogs',
    totalCats: 'Cats',
    vaccinatedDogs: 'Vaccinated Dogs',
    vaccinatedCats: 'Vaccinated Cats',
    // Water sources
    waterNaturalFunctioning: 'Natural Source (Functional)',
    waterLevel1Functioning: 'Level 1 (Functional)',
    waterLevel2Functioning: 'Level 2 (Functional)',
    waterLevel3Functioning: 'Level 3 (Functional)',
    // Sanitation
    sanitationWaterSealed: 'Water Sealed',
    sanitationPitLatrine: 'Pit Latrine',
    sanitationCommunityCR: 'Community CR',
    sanitationOpenDefecation: 'Open Defecation',
    // Signal coverage
    signal5G: '5G Coverage',
    signal4G: '4G Coverage',
    signal3G: '3G Coverage',
    signal2G: '2G Coverage',
    signalNone: 'No Signal',
    // Classroom density
    studentsPerRoomLessThan46: '<46 Students/Room',
    studentsPerRoom46_50: '46-50 Students/Room',
    studentsPerRoom51_55: '51-55 Students/Room',
    studentsPerRoomMoreThan56: '>56 Students/Room',
    studentsPerRoomNoClassroom: 'No Classroom'
  };

  const metricColors: Record<string, string> = {
    totalPopulation: 'hsl(217, 91%, 60%)',
    totalMale: 'hsl(217, 91%, 60%)',
    totalFemale: 'hsl(330, 81%, 60%)',
    totalHouseholds: 'hsl(142, 71%, 45%)',
    totalLaborWorkforce: 'hsl(262, 83%, 58%)',
    totalUnemployed: 'hsl(0, 84%, 60%)',
    employmentRate: 'hsl(142, 71%, 45%)',
    participationRate: 'hsl(217, 91%, 60%)',
    averageDailyIncome: 'hsl(142, 71%, 45%)',
    electricityPercent: 'hsl(45, 93%, 47%)',
    toiletPercent: 'hsl(187, 85%, 43%)',
    internetPercent: 'hsl(217, 91%, 60%)',
    householdsWithElectricity: 'hsl(45, 93%, 47%)',
    householdsWithToilet: 'hsl(217, 91%, 60%)',
    householdsWithInternet: 'hsl(142, 71%, 45%)',
    totalRoadLength: 'hsl(25, 95%, 53%)',
    roadConcrete: 'hsl(217, 91%, 60%)',
    roadAsphalt: 'hsl(215, 20%, 55%)',
    roadGravel: 'hsl(27, 87%, 67%)',
    roadNatural: 'hsl(25, 5%, 45%)',
    povertyCount: 'hsl(0, 84%, 60%)',
    // Age groups
    youth: 'hsl(25, 95%, 60%)',
    workingAge: 'hsl(217, 91%, 60%)',
    elderly: 'hsl(200, 18%, 60%)',
    // Cultural & demographic groups
    totalSchoolAgeChildren: 'hsl(217, 91%, 60%)',
    totalMuslim: 'hsl(142, 71%, 45%)',
    totalIP: 'hsl(263, 70%, 50%)',
    totalVoters: 'hsl(280, 65%, 60%)',
    // Vulnerable sectors
    totalSeniors: 'hsl(25, 95%, 53%)',
    totalOSY: 'hsl(0, 84%, 60%)',
    totalNoBirthCert: 'hsl(45, 93%, 47%)',
    totalNoNationalID: 'hsl(200, 18%, 46%)',
    // Agriculture
    totalFarmers: 'hsl(38, 92%, 50%)',
    totalFarmerOrgs: 'hsl(142, 71%, 45%)',
    totalFarmArea: 'hsl(120, 60%, 50%)',
    // Pets
    totalDogs: 'hsl(38, 92%, 50%)',
    totalCats: 'hsl(24, 95%, 53%)',
    vaccinatedDogs: 'hsl(142, 71%, 45%)',
    vaccinatedCats: 'hsl(173, 80%, 40%)',
    // Water sources
    waterNaturalFunctioning: 'hsl(142, 71%, 45%)',
    waterLevel1Functioning: 'hsl(217, 91%, 60%)',
    waterLevel2Functioning: 'hsl(45, 93%, 47%)',
    waterLevel3Functioning: 'hsl(263, 70%, 50%)',
    // Sanitation
    sanitationWaterSealed: 'hsl(142, 71%, 45%)',
    sanitationPitLatrine: 'hsl(45, 93%, 47%)',
    sanitationCommunityCR: 'hsl(217, 91%, 60%)',
    sanitationOpenDefecation: 'hsl(0, 84%, 60%)',
    // Signal coverage
    signal5G: 'hsl(142, 71%, 45%)',
    signal4G: 'hsl(217, 91%, 60%)',
    signal3G: 'hsl(45, 93%, 47%)',
    signal2G: 'hsl(27, 87%, 67%)',
    signalNone: 'hsl(0, 84%, 60%)',
    // Classroom density
    studentsPerRoomLessThan46: 'hsl(217, 91%, 60%)',
    studentsPerRoom46_50: 'hsl(45, 93%, 47%)',
    studentsPerRoom51_55: 'hsl(25, 95%, 53%)',
    studentsPerRoomMoreThan56: 'hsl(0, 84%, 60%)',
    studentsPerRoomNoClassroom: 'hsl(0, 0%, 30%)'
  };

  const series: MultiSeriesTimeData[] = metrics.map((metric) => ({
    name: metricLabels[metric] || metric,
    data: yearlyMetrics.map((m) => {
      const value = m[metric];
      return typeof value === 'number' ? Math.round(value * 10) / 10 : 0;
    }),
    color: metricColors[metric]
  }));

  return { categories, series };
}

/**
 * Safe percentage calculation with divide-by-zero protection
 */
function safePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

// ==========================================
// DEMOGRAPHICS AGGREGATION
// ==========================================

export interface DemographicsAggregation {
  totalPopulation: number;
  totalMale: number;
  totalFemale: number;
  totalHouseholds: number;
  totalVoters: number;
  totalSeniors: number;
  totalLaborWorkforce: number;
  totalUnemployed: number;
  totalNoBirthCert: number;
  totalNoNationalID: number;

  // Muslim and IP counts
  totalMuslim: number;
  totalIP: number;

  // OSY data
  totalOSY: number;
  sitiosWithOSY: number;

  // Additional demographics
  totalLaborForce60to64: number;
  totalSchoolAgeChildren: number;

  // Calculated metrics
  averageHouseholdSize: number;
  malePercent: number;
  femalePercent: number;
  voterRegistrationPercent: number;
  unemploymentRate: number;
  seniorPercent: number;

  // Age groups (calculated from available data)
  /** Youth (0-14): totalPopulation - laborForce - seniorsCount + laborForce60to64Count */
  youth: number;
  /** Working Age (15-64): laborForceCount */
  workingAge: number;
  /** Elderly (65+): seniorsCount - laborForce60to64Count */
  elderly: number;

  // Age group percentages
  youthPercent: number;
  workingAgePercent: number;
  elderlyPercent: number;

  // Classification counts
  gidaCount: number;
  indigenousCount: number;
  conflictCount: number;
}

export function aggregateDemographics(
  sitios: SitioRecord[],
  year?: number
): DemographicsAggregation {
  let totalPopulation = 0;
  let totalMale = 0;
  let totalFemale = 0;
  let totalHouseholds = 0;
  let totalVoters = 0;
  let totalSeniors = 0;
  let totalLaborWorkforce = 0;
  let totalUnemployed = 0;
  let totalNoBirthCert = 0;
  let totalNoNationalID = 0;
  let totalMuslim = 0;
  let totalIP = 0;
  let totalOSY = 0;
  let sitiosWithOSY = 0;
  let totalLaborForce60to64 = 0;
  let totalSchoolAgeChildren = 0;

  let gidaCount = 0;
  let indigenousCount = 0;
  let conflictCount = 0;

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    totalPopulation += profile.totalPopulation || 0;
    totalMale += profile.population.totalMale || 0;
    totalFemale += profile.population.totalFemale || 0;
    totalHouseholds += profile.totalHouseholds || 0;
    totalVoters += profile.registeredVoters || 0;
    totalSeniors += profile.vulnerableGroups.seniorsCount || 0;
    totalLaborWorkforce += profile.laborForceCount || 0;
    totalUnemployed += profile.vulnerableGroups.unemployedCount || 0;
    totalNoBirthCert += profile.vulnerableGroups.noBirthCertCount || 0;
    totalNoNationalID += profile.vulnerableGroups.noNationalIDCount || 0;
    totalMuslim += profile.vulnerableGroups.muslimCount || 0;
    totalIP += profile.vulnerableGroups.ipCount || 0;
    totalLaborForce60to64 += profile.vulnerableGroups.laborForce60to64Count || 0;
    totalSchoolAgeChildren += profile.schoolAgeChildren || 0;

    // OSY data
    const osyCount = profile.vulnerableGroups.outOfSchoolYouth || 0;
    if (osyCount > 0) {
      totalOSY += osyCount;
      sitiosWithOSY++;
    }

    // Count classifications
    if (sitio.sitioClassification.gida) gidaCount++;
    if (sitio.sitioClassification.indigenous) indigenousCount++;
    if (sitio.sitioClassification.conflict) conflictCount++;
  }

  // Calculate age groups based on available data
  // Working Age (15-64) = laborForceCount
  const workingAge = totalLaborWorkforce;
  // Elderly (65+) = seniorsCount (60+) - laborForce60to64Count (60-64 who still work)
  const elderly = Math.max(0, totalSeniors - totalLaborForce60to64);
  // Youth (0-14) = totalPopulation - workingAge - elderly
  const youth = Math.max(0, totalPopulation - workingAge - elderly);

  return {
    totalPopulation,
    totalMale,
    totalFemale,
    totalHouseholds,
    totalVoters,
    totalSeniors,
    totalLaborWorkforce,
    totalUnemployed,
    totalNoBirthCert,
    totalNoNationalID,
    totalMuslim,
    totalIP,
    totalOSY,
    sitiosWithOSY,
    totalLaborForce60to64,
    totalSchoolAgeChildren,

    averageHouseholdSize: totalHouseholds > 0 ? totalPopulation / totalHouseholds : 0,
    malePercent: safePercentage(totalMale, totalPopulation),
    femalePercent: safePercentage(totalFemale, totalPopulation),
    voterRegistrationPercent: safePercentage(totalVoters, totalPopulation),
    unemploymentRate: safePercentage(totalUnemployed, totalLaborWorkforce),
    seniorPercent: safePercentage(totalSeniors, totalPopulation),

    youth,
    workingAge,
    elderly,

    youthPercent: safePercentage(youth, totalPopulation),
    workingAgePercent: safePercentage(workingAge, totalPopulation),
    elderlyPercent: safePercentage(elderly, totalPopulation),

    gidaCount,
    indigenousCount,
    conflictCount
  };
}

// ==========================================
// UTILITIES AGGREGATION
// ==========================================

export interface UtilitiesAggregation {
  totalHouseholds: number;
  householdsWithElectricity: number;
  householdsWithToilet: number;
  householdsWithInternet: number;

  // Electricity sources
  electricityGrid: number;
  electricitySolar: number;
  electricityBattery: number;
  electricityGenerator: number;

  // Mobile signal tiers
  signal5G: number;
  signal4G: number;
  signal3G: number;
  signal2G: number;
  signalNone: number;

  // Percentages
  electricityPercent: number;
  toiletPercent: number;
  internetPercent: number;
}

export function aggregateUtilities(sitios: SitioRecord[], year?: number): UtilitiesAggregation {
  let totalHouseholds = 0;
  let householdsWithElectricity = 0;
  let householdsWithToilet = 0;
  let householdsWithInternet = 0;

  let electricityGrid = 0;
  let electricitySolar = 0;
  let electricityBattery = 0;
  let electricityGenerator = 0;

  let signal5G = 0;
  let signal4G = 0;
  let signal3G = 0;
  let signal2G = 0;
  let signalNone = 0;

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    totalHouseholds += profile.totalHouseholds || 0;
    householdsWithElectricity += profile.householdsWithElectricity || 0;
    householdsWithToilet += profile.householdsWithToilet || 0;
    householdsWithInternet += profile.householdsWithInternet || 0;

    // Electricity sources
    electricityGrid += profile.electricitySources?.grid || 0;
    electricitySolar += profile.electricitySources?.solar || 0;
    electricityBattery += profile.electricitySources?.battery || 0;
    electricityGenerator += profile.electricitySources?.generator || 0;

    // Mobile signal (string enum: 'none' | '2g' | '3g' | '4g' | '5g')
    switch (profile.mobileSignal) {
      case '5g':
        signal5G++;
        break;
      case '4g':
        signal4G++;
        break;
      case '3g':
        signal3G++;
        break;
      case '2g':
        signal2G++;
        break;
      case 'none':
        signalNone++;
        break;
    }
  }

  return {
    totalHouseholds,
    householdsWithElectricity,
    householdsWithToilet,
    householdsWithInternet,

    electricityGrid,
    electricitySolar,
    electricityBattery,
    electricityGenerator,

    signal5G,
    signal4G,
    signal3G,
    signal2G,
    signalNone,

    electricityPercent: safePercentage(householdsWithElectricity, totalHouseholds),
    toiletPercent: safePercentage(householdsWithToilet, totalHouseholds),
    internetPercent: safePercentage(householdsWithInternet, totalHouseholds)
  };
}

// ==========================================
// FACILITIES AGGREGATION
// ==========================================

export interface FacilityConditionCount {
  exists: number;
  excellent: number; // condition 5
  good: number; // condition 4
  average: number; // condition 3
  poor: number; // condition 2
  bad: number; // condition 1
  notExist: number;
  averageDistance: number;
}

export interface FacilitiesAggregation {
  healthCenter: FacilityConditionCount;
  pharmacy: FacilityConditionCount;
  communityToilet: FacilityConditionCount;
  kindergarten: FacilityConditionCount;
  elementarySchool: FacilityConditionCount;
  highSchool: FacilityConditionCount;
  madrasah: FacilityConditionCount;
  market: FacilityConditionCount;
}

function createEmptyFacilityCount(): FacilityConditionCount {
  return {
    exists: 0,
    excellent: 0,
    good: 0,
    average: 0,
    poor: 0,
    bad: 0,
    notExist: 0,
    averageDistance: 0
  };
}

export function aggregateFacilities(sitios: SitioRecord[], year?: number): FacilitiesAggregation {
  const facilities: FacilitiesAggregation = {
    healthCenter: createEmptyFacilityCount(),
    pharmacy: createEmptyFacilityCount(),
    communityToilet: createEmptyFacilityCount(),
    kindergarten: createEmptyFacilityCount(),
    elementarySchool: createEmptyFacilityCount(),
    highSchool: createEmptyFacilityCount(),
    madrasah: createEmptyFacilityCount(),
    market: createEmptyFacilityCount()
  };

  const distanceCounts: { [key: string]: { total: number; count: number } } = {};

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    // Process each facility type
    for (const [facilityName, facilityData] of Object.entries(profile.facilities)) {
      const count = facilities[facilityName as keyof FacilitiesAggregation];
      if (!count) continue;

      if (facilityData.exists === 'yes') {
        count.exists++;
        // Condition is now 1-5 numeric scale
        const condition = facilityData.condition;
        if (condition === 5) count.excellent++;
        else if (condition === 4) count.good++;
        else if (condition === 3) count.average++;
        else if (condition === 2) count.poor++;
        else if (condition === 1) count.bad++;
      } else if (facilityData.exists === 'no') {
        count.notExist++;
        if (facilityData.distanceToNearest) {
          if (!distanceCounts[facilityName]) {
            distanceCounts[facilityName] = { total: 0, count: 0 };
          }
          distanceCounts[facilityName].total += facilityData.distanceToNearest;
          distanceCounts[facilityName].count++;
        }
      }
    }
  }

  // Calculate average distances
  for (const [facilityName, distData] of Object.entries(distanceCounts)) {
    const count = facilities[facilityName as keyof FacilitiesAggregation];
    if (count && distData.count > 0) {
      count.averageDistance = distData.total / distData.count;
    }
  }

  return facilities;
}

// ==========================================
// LIVELIHOOD & ECONOMY AGGREGATION
// ==========================================

export interface LivelihoodAggregation {
  totalFarmers: number;
  totalFarmArea: number;
  totalFarmerOrgs: number;

  // Average daily income stats
  averageDailyIncomeTotal: number;
  sitiosWithIncome: number;
  averageDailyIncomeOverall: number;

  // Worker class distribution (sitio counts)
  workerPrivateHousehold: number;
  workerPrivateEstablishment: number;
  workerGovernment: number;
  workerSelfEmployed: number;
  workerEmployer: number;
  workerOFW: number;

  // Crops and livestock counts
  cropCounts: Map<string, number>;
  livestockCounts: Map<string, number>;

  // Income cluster distribution (7-tier system)
  incomeClusterCounts: IncomeClusterCounts;

  // Pets data
  totalCats: number;
  totalDogs: number;
  totalVaccinatedCats: number;
  totalVaccinatedDogs: number;
  catVaccinationRate: number;
  dogVaccinationRate: number;

  // Backyard gardens data
  totalHouseholdsWithGardens: number;
  backyardGardenRate: number;
  backyardCropCounts: Map<string, number>;
}

export function aggregateLivelihood(sitios: SitioRecord[], year?: number): LivelihoodAggregation {
  let totalFarmers = 0;
  let totalFarmArea = 0;
  let totalFarmerOrgs = 0;
  let averageDailyIncomeTotal = 0;
  let sitiosWithIncome = 0;

  let workerPrivateHousehold = 0;
  let workerPrivateEstablishment = 0;
  let workerGovernment = 0;
  let workerSelfEmployed = 0;
  let workerEmployer = 0;
  let workerOFW = 0;

  const incomeClusterCounts = createEmptyIncomeClusterCounts();

  const cropCounts = new Map<string, number>();
  const livestockCounts = new Map<string, number>();

  // Pets aggregation
  let totalCats = 0;
  let totalDogs = 0;
  let totalVaccinatedCats = 0;
  let totalVaccinatedDogs = 0;

  // Backyard gardens aggregation
  let totalHouseholdsWithGardens = 0;
  let totalHouseholds = 0;
  const backyardCropCounts = new Map<string, number>();

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    // Agriculture
    totalFarmers += profile.agriculture.numberOfFarmers || 0;
    totalFarmArea += profile.agriculture.estimatedFarmAreaHectares || 0;
    totalFarmerOrgs += profile.agriculture.numberOfAssociations || 0;

    // Daily income
    if (profile.averageDailyIncome > 0) {
      averageDailyIncomeTotal += profile.averageDailyIncome;
      sitiosWithIncome++;

      // Income cluster classification (7-tier system)
      const cluster = getIncomeCluster(profile.averageDailyIncome);
      incomeClusterCounts[cluster]++;
    }

    // Worker class
    workerPrivateHousehold += profile.workerClass.privateHousehold || 0;
    workerPrivateEstablishment += profile.workerClass.privateEstablishment || 0;
    workerGovernment += profile.workerClass.government || 0;
    workerSelfEmployed += profile.workerClass.selfEmployed || 0;
    workerEmployer += profile.workerClass.employer || 0;
    workerOFW += profile.workerClass.ofw || 0;

    // Crops
    for (const crop of profile.crops || []) {
      cropCounts.set(crop, (cropCounts.get(crop) || 0) + 1);
    }

    // Livestock
    for (const animal of profile.livestock || []) {
      livestockCounts.set(animal, (livestockCounts.get(animal) || 0) + 1);
    }

    // Pets
    if (profile.pets) {
      totalCats += profile.pets.catsCount || 0;
      totalDogs += profile.pets.dogsCount || 0;
      totalVaccinatedCats += profile.pets.vaccinatedCats || 0;
      totalVaccinatedDogs += profile.pets.vaccinatedDogs || 0;
    }

    // Backyard gardens
    totalHouseholds += profile.totalHouseholds || 0;
    if (profile.backyardGardens) {
      totalHouseholdsWithGardens += profile.backyardGardens.householdsWithGardens || 0;
      for (const crop of profile.backyardGardens.commonCrops || []) {
        backyardCropCounts.set(crop, (backyardCropCounts.get(crop) || 0) + 1);
      }
    }
  }

  return {
    totalFarmers,
    totalFarmArea,
    totalFarmerOrgs,
    averageDailyIncomeTotal,
    sitiosWithIncome,
    averageDailyIncomeOverall:
      sitiosWithIncome > 0 ? averageDailyIncomeTotal / sitiosWithIncome : 0,

    workerPrivateHousehold,
    workerPrivateEstablishment,
    workerGovernment,
    workerSelfEmployed,
    workerEmployer,
    workerOFW,

    cropCounts,
    livestockCounts,

    incomeClusterCounts,

    // Pets
    totalCats,
    totalDogs,
    totalVaccinatedCats,
    totalVaccinatedDogs,
    catVaccinationRate: totalCats > 0 ? (totalVaccinatedCats / totalCats) * 100 : 0,
    dogVaccinationRate: totalDogs > 0 ? (totalVaccinatedDogs / totalDogs) * 100 : 0,

    // Backyard gardens
    totalHouseholdsWithGardens,
    backyardGardenRate:
      totalHouseholds > 0 ? (totalHouseholdsWithGardens / totalHouseholds) * 100 : 0,
    backyardCropCounts
  };
}

// ==========================================
// INFRASTRUCTURE AGGREGATION
// ==========================================

export interface InfrastructureAggregation {
  // Road types with existence and condition
  roadAsphalt: {
    exists: number;
    totalLength: number;
    excellent: number;
    good: number;
    average: number;
    poor: number;
    bad: number;
  };
  roadConcrete: {
    exists: number;
    totalLength: number;
    excellent: number;
    good: number;
    average: number;
    poor: number;
    bad: number;
  };
  roadGravel: {
    exists: number;
    totalLength: number;
    excellent: number;
    good: number;
    average: number;
    poor: number;
    bad: number;
  };
  roadNatural: {
    exists: number;
    totalLength: number;
    excellent: number;
    good: number;
    average: number;
    poor: number;
    bad: number;
  };

  // Water sources
  waterNatural: { exists: number; functioning: number; notFunctioning: number };
  waterLevel1: { exists: number; functioning: number; notFunctioning: number };
  waterLevel2: { exists: number; functioning: number; notFunctioning: number };
  waterLevel3: { exists: number; functioning: number; notFunctioning: number };

  // Sanitation (counts of sitios using each type)
  sanitationWaterSealed: number;
  sanitationPitLatrine: number;
  sanitationCommunityCR: number;
  sanitationOpenDefecation: number;

  // Education
  studentsPerRoomLessThan46: number;
  studentsPerRoom46_50: number;
  studentsPerRoom51_55: number;
  studentsPerRoomMoreThan56: number;
  studentsPerRoomNoClassroom: number;
}

export function aggregateInfrastructure(
  sitios: SitioRecord[],
  year?: number
): InfrastructureAggregation {
  const result: InfrastructureAggregation = {
    roadAsphalt: { exists: 0, totalLength: 0, excellent: 0, good: 0, average: 0, poor: 0, bad: 0 },
    roadConcrete: { exists: 0, totalLength: 0, excellent: 0, good: 0, average: 0, poor: 0, bad: 0 },
    roadGravel: { exists: 0, totalLength: 0, excellent: 0, good: 0, average: 0, poor: 0, bad: 0 },
    roadNatural: { exists: 0, totalLength: 0, excellent: 0, good: 0, average: 0, poor: 0, bad: 0 },

    waterNatural: { exists: 0, functioning: 0, notFunctioning: 0 },
    waterLevel1: { exists: 0, functioning: 0, notFunctioning: 0 },
    waterLevel2: { exists: 0, functioning: 0, notFunctioning: 0 },
    waterLevel3: { exists: 0, functioning: 0, notFunctioning: 0 },

    sanitationWaterSealed: 0,
    sanitationPitLatrine: 0,
    sanitationCommunityCR: 0,
    sanitationOpenDefecation: 0,

    studentsPerRoomLessThan46: 0,
    studentsPerRoom46_50: 0,
    studentsPerRoom51_55: 0,
    studentsPerRoomMoreThan56: 0,
    studentsPerRoomNoClassroom: 0
  };

  // Helper to categorize condition (1-5 scale)
  const categorizeCondition = (
    condition: number | undefined,
    road: { excellent: number; good: number; average: number; poor: number; bad: number }
  ) => {
    if (!condition) return;
    if (condition === 5) road.excellent++;
    else if (condition === 4) road.good++;
    else if (condition === 3) road.average++;
    else if (condition === 2) road.poor++;
    else if (condition === 1) road.bad++;
  };

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    // Infrastructure - Roads
    const infra = profile.infrastructure;

    if (infra.asphalt.exists === 'yes') {
      result.roadAsphalt.exists++;
      result.roadAsphalt.totalLength += infra.asphalt.length || 0;
      categorizeCondition(infra.asphalt.condition, result.roadAsphalt);
    }

    if (infra.concrete.exists === 'yes') {
      result.roadConcrete.exists++;
      result.roadConcrete.totalLength += infra.concrete.length || 0;
      categorizeCondition(infra.concrete.condition, result.roadConcrete);
    }

    if (infra.gravel.exists === 'yes') {
      result.roadGravel.exists++;
      result.roadGravel.totalLength += infra.gravel.length || 0;
      categorizeCondition(infra.gravel.condition, result.roadGravel);
    }

    if (infra.natural.exists === 'yes') {
      result.roadNatural.exists++;
      result.roadNatural.totalLength += infra.natural.length || 0;
      categorizeCondition(infra.natural.condition, result.roadNatural);
    }

    // Water sources
    const ws = profile.waterSources;

    if (ws.natural.exists === 'yes') {
      result.waterNatural.exists++;
      result.waterNatural.functioning += ws.natural.functioningCount || 0;
      result.waterNatural.notFunctioning += ws.natural.notFunctioningCount || 0;
    }

    if (ws.level1.exists === 'yes') {
      result.waterLevel1.exists++;
      result.waterLevel1.functioning += ws.level1.functioningCount || 0;
      result.waterLevel1.notFunctioning += ws.level1.notFunctioningCount || 0;
    }

    if (ws.level2.exists === 'yes') {
      result.waterLevel2.exists++;
      result.waterLevel2.functioning += ws.level2.functioningCount || 0;
      result.waterLevel2.notFunctioning += ws.level2.notFunctioningCount || 0;
    }

    if (ws.level3.exists === 'yes') {
      result.waterLevel3.exists++;
      result.waterLevel3.functioning += ws.level3.functioningCount || 0;
      result.waterLevel3.notFunctioning += ws.level3.notFunctioningCount || 0;
    }

    // Sanitation
    if (profile.sanitationTypes.waterSealed) result.sanitationWaterSealed++;
    if (profile.sanitationTypes.pitLatrine) result.sanitationPitLatrine++;
    if (profile.sanitationTypes.communityCR) result.sanitationCommunityCR++;
    if (profile.sanitationTypes.openDefecation) result.sanitationOpenDefecation++;

    // Education - students per room
    switch (profile.studentsPerRoom) {
      case 'less_than_46':
        result.studentsPerRoomLessThan46++;
        break;
      case '46_50':
        result.studentsPerRoom46_50++;
        break;
      case '51_55':
        result.studentsPerRoom51_55++;
        break;
      case 'more_than_56':
        result.studentsPerRoomMoreThan56++;
        break;
      case 'no_classroom':
        result.studentsPerRoomNoClassroom++;
        break;
    }
  }

  return result;
}

// ==========================================
// PRIORITIES & INTERVENTIONS AGGREGATION
// ==========================================

export interface PrioritiesAggregation {
  // Priority scores aggregated (sum of all sitio priority ratings 0-3)
  waterSystem: { totalScore: number; urgentCount: number };
  communityCR: { totalScore: number; urgentCount: number };
  solarStreetLights: { totalScore: number; urgentCount: number };
  roadOpening: { totalScore: number; urgentCount: number };
  farmTools: { totalScore: number; urgentCount: number };
  healthServices: { totalScore: number; urgentCount: number };
  educationSupport: { totalScore: number; urgentCount: number };

  // "Others" specifications
  otherPriorities: Map<string, number>;
}

/**
 * Helper function to get priority rating by name
 */
function getPriorityRating(
  priorities: Array<{ name: string; rating: number }>,
  name: string
): number {
  return priorities.find((p) => p.name === name)?.rating ?? 0;
}

export function aggregatePriorities(sitios: SitioRecord[], year?: number): PrioritiesAggregation {
  const result: PrioritiesAggregation = {
    waterSystem: { totalScore: 0, urgentCount: 0 },
    communityCR: { totalScore: 0, urgentCount: 0 },
    solarStreetLights: { totalScore: 0, urgentCount: 0 },
    roadOpening: { totalScore: 0, urgentCount: 0 },
    farmTools: { totalScore: 0, urgentCount: 0 },
    healthServices: { totalScore: 0, urgentCount: 0 },
    educationSupport: { totalScore: 0, urgentCount: 0 },
    otherPriorities: new Map()
  };

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    const p = profile.priorities;

    // Water System
    const waterSystem = getPriorityRating(p, 'waterSystem');
    result.waterSystem.totalScore += waterSystem;
    if (waterSystem === 3) result.waterSystem.urgentCount++;

    // Community CR
    const communityCR = getPriorityRating(p, 'communityCR');
    result.communityCR.totalScore += communityCR;
    if (communityCR === 3) result.communityCR.urgentCount++;

    // Solar Street Lights
    const solarStreetLights = getPriorityRating(p, 'solarStreetLights');
    result.solarStreetLights.totalScore += solarStreetLights;
    if (solarStreetLights === 3) result.solarStreetLights.urgentCount++;

    // Road Opening
    const roadOpening = getPriorityRating(p, 'roadOpening');
    result.roadOpening.totalScore += roadOpening;
    if (roadOpening === 3) result.roadOpening.urgentCount++;

    // Farm Tools
    const farmTools = getPriorityRating(p, 'farmTools');
    result.farmTools.totalScore += farmTools;
    if (farmTools === 3) result.farmTools.urgentCount++;

    // Health Services
    const healthServices = getPriorityRating(p, 'healthServices');
    result.healthServices.totalScore += healthServices;
    if (healthServices === 3) result.healthServices.urgentCount++;

    // Education Support
    const educationSupport = getPriorityRating(p, 'educationSupport');
    result.educationSupport.totalScore += educationSupport;
    if (educationSupport === 3) result.educationSupport.urgentCount++;
  }

  return result;
}

// ==========================================
// SAFETY & RISK AGGREGATION
// ==========================================

export interface SafetyAggregation {
  // Hazard frequency counts
  floodFrequencyCounts: Map<number, number>;
  landslideFrequencyCounts: Map<number, number>;
  droughtFrequencyCounts: Map<number, number>;
  earthquakeFrequencyCounts: Map<number, number>;

  // Food security
  foodSecure: number;
  foodSeasonalScarcity: number;
  foodCriticalShortage: number;
}

export function aggregateSafety(sitios: SitioRecord[], year?: number): SafetyAggregation {
  const result: SafetyAggregation = {
    floodFrequencyCounts: new Map(),
    landslideFrequencyCounts: new Map(),
    droughtFrequencyCounts: new Map(),
    earthquakeFrequencyCounts: new Map(),

    foodSecure: 0,
    foodSeasonalScarcity: 0,
    foodCriticalShortage: 0
  };

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    // Hazards
    const hz = profile.hazards;

    const floodFreq = hz.flood.frequency || 0;
    result.floodFrequencyCounts.set(
      floodFreq,
      (result.floodFrequencyCounts.get(floodFreq) || 0) + 1
    );

    const landslideFreq = hz.landslide.frequency || 0;
    result.landslideFrequencyCounts.set(
      landslideFreq,
      (result.landslideFrequencyCounts.get(landslideFreq) || 0) + 1
    );

    const droughtFreq = hz.drought.frequency || 0;
    result.droughtFrequencyCounts.set(
      droughtFreq,
      (result.droughtFrequencyCounts.get(droughtFreq) || 0) + 1
    );

    const earthquakeFreq = hz.earthquake.frequency || 0;
    result.earthquakeFrequencyCounts.set(
      earthquakeFreq,
      (result.earthquakeFrequencyCounts.get(earthquakeFreq) || 0) + 1
    );

    // Food Security
    switch (profile.foodSecurity) {
      case 'secure':
        result.foodSecure++;
        break;
      case 'seasonal_scarcity':
        result.foodSeasonalScarcity++;
        break;
      case 'critical_shortage':
        result.foodCriticalShortage++;
        break;
    }
  }

  return result;
}

// ==========================================
// GEOGRAPHIC AGGREGATION
// ==========================================

export interface MunicipalityData {
  municipality: string;
  sitioCount: number;
  population: number;
  households: number;
  farmers: number;
}

export interface GeographicAggregation {
  totalMunicipalities: number;
  totalBarangays: number;
  municipalities: MunicipalityData[];
}

export function aggregateGeographic(sitios: SitioRecord[], year?: number): GeographicAggregation {
  const municipalityMap = new Map<string, MunicipalityData>();
  const barangaySet = new Set<string>();

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    const municipality = profile.municipality;
    const barangay = `${municipality}-${profile.barangay}`;
    barangaySet.add(barangay);

    if (!municipalityMap.has(municipality)) {
      municipalityMap.set(municipality, {
        municipality,
        sitioCount: 0,
        population: 0,
        households: 0,
        farmers: 0
      });
    }

    const munData = municipalityMap.get(municipality)!;
    munData.sitioCount++;
    munData.population += profile.totalPopulation || 0;
    munData.households += profile.totalHouseholds || 0;
    munData.farmers += profile.agriculture.numberOfFarmers || 0;
  }

  return {
    totalMunicipalities: municipalityMap.size,
    totalBarangays: barangaySet.size,
    municipalities: Array.from(municipalityMap.values()).sort((a, b) => b.population - a.population)
  };
}

// ==========================================
// BARANGAY AGGREGATION (for drill-down)
// ==========================================

export interface BarangayData {
  barangay: string;
  municipality: string;
  sitioCount: number;
  population: number;
  households: number;
}

export function aggregateBarangays(
  sitios: SitioRecord[],
  municipality?: string,
  year?: number
): BarangayData[] {
  const barangayMap = new Map<string, BarangayData>();

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    // Filter by municipality if specified
    if (municipality && profile.municipality !== municipality) continue;

    const key = `${profile.municipality}-${profile.barangay}`;

    if (!barangayMap.has(key)) {
      barangayMap.set(key, {
        barangay: profile.barangay,
        municipality: profile.municipality,
        sitioCount: 0,
        population: 0,
        households: 0
      });
    }

    const data = barangayMap.get(key)!;
    data.sitioCount++;
    data.population += profile.totalPopulation || 0;
    data.households += profile.totalHouseholds || 0;
  }

  return Array.from(barangayMap.values()).sort((a, b) => b.population - a.population);
}

// ==========================================
// ACCESS MODES AGGREGATION
// ==========================================

export interface AccessModesAggregation {
  pavedRoad: number;
  unpavedRoad: number;
  footpath: number;
  boat: number;
}

export function aggregateAccessModes(sitios: SitioRecord[], year?: number): AccessModesAggregation {
  let pavedRoad = 0;
  let unpavedRoad = 0;
  let footpath = 0;
  let boat = 0;

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    if (profile.mainAccess.pavedRoad) pavedRoad++;
    if (profile.mainAccess.unpavedRoad) unpavedRoad++;
    if (profile.mainAccess.footpath) footpath++;
    if (profile.mainAccess.boat) boat++;
  }

  return { pavedRoad, unpavedRoad, footpath, boat };
}

// ==========================================
// HELPER FUNCTIONS FOR DASHBOARD
// ==========================================

/**
 * Get all available years across all sitios
 */
export function getAllAvailableYears(sitios: SitioRecord[]): number[] {
  const yearSet = new Set<number>();
  for (const sitio of sitios) {
    for (const year of sitio.availableYears || []) {
      yearSet.add(year);
    }
  }
  return Array.from(yearSet).sort((a, b) => b - a);
}

/**
 * Get sitio data for a specific year
 */
export function getYearSpecificData(sitioRecord: SitioRecord, year: number): SitioProfile | null {
  return sitioRecord.yearlyData[year.toString()] || null;
}

/**
 * Export safe percentage for use in components
 */
export function calculatePercentage(numerator: number, denominator: number): number {
  return safePercentage(numerator, denominator);
}

// ==========================================
// COORDINATES AGGREGATION (for maps)
// ==========================================

export interface SitioCoordinate {
  id: number;
  name: string;
  barangay: string;
  municipality: string;
  latitude: number;
  longitude: number;
}

export interface CoordinatesAggregation {
  sitios: SitioCoordinate[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

export function aggregateCoordinates(sitios: SitioRecord[], year?: number): CoordinatesAggregation {
  const coordinates: SitioCoordinate[] = [];
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let totalLat = 0;
  let totalLng = 0;
  let validCount = 0;

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    const lat = profile.latitude;
    const lng = profile.longitude;

    // Only include sitios with valid coordinates
    if (lat && lng && lat !== 0 && lng !== 0) {
      coordinates.push({
        id: sitio.id,
        name: profile.sitioName,
        barangay: profile.barangay,
        municipality: profile.municipality,
        latitude: lat,
        longitude: lng
      });

      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      totalLat += lat;
      totalLng += lng;
      validCount++;
    }
  }

  return {
    sitios: coordinates,
    bounds: {
      minLat: validCount > 0 ? minLat : 0,
      maxLat: validCount > 0 ? maxLat : 0,
      minLng: validCount > 0 ? minLng : 0,
      maxLng: validCount > 0 ? maxLng : 0
    },
    center: {
      lat: validCount > 0 ? totalLat / validCount : 0,
      lng: validCount > 0 ? totalLng / validCount : 0
    }
  };
}

// ==========================================
// RECOMMENDATIONS AGGREGATION (Section K)
// ==========================================

export interface RecommendationsAggregation {
  /** Total number of recommendations across all sitios */
  totalRecommendations: number;
  /** Recommendations grouped by PPA type */
  recommendationsByPPA: Map<string, number>;
  /** Sitios with most recommendations */
  sitiosWithMostRecommendations: Array<{ sitioName: string; count: number }>;
}

export function aggregateRecommendations(
  sitios: SitioRecord[],
  year?: number
): RecommendationsAggregation {
  let totalRecommendations = 0;

  const recommendationsByPPA = new Map<string, number>();
  const sitioRecommendationCounts: Array<{ sitioName: string; count: number }> = [];

  for (const sitio of sitios) {
    const profile = getDataForYearOrLatest(sitio, year);
    if (!profile) continue;

    // Aggregate recommendations
    const recommendations = profile.recommendations || [];
    totalRecommendations += recommendations.length;

    if (recommendations.length > 0) {
      sitioRecommendationCounts.push({
        sitioName: profile.sitioName,
        count: recommendations.length
      });
    }

    for (const rec of recommendations) {
      const ppa = rec.ppa?.name || 'Unknown';
      recommendationsByPPA.set(ppa, (recommendationsByPPA.get(ppa) || 0) + 1);
    }
  }

  // Sort sitios by recommendation count (descending) and take top 10
  sitioRecommendationCounts.sort((a, b) => b.count - a.count);
  const topSitios = sitioRecommendationCounts.slice(0, 10);

  return {
    totalRecommendations,
    recommendationsByPPA,
    sitiosWithMostRecommendations: topSitios
  };
}

// ==========================================
// ENTITY COMPARISON UTILITIES
// ==========================================

/**
 * Comparison level based on current filter state
 */
export type ComparisonLevel = 'municipality' | 'barangay' | 'sitio';

/**
 * Entity for comparison selection
 */
export interface ComparisonEntity {
  id: string;
  name: string;
  sitioCount: number;
}

/**
 * Determine comparison level based on filter state
 */
export function getComparisonLevel(
  selectedMunicipality: string,
  selectedBarangay: string
): ComparisonLevel {
  if (selectedBarangay !== 'all') return 'sitio';
  if (selectedMunicipality !== 'all') return 'barangay';
  return 'municipality';
}

/**
 * Get available entities for comparison based on level
 */
export function getComparisonEntities(
  sitios: SitioRecord[],
  level: ComparisonLevel
): ComparisonEntity[] {
  const entityMap = new Map<string, number>();

  for (const sitio of sitios) {
    let key: string;
    switch (level) {
      case 'municipality':
        key = sitio.municipality;
        break;
      case 'barangay':
        key = sitio.barangay;
        break;
      case 'sitio':
        key = `${sitio.id}:${sitio.sitioName}`;
        break;
    }
    entityMap.set(key, (entityMap.get(key) || 0) + 1);
  }

  return Array.from(entityMap.entries())
    .map(([key, count]) => {
      if (level === 'sitio') {
        const [id, name] = key.split(':');
        return { id, name, sitioCount: count };
      }
      return { id: key, name: key, sitioCount: count };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter sitios by entity based on comparison level
 */
function filterSitiosByEntity(
  sitios: SitioRecord[],
  entityId: string,
  level: ComparisonLevel
): SitioRecord[] {
  switch (level) {
    case 'municipality':
      return sitios.filter((s) => s.municipality === entityId);
    case 'barangay':
      return sitios.filter((s) => s.barangay === entityId);
    case 'sitio':
      return sitios.filter((s) => s.id.toString() === entityId);
  }
}

/**
 * Prepare comparison time series data for selected entities
 * Returns multi-series data where each series is one entity
 */
export function prepareComparisonTimeSeriesData(
  sitios: SitioRecord[],
  selectedEntityIds: string[],
  level: ComparisonLevel,
  metrics: (keyof YearlyMetrics)[],
  entityNames: Map<string, string>
): { categories: string[]; series: MultiSeriesTimeData[] } {
  // Get all available years across all sitios
  const allYears = getAllAvailableYears(sitios);
  const categories = allYears.map((y) => y.toString());

  // Color palette for comparison lines
  const comparisonColors = [
    'hsl(217, 91%, 60%)', // Blue
    'hsl(142, 71%, 45%)', // Green
    'hsl(330, 81%, 60%)', // Pink
    'hsl(25, 95%, 53%)', // Orange
    'hsl(263, 70%, 50%)' // Purple
  ];

  const series: MultiSeriesTimeData[] = [];

  selectedEntityIds.forEach((entityId, index) => {
    const entitySitios = filterSitiosByEntity(sitios, entityId, level);
    const entityName = entityNames.get(entityId) || entityId;

    // For each year, aggregate the metrics for this entity's sitios
    const data: number[] = allYears.map((year) => {
      const yearMetrics = aggregateMetricsForYear(entitySitios, year);

      // Sum the requested metrics
      let total = 0;
      for (const metric of metrics) {
        const value = yearMetrics[metric];
        if (typeof value === 'number') {
          total += value;
        }
      }
      return Math.round(total * 10) / 10;
    });

    series.push({
      name: entityName,
      data,
      color: comparisonColors[index % comparisonColors.length]
    });
  });

  return { categories, series };
}

/**
 * Prepare comparison data for a single metric (more detailed view)
 */
export function prepareComparisonMetricData(
  sitios: SitioRecord[],
  selectedEntityIds: string[],
  level: ComparisonLevel,
  metric: keyof YearlyMetrics,
  entityNames: Map<string, string>
): { categories: string[]; series: MultiSeriesTimeData[] } {
  return prepareComparisonTimeSeriesData(sitios, selectedEntityIds, level, [metric], entityNames);
}

/**
 * Prepare comparison data for multiple metrics as separate series per entity-metric combination
 */
export function prepareMultiMetricComparisonData(
  sitios: SitioRecord[],
  selectedEntityIds: string[],
  level: ComparisonLevel,
  metrics: (keyof YearlyMetrics)[],
  entityNames: Map<string, string>,
  metricLabels: Record<string, string>
): { categories: string[]; series: MultiSeriesTimeData[] } {
  const allYears = getAllAvailableYears(sitios);
  const categories = allYears.map((y) => y.toString());

  const comparisonColors = [
    'hsl(217, 91%, 60%)',
    'hsl(142, 71%, 45%)',
    'hsl(330, 81%, 60%)',
    'hsl(25, 95%, 53%)',
    'hsl(263, 70%, 50%)'
  ];

  const series: MultiSeriesTimeData[] = [];

  selectedEntityIds.forEach((entityId, entityIndex) => {
    const entitySitios = filterSitiosByEntity(sitios, entityId, level);
    const entityName = entityNames.get(entityId) || entityId;

    metrics.forEach((metric, metricIndex) => {
      const data: number[] = allYears.map((year) => {
        const yearMetrics = aggregateMetricsForYear(entitySitios, year);
        const value = yearMetrics[metric];
        return typeof value === 'number' ? Math.round(value * 10) / 10 : 0;
      });

      // Generate unique color by combining entity and metric index
      const colorIndex = (entityIndex * metrics.length + metricIndex) % comparisonColors.length;

      series.push({
        name: `${entityName} - ${metricLabels[metric] || metric}`,
        data,
        color: comparisonColors[colorIndex]
      });
    });
  });

  return { categories, series };
}

/**
 * Grouped bar chart data for single-year comparison
 */
export interface GroupedBarChartData {
  /** Categories are the entity names (e.g., municipality/barangay/sitio names) */
  categories: string[];
  /** Each series represents one metric with data for each entity */
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
}

/**
 * Metric display configuration
 */
export interface MetricDisplayConfig {
  key: keyof YearlyMetrics;
  label: string;
  color: string;
}

/**
 * Default metric labels for display
 */
export const METRIC_LABELS: Partial<Record<keyof YearlyMetrics, string>> = {
  totalPopulation: 'Total Population',
  totalMale: 'Male',
  totalFemale: 'Female',
  totalHouseholds: 'Households',
  totalLaborWorkforce: 'Labor Workforce',
  totalUnemployed: 'Unemployed',
  employmentRate: 'Employment Rate',
  participationRate: 'Participation Rate',
  averageDailyIncome: 'Avg Daily Income',
  electricityPercent: 'Electricity %',
  toiletPercent: 'Toilet %',
  internetPercent: 'Internet %',
  youth: 'Youth (0-14)',
  workingAge: 'Working Age (15-64)',
  elderly: 'Elderly (65+)',
  totalSchoolAgeChildren: 'School-Age Children',
  totalMuslim: 'Muslim Population',
  totalIP: 'Indigenous People',
  totalVoters: 'Registered Voters',
  totalSeniors: 'Senior Citizens',
  totalOSY: 'Out of School Youth',
  totalNoBirthCert: 'No Birth Certificate',
  totalNoNationalID: 'No PhilSys ID',
  // Agriculture
  totalFarmers: 'Farmers',
  totalFarmerOrgs: 'Farmer Organizations',
  totalFarmArea: 'Farm Area (ha)',
  // Pets
  totalDogs: 'Dogs',
  totalCats: 'Cats',
  vaccinatedDogs: 'Vaccinated Dogs',
  vaccinatedCats: 'Vaccinated Cats',
  // Water sources
  waterNaturalFunctioning: 'Natural Source (Functional)',
  waterLevel1Functioning: 'Level 1 (Functional)',
  waterLevel2Functioning: 'Level 2 (Functional)',
  waterLevel3Functioning: 'Level 3 (Functional)',
  // Sanitation
  sanitationWaterSealed: 'Water Sealed',
  sanitationPitLatrine: 'Pit Latrine',
  sanitationCommunityCR: 'Community CR',
  sanitationOpenDefecation: 'Open Defecation',
  // Signal coverage
  signal5G: '5G Coverage',
  signal4G: '4G Coverage',
  signal3G: '3G Coverage',
  signal2G: '2G Coverage',
  signalNone: 'No Signal',
  // Classroom density
  studentsPerRoomLessThan46: '<46 Students/Room',
  studentsPerRoom46_50: '46-50 Students/Room',
  studentsPerRoom51_55: '51-55 Students/Room',
  studentsPerRoomMoreThan56: '>56 Students/Room',
  studentsPerRoomNoClassroom: 'No Classroom',
  // Road infrastructure
  roadConcrete: 'Concrete Roads',
  roadAsphalt: 'Asphalt Roads',
  roadGravel: 'Gravel Roads',
  roadNatural: 'Natural Roads',
  totalRoadLength: 'Total Road Length',
  // Utility metrics
  householdsWithElectricity: 'Electricity',
  householdsWithToilet: 'Sanitary Toilet',
  householdsWithInternet: 'Internet'
};

/**
 * Get a color palette for metrics
 */
export const METRIC_COLORS: Partial<Record<keyof YearlyMetrics, string>> = {
  totalPopulation: 'hsl(217, 91%, 60%)',
  totalMale: 'hsl(217, 91%, 60%)',
  totalFemale: 'hsl(330, 81%, 60%)',
  totalHouseholds: 'hsl(142, 71%, 45%)',
  totalLaborWorkforce: 'hsl(263, 70%, 50%)',
  totalUnemployed: 'hsl(0, 84%, 60%)',
  employmentRate: 'hsl(142, 71%, 45%)',
  participationRate: 'hsl(200, 70%, 50%)',
  averageDailyIncome: 'hsl(45, 93%, 47%)',
  electricityPercent: 'hsl(45, 93%, 47%)',
  toiletPercent: 'hsl(200, 70%, 50%)',
  internetPercent: 'hsl(280, 65%, 60%)',
  youth: 'hsl(25, 95%, 53%)',
  workingAge: 'hsl(217, 91%, 60%)',
  elderly: 'hsl(200, 18%, 46%)',
  totalSchoolAgeChildren: 'hsl(217, 91%, 60%)',
  totalMuslim: 'hsl(142, 71%, 45%)',
  totalIP: 'hsl(263, 70%, 50%)',
  totalVoters: 'hsl(280, 65%, 60%)',
  totalSeniors: 'hsl(25, 95%, 53%)',
  totalOSY: 'hsl(0, 84%, 60%)',
  totalNoBirthCert: 'hsl(45, 93%, 47%)',
  totalNoNationalID: 'hsl(200, 18%, 46%)',
  // Agriculture
  totalFarmers: 'hsl(38, 92%, 50%)',
  totalFarmerOrgs: 'hsl(142, 71%, 45%)',
  totalFarmArea: 'hsl(120, 60%, 50%)',
  // Pets
  totalDogs: 'hsl(38, 92%, 50%)',
  totalCats: 'hsl(24, 95%, 53%)',
  vaccinatedDogs: 'hsl(142, 71%, 45%)',
  vaccinatedCats: 'hsl(173, 80%, 40%)',
  // Water sources
  waterNaturalFunctioning: 'hsl(142, 71%, 45%)',
  waterLevel1Functioning: 'hsl(217, 91%, 60%)',
  waterLevel2Functioning: 'hsl(45, 93%, 47%)',
  waterLevel3Functioning: 'hsl(263, 70%, 50%)',
  // Sanitation
  sanitationWaterSealed: 'hsl(142, 71%, 45%)',
  sanitationPitLatrine: 'hsl(45, 93%, 47%)',
  sanitationCommunityCR: 'hsl(217, 91%, 60%)',
  sanitationOpenDefecation: 'hsl(0, 84%, 60%)',
  // Signal coverage
  signal5G: 'hsl(142, 71%, 45%)',
  signal4G: 'hsl(217, 91%, 60%)',
  signal3G: 'hsl(45, 93%, 47%)',
  signal2G: 'hsl(27, 87%, 67%)',
  signalNone: 'hsl(0, 84%, 60%)',
  // Classroom density
  studentsPerRoomLessThan46: 'hsl(217, 91%, 60%)',
  studentsPerRoom46_50: 'hsl(45, 93%, 47%)',
  studentsPerRoom51_55: 'hsl(25, 95%, 53%)',
  studentsPerRoomMoreThan56: 'hsl(0, 84%, 60%)',
  studentsPerRoomNoClassroom: 'hsl(0, 0%, 30%)',
  // Road infrastructure
  roadConcrete: 'hsl(217, 91%, 60%)',
  roadAsphalt: 'hsl(215, 20%, 55%)',
  roadGravel: 'hsl(27, 87%, 67%)',
  roadNatural: 'hsl(25, 5%, 45%)',
  totalRoadLength: 'hsl(25, 95%, 53%)',
  // Utility metrics
  householdsWithElectricity: 'hsl(45, 93%, 47%)',
  householdsWithToilet: 'hsl(217, 91%, 60%)',
  householdsWithInternet: 'hsl(142, 71%, 45%)'
};

/**
 * Prepare grouped bar chart data for comparing entities within a single year
 * Each metric becomes a series, and entities are the categories on x-axis
 */
export function prepareEntityComparisonBarData(
  sitios: SitioRecord[],
  selectedEntityIds: string[],
  level: ComparisonLevel,
  metrics: (keyof YearlyMetrics)[],
  entityNames: Map<string, string>,
  year: number
): GroupedBarChartData {
  // Categories are the entity names
  const categories: string[] = selectedEntityIds.map(
    (entityId) => entityNames.get(entityId) || entityId
  );

  // Each metric becomes a series
  const series = metrics.map((metric) => {
    const data: number[] = selectedEntityIds.map((entityId) => {
      const entitySitios = filterSitiosByEntity(sitios, entityId, level);
      const yearMetrics = aggregateMetricsForYear(entitySitios, year);
      const value = yearMetrics[metric];
      return typeof value === 'number' ? Math.round(value * 10) / 10 : 0;
    });

    return {
      name: METRIC_LABELS[metric] || metric,
      data,
      color: METRIC_COLORS[metric] || 'hsl(217, 91%, 60%)'
    };
  });

  return { categories, series };
}
