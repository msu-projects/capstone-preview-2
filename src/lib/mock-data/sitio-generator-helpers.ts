/**
 * Sitio Generator Helper Functions
 * Helper functions for generating realistic sitio data
 */

import type { FacilityDetails, HazardDetails, RoadDetails, WaterSourceStatus } from '$lib/types';
import type { MunicipalityProfile } from './municipality-profiles';
import type { SeededRandom } from './seeded-random';
import {
	CROP_OPTIONS_COMMERCIAL,
	CROP_OPTIONS_HIGHLAND,
	CROP_OPTIONS_LOWLAND,
	LIVESTOCK_AQUACULTURE,
	LIVESTOCK_OPTIONS_COMMON,
	LIVESTOCK_OPTIONS_HIGHLAND,
	LIVESTOCK_OPTIONS_RURAL,
	SITIO_NAMES_COMMON,
	SITIO_NAMES_INDIGENOUS,
	SITIO_NAMES_NATURE,
	SITIO_PREFIXES_INDIGENOUS,
	SITIO_PREFIXES_RURAL,
	SITIO_PREFIXES_URBAN
} from './sitio-name-data';

/**
 * Generate facility details with realistic patterns based on context
 */
export function generateFacilityDetails(
	rng: SeededRandom,
	existsProbability: number,
	populationSize: number,
	infrastructureLevel: number,
	isGida: boolean
): FacilityDetails {
	// Adjust probability based on context
	let adjustedProbability = existsProbability * infrastructureLevel;
	if (isGida) adjustedProbability *= 0.6;
	if (populationSize > 500) adjustedProbability *= 1.2;
	if (populationSize < 150) adjustedProbability *= 0.7;

	adjustedProbability = Math.min(0.95, Math.max(0.05, adjustedProbability));

	const exists = rng.boolean(adjustedProbability);

	if (exists) {
		// Count correlates with population
		const baseCount = populationSize > 800 ? 2 : 1;
		const count = rng.boolean(0.2) ? baseCount + 1 : baseCount;

		// Condition tends to be better in more developed areas
		const conditionWeights = isGida
			? [0.15, 0.25, 0.35, 0.2, 0.05] // GIDA: worse conditions
			: [0.05, 0.15, 0.35, 0.3, 0.15]; // Non-GIDA: better conditions
		const condition = rng.pickWeighted([1, 2, 3, 4, 5], conditionWeights) as 1 | 2 | 3 | 4 | 5;

		return { exists: 'yes', count, condition };
	} else {
		// Distance is further for GIDA areas
		const baseDistance = isGida ? 8 : 3;
		const distanceToNearest = Number((baseDistance + rng.next() * (isGida ? 15 : 8)).toFixed(1));
		return { exists: 'no', distanceToNearest };
	}
}

/**
 * Generate road details with realistic patterns
 */
export function generateRoadDetails(
	rng: SeededRandom,
	roadType: 'asphalt' | 'concrete' | 'gravel' | 'natural',
	infrastructureLevel: number,
	isGida: boolean,
	populationSize: number
): RoadDetails {
	// Different road types have different probabilities based on development
	const baseProbs: Record<string, number> = {
		asphalt: 0.15 + infrastructureLevel * 0.4,
		concrete: 0.25 + infrastructureLevel * 0.35,
		gravel: 0.5 + infrastructureLevel * 0.2,
		natural: 0.7 - infrastructureLevel * 0.3
	};

	let existsProbability = baseProbs[roadType];
	if (isGida) {
		existsProbability *= roadType === 'natural' ? 1.3 : 0.5;
	}

	const exists = rng.boolean(Math.min(0.95, existsProbability));

	if (exists) {
		// Road length correlates with population and road type
		const baseLengthKm =
			roadType === 'natural'
				? 0.5 + rng.next() * 2
				: roadType === 'gravel'
					? 0.3 + rng.next() * 1.5
					: 0.2 + rng.next() * 1;

		const length = Number((baseLengthKm * (1 + populationSize / 500)).toFixed(2));

		// Better roads have better conditions generally
		const conditionWeights: number[] =
			roadType === 'asphalt' || roadType === 'concrete'
				? [0.05, 0.1, 0.25, 0.35, 0.25]
				: [0.15, 0.25, 0.35, 0.2, 0.05];

		const condition = rng.pickWeighted([1, 2, 3, 4, 5], conditionWeights) as 1 | 2 | 3 | 4 | 5;

		return { exists: 'yes', length, condition };
	} else {
		return { exists: 'no' };
	}
}

/**
 * Generate water source status with realistic patterns
 */
export function generateWaterSourceStatus(
	rng: SeededRandom,
	sourceType: 'natural' | 'level1' | 'level2' | 'level3',
	infrastructureLevel: number,
	isGida: boolean,
	totalHouseholds: number
): WaterSourceStatus {
	// Different water levels have different probability patterns
	const baseProbs: Record<string, number> = {
		natural: 0.65, // Springs/rivers are common
		level1: 0.45 + infrastructureLevel * 0.25, // Point source
		level2: 0.25 + infrastructureLevel * 0.35, // Communal faucet
		level3: 0.1 + infrastructureLevel * 0.45 // House connection
	};

	let existsProbability = baseProbs[sourceType];
	if (isGida) {
		// GIDA areas have more natural sources, less developed systems
		existsProbability *= sourceType === 'natural' ? 1.2 : 0.5;
	}

	const exists = rng.boolean(Math.min(0.9, existsProbability));

	if (exists) {
		// Scale based on households and source type
		const scaleFactor =
			sourceType === 'level3'
				? 0.3
				: sourceType === 'level2'
					? 0.5
					: sourceType === 'level1'
						? 0.7
						: 1.0;
		const maxUnits = Math.max(1, Math.ceil((totalHouseholds / 30) * scaleFactor));
		const total = rng.nextInt(1, Math.max(1, maxUnits));

		// Functioning ratio depends on infrastructure level
		const functioningRatio = 0.5 + infrastructureLevel * 0.4 + rng.next() * 0.1;
		const functioning = Math.round(total * Math.min(1, functioningRatio));

		return {
			exists: 'yes',
			functioningCount: functioning,
			notFunctioningCount: total - functioning
		};
	} else {
		return { exists: 'no' };
	}
}

/**
 * Generate hazard frequency with location-specific patterns
 */
export function generateHazardDetails(
	rng: SeededRandom,
	hazardType: 'flood' | 'landslide' | 'drought' | 'earthquake',
	municipalityProfile: MunicipalityProfile
): HazardDetails {
	const hazardProbability =
		municipalityProfile.hazardProfile[
			hazardType as keyof typeof municipalityProfile.hazardProfile
		] ?? 0.2;

	// Generate a frequency number (0-10 times in past 12 months)
	// Weight toward less frequent occurrences
	let weights: number[];

	if (hazardProbability < 0.2) {
		// Low probability: mostly 0-1 times
		weights = [0.6, 0.25, 0.1, 0.03, 0.015, 0.005]; // for [0, 1, 2, 3, 4-5, 6+]
	} else if (hazardProbability < 0.4) {
		// Medium-low: some occurrences
		weights = [0.35, 0.3, 0.2, 0.1, 0.04, 0.01];
	} else if (hazardProbability < 0.6) {
		// Medium-high: regular occurrences
		weights = [0.15, 0.25, 0.3, 0.15, 0.1, 0.05];
	} else {
		// High: frequent occurrences
		weights = [0.05, 0.15, 0.3, 0.25, 0.15, 0.1];
	}

	// Earthquake is special - uses different pattern (rare but when happens, might happen multiple times)
	if (hazardType === 'earthquake') {
		weights = [0.7, 0.2, 0.08, 0.015, 0.004, 0.001];
	}

	// Map weights to frequency ranges
	const frequencyRanges = [0, 1, 2, 3, rng.nextInt(4, 5), rng.nextInt(6, 10)];
	const selectedRange = rng.pickWeighted(frequencyRanges, weights);

	return { frequency: selectedRange };
}

/**
 * Generate a realistic sitio name based on context
 */
export function generateSitioName(
	rng: SeededRandom,
	municipalityType: 'urban' | 'semi-urban' | 'rural' | 'highland',
	isIndigenous: boolean,
	usedNames: Set<string>
): string {
	let prefix: string;
	let name: string;

	// Select prefix based on municipality type
	if (municipalityType === 'urban') {
		prefix = rng.pick(SITIO_PREFIXES_URBAN);
	} else if (isIndigenous) {
		prefix = rng.pick(SITIO_PREFIXES_INDIGENOUS);
	} else {
		prefix = rng.pick(SITIO_PREFIXES_RURAL);
	}

	// Select name based on context
	if (isIndigenous && rng.boolean(0.6)) {
		name = rng.pick(SITIO_NAMES_INDIGENOUS);
	} else if (rng.boolean(0.3)) {
		name = rng.pick(SITIO_NAMES_NATURE);
	} else {
		name = rng.pick(SITIO_NAMES_COMMON);
	}

	// For urban zones, add numbers
	if (municipalityType === 'urban' && prefix === 'Zone') {
		name = String(rng.nextInt(1, 15));
	} else if (prefix === 'Phase') {
		name = String(rng.nextInt(1, 5));
	}

	let sitioName = `${prefix} ${name}`;

	// Ensure uniqueness
	let attempts = 0;
	while (usedNames.has(sitioName) && attempts < 20) {
		const suffix = rng.nextInt(1, 9);
		sitioName = `${prefix} ${name} ${suffix}`;
		attempts++;
	}

	usedNames.add(sitioName);
	return sitioName;
}

/**
 * Select crops based on municipality profile and terrain
 */
export function selectCrops(rng: SeededRandom, profile: MunicipalityProfile): string[] {
	const crops: Set<string> = new Set();

	// Add primary crops from municipality profile
	const primaryCrops = rng.shuffle([...profile.primaryCrops]);
	const numPrimary = rng.nextInt(2, Math.min(4, primaryCrops.length));
	primaryCrops.slice(0, numPrimary).forEach((c) => crops.add(c));

	// Add supplementary crops based on terrain
	if (profile.type === 'highland') {
		if (rng.boolean(0.4)) crops.add(rng.pick(CROP_OPTIONS_HIGHLAND));
	} else {
		if (rng.boolean(0.3)) crops.add(rng.pick(CROP_OPTIONS_LOWLAND));
	}

	// Commercial farms in semi-urban areas
	if (profile.type === 'semi-urban' && rng.boolean(0.3)) {
		crops.add(rng.pick(CROP_OPTIONS_COMMERCIAL));
	}

	return Array.from(crops);
}

/**
 * Select livestock based on municipality profile
 */
export function selectLivestock(rng: SeededRandom, profile: MunicipalityProfile): string[] {
	const livestock: Set<string> = new Set();

	// Add primary livestock from municipality profile
	const primaryLivestock = rng.shuffle([...profile.primaryLivestock]);
	const numPrimary = rng.nextInt(2, Math.min(4, primaryLivestock.length));
	primaryLivestock.slice(0, numPrimary).forEach((l) => livestock.add(l));

	// Common livestock almost everywhere
	LIVESTOCK_OPTIONS_COMMON.forEach((l) => {
		if (rng.boolean(0.5)) livestock.add(l);
	});

	// Highland areas have specific livestock
	if (profile.type === 'highland' && rng.boolean(0.4)) {
		livestock.add(rng.pick(LIVESTOCK_OPTIONS_HIGHLAND));
	}

	// Rural areas have more variety
	if (profile.type === 'rural' && rng.boolean(0.3)) {
		livestock.add(rng.pick(LIVESTOCK_OPTIONS_RURAL));
	}

	// Aquaculture near Lake Sebu
	if (profile.name === 'LAKE SEBU' && rng.boolean(0.5)) {
		livestock.add(rng.pick(LIVESTOCK_AQUACULTURE));
	}

	return Array.from(livestock);
}
