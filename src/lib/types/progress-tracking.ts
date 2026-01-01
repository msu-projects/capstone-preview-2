// ==========================================
// PROGRESS TRACKING TYPES
// ==========================================

/**
 * ProgressMetric - Tracks change in a single metric over time
 */
export interface ProgressMetric {
	/** Name of the metric being tracked */
	metric: string;
	/** Starting year of comparison */
	startYear: number;
	/** Ending year of comparison */
	endYear: number;
	/** Value at start year */
	startValue: number;
	/** Value at end year */
	endValue: number;
	/** Absolute change (endValue - startValue) */
	absoluteChange: number;
	/** Percentage change ((endValue - startValue) / startValue * 100) */
	percentageChange: number;
	/** Direction of change */
	trend: 'increase' | 'decrease' | 'stable';
	/** Whether the change is an improvement (context-aware) */
	isImprovement: boolean;
}

/**
 * InfrastructureProgress - Tracks changes in facility conditions
 */
export interface InfrastructureProgress {
	/** Starting year of comparison */
	startYear: number;
	/** Ending year of comparison */
	endYear: number;

	/** Facility-by-facility comparison */
	facilities: {
		[key: string]: {
			/** Condition at start year */
			startCondition: string;
			/** Condition at end year */
			endCondition: string;
			/** Whether condition improved */
			improved: boolean;
			/** Whether condition deteriorated */
			deteriorated: boolean;
		};
	};

	/** Facilities that didn't exist at start but exist at end */
	newFacilities: string[];

	/** Progress metric for total functional facilities */
	totalFunctional: ProgressMetric;

	/** Progress metric for facilities needing repair */
	totalNeedingRepair: ProgressMetric;
}

/**
 * ProgressReport - Comprehensive progress report for a sitio
 */
export interface ProgressReport {
	/** Sitio identifier */
	sitioId: string;
	/** Sitio name */
	sitioName: string;
	/** Starting year of comparison */
	startYear: number;
	/** Ending year of comparison */
	endYear: number;
	/** Number of years between start and end */
	yearsSpan: number;

	/** Summary of overall progress */
	summary: {
		/** Overall progress assessment */
		overallProgress: 'significant' | 'moderate' | 'minimal' | 'decline';
		/** Key highlights from the comparison */
		keyHighlights: string[];
	};

	/** Demographic progress metrics */
	demographics: {
		/** Population change */
		population: ProgressMetric;
		/** Household count change */
		households: ProgressMetric;
		/** Senior citizens change */
		seniors: ProgressMetric;
		// Additional demographic metrics can be added
	};

	/** Infrastructure progress */
	infrastructure: InfrastructureProgress;

	/** Utility access progress */
	utilities: {
		/** Households with electricity */
		electricity: ProgressMetric;
		/** Households with toilet */
		toilet: ProgressMetric;
		// Additional utility metrics can be added
	};

	/** Livelihood and economic progress */
	livelihood: {
		/** Number of farmers */
		farmers: ProgressMetric;
		/** Farm area in hectares */
		farmArea: ProgressMetric;
		/** Income distribution changes across brackets */
		incomeDistribution: {
			belowP9500: ProgressMetric;
			P9500P14000: ProgressMetric;
			P14001P28000: ProgressMetric;
			aboveP28000: ProgressMetric;
		};
	};
}
