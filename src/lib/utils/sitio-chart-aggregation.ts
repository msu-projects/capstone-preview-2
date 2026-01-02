/**
 * Sitio Chart Aggregation Utilities
 * Comprehensive aggregation functions for public sitios dashboard charts
 * Processes SitioRecord[] data with yearlyData structure for visualization
 * Updated to match new SitioProfile interface
 */

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
	totalRoadLength: number;
	povertyCount: number;
	sitioCount: number;
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
	let povertyCount = 0;
	let sitioCount = 0;

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

		// Road lengths
		totalRoadLength +=
			(profile.infrastructure?.concrete?.length || 0) +
			(profile.infrastructure?.asphalt?.length || 0) +
			(profile.infrastructure?.gravel?.length || 0) +
			(profile.infrastructure?.natural?.length || 0);

		// Income data
		if (profile.averageDailyIncome && profile.averageDailyIncome > 0) {
			totalDailyIncome += profile.averageDailyIncome;
			sitiosWithIncome++;

			// Poverty classification (2025 DEPDev threshold: ₱668/day)
			if (profile.averageDailyIncome < 668) povertyCount++;
		}
	}

	const employed = totalLaborWorkforce - totalUnemployed;

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
		totalRoadLength,
		povertyCount,
		sitioCount
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
		laborWorkforce: YoYTrend | null;
		employmentRate: YoYTrend | null;
		averageIncome: YoYTrend | null;
		electricityAccess: YoYTrend | null;
		toiletAccess: YoYTrend | null;
		internetAccess: YoYTrend | null;
		roadLength: YoYTrend | null;
		povertyCount: YoYTrend | null;
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
			povertyCount: previous
				? {
						...calculateYoYChange(current.povertyCount, previous.povertyCount)!,
						// For poverty, decrease is positive
						isPositive: current.povertyCount <= previous.povertyCount
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
		employmentRate: 'Employment Rate',
		participationRate: 'Participation Rate',
		averageDailyIncome: 'Avg Daily Income',
		electricityPercent: 'Electricity',
		toiletPercent: 'Sanitation',
		internetPercent: 'Internet',
		totalRoadLength: 'Road Length (km)',
		povertyCount: 'Below Poverty'
	};

	const metricColors: Record<string, string> = {
		totalPopulation: 'hsl(217, 91%, 60%)',
		totalMale: 'hsl(217, 91%, 60%)',
		totalFemale: 'hsl(330, 81%, 60%)',
		totalHouseholds: 'hsl(142, 71%, 45%)',
		totalLaborWorkforce: 'hsl(262, 83%, 58%)',
		employmentRate: 'hsl(142, 71%, 45%)',
		participationRate: 'hsl(217, 91%, 60%)',
		averageDailyIncome: 'hsl(142, 71%, 45%)',
		electricityPercent: 'hsl(45, 93%, 47%)',
		toiletPercent: 'hsl(187, 85%, 43%)',
		internetPercent: 'hsl(217, 91%, 60%)',
		totalRoadLength: 'hsl(25, 95%, 53%)',
		povertyCount: 'hsl(0, 84%, 60%)'
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

	// Age groups (estimated)
	children: number;
	workingAge: number;
	elderly: number;

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

	// Estimate age groups
	const children = sitios.reduce((sum, s) => {
		const p = getDataForYearOrLatest(s, year);
		return sum + (p?.schoolAgeChildren || 0);
	}, 0);
	const workingAge = totalLaborWorkforce;
	const elderly = totalSeniors;

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

		children,
		workingAge,
		elderly,

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
	fair: number; // condition 3
	poor: number; // condition 2
	critical: number; // condition 1
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
		fair: 0,
		poor: 0,
		critical: 0,
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
				else if (condition === 3) count.fair++;
				else if (condition === 2) count.poor++;
				else if (condition === 1) count.critical++;
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

	// Poverty estimate (based on daily income thresholds)
	povertyCount: number; // Below 668 PHP/day (2025 DEPDev threshold)
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

	let povertyCount = 0;

	const cropCounts = new Map<string, number>();
	const livestockCounts = new Map<string, number>();

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

			// Poverty classification (2025 DEPDev threshold)
			if (profile.averageDailyIncome < 668) povertyCount++;
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

		povertyCount
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
		fair: number;
		poor: number;
		bad: number;
	};
	roadConcrete: {
		exists: number;
		totalLength: number;
		excellent: number;
		good: number;
		fair: number;
		poor: number;
		bad: number;
	};
	roadGravel: {
		exists: number;
		totalLength: number;
		excellent: number;
		good: number;
		fair: number;
		poor: number;
		bad: number;
	};
	roadNatural: {
		exists: number;
		totalLength: number;
		excellent: number;
		good: number;
		fair: number;
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
		roadAsphalt: { exists: 0, totalLength: 0, excellent: 0, good: 0, fair: 0, poor: 0, bad: 0 },
		roadConcrete: { exists: 0, totalLength: 0, excellent: 0, good: 0, fair: 0, poor: 0, bad: 0 },
		roadGravel: { exists: 0, totalLength: 0, excellent: 0, good: 0, fair: 0, poor: 0, bad: 0 },
		roadNatural: { exists: 0, totalLength: 0, excellent: 0, good: 0, fair: 0, poor: 0, bad: 0 },

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
		road: { excellent: number; good: number; fair: number; poor: number; bad: number }
	) => {
		if (!condition) return;
		if (condition === 5) road.excellent++;
		else if (condition === 4) road.good++;
		else if (condition === 3) road.fair++;
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
	floodFrequencyCounts: Map<string, number>;
	landslideFrequencyCounts: Map<string, number>;
	droughtFrequencyCounts: Map<string, number>;
	earthquakeFrequencyCounts: Map<string, number>;

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

		const floodFreq = hz.flood.frequency || '0';
		result.floodFrequencyCounts.set(
			floodFreq,
			(result.floodFrequencyCounts.get(floodFreq) || 0) + 1
		);

		const landslideFreq = hz.landslide.frequency || '0';
		result.landslideFrequencyCounts.set(
			landslideFreq,
			(result.landslideFrequencyCounts.get(landslideFreq) || 0) + 1
		);

		const droughtFreq = hz.drought.frequency || '0';
		result.droughtFrequencyCounts.set(
			droughtFreq,
			(result.droughtFrequencyCounts.get(droughtFreq) || 0) + 1
		);

		const earthquakeFreq = hz.earthquake.frequency || '0';
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
