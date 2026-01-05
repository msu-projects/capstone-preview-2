# Submission & Review Mock Data

This document describes the mock data generation system for submissions and reviews in the approval workflow.

## Overview

The submission mock data generator creates realistic pending change submissions for both sitios and projects. These submissions represent the approval workflow where field workers submit changes that require admin review.

## Features

- **Automatic Initialization**: Mock data is automatically generated when the application first runs
- **Realistic Data**: Uses SeededRandom for consistent but realistic-looking submissions
- **Various Statuses**: Generates submissions in different states:
  - `pending`: Awaiting review (30%)
  - `approved`: Reviewed and approved (25%)
  - `rejected`: Reviewed but rejected (20%)
  - `needs_revision`: Requires changes before approval (15%)
  - `conflict`: Data conflict detected (5%)
  - `superseded`: Replaced by newer submission (5%)

## Configuration

Default settings can be found in `src/lib/mock-data/submission-generator.ts`:

```typescript
export const SUBMISSION_GENERATION_CONFIG = {
  /** Number of submissions to generate */
  defaultCount: 25,
  /** Default seed for reproducible generation */
  defaultSeed: 42,
  /** Minimum days in the past for submission date */
  minDaysAgo: 30,
  /** Maximum days in the past for submission date */
  maxDaysAgo: 1
};
```

## Usage

### Automatic Initialization

The mock data is automatically initialized when you access submission-related features. The data is stored in localStorage with the key `sccdp_submissions_mock`.

### Manual Usage

```typescript
import {
  generateSubmissions,
  initializeSubmissionsIfNeeded,
  loadMockSubmissions,
  resetSubmissionsMockData,
  getSubmissionGenerationParams
} from '$lib/mock-data';

// Load existing or generate new submissions
const submissions = loadMockSubmissions();

// Generate fresh submissions with custom parameters
const customSubmissions = generateSubmissions(50, 123); // 50 submissions, seed 123

// Reset and regenerate
resetSubmissionsMockData();

// Check if initialized
import { isSubmissionsInitialized } from '$lib/mock-data';
const initialized = isSubmissionsInitialized();
```

### Integration with Pending Changes Storage

The pending changes storage automatically initializes with mock data:

```typescript
import { loadPendingChanges } from '$lib/utils/pending-changes-storage';

// Automatically loads mock data if storage is empty
const changes = loadPendingChanges();
```

## Generated Data Structure

Each submission includes:

### Basic Information

- **id**: Unique identifier
- **resourceType**: 'sitio' or 'project'
- **resourceId**: ID of the sitio or project being modified
- **resourceName**: Display name of the resource
- **status**: Current review status

### Data Snapshots

- **originalData**: Snapshot of data before changes
- **proposedData**: The submitted changes
- **baseVersionHash**: For conflict detection

### User Information

- **submittedBy**: User who submitted (userId, userName)
- **reviewedBy**: User who reviewed (if reviewed)
- **submittedAt**: ISO timestamp
- **reviewedAt**: ISO timestamp (if reviewed)

### Comments & History

- **submitterComment**: Explanation from submitter
- **reviewerComment**: Feedback from reviewer (if reviewed)
- **revisionHistory**: Full history of all actions
- **statusChangeSeenBySubmitter**: Whether user has seen status update

### Additional Fields

- **conflictDetails**: Details about conflicts (if status is 'conflict')
- **resubmitCount**: Number of times resubmitted
- **originalSubmissionId**: Link to original if resubmitted

## Types of Changes

The generator simulates changes to various field categories:

### For Sitios

- **Demographic**: totalPopulation, totalHouseholds
- **Location**: latitude, longitude

### For Projects

- **Project Info**: title, description, cost

## Mock Users

The generator uses these mock users:

1. **Super Administrator** (ID: 1) - Can review
2. **Juan Dela Cruz** (ID: 2) - Can review
3. **Maria Santos** (ID: 3) - Can review
4. **Pedro Reyes** (ID: 4) - Cannot review (viewer)
5. **Ana Garcia** (ID: 5) - Can review

## Viewing Mock Data

### My Submissions Page

Navigate to `/admin/my-submissions` to see all submissions by the current logged-in user.

Features:

- Filter by status (pending, approved, rejected, etc.)
- Filter by resource type (sitio or project)
- Search by resource name or submission ID
- View detailed changes and revision history
- See reviewer comments and feedback

### Review Queue Page

Navigate to `/admin/review-queue` (if implemented) to see all pending submissions awaiting review.

## Resetting Mock Data

To reset and regenerate mock data:

```typescript
import { resetSubmissionsMockData } from '$lib/mock-data';

// Clear existing data and generate fresh submissions
resetSubmissionsMockData();
```

Or manually clear from browser console:

```javascript
localStorage.removeItem('sccdp_submissions_mock');
localStorage.removeItem('sccdp_submissions_initialized');
localStorage.removeItem('sccdp_pending_changes');
location.reload(); // Reload to regenerate
```

## Storage Keys

The mock data system uses these localStorage keys:

- `sccdp_submissions_mock`: Stores generated mock submissions
- `sccdp_submissions_initialized`: Flag indicating mock data is initialized
- `sccdp_pending_changes`: Main pending changes storage (synced with mock data)

## Seeded Random Generation

All mock data uses SeededRandom for consistent generation:

```typescript
const random = new SeededRandom(42); // Same seed = same data
```

This ensures:

- Reproducible data for testing
- Consistent results across page reloads
- Ability to generate specific test scenarios

## Customization

To customize the generation:

1. **Modify Counts**: Change `defaultCount` in config
2. **Adjust Status Distribution**: Modify status probability in `generateSubmission()`
3. **Add New Field Types**: Add to `FIELD_MODIFICATIONS` object
4. **Custom Comments**: Add to comment arrays (SUBMITTER_COMMENTS, etc.)
5. **Change Date Range**: Adjust minDaysAgo and maxDaysAgo

## Best Practices

1. **Development**: Use mock data for UI development and testing
2. **Testing**: Use different seeds to test various scenarios
3. **Production**: Replace with actual API calls to backend
4. **Storage Limits**: Be mindful of localStorage size limits (typically 5-10MB)
5. **Version Compatibility**: Clear mock data when types change

## Integration Points

The mock data integrates with:

1. **Pending Changes Storage** (`pending-changes-storage.ts`)
2. **My Submissions Page** (`/admin/my-submissions`)
3. **Review Queue** (if implemented)
4. **Audit System** (tracks review actions)
5. **User Authentication** (filters by user)

## Future Enhancements

Potential improvements:

- Add more sophisticated conflict generation
- Generate attachments/images for submissions
- Simulate multi-step revision workflows
- Add time-based progression (older submissions have higher approval rate)
- Generate bulk submissions from import operations
- Add geospatial conflict detection
