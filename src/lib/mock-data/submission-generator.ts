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
  defaultCount: 35,
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
    manyRevisionApproved: 0.08,
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

// Field modifications for different types of changes
const FIELD_MODIFICATIONS = {
  demographic: ['totalPopulation', 'totalHouseholds'],
  location: ['latitude', 'longitude'],
  project: ['title', 'description', 'cost']
};

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

/**
 * Generate modified data based on original data
 */
function generateModifiedData(
  original: Record<string, unknown>,
  random: SeededRandom,
  fieldCategory: keyof typeof FIELD_MODIFICATIONS
): Record<string, unknown> {
  const modified = JSON.parse(JSON.stringify(original));
  const fields = FIELD_MODIFICATIONS[fieldCategory];
  const fieldToModify = fields[random.nextInt(0, fields.length - 1)];

  // Modify a random field
  if (fieldToModify === 'totalPopulation' && modified.totalPopulation) {
    modified.totalPopulation = Math.max(50, modified.totalPopulation + random.nextInt(-100, 100));
  } else if (fieldToModify === 'totalHouseholds' && modified.totalHouseholds) {
    modified.totalHouseholds = Math.max(10, modified.totalHouseholds + random.nextInt(-20, 20));
  } else if (fieldToModify === 'latitude' && modified.latitude) {
    modified.latitude = (modified.latitude as number) + random.nextFloat(-0.005, 0.005);
  } else if (fieldToModify === 'longitude' && modified.longitude) {
    modified.longitude = (modified.longitude as number) + random.nextFloat(-0.005, 0.005);
  } else if (fieldToModify === 'title' && modified.title) {
    modified.title = `${modified.title} (Updated)`;
  } else if (fieldToModify === 'description' && modified.description) {
    modified.description = `${modified.description} - Additional information added.`;
  } else if (fieldToModify === 'cost' && modified.cost) {
    modified.cost = Math.max(10000, (modified.cost as number) + random.nextInt(-50000, 50000));
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

  // Generate original and proposed data
  const fieldCategory = Object.keys(FIELD_MODIFICATIONS)[
    random.nextInt(0, Object.keys(FIELD_MODIFICATIONS).length - 1)
  ] as keyof typeof FIELD_MODIFICATIONS;

  // Get the latest year data for sitios
  const originalData: Record<string, unknown> = isSitio
    ? (() => {
        const sitio = resource as SitioRecord;
        const latestYear = sitio.availableYears[sitio.availableYears.length - 1];
        const yearData = sitio.yearlyData[String(latestYear)];
        return {
          totalPopulation: yearData.totalPopulation,
          totalHouseholds: yearData.totalHouseholds,
          latitude: sitio.latitude,
          longitude: sitio.longitude
        };
      })()
    : {
        title: (resource as Project).title,
        description: (resource as Project).description,
        cost: (resource as Project).cost
      };

  const proposedData = generateModifiedData(originalData, random, fieldCategory);

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

  // Generate conflict details if status is conflict
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
