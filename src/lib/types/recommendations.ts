import type { SitioProfile } from './sitio-profile.js';

// ==========================================
// PROJECT RECOMMENDATION SYSTEM TYPES
// ==========================================

/**
 * Infrastructure Project Types
 */
export type InfrastructureProjectType =
	| 'Construction of Potable Water System'
	| 'Construction of Concrete Tire Path'
	| 'Road Opening and Rehabilitation'
	| 'Construction of Multi-Purpose Community Hub'
	| 'Construction of Madrasah Facility'
	| 'Construction of School Building'
	| 'Installation of Solar Street Lights'
	| 'Construction of Sanitary Toilet Facilities'
	| 'Construction of Slope Protection / Box Culverts';

/**
 * Service Delivery & Social Project Types
 */
export type ServiceProjectType =
	| 'Conduct of Convergence Service Caravan'
	| 'Civil Registry & National ID Registration'
	| 'Implementation of Supplemental Feeding Program'
	| 'Provision of Livelihood Assistance & Skills Training'
	| 'Distribution of Agricultural Inputs'
	| 'Conduct of Social Preparation & Site Validation';

export type PPAData = {
	/** Unique identifier for the PPA */
	id: string;

	/** Brief description of the PPA */
	description: string;

	/** Array of evaluation criteria for this PPA */
	criteria: ScoringCriterion[];
};

export type InfrastructureConfig = PPAData & {
	/** Display name of the PPA */
	name: InfrastructureProjectType;

	/** Category classification */
	category: 'Infrastructure';
};

export type ServiceConfig = PPAData & {
	/** Display name of the PPA */
	name: ServiceProjectType;

	/** Category classification */
	category: 'Service Delivery & Social';
};

/**
 * Complete PPA/Project Definition
 */
export type PPAConfig = InfrastructureConfig | ServiceConfig;

/**
 * All available PPA types
 */
export type PPAType = InfrastructureProjectType | ServiceProjectType;

/**
 * Priority Level based on need score
 */
export type PriorityLevel = 'Critical' | 'High' | 'Moderate' | 'Low';

/**
 * @deprecated Use PriorityLevel instead
 */
export type NeedLevel = PriorityLevel;

/**
 * Evaluation Criterion for scoring PPAs
 * Each criterion evaluates a specific aspect of the sitio profile
 */
export interface ScoringCriterion {
	/** Unique identifier for the criterion */
	id: string;

	/** Human-readable name of the criterion */
	name: string;

	/** Detailed description of what this criterion evaluates */
	description: string;

	/** Maximum points this criterion can award */
	maxPoints: number;

	/**
	 * Evaluation function that analyzes the sitio profile
	 * Returns: { points: number, reason: string }
	 */
	evaluate: (profile: SitioProfile) => CriterionResult;

	/** If Criterion should be added when calculating the need score */
	enabled?: boolean;
}

/**
 * Result from evaluating a single criterion
 */
export interface CriterionResult {
	/** Points awarded (0 to criterion's maxPoints) */
	points: number;

	/** Explanation for why these points were awarded */
	reason: string;
}

export interface CriteriaScore {
	criteriaName: string;
	pointsAwarded: number;
	maxPoints: number;
	reason: string;
}

/**
 * Recommendation Result for a specific PPA
 */
export interface PPARecommendation {
	/** The PPA being recommended */
	ppa: PPAConfig;

	/** Need score (0-10) calculated from criteria */
	needScore: number;

	/** Priority level based on the need score */
	priority: PriorityLevel;

	/** Detailed breakdown of how the score was calculated */
	scoreBreakdown: CriteriaScore[];
}
