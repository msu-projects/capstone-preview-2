/**
 * Submission & Review Mock Data Generator
 * Generates mock PendingChange data for testing the approval workflow
 *
 * This generator creates comprehensive mock data including:
 * - Simple submissions (pending, approved, rejected)
 * - Multi-round revision cycles (needs_revision → resubmit → approve/reject)
 * - Conflict scenarios
 * - Various revision counts (1-5+ resubmissions before final decision)
 */

import type { PendingChange, PendingChangeStatus, RevisionHistoryEntry } from '$lib/types';
import type { Project } from '$lib/types/project';
import type { SitioRecord } from '$lib/types/sitio-storage';
import { loadProjects } from '$lib/utils/project-storage';
import { loadSitios } from '$lib/utils/storage';
import { SeededRandom } from './seeded-random';

// ===== SUBMISSION GENERATION CONFIGURATION =====

export const SUBMISSION_GENERATION_CONFIG = {
  /** Number of submissions to generate */
  defaultCount: 40,
  /** Default seed for reproducible generation */
  defaultSeed: 42,
  /** Minimum days in the past for submission date */
  minDaysAgo: 60,
  /** Maximum days in the past for submission date */
  maxDaysAgo: 1,
  /** Probability distribution for different submission scenarios */
  scenarioWeights: {
    /** Simple pending - no review yet */
    simplePending: 0.15,
    /** Quick approval - approved on first submission */
    quickApproval: 0.15,
    /** Quick rejection - rejected on first submission */
    quickRejection: 0.08,
    /** Single revision then approved */
    singleRevisionApproved: 0.12,
    /** Single revision then rejected */
    singleRevisionRejected: 0.05,
    /** Multiple revisions (2-3) then approved */
    multiRevisionApproved: 0.15,
    /** Multiple revisions (2-3) then rejected */
    multiRevisionRejected: 0.05,
    /** Many revisions (4-5) finally approved - edge case */
    manyRevisionApproved: 0.1,
    /** Currently in revision cycle - needs_revision status */
    currentlyNeedsRevision: 0.1,
    /** Conflict scenario */
    conflict: 0.07
  }
} as const;

// ===== MOCK DATA =====

const SUBMITTER_COMMENTS = [
  'Updated demographic data based on recent census',
  'Corrected infrastructure information after field visit',
  'Added new facility information',
  'Updated household count after verification',
  'Fixed incorrect coordinates',
  'Updated water system status',
  'Added newly constructed road',
  'Updated poverty data from DSWD',
  'Corrected barangay boundary information',
  'Added new livelihood programs',
  'Updated health facility status',
  'Corrected enrollment numbers',
  'Updated housing conditions data',
  'Added new community facilities',
  'Updated hazard vulnerability information'
];

const REVIEWER_APPROVED_COMMENTS = [
  'Data verified and approved',
  'Changes validated against source documents',
  'Field verification completed - approved',
  'Information cross-checked with municipal records',
  'Approved after consultation with barangay officials',
  'Data matches current conditions',
  'Verified through site visit',
  'Coordinates validated using GPS',
  'Statistics confirmed with official census',
  'Approved pending next review cycle'
];

const REVIEWER_REJECTED_COMMENTS = [
  'Data does not match official records',
  'Please provide source documentation',
  'Coordinates appear incorrect - please verify',
  'Numbers inconsistent with previous reports',
  'Missing required supporting documents',
  'Information conflicts with DSWD records',
  'Please clarify the data source',
  'Household count exceeds reasonable limits',
  'Cannot verify without proper documentation',
  'Requires approval from barangay captain first'
];

/** Progression of revision request comments (for multi-round revisions) */
const REVISION_ROUND_COMMENTS = [
  // Round 1 - Initial issues
  [
    'Initial review: Several data points need verification. Please check household count and population figures.',
    'First review: Please provide source documentation for the updated statistics.',
    'Initial feedback: The coordinates appear to be outside the expected barangay boundaries.',
    'First pass: Need clarification on the facility status - is this active or proposed?',
    "Preliminary review: Population numbers don't align with previous census data. Please verify."
  ],
  // Round 2 - Follow-up issues
  [
    'Second review: Household count still inconsistent. Please cross-reference with barangay records.',
    "Follow-up: Documentation provided but dates don't match. Need current year data.",
    'Second pass: Coordinates corrected but population figure still needs adjustment.',
    'Review round 2: Facility status clarified, but please add capacity information.',
    'Follow-up review: Better, but we need the actual date when this data was collected.'
  ],
  // Round 3 - Minor remaining issues
  [
    'Third review: Almost there! Just need to verify the final household count with barangay captain.',
    'Round 3: Please double-check one more discrepancy in the youth population count.',
    'Third pass: Minor formatting issue - please use the standard date format.',
    'Review round 3: One more verification needed - please confirm water source type.',
    'Third review: Please add the missing contact information for the facility.'
  ],
  // Round 4 - Edge cases
  [
    'Fourth review: We found one additional inconsistency. Please verify senior citizen count.',
    'Round 4: Almost approved, but the infrastructure type needs one small correction.',
    'Fourth pass: Final check - please confirm the road length measurement.',
    'Review round 4: One last item - please verify the livelihood program beneficiary count.',
    'Fourth review: Need final confirmation from the barangay before approval.'
  ],
  // Round 5 - Final cleanup
  [
    "Fifth review: This is the last item - please add the barangay captain's signature date.",
    'Final review: Just need official confirmation number from the municipal office.',
    'Round 5: Last correction needed - please update the submission date field.',
    'Fifth pass: Final verification - please confirm all data is from 2024 census.',
    'Last review: One typographical correction needed in the facility name.'
  ]
];

/** Comments for resubmissions addressing reviewer feedback */
const RESUBMISSION_COMMENTS = [
  // Round 1 responses
  [
    'Updated household count based on recent barangay census records.',
    'Attached source documentation from municipal planning office.',
    'Corrected coordinates after GPS verification visit.',
    'Clarified facility status - this is an existing active facility.',
    'Verified population with latest census data, corrected discrepancy.'
  ],
  // Round 2 responses
  [
    'Cross-referenced with barangay records - household count now verified.',
    'Obtained current year documentation from DSWD office.',
    'Adjusted population figure based on reviewer feedback.',
    'Added facility capacity information as requested.',
    'Added data collection date: field survey conducted last month.'
  ],
  // Round 3 responses
  [
    'Verified with barangay captain - final count confirmed.',
    'Corrected youth population count after double-checking.',
    'Changed to standard date format as requested.',
    'Confirmed water source type: Level 2 - communal faucet.',
    'Added facility contact information.'
  ],
  // Round 4 responses
  [
    'Senior citizen count verified and corrected.',
    'Infrastructure type correction applied.',
    'Road length confirmed via Google Maps measurement.',
    'Livelihood beneficiary count verified with DOLE records.',
    'Obtained barangay confirmation letter, attached to submission.'
  ],
  // Round 5 responses
  [
    'Added signature date as requested.',
    'Added official confirmation number: MCO-2024-0892.',
    'Submission date field updated.',
    'Confirmed all data from 2024 census as required.',
    'Corrected typographical error in facility name.'
  ]
];

/**
 * Categories of sitio fields that can be modified
 * Each category contains fields that are typically updated together
 */
const SITIO_FIELD_CATEGORIES = {
  population: [
    'totalPopulation',
    'totalHouseholds',
    'registeredVoters',
    'laborForceCount',
    'schoolAgeChildren',
    'population.totalMale',
    'population.totalFemale'
  ],
  vulnerableGroups: [
    'vulnerableGroups.muslimCount',
    'vulnerableGroups.ipCount',
    'vulnerableGroups.seniorsCount',
    'vulnerableGroups.laborForce60to64Count',
    'vulnerableGroups.unemployedCount',
    'vulnerableGroups.noBirthCertCount',
    'vulnerableGroups.noNationalIDCount',
    'vulnerableGroups.outOfSchoolYouth'
  ],
  utilities: [
    'householdsWithToilet',
    'householdsWithElectricity',
    'householdsWithInternet',
    'electricitySources.grid',
    'electricitySources.solar',
    'electricitySources.battery',
    'electricitySources.generator',
    'mobileSignal'
  ],
  facilities: [
    'facilities.healthCenter',
    'facilities.pharmacy',
    'facilities.communityToilet',
    'facilities.kindergarten',
    'facilities.elementarySchool',
    'facilities.highSchool',
    'facilities.madrasah',
    'facilities.market'
  ],
  infrastructure: [
    'infrastructure.asphalt',
    'infrastructure.concrete',
    'infrastructure.gravel',
    'infrastructure.natural'
  ],
  water: [
    'waterSources.natural',
    'waterSources.level1',
    'waterSources.level2',
    'waterSources.level3',
    'sanitationTypes.waterSealed',
    'sanitationTypes.pitLatrine',
    'sanitationTypes.communityCR',
    'sanitationTypes.openDefecation'
  ],
  livelihood: [
    'workerClass.privateHousehold',
    'workerClass.privateEstablishment',
    'workerClass.government',
    'workerClass.selfEmployed',
    'workerClass.employer',
    'workerClass.ofw',
    'averageDailyIncome',
    'agriculture.numberOfFarmers',
    'agriculture.numberOfAssociations',
    'agriculture.estimatedFarmAreaHectares'
  ],
  pets: [
    'pets.catsCount',
    'pets.dogsCount',
    'pets.vaccinatedCats',
    'pets.vaccinatedDogs',
    'backyardGardens.householdsWithGardens'
  ],
  hazards: [
    'hazards.flood.frequency',
    'hazards.landslide.frequency',
    'hazards.drought.frequency',
    'hazards.earthquake.frequency',
    'foodSecurity'
  ]
} as const;

// ===== HELPER FUNCTIONS =====

/**
 * Generate a random date within a range
 */
function generateDate(random: SeededRandom, minDaysAgo: number, maxDaysAgo: number): string {
  const now = Date.now();
  const daysAgo = random.nextInt(minDaysAgo, maxDaysAgo);
  const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(timestamp).toISOString();
}

/**
 * Add hours to a date string
 */
function addHoursToDate(dateStr: string, hours: number): string {
  const date = new Date(dateStr);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

/**
 * Pick a submission scenario based on weights
 */
function pickScenario(
  random: SeededRandom
): keyof typeof SUBMISSION_GENERATION_CONFIG.scenarioWeights {
  const roll = random.nextFloat(0, 1);
  let cumulative = 0;
  const weights = SUBMISSION_GENERATION_CONFIG.scenarioWeights;

  for (const [scenario, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) {
      return scenario as keyof typeof weights;
    }
  }

  return 'simplePending';
}

/**
 * Determine final status and revision count based on scenario
 */
function getScenarioDetails(
  scenario: keyof typeof SUBMISSION_GENERATION_CONFIG.scenarioWeights,
  random: SeededRandom
): {
  status: PendingChangeStatus;
  revisionCount: number;
  isComplete: boolean;
} {
  switch (scenario) {
    case 'simplePending':
      return { status: 'pending', revisionCount: 0, isComplete: false };

    case 'quickApproval':
      return { status: 'approved', revisionCount: 0, isComplete: true };

    case 'quickRejection':
      return { status: 'rejected', revisionCount: 0, isComplete: true };

    case 'singleRevisionApproved':
      return { status: 'approved', revisionCount: 1, isComplete: true };

    case 'singleRevisionRejected':
      return { status: 'rejected', revisionCount: 1, isComplete: true };

    case 'multiRevisionApproved':
      return { status: 'approved', revisionCount: random.nextInt(2, 3), isComplete: true };

    case 'multiRevisionRejected':
      return { status: 'rejected', revisionCount: random.nextInt(2, 3), isComplete: true };

    case 'manyRevisionApproved':
      return { status: 'approved', revisionCount: random.nextInt(4, 5), isComplete: true };

    case 'currentlyNeedsRevision':
      // Currently awaiting resubmission after 1-3 revision requests
      return { status: 'needs_revision', revisionCount: random.nextInt(1, 3), isComplete: false };

    case 'conflict':
      return { status: 'conflict', revisionCount: random.nextInt(0, 2), isComplete: false };

    default:
      return { status: 'pending', revisionCount: 0, isComplete: false };
  }
}

// ===== COMPREHENSIVE DATA EXTRACTION & MODIFICATION =====

/**
 * Extract comprehensive sitio data for submission comparison
 * Includes all major sections from SitioProfile that are meaningful for changes
 */
function extractComprehensiveSitioData(
  sitio: SitioRecord,
  random: SeededRandom
): Record<string, unknown> {
  const latestYear = sitio.availableYears[sitio.availableYears.length - 1];
  const yearData = sitio.yearlyData[String(latestYear)];

  return {
    // Section A - Basic Information
    latitude: sitio.latitude,
    longitude: sitio.longitude,
    sitioClassification: { ...sitio.sitioClassification },
    mainAccess: yearData.mainAccess
      ? { ...yearData.mainAccess }
      : {
          pavedRoad: random.nextFloat(0, 1) < 0.3,
          unpavedRoad: random.nextFloat(0, 1) < 0.5,
          footpath: random.nextFloat(0, 1) < 0.4,
          boat: random.nextFloat(0, 1) < 0.1
        },

    // Section B - Population & Demographics
    totalPopulation: yearData.totalPopulation,
    totalHouseholds: yearData.totalHouseholds,
    registeredVoters: yearData.registeredVoters || Math.floor(yearData.totalPopulation * 0.55),
    laborForceCount: yearData.laborForceCount || Math.floor(yearData.totalPopulation * 0.45),
    schoolAgeChildren: yearData.schoolAgeChildren || Math.floor(yearData.totalPopulation * 0.25),
    population: yearData.population
      ? { ...yearData.population }
      : {
          totalMale: Math.floor(yearData.totalPopulation * 0.49),
          totalFemale: Math.floor(yearData.totalPopulation * 0.51)
        },
    vulnerableGroups: yearData.vulnerableGroups
      ? { ...yearData.vulnerableGroups }
      : {
          muslimCount: random.nextInt(0, 50),
          ipCount: random.nextInt(0, 100),
          seniorsCount: random.nextInt(10, 80),
          laborForce60to64Count: random.nextInt(5, 30),
          unemployedCount: random.nextInt(10, 100),
          noBirthCertCount: random.nextInt(0, 20),
          noNationalIDCount: random.nextInt(5, 50),
          outOfSchoolYouth: random.nextInt(0, 30)
        },

    // Section C - Utilities & Connectivity
    householdsWithToilet:
      yearData.householdsWithToilet || Math.floor(yearData.totalHouseholds * 0.75),
    householdsWithElectricity:
      yearData.householdsWithElectricity || Math.floor(yearData.totalHouseholds * 0.65),
    householdsWithInternet:
      yearData.householdsWithInternet || Math.floor(yearData.totalHouseholds * 0.25),
    electricitySources: yearData.electricitySources
      ? { ...yearData.electricitySources }
      : {
          grid: Math.floor(yearData.totalHouseholds * 0.5),
          solar: random.nextInt(0, 20),
          battery: random.nextInt(0, 15),
          generator: random.nextInt(0, 10)
        },
    mobileSignal: yearData.mobileSignal || ['none', '2g', '3g', '4g'][random.nextInt(0, 3)],

    // Section D - Facilities
    facilities: yearData.facilities
      ? { ...yearData.facilities }
      : {
          healthCenter: { exists: 'no' as const, distanceToNearest: random.nextFloat(1, 5) },
          pharmacy: { exists: 'no' as const, distanceToNearest: random.nextFloat(2, 8) },
          communityToilet: {
            exists: random.nextFloat(0, 1) < 0.4 ? ('yes' as const) : ('no' as const),
            count: random.nextInt(1, 3)
          },
          kindergarten: {
            exists: random.nextFloat(0, 1) < 0.5 ? ('yes' as const) : ('no' as const),
            count: 1
          },
          elementarySchool: {
            exists: random.nextFloat(0, 1) < 0.6 ? ('yes' as const) : ('no' as const),
            count: 1
          },
          highSchool: { exists: 'no' as const, distanceToNearest: random.nextFloat(2, 10) },
          madrasah: { exists: 'no' as const, distanceToNearest: random.nextFloat(3, 15) },
          market: { exists: 'no' as const, distanceToNearest: random.nextFloat(2, 8) }
        },

    // Section E - Infrastructure
    infrastructure: yearData.infrastructure
      ? { ...yearData.infrastructure }
      : {
          asphalt: { exists: 'no' as const },
          concrete: {
            exists: random.nextFloat(0, 1) < 0.3 ? ('yes' as const) : ('no' as const),
            length: random.nextFloat(0.1, 2)
          },
          gravel: {
            exists: 'yes' as const,
            length: random.nextFloat(0.5, 3),
            condition: random.nextInt(2, 4) as 1 | 2 | 3 | 4 | 5
          },
          natural: {
            exists: 'yes' as const,
            length: random.nextFloat(1, 5),
            condition: random.nextInt(1, 3) as 1 | 2 | 3 | 4 | 5
          }
        },

    // Section F - Education
    studentsPerRoom:
      yearData.studentsPerRoom ||
      ['less_than_46', '46_50', '51_55', 'more_than_56'][random.nextInt(0, 3)],

    // Section G - Water & Sanitation
    waterSources: yearData.waterSources
      ? { ...yearData.waterSources }
      : {
          natural: {
            exists: 'yes' as const,
            functioningCount: random.nextInt(1, 3),
            notFunctioningCount: random.nextInt(0, 2)
          },
          level1: {
            exists: random.nextFloat(0, 1) < 0.6 ? ('yes' as const) : ('no' as const),
            functioningCount: random.nextInt(0, 2)
          },
          level2: {
            exists: random.nextFloat(0, 1) < 0.3 ? ('yes' as const) : ('no' as const),
            functioningCount: random.nextInt(0, 2)
          },
          level3: { exists: 'no' as const }
        },
    sanitationTypes: yearData.sanitationTypes
      ? { ...yearData.sanitationTypes }
      : {
          waterSealed: random.nextFloat(0, 1) < 0.5,
          pitLatrine: random.nextFloat(0, 1) < 0.4,
          communityCR: random.nextFloat(0, 1) < 0.2,
          openDefecation: random.nextFloat(0, 1) < 0.15
        },

    // Section H - Livelihood & Agriculture
    workerClass: yearData.workerClass
      ? { ...yearData.workerClass }
      : {
          privateHousehold: random.nextInt(5, 30),
          privateEstablishment: random.nextInt(10, 80),
          government: random.nextInt(5, 40),
          selfEmployed: random.nextInt(20, 100),
          employer: random.nextInt(2, 15),
          ofw: random.nextInt(0, 20)
        },
    averageDailyIncome: yearData.averageDailyIncome || random.nextInt(150, 500),
    agriculture: yearData.agriculture
      ? { ...yearData.agriculture }
      : {
          numberOfFarmers: random.nextInt(20, 150),
          numberOfAssociations: random.nextInt(0, 5),
          estimatedFarmAreaHectares: random.nextFloat(10, 200)
        },

    // Pets & Gardens
    pets: yearData.pets
      ? { ...yearData.pets }
      : {
          catsCount: random.nextInt(20, 100),
          dogsCount: random.nextInt(30, 150),
          vaccinatedCats: random.nextInt(5, 50),
          vaccinatedDogs: random.nextInt(10, 80)
        },
    backyardGardens: yearData.backyardGardens
      ? { ...yearData.backyardGardens }
      : {
          householdsWithGardens: random.nextInt(10, Math.floor(yearData.totalHouseholds * 0.6)),
          commonCrops: ['Vegetables', 'Root Crops']
        },

    // Section I - Safety & Risk
    hazards: yearData.hazards
      ? { ...yearData.hazards }
      : {
          flood: { frequency: random.nextInt(0, 4) },
          landslide: { frequency: random.nextInt(0, 2) },
          drought: { frequency: random.nextInt(0, 2) },
          earthquake: { frequency: random.nextInt(0, 1) }
        },
    foodSecurity:
      yearData.foodSecurity ||
      ['secure', 'seasonal_scarcity', 'critical_shortage'][random.nextInt(0, 2)]
  };
}

/**
 * Extract comprehensive project data for submission comparison
 */
function extractComprehensiveProjectData(project: Project): Record<string, unknown> {
  return {
    title: project.title,
    description: project.description,
    cost: project.cost,
    location: { ...project.location },
    projectDate: project.projectDate,
    sitioIds: [...project.sitioIds]
  };
}

/**
 * Generate modified sitio data with multiple field changes
 * @param numChanges Number of field categories to modify (2-5 for rich changes)
 */
function generateModifiedSitioData(
  original: Record<string, unknown>,
  random: SeededRandom,
  numChanges: number = 3
): Record<string, unknown> {
  const modified = JSON.parse(JSON.stringify(original));

  // Select random categories to modify
  const categoryKeys = Object.keys(SITIO_FIELD_CATEGORIES) as Array<
    keyof typeof SITIO_FIELD_CATEGORIES
  >;
  const shuffled = categoryKeys.sort(() => random.nextFloat(-1, 1));
  const categoriesToModify = shuffled.slice(0, Math.min(numChanges, categoryKeys.length));

  for (const category of categoriesToModify) {
    switch (category) {
      case 'population':
        // Modify population-related fields
        if (modified.totalPopulation) {
          const change = random.nextInt(-150, 200);
          modified.totalPopulation = Math.max(50, (modified.totalPopulation as number) + change);
        }
        if (modified.totalHouseholds) {
          modified.totalHouseholds = Math.max(
            10,
            (modified.totalHouseholds as number) + random.nextInt(-30, 50)
          );
        }
        if (modified.registeredVoters) {
          modified.registeredVoters = Math.max(
            0,
            (modified.registeredVoters as number) + random.nextInt(-50, 100)
          );
        }
        if (modified.laborForceCount) {
          modified.laborForceCount = Math.max(
            0,
            (modified.laborForceCount as number) + random.nextInt(-30, 60)
          );
        }
        if (modified.schoolAgeChildren) {
          modified.schoolAgeChildren = Math.max(
            0,
            (modified.schoolAgeChildren as number) + random.nextInt(-20, 40)
          );
        }
        if (modified.population && typeof modified.population === 'object') {
          const pop = modified.population as Record<string, number>;
          pop.totalMale = Math.max(0, pop.totalMale + random.nextInt(-50, 80));
          pop.totalFemale = Math.max(0, pop.totalFemale + random.nextInt(-50, 80));
        }
        break;

      case 'vulnerableGroups':
        if (modified.vulnerableGroups && typeof modified.vulnerableGroups === 'object') {
          const vg = modified.vulnerableGroups as Record<string, number>;
          vg.seniorsCount = Math.max(0, vg.seniorsCount + random.nextInt(-10, 20));
          vg.unemployedCount = Math.max(0, vg.unemployedCount + random.nextInt(-20, 30));
          vg.outOfSchoolYouth = Math.max(0, vg.outOfSchoolYouth + random.nextInt(-5, 15));
          vg.noBirthCertCount = Math.max(0, vg.noBirthCertCount + random.nextInt(-5, 10));
          vg.noNationalIDCount = Math.max(0, vg.noNationalIDCount + random.nextInt(-10, 20));
        }
        break;

      case 'utilities':
        if (modified.householdsWithToilet) {
          modified.householdsWithToilet = Math.max(
            0,
            (modified.householdsWithToilet as number) + random.nextInt(-10, 30)
          );
        }
        if (modified.householdsWithElectricity) {
          modified.householdsWithElectricity = Math.max(
            0,
            (modified.householdsWithElectricity as number) + random.nextInt(-5, 25)
          );
        }
        if (modified.householdsWithInternet) {
          modified.householdsWithInternet = Math.max(
            0,
            (modified.householdsWithInternet as number) + random.nextInt(-5, 20)
          );
        }
        if (modified.electricitySources && typeof modified.electricitySources === 'object') {
          const es = modified.electricitySources as Record<string, number>;
          es.grid = Math.max(0, es.grid + random.nextInt(-5, 15));
          es.solar = Math.max(0, es.solar + random.nextInt(0, 10));
        }
        // Possibly upgrade mobile signal
        {
          const signals = ['none', '2g', '3g', '4g', '5g'];
          const currentIdx = signals.indexOf(modified.mobileSignal as string);
          if (currentIdx < signals.length - 1 && random.nextFloat(0, 1) < 0.4) {
            modified.mobileSignal = signals[currentIdx + 1];
          }
        }
        break;

      case 'facilities':
        if (modified.facilities && typeof modified.facilities === 'object') {
          const fac = modified.facilities as Record<string, Record<string, unknown>>;
          // Update a few facility statuses
          if (fac.communityToilet && random.nextFloat(0, 1) < 0.5) {
            fac.communityToilet = {
              exists: 'yes',
              count: ((fac.communityToilet.count as number) || 0) + random.nextInt(0, 2),
              condition: random.nextInt(2, 5) as 1 | 2 | 3 | 4 | 5
            };
          }
          if (fac.healthCenter && random.nextFloat(0, 1) < 0.3) {
            fac.healthCenter = {
              exists: 'yes',
              count: 1,
              condition: random.nextInt(3, 5) as 1 | 2 | 3 | 4 | 5
            };
          }
          if (fac.elementarySchool && fac.elementarySchool.exists === 'yes') {
            fac.elementarySchool.condition = Math.min(
              5,
              ((fac.elementarySchool.condition as number) || 3) + random.nextInt(0, 1)
            ) as 1 | 2 | 3 | 4 | 5;
          }
        }
        break;

      case 'infrastructure':
        if (modified.infrastructure && typeof modified.infrastructure === 'object') {
          const infra = modified.infrastructure as Record<string, Record<string, unknown>>;
          // Update road conditions and lengths
          if (infra.concrete) {
            if (infra.concrete.exists === 'no' && random.nextFloat(0, 1) < 0.4) {
              infra.concrete = {
                exists: 'yes',
                length: random.nextFloat(0.2, 1.5),
                condition: random.nextInt(3, 5) as 1 | 2 | 3 | 4 | 5
              };
            } else if (infra.concrete.exists === 'yes') {
              infra.concrete.length = Math.max(
                0.1,
                (infra.concrete.length as number) + random.nextFloat(0, 0.5)
              );
              infra.concrete.condition = Math.min(
                5,
                ((infra.concrete.condition as number) || 3) + random.nextInt(0, 1)
              ) as 1 | 2 | 3 | 4 | 5;
            }
          }
          if (infra.gravel && infra.gravel.exists === 'yes') {
            infra.gravel.length = Math.max(
              0.1,
              (infra.gravel.length as number) + random.nextFloat(-0.3, 0.8)
            );
            infra.gravel.condition = Math.max(
              1,
              Math.min(5, ((infra.gravel.condition as number) || 2) + random.nextInt(-1, 1))
            ) as 1 | 2 | 3 | 4 | 5;
          }
        }
        break;

      case 'water':
        if (modified.waterSources && typeof modified.waterSources === 'object') {
          const ws = modified.waterSources as Record<string, Record<string, unknown>>;
          // Improve water sources
          if (ws.level1 && ws.level1.exists === 'no' && random.nextFloat(0, 1) < 0.4) {
            ws.level1 = {
              exists: 'yes',
              functioningCount: random.nextInt(1, 3),
              notFunctioningCount: 0
            };
          }
          if (ws.level2 && ws.level2.exists === 'no' && random.nextFloat(0, 1) < 0.3) {
            ws.level2 = {
              exists: 'yes',
              functioningCount: random.nextInt(1, 2),
              notFunctioningCount: 0
            };
          }
          if (ws.natural && ws.natural.exists === 'yes') {
            ws.natural.functioningCount = Math.max(
              0,
              (ws.natural.functioningCount as number) + random.nextInt(-1, 2)
            );
          }
        }
        if (modified.sanitationTypes && typeof modified.sanitationTypes === 'object') {
          const st = modified.sanitationTypes as Record<string, boolean>;
          // Improve sanitation - reduce open defecation, increase water sealed
          if (st.openDefecation && random.nextFloat(0, 1) < 0.5) {
            st.openDefecation = false;
          }
          if (!st.waterSealed && random.nextFloat(0, 1) < 0.4) {
            st.waterSealed = true;
          }
        }
        break;

      case 'livelihood':
        if (modified.workerClass && typeof modified.workerClass === 'object') {
          const wc = modified.workerClass as Record<string, number>;
          wc.selfEmployed = Math.max(0, wc.selfEmployed + random.nextInt(-10, 25));
          wc.government = Math.max(0, wc.government + random.nextInt(-5, 15));
          wc.ofw = Math.max(0, wc.ofw + random.nextInt(-2, 8));
        }
        if (modified.averageDailyIncome) {
          modified.averageDailyIncome = Math.max(
            100,
            (modified.averageDailyIncome as number) + random.nextInt(-50, 100)
          );
        }
        if (modified.agriculture && typeof modified.agriculture === 'object') {
          const ag = modified.agriculture as Record<string, number>;
          ag.numberOfFarmers = Math.max(0, ag.numberOfFarmers + random.nextInt(-15, 30));
          ag.numberOfAssociations = Math.max(0, ag.numberOfAssociations + random.nextInt(0, 2));
          ag.estimatedFarmAreaHectares = Math.max(
            0,
            ag.estimatedFarmAreaHectares + random.nextFloat(-10, 20)
          );
        }
        break;

      case 'pets':
        if (modified.pets && typeof modified.pets === 'object') {
          const p = modified.pets as Record<string, number>;
          p.catsCount = Math.max(0, p.catsCount + random.nextInt(-10, 20));
          p.dogsCount = Math.max(0, p.dogsCount + random.nextInt(-15, 30));
          p.vaccinatedCats = Math.min(
            p.catsCount,
            Math.max(0, p.vaccinatedCats + random.nextInt(0, 15))
          );
          p.vaccinatedDogs = Math.min(
            p.dogsCount,
            Math.max(0, p.vaccinatedDogs + random.nextInt(0, 20))
          );
        }
        if (modified.backyardGardens && typeof modified.backyardGardens === 'object') {
          const bg = modified.backyardGardens as Record<string, unknown>;
          bg.householdsWithGardens = Math.max(
            0,
            (bg.householdsWithGardens as number) + random.nextInt(-5, 15)
          );
        }
        break;

      case 'hazards':
        if (modified.hazards && typeof modified.hazards === 'object') {
          const h = modified.hazards as Record<string, Record<string, number>>;
          // Update hazard frequencies based on recent events
          if (h.flood) h.flood.frequency = Math.max(0, h.flood.frequency + random.nextInt(-1, 2));
          if (h.landslide)
            h.landslide.frequency = Math.max(0, h.landslide.frequency + random.nextInt(-1, 1));
          if (h.drought)
            h.drought.frequency = Math.max(0, h.drought.frequency + random.nextInt(-1, 1));
        }
        // Potentially update food security status
        {
          const foodStatuses = ['secure', 'seasonal_scarcity', 'critical_shortage'];
          const currentFoodIdx = foodStatuses.indexOf(modified.foodSecurity as string);
          if (random.nextFloat(0, 1) < 0.3) {
            const newIdx = Math.max(0, Math.min(2, currentFoodIdx + random.nextInt(-1, 1)));
            modified.foodSecurity = foodStatuses[newIdx];
          }
        }
        break;
    }
  }

  return modified;
}

/**
 * Generate modified project data with multiple field changes
 */
function generateModifiedProjectData(
  original: Record<string, unknown>,
  random: SeededRandom
): Record<string, unknown> {
  const modified = JSON.parse(JSON.stringify(original));

  // Always modify cost
  if (modified.cost) {
    modified.cost = Math.max(10000, (modified.cost as number) + random.nextInt(-100000, 200000));
  }

  // Possibly update title
  if (modified.title && random.nextFloat(0, 1) < 0.5) {
    const titleUpdates = ['(Updated)', '(Revised)', '(Phase 2)', '(Extended)'];
    modified.title = `${modified.title} ${titleUpdates[random.nextInt(0, titleUpdates.length - 1)]}`;
  }

  // Possibly update description
  if (modified.description && random.nextFloat(0, 1) < 0.6) {
    const descUpdates = [
      ' - Additional scope added per community request.',
      ' - Updated based on recent site assessment.',
      ' - Modified timeline and deliverables.',
      ' - Expanded beneficiary coverage.'
    ];
    modified.description = `${modified.description}${descUpdates[random.nextInt(0, descUpdates.length - 1)]}`;
  }

  // Possibly update location slightly
  if (modified.location && random.nextFloat(0, 1) < 0.3) {
    const loc = modified.location as Record<string, number>;
    loc.latitude = loc.latitude + random.nextFloat(-0.002, 0.002);
    loc.longitude = loc.longitude + random.nextFloat(-0.002, 0.002);
  }

  return modified;
}

/**
 * Generate comprehensive revision history for multi-round review scenarios
 */
function generateRevisionHistory(
  scenarioDetails: { status: PendingChangeStatus; revisionCount: number; isComplete: boolean },
  submitterId: number,
  submitterName: string,
  reviewerId: number,
  reviewerName: string,
  submittedAt: string,
  random: SeededRandom
): { history: RevisionHistoryEntry[]; finalReviewedAt: string | undefined } {
  const history: RevisionHistoryEntry[] = [];
  let currentDate = submittedAt;
  const { status, revisionCount, isComplete } = scenarioDetails;

  // Initial submission
  history.push({
    action: 'submitted',
    comment: SUBMITTER_COMMENTS[random.nextInt(0, SUBMITTER_COMMENTS.length - 1)],
    timestamp: currentDate,
    userId: submitterId,
    userName: submitterName
  });

  // Generate revision rounds
  for (let round = 0; round < revisionCount; round++) {
    // Reviewer requests revision
    currentDate = addHoursToDate(currentDate, random.nextInt(4, 72));
    const roundComments =
      REVISION_ROUND_COMMENTS[Math.min(round, REVISION_ROUND_COMMENTS.length - 1)];
    history.push({
      action: 'revision_requested',
      comment: roundComments[random.nextInt(0, roundComments.length - 1)],
      timestamp: currentDate,
      userId: reviewerId,
      userName: reviewerName
    });

    // Submitter resubmits (unless this is the current state and incomplete)
    const isLastRound = round === revisionCount - 1;
    const shouldResubmit = !isLastRound || (isLastRound && status !== 'needs_revision');

    if (shouldResubmit) {
      currentDate = addHoursToDate(currentDate, random.nextInt(12, 96));
      const resubmitComments =
        RESUBMISSION_COMMENTS[Math.min(round, RESUBMISSION_COMMENTS.length - 1)];
      history.push({
        action: 'resubmitted',
        comment: resubmitComments[random.nextInt(0, resubmitComments.length - 1)],
        timestamp: currentDate,
        userId: submitterId,
        userName: submitterName
      });
    }
  }

  // Add final decision if complete
  let finalReviewedAt: string | undefined;
  if (isComplete && (status === 'approved' || status === 'rejected')) {
    currentDate = addHoursToDate(currentDate, random.nextInt(4, 48));
    finalReviewedAt = currentDate;

    if (status === 'approved') {
      history.push({
        action: 'approved',
        comment:
          revisionCount > 0
            ? `After ${revisionCount} revision${revisionCount > 1 ? 's' : ''}, all issues resolved. ${REVIEWER_APPROVED_COMMENTS[random.nextInt(0, REVIEWER_APPROVED_COMMENTS.length - 1)]}`
            : REVIEWER_APPROVED_COMMENTS[random.nextInt(0, REVIEWER_APPROVED_COMMENTS.length - 1)],
        timestamp: currentDate,
        userId: reviewerId,
        userName: reviewerName
      });
    } else if (status === 'rejected') {
      history.push({
        action: 'rejected',
        comment:
          revisionCount > 0
            ? `After ${revisionCount} revision attempt${revisionCount > 1 ? 's' : ''}, fundamental issues remain. ${REVIEWER_REJECTED_COMMENTS[random.nextInt(0, REVIEWER_REJECTED_COMMENTS.length - 1)]}`
            : REVIEWER_REJECTED_COMMENTS[random.nextInt(0, REVIEWER_REJECTED_COMMENTS.length - 1)],
        timestamp: currentDate,
        userId: reviewerId,
        userName: reviewerName
      });
    }
  } else if (status === 'needs_revision') {
    // Still awaiting resubmission - the last action was revision_requested
    finalReviewedAt = currentDate;
  } else if (status === 'conflict') {
    // Conflict detected during review
    currentDate = addHoursToDate(currentDate, random.nextInt(2, 24));
    finalReviewedAt = currentDate;
  }

  return { history, finalReviewedAt };
}

/**
 * Generate a single mock submission with scenario-based approach
 */
function generateSubmission(
  random: SeededRandom,
  index: number,
  sitios: SitioRecord[],
  projects: Project[],
  users: Array<{ id: number; name: string; canReview: boolean }>
): PendingChange {
  // Pick a scenario based on weighted distribution
  const scenario = pickScenario(random);
  const scenarioDetails = getScenarioDetails(scenario, random);

  // Determine resource type (70% sitio, 30% project)
  const isSitio = random.nextFloat(0, 1) < 0.7;
  const resources = isSitio ? sitios : projects;
  const resource = resources[random.nextInt(0, resources.length - 1)];

  // Select submitter (any user)
  const submitter = users[random.nextInt(0, users.length - 1)];

  // Select reviewer (only reviewers)
  const reviewers = users.filter((u) => u.canReview);
  const reviewer = reviewers[random.nextInt(0, reviewers.length - 1)];

  // Generate dates - use wider range for multi-revision scenarios
  const daysAgoMultiplier = Math.max(1, scenarioDetails.revisionCount);
  const submittedAt = generateDate(random, 5 * daysAgoMultiplier, 10 + 10 * daysAgoMultiplier);

  // Generate comprehensive original and proposed data
  // Number of field categories to modify (more changes = richer diff display)
  const numChanges = random.nextInt(2, 5);

  const originalData: Record<string, unknown> = isSitio
    ? extractComprehensiveSitioData(resource as SitioRecord, random)
    : extractComprehensiveProjectData(resource as Project);

  const proposedData = isSitio
    ? generateModifiedSitioData(originalData, random, numChanges)
    : generateModifiedProjectData(originalData, random);

  // Generate base version hash (simple hash for mock)
  const baseVersionHash = `hash_${resource.id}_${new Date(submittedAt).getTime()}`;

  // Generate comprehensive revision history
  const { history: revisionHistory, finalReviewedAt } = generateRevisionHistory(
    scenarioDetails,
    submitter.id,
    submitter.name,
    reviewer.id,
    reviewer.name,
    submittedAt,
    random
  );

  // Determine reviewed info
  const isReviewed = scenarioDetails.status !== 'pending';
  const reviewedAt = isReviewed ? finalReviewedAt : undefined;

  // Status change seen by submitter (newer statuses may be unseen)
  const statusChangeSeenBySubmitter =
    scenarioDetails.status === 'pending' ||
    scenarioDetails.status === 'approved' ||
    random.nextFloat(0, 1) < 0.6;

  // Generate conflict details if status is conflict (show multiple conflicts for richer data)
  const conflictDetails =
    scenarioDetails.status === 'conflict'
      ? [
          {
            field: 'totalPopulation',
            currentValue:
              typeof originalData.totalPopulation === 'number'
                ? (originalData.totalPopulation as number) + random.nextInt(-50, 50)
                : 0,
            proposedValue: proposedData.totalPopulation
          },
          {
            field: 'totalHouseholds',
            currentValue:
              typeof originalData.totalHouseholds === 'number'
                ? (originalData.totalHouseholds as number) + random.nextInt(-10, 10)
                : 0,
            proposedValue: proposedData.totalHouseholds
          },
          {
            field: 'householdsWithElectricity',
            currentValue:
              typeof originalData.householdsWithElectricity === 'number'
                ? (originalData.householdsWithElectricity as number) + random.nextInt(-5, 5)
                : 0,
            proposedValue: proposedData.householdsWithElectricity
          }
        ]
      : undefined;

  // Generate resource name
  const resourceName = isSitio
    ? (() => {
        const sitio = resource as SitioRecord;
        return `${sitio.sitioName}, ${sitio.barangay}, ${sitio.municipality}`;
      })()
    : (resource as Project).title;

  // Generate appropriate reviewer comment based on status and revision count
  let reviewerComment: string | undefined;
  if (isReviewed) {
    const { status, revisionCount } = scenarioDetails;
    if (status === 'approved') {
      const baseComment =
        REVIEWER_APPROVED_COMMENTS[random.nextInt(0, REVIEWER_APPROVED_COMMENTS.length - 1)];
      reviewerComment =
        revisionCount > 0
          ? `After ${revisionCount} revision${revisionCount > 1 ? 's' : ''}: ${baseComment}`
          : baseComment;
    } else if (status === 'rejected') {
      const baseComment =
        REVIEWER_REJECTED_COMMENTS[random.nextInt(0, REVIEWER_REJECTED_COMMENTS.length - 1)];
      reviewerComment =
        revisionCount > 0
          ? `After ${revisionCount} revision attempt${revisionCount > 1 ? 's' : ''}: ${baseComment}`
          : baseComment;
    } else if (status === 'needs_revision') {
      const roundComments =
        REVISION_ROUND_COMMENTS[Math.min(revisionCount - 1, REVISION_ROUND_COMMENTS.length - 1)];
      reviewerComment = roundComments[random.nextInt(0, roundComments.length - 1)];
    } else if (status === 'conflict') {
      reviewerComment =
        'Data conflict detected - another change was applied while this was pending review.';
    }
  }

  const submission: PendingChange = {
    id: `sub_${Date.now()}_${index}_${random.nextInt(1000, 9999)}`,
    resourceType: isSitio ? 'sitio' : 'project',
    resourceId: resource.id,
    resourceName,
    status: scenarioDetails.status,
    originalData,
    proposedData,
    baseVersionHash,
    submittedBy: {
      userId: submitter.id,
      userName: submitter.name
    },
    submittedAt,
    reviewedBy: isReviewed
      ? {
          userId: reviewer.id,
          userName: reviewer.name
        }
      : undefined,
    reviewedAt,
    submitterComment: SUBMITTER_COMMENTS[random.nextInt(0, SUBMITTER_COMMENTS.length - 1)],
    reviewerComment,
    conflictDetails,
    revisionHistory,
    statusChangeSeenBySubmitter,
    resubmitCount: scenarioDetails.revisionCount
  };

  return submission;
}

/**
 * Generate multiple mock submissions
 */
export function generateSubmissions(
  count: number,
  seed: number = SUBMISSION_GENERATION_CONFIG.defaultSeed
): PendingChange[] {
  const random = new SeededRandom(seed);
  const submissions: PendingChange[] = [];

  // Load resources
  const sitios = loadSitios();
  const projects = loadProjects();

  if (sitios.length === 0 && projects.length === 0) {
    console.warn('No sitios or projects available for generating submissions');
    return [];
  }

  // Mock users with review permissions
  const users = [
    { id: 1, name: 'Super Administrator', canReview: true },
    { id: 2, name: 'Juan Dela Cruz', canReview: true },
    { id: 3, name: 'Maria Santos', canReview: true },
    { id: 4, name: 'Pedro Reyes', canReview: false },
    { id: 5, name: 'Ana Garcia', canReview: true }
  ];

  // Generate submissions
  for (let i = 0; i < count; i++) {
    submissions.push(generateSubmission(random, i, sitios, projects, users));
  }

  return submissions;
}

/**
 * Get submission generation parameters with optional overrides
 */
export function getSubmissionGenerationParams(overrides?: { count?: number; seed?: number }) {
  return {
    count: overrides?.count ?? SUBMISSION_GENERATION_CONFIG.defaultCount,
    seed: overrides?.seed ?? SUBMISSION_GENERATION_CONFIG.defaultSeed
  };
}

// ===== STORAGE INTEGRATION =====

const SUBMISSIONS_STORAGE_KEY = 'sccdp_submissions_mock';
const SUBMISSIONS_INITIALIZED_KEY = 'sccdp_submissions_initialized';

/**
 * Check if submissions mock data is initialized
 */
export function isSubmissionsInitialized(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SUBMISSIONS_INITIALIZED_KEY) === 'true';
}

/**
 * Initialize submissions mock data if needed
 */
export function initializeSubmissionsIfNeeded(): PendingChange[] {
  if (typeof window === 'undefined') {
    // Generate fresh data for SSR
    const params = getSubmissionGenerationParams();
    return generateSubmissions(params.count, params.seed);
  }

  if (isSubmissionsInitialized()) {
    // Load existing data
    try {
      const json = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (json) {
        return JSON.parse(json);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  }

  // Generate and save new data
  const params = getSubmissionGenerationParams();
  const submissions = generateSubmissions(params.count, params.seed);

  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    localStorage.setItem(SUBMISSIONS_INITIALIZED_KEY, 'true');
  } catch (error) {
    console.error('Failed to save submissions:', error);
  }

  return submissions;
}

/**
 * Reset submissions mock data
 */
export function resetSubmissionsMockData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SUBMISSIONS_STORAGE_KEY);
  localStorage.removeItem(SUBMISSIONS_INITIALIZED_KEY);

  // Reinitialize
  initializeSubmissionsIfNeeded();
}

/**
 * Load submissions from storage
 */
export function loadMockSubmissions(): PendingChange[] {
  return initializeSubmissionsIfNeeded();
}
