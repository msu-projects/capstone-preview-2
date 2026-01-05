/**
 * Submission & Review Mock Data Generator
 * Generates mock PendingChange data for testing the approval workflow
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
  defaultCount: 25,
  /** Default seed for reproducible generation */
  defaultSeed: 42,
  /** Minimum days in the past for submission date */
  minDaysAgo: 30,
  /** Maximum days in the past for submission date */
  maxDaysAgo: 1
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

const REVIEWER_NEEDS_REVISION_COMMENTS = [
  'Please update the household count field',
  'Coordinates need verification',
  'Missing required facility details',
  'Please provide more specific information about water source',
  'Enrollment numbers seem high - please double check',
  'Infrastructure description needs more detail',
  'Please separate residential and total population',
  'Add supporting documentation for poverty data',
  'Clarify the date of data collection',
  'Update the livelihood information section'
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
 * Generate revision history for a pending change
 */
function generateRevisionHistory(
  status: PendingChangeStatus,
  submitterId: number,
  submitterName: string,
  reviewerId: number | undefined,
  reviewerName: string | undefined,
  submittedAt: string,
  reviewedAt: string | undefined,
  random: SeededRandom
): RevisionHistoryEntry[] {
  const history: RevisionHistoryEntry[] = [];

  // Initial submission
  history.push({
    action: 'submitted',
    comment: SUBMITTER_COMMENTS[random.nextInt(0, SUBMITTER_COMMENTS.length - 1)],
    timestamp: submittedAt,
    userId: submitterId,
    userName: submitterName
  });

  // Add review action if reviewed
  if (reviewedAt && reviewerId && reviewerName) {
    if (status === 'approved') {
      history.push({
        action: 'approved',
        comment:
          REVIEWER_APPROVED_COMMENTS[random.nextInt(0, REVIEWER_APPROVED_COMMENTS.length - 1)],
        timestamp: reviewedAt,
        userId: reviewerId,
        userName: reviewerName
      });
    } else if (status === 'rejected') {
      history.push({
        action: 'rejected',
        comment:
          REVIEWER_REJECTED_COMMENTS[random.nextInt(0, REVIEWER_REJECTED_COMMENTS.length - 1)],
        timestamp: reviewedAt,
        userId: reviewerId,
        userName: reviewerName
      });
    } else if (status === 'needs_revision') {
      history.push({
        action: 'revision_requested',
        comment:
          REVIEWER_NEEDS_REVISION_COMMENTS[
            random.nextInt(0, REVIEWER_NEEDS_REVISION_COMMENTS.length - 1)
          ],
        timestamp: reviewedAt,
        userId: reviewerId,
        userName: reviewerName
      });
    }
  }

  // For needs_revision, sometimes add a resubmission
  if (status === 'needs_revision' && random.nextFloat(0, 1) < 0.3) {
    const resubmitDate = new Date(reviewedAt!);
    resubmitDate.setDate(resubmitDate.getDate() + random.nextInt(1, 5));
    history.push({
      action: 'resubmitted',
      comment: 'Updated based on feedback',
      timestamp: resubmitDate.toISOString(),
      userId: submitterId,
      userName: submitterName
    });
  }

  return history;
}

/**
 * Generate a single mock submission
 */
function generateSubmission(
  random: SeededRandom,
  index: number,
  sitios: SitioRecord[],
  projects: Project[],
  users: Array<{ id: number; name: string; canReview: boolean }>
): PendingChange {
  // Determine resource type (70% sitio, 30% project)
  const isSitio = random.nextFloat(0, 1) < 0.7;
  const resources = isSitio ? sitios : projects;
  const resource = resources[random.nextInt(0, resources.length - 1)];

  // Select submitter (any user)
  const submitter = users[random.nextInt(0, users.length - 1)];

  // Determine status
  const statusRoll = random.nextFloat(0, 1);
  let status: PendingChangeStatus;
  if (statusRoll < 0.3) {
    status = 'pending';
  } else if (statusRoll < 0.55) {
    status = 'approved';
  } else if (statusRoll < 0.75) {
    status = 'rejected';
  } else if (statusRoll < 0.9) {
    status = 'needs_revision';
  } else {
    status = 'conflict';
  }

  // Generate dates
  const submittedAt = generateDate(random, 1, 30);
  const isReviewed = status !== 'pending';
  const reviewedAt = isReviewed
    ? generateDate(
        random,
        0,
        Math.max(
          1,
          Math.floor((Date.now() - new Date(submittedAt).getTime()) / (24 * 60 * 60 * 1000)) - 1
        )
      )
    : undefined;

  // Select reviewer (only reviewers)
  const reviewers = users.filter((u) => u.canReview);
  const reviewer = isReviewed ? reviewers[random.nextInt(0, reviewers.length - 1)] : undefined;

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

  // Status change seen by submitter (false for recent changes)
  const statusChangeSeenBySubmitter = status === 'pending' || random.nextFloat(0, 1) < 0.7;

  // Generate revision history
  const revisionHistory = generateRevisionHistory(
    status,
    submitter.id,
    submitter.name,
    reviewer?.id,
    reviewer?.name,
    submittedAt,
    reviewedAt,
    random
  );

  // Generate conflict details if status is conflict
  const conflictDetails =
    status === 'conflict'
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

  const submission: PendingChange = {
    id: `sub_${Date.now()}_${index}_${random.nextInt(1000, 9999)}`,
    resourceType: isSitio ? 'sitio' : 'project',
    resourceId: resource.id,
    resourceName,
    status,
    originalData,
    proposedData,
    baseVersionHash,
    submittedBy: {
      userId: submitter.id,
      userName: submitter.name
    },
    submittedAt,
    reviewedBy: reviewer
      ? {
          userId: reviewer.id,
          userName: reviewer.name
        }
      : undefined,
    reviewedAt,
    submitterComment: SUBMITTER_COMMENTS[random.nextInt(0, SUBMITTER_COMMENTS.length - 1)],
    reviewerComment: reviewer
      ? status === 'approved'
        ? REVIEWER_APPROVED_COMMENTS[random.nextInt(0, REVIEWER_APPROVED_COMMENTS.length - 1)]
        : status === 'rejected'
          ? REVIEWER_REJECTED_COMMENTS[random.nextInt(0, REVIEWER_REJECTED_COMMENTS.length - 1)]
          : status === 'needs_revision'
            ? REVIEWER_NEEDS_REVISION_COMMENTS[
                random.nextInt(0, REVIEWER_NEEDS_REVISION_COMMENTS.length - 1)
              ]
            : undefined
      : undefined,
    conflictDetails,
    revisionHistory,
    statusChangeSeenBySubmitter,
    resubmitCount: status === 'needs_revision' && random.nextFloat(0, 1) < 0.3 ? 1 : 0
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
