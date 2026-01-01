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

export function aggregateDemographics(sitios: SitioRecord[]): DemographicsAggregation {
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

	let gidaCount = 0;
	let indigenousCount = 0;
	let conflictCount = 0;

	for (const sitio of sitios) {
		const profile = getLatestYearData(sitio);
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
		const p = getLatestYearData(s);
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

export function aggregateUtilities(sitios: SitioRecord[]): UtilitiesAggregation {
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
		const profile = getLatestYearData(sitio);
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

export function aggregateFacilities(sitios: SitioRecord[]): FacilitiesAggregation {
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
		const profile = getLatestYearData(sitio);
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
	workerUnpaidFamily: number;

	// Crops and livestock counts
	cropCounts: Map<string, number>;
	livestockCounts: Map<string, number>;

	// Poverty estimate (based on daily income thresholds)
	povertyCount: number; // Below 400 PHP/day
	vulnerableCount: number; // 400-600 PHP/day
}

export function aggregateLivelihood(sitios: SitioRecord[]): LivelihoodAggregation {
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
	let workerUnpaidFamily = 0;

	let povertyCount = 0;
	let vulnerableCount = 0;

	const cropCounts = new Map<string, number>();
	const livestockCounts = new Map<string, number>();

	for (const sitio of sitios) {
		const profile = getLatestYearData(sitio);
		if (!profile) continue;

		// Agriculture
		totalFarmers += profile.agriculture.numberOfFarmers || 0;
		totalFarmArea += profile.agriculture.estimatedFarmAreaHectares || 0;
		totalFarmerOrgs += profile.agriculture.numberOfAssociations || 0;

		// Daily income
		if (profile.averageDailyIncome > 0) {
			averageDailyIncomeTotal += profile.averageDailyIncome;
			sitiosWithIncome++;

			if (profile.averageDailyIncome < 400) povertyCount++;
			else if (profile.averageDailyIncome < 600) vulnerableCount++;
		}

		// Worker class
		if (profile.workerClass.privateHousehold) workerPrivateHousehold++;
		if (profile.workerClass.privateEstablishment) workerPrivateEstablishment++;
		if (profile.workerClass.government) workerGovernment++;
		if (profile.workerClass.selfEmployed) workerSelfEmployed++;
		if (profile.workerClass.employer) workerEmployer++;
		if (profile.workerClass.ofw) workerUnpaidFamily++;

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
		workerUnpaidFamily,

		cropCounts,
		livestockCounts,

		povertyCount,
		vulnerableCount
	};
}

// ==========================================
// INFRASTRUCTURE AGGREGATION
// ==========================================

export interface InfrastructureAggregation {
	// Road types with existence and condition
	roadAsphalt: { exists: number; avgCondition: number; totalLength: number };
	roadConcrete: { exists: number; avgCondition: number; totalLength: number };
	roadGravel: { exists: number; avgCondition: number; totalLength: number };
	roadNatural: { exists: number; avgCondition: number; totalLength: number };

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

export function aggregateInfrastructure(sitios: SitioRecord[]): InfrastructureAggregation {
	const result: InfrastructureAggregation = {
		roadAsphalt: { exists: 0, avgCondition: 0, totalLength: 0 },
		roadConcrete: { exists: 0, avgCondition: 0, totalLength: 0 },
		roadGravel: { exists: 0, avgCondition: 0, totalLength: 0 },
		roadNatural: { exists: 0, avgCondition: 0, totalLength: 0 },

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

	// Accumulators for road conditions
	const roadConditions = {
		asphalt: { total: 0, count: 0 },
		concrete: { total: 0, count: 0 },
		gravel: { total: 0, count: 0 },
		natural: { total: 0, count: 0 }
	};

	for (const sitio of sitios) {
		const profile = getLatestYearData(sitio);
		if (!profile) continue;

		// Infrastructure - Roads
		const infra = profile.infrastructure;

		if (infra.asphalt.exists === 'yes') {
			result.roadAsphalt.exists++;
			result.roadAsphalt.totalLength += infra.asphalt.length || 0;
			if (infra.asphalt.condition) {
				roadConditions.asphalt.total += infra.asphalt.condition;
				roadConditions.asphalt.count++;
			}
		}

		if (infra.concrete.exists === 'yes') {
			result.roadConcrete.exists++;
			result.roadConcrete.totalLength += infra.concrete.length || 0;
			if (infra.concrete.condition) {
				roadConditions.concrete.total += infra.concrete.condition;
				roadConditions.concrete.count++;
			}
		}

		if (infra.gravel.exists === 'yes') {
			result.roadGravel.exists++;
			result.roadGravel.totalLength += infra.gravel.length || 0;
			if (infra.gravel.condition) {
				roadConditions.gravel.total += infra.gravel.condition;
				roadConditions.gravel.count++;
			}
		}

		if (infra.natural.exists === 'yes') {
			result.roadNatural.exists++;
			result.roadNatural.totalLength += infra.natural.length || 0;
			if (infra.natural.condition) {
				roadConditions.natural.total += infra.natural.condition;
				roadConditions.natural.count++;
			}
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

	// Calculate average conditions
	result.roadAsphalt.avgCondition =
		roadConditions.asphalt.count > 0
			? roadConditions.asphalt.total / roadConditions.asphalt.count
			: 0;
	result.roadConcrete.avgCondition =
		roadConditions.concrete.count > 0
			? roadConditions.concrete.total / roadConditions.concrete.count
			: 0;
	result.roadGravel.avgCondition =
		roadConditions.gravel.count > 0 ? roadConditions.gravel.total / roadConditions.gravel.count : 0;
	result.roadNatural.avgCondition =
		roadConditions.natural.count > 0
			? roadConditions.natural.total / roadConditions.natural.count
			: 0;

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

export function aggregatePriorities(sitios: SitioRecord[]): PrioritiesAggregation {
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
		const profile = getLatestYearData(sitio);
		if (!profile) continue;

		const p = profile.priorities;

		// Water System (index 0)
		const waterSystem = p[0]?.name ?? 0;
		result.waterSystem.totalScore += waterSystem;
		if (waterSystem === 3) result.waterSystem.urgentCount++;

		// Community CR (index 1)
		const communityCR = p[1]?.name ?? 0;
		result.communityCR.totalScore += communityCR;
		if (communityCR === 3) result.communityCR.urgentCount++;

		// Solar Street Lights (index 2)
		const solarStreetLights = p[2]?.name ?? 0;
		result.solarStreetLights.totalScore += solarStreetLights;
		if (solarStreetLights === 3) result.solarStreetLights.urgentCount++;

		// Road Opening (index 3)
		const roadOpening = p[3]?.name ?? 0;
		result.roadOpening.totalScore += roadOpening;
		if (roadOpening === 3) result.roadOpening.urgentCount++;

		// Farm Tools (index 4)
		const farmTools = p[4]?.name ?? 0;
		result.farmTools.totalScore += farmTools;
		if (farmTools === 3) result.farmTools.urgentCount++;

		// Health Services (index 5)
		const healthServices = p[5]?.name ?? 0;
		result.healthServices.totalScore += healthServices;
		if (healthServices === 3) result.healthServices.urgentCount++;

		// Education Support (index 6)
		const educationSupport = p[6]?.name ?? 0;
		result.educationSupport.totalScore += educationSupport;
		if (educationSupport === 3) result.educationSupport.urgentCount++;

		// Others (index 7 if it exists)
		if (p.length > 7) {
			// Note: with the new structure, we don't have othersSpecify anymore
			// This section can be removed or adapted based on requirements
		}
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

	// Peace and order
	peaceOrderStable: number;
	peaceOrderTensions: number;
	peaceOrderUnstable: number;

	// Food security
	foodSecure: number;
	foodSeasonalScarcity: number;
	foodCriticalShortage: number;
}

export function aggregateSafety(sitios: SitioRecord[]): SafetyAggregation {
	const result: SafetyAggregation = {
		floodFrequencyCounts: new Map(),
		landslideFrequencyCounts: new Map(),
		droughtFrequencyCounts: new Map(),
		earthquakeFrequencyCounts: new Map(),

		peaceOrderStable: 0,
		peaceOrderTensions: 0,
		peaceOrderUnstable: 0,

		foodSecure: 0,
		foodSeasonalScarcity: 0,
		foodCriticalShortage: 0
	};

	for (const sitio of sitios) {
		const profile = getLatestYearData(sitio);
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

		// Peace and Order
		switch (profile.peaceOrder) {
			case 'stable':
				result.peaceOrderStable++;
				break;
			case 'occasional_tensions':
				result.peaceOrderTensions++;
				break;
			case 'unstable':
				result.peaceOrderUnstable++;
				break;
		}

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

export function aggregateGeographic(sitios: SitioRecord[]): GeographicAggregation {
	const municipalityMap = new Map<string, MunicipalityData>();
	const barangaySet = new Set<string>();

	for (const sitio of sitios) {
		const profile = getLatestYearData(sitio);
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
