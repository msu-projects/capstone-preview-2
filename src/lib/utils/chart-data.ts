import type { SitioProfile } from '$lib/types/sitio-profile';

/**
 * Chart utility functions for data transformation and aggregation
 */

// ==========================================
// INDIVIDUAL SITIO UTILITIES
// ==========================================

/**
 * Convert facility condition to numeric score (0-100)
 * Condition is now 1-5 scale: 1=Bad, 5=Excellent
 */
export function facilityConditionToScore(condition?: number): number {
	if (!condition) return 0;
	// Convert 1-5 scale to 0-100
	return (condition / 5) * 100;
}

/**
 * Get condition label from numeric value
 */
export function getConditionLabel(condition?: number): string {
	switch (condition) {
		case 5:
			return 'Excellent';
		case 4:
			return 'Good';
		case 3:
			return 'Fair';
		case 2:
			return 'Poor';
		case 1:
			return 'Bad';
		default:
			return 'Unknown';
	}
}

/**
 * Get color based on need score
 */
export function getNeedScoreColor(score: number): {
	text: string;
	bg: string;
	border: string;
} {
	if (score >= 70) {
		return {
			text: 'text-red-600',
			bg: 'bg-red-100 dark:bg-red-950',
			border: 'border-red-200 dark:border-red-900'
		};
	}
	if (score >= 50) {
		return {
			text: 'text-amber-600',
			bg: 'bg-amber-100 dark:bg-amber-950',
			border: 'border-amber-200 dark:border-amber-900'
		};
	}
	return {
		text: 'text-green-600',
		bg: 'bg-green-100 dark:bg-green-950',
		border: 'border-green-200 dark:border-green-900'
	};
}

/**
 * Calculate coverage percentage
 */
export function calculateCoverage(part: number, total: number): number {
	return total > 0 ? (part / total) * 100 : 0;
}

/**
 * Get coverage color class based on percentage
 */
export function getCoverageColor(percentage: number): string {
	if (percentage >= 75) return 'text-green-600';
	if (percentage >= 50) return 'text-amber-600';
	if (percentage >= 25) return 'text-orange-600';
	return 'text-red-600';
}

/**
 * Analyze missing facilities in a sitio
 */
export function getMissingFacilities(sitio: SitioProfile) {
	return Object.entries(sitio.facilities)
		.filter(([, details]) => details.exists === 'no')
		.map(([key, details]) => ({
			key,
			name: key
				.replace(/([A-Z])/g, ' $1')
				.trim()
				.replace(/^./, (str) => str.toUpperCase()),
			distance: details.distanceToNearest || 0
		}));
}

/**
 * Analyze facilities needing repair (condition 1 or 2)
 */
export function getFacilitiesNeedingRepair(sitio: SitioProfile) {
	return Object.entries(sitio.facilities)
		.filter(
			([, details]) => details.exists === 'yes' && details.condition && details.condition <= 2
		)
		.map(([key, details]) => ({
			key,
			name: key
				.replace(/([A-Z])/g, ' $1')
				.trim()
				.replace(/^./, (str) => str.toUpperCase()),
			condition: details.condition,
			conditionLabel: getConditionLabel(details.condition)
		}));
}

// ==========================================
// AGGREGATED DASHBOARD UTILITIES
// ==========================================

/**
 * Aggregate demographics across multiple sitios
 */
export function aggregateDemographics(sitios: SitioProfile[]) {
	return {
		totalPopulation: sitios.reduce((sum, s) => sum + s.totalPopulation, 0),
		totalHouseholds: sitios.reduce((sum, s) => sum + s.totalHouseholds, 0),
		totalMale: sitios.reduce((sum, s) => sum + s.population.totalMale, 0),
		totalFemale: sitios.reduce((sum, s) => sum + s.population.totalFemale, 0),
		totalVoters: sitios.reduce((sum, s) => sum + s.registeredVoters, 0),
		totalSeniors: sitios.reduce((sum, s) => sum + s.vulnerableGroups.seniorsCount, 0),
		totalWorkforce: sitios.reduce((sum, s) => sum + s.laborForceCount, 0),
		totalUnemployed: sitios.reduce((sum, s) => sum + s.vulnerableGroups.unemployedCount, 0)
	};
}

/**
 * Aggregate income distribution based on averageDailyIncome
 * Categories based on Philippine poverty thresholds (2025 DEPDev update)
 * Total poverty: ₱668/day for a family of 5
 */
export function aggregateIncomeDistribution(sitios: SitioProfile[]) {
	// Count sitios by income bracket based on average daily income
	const belowPoverty = sitios.filter((s) => s.averageDailyIncome < 668).length;
	const abovePoverty = sitios.filter((s) => s.averageDailyIncome >= 668).length;

	return {
		belowPoverty,
		abovePoverty
	};
}

/**
 * Calculate poverty rate based on average daily income
 */
export function calculatePovertyRate(sitios: SitioProfile[]): number {
	const totalSitios = sitios.length;
	// Consider sitios with averageDailyIncome below 668 PHP as in poverty (2025 DEPDev threshold)
	const povertyCount = sitios.filter((s) => s.averageDailyIncome < 668).length;

	return totalSitios > 0 ? (povertyCount / totalSitios) * 100 : 0;
}

/**
 * Get sitios sorted by need score
 */
export function getSitiosByNeedScore(sitios: SitioProfile[], limit?: number) {
	const sorted = [...sitios].sort((a, b) => b.averageNeedScore - a.averageNeedScore);
	return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Categorize sitios by priority level
 */
export function categorizeSitiosByPriority(sitios: SitioProfile[]) {
	return {
		high: sitios.filter((s) => s.averageNeedScore >= 70),
		medium: sitios.filter((s) => s.averageNeedScore >= 50 && s.averageNeedScore < 70),
		low: sitios.filter((s) => s.averageNeedScore < 50)
	};
}

/**
 * Analyze facility gaps across all sitios
 * Now using numeric condition scale (1-5)
 */
export function analyzeFacilityGaps(sitios: SitioProfile[]) {
	const facilities = [
		{ key: 'healthCenter', name: 'Health Center' },
		{ key: 'pharmacy', name: 'Pharmacy' },
		{ key: 'communityToilet', name: 'Community Toilet' },
		{ key: 'kindergarten', name: 'Kindergarten' },
		{ key: 'elementarySchool', name: 'Elementary School' },
		{ key: 'highSchool', name: 'High School' },
		{ key: 'madrasah', name: 'Madrasah' },
		{ key: 'market', name: 'Market' }
	];

	return facilities
		.map((facility) => {
			const missing = sitios.filter(
				(s) => s.facilities[facility.key as keyof typeof s.facilities].exists === 'no'
			).length;
			// Condition 1 = Bad (critical)
			const critical = sitios.filter((s) => {
				const f = s.facilities[facility.key as keyof typeof s.facilities];
				return f.exists === 'yes' && f.condition === 1;
			}).length;
			// Condition 2 = Poor
			const poor = sitios.filter((s) => {
				const f = s.facilities[facility.key as keyof typeof s.facilities];
				return f.exists === 'yes' && f.condition === 2;
			}).length;
			// Condition 3 = Fair
			const fair = sitios.filter((s) => {
				const f = s.facilities[facility.key as keyof typeof s.facilities];
				return f.exists === 'yes' && f.condition === 3;
			}).length;

			const total = missing + critical + poor;
			const percentage = sitios.length > 0 ? (missing / sitios.length) * 100 : 0;

			return {
				...facility,
				missing,
				critical,
				poor,
				fair,
				total,
				percentage
			};
		})
		.sort((a, b) => b.total - a.total);
}

/**
 * Get sitios with lowest utility coverage
 */
export function getSitiosWithLowCoverage(
	sitios: SitioProfile[],
	utilityType: 'toilet' | 'electricity',
	threshold: number = 50,
	limit?: number
) {
	const mapped = sitios
		.map((s) => {
			const coverage =
				utilityType === 'toilet'
					? calculateCoverage(s.householdsWithToilet, s.totalHouseholds)
					: calculateCoverage(s.householdsWithElectricity, s.totalHouseholds);

			const gap =
				utilityType === 'toilet'
					? s.totalHouseholds - s.householdsWithToilet
					: s.totalHouseholds - s.householdsWithElectricity;

			return {
				sitio: s,
				name: `${s.sitioName}, ${s.barangay}`,
				coverage,
				gap
			};
		})
		.filter((item) => item.coverage < threshold)
		.sort((a, b) => a.coverage - b.coverage);

	return limit ? mapped.slice(0, limit) : mapped;
}

/**
 * Calculate overall utility coverage
 */
export function calculateOverallCoverage(sitios: SitioProfile[]) {
	const totalHouseholds = sitios.reduce((sum, s) => sum + s.totalHouseholds, 0);
	const withToilet = sitios.reduce((sum, s) => sum + s.householdsWithToilet, 0);
	const withElectricity = sitios.reduce((sum, s) => sum + s.householdsWithElectricity, 0);

	return {
		toilet: {
			coverage: calculateCoverage(withToilet, totalHouseholds),
			with: withToilet,
			without: totalHouseholds - withToilet,
			total: totalHouseholds
		},
		electricity: {
			coverage: calculateCoverage(withElectricity, totalHouseholds),
			with: withElectricity,
			without: totalHouseholds - withElectricity,
			total: totalHouseholds
		}
	};
}

/**
 * Get common priorities across sitios
 * Using the {name, rating} priority structure
 */
export function getCommonPriorities(sitios: SitioProfile[], topN: number = 5) {
	// Map of priority names to display labels
	const priorityLabels: Record<string, string> = {
		waterSystem: 'Water System',
		communityCR: 'Community CR',
		solarStreetLights: 'Solar Street Lights',
		roadOpening: 'Road Opening',
		farmTools: 'Farm Tools',
		healthServices: 'Health Services',
		educationSupport: 'Education Support'
	};

	// Collect priority scores by name
	const priorityScoreMap = new Map<string, { totalScore: number; count: number }>();

	sitios.forEach((s) => {
		s.priorities.forEach((p) => {
			const existing = priorityScoreMap.get(p.name) ?? { totalScore: 0, count: 0 };
			priorityScoreMap.set(p.name, {
				totalScore: existing.totalScore + p.rating,
				count: existing.count + 1
			});
		});
	});

	const priorityScores: Array<{ priority: string; totalScore: number; avgScore: number }> = [];

	priorityScoreMap.forEach((value, name) => {
		const avgScore = value.count > 0 ? value.totalScore / value.count : 0;
		if (value.totalScore > 0) {
			priorityScores.push({
				priority: priorityLabels[name] ?? name,
				totalScore: value.totalScore,
				avgScore
			});
		}
	});

	return priorityScores
		.map((p) => ({
			priority: p.priority,
			count: p.totalScore,
			percentage: (p.avgScore / 3) * 100 // Convert to percentage of max (3)
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, topN);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
	return num.toLocaleString('en-US');
}

/**
 * Format percentage
 */
export function formatPercentage(num: number, decimals: number = 1): string {
	return num.toFixed(decimals) + '%';
}
