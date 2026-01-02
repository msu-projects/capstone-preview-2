import type { SitioProfile } from '$lib/types';
import type {
	CriteriaScore,
	InfrastructureProjectType,
	NeedLevel,
	PPAConfig,
	PPARecommendation,
	PPAType,
	PriorityLevel,
	ScoringCriterion
} from '$lib/types/recommendations';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

// Re-export types from recommendations.ts for backward compatibility
export type {
	CriteriaScore,
	InfrastructureProjectType,
	NeedLevel,
	PPAConfig,
	PPARecommendation,
	PPAType,
	PriorityLevel,
	ScoringCriterion
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function getPriorityLevel(score: number): PriorityLevel {
	if (score >= 9) return 'Critical';
	if (score >= 7) return 'High';
	if (score >= 4) return 'Moderate';
	return 'Low';
}

/**
 * Get a priority rating by name from the priorities array
 * @param priorities - The priorities array with {name, rating} structure
 * @param priorityName - The name of the priority to look up
 * @returns The rating (0-3) or 0 if not found
 */
function getPriorityValue(
	priorities: SitioProfile['priorities'],
	priorityName: string
): 0 | 1 | 2 | 3 {
	const priority = priorities.find((p) => p.name === priorityName);
	return priority?.rating ?? 0;
}

// Priority names for easier access
const PRIORITY_NAMES = {
	waterSystem: 'waterSystem',
	communityCR: 'communityCR',
	solarStreetLights: 'solarStreetLights',
	roadOpening: 'roadOpening',
	farmTools: 'farmTools',
	healthServices: 'healthServices',
	educationSupport: 'educationSupport'
} as const;

function countFunctionalWaterSources(
	sources: SitioProfile['waterSources'],
	levels?: Array<'level1' | 'level2' | 'level3' | 'natural'>
): number {
	const sourceKeys: Array<'level1' | 'level2' | 'level3' | 'natural'> = levels || [
		'level1',
		'level2',
		'level3',
		'natural'
	];
	return sourceKeys.reduce((count, key) => {
		const source = sources[key];
		if (source.exists === 'yes') {
			return count + (source.functioningCount || 0);
		}
		return count;
	}, 0);
}

function hasWaterSourceNeedingRepair(sources: SitioProfile['waterSources']): boolean {
	const sourceKeys: Array<'level1' | 'level2' | 'level3' | 'natural'> = [
		'level1',
		'level2',
		'level3',
		'natural'
	];
	return sourceKeys.some((key) => {
		const source = sources[key];
		return source.exists === 'yes' && (source.notFunctioningCount || 0) > 0;
	});
}

function getTotalPopulation(profile: SitioProfile): number {
	return profile.population.totalMale + profile.population.totalFemale;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculatePercentage(value: number, total: number): number {
	if (total === 0) return 0;
	return (value / total) * 100;
}

// ==========================================
// INFRASTRUCTURE PROJECTS (1-5)
// ==========================================

export const POTABLE_WATER_SYSTEM_CONFIG: PPAConfig = {
	id: 'potable-water-system',
	name: 'Construction of Potable Water System',
	category: 'Infrastructure',
	description: '',
	criteria: [
		{
			id: 'no_functional_water',
			name: 'No Functional Water Source',
			description: 'No level 2/3 functional water systems available',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				const level2or3Functional = countFunctionalWaterSources(profile.waterSources, [
					'level2',
					'level3'
				]);
				if (level2or3Functional === 0) {
					return {
						points: 3.0,
						reason: 'No functional Level 2 or Level 3 water system available'
					};
				}
				return { points: 0, reason: 'Functional water system exists' };
			}
		},
		{
			id: 'natural_source_only',
			name: 'Reliance on Natural Sources',
			description: 'Community relies only on natural water sources',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				const { natural, level1, level2, level3 } = profile.waterSources;
				const onlyNatural =
					natural.exists === 'yes' &&
					level1.exists === 'no' &&
					level2.exists === 'no' &&
					level3.exists === 'no';
				if (onlyNatural) {
					return {
						points: 2.5,
						reason: 'Community relies entirely on natural sources (springs/rivers/wells)'
					};
				}
				return { points: 0, reason: 'Has developed water sources' };
			}
		},
		{
			id: 'water_repair_needed',
			name: 'Existing System Needs Repair',
			description: 'Water infrastructure exists but needs repair',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				if (hasWaterSourceNeedingRepair(profile.waterSources)) {
					return {
						points: 1.5,
						reason: 'Existing water system requires repair'
					};
				}
				return { points: 0, reason: 'No systems in need of repair' };
			}
		},
		{
			id: 'waterborne_diseases',
			name: 'Waterborne Disease Prevalence',
			description: 'Community experiences waterborne health issues',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				// Check if there are water-related hazards (flood can indicate waterborne disease risk)
				if (profile.hazards.flood.frequency > 0) {
					return {
						points: 1.5,
						reason: 'Flooding risk indicates potential waterborne disease concern'
					};
				}
				return { points: 0, reason: 'No reported waterborne disease risk' };
			}
		},
		{
			id: 'large_population',
			name: 'Large Population Impact',
			description: 'High population would benefit from improved water access',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				const population = getTotalPopulation(profile);
				if (population >= 500) {
					return {
						points: 1.5,
						reason: `Large population (${population}) would benefit`
					};
				} else if (population >= 300) {
					return {
						points: 1.0,
						reason: `Moderate population (${population}) would benefit`
					};
				} else if (population >= 150) {
					return {
						points: 0.5,
						reason: `Small population (${population}) would benefit`
					};
				}
				return { points: 0, reason: 'Very small population' };
			}
		},
		{
			id: 'gida_area',
			name: 'GIDA Classification',
			description: 'Geographically Isolated and Disadvantaged Area',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.gida) {
					return { points: 1.0, reason: 'Classified as GIDA' };
				}
				return { points: 0, reason: 'Not classified as GIDA' };
			}
		}
	]
};

export const CONCRETE_TIRE_PATH_CONFIG: PPAConfig = {
	id: 'concrete-tire-path',
	name: 'Construction of Concrete Tire Path',
	category: 'Infrastructure',
	description:
		'Development of durable concrete tire pathways to improve accessibility in areas with challenging terrain, particularly where traditional road construction is difficult or where footpaths are the primary access route.',
	criteria: [
		{
			id: 'no_paved_roads',
			name: 'No Paved Roads',
			description: 'Sitio has no paved road infrastructure',
			maxPoints: 3.5,
			enabled: true,
			evaluate: (profile) => {
				const hasPavedRoads =
					profile.infrastructure.asphalt.exists === 'yes' ||
					profile.infrastructure.concrete.exists === 'yes';
				if (!hasPavedRoads) {
					return { points: 3.5, reason: 'No paved roads exist in the sitio' };
				}
				return { points: 0, reason: 'Some paved roads exist' };
			}
		},
		{
			id: 'footpath_access',
			name: 'Footpath Primary Access',
			description: 'Main access is via footpath',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				if (
					profile.mainAccess.footpath &&
					!profile.mainAccess.pavedRoad &&
					!profile.mainAccess.unpavedRoad
				) {
					return { points: 2.5, reason: 'Primary access is footpath only' };
				} else if (profile.mainAccess.footpath) {
					return { points: 1.5, reason: 'Footpath is one of the access modes' };
				}
				return { points: 0, reason: 'Not primarily accessed by footpath' };
			}
		},
		{
			id: 'difficult_terrain',
			name: 'Challenging Terrain',
			description: 'Geography suggests steep or muddy conditions',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				const hasSteepRisk = profile.hazards.landslide.frequency > 0;
				if (hasSteepRisk) {
					return {
						points: 2.0,
						reason: 'Landslide risk indicates steep/difficult terrain'
					};
				}
				return {
					points: 0,
					reason: 'No indicators of particularly difficult terrain'
				};
			}
		},
		{
			id: 'poor_road_condition',
			name: 'Poor Existing Road Condition',
			description: 'Existing roads are in poor/bad condition',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				// Check road conditions (1=bad, 2=poor, 3=fair, 4=good, 5=excellent)
				const roads = [
					profile.infrastructure.asphalt,
					profile.infrastructure.concrete,
					profile.infrastructure.gravel,
					profile.infrastructure.natural
				];
				const existingRoads = roads.filter((r) => r.exists === 'yes' && r.condition);
				if (existingRoads.length === 0) return { points: 0, reason: 'No roads to assess' };

				const worstCondition = Math.min(...existingRoads.map((r) => r.condition!));
				if (worstCondition === 1) {
					return {
						points: 1.5,
						reason: 'Roads are dilapidated and difficult for vehicles'
					};
				} else if (worstCondition === 2) {
					return { points: 1.0, reason: 'Roads have potholes and slow travel' };
				}
				return { points: 0, reason: 'Road condition is acceptable' };
			}
		},
		{
			id: 'minority_coverage',
			name: 'Minimal Road Coverage',
			description: 'Less than 50% paved road coverage',
			maxPoints: 0.5,
			enabled: true,
			evaluate: (profile) => {
				const pavedLength =
					(profile.infrastructure.asphalt.length || 0) +
					(profile.infrastructure.concrete.length || 0);
				const totalLength =
					pavedLength +
					(profile.infrastructure.gravel.length || 0) +
					(profile.infrastructure.natural.length || 0);
				if (totalLength > 0 && pavedLength / totalLength < 0.5) {
					return { points: 0.5, reason: 'Less than 50% of roads are paved' };
				}
				return { points: 0, reason: 'Adequate road coverage' };
			}
		}
	]
};

export const ROAD_OPENING_CONFIG: PPAConfig = {
	id: 'road-opening-rehabilitation',
	name: 'Road Opening and Rehabilitation',
	category: 'Infrastructure',
	description:
		'Construction and rehabilitation of unpaved roads to establish or improve vehicular access, enhancing connectivity for communities with limited or deteriorating road infrastructure.',
	criteria: [
		{
			id: 'unpaved_access',
			name: 'Unpaved Road Access',
			description: 'Primary access is via unpaved/earth roads',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.mainAccess.unpavedRoad && !profile.mainAccess.pavedRoad) {
					return { points: 3.0, reason: 'Primary access is unpaved roads' };
				}
				return { points: 0, reason: 'Has paved road access' };
			}
		},
		{
			id: 'bad_road_condition',
			name: 'Dilapidated Road Condition',
			description: 'Roads are in bad/impassable condition',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				const roads = [
					profile.infrastructure.asphalt,
					profile.infrastructure.concrete,
					profile.infrastructure.gravel,
					profile.infrastructure.natural
				];
				const existingRoads = roads.filter((r) => r.exists === 'yes' && r.condition);
				if (existingRoads.length === 0) return { points: 0, reason: 'No roads to assess' };

				const worstCondition = Math.min(...existingRoads.map((r) => r.condition!));
				if (worstCondition === 1) {
					return {
						points: 2.5,
						reason: 'Roads are dilapidated and difficult for cars'
					};
				} else if (worstCondition === 2) {
					return { points: 1.5, reason: 'Roads have significant potholes' };
				}
				return { points: 0, reason: 'Roads are in acceptable condition' };
			}
		},
		{
			id: 'intermittent_coverage',
			name: 'Disjointed Road Network',
			description: 'Roads are patchy and need rehabilitation',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				const pavedLength =
					(profile.infrastructure.asphalt.length || 0) +
					(profile.infrastructure.concrete.length || 0);
				const totalLength =
					pavedLength +
					(profile.infrastructure.gravel.length || 0) +
					(profile.infrastructure.natural.length || 0);

				if (totalLength > 0) {
					const pavedRatio = pavedLength / totalLength;
					if (pavedRatio > 0 && pavedRatio < 0.3) {
						return {
							points: 2.0,
							reason: 'Roads are patchy and disjointed - rehabilitation needed'
						};
					} else if (pavedRatio < 0.5) {
						return {
							points: 1.0,
							reason: 'Less than 50% paved - major work needed'
						};
					}
				}
				return { points: 0, reason: 'Road coverage is adequate' };
			}
		},
		{
			id: 'population_size',
			name: 'Population to Serve',
			description: 'Number of people who would benefit',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				const population = getTotalPopulation(profile);
				if (population >= 400) {
					return {
						points: 1.5,
						reason: `Large population (${population}) needs better access`
					};
				} else if (population >= 200) {
					return {
						points: 1.0,
						reason: `Moderate population (${population}) needs better access`
					};
				} else if (population >= 100) {
					return {
						points: 0.5,
						reason: `Small population (${population}) needs better access`
					};
				}
				return { points: 0, reason: 'Very small population' };
			}
		},
		{
			id: 'livelihood_farming',
			name: 'Agricultural Community',
			description: 'Farming is a major livelihood requiring farm-to-market access',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.agriculture.numberOfFarmers >= 20) {
					return {
						points: 1.0,
						reason: `${profile.agriculture.numberOfFarmers} farmers need farm-to-market access`
					};
				} else if (profile.agriculture.numberOfFarmers > 0) {
					return {
						points: 0.5,
						reason: 'Farming community needs market access'
					};
				}
				return { points: 0, reason: 'Not primarily an agricultural community' };
			}
		}
	]
};

export const COMMUNITY_HUB_CONFIG: PPAConfig = {
	id: 'community-hub',
	name: 'Construction of Multi-Purpose Community Hub',
	category: 'Infrastructure',
	description:
		'Establishment of a multi-functional community center to serve as a gathering space for social activities, governance, dispute resolution, and community programs, particularly beneficial for indigenous and conflict-affected communities.',
	criteria: [
		{
			id: 'no_community_facility',
			name: 'No Community Facility Exists',
			description: 'Lacks a dedicated community gathering space',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				const noHealthCenter = profile.facilities.healthCenter.exists === 'no';
				if (noHealthCenter) {
					return {
						points: 3.0,
						reason: 'No central community facility available'
					};
				}
				return { points: 0, reason: 'Has some community facility' };
			}
		},
		{
			id: 'indigenous_community',
			name: 'Indigenous People Community',
			description: 'IP communities benefit from tribal halls for governance',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.indigenous && profile.vulnerableGroups.ipCount >= 50) {
					return {
						points: 2.5,
						reason: `${profile.vulnerableGroups.ipCount} Indigenous People need tribal hall`
					};
				} else if (profile.sitioClassification.indigenous) {
					return {
						points: 1.5,
						reason: 'Indigenous community needs governance space'
					};
				}
				return { points: 0, reason: 'Not an Indigenous People community' };
			}
		},
		{
			id: 'conflict_context',
			name: 'Conflict-Affected Area',
			description: 'Community hub aids dispute resolution and social cohesion',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.conflict) {
					return {
						points: 2.0,
						reason: 'Conflict-affected area needs dispute resolution venue'
					};
				}
				return { points: 0, reason: 'No recent conflict reported' };
			}
		},
		{
			id: 'large_household_count',
			name: 'Large Household Count',
			description: 'Many households need gathering space',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.totalHouseholds >= 100) {
					return {
						points: 1.5,
						reason: `${profile.totalHouseholds} households need community space`
					};
				} else if (profile.totalHouseholds >= 50) {
					return {
						points: 1.0,
						reason: `${profile.totalHouseholds} households would benefit`
					};
				}
				return { points: 0, reason: 'Small household count' };
			}
		},
		{
			id: 'gida_classification',
			name: 'GIDA Classification',
			description: 'GIDA areas need community infrastructure',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.gida) {
					return {
						points: 1.0,
						reason: 'GIDA area needs community development space'
					};
				}
				return { points: 0, reason: 'Not classified as GIDA' };
			}
		}
	]
};

export const MADRASAH_FACILITY_CONFIG: PPAConfig = {
	id: 'madrasah-facility',
	name: 'Construction of Madrasah Facility',
	category: 'Infrastructure',
	description:
		'Construction or rehabilitation of Madrasah facilities to provide religious and cultural education for Muslim communities, supporting their spiritual and educational needs.',
	criteria: [
		{
			id: 'muslim_population',
			name: 'Significant Muslim Population',
			description: 'Muslim community requires religious education facility',
			maxPoints: 4.0,
			enabled: true,
			evaluate: (profile) => {
				const muslimCount = profile.vulnerableGroups.muslimCount;
				if (muslimCount >= 100) {
					return {
						points: 4.0,
						reason: `${muslimCount} Muslims need Madrasah facility`
					};
				} else if (muslimCount >= 50) {
					return {
						points: 3.0,
						reason: `${muslimCount} Muslims would benefit from Madrasah`
					};
				} else if (muslimCount >= 20) {
					return {
						points: 1.5,
						reason: `${muslimCount} Muslims in community`
					};
				}
				return { points: 0, reason: 'Very small Muslim population' };
			}
		},
		{
			id: 'no_madrasah_exists',
			name: 'No Madrasah Exists',
			description: 'Community lacks Madrasah facility',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				// Only relevant if there's a Muslim population
				if (profile.vulnerableGroups.muslimCount === 0) {
					return { points: 0, reason: 'Not applicable - non-Muslim community' };
				}
				if (profile.facilities.madrasah.exists === 'no') {
					return { points: 3.0, reason: 'No Madrasah facility exists' };
				}
				return { points: 0, reason: 'Madrasah facility exists' };
			}
		},
		{
			id: 'madrasah_condition',
			name: 'Poor Madrasah Condition',
			description: 'Existing Madrasah needs rehabilitation',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				// Only relevant if there's a Muslim population
				if (profile.vulnerableGroups.muslimCount === 0) {
					return { points: 0, reason: 'Not applicable - non-Muslim community' };
				}
				if (profile.facilities.madrasah.exists === 'yes') {
					// Condition: 1=bad, 2=poor, 3=fair, 4=good, 5=excellent
					if (profile.facilities.madrasah.condition === 1) {
						return {
							points: 2.0,
							reason: 'Madrasah is unsafe and needs replacement'
						};
					} else if (profile.facilities.madrasah.condition === 2) {
						return {
							points: 1.5,
							reason: 'Madrasah requires immediate repair'
						};
					} else if (profile.facilities.madrasah.condition === 3) {
						return { points: 0.5, reason: 'Madrasah showing signs of age' };
					}
				}
				return {
					points: 0,
					reason: 'Madrasah in good condition or does not exist'
				};
			}
		},
		{
			id: 'distance_to_madrasah',
			name: 'Distance to Nearest Madrasah',
			description: 'Far distance to nearest facility',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				// Only relevant if there's a Muslim population
				if (profile.vulnerableGroups.muslimCount === 0) {
					return { points: 0, reason: 'Not applicable - non-Muslim community' };
				}
				if (
					profile.facilities.madrasah.exists === 'no' &&
					profile.facilities.madrasah.distanceToNearest
				) {
					if (profile.facilities.madrasah.distanceToNearest >= 5) {
						return {
							points: 1.0,
							reason: `Nearest Madrasah is ${profile.facilities.madrasah.distanceToNearest}km away`
						};
					} else if (profile.facilities.madrasah.distanceToNearest >= 2) {
						return {
							points: 0.5,
							reason: `Nearest Madrasah is ${profile.facilities.madrasah.distanceToNearest}km away`
						};
					}
				}
				return { points: 0, reason: 'Madrasah exists or nearby' };
			}
		}
	]
};

// ==========================================
// INFRASTRUCTURE PROJECTS (6-9)
// ==========================================

export const SCHOOL_BUILDING_CONFIG: PPAConfig = {
	id: 'school-building',
	name: 'Construction of School Building',
	category: 'Infrastructure',
	description:
		'Construction of new school buildings or additional classrooms to address overcrowding, improve access to education, and provide safe learning environments for school-age children.',
	criteria: [
		{
			id: 'insufficient_classrooms',
			name: 'Insufficient Classrooms',
			description: 'Classrooms not enough for student population',
			maxPoints: 3.5,
			enabled: true,
			evaluate: (profile) => {
				// studentsPerRoom: 'less_than_46' | '46_50' | '51_55' | 'more_than_56' | 'no_classroom'
				if (profile.studentsPerRoom === 'no_classroom') {
					return {
						points: 3.5,
						reason: 'No classroom available in sitio'
					};
				} else if (profile.studentsPerRoom === 'more_than_56') {
					return {
						points: 3.0,
						reason: 'Severely overcrowded classrooms (>56 students per room)'
					};
				} else if (profile.studentsPerRoom === '51_55') {
					return {
						points: 2.0,
						reason: 'Overcrowded classrooms (51-55 students per room)'
					};
				} else if (profile.studentsPerRoom === '46_50') {
					return {
						points: 1.0,
						reason: 'Moderately crowded classrooms (46-50 students per room)'
					};
				}
				return { points: 0, reason: 'Classrooms are sufficient' };
			}
		},
		{
			id: 'no_elementary',
			name: 'No Elementary School',
			description: 'Sitio lacks elementary school',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.facilities.elementarySchool.exists === 'no') {
					return {
						points: 2.5,
						reason: 'No elementary school exists in sitio'
					};
				}
				return { points: 0, reason: 'Elementary school exists' };
			}
		},
		{
			id: 'poor_school_condition',
			name: 'Poor School Facility Condition',
			description: 'Existing school in poor/critical condition',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				const elementary = profile.facilities.elementarySchool;
				// Condition: 1=bad, 2=poor, 3=fair, 4=good, 5=excellent
				if (elementary.exists === 'yes' && elementary.condition === 1) {
					return {
						points: 2.0,
						reason: 'Elementary school is unsafe and needs replacement'
					};
				} else if (elementary.exists === 'yes' && elementary.condition === 2) {
					return {
						points: 1.5,
						reason: 'Elementary school requires immediate repair'
					};
				}
				return { points: 0, reason: 'School facility in acceptable condition' };
			}
		},
		{
			id: 'many_children_not_attending',
			name: 'Out of School Youth Present',
			description: 'School-age children not attending school',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				const osyCount = profile.vulnerableGroups.outOfSchoolYouth || 0;
				if (osyCount >= 30) {
					return {
						points: 1.5,
						reason: `${osyCount} out-of-school youth in community`
					};
				} else if (osyCount >= 15) {
					return {
						points: 1.0,
						reason: `${osyCount} out-of-school youth present`
					};
				} else if (osyCount > 0) {
					return {
						points: 0.5,
						reason: `${osyCount} out-of-school youth present`
					};
				}
				return { points: 0, reason: 'No out-of-school youth reported' };
			}
		},
		{
			id: 'distance_to_school',
			name: 'Distance to Nearest School',
			description: 'Students must travel far to attend school',
			maxPoints: 0.5,
			enabled: true,
			evaluate: (profile) => {
				if (
					profile.facilities.elementarySchool.exists === 'no' &&
					profile.facilities.elementarySchool.distanceToNearest
				) {
					if (profile.facilities.elementarySchool.distanceToNearest >= 3) {
						return {
							points: 0.5,
							reason: `Nearest school is ${profile.facilities.elementarySchool.distanceToNearest}km away`
						};
					}
				}
				return { points: 0, reason: 'School exists or is nearby' };
			}
		}
	]
};

export const SOLAR_STREET_LIGHTS_CONFIG: PPAConfig = {
	id: 'solar-street-lights',
	name: 'Installation of Solar Street Lights',
	category: 'Infrastructure',
	description:
		'Installation of solar-powered street lighting systems to improve safety, security, and mobility during nighttime hours, particularly in areas without grid electricity access.',
	criteria: [
		{
			id: 'no_street_lights',
			name: 'Street Lights Priority Need',
			description: 'Community prioritizes street lighting',
			maxPoints: 4.0,
			enabled: true,
			evaluate: (profile) => {
				// Use priorities array index for solarStreetLights: 0=not needed, 1=low, 2=moderate, 3=very urgent
				const priority = getPriorityValue(profile.priorities, PRIORITY_NAMES.solarStreetLights);
				if (priority === 3) {
					return { points: 4.0, reason: 'Street lights are a very urgent priority' };
				} else if (priority === 2) {
					return { points: 2.5, reason: 'Street lights are a moderate priority' };
				} else if (priority === 1) {
					return { points: 1.0, reason: 'Street lights are a low priority need' };
				}
				return { points: 0, reason: 'Street lights not identified as a priority' };
			}
		},
		{
			id: 'no_grid_electricity',
			name: 'No Grid Electricity',
			description: 'Sitio not connected to power grid',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				if (!profile.electricitySources.grid || profile.electricitySources.grid === 0) {
					return {
						points: 2.5,
						reason: 'Not connected to main power grid - solar ideal'
					};
				}
				return { points: 0, reason: 'Connected to power grid' };
			}
		},
		{
			id: 'low_electrification',
			name: 'Low Household Electrification',
			description: 'Few households have electricity',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				const electrificationRate =
					(profile.householdsWithElectricity / profile.totalHouseholds) * 100;
				if (electrificationRate < 25) {
					return {
						points: 2.0,
						reason: `Only ${electrificationRate.toFixed(0)}% of households have electricity`
					};
				} else if (electrificationRate < 50) {
					return {
						points: 1.0,
						reason: `${electrificationRate.toFixed(0)}% household electrification`
					};
				}
				return { points: 0, reason: 'Majority of households have electricity' };
			}
		},
		{
			id: 'safety_concern',
			name: 'Safety and Security Concern',
			description: 'Conflict or safety issues that lighting would address',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.conflict) {
					return {
						points: 1.0,
						reason: 'Conflict area - lighting improves safety'
					};
				}
				return { points: 0, reason: 'No specific safety concerns' };
			}
		},
		{
			id: 'footpath_access_lights',
			name: 'Footpath Access Needs Lighting',
			description: 'Footpaths would benefit from lighting',
			maxPoints: 0.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.mainAccess.footpath) {
					return {
						points: 0.5,
						reason: 'Footpath access would benefit from lighting'
					};
				}
				return { points: 0, reason: 'Not primarily footpath access' };
			}
		}
	]
};

export const SANITARY_TOILET_CONFIG: PPAConfig = {
	id: 'sanitary-toilet',
	name: 'Construction of Sanitary Toilet Facilities',
	category: 'Infrastructure',
	description:
		'Construction of household or communal sanitary toilet facilities to eliminate open defecation, improve public health, and reduce waterborne disease transmission.',
	criteria: [
		{
			id: 'open_defecation',
			name: 'Open Defecation Practice',
			description: 'Community practices open defecation',
			maxPoints: 4.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sanitationTypes.openDefecation) {
					return {
						points: 4.0,
						reason: 'Open defecation is practiced - critical health risk'
					};
				}
				return { points: 0, reason: 'No open defecation reported' };
			}
		},
		{
			id: 'low_toilet_coverage',
			name: 'Low Toilet Ownership',
			description: 'Few households have own toilet facilities',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				const toiletCoverage = (profile.householdsWithToilet / profile.totalHouseholds) * 100;
				if (toiletCoverage < 25) {
					return {
						points: 3.0,
						reason: `Only ${toiletCoverage.toFixed(0)}% of households have toilets`
					};
				} else if (toiletCoverage < 50) {
					return {
						points: 2.0,
						reason: `${toiletCoverage.toFixed(0)}% toilet coverage`
					};
				} else if (toiletCoverage < 75) {
					return {
						points: 1.0,
						reason: `${toiletCoverage.toFixed(0)}% toilet coverage`
					};
				}
				return { points: 0, reason: 'Majority of households have toilets' };
			}
		},
		{
			id: 'no_comfort_room',
			name: 'No Community Toilet',
			description: 'Lack of communal sanitation facility',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.facilities.communityToilet.exists === 'no') {
					return { points: 1.5, reason: 'No community toilet exists' };
				}
				return { points: 0, reason: 'Community toilet exists' };
			}
		},
		{
			id: 'waterborne_health',
			name: 'Flood Risk Indicates Health Concerns',
			description: 'Flooding can contribute to sanitation issues',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.hazards.flood.frequency > 0) {
					return {
						points: 1.0,
						reason: 'Flooding risk indicates potential sanitation health issues'
					};
				}
				return { points: 0, reason: 'No flood-related health concerns' };
			}
		},
		{
			id: 'pit_latrine_use',
			name: 'Pit Latrine Predominance',
			description: 'Community relies on pit latrines',
			maxPoints: 0.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sanitationTypes.pitLatrine && !profile.sanitationTypes.waterSealed) {
					return {
						points: 0.5,
						reason: 'Pit latrines used - upgrading to sealed toilets needed'
					};
				}
				return { points: 0, reason: 'Water-sealed toilets or better in use' };
			}
		}
	]
};

export const SLOPE_PROTECTION_CONFIG: PPAConfig = {
	id: 'slope-protection',
	name: 'Construction of Slope Protection / Box Culverts',
	category: 'Infrastructure',
	description:
		'Installation of slope protection structures and drainage systems to mitigate flooding and landslide risks, protecting infrastructure and agricultural areas from natural disasters.',
	criteria: [
		{
			id: 'flooding_risk',
			name: 'Flooding Risk',
			description: 'Area experiences regular flooding',
			maxPoints: 3.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.hazards.flood.frequency > 0) {
					return {
						points: 3.5,
						reason: 'Flooding is a common risk in the area'
					};
				}
				return { points: 0, reason: 'No significant flooding risk' };
			}
		},
		{
			id: 'landslide_risk',
			name: 'Landslide Risk',
			description: 'Area prone to landslides needing slope protection',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.hazards.landslide.frequency > 0) {
					return {
						points: 3.0,
						reason: 'Landslides are a common risk - slope protection needed'
					};
				}
				return { points: 0, reason: 'No landslide risk' };
			}
		},
		{
			id: 'access_vulnerability',
			name: 'Access Route Vulnerability',
			description: 'Roads affected by weather events',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				const roads = [
					profile.infrastructure.asphalt,
					profile.infrastructure.concrete,
					profile.infrastructure.gravel,
					profile.infrastructure.natural
				];
				const existingRoads = roads.filter((r) => r.exists === 'yes' && r.condition);
				const hasFloodRisk = profile.hazards.flood.frequency > 0;
				const hasLandslideRisk = profile.hazards.landslide.frequency > 0;

				if (existingRoads.length > 0) {
					const worstCondition = Math.min(...existingRoads.map((r) => r.condition!));
					if (worstCondition <= 2 && (hasFloodRisk || hasLandslideRisk)) {
						return {
							points: 2.0,
							reason: 'Poor roads compound flood/landslide impacts on access'
						};
					}
				}
				return { points: 0, reason: 'Roads not particularly vulnerable' };
			}
		},
		{
			id: 'boat_access',
			name: 'Water-Based Access',
			description: 'Boat access indicates need for water crossings',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.mainAccess.boat) {
					return {
						points: 1.0,
						reason: 'Boat access indicates need for river crossings/culverts'
					};
				}
				return { points: 0, reason: 'No water-based access' };
			}
		},
		{
			id: 'agricultural_impact',
			name: 'Agricultural Area Impact',
			description: 'Flooding affects farming community',
			maxPoints: 0.5,
			enabled: true,
			evaluate: (profile) => {
				const hasFloodRisk = profile.hazards.flood.frequency > 0;
				if (hasFloodRisk && profile.agriculture.numberOfFarmers > 0) {
					return {
						points: 0.5,
						reason: 'Flooding impacts agricultural livelihoods'
					};
				}
				return { points: 0, reason: 'No flooding impact on agriculture' };
			}
		}
	]
};

// ==========================================
// SERVICE DELIVERY & SOCIAL PROJECTS
// ==========================================

export const SERVICE_CARAVAN_CONFIG: PPAConfig = {
	id: 'service-caravan',
	name: 'Conduct of Convergence Service Caravan',
	category: 'Service Delivery & Social',
	description:
		'Mobile delivery of essential government services including health consultations, vaccinations, and social welfare programs to remote or underserved communities with limited access to regular service facilities.',
	criteria: [
		{
			id: 'no_health_center',
			name: 'No Health Center',
			description: 'Sitio lacks health facility',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.facilities.healthCenter.exists === 'no') {
					return {
						points: 2.5,
						reason: 'No health center - mobile services critical'
					};
				}
				return { points: 0, reason: 'Health center exists' };
			}
		},
		{
			id: 'health_distance',
			name: 'Distance to Health Services',
			description: 'Far from health facilities',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				if (
					profile.facilities.healthCenter.exists === 'no' &&
					profile.facilities.healthCenter.distanceToNearest
				) {
					if (profile.facilities.healthCenter.distanceToNearest >= 5) {
						return {
							points: 2.0,
							reason: `Nearest health center is ${profile.facilities.healthCenter.distanceToNearest}km away`
						};
					} else if (profile.facilities.healthCenter.distanceToNearest >= 2) {
						return {
							points: 1.0,
							reason: `Health center is ${profile.facilities.healthCenter.distanceToNearest}km away`
						};
					}
				}
				return { points: 0, reason: 'Health center nearby' };
			}
		},
		{
			id: 'health_concerns_multiple',
			name: 'Multiple Risk Factors',
			description: 'Various hazards and food security concerns present',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				let concerns = 0;
				if (profile.hazards.flood.frequency > 0) concerns++;
				if (profile.hazards.landslide.frequency > 0) concerns++;
				if (profile.hazards.drought.frequency > 0) concerns++;
				if (
					profile.foodSecurity === 'critical_shortage' ||
					profile.foodSecurity === 'seasonal_scarcity'
				)
					concerns++;
				if (profile.sitioClassification.conflict) concerns++;

				if (concerns >= 3) {
					return {
						points: 2.0,
						reason: `${concerns} different risk factors identified`
					};
				} else if (concerns >= 2) {
					return {
						points: 1.0,
						reason: `${concerns} risk factors identified`
					};
				}
				return { points: 0, reason: 'Few risk factors' };
			}
		},
		{
			id: 'large_population_services',
			name: 'Large Population to Serve',
			description: 'Many residents need services',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				const population = getTotalPopulation(profile);
				if (population >= 500) {
					return {
						points: 1.5,
						reason: `Large population (${population}) needs mobile services`
					};
				} else if (population >= 250) {
					return {
						points: 1.0,
						reason: `Moderate population (${population}) would benefit`
					};
				}
				return { points: 0, reason: 'Small population' };
			}
		},
		{
			id: 'gida_services',
			name: 'GIDA Area',
			description: 'Remote area needs mobile services',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.gida) {
					return {
						points: 1.0,
						reason: 'GIDA area benefits from mobile service delivery'
					};
				}
				return { points: 0, reason: 'Not GIDA' };
			}
		},
		{
			id: 'first_visit',
			name: 'GIDA or Indigenous Community',
			description: 'Priority service delivery for underserved communities',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.gida && profile.sitioClassification.indigenous) {
					return {
						points: 1.0,
						reason: 'GIDA and Indigenous community - service caravan priority'
					};
				}
				return { points: 0, reason: 'Standard community' };
			}
		}
	]
};

export const CIVIL_REGISTRY_CONFIG: PPAConfig = {
	id: 'civil-registry',
	name: 'Civil Registry & National ID Registration',
	category: 'Service Delivery & Social',
	description:
		'Facilitation of birth registration and national identification card (PhilSys) enrollment to ensure legal identity documentation, enabling access to government services and social programs.',
	criteria: [
		{
			id: 'unregistered_births_high',
			name: 'High Unregistered Births',
			description: 'Many individuals lack birth certificates',
			maxPoints: 4.0,
			enabled: true,
			evaluate: (profile) => {
				const noBirthCert = profile.vulnerableGroups.noBirthCertCount;
				if (noBirthCert >= 50) {
					return {
						points: 4.0,
						reason: `${noBirthCert} individuals without birth certificates`
					};
				} else if (noBirthCert >= 20) {
					return {
						points: 3.0,
						reason: `${noBirthCert} without birth certificates`
					};
				} else if (noBirthCert >= 10) {
					return {
						points: 2.0,
						reason: `${noBirthCert} without birth certificates`
					};
				} else if (noBirthCert > 0) {
					return {
						points: 1.0,
						reason: `${noBirthCert} without birth certificates`
					};
				}
				return { points: 0, reason: 'All births appear registered' };
			}
		},
		{
			id: 'no_philsys_id',
			name: 'Lack of National ID',
			description: 'Adults without PhilSys ID',
			maxPoints: 3.5,
			enabled: true,
			evaluate: (profile) => {
				const noNationalID = profile.vulnerableGroups.noNationalIDCount;
				if (noNationalID >= 100) {
					return {
						points: 3.5,
						reason: `${noNationalID} adults without National ID`
					};
				} else if (noNationalID >= 50) {
					return {
						points: 2.5,
						reason: `${noNationalID} adults without National ID`
					};
				} else if (noNationalID >= 20) {
					return {
						points: 1.5,
						reason: `${noNationalID} adults without National ID`
					};
				} else if (noNationalID > 0) {
					return {
						points: 0.5,
						reason: `${noNationalID} adults without National ID`
					};
				}
				return { points: 0, reason: 'Most adults have National ID' };
			}
		},
		{
			id: 'gida_documentation',
			name: 'GIDA Area Documentation Gap',
			description: 'Remote areas often have documentation gaps',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.gida) {
					return {
						points: 1.5,
						reason: 'GIDA area likely has documentation gaps'
					};
				}
				return { points: 0, reason: 'Not GIDA' };
			}
		},
		{
			id: 'ip_community_docs',
			name: 'Indigenous People Community',
			description: 'IP communities often face documentation barriers',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.indigenous) {
					return {
						points: 1.0,
						reason: 'Indigenous community may face documentation barriers'
					};
				}
				return { points: 0, reason: 'Not an IP community' };
			}
		}
	]
};

export const FEEDING_PROGRAM_CONFIG: PPAConfig = {
	id: 'feeding-program',
	name: 'Implementation of Supplemental Feeding Program',
	category: 'Service Delivery & Social',
	description:
		'Provision of nutritional supplementation programs to address malnutrition and food insecurity, particularly targeting children and vulnerable populations in poverty-stricken or conflict-affected areas.',
	criteria: [
		{
			id: 'malnutrition_concern',
			name: 'Food Security Critical',
			description: 'Critical food shortage indicates malnutrition risk',
			maxPoints: 5.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.foodSecurity === 'critical_shortage') {
					return {
						points: 5.0,
						reason: 'Critical food shortage - high malnutrition risk'
					};
				} else if (profile.foodSecurity === 'seasonal_scarcity') {
					return {
						points: 3.0,
						reason: 'Seasonal food scarcity - malnutrition concern'
					};
				}
				return { points: 0, reason: 'Food security adequate' };
			}
		},
		{
			id: 'food_insecurity',
			name: 'Food Insecurity Risk',
			description: 'Community faces food insecurity',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.foodSecurity === 'seasonal_scarcity') {
					return { points: 2.5, reason: 'Seasonal food scarcity reported' };
				}
				return { points: 0, reason: 'No food insecurity reported' };
			}
		},
		{
			id: 'extreme_poverty',
			name: 'Low Income Community',
			description: 'Low average daily income indicates poverty',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				// Average daily income - poverty threshold roughly ~300/day per household
				if (profile.averageDailyIncome > 0 && profile.averageDailyIncome < 200) {
					return {
						points: 1.5,
						reason: `Average daily income ₱${profile.averageDailyIncome} indicates extreme poverty`
					};
				} else if (profile.averageDailyIncome >= 200 && profile.averageDailyIncome < 350) {
					return {
						points: 1.0,
						reason: `Average daily income ₱${profile.averageDailyIncome} below poverty line`
					};
				}
				return { points: 0, reason: 'Income above poverty threshold' };
			}
		},
		{
			id: 'conflict_feeding',
			name: 'Conflict-Affected Area',
			description: 'Conflict disrupts food security',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.conflict) {
					return { points: 1.0, reason: 'Conflict impacts food security' };
				}
				return { points: 0, reason: 'No recent conflict' };
			}
		}
	]
};

export const LIVELIHOOD_ASSISTANCE_CONFIG: PPAConfig = {
	id: 'livelihood-assistance',
	name: 'Provision of Livelihood Assistance & Skills Training',
	category: 'Service Delivery & Social',
	description:
		'Skills training and livelihood support programs to reduce unemployment, enhance income-generating capabilities, and provide economic opportunities for out-of-school youth and underemployed community members.',
	criteria: [
		{
			id: 'high_unemployment',
			name: 'High Unemployment',
			description: 'Significant unemployment in labor force',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.laborForceCount === 0) return { points: 0, reason: 'No labor force data' };
				const unemploymentRate =
					(profile.vulnerableGroups.unemployedCount / profile.laborForceCount) * 100;
				if (unemploymentRate >= 30) {
					return {
						points: 3.0,
						reason: `${unemploymentRate.toFixed(0)}% unemployment rate`
					};
				} else if (unemploymentRate >= 20) {
					return {
						points: 2.0,
						reason: `${unemploymentRate.toFixed(0)}% unemployment`
					};
				} else if (unemploymentRate >= 10) {
					return {
						points: 1.0,
						reason: `${unemploymentRate.toFixed(0)}% unemployment`
					};
				}
				return { points: 0, reason: 'Low unemployment' };
			}
		},
		{
			id: 'poverty_level',
			name: 'High Poverty Levels',
			description: 'Low average daily income indicates poverty',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				// Average daily income - poverty threshold roughly ~300/day per household
				if (profile.averageDailyIncome > 0 && profile.averageDailyIncome < 150) {
					return {
						points: 2.5,
						reason: `Average daily income ₱${profile.averageDailyIncome} indicates severe poverty`
					};
				} else if (profile.averageDailyIncome >= 150 && profile.averageDailyIncome < 250) {
					return {
						points: 1.5,
						reason: `Average daily income ₱${profile.averageDailyIncome} indicates poverty`
					};
				} else if (profile.averageDailyIncome >= 250 && profile.averageDailyIncome < 350) {
					return {
						points: 0.5,
						reason: `Average daily income ₱${profile.averageDailyIncome} below median`
					};
				}
				return { points: 0, reason: 'Income above poverty threshold' };
			}
		},
		{
			id: 'out_of_school_youth',
			name: 'Out of School Youth',
			description: 'OSY need skills training',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				const osyCount = profile.vulnerableGroups.outOfSchoolYouth || 0;
				if (osyCount >= 30) {
					return {
						points: 2.0,
						reason: `${osyCount} Out of School Youth need training`
					};
				} else if (osyCount >= 15) {
					return {
						points: 1.5,
						reason: `${osyCount} OSY need skills development`
					};
				} else if (osyCount > 0) {
					return {
						points: 1.0,
						reason: `${osyCount} OSY present`
					};
				}
				return { points: 0, reason: 'No OSY reported' };
			}
		},
		{
			id: 'no_livelihood_support',
			name: 'Farm Tools Priority Need',
			description: 'Community prioritizes farm tools/support',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				const priority = getPriorityValue(profile.priorities, PRIORITY_NAMES.farmTools);
				if (priority >= 2 && profile.agriculture.numberOfFarmers > 0) {
					return {
						points: 1.5,
						reason: 'Farming community prioritizes livelihood support'
					};
				}
				return { points: 0, reason: 'Livelihood support not a priority' };
			}
		},
		{
			id: 'trading_opportunity',
			name: 'Self-Employment/Trading Potential',
			description: 'Self-employed workers exist who could benefit',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.workerClass.selfEmployed) {
					return {
						points: 1.0,
						reason: 'Self-employed workers - capital assistance would help'
					};
				}
				return { points: 0, reason: 'No self-employment activity' };
			}
		}
	]
};

export const AGRICULTURAL_INPUTS_CONFIG: PPAConfig = {
	id: 'agricultural-inputs',
	name: 'Distribution of Agricultural Inputs',
	category: 'Service Delivery & Social',
	description:
		'Distribution of seeds, fertilizers, and farm tools to support agricultural communities, improve crop productivity, and enhance food security for farming-dependent populations.',
	criteria: [
		{
			id: 'farming_livelihood',
			name: 'Farming as Primary Livelihood',
			description: 'Agriculture is main economic activity',
			maxPoints: 3.0,
			enabled: true,
			evaluate: (profile) => {
				const farmers = profile.agriculture.numberOfFarmers;
				if (farmers >= 50) {
					return {
						points: 3.0,
						reason: `${farmers} farmers rely on agriculture`
					};
				} else if (farmers >= 20) {
					return {
						points: 2.0,
						reason: `${farmers} farmers in community`
					};
				} else if (farmers > 0) {
					return { points: 1.0, reason: 'Farming is a livelihood source' };
				}
				return { points: 0, reason: 'Not primarily agricultural' };
			}
		},
		{
			id: 'no_seeds_support',
			name: 'Farm Tools Priority',
			description: 'Farmers prioritize farm tools/inputs',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				const priority = getPriorityValue(profile.priorities, PRIORITY_NAMES.farmTools);
				if (priority === 3 && profile.agriculture.numberOfFarmers > 0) {
					return { points: 2.5, reason: 'Farm tools/inputs are a very urgent priority' };
				} else if (priority === 2 && profile.agriculture.numberOfFarmers > 0) {
					return { points: 1.5, reason: 'Farm tools/inputs are a moderate priority' };
				}
				return { points: 0, reason: 'Farm inputs not a priority' };
			}
		},
		{
			id: 'no_farm_tools',
			name: 'Agricultural Community Needs',
			description: 'Farming community would benefit from inputs',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.agriculture.numberOfFarmers >= 30) {
					return { points: 2.0, reason: 'Large farming community would benefit from tools' };
				} else if (profile.agriculture.numberOfFarmers >= 10) {
					return { points: 1.0, reason: 'Farming community would benefit from tools' };
				}
				return { points: 0, reason: 'Small farming presence' };
			}
		},
		{
			id: 'large_farm_area',
			name: 'Significant Agricultural Land',
			description: 'Large farming area to support',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				const farmArea = profile.agriculture.estimatedFarmAreaHectares;
				if (farmArea >= 100) {
					return {
						points: 1.5,
						reason: `${farmArea} hectares of farmland`
					};
				} else if (farmArea >= 50) {
					return {
						points: 1.0,
						reason: `${farmArea} hectares of farmland`
					};
				} else if (farmArea >= 20) {
					return {
						points: 0.5,
						reason: `${farmArea} hectares of farmland`
					};
				}
				return { points: 0, reason: 'Small farming area' };
			}
		},
		{
			id: 'farmers_organization',
			name: 'Farmers Organization Exists',
			description: 'Organized farmers can better utilize inputs',
			maxPoints: 1.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.agriculture.numberOfAssociations >= 1) {
					return {
						points: 1.0,
						reason: `${profile.agriculture.numberOfAssociations} farmers association(s) can distribute inputs`
					};
				}
				return { points: 0, reason: 'No farmers organization' };
			}
		}
	]
};

export const SOCIAL_PREPARATION_CONFIG: PPAConfig = {
	id: 'social-preparation',
	name: 'Conduct of Social Preparation & Site Validation',
	category: 'Service Delivery & Social',
	description:
		'Community engagement, consultation, and site assessment activities to ensure culturally-appropriate project implementation, particularly for indigenous peoples and conflict-affected communities requiring sensitive social preparation.',
	criteria: [
		{
			id: 'first_visit_prep',
			name: 'GIDA Area Requires Preparation',
			description: 'GIDA areas require community consultation',
			maxPoints: 4.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.gida) {
					return {
						points: 4.0,
						reason: 'GIDA area - community consultation essential'
					};
				}
				return { points: 0, reason: 'Standard community' };
			}
		},
		{
			id: 'infrastructure_planned',
			name: 'Infrastructure Projects Needed',
			description: 'Site validation required for infrastructure',
			maxPoints: 2.5,
			enabled: true,
			evaluate: (profile) => {
				const hasPavedRoads =
					profile.infrastructure.asphalt.exists === 'yes' ||
					profile.infrastructure.concrete.exists === 'yes';
				const hasFunctionalWater =
					(profile.waterSources.level1.exists === 'yes' &&
						(profile.waterSources.level1.functioningCount || 0) > 0) ||
					(profile.waterSources.level2.exists === 'yes' &&
						(profile.waterSources.level2.functioningCount || 0) > 0) ||
					(profile.waterSources.level3.exists === 'yes' &&
						(profile.waterSources.level3.functioningCount || 0) > 0);
				const needsInfra =
					!hasPavedRoads || !hasFunctionalWater || profile.facilities.healthCenter.exists === 'no';
				if (needsInfra) {
					return {
						points: 2.5,
						reason: 'Major infrastructure needs require technical survey'
					};
				}
				return { points: 0, reason: 'No major infrastructure needs' };
			}
		},
		{
			id: 'indigenous_consultation',
			name: 'Indigenous People Community',
			description: 'IP communities require culturally-sensitive engagement',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.indigenous) {
					return {
						points: 2.0,
						reason: 'Indigenous community requires culturally-appropriate consultation'
					};
				}
				return { points: 0, reason: 'Not an IP community' };
			}
		},
		{
			id: 'conflict_peacebuilding',
			name: 'Conflict-Affected Area',
			description: 'Conflict areas need careful social preparation',
			maxPoints: 1.5,
			enabled: true,
			evaluate: (profile) => {
				if (profile.sitioClassification.conflict) {
					return {
						points: 1.5,
						reason: 'Conflict context requires careful community engagement'
					};
				}
				return { points: 0, reason: 'No conflict context' };
			}
		}
	]
};

// ==========================================
// SCORING ENGINE
// ==========================================

/**
 * Main scoring engine that evaluates all projects
 */
export class ProjectScoringEngine {
	private projectConfigs: PPAConfig[];

	constructor(customConfigs?: PPAConfig[]) {
		this.projectConfigs = customConfigs || this.getDefaultConfigs();
	}

	/**
	 * Get default project configurations
	 */
	private getDefaultConfigs(): PPAConfig[] {
		return [
			POTABLE_WATER_SYSTEM_CONFIG,
			CONCRETE_TIRE_PATH_CONFIG,
			ROAD_OPENING_CONFIG,
			COMMUNITY_HUB_CONFIG,
			MADRASAH_FACILITY_CONFIG,
			SCHOOL_BUILDING_CONFIG,
			SOLAR_STREET_LIGHTS_CONFIG,
			SANITARY_TOILET_CONFIG,
			SLOPE_PROTECTION_CONFIG,
			SERVICE_CARAVAN_CONFIG,
			CIVIL_REGISTRY_CONFIG,
			FEEDING_PROGRAM_CONFIG,
			LIVELIHOOD_ASSISTANCE_CONFIG,
			AGRICULTURAL_INPUTS_CONFIG,
			SOCIAL_PREPARATION_CONFIG
		];
	}

	/**
	 * Score a single project
	 */
	private scoreProject(config: PPAConfig, profile: SitioProfile): PPARecommendation {
		const criteriaBreakdown: CriteriaScore[] = [];
		let totalPoints = 0;
		let maxPossiblePoints = 0;
		const reasoning: string[] = [];

		// Evaluate each enabled criterion
		for (const criterion of config.criteria) {
			if (!criterion.enabled) continue;

			const result = criterion.evaluate(profile);
			maxPossiblePoints += criterion.maxPoints;
			totalPoints += result.points;

			criteriaBreakdown.push({
				criteriaName: criterion.name,
				pointsAwarded: result.points,
				maxPoints: criterion.maxPoints,
				reason: result.reason
			});

			// Add to reasoning if points were awarded
			if (result.points > 0) {
				reasoning.push(result.reason);
			}
		}

		// Normalize score to 0-10 scale
		const needScore = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 10 : 0;

		return {
			ppa: config,
			needScore: Math.round(needScore * 10) / 10, // Round to 1 decimal
			priority: this.getPriorityLevel(needScore),
			scoreBreakdown: criteriaBreakdown
		};
	}

	/**
	 * Get priority level based on normalized score (0-10)
	 */
	private getPriorityLevel(score: number): PriorityLevel {
		if (score >= 8) return 'Critical';
		if (score >= 6) return 'High';
		if (score >= 4) return 'Moderate';
		return 'Low';
	}

	/**
	 * Evaluate all projects for a given sitio profile
	 */
	evaluateAllProjects(profile: SitioProfile): PPARecommendation[] {
		return this.projectConfigs
			.map((config) => this.scoreProject(config, profile))
			.sort((a, b) => b.needScore - a.needScore); // Sort by score descending
	}

	/**
	 * Get top N recommended projects
	 */
	getTopRecommendations(profile: SitioProfile, limit: number = 5): PPARecommendation[] {
		return this.evaluateAllProjects(profile).slice(0, limit);
	}

	/**
	 * Get recommendations by category
	 */
	getRecommendationsByCategory(
		profile: SitioProfile,
		category: 'Infrastructure' | 'Service Delivery & Social'
	): PPARecommendation[] {
		return this.evaluateAllProjects(profile).filter((rec) => rec.ppa.category === category);
	}

	/**
	 * Get recommendations above a certain priority level
	 */
	getRecommendationsByPriority(
		profile: SitioProfile,
		minPriority: 'Critical' | 'High' | 'Moderate' | 'Low'
	): PPARecommendation[] {
		const priorityOrder = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
		const minLevel = priorityOrder[minPriority];

		return this.evaluateAllProjects(profile).filter(
			(rec) => priorityOrder[rec.priority] >= minLevel
		);
	}

	/**
	 * Add or update a project configuration
	 */
	updateProjectConfig(config: PPAConfig): void {
		const index = this.projectConfigs.findIndex((c) => c.name === config.name);
		if (index >= 0) {
			this.projectConfigs[index] = config;
		} else {
			this.projectConfigs.push(config);
		}
	}

	/**
	 * Remove a project configuration
	 */
	removeProjectConfig(projectName: string): void {
		this.projectConfigs = this.projectConfigs.filter((c) => c.name !== projectName);
	}

	/**
	 * Get current configuration for a project
	 */
	getProjectConfig(projectName: string): PPAConfig | undefined {
		return this.projectConfigs.find((c) => c.name === projectName);
	}

	/**
	 * Get all project configurations
	 */
	getAllConfigs(): PPAConfig[] {
		return [...this.projectConfigs];
	}
}

// ==========================================
// USAGE EXAMPLES
// ==========================================

/**
 * Example 1: Basic Usage
 */
export function basicUsageExample(sitioProfile: SitioProfile) {
	// Create scoring engine with default configurations
	const engine = new ProjectScoringEngine();

	// Get all recommendations sorted by score
	const allRecommendations = engine.evaluateAllProjects(sitioProfile);

	console.log('All Projects Ranked:');
	allRecommendations.forEach((rec, index) => {
		console.log(`${index + 1}. ${rec.ppa.name}`);
		console.log(`   Score: ${rec.needScore}/10 (${rec.priority})`);
		console.log(`   Reasons: ${rec.scoreBreakdown.map((v) => v.reason).join(', ')}`);
	});

	return allRecommendations;
}

/**
 * Example 2: Get Top Recommendations
 */
export function getTopProjectsExample(sitioProfile: SitioProfile) {
	const engine = new ProjectScoringEngine();

	// Get top 5 recommendations
	const topProjects = engine.getTopRecommendations(sitioProfile, 5);

	console.log('Top 5 Recommended Projects:');
	topProjects.forEach((rec, index) => {
		console.log(`${index + 1}. ${rec.ppa.name} - ${rec.needScore}/10`);
	});

	return topProjects;
}

/**
 * Example 3: Filter by Category
 */
export function filterByCategoryExample(sitioProfile: SitioProfile) {
	const engine = new ProjectScoringEngine();

	// Get only infrastructure projects
	const infrastructureProjects = engine.getRecommendationsByCategory(
		sitioProfile,
		'Infrastructure'
	);

	// Get only service delivery projects
	const serviceProjects = engine.getRecommendationsByCategory(
		sitioProfile,
		'Service Delivery & Social'
	);

	console.log(`Infrastructure Projects: ${infrastructureProjects.length}`);
	console.log(`Service Projects: ${serviceProjects.length}`);

	return { infrastructureProjects, serviceProjects };
}

/**
 * Example 4: Filter by Priority
 */
export function filterByPriorityExample(sitioProfile: SitioProfile) {
	const engine = new ProjectScoringEngine();

	// Get only critical and high priority projects
	const urgentProjects = engine.getRecommendationsByPriority(sitioProfile, 'High');

	console.log(`Urgent Projects (High/Critical): ${urgentProjects.length}`);
	urgentProjects.forEach((rec) => {
		console.log(`- ${rec.ppa.name} (${rec.priority})`);
	});

	return urgentProjects;
}

/**
 * Example 5: Customize Project Configuration
 */
export function customizeConfigExample(sitioProfile: SitioProfile) {
	const engine = new ProjectScoringEngine();

	// Get existing water project configuration
	const waterConfig = engine.getProjectConfig('Construction of Potable Water System');

	if (waterConfig) {
		// Increase weight of "No Functional Water Source" criterion
		waterConfig.criteria[0].maxPoints = 4.0;

		// Disable the "Large Population Impact" criterion
		waterConfig.criteria[4].enabled = false;

		// Update the configuration
		engine.updateProjectConfig(waterConfig);

		console.log('Updated water project configuration');
	}

	// Re-evaluate with updated configuration
	const updatedRecommendations = engine.evaluateAllProjects(sitioProfile);
	return updatedRecommendations;
}

/**
 * Example 6: Add Custom Criterion to Existing Project
 */
export function addCustomCriterionExample(sitioProfile: SitioProfile) {
	const engine = new ProjectScoringEngine();

	// Get road project configuration
	const roadConfig = engine.getProjectConfig('Road Opening and Rehabilitation');

	if (roadConfig) {
		// Add a new custom criterion
		roadConfig.criteria.push({
			id: 'custom_market_access',
			name: 'Road Opening Priority',
			description: 'Community prioritizes road access',
			maxPoints: 2.0,
			enabled: true,
			evaluate: (profile) => {
				const priority = getPriorityValue(profile.priorities, PRIORITY_NAMES.roadOpening);
				if (priority === 3) {
					return {
						points: 2.0,
						reason: 'Community prioritizes road access as very urgent'
					};
				} else if (priority === 2) {
					return {
						points: 1.0,
						reason: 'Community has moderate road access priority'
					};
				}
				return { points: 0, reason: 'Road access not a stated priority' };
			}
		});

		// Update the configuration
		engine.updateProjectConfig(roadConfig);

		console.log('Added custom criterion to road project');
	}

	return engine.evaluateAllProjects(sitioProfile);
}

/**
 * Example 7: Create Custom Project Configuration
 */
export function createCustomProjectExample(sitioProfile: SitioProfile) {
	const engine = new ProjectScoringEngine();

	// Create a completely new project configuration
	const customProject: PPAConfig = {
		id: 'sports-facility',
		name: 'Construction of Sports Facility' as InfrastructureProjectType,
		category: 'Infrastructure',
		description:
			'Construction of sports and recreation facilities to provide physical activity opportunities and positive engagement for youth and out-of-school youth.',
		criteria: [
			{
				id: 'youth_population',
				name: 'Large Youth Population',
				description: 'Many young people would benefit',
				maxPoints: 3.0,
				enabled: true,
				evaluate: (profile) => {
					const totalPopulation = getTotalPopulation(profile);
					// Estimate youth as roughly 30% of population
					const estimatedYouth = totalPopulation * 0.3;

					if (estimatedYouth >= 150) {
						return {
							points: 3.0,
							reason: `Estimated ${Math.round(estimatedYouth)} youth need recreation facility`
						};
					} else if (estimatedYouth >= 75) {
						return {
							points: 2.0,
							reason: `Estimated ${Math.round(estimatedYouth)} youth in community`
						};
					} else if (estimatedYouth >= 30) {
						return {
							points: 1.0,
							reason: `Estimated ${Math.round(estimatedYouth)} youth present`
						};
					}
					return { points: 0, reason: 'Small youth population' };
				}
			},
			{
				id: 'osy_engagement',
				name: 'Out of School Youth Need Activities',
				description: 'OSY would benefit from sports programs',
				maxPoints: 2.0,
				enabled: true,
				evaluate: (profile) => {
					const osyCount = profile.vulnerableGroups.outOfSchoolYouth || 0;
					if (osyCount >= 20) {
						return {
							points: 2.0,
							reason: `${osyCount} OSY need positive activities`
						};
					} else if (osyCount >= 10) {
						return {
							points: 1.0,
							reason: `${osyCount} OSY would benefit`
						};
					}
					return { points: 0, reason: 'No significant OSY population' };
				}
			}
		]
	};

	// Add the custom project
	engine.updateProjectConfig(customProject);

	console.log('Added custom sports facility project');

	return engine.evaluateAllProjects(sitioProfile);
}

/**
 * Example 8: Comprehensive Evaluation with Detailed Output
 */
export function comprehensiveEvaluationExample(sitioProfile: SitioProfile) {
	const engine = new ProjectScoringEngine();

	const recommendations = engine.evaluateAllProjects(sitioProfile);

	const report = {
		sitioInfo: {
			name: sitioProfile.sitioName,
			barangay: sitioProfile.barangay,
			municipality: sitioProfile.municipality,
			population: sitioProfile.population.totalMale + sitioProfile.population.totalFemale,
			households: sitioProfile.totalHouseholds
		},
		summary: {
			totalProjects: recommendations.length,
			criticalProjects: recommendations.filter((r) => r.priority === 'Critical').length,
			highProjects: recommendations.filter((r) => r.priority === 'High').length,
			moderateProjects: recommendations.filter((r) => r.priority === 'Moderate').length,
			lowProjects: recommendations.filter((r) => r.priority === 'Low').length
		},
		topRecommendations: recommendations.slice(0, 5).map((rec) => ({
			project: rec.ppa.name,
			category: rec.ppa.category,
			score: rec.needScore,
			priority: rec.priority,
			keyReasons: rec.scoreBreakdown
				.filter((s) => s.pointsAwarded > 0)
				.map((s) => s.reason)
				.slice(0, 3)
		})),
		byCategory: {
			infrastructure: recommendations.filter((r) => r.ppa.category === 'Infrastructure'),
			serviceDelivery: recommendations.filter((r) => r.ppa.category === 'Service Delivery & Social')
		},
		detailedRecommendations: recommendations
	};

	return report;
}
