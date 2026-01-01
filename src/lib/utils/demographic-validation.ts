/**
 * Demographic Data Validation Utilities
 *
 * Ensures consistency between related demographic fields:
 * - population = demographics.total
 * - demographics.male + demographics.female = demographics.total
 * - demographics.age_0_14 + demographics.age_15_64 + demographics.age_65_above = demographics.total
 */

export interface DemographicValidationResult {
	isValid: boolean;
	errors: DemographicValidationError[];
	warnings: DemographicValidationWarning[];
}

export interface DemographicValidationError {
	field: string;
	message: string;
	expected: number;
	actual: number;
}

export interface DemographicValidationWarning {
	field: string;
	message: string;
}

/**
 * Validates that gender distribution (male + female) equals total population
 */
export function validateGenderDistribution(
	male: number,
	female: number,
	total: number
): DemographicValidationError | null {
	const genderTotal = male + female;
	if (genderTotal !== total) {
		return {
			field: 'gender',
			message: `Male (${male}) + Female (${female}) = ${genderTotal}, but Total is ${total}`,
			expected: total,
			actual: genderTotal
		};
	}
	return null;
}

/**
 * Validates that age distribution equals total population
 */
export function validateAgeDistribution(
	age_0_14: number,
	age_15_64: number,
	age_65_above: number,
	total: number
): DemographicValidationError | null {
	const ageTotal = age_0_14 + age_15_64 + age_65_above;
	if (ageTotal !== total) {
		return {
			field: 'age',
			message: `Age 0-14 (${age_0_14}) + Age 15-64 (${age_15_64}) + Age 65+ (${age_65_above}) = ${ageTotal}, but Total is ${total}`,
			expected: total,
			actual: ageTotal
		};
	}
	return null;
}

/**
 * Validates that demographics.total matches top-level population
 */
export function validatePopulationMatch(
	population: number,
	demographicsTotal: number
): DemographicValidationError | null {
	if (population !== demographicsTotal) {
		return {
			field: 'population',
			message: `Population (${population}) does not match Demographics Total (${demographicsTotal})`,
			expected: population,
			actual: demographicsTotal
		};
	}
	return null;
}

/**
 * Comprehensive demographic validation
 */
export function validateDemographics(data: {
	population: number;
	demographics: {
		male: number;
		female: number;
		total: number;
		age_0_14: number;
		age_15_64: number;
		age_65_above: number;
	};
}): DemographicValidationResult {
	const errors: DemographicValidationError[] = [];
	const warnings: DemographicValidationWarning[] = [];

	const { population, demographics } = data;
	const { male, female, total, age_0_14, age_15_64, age_65_above } = demographics;

	// Validate gender distribution
	const genderError = validateGenderDistribution(male, female, total);
	if (genderError) {
		errors.push(genderError);
	}

	// Validate age distribution
	const ageError = validateAgeDistribution(age_0_14, age_15_64, age_65_above, total);
	if (ageError) {
		errors.push(ageError);
	}

	// Validate population match
	const populationError = validatePopulationMatch(population, total);
	if (populationError) {
		errors.push(populationError);
	}

	// Check for zero values (warnings)
	if (total === 0 && (male > 0 || female > 0)) {
		warnings.push({
			field: 'total',
			message: 'Total population is 0 but gender data is entered'
		});
	}

	if (total === 0 && (age_0_14 > 0 || age_15_64 > 0 || age_65_above > 0)) {
		warnings.push({
			field: 'total',
			message: 'Total population is 0 but age data is entered'
		});
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Auto-correct demographics to ensure consistency
 * Returns corrected demographics object
 */
export function autoCorrectDemographics(demographics: {
	male: number;
	female: number;
	total: number;
	age_0_14: number;
	age_15_64: number;
	age_65_above: number;
}): {
	male: number;
	female: number;
	total: number;
	age_0_14: number;
	age_15_64: number;
	age_65_above: number;
} {
	// Auto-calculate total from male + female
	const calculatedTotal = demographics.male + demographics.female;

	return {
		...demographics,
		total: calculatedTotal
	};
}

/**
 * Generate consistent mock demographics based on total population
 * Uses realistic age and gender distributions
 */
export function generateConsistentDemographics(totalPopulation: number): {
	male: number;
	female: number;
	total: number;
	age_0_14: number;
	age_15_64: number;
	age_65_above: number;
} {
	// Realistic gender distribution (roughly 50-50 with slight variance)
	const maleRatio = 0.48 + Math.random() * 0.04; // 48-52%
	const male = Math.round(totalPopulation * maleRatio);
	const female = totalPopulation - male; // Ensure they sum to total

	// Realistic age distribution for Philippine rural areas
	// Source: PSA data shows younger demographic in rural areas
	const age0_14Ratio = 0.30 + Math.random() * 0.05; // 30-35%
	const age65AboveRatio = 0.08 + Math.random() * 0.04; // 8-12%

	const age_0_14 = Math.round(totalPopulation * age0_14Ratio);
	const age_65_above = Math.round(totalPopulation * age65AboveRatio);
	const age_15_64 = totalPopulation - age_0_14 - age_65_above; // Ensure they sum to total

	return {
		male,
		female,
		total: totalPopulation,
		age_0_14,
		age_15_64,
		age_65_above
	};
}
