/**
 * Sitio Generator
 * Main generator for sitio records with yearly data
 */

import { MUNICIPALITIES_DATA } from '$lib/config/location-data';
import type {
	PriorityItem,
	PriorityName,
	PriorityRating,
	SitioProfile,
	SitioRecord
} from '$lib/types';
import { clearSitios, loadSitios, saveSitios } from '$lib/utils/storage';
import { getMunicipalityProfile, type MunicipalityProfile } from './municipality-profiles';
import { SeededRandom } from './seeded-random';
import {
	generateFacilityDetails,
	generateHazardDetails,
	generateRoadDetails,
	generateSitioName,
	generateWaterSourceStatus,
	selectCrops,
	selectLivestock
} from './sitio-generator-helpers';

// ===== STORAGE KEYS =====
export const STORAGE_VERSION = 8; // Increment to clear outdated data (improved mock data realism)
export const STORAGE_VERSION_KEY = 'sccdp_storage_version';
export const MOCK_DATA_INITIALIZED_KEY = 'sccdp_mock_data_initialized';

// ===== STORAGE VERSION CHECK =====

function isStorageOutdated(): boolean {
	if (typeof window === 'undefined') return false;
	const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
	return storedVersion !== String(STORAGE_VERSION);
}

function clearAllStorage(): void {
	if (typeof window === 'undefined') return;
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith('sccdp_')) {
			keysToRemove.push(key);
		}
	}
	keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function setStorageVersion(): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
}

// ===== INITIALIZATION CHECK =====

export function isMockDataInitialized(): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem(MOCK_DATA_INITIALIZED_KEY) === 'true';
}

export function markMockDataInitialized(): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(MOCK_DATA_INITIALIZED_KEY, 'true');
}

export function initializeMockDataIfNeeded(): { sitios: SitioRecord[] } {
	if (typeof window === 'undefined') {
		// Server-side: generate fresh data for SSR with 3 years (2023-2025)
		const sitios = generateSitios(50, 42, 2023, 3);
		return { sitios };
	}

	// Check if storage is outdated - if so, clear everything
	if (isStorageOutdated()) {
		clearAllStorage();
	}

	// Check if already initialized
	if (isMockDataInitialized()) {
		// Load from localStorage using storage.ts
		const sitios = loadSitios();
		return { sitios };
	}

	// Generate and save mock data with 3 years (2023-2025)
	const sitios = generateSitios(50, 42, 2023, 3);

	saveSitios(sitios);
	markMockDataInitialized();
	setStorageVersion();

	return { sitios };
}

// ===== RESET FUNCTION =====

export function resetMockData(): { sitios: SitioRecord[] } {
	if (typeof window === 'undefined') {
		return { sitios: [] };
	}

	// Clear existing data using storage.ts
	localStorage.removeItem(MOCK_DATA_INITIALIZED_KEY);
	clearSitios();

	// Regenerate with new seed based on current time and 3 years of data (2023-2025)
	const seed = Date.now() % 1000000;
	const sitios = generateSitios(50, seed, 2023, 3);

	saveSitios(sitios);
	markMockDataInitialized();

	return { sitios };
}

// ===== MAIN SITIO PROFILE GENERATOR =====

export function generateSitios(
	count: number = 50,
	seed: number = 42,
	startYear: number = new Date().getFullYear(),
	yearsToGenerate: number = 1
): SitioRecord[] {
	const rng = new SeededRandom(seed);
	const sitios: SitioRecord[] = [];
	const usedSitioNames = new Set<string>();

	// Flatten municipality/barangay data for easier picking
	const locations = MUNICIPALITIES_DATA.flatMap((m) =>
		m.barangays.map((b) => ({ municipality: m.name, barangay: b }))
	);

	for (let i = 1; i <= count; i++) {
		const location = rng.pick(locations);
		const municipality = location.municipality;
		const barangay = location.barangay;
		const municipalityProfile = getMunicipalityProfile(municipality);

		// ========== DETERMINE SITIO CLASSIFICATION FIRST ==========
		// This affects everything else
		const sitioClassification = {
			gida: rng.boolean(municipalityProfile.gidaProbability),
			indigenous: rng.boolean(municipalityProfile.indigenousProbability),
			conflict: rng.boolean(municipalityProfile.conflictProbability)
		};

		// Generate realistic sitio name
		const sitioName = generateSitioName(
			rng,
			municipalityProfile.type,
			sitioClassification.indigenous,
			usedSitioNames
		);

		// Generate sitio code based on location
		const coding = `${municipality.substring(0, 3).toUpperCase()}-${barangay.substring(0, 2).toUpperCase()}-${String(rng.nextInt(100, 999))}`;

		// ========== GENERATE REALISTIC COORDINATES ==========
		// Based on municipality center with appropriate spread
		const latOffset = (rng.next() - 0.5) * 2 * municipalityProfile.latSpread;
		const lngOffset = (rng.next() - 0.5) * 2 * municipalityProfile.lngSpread;
		const latitude = Number((municipalityProfile.centerLat + latOffset).toFixed(6));
		const longitude = Number((municipalityProfile.centerLng + lngOffset).toFixed(6));

		// Generate yearly data with realistic year-over-year changes
		const yearlyData: { [year: string]: SitioProfile } = {};
		const availableYears: number[] = [];

		// Store base values for year-over-year progression
		let basePopulation = 0;
		let baseHouseholds = 0;

		for (let yearOffset = 0; yearOffset < yearsToGenerate; yearOffset++) {
			const currentYear = startYear + yearOffset;
			availableYears.push(currentYear);

			// Create a year-specific RNG for variation
			const yearRng = new SeededRandom(seed + i * 1000 + yearOffset * 100);

			// Generate profile for this year with progression
			const profile = generateYearProfile(
				yearRng,
				municipality,
				barangay,
				sitioName,
				coding,
				latitude,
				longitude,
				sitioClassification,
				municipalityProfile,
				yearOffset,
				basePopulation,
				baseHouseholds
			);

			yearlyData[String(currentYear)] = profile;

			// Store base values for next year's progression
			if (yearOffset === 0) {
				basePopulation = profile.totalPopulation;
				baseHouseholds = profile.totalHouseholds;
			}
		}

		// Wrap profile in SitioRecord structure
		const now = new Date().toISOString();
		const record: SitioRecord = {
			id: i,
			municipality,
			barangay,
			sitioName,
			coding,
			latitude,
			longitude,
			sitioClassification,
			yearlyData,
			availableYears,
			createdAt: now,
			updatedAt: now
		};

		sitios.push(record);
	}

	return sitios;
}

// ===== HELPER FUNCTION TO GENERATE PROFILE FOR A SPECIFIC YEAR =====

function generateYearProfile(
	rng: SeededRandom,
	municipality: string,
	barangay: string,
	sitioName: string,
	sitioCode: string,
	latitude: number,
	longitude: number,
	sitioClassification: { gida: boolean; indigenous: boolean; conflict: boolean },
	municipalityProfile: MunicipalityProfile,
	yearOffset: number,
	basePopulation: number,
	baseHouseholds: number
): SitioProfile {
	const isGida = sitioClassification.gida;
	const isIndigenous = sitioClassification.indigenous;
	const infraLevel = municipalityProfile.infrastructureLevel * (isGida ? 0.6 : 1.0);

	// ========== A. BASIC SITIO INFORMATION ==========
	// Access depends on development level and geography
	const mainAccess = {
		pavedRoad: rng.boolean(infraLevel * 0.7),
		unpavedRoad: rng.boolean(0.5 + infraLevel * 0.3),
		footpath: rng.boolean(isGida ? 0.7 : 0.3),
		boat: rng.boolean(municipalityProfile.name === 'LAKE SEBU' ? 0.3 : 0.05)
	};

	// Ensure at least one access method
	if (
		!mainAccess.pavedRoad &&
		!mainAccess.unpavedRoad &&
		!mainAccess.footpath &&
		!mainAccess.boat
	) {
		mainAccess.footpath = true;
	}

	// ========== B. POPULATION & DEMOGRAPHICS ==========
	// Use realistic Philippine demographic patterns

	// Base household count - varies by municipality type
	let totalHouseholds: number;
	if (yearOffset === 0 || baseHouseholds === 0) {
		const householdRange = {
			urban: { min: 80, max: 300 },
			'semi-urban': { min: 50, max: 200 },
			rural: { min: 30, max: 150 },
			highland: { min: 20, max: 100 }
		};
		const range = householdRange[municipalityProfile.type];
		totalHouseholds = rng.nextInt(range.min, range.max);
	} else {
		// Year-over-year growth: 1-3% household growth
		const growthRate = 1 + rng.nextFloat(0.01, 0.03);
		totalHouseholds = Math.round(baseHouseholds * growthRate);
	}

	// Realistic Philippine household size: 4.1 average (PSA data)
	// But varies: urban tends smaller, rural/indigenous tends larger
	const avgHouseholdSize =
		municipalityProfile.type === 'urban'
			? rng.nextGaussianClamped(3.8, 0.5, 3, 6)
			: isIndigenous
				? rng.nextGaussianClamped(5.2, 0.8, 4, 8)
				: rng.nextGaussianClamped(4.4, 0.6, 3, 7);

	let totalPopulation: number;
	if (yearOffset === 0 || basePopulation === 0) {
		totalPopulation = Math.round(totalHouseholds * avgHouseholdSize);
	} else {
		// Population grows slightly faster than households due to births
		const growthRate = 1 + rng.nextFloat(0.015, 0.035);
		totalPopulation = Math.round(basePopulation * growthRate);
	}

	// Gender distribution: Philippines is roughly 50.4% male, 49.6% female
	const malePercent = rng.nextGaussianClamped(0.504, 0.015, 0.48, 0.52);
	const totalMale = Math.round(totalPopulation * malePercent);
	const totalFemale = totalPopulation - totalMale;

	// Age distribution based on Philippine demographics (PSA 2020)
	// 0-14: ~30%, 15-64: ~64%, 65+: ~6%
	const childrenPercent = rng.nextGaussianClamped(0.3, 0.04, 0.22, 0.4);
	const seniorPercent = rng.nextGaussianClamped(0.065, 0.015, 0.04, 0.12);
	const workingAgePercent = 1 - childrenPercent - seniorPercent;

	const schoolAgeChildren = Math.round(totalPopulation * childrenPercent);
	const seniorsCount = Math.round(totalPopulation * seniorPercent);
	const laborForceCount = Math.round(totalPopulation * workingAgePercent);

	// 60-64 are about 30-40% of 60+ population
	const laborForce60to64Count = Math.round(seniorsCount * rng.nextFloat(0.3, 0.4));

	// Registered voters (18+): roughly 55-65% of population
	const voterEligiblePercent = 1 - childrenPercent * 0.6; // Kids under 18
	const registrationRate = rng.nextFloat(0.75, 0.92);
	const registeredVoters = Math.round(totalPopulation * voterEligiblePercent * registrationRate);

	// Unemployment varies by area type
	const baseUnemploymentRate =
		municipalityProfile.type === 'urban'
			? 0.08
			: municipalityProfile.type === 'highland'
				? 0.15
				: 0.12;
	const unemploymentRate = rng.nextGaussianClamped(baseUnemploymentRate, 0.04, 0.03, 0.35);
	const unemployedCount = Math.round(laborForceCount * unemploymentRate);

	// Vulnerable Groups
	// Muslim population - more common in certain areas
	const muslimProbability = sitioClassification.conflict ? 0.4 : 0.15;
	const muslimCount = rng.boolean(muslimProbability)
		? Math.round(totalPopulation * rng.nextFloat(0.05, 0.3))
		: rng.nextInt(0, Math.floor(totalPopulation * 0.05));

	// IP population - highly correlated with indigenous classification
	const ipCount = isIndigenous
		? Math.round(totalPopulation * rng.nextFloat(0.6, 0.95))
		: rng.boolean(0.2)
			? Math.round(totalPopulation * rng.nextFloat(0.02, 0.15))
			: 0;

	// Documentation gaps - worse in GIDA and indigenous areas
	const birthCertGapRate = isGida
		? rng.nextFloat(0.08, 0.25)
		: isIndigenous
			? rng.nextFloat(0.05, 0.18)
			: rng.nextFloat(0.01, 0.08);
	const noBirthCertCount = Math.round(schoolAgeChildren * birthCertGapRate);

	const nationalIdGapRate = isGida
		? rng.nextFloat(0.15, 0.35)
		: isIndigenous
			? rng.nextFloat(0.1, 0.28)
			: rng.nextFloat(0.05, 0.15);
	const noNationalIDCount = Math.round(laborForceCount * nationalIdGapRate);

	// Out of school youth - correlated with poverty and remoteness
	const osyRate = isGida
		? rng.nextFloat(0.08, 0.2)
		: municipalityProfile.type === 'urban'
			? rng.nextFloat(0.02, 0.08)
			: rng.nextFloat(0.04, 0.12);
	const youthPopulation = Math.round(totalPopulation * 0.18); // 15-24 age group
	const outOfSchoolYouth = Math.round(youthPopulation * osyRate);

	// ========== C. BASIC UTILITIES & CONNECTIVITY ==========

	// Toilet access - better in urban, worse in GIDA
	const toiletRate = isGida
		? rng.nextFloat(0.35, 0.65)
		: municipalityProfile.type === 'urban'
			? rng.nextFloat(0.85, 0.98)
			: rng.nextFloat(0.55, 0.85);
	const householdsWithToilet = Math.round(totalHouseholds * toiletRate);

	// Electricity access
	const electricityRate = isGida
		? rng.nextFloat(0.25, 0.6)
		: municipalityProfile.type === 'urban'
			? rng.nextFloat(0.92, 0.99)
			: rng.nextFloat(0.65, 0.9);
	const householdsWithElectricity = Math.round(totalHouseholds * electricityRate);

	// Electricity sources - distribution depends on access and area type
	const electricitySources = {
		grid: 0,
		solar: 0,
		battery: 0,
		generator: 0
	};

	if (householdsWithElectricity > 0) {
		if (isGida) {
			// GIDA: more solar and alternative sources
			electricitySources.grid = Math.round(householdsWithElectricity * rng.nextFloat(0.2, 0.5));
			electricitySources.solar = Math.round(householdsWithElectricity * rng.nextFloat(0.2, 0.5));
			electricitySources.battery = Math.round(householdsWithElectricity * rng.nextFloat(0.1, 0.3));
			electricitySources.generator = Math.round(
				householdsWithElectricity * rng.nextFloat(0.05, 0.2)
			);
		} else {
			// Non-GIDA: mostly grid
			electricitySources.grid = Math.round(householdsWithElectricity * rng.nextFloat(0.75, 0.95));
			electricitySources.solar = rng.boolean(0.3)
				? Math.round(householdsWithElectricity * rng.nextFloat(0.02, 0.1))
				: 0;
			electricitySources.battery = rng.boolean(0.15) ? rng.nextInt(1, 5) : 0;
			electricitySources.generator = rng.boolean(0.2) ? rng.nextInt(1, 8) : 0;
		}
	}

	// Mobile signal - depends on terrain and remoteness
	type MobileSignal = 'none' | '2g' | '3g' | '4g' | '5g';
	const signalOptions: MobileSignal[] = ['none', '2g', '3g', '4g', '5g'];
	let signalWeights: number[];

	if (municipalityProfile.type === 'urban') {
		signalWeights = [0.01, 0.02, 0.1, 0.5, 0.37];
	} else if (municipalityProfile.type === 'semi-urban') {
		signalWeights = [0.02, 0.05, 0.2, 0.55, 0.18];
	} else if (isGida || municipalityProfile.type === 'highland') {
		signalWeights = [0.15, 0.25, 0.35, 0.2, 0.05];
	} else {
		signalWeights = [0.05, 0.1, 0.3, 0.45, 0.1];
	}

	const mobileSignal = rng.pickWeighted(signalOptions, signalWeights);

	// Internet access - strongly correlated with signal quality
	const internetRateBySignal: Record<MobileSignal, number> = {
		none: 0.02,
		'2g': 0.08,
		'3g': 0.25,
		'4g': 0.45,
		'5g': 0.65
	};
	const baseInternetRate = internetRateBySignal[mobileSignal];
	const adjustedInternetRate =
		baseInternetRate * (municipalityProfile.type === 'urban' ? 1.3 : 1.0);
	const householdsWithInternet = Math.round(
		totalHouseholds * Math.min(0.9, adjustedInternetRate + rng.nextFloat(-0.1, 0.1))
	);

	// ========== D. COMMUNITY FACILITIES ==========
	const facilities = {
		healthCenter: generateFacilityDetails(rng, 0.5, totalPopulation, infraLevel, isGida),
		pharmacy: generateFacilityDetails(rng, 0.35, totalPopulation, infraLevel, isGida),
		communityToilet: generateFacilityDetails(rng, 0.4, totalPopulation, infraLevel, isGida),
		kindergarten: generateFacilityDetails(rng, 0.6, totalPopulation, infraLevel, isGida),
		elementarySchool: generateFacilityDetails(rng, 0.7, totalPopulation, infraLevel, isGida),
		highSchool: generateFacilityDetails(rng, 0.35, totalPopulation, infraLevel, isGida),
		madrasah: generateFacilityDetails(
			rng,
			muslimCount > 50 ? 0.6 : muslimCount > 20 ? 0.3 : 0.05,
			totalPopulation,
			infraLevel,
			isGida
		),
		market: generateFacilityDetails(rng, 0.4, totalPopulation, infraLevel, isGida)
	};

	// ========== E. ROADS & INTERNAL INFRASTRUCTURE ==========
	const infrastructure = {
		asphalt: generateRoadDetails(rng, 'asphalt', infraLevel, isGida, totalPopulation),
		concrete: generateRoadDetails(rng, 'concrete', infraLevel, isGida, totalPopulation),
		gravel: generateRoadDetails(rng, 'gravel', infraLevel, isGida, totalPopulation),
		natural: generateRoadDetails(rng, 'natural', infraLevel, isGida, totalPopulation)
	};

	// ========== F. EDUCATION STATUS ==========
	// Students per room - depends on infrastructure and remoteness
	type StudentsPerRoom = 'less_than_46' | '46_50' | '51_55' | 'more_than_56' | 'no_classroom';
	const roomOptions: StudentsPerRoom[] = [
		'less_than_46',
		'46_50',
		'51_55',
		'more_than_56',
		'no_classroom'
	];
	let roomWeights: number[];

	if (facilities.elementarySchool.exists === 'no') {
		roomWeights = [0, 0, 0, 0, 1]; // No classroom if no school
	} else if (municipalityProfile.type === 'urban') {
		roomWeights = [0.35, 0.3, 0.2, 0.12, 0.03];
	} else if (isGida) {
		roomWeights = [0.15, 0.2, 0.25, 0.25, 0.15];
	} else {
		roomWeights = [0.25, 0.28, 0.25, 0.17, 0.05];
	}

	const studentsPerRoom = rng.pickWeighted(roomOptions, roomWeights);

	// ========== G. WATER & SANITATION ==========
	const waterSources = {
		natural: generateWaterSourceStatus(rng, 'natural', infraLevel, isGida, totalHouseholds),
		level1: generateWaterSourceStatus(rng, 'level1', infraLevel, isGida, totalHouseholds),
		level2: generateWaterSourceStatus(rng, 'level2', infraLevel, isGida, totalHouseholds),
		level3: generateWaterSourceStatus(rng, 'level3', infraLevel, isGida, totalHouseholds)
	};

	// Sanitation types - correlate with development
	const sanitationTypes = {
		waterSealed: rng.boolean(infraLevel * 0.8 + 0.2),
		pitLatrine: rng.boolean(isGida ? 0.6 : 0.25),
		communityCR: rng.boolean(infraLevel * 0.4),
		openDefecation: rng.boolean(isGida ? 0.25 : 0.05)
	};

	// Ensure at least one sanitation type
	if (!sanitationTypes.waterSealed && !sanitationTypes.pitLatrine && !sanitationTypes.communityCR) {
		sanitationTypes.pitLatrine = true;
	}

	// ========== H. LIVELIHOOD & AGRICULTURE ==========
	const totalWorkers = laborForceCount - unemployedCount;

	// Worker distribution varies by municipality type
	type WorkerCategory =
		| 'privateHousehold'
		| 'privateEstablishment'
		| 'government'
		| 'selfEmployed'
		| 'employer'
		| 'ofw';

	const distributionByType: Record<
		string,
		Record<WorkerCategory, { base: number; variance: number }>
	> = {
		urban: {
			privateHousehold: { base: 0.06, variance: 0.03 },
			privateEstablishment: { base: 0.35, variance: 0.1 },
			government: { base: 0.18, variance: 0.06 },
			selfEmployed: { base: 0.25, variance: 0.08 },
			employer: { base: 0.06, variance: 0.03 },
			ofw: { base: 0.1, variance: 0.05 }
		},
		'semi-urban': {
			privateHousehold: { base: 0.08, variance: 0.03 },
			privateEstablishment: { base: 0.25, variance: 0.08 },
			government: { base: 0.12, variance: 0.05 },
			selfEmployed: { base: 0.35, variance: 0.1 },
			employer: { base: 0.05, variance: 0.03 },
			ofw: { base: 0.15, variance: 0.06 }
		},
		rural: {
			privateHousehold: { base: 0.1, variance: 0.04 },
			privateEstablishment: { base: 0.12, variance: 0.05 },
			government: { base: 0.08, variance: 0.04 },
			selfEmployed: { base: 0.5, variance: 0.12 },
			employer: { base: 0.08, variance: 0.04 },
			ofw: { base: 0.12, variance: 0.05 }
		},
		highland: {
			privateHousehold: { base: 0.05, variance: 0.03 },
			privateEstablishment: { base: 0.05, variance: 0.03 },
			government: { base: 0.05, variance: 0.03 },
			selfEmployed: { base: 0.7, variance: 0.1 },
			employer: { base: 0.1, variance: 0.05 },
			ofw: { base: 0.05, variance: 0.03 }
		}
	};

	const distConfig = distributionByType[municipalityProfile.type] || distributionByType.rural;
	const workerDistribution: Record<WorkerCategory, number> = {
		privateHousehold:
			distConfig.privateHousehold.base +
			rng.nextFloat(-distConfig.privateHousehold.variance, distConfig.privateHousehold.variance),
		privateEstablishment:
			distConfig.privateEstablishment.base +
			rng.nextFloat(
				-distConfig.privateEstablishment.variance,
				distConfig.privateEstablishment.variance
			),
		government:
			distConfig.government.base +
			rng.nextFloat(-distConfig.government.variance, distConfig.government.variance),
		selfEmployed:
			distConfig.selfEmployed.base +
			rng.nextFloat(-distConfig.selfEmployed.variance, distConfig.selfEmployed.variance),
		employer:
			distConfig.employer.base +
			rng.nextFloat(-distConfig.employer.variance, distConfig.employer.variance),
		ofw: distConfig.ofw.base + rng.nextFloat(-distConfig.ofw.variance, distConfig.ofw.variance)
	};

	// Normalize to sum to 1.0
	const distributionSum = Object.values(workerDistribution).reduce((a, b) => a + b, 0);
	(Object.keys(workerDistribution) as WorkerCategory[]).forEach((key) => {
		workerDistribution[key] = Math.max(0, workerDistribution[key] / distributionSum);
	});

	// Calculate actual counts
	const workerCounts = {
		privateHousehold: Math.floor(totalWorkers * workerDistribution.privateHousehold),
		privateEstablishment: Math.floor(totalWorkers * workerDistribution.privateEstablishment),
		government: Math.floor(totalWorkers * workerDistribution.government),
		selfEmployed: Math.floor(totalWorkers * workerDistribution.selfEmployed),
		employer: Math.floor(totalWorkers * workerDistribution.employer),
		ofw: 0
	};

	// Assign remaining to largest category (self-employed usually)
	const assignedWorkers = Object.values(workerCounts).reduce((a, b) => a + b, 0);
	workerCounts.ofw = Math.max(0, totalWorkers - assignedWorkers);

	const workerClass = workerCounts;

	// Average daily income - based on municipality and employment patterns
	// Philippine minimum wage in Region XII is around ₱341-400/day (2024)
	const baseIncome = 350 * municipalityProfile.baseIncomeMultiplier;
	const incomeVariance = baseIncome * 0.4;
	const averageDailyIncome = Math.round(
		rng.nextGaussianClamped(baseIncome, incomeVariance, 200, 1200)
	);

	// Agriculture - more prominent in rural/highland areas
	const farmingProbability =
		municipalityProfile.type === 'urban'
			? 0.3
			: municipalityProfile.type === 'highland'
				? 0.85
				: 0.7;

	const hasFarming = rng.boolean(farmingProbability);
	const farmerPercent = hasFarming ? rng.nextFloat(0.15, 0.6) : 0;
	const numberOfFarmers = Math.round(totalWorkers * farmerPercent);

	const agriculture = {
		numberOfFarmers,
		numberOfAssociations:
			numberOfFarmers > 30 ? rng.nextInt(1, Math.min(5, Math.floor(numberOfFarmers / 25))) : 0,
		estimatedFarmAreaHectares:
			numberOfFarmers > 0 ? Math.round(numberOfFarmers * rng.nextFloat(0.5, 3)) : 0
	};

	// Crops and Livestock - use profile-based selection
	const crops = selectCrops(rng, municipalityProfile);
	const livestock = selectLivestock(rng, municipalityProfile);

	// ========== I. SAFETY & RISK CONTEXT ==========
	const hazards = {
		flood: generateHazardDetails(rng, 'flood', municipalityProfile),
		landslide: generateHazardDetails(rng, 'landslide', municipalityProfile),
		drought: generateHazardDetails(rng, 'drought', municipalityProfile),
		earthquake: generateHazardDetails(rng, 'earthquake', municipalityProfile)
	};

	// Food security - correlates with income and agriculture
	type FoodSecurityStatus = 'secure' | 'seasonal_scarcity' | 'critical_shortage';
	const foodSecurityOptions: FoodSecurityStatus[] = [
		'secure',
		'seasonal_scarcity',
		'critical_shortage'
	];

	let foodSecurityWeights: number[];
	if (averageDailyIncome > 500 && !isGida) {
		foodSecurityWeights = [0.7, 0.25, 0.05];
	} else if (isGida || averageDailyIncome < 300) {
		foodSecurityWeights = [0.25, 0.45, 0.3];
	} else {
		foodSecurityWeights = [0.5, 0.4, 0.1];
	}

	const foodSecurity = rng.pickWeighted(foodSecurityOptions, foodSecurityWeights);

	// ========== J. SITIO PRIORITY NEEDS ==========
	// Priorities should correlate with actual conditions
	const priorityNames: PriorityName[] = [
		'waterSystem',
		'communityCR',
		'solarStreetLights',
		'roadOpening',
		'farmTools',
		'healthServices',
		'educationSupport'
	];

	const priorities: PriorityItem[] = priorityNames.map((name) => {
		let baseWeight: number[];

		switch (name) {
			case 'waterSystem':
				// Higher priority if water sources are lacking
				if (waterSources.level2.exists === 'no' && waterSources.level3.exists === 'no') {
					baseWeight = [0.05, 0.15, 0.35, 0.45];
				} else {
					baseWeight = [0.35, 0.35, 0.2, 0.1];
				}
				break;

			case 'communityCR':
				// Higher if toilet access is low
				if (householdsWithToilet / totalHouseholds < 0.5) {
					baseWeight = [0.05, 0.2, 0.35, 0.4];
				} else {
					baseWeight = [0.4, 0.35, 0.2, 0.05];
				}
				break;

			case 'solarStreetLights':
				// Higher if electricity is low or GIDA
				if (isGida || householdsWithElectricity / totalHouseholds < 0.5) {
					baseWeight = [0.1, 0.2, 0.35, 0.35];
				} else {
					baseWeight = [0.35, 0.35, 0.25, 0.05];
				}
				break;

			case 'roadOpening':
				// Higher if only footpath or natural roads
				if (!mainAccess.pavedRoad && !mainAccess.unpavedRoad) {
					baseWeight = [0.05, 0.15, 0.35, 0.45];
				} else if (
					infrastructure.asphalt.exists === 'no' &&
					infrastructure.concrete.exists === 'no'
				) {
					baseWeight = [0.1, 0.25, 0.35, 0.3];
				} else {
					baseWeight = [0.4, 0.35, 0.2, 0.05];
				}
				break;

			case 'farmTools':
				// Higher if farming community
				if (numberOfFarmers > totalWorkers * 0.3) {
					baseWeight = [0.15, 0.25, 0.35, 0.25];
				} else if (numberOfFarmers > 0) {
					baseWeight = [0.3, 0.35, 0.25, 0.1];
				} else {
					baseWeight = [0.6, 0.25, 0.1, 0.05];
				}
				break;

			case 'healthServices':
				// Higher if no health center nearby
				if (facilities.healthCenter.exists === 'no') {
					const dist = facilities.healthCenter.distanceToNearest ?? 5;
					if (dist > 10) {
						baseWeight = [0.05, 0.15, 0.35, 0.45];
					} else {
						baseWeight = [0.15, 0.3, 0.35, 0.2];
					}
				} else {
					baseWeight = [0.4, 0.35, 0.2, 0.05];
				}
				break;

			case 'educationSupport':
				// Higher if out of school youth or no school
				if (
					outOfSchoolYouth > youthPopulation * 0.1 ||
					facilities.elementarySchool.exists === 'no'
				) {
					baseWeight = [0.1, 0.2, 0.35, 0.35];
				} else {
					baseWeight = [0.35, 0.35, 0.25, 0.05];
				}
				break;

			default:
				baseWeight = [0.25, 0.35, 0.25, 0.15];
		}

		const rating = rng.pickWeighted([0, 1, 2, 3], baseWeight) as PriorityRating;
		return { name, rating };
	});

	// ========== K. RECOMMENDATION ==========
	const averageNeedScore = Number(
		(priorities.reduce((sum, p) => sum + p.rating, 0) / priorities.length).toFixed(2)
	);

	// ========== BUILD PROFILE ==========
	const profile: SitioProfile = {
		// Section A - Basic Sitio Information
		municipality,
		barangay,
		sitioName,
		sitioCode,
		latitude,
		longitude,
		sitioClassification,
		mainAccess,

		// Section B - Population & Demographics
		totalPopulation,
		totalHouseholds,
		registeredVoters,
		laborForceCount,
		schoolAgeChildren,
		population: {
			totalMale,
			totalFemale
		},
		vulnerableGroups: {
			muslimCount,
			ipCount,
			seniorsCount,
			laborForce60to64Count,
			unemployedCount,
			noBirthCertCount,
			noNationalIDCount,
			outOfSchoolYouth
		},

		// Section C - Basic Utilities & Connectivity
		householdsWithToilet,
		householdsWithElectricity,
		electricitySources,
		mobileSignal,
		householdsWithInternet,

		// Section D - Community Facilities
		facilities,

		// Section E - Roads & Internal Infrastructure
		infrastructure,

		// Section F - Education Status
		studentsPerRoom,

		// Section G - Water & Sanitation
		waterSources,
		sanitationTypes,

		// Section H - Livelihood & Agriculture
		workerClass,
		averageDailyIncome,
		agriculture,
		crops,
		livestock,

		// Section I - Safety & Risk Context
		hazards,
		foodSecurity,

		// Section J - Sitio Priority Needs
		priorities,

		// Section K - Recommendation
		averageNeedScore,
		recommendations: []
	};

	return profile;
}
