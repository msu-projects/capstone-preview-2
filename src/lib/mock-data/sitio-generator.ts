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
  generateFacilityDetailsWithState,
  generateHazardDetails,
  generateRoadDetailsWithProgression,
  generateSitioName,
  generateWaterSourceStatusWithProgression,
  selectCrops,
  selectLivestock
} from './sitio-generator-helpers';

// ===== STORAGE KEYS =====
export const STORAGE_VERSION = 10; // Increment to clear outdated data (2020-2026 yearly data with improved realism)
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
    // Server-side: generate fresh data for SSR with 9 years (2018-2026)
    const sitios = generateSitios(10, 42, 2018, 9);
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

  // Generate and save mock data with 9 years (2018-2026)
  const sitios = generateSitios(10, 42, 2018, 9);

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

  // Regenerate with new seed based on current time and 9 years of data (2018-2026)
  const seed = Date.now() % 1000000;
  const sitios = generateSitios(50, seed, 2018, 9);

  saveSitios(sitios);
  markMockDataInitialized();

  return { sitios };
}

// ===== PROGRESSION STATE FOR MULTI-YEAR DATA =====

/**
 * Tracks the state of a sitio across years for realistic progression
 * This enables year-over-year changes that build upon previous years
 */
interface ProgressionState {
  // Demographics
  population: number;
  households: number;
  avgHouseholdSize: number;
  populationGrowthRate: number; // Base rate for this sitio

  // Infrastructure development (0-1 scale, can only improve over time)
  electricityAccessRate: number;
  toiletAccessRate: number;
  internetAccessRate: number;
  waterSystemDevelopment: number;
  roadDevelopment: number;

  // Documentation (improves with government programs)
  birthCertRegistrationRate: number;
  nationalIdRegistrationRate: number;

  // Economic indicators
  baseIncome: number;
  unemploymentRate: number;
  farmingRate: number;

  // Facility presence flags (once built, stays)
  hasHealthCenter: boolean;
  hasElementarySchool: boolean;
  hasHighSchool: boolean;

  // Mobile signal can improve with tower rollouts
  mobileSignalLevel: number; // 0-4 (none to 5g)
}

/**
 * Initialize progression state for year 0 (first year of data)
 */
function initializeProgressionState(
  rng: SeededRandom,
  profile: MunicipalityProfile,
  classification: { gida: boolean; indigenous: boolean; conflict: boolean }
): ProgressionState {
  const isGida = classification.gida;
  const infraLevel = profile.infrastructureLevel * (isGida ? 0.6 : 1.0);

  // Base household count for year 2018 (earlier years have smaller populations)
  const householdRange = {
    urban: { min: 60, max: 200 },
    'semi-urban': { min: 40, max: 150 },
    rural: { min: 25, max: 100 },
    highland: { min: 15, max: 70 }
  };
  const range = householdRange[profile.type];
  const households = rng.nextInt(range.min, range.max);

  // Household size varies by area type
  const avgHouseholdSize =
    profile.type === 'urban'
      ? rng.nextGaussianClamped(4.0, 0.5, 3.2, 5.5)
      : classification.indigenous
        ? rng.nextGaussianClamped(5.5, 0.8, 4.5, 8)
        : rng.nextGaussianClamped(4.6, 0.6, 3.5, 6.5);

  const population = Math.round(households * avgHouseholdSize);

  // Growth rate varies - rural/highland tend to have slower or even negative growth
  // due to urban migration
  const baseGrowthRate =
    profile.type === 'urban'
      ? rng.nextGaussianClamped(0.022, 0.008, 0.01, 0.04)
      : profile.type === 'highland'
        ? rng.nextGaussianClamped(0.008, 0.006, -0.01, 0.02)
        : rng.nextGaussianClamped(0.015, 0.007, 0.005, 0.03);

  // Infrastructure rates in 2018 (lower than current, especially in rural areas)
  const electricityRate2018 = isGida
    ? rng.nextFloat(0.15, 0.4)
    : profile.type === 'urban'
      ? rng.nextFloat(0.8, 0.95)
      : rng.nextFloat(0.45, 0.75);

  const toiletRate2018 = isGida
    ? rng.nextFloat(0.25, 0.5)
    : profile.type === 'urban'
      ? rng.nextFloat(0.75, 0.92)
      : rng.nextFloat(0.4, 0.7);

  // Internet in 2018 was much lower
  const internetRate2018 = isGida
    ? rng.nextFloat(0.01, 0.08)
    : profile.type === 'urban'
      ? rng.nextFloat(0.15, 0.35)
      : rng.nextFloat(0.05, 0.18);

  // Water and road development (0-1 scale)
  const waterDev2018 = infraLevel * rng.nextFloat(0.4, 0.7);
  const roadDev2018 = infraLevel * rng.nextFloat(0.5, 0.8);

  // Documentation rates in 2018 (before PhilSys rollout)
  const birthCertRate2018 = isGida ? rng.nextFloat(0.7, 0.85) : rng.nextFloat(0.85, 0.96);
  const nationalIdRate2018 = isGida ? rng.nextFloat(0.2, 0.4) : rng.nextFloat(0.35, 0.55);

  // Economic indicators
  const baseIncome2018 = 500 * profile.baseIncomeMultiplier * rng.nextFloat(0.85, 1.15);
  const unemploymentRate2018 = isGida
    ? rng.nextFloat(0.12, 0.25)
    : profile.type === 'urban'
      ? rng.nextFloat(0.06, 0.12)
      : rng.nextFloat(0.08, 0.18);

  const farmingRate = profile.type === 'urban' ? rng.nextFloat(0.1, 0.3) : rng.nextFloat(0.4, 0.75);

  // Facilities in 2018
  const hasHealthCenter2018 = rng.boolean(infraLevel * 0.4);
  const hasElementary2018 = rng.boolean(infraLevel * 0.6);
  const hasHighSchool2018 = rng.boolean(infraLevel * 0.25);

  // Mobile signal in 2018 (lower than today)
  let mobileSignal2018: number;
  if (profile.type === 'urban') {
    mobileSignal2018 = rng.pickWeighted([0, 1, 2, 3], [0.02, 0.08, 0.35, 0.55]);
  } else if (isGida || profile.type === 'highland') {
    mobileSignal2018 = rng.pickWeighted([0, 1, 2, 3], [0.25, 0.35, 0.3, 0.1]);
  } else {
    mobileSignal2018 = rng.pickWeighted([0, 1, 2, 3], [0.1, 0.2, 0.45, 0.25]);
  }

  return {
    population,
    households,
    avgHouseholdSize,
    populationGrowthRate: baseGrowthRate,
    electricityAccessRate: electricityRate2018,
    toiletAccessRate: toiletRate2018,
    internetAccessRate: internetRate2018,
    waterSystemDevelopment: waterDev2018,
    roadDevelopment: roadDev2018,
    birthCertRegistrationRate: birthCertRate2018,
    nationalIdRegistrationRate: nationalIdRate2018,
    baseIncome: baseIncome2018,
    unemploymentRate: unemploymentRate2018,
    farmingRate,
    hasHealthCenter: hasHealthCenter2018,
    hasElementarySchool: hasElementary2018,
    hasHighSchool: hasHighSchool2018,
    mobileSignalLevel: mobileSignal2018
  };
}

/**
 * Update progression state after generating a year's profile
 * Models realistic year-over-year improvements
 */
function updateProgressionState(
  rng: SeededRandom,
  state: ProgressionState,
  _profile: SitioProfile,
  currentYear: number
): void {
  // Population growth with slight yearly variance
  const yearlyVariance = rng.nextGaussianClamped(1, 0.3, 0.7, 1.5);
  const effectiveGrowthRate = state.populationGrowthRate * yearlyVariance;
  state.population = Math.round(state.population * (1 + effectiveGrowthRate));

  // Households grow slightly slower than population (larger families first)
  const householdGrowth = effectiveGrowthRate * rng.nextFloat(0.7, 0.95);
  state.households = Math.round(state.households * (1 + householdGrowth));

  // Infrastructure improvements (gradual, with government program boosts)
  // Electricity: Philippine Electrification Program acceleration
  const electricityImprovement =
    state.electricityAccessRate < 0.9
      ? rng.nextFloat(0.015, 0.04) * (currentYear >= 2020 ? 1.3 : 1.0)
      : rng.nextFloat(0.005, 0.015);
  state.electricityAccessRate = Math.min(
    0.99,
    state.electricityAccessRate + electricityImprovement
  );

  // Toilet access: Sanitation programs
  const toiletImprovement = rng.nextFloat(0.01, 0.03);
  state.toiletAccessRate = Math.min(0.98, state.toiletAccessRate + toiletImprovement);

  // Internet: Rapid improvement especially 2020+ (pandemic drove digital adoption)
  let internetImprovement = rng.nextFloat(0.02, 0.05);
  if (currentYear >= 2020) internetImprovement *= 1.8; // Pandemic acceleration
  if (currentYear >= 2023) internetImprovement *= 1.3; // Continued growth
  state.internetAccessRate = Math.min(0.85, state.internetAccessRate + internetImprovement);

  // Water and road development (slower, depends on projects)
  const waterImprovement = rng.boolean(0.3) ? rng.nextFloat(0.02, 0.06) : rng.nextFloat(0, 0.015);
  state.waterSystemDevelopment = Math.min(1, state.waterSystemDevelopment + waterImprovement);

  const roadImprovement = rng.boolean(0.25) ? rng.nextFloat(0.02, 0.05) : rng.nextFloat(0, 0.01);
  state.roadDevelopment = Math.min(1, state.roadDevelopment + roadImprovement);

  // Documentation rates
  // PhilSys (National ID) rollout started 2020, accelerated 2022+
  let nationalIdImprovement: number;
  if (currentYear < 2020) {
    nationalIdImprovement = rng.nextFloat(0.01, 0.03);
  } else if (currentYear < 2022) {
    nationalIdImprovement = rng.nextFloat(0.03, 0.08);
  } else {
    nationalIdImprovement = rng.nextFloat(0.06, 0.12); // Rapid rollout
  }
  state.nationalIdRegistrationRate = Math.min(
    0.95,
    state.nationalIdRegistrationRate + nationalIdImprovement
  );

  // Birth certificate registration also improves
  const birthCertImprovement = rng.nextFloat(0.01, 0.025);
  state.birthCertRegistrationRate = Math.min(
    0.98,
    state.birthCertRegistrationRate + birthCertImprovement
  );

  // Income grows with inflation and economic development
  // Philippine average inflation ~3-6% per year
  const incomeGrowth = rng.nextFloat(0.025, 0.06);
  state.baseIncome = state.baseIncome * (1 + incomeGrowth);

  // Unemployment can fluctuate
  const unemploymentChange = rng.nextGaussianClamped(0, 0.015, -0.03, 0.03);
  // COVID impact 2020-2021
  const covidImpact = currentYear === 2020 ? 0.04 : currentYear === 2021 ? 0.02 : 0;
  state.unemploymentRate = Math.max(
    0.03,
    Math.min(0.35, state.unemploymentRate + unemploymentChange + covidImpact)
  );

  // Facilities: once built, stay (with small probability of new construction each year)
  if (!state.hasHealthCenter) {
    state.hasHealthCenter = rng.boolean(0.08);
  }
  if (!state.hasElementarySchool) {
    state.hasElementarySchool = rng.boolean(0.06);
  }
  if (!state.hasHighSchool) {
    state.hasHighSchool = rng.boolean(0.04);
  }

  // Mobile signal can improve (tower rollouts)
  if (state.mobileSignalLevel < 4) {
    // 5G rollout started ~2021 in urban areas
    const canGet5G = currentYear >= 2021;
    const upgradeChance = currentYear >= 2020 ? 0.15 : 0.08;
    if (rng.boolean(upgradeChance)) {
      state.mobileSignalLevel = Math.min(canGet5G ? 4 : 3, state.mobileSignalLevel + 1);
    }
  }
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

    // Initialize progression state for this sitio
    const progressionState = initializeProgressionState(
      rng,
      municipalityProfile,
      sitioClassification
    );

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
        currentYear,
        progressionState
      );

      yearlyData[String(currentYear)] = profile;

      // Update progression state for next year
      updateProgressionState(yearRng, progressionState, profile, currentYear);
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
  currentYear: number,
  state: ProgressionState
): SitioProfile {
  const isGida = sitioClassification.gida;
  const isIndigenous = sitioClassification.indigenous;

  // ========== A. BASIC SITIO INFORMATION ==========
  // Access improves over time based on road development
  const roadDevFactor = state.roadDevelopment;
  const mainAccess = {
    pavedRoad: rng.boolean(roadDevFactor * 0.6 + yearOffset * 0.02),
    unpavedRoad: rng.boolean(0.4 + roadDevFactor * 0.4),
    footpath: rng.boolean(isGida ? 0.7 - yearOffset * 0.03 : 0.3),
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
  // Use progression state values with slight yearly variance
  const totalHouseholds = Math.round(state.households * (1 + rng.nextFloat(-0.02, 0.02)));
  const totalPopulation = Math.round(state.population * (1 + rng.nextFloat(-0.015, 0.015)));

  // Gender distribution: Philippines is roughly 50.4% male, 49.6% female
  const malePercent = rng.nextGaussianClamped(0.504, 0.015, 0.48, 0.52);
  const totalMale = Math.round(totalPopulation * malePercent);
  const totalFemale = totalPopulation - totalMale;

  // Age distribution based on Philippine demographics (PSA 2020)
  // Children percent decreases slightly over years (demographic transition)
  const baseChildrenPercent = 0.32 - yearOffset * 0.003; // Gradual decrease
  const childrenPercent = rng.nextGaussianClamped(baseChildrenPercent, 0.04, 0.2, 0.4);
  const seniorPercent = rng.nextGaussianClamped(0.065 + yearOffset * 0.002, 0.015, 0.04, 0.15);
  const workingAgePercent = 1 - childrenPercent - seniorPercent;

  const schoolAgeChildren = Math.round(totalPopulation * childrenPercent);
  const seniorsCount = Math.round(totalPopulation * seniorPercent);
  const laborForceCount = Math.round(totalPopulation * workingAgePercent);

  // 60-64 are about 30-40% of 60+ population
  const laborForce60to64Count = Math.round(seniorsCount * rng.nextFloat(0.3, 0.4));

  // Registered voters (18+): improves over time
  const voterEligiblePercent = 1 - childrenPercent * 0.6;
  const baseRegistrationRate = 0.72 + yearOffset * 0.015; // Improves over years
  const registrationRate = Math.min(
    0.95,
    rng.nextFloat(baseRegistrationRate - 0.05, baseRegistrationRate + 0.08)
  );
  const registeredVoters = Math.round(totalPopulation * voterEligiblePercent * registrationRate);

  // Unemployment from state with COVID impact
  let effectiveUnemploymentRate = state.unemploymentRate;
  if (currentYear === 2020) effectiveUnemploymentRate += 0.05; // COVID spike
  if (currentYear === 2021) effectiveUnemploymentRate += 0.025; // Recovery
  effectiveUnemploymentRate = Math.max(
    0.03,
    Math.min(0.35, effectiveUnemploymentRate + rng.nextFloat(-0.02, 0.02))
  );
  const unemployedCount = Math.round(laborForceCount * effectiveUnemploymentRate);

  // Vulnerable Groups
  // Muslim population - consistent over time
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

  // Documentation gaps - improve over time using state
  const birthCertGapRate = 1 - state.birthCertRegistrationRate;
  const noBirthCertCount = Math.round(
    schoolAgeChildren * birthCertGapRate * rng.nextFloat(0.85, 1.15)
  );

  const nationalIdGapRate = 1 - state.nationalIdRegistrationRate;
  const noNationalIDCount = Math.round(
    laborForceCount * nationalIdGapRate * rng.nextFloat(0.85, 1.15)
  );

  // Out of school youth - slowly improves over time
  const baseOsyRate = isGida ? 0.18 : municipalityProfile.type === 'urban' ? 0.06 : 0.1;
  const osyRate = Math.max(0.02, baseOsyRate - yearOffset * 0.008 + rng.nextFloat(-0.02, 0.02));
  const youthPopulation = Math.round(totalPopulation * 0.18);
  const outOfSchoolYouth = Math.round(youthPopulation * osyRate);

  // ========== C. BASIC UTILITIES & CONNECTIVITY ==========
  // Use progression state rates with slight variance
  const householdsWithToilet = Math.round(
    totalHouseholds * Math.min(0.99, state.toiletAccessRate * rng.nextFloat(0.95, 1.05))
  );

  const householdsWithElectricity = Math.round(
    totalHouseholds * Math.min(0.99, state.electricityAccessRate * rng.nextFloat(0.95, 1.05))
  );

  // Electricity sources - distribution depends on access and area type
  const electricitySources = {
    grid: 0,
    solar: 0,
    battery: 0,
    generator: 0
  };

  if (householdsWithElectricity > 0) {
    if (isGida) {
      // GIDA: more solar and alternative sources, but grid improving over time
      const gridRatio = 0.2 + yearOffset * 0.04; // Grid expands over years
      electricitySources.grid = Math.round(
        householdsWithElectricity * Math.min(0.6, gridRatio + rng.nextFloat(-0.1, 0.1))
      );
      electricitySources.solar = Math.round(householdsWithElectricity * rng.nextFloat(0.15, 0.4));
      electricitySources.battery = Math.round(householdsWithElectricity * rng.nextFloat(0.05, 0.2));
      electricitySources.generator = Math.round(
        householdsWithElectricity * rng.nextFloat(0.03, 0.12)
      );
    } else {
      // Non-GIDA: mostly grid
      electricitySources.grid = Math.round(householdsWithElectricity * rng.nextFloat(0.8, 0.95));
      electricitySources.solar =
        currentYear >= 2020 && rng.boolean(0.35)
          ? Math.round(householdsWithElectricity * rng.nextFloat(0.02, 0.1))
          : 0;
      electricitySources.battery = rng.boolean(0.1) ? rng.nextInt(1, 4) : 0;
      electricitySources.generator = rng.boolean(0.15) ? rng.nextInt(1, 6) : 0;
    }
  }

  // Mobile signal - uses state with signal level conversion
  type MobileSignal = 'none' | '2g' | '3g' | '4g' | '5g';
  const signalMap: MobileSignal[] = ['none', '2g', '3g', '4g', '5g'];
  const mobileSignal = signalMap[Math.min(4, state.mobileSignalLevel)];

  // Internet access from state
  const householdsWithInternet = Math.round(
    totalHouseholds * Math.min(0.9, state.internetAccessRate * rng.nextFloat(0.9, 1.1))
  );

  // ========== D. COMMUNITY FACILITIES ==========
  // Use state for permanent facilities, generate details
  const infraLevel = state.roadDevelopment * (isGida ? 0.7 : 1.0);
  const facilities = {
    healthCenter: generateFacilityDetailsWithState(
      rng,
      state.hasHealthCenter,
      totalPopulation,
      infraLevel,
      isGida
    ),
    pharmacy: generateFacilityDetails(
      rng,
      0.3 + yearOffset * 0.02,
      totalPopulation,
      infraLevel,
      isGida
    ),
    communityToilet: generateFacilityDetails(
      rng,
      0.35 + yearOffset * 0.02,
      totalPopulation,
      infraLevel,
      isGida
    ),
    kindergarten: generateFacilityDetails(
      rng,
      0.55 + yearOffset * 0.02,
      totalPopulation,
      infraLevel,
      isGida
    ),
    elementarySchool: generateFacilityDetailsWithState(
      rng,
      state.hasElementarySchool,
      totalPopulation,
      infraLevel,
      isGida
    ),
    highSchool: generateFacilityDetailsWithState(
      rng,
      state.hasHighSchool,
      totalPopulation,
      infraLevel,
      isGida
    ),
    madrasah: generateFacilityDetails(
      rng,
      muslimCount > 50 ? 0.6 : muslimCount > 20 ? 0.3 : 0.05,
      totalPopulation,
      infraLevel,
      isGida
    ),
    market: generateFacilityDetails(
      rng,
      0.35 + yearOffset * 0.015,
      totalPopulation,
      infraLevel,
      isGida
    )
  };

  // ========== E. ROADS & INTERNAL INFRASTRUCTURE ==========
  const infrastructure = {
    asphalt: generateRoadDetailsWithProgression(
      rng,
      'asphalt',
      state.roadDevelopment,
      isGida,
      totalPopulation,
      yearOffset
    ),
    concrete: generateRoadDetailsWithProgression(
      rng,
      'concrete',
      state.roadDevelopment,
      isGida,
      totalPopulation,
      yearOffset
    ),
    gravel: generateRoadDetailsWithProgression(
      rng,
      'gravel',
      state.roadDevelopment,
      isGida,
      totalPopulation,
      yearOffset
    ),
    natural: generateRoadDetailsWithProgression(
      rng,
      'natural',
      state.roadDevelopment,
      isGida,
      totalPopulation,
      yearOffset
    )
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
    natural: generateWaterSourceStatusWithProgression(
      rng,
      'natural',
      state.waterSystemDevelopment,
      isGida,
      totalHouseholds,
      yearOffset
    ),
    level1: generateWaterSourceStatusWithProgression(
      rng,
      'level1',
      state.waterSystemDevelopment,
      isGida,
      totalHouseholds,
      yearOffset
    ),
    level2: generateWaterSourceStatusWithProgression(
      rng,
      'level2',
      state.waterSystemDevelopment,
      isGida,
      totalHouseholds,
      yearOffset
    ),
    level3: generateWaterSourceStatusWithProgression(
      rng,
      'level3',
      state.waterSystemDevelopment,
      isGida,
      totalHouseholds,
      yearOffset
    )
  };

  // Sanitation types - improve over time
  const sanitationImprovement = yearOffset * 0.03;
  const sanitationTypes = {
    waterSealed: rng.boolean(Math.min(0.95, infraLevel * 0.7 + 0.2 + sanitationImprovement)),
    pitLatrine: rng.boolean(
      isGida
        ? Math.max(0.2, 0.6 - sanitationImprovement)
        : Math.max(0.1, 0.25 - sanitationImprovement)
    ),
    communityCR: rng.boolean(Math.min(0.8, infraLevel * 0.35 + sanitationImprovement)),
    openDefecation: rng.boolean(
      isGida
        ? Math.max(0.02, 0.25 - sanitationImprovement * 2)
        : Math.max(0.01, 0.05 - sanitationImprovement)
    )
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

  // Average daily income - uses progression state with year-appropriate variance
  // Accounts for inflation and economic development over years
  const averageDailyIncome = Math.round(state.baseIncome * rng.nextFloat(0.85, 1.15));

  // Agriculture - uses farming rate from state
  const farmerPercent = state.farmingRate * rng.nextFloat(0.85, 1.15);
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
