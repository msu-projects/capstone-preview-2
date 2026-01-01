import { MUNICIPALITIES_DATA } from '$lib/config/location-data';
import type {
	FacilityDetails,
	HazardDetails,
	PriorityItem,
	PriorityName,
	PriorityRating,
	RoadDetails,
	SitioProfile,
	SitioRecord,
	WaterSourceStatus
} from '$lib/types';
import { clearSitios, loadSitios, saveSitios } from '$lib/utils/storage';

// ===== SEEDED RANDOM NUMBER GENERATOR =====
// For consistent but random-looking data generation

class SeededRandom {
	private seed: number;

	constructor(seed: number = 42) {
		this.seed = seed;
	}

	// Simple LCG (Linear Congruential Generator)
	next(): number {
		this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
		return this.seed / 0x7fffffff;
	}

	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min + 1)) + min;
	}

	pick<T>(arr: T[]): T {
		return arr[this.nextInt(0, arr.length - 1)];
	}

	shuffle<T>(arr: T[]): T[] {
		const result = [...arr];
		for (let i = result.length - 1; i > 0; i--) {
			const j = this.nextInt(0, i);
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	boolean(probability: number = 0.5): boolean {
		return this.next() < probability;
	}
}

// ===== SITIO NAME GENERATORS =====

const SITIO_PREFIXES = ['Sitio', 'Barrio', 'Zone', 'Upper', 'Lower', 'New', 'Old', 'Central'];

const SITIO_NAMES = [
	'Maligaya',
	'Masagana',
	'Pagasa',
	'Mabuhay',
	'Kalinaw',
	'Kalayaan',
	'Bagong Silang',
	'San Antonio',
	'San Jose',
	'San Miguel',
	'Santa Cruz',
	'Santo Niño',
	'Fatima',
	'Guadalupe',
	'Del Pilar',
	'Rizal',
	'Bonifacio',
	'Aguinaldo',
	'Luna',
	'Mabini',
	'Greenhill',
	'Highland',
	'Riverside',
	'Lakeview',
	'Mountain View',
	'Valley View',
	'Sunrise',
	'Sunset',
	'Golden',
	'Silver',
	'Diamond',
	'Emerald',
	'Pearl',
	'Coral',
	'Bamboo',
	'Narra',
	'Acacia',
	'Mahogany',
	'Ipil',
	'Molave'
];

// ===== CROP AND LIVESTOCK OPTIONS =====

const CROP_OPTIONS = [
	'Palay',
	'Corn',
	'Banana',
	'Coconut',
	'Vegetables',
	'Cassava',
	'Sweet Potato',
	'Abaca',
	'Coffee',
	'Cacao'
];

const LIVESTOCK_OPTIONS = [
	'Pig',
	'Cow',
	'Kalabaw',
	'Horse',
	'Goat',
	'Chicken',
	'Duck',
	'Turkey',
	'Rabbit'
];

// ===== HELPER FUNCTIONS =====

function generateFacilityDetails(
	rng: SeededRandom,
	existsProbability: number = 0.5
): FacilityDetails {
	const exists = rng.boolean(existsProbability);

	if (exists) {
		return {
			exists: 'yes',
			count: rng.nextInt(1, 3),
			condition: rng.pick([1, 2, 3, 4, 5]) as 1 | 2 | 3 | 4 | 5
		};
	} else {
		return {
			exists: 'no',
			distanceToNearest: Number((rng.nextInt(1, 20) + rng.next()).toFixed(1))
		};
	}
}

function generateRoadDetails(rng: SeededRandom, existsProbability: number = 0.5): RoadDetails {
	const exists = rng.boolean(existsProbability);

	if (exists) {
		return {
			exists: 'yes',
			length: Number((rng.nextInt(0, 5) + rng.next()).toFixed(2)),
			condition: rng.pick([1, 2, 3, 4, 5]) as 1 | 2 | 3 | 4 | 5
		};
	} else {
		return {
			exists: 'no'
		};
	}
}

function generateWaterSourceStatus(
	rng: SeededRandom,
	existsProbability: number = 0.5
): WaterSourceStatus {
	const exists = rng.boolean(existsProbability);

	if (exists) {
		const total = rng.nextInt(1, 5);
		const functioning = rng.nextInt(0, total);
		return {
			exists: 'yes',
			functioningCount: functioning,
			notFunctioningCount: total - functioning
		};
	} else {
		return {
			exists: 'no'
		};
	}
}

function generateHazardDetails(rng: SeededRandom): HazardDetails {
	const frequencies = ['0', '1', '2-3', '4-5', 'More than 5', 'Seasonal'];
	return {
		frequency: rng.pick(frequencies)
	};
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

	// Flatten municipality/barangay data for easier picking
	const locations = MUNICIPALITIES_DATA.flatMap((m) =>
		m.barangays.map((b) => ({ municipality: m.name, barangay: b }))
	);

	for (let i = 1; i <= count; i++) {
		const location = rng.pick(locations);
		const prefix = rng.pick(SITIO_PREFIXES);
		const name = rng.pick(SITIO_NAMES);
		const sitioName = `${prefix} ${name}`;

		// ========== A. BASIC SITIO DETAILS (Static across years) ==========
		const municipality = location.municipality;
		const barangay = location.barangay;
		const coding = `${String(rng.nextInt(100, 999))}-${String(rng.nextInt(10, 99))}`;

		// Coordinates (South Cotabato general area)
		const latitude = Number((6.0 + rng.next() * 0.8).toFixed(6)); // 6.0 - 6.8
		const longitude = Number((124.5 + rng.next() * 0.6).toFixed(6)); // 124.5 - 125.1

		// Classification (generally static)
		const sitioClassification = {
			gida: rng.boolean(0.3),
			indigenous: rng.boolean(0.25),
			conflict: rng.boolean(0.15)
		};

		// Generate yearly data
		const yearlyData: { [year: string]: SitioProfile } = {};
		const availableYears: number[] = [];

		for (let yearOffset = 0; yearOffset < yearsToGenerate; yearOffset++) {
			const currentYear = startYear + yearOffset;
			availableYears.push(currentYear);

			// Create a year-specific RNG for variation
			const yearRng = new SeededRandom(seed + i * 1000 + yearOffset * 100);

			// Generate profile for this year
			yearlyData[String(currentYear)] = generateYearProfile(
				yearRng,
				municipality,
				barangay,
				sitioName,
				coding,
				latitude,
				longitude,
				sitioClassification
			);
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
	sitioClassification: { gida: boolean; indigenous: boolean; conflict: boolean }
): SitioProfile {
	// ========== A. BASIC SITIO INFORMATION ==========
	const mainAccess = {
		pavedRoad: rng.boolean(0.5),
		unpavedRoad: rng.boolean(0.6),
		footpath: rng.boolean(0.4),
		boat: rng.boolean(0.1)
	};

	// ========== B. POPULATION & DEMOGRAPHICS ==========
	const totalHouseholds = rng.nextInt(30, 200);
	const avgHouseholdSize = rng.nextInt(4, 6);
	const totalPopulation = totalHouseholds * avgHouseholdSize;

	const malePercent = 0.48 + rng.next() * 0.04; // 48-52%
	const totalMale = Math.round(totalPopulation * malePercent);
	const totalFemale = totalPopulation - totalMale;

	const registeredVoters = Math.round(totalPopulation * (0.5 + rng.next() * 0.2)); // 50-70%

	// Age groups
	const seniorsCount = Math.round(totalPopulation * (0.06 + rng.next() * 0.06)); // 6-12%
	const childrenPercent = 0.28 + rng.next() * 0.1; // 28-38%
	const schoolAgeChildren = Math.round(totalPopulation * childrenPercent);
	const laborForceCount = totalPopulation - seniorsCount - schoolAgeChildren;
	const laborForce60to64Count = Math.round(seniorsCount * 0.3); // ~30% of seniors are 60-64

	const unemployedCount = Math.round(laborForceCount * (0.05 + rng.next() * 0.25)); // 5-30%

	// Vulnerable Groups
	const muslimCount = sitioClassification.indigenous
		? rng.nextInt(0, 20)
		: rng.nextInt(0, totalPopulation / 2);
	const ipCount = sitioClassification.indigenous
		? Math.round(totalPopulation * (0.6 + rng.next() * 0.3))
		: rng.nextInt(0, totalPopulation / 4);

	// Documentation gaps
	const noBirthCertCount = rng.nextInt(0, Math.floor(schoolAgeChildren * 0.3));
	const noNationalIDCount = rng.nextInt(0, Math.floor(laborForceCount * 0.25));

	// Out of school youth
	const outOfSchoolYouth = rng.boolean(0.3) ? rng.nextInt(5, 50) : 0;

	// ========== C. BASIC UTILITIES & CONNECTIVITY ==========
	const householdsWithToilet = Math.round(totalHouseholds * (0.4 + rng.next() * 0.5)); // 40-90%
	const householdsWithElectricity = Math.round(totalHouseholds * (0.5 + rng.next() * 0.45)); // 50-95%

	// Electricity sources (numbers represent households)
	const electricitySources = {
		grid: householdsWithElectricity > 0 ? Math.round(householdsWithElectricity * 0.7) : 0,
		solar: rng.boolean(0.4) ? rng.nextInt(5, Math.floor(householdsWithElectricity * 0.3)) : 0,
		battery: rng.boolean(0.2) ? rng.nextInt(3, Math.floor(householdsWithElectricity * 0.2)) : 0,
		generator: rng.boolean(0.3) ? rng.nextInt(2, Math.floor(householdsWithElectricity * 0.15)) : 0
	};

	// Mobile signal
	const mobileSignalOptions: Array<'none' | '2g' | '3g' | '4g' | '5g'> = [
		'none',
		'2g',
		'3g',
		'4g',
		'5g'
	];
	const mobileSignal = rng.pick(mobileSignalOptions);

	// Internet
	const householdsWithInternet = Math.round(
		totalHouseholds * (mobileSignal === 'none' ? 0 : 0.1 + rng.next() * 0.4)
	);

	// ========== D. COMMUNITY FACILITIES ==========
	const facilities = {
		healthCenter: generateFacilityDetails(rng, 0.4),
		pharmacy: generateFacilityDetails(rng, 0.3),
		communityToilet: generateFacilityDetails(rng, 0.35),
		kindergarten: generateFacilityDetails(rng, 0.5),
		elementarySchool: generateFacilityDetails(rng, 0.6),
		highSchool: generateFacilityDetails(rng, 0.3),
		madrasah: generateFacilityDetails(rng, muslimCount > 20 ? 0.5 : 0.1),
		market: generateFacilityDetails(rng, 0.35)
	};

	// ========== E. ROADS & INTERNAL INFRASTRUCTURE ==========
	const infrastructure = {
		asphalt: generateRoadDetails(rng, 0.3),
		concrete: generateRoadDetails(rng, 0.5),
		gravel: generateRoadDetails(rng, 0.6),
		natural: generateRoadDetails(rng, 0.7)
	};

	// ========== F. EDUCATION STATUS ==========
	const studentsPerRoomOptions: Array<
		'less_than_46' | '46_50' | '51_55' | 'more_than_56' | 'no_classroom'
	> = ['less_than_46', '46_50', '51_55', 'more_than_56', 'no_classroom'];
	const studentsPerRoom = rng.pick(studentsPerRoomOptions);

	// ========== G. WATER & SANITATION ==========
	const waterSources = {
		natural: generateWaterSourceStatus(rng, 0.6),
		level1: generateWaterSourceStatus(rng, 0.5),
		level2: generateWaterSourceStatus(rng, 0.4),
		level3: generateWaterSourceStatus(rng, 0.3)
	};

	const sanitationTypes = {
		waterSealed: rng.boolean(0.5),
		pitLatrine: rng.boolean(0.4),
		communityCR: rng.boolean(0.3),
		openDefecation: rng.boolean(0.2)
	};

	// ========== H. LIVELIHOOD & AGRICULTURE ==========
	const totalWorkers = laborForceCount;
	const workerClass = {
		privateHousehold: rng.nextInt(0, Math.floor(totalWorkers * 0.1)),
		privateEstablishment: rng.nextInt(0, Math.floor(totalWorkers * 0.2)),
		government: rng.nextInt(0, Math.floor(totalWorkers * 0.15)),
		selfEmployed: rng.nextInt(Math.floor(totalWorkers * 0.2), Math.floor(totalWorkers * 0.5)),
		employer: rng.nextInt(0, Math.floor(totalWorkers * 0.1)),
		ofw: rng.nextInt(0, Math.floor(totalWorkers * 0.15))
	};

	const averageDailyIncome = rng.nextInt(150, 800); // PHP per day

	const numberOfFarmers = rng.boolean(0.7) ? rng.nextInt(20, 150) : 0;
	const agriculture = {
		numberOfFarmers,
		numberOfAssociations: numberOfFarmers > 30 ? rng.nextInt(1, 4) : 0,
		estimatedFarmAreaHectares: numberOfFarmers > 0 ? rng.nextInt(50, 500) : 0
	};

	// Crops and Livestock
	const shuffledCrops = rng.shuffle(CROP_OPTIONS);
	const crops = shuffledCrops.slice(0, rng.nextInt(2, 5));

	const shuffledLivestock = rng.shuffle(LIVESTOCK_OPTIONS);
	const livestock = shuffledLivestock.slice(0, rng.nextInt(2, 5));

	// ========== I. SAFETY & RISK CONTEXT ==========
	const hazards = {
		flood: generateHazardDetails(rng),
		landslide: generateHazardDetails(rng),
		drought: generateHazardDetails(rng),
		earthquake: generateHazardDetails(rng)
	};

	const peaceOrderOptions: Array<'stable' | 'occasional_tensions' | 'unstable'> = [
		'stable',
		'occasional_tensions',
		'unstable'
	];
	const peaceOrder = sitioClassification.conflict
		? rng.pick(['occasional_tensions', 'unstable'] as const)
		: rng.pick(peaceOrderOptions);

	const foodSecurityOptions: Array<'secure' | 'seasonal_scarcity' | 'critical_shortage'> = [
		'secure',
		'seasonal_scarcity',
		'critical_shortage'
	];
	const foodSecurity = rng.pick(foodSecurityOptions);

	// ========== J. SITIO PRIORITY NEEDS ==========
	const priorityNames: PriorityName[] = [
		'waterSystem',
		'communityCR',
		'solarStreetLights',
		'roadOpening',
		'farmTools',
		'healthServices',
		'educationSupport'
	];

	const priorityRatings: PriorityRating[] = [0, 1, 2, 3];

	const priorities: PriorityItem[] = priorityNames.map((name) => ({
		name,
		rating: rng.pick(priorityRatings)
	}));

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
		peaceOrder,
		foodSecurity,

		// Section J - Sitio Priority Needs
		priorities,

		// Section K - Recommendation
		averageNeedScore,
		recommendations: []
	};

	return profile;
}

// ===== STORAGE KEYS =====
export const STORAGE_VERSION = 6; // Increment to clear outdated data (updated priorities to use {name, rating} structure)
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
