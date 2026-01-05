<script lang="ts">
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';
  import { Textarea } from '$lib/components/ui/textarea';
  import { authStore } from '$lib/stores/auth.svelte';
  import type {
    PendingChange,
    PendingChangeResourceType,
    PendingChangeStatus,
    PendingChangeSummary
  } from '$lib/types';
  import { applyProjectChange, applySitioChange } from '$lib/utils/approval-aware-storage';
  import toTitleCase from '$lib/utils/common';
  import {
    approveChange,
    getPendingChangeById,
    rejectChange,
    resolveConflict
  } from '$lib/utils/pending-changes-storage';
  import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle,
    Clock,
    Eye,
    FileText,
    FolderKanban,
    MapPin,
    Minus,
    Plus,
    RefreshCw,
    Search,
    X,
    XCircle
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // Mock Data
  const mockPendingChanges: PendingChange[] = [
    {
      id: 'change_001',
      resourceType: 'sitio',
      resourceId: 1,
      resourceName: 'Barangay San Isidro, Sitio 1',
      status: 'pending',
      originalData: {
        totalHouseholds: 150,
        totalPopulation: 600,
        povertyRate: 35.5,
        electricityAccess: 85,
        waterAccess: 70,
        year: 2024
      },
      proposedData: {
        totalHouseholds: 155,
        totalPopulation: 620,
        povertyRate: 33.2,
        electricityAccess: 88,
        waterAccess: 75,
        year: 2024
      },
      baseVersionHash: 'hash_001',
      submittedBy: {
        userId: 2,
        userName: 'Maria Santos'
      },
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      submitterComment:
        'Updated population count after recent census. Also improved infrastructure access rates based on new electricity and water connections.'
    },
    {
      id: 'change_002',
      resourceType: 'project',
      resourceId: 5,
      resourceName: 'Community Water System Upgrade',
      status: 'pending',
      originalData: {
        status: 'ongoing',
        completionPercentage: 45,
        budget: 500000,
        actualSpent: 225000,
        beneficiaries: 300
      },
      proposedData: {
        status: 'ongoing',
        completionPercentage: 65,
        budget: 500000,
        actualSpent: 325000,
        beneficiaries: 350
      },
      baseVersionHash: 'hash_002',
      submittedBy: {
        userId: 3,
        userName: 'Juan Dela Cruz'
      },
      submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      submitterComment:
        'Project progress update. Completion increased from 45% to 65%. Additional households connected, increasing beneficiaries count.'
    },
    {
      id: 'change_003',
      resourceType: 'sitio',
      resourceId: 8,
      resourceName: 'Barangay Nueva Vista, Sitio 3',
      status: 'approved',
      originalData: {
        totalHouseholds: 200,
        totalPopulation: 850,
        povertyRate: 42.3,
        healthFacilities: 1
      },
      proposedData: {
        totalHouseholds: 200,
        totalPopulation: 850,
        povertyRate: 42.3,
        healthFacilities: 2
      },
      baseVersionHash: 'hash_003',
      submittedBy: {
        userId: 4,
        userName: 'Rosa Mercado'
      },
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      reviewedBy: {
        userId: 1,
        userName: 'Admin User'
      },
      reviewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
      submitterComment: 'New barangay health station opened last month.',
      reviewerComment: 'Verified with barangay records. Approved.'
    },
    {
      id: 'change_004',
      resourceType: 'sitio',
      resourceId: 12,
      resourceName: 'Barangay Maligaya, Sitio 2',
      status: 'conflict',
      originalData: {
        totalHouseholds: 180,
        totalPopulation: 720,
        povertyRate: 38.5,
        electricityAccess: 92
      },
      proposedData: {
        totalHouseholds: 185,
        totalPopulation: 750,
        povertyRate: 36.0,
        electricityAccess: 95
      },
      baseVersionHash: 'hash_004',
      submittedBy: {
        userId: 5,
        userName: 'Pedro Reyes'
      },
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      submitterComment: 'Updated demographic data from field survey.',
      conflictDetails: [
        {
          field: 'totalPopulation',
          currentValue: 740,
          proposedValue: 750
        },
        {
          field: 'electricityAccess',
          currentValue: 94,
          proposedValue: 95
        }
      ]
    },
    {
      id: 'change_005',
      resourceType: 'project',
      resourceId: 12,
      resourceName: 'School Building Renovation',
      status: 'rejected',
      originalData: {
        status: 'planning',
        completionPercentage: 0,
        budget: 750000,
        startDate: '2025-03-01'
      },
      proposedData: {
        status: 'ongoing',
        completionPercentage: 10,
        budget: 750000,
        startDate: '2025-02-01'
      },
      baseVersionHash: 'hash_005',
      submittedBy: {
        userId: 6,
        userName: 'Ana Lopez'
      },
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      reviewedBy: {
        userId: 1,
        userName: 'Admin User'
      },
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      submitterComment: 'Project started early, updating status and start date.',
      reviewerComment:
        'Project is still in planning phase per official records. Start date change requires council approval first.'
    },
    {
      id: 'change_006',
      resourceType: 'sitio',
      resourceId: 15,
      resourceName: 'Barangay Rizal, Sitio 5',
      status: 'pending',
      originalData: {
        totalHouseholds: 95,
        totalPopulation: 380,
        povertyRate: 48.2,
        roadAccess: 60,
        schools: 0
      },
      proposedData: {
        totalHouseholds: 95,
        totalPopulation: 380,
        povertyRate: 48.2,
        roadAccess: 60,
        schools: 1
      },
      baseVersionHash: 'hash_006',
      submittedBy: {
        userId: 2,
        userName: 'Maria Santos'
      },
      submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      submitterComment: 'New elementary school facility completed and now operational.'
    },
    {
      id: 'change_007',
      resourceType: 'project',
      resourceId: 8,
      resourceName: 'Road Infrastructure Development',
      status: 'approved',
      originalData: {
        status: 'ongoing',
        completionPercentage: 30,
        budget: 1200000,
        actualSpent: 360000,
        beneficiaries: 500
      },
      proposedData: {
        status: 'ongoing',
        completionPercentage: 55,
        budget: 1200000,
        actualSpent: 660000,
        beneficiaries: 550
      },
      baseVersionHash: 'hash_007',
      submittedBy: {
        userId: 3,
        userName: 'Juan Dela Cruz'
      },
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      reviewedBy: {
        userId: 1,
        userName: 'Admin User'
      },
      reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      submitterComment:
        'Major progress milestone achieved. Road segments in Sector A and B now completed.',
      reviewerComment: 'Progress verified with engineering team. Approved.'
    },
    {
      id: 'change_008',
      resourceType: 'sitio',
      resourceId: 22,
      resourceName: 'Barangay Esperanza, Sitio 1',
      status: 'pending',
      originalData: {
        totalHouseholds: 220,
        totalPopulation: 920,
        povertyRate: 31.5,
        waterAccess: 88,
        sanitationAccess: 75
      },
      proposedData: {
        totalHouseholds: 225,
        totalPopulation: 945,
        povertyRate: 30.1,
        waterAccess: 92,
        sanitationAccess: 82
      },
      baseVersionHash: 'hash_008',
      submittedBy: {
        userId: 4,
        userName: 'Rosa Mercado'
      },
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      submitterComment:
        'Annual demographic survey results. Improvements in water and sanitation access due to recent WASH program.'
    },
    {
      id: 'change_009',
      resourceType: 'project',
      resourceId: 15,
      resourceName: 'Livelihood Training Program',
      status: 'pending',
      originalData: {
        status: 'completed',
        completionPercentage: 100,
        budget: 150000,
        actualSpent: 142000,
        beneficiaries: 80
      },
      proposedData: {
        status: 'completed',
        completionPercentage: 100,
        budget: 150000,
        actualSpent: 148000,
        beneficiaries: 95
      },
      baseVersionHash: 'hash_009',
      submittedBy: {
        userId: 5,
        userName: 'Pedro Reyes'
      },
      submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      submitterComment:
        'Final financial reconciliation showed additional expenses. Also, 15 more participants completed the program than initially recorded.'
    },
    {
      id: 'change_010',
      resourceType: 'sitio',
      resourceId: 30,
      resourceName: 'Barangay Pag-asa, Sitio 4',
      status: 'superseded',
      originalData: {
        totalHouseholds: 175,
        totalPopulation: 700,
        povertyRate: 40.0,
        electricityAccess: 80
      },
      proposedData: {
        totalHouseholds: 180,
        totalPopulation: 720,
        povertyRate: 38.5,
        electricityAccess: 82
      },
      baseVersionHash: 'hash_010',
      submittedBy: {
        userId: 6,
        userName: 'Ana Lopez'
      },
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      submitterComment: 'Quarterly update for Q4 2024.'
    },
    {
      id: 'change_011',
      resourceType: 'sitio',
      resourceId: 7,
      resourceName: 'Barangay Tahanan, Sitio 2',
      status: 'pending',
      originalData: {
        totalHouseholds: 130,
        totalPopulation: 520,
        povertyRate: 52.3,
        healthFacilities: 0,
        schools: 1
      },
      proposedData: {
        totalHouseholds: 132,
        totalPopulation: 530,
        povertyRate: 51.8,
        healthFacilities: 1,
        schools: 1
      },
      baseVersionHash: 'hash_011',
      submittedBy: {
        userId: 2,
        userName: 'Maria Santos'
      },
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      submitterComment:
        'New rural health unit established. Minor population increase from recent count.'
    },
    {
      id: 'change_012',
      resourceType: 'project',
      resourceId: 20,
      resourceName: 'Solar Panel Installation',
      status: 'conflict',
      originalData: {
        status: 'ongoing',
        completionPercentage: 75,
        budget: 850000,
        actualSpent: 600000,
        beneficiaries: 200
      },
      proposedData: {
        status: 'ongoing',
        completionPercentage: 85,
        budget: 850000,
        actualSpent: 680000,
        beneficiaries: 220
      },
      baseVersionHash: 'hash_012',
      submittedBy: {
        userId: 3,
        userName: 'Juan Dela Cruz'
      },
      submittedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
      submitterComment: 'Installation progress update with expanded coverage.',
      conflictDetails: [
        {
          field: 'completionPercentage',
          currentValue: 80,
          proposedValue: 85
        }
      ]
    }
  ];

  // State
  let pendingChanges = $state<PendingChange[]>([]);
  let summary = $state<PendingChangeSummary>({ pending: 0, approved: 0, rejected: 0, conflict: 0 });
  let searchQuery = $state('');
  let statusFilter = $state<string>('all');
  let resourceFilter = $state<string>('all');
  let currentPage = $state(1);
  const perPage = 10;

  // Dialog state
  let selectedChange = $state<PendingChange | null>(null);
  let detailDialogOpen = $state(false);
  let reviewComment = $state('');
  let isProcessing = $state(false);

  // Computed
  const filteredChanges = $derived.by(() => {
    let filtered = pendingChanges;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (change) =>
          change.resourceName.toLowerCase().includes(query) ||
          change.submittedBy.userName.toLowerCase().includes(query) ||
          change.submitterComment?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((change) => change.status === statusFilter);
    }

    // Resource filter
    if (resourceFilter !== 'all') {
      filtered = filtered.filter((change) => change.resourceType === resourceFilter);
    }

    return filtered;
  });

  const paginatedChanges = $derived.by(() => {
    const start = (currentPage - 1) * perPage;
    return filteredChanges.slice(start, start + perPage);
  });

  const totalPages = $derived(Math.ceil(filteredChanges.length / perPage));

  // Computed for selected change dialog
  const selectedComparisonYear = $derived.by(() => {
    if (!selectedChange) return null;
    return getComparisonYear(
      selectedChange.originalData as Record<string, unknown>,
      selectedChange.proposedData as Record<string, unknown>
    );
  });

  const selectedFieldDiffs = $derived.by(() => {
    if (!selectedChange) return [];
    return getFieldDifferences(
      selectedChange.originalData as Record<string, unknown>,
      selectedChange.proposedData as Record<string, unknown>
    );
  });

  // Load data on mount
  onMount(() => {
    refreshData();
  });

  function refreshData() {
    // Use mock data instead of storage
    pendingChanges = mockPendingChanges;

    // Calculate summary from mock data
    summary = {
      pending: mockPendingChanges.filter((c) => c.status === 'pending').length,
      approved: mockPendingChanges.filter((c) => c.status === 'approved').length,
      rejected: mockPendingChanges.filter((c) => c.status === 'rejected').length,
      conflict: mockPendingChanges.filter((c) => c.status === 'conflict').length
    };

    currentPage = 1;
  }

  function getStatusBadgeVariant(
    status: PendingChangeStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'conflict':
        return 'destructive';
      case 'superseded':
        return 'outline';
      default:
        return 'outline';
    }
  }

  function getResourceIcon(resourceType: PendingChangeResourceType) {
    switch (resourceType) {
      case 'sitio':
        return MapPin;
      case 'project':
        return FolderKanban;
      default:
        return FileText;
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function openDetailDialog(change: PendingChange) {
    selectedChange = change;
    reviewComment = '';
    detailDialogOpen = true;
  }

  function closeDetailDialog() {
    selectedChange = null;
    detailDialogOpen = false;
    reviewComment = '';
  }

  function canReview(change: PendingChange): boolean {
    // User cannot review their own submission
    return authStore.currentUser?.id !== change.submittedBy.userId;
  }

  async function handleApprove() {
    if (!selectedChange) return;

    isProcessing = true;
    try {
      const result = approveChange(selectedChange.id, reviewComment || undefined);

      if (!result.success) {
        toast.error(result.error || 'Failed to approve change');
        // Refresh to get updated status (e.g., conflict detected)
        refreshData();
        // Re-fetch the selected change to update dialog
        if (selectedChange) {
          const updated = getPendingChangeById(selectedChange.id);
          if (updated) {
            selectedChange = updated;
          }
        }
        return;
      }

      // Apply the change to the actual data
      if (selectedChange.resourceType === 'sitio') {
        const success = applySitioChange(
          selectedChange.resourceId,
          selectedChange.proposedData as Record<string, unknown>
        );
        if (!success) {
          toast.error('Approved but failed to apply sitio changes');
        }
      } else if (selectedChange.resourceType === 'project') {
        const success = applyProjectChange(
          selectedChange.resourceId,
          selectedChange.proposedData as Record<string, unknown>
        );
        if (!success) {
          toast.error('Approved but failed to apply project changes');
        }
      }

      toast.success('Change approved and applied successfully');
      closeDetailDialog();
      refreshData();
    } finally {
      isProcessing = false;
    }
  }

  async function handleReject() {
    if (!selectedChange) return;

    isProcessing = true;
    try {
      const result = rejectChange(selectedChange.id, reviewComment || undefined);

      if (!result.success) {
        toast.error(result.error || 'Failed to reject change');
        return;
      }

      toast.success('Change rejected');
      closeDetailDialog();
      refreshData();
    } finally {
      isProcessing = false;
    }
  }

  async function handleResolveConflict(resolution: 'apply_proposed' | 'discard') {
    if (!selectedChange) return;

    isProcessing = true;
    try {
      const result = resolveConflict(selectedChange.id, resolution);

      if (!result.success) {
        toast.error(result.error || 'Failed to resolve conflict');
        return;
      }

      // If applying proposed, also apply the data
      if (resolution === 'apply_proposed') {
        if (selectedChange.resourceType === 'sitio') {
          applySitioChange(
            selectedChange.resourceId,
            selectedChange.proposedData as Record<string, unknown>
          );
        } else if (selectedChange.resourceType === 'project') {
          applyProjectChange(
            selectedChange.resourceId,
            selectedChange.proposedData as Record<string, unknown>
          );
        }
        toast.success('Conflict resolved: Applied proposed changes');
      } else {
        toast.success('Conflict resolved: Discarded proposed changes');
      }

      closeDetailDialog();
      refreshData();
    } finally {
      isProcessing = false;
    }
  }

  // Helper to format data for display
  function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  /**
   * Check if data contains yearlyData structure (SitioRecord with year-based data)
   */
  function hasYearlyDataStructure(data: Record<string, unknown>): boolean {
    return 'yearlyData' in data && typeof data.yearlyData === 'object' && data.yearlyData !== null;
  }

  /**
   * Extract the year being edited from proposed data
   * Returns the first year found in yearlyData, or null if none found
   */
  function extractEditedYear(proposed: Record<string, unknown>): string | null {
    if (!hasYearlyDataStructure(proposed)) return null;
    const yearlyData = proposed.yearlyData as Record<string, unknown>;
    const years = Object.keys(yearlyData).filter((key) => /^\d{4}$/.test(key));
    return years.length > 0 ? years[0] : null;
  }

  /**
   * Normalize data for comparison: extract year-specific data if applicable
   * This handles the case where original is flat SitioRecord and proposed has yearlyData
   */
  function normalizeForComparison(
    original: Record<string, unknown>,
    proposed: Record<string, unknown>
  ): {
    normalizedOriginal: Record<string, unknown>;
    normalizedProposed: Record<string, unknown>;
    year: string | null;
  } {
    const proposedHasYearly = hasYearlyDataStructure(proposed);
    const originalHasYearly = hasYearlyDataStructure(original);

    // Case: Proposed has yearlyData, original has yearlyData - compare specific year
    if (proposedHasYearly && originalHasYearly) {
      const year = extractEditedYear(proposed);
      if (year) {
        const originalYearlyData = original.yearlyData as Record<string, Record<string, unknown>>;
        const proposedYearlyData = proposed.yearlyData as Record<string, Record<string, unknown>>;

        return {
          normalizedOriginal: originalYearlyData[year] || {},
          normalizedProposed: proposedYearlyData[year] || {},
          year
        };
      }
    }

    // Case: Proposed has yearlyData but original doesn't (legacy/flat structure)
    // This means original might be the old SitioRecord format
    if (proposedHasYearly && !originalHasYearly) {
      const year = extractEditedYear(proposed);
      if (year) {
        const proposedYearlyData = proposed.yearlyData as Record<string, Record<string, unknown>>;
        // Original is flat, so use it directly for comparison with the year data
        return {
          normalizedOriginal: original,
          normalizedProposed: proposedYearlyData[year] || {},
          year
        };
      }
    }

    // Case: Neither has yearlyData or both are flat - compare directly
    return {
      normalizedOriginal: original,
      normalizedProposed: proposed,
      year: null
    };
  }

  /**
   * Deep compare two values, returning differences recursively
   */
  function deepCompareValues(
    original: unknown,
    proposed: unknown,
    path: string = ''
  ): {
    field: string;
    original: unknown;
    proposed: unknown;
    type: 'added' | 'removed' | 'modified';
  }[] {
    const differences: {
      field: string;
      original: unknown;
      proposed: unknown;
      type: 'added' | 'removed' | 'modified';
    }[] = [];

    // If both are objects (but not arrays or null), compare their keys
    if (
      original !== null &&
      proposed !== null &&
      typeof original === 'object' &&
      typeof proposed === 'object' &&
      !Array.isArray(original) &&
      !Array.isArray(proposed)
    ) {
      const originalObj = original as Record<string, unknown>;
      const proposedObj = proposed as Record<string, unknown>;
      const allKeys = new Set([...Object.keys(originalObj), ...Object.keys(proposedObj)]);

      for (const key of allKeys) {
        const fieldPath = path ? `${path}.${key}` : key;

        if (!(key in originalObj)) {
          differences.push({
            field: fieldPath,
            original: undefined,
            proposed: proposedObj[key],
            type: 'added'
          });
        } else if (!(key in proposedObj)) {
          differences.push({
            field: fieldPath,
            original: originalObj[key],
            proposed: undefined,
            type: 'removed'
          });
        } else if (JSON.stringify(originalObj[key]) !== JSON.stringify(proposedObj[key])) {
          // If nested objects, recursively compare
          if (
            typeof originalObj[key] === 'object' &&
            typeof proposedObj[key] === 'object' &&
            originalObj[key] !== null &&
            proposedObj[key] !== null &&
            !Array.isArray(originalObj[key]) &&
            !Array.isArray(proposedObj[key])
          ) {
            differences.push(...deepCompareValues(originalObj[key], proposedObj[key], fieldPath));
          } else {
            differences.push({
              field: fieldPath,
              original: originalObj[key],
              proposed: proposedObj[key],
              type: 'modified'
            });
          }
        }
      }

      return differences;
    }

    // Direct value comparison for primitives and arrays
    if (JSON.stringify(original) !== JSON.stringify(proposed)) {
      differences.push({
        field: path || 'value',
        original,
        proposed,
        type: original === undefined ? 'added' : proposed === undefined ? 'removed' : 'modified'
      });
    }

    return differences;
  }

  // Fields to exclude from comparison (metadata fields)
  const excludedFields = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'availableYears',
    'yearlyData',
    'coding'
  ]);

  /**
   * Compute field-level differences between original and proposed data
   * Handles yearlyData structure intelligently
   */
  function getFieldDifferences(
    original: Record<string, unknown>,
    proposed: Record<string, unknown>
  ): {
    field: string;
    original: unknown;
    proposed: unknown;
    type: 'added' | 'removed' | 'modified';
    year?: string;
  }[] {
    const { normalizedOriginal, normalizedProposed, year } = normalizeForComparison(
      original,
      proposed
    );

    const differences = deepCompareValues(normalizedOriginal, normalizedProposed);

    // Filter out excluded fields and add year info
    return differences
      .filter((diff) => {
        const topLevelField = diff.field.split('.')[0];
        return !excludedFields.has(topLevelField);
      })
      .map((diff) => ({
        ...diff,
        year: year || undefined
      }));
  }

  // Get the year being compared (for display purposes)
  function getComparisonYear(
    original: Record<string, unknown>,
    proposed: Record<string, unknown>
  ): string | null {
    const { year } = normalizeForComparison(original, proposed);
    return year;
  }

  // Format field name for display
  function formatFieldName(field: string): string {
    return field
      .split('.')
      .map((part) =>
        part
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
          .trim()
      )
      .join(' → ');
  }
</script>

<svelte:head>
  <title>Review Queue - South Cotabato Data Bank</title>
</svelte:head>

{#if !authStore.canReview}
  <div class="flex min-h-screen flex-col items-center justify-center bg-muted/30">
    <Card.Root class="w-full max-w-md">
      <Card.Content class="pt-6">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle class="h-8 w-8 text-red-600" />
          </div>
          <h2 class="text-xl font-semibold">Access Denied</h2>
          <p class="text-muted-foreground">
            You do not have permission to access the review queue. Please contact an administrator
            if you believe this is an error.
          </p>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
{:else}
  <div class="flex min-h-screen flex-col bg-muted/30">
    <!-- Header -->
    <AdminHeader
      title="Review Queue"
      description="Review and approve pending data changes"
      breadcrumbs={[{ label: 'Review Queue' }]}
    >
      {#snippet actions()}
        <Button variant="outline" onclick={refreshData} size="sm">
          <RefreshCw class="size-4 sm:mr-2" />
          <span class="hidden sm:inline">Refresh</span>
        </Button>
      {/snippet}
    </AdminHeader>

    <!-- Content -->
    <div class="flex-1 space-y-6 p-6">
      <!-- Stats Cards -->
      <div class="grid gap-4 md:grid-cols-4">
        <Card.Root>
          <Card.Content class="">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <Clock class="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Pending</p>
                <p class="text-2xl font-bold">{summary.pending}</p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Content class="">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle class="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Conflicts</p>
                <p class="text-2xl font-bold">{summary.conflict}</p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Content class="">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle class="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Approved</p>
                <p class="text-2xl font-bold">{summary.approved}</p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Content class="">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <XCircle class="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Rejected</p>
                <p class="text-2xl font-bold">{summary.rejected}</p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Filters -->
      <Card.Root>
        <Card.Content class="">
          <div class="flex flex-col gap-4 md:flex-row md:items-center">
            <div class="relative flex-1">
              <Search
                class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input placeholder="Search changes..." bind:value={searchQuery} class="pl-10" />
            </div>
            <div class="flex flex-wrap gap-2">
              <Select.Root type="single" bind:value={statusFilter}>
                <Select.Trigger class="w-32.5">
                  {statusFilter === 'all' ? 'All Status' : toTitleCase(statusFilter)}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Status</Select.Item>
                  <Select.Item value="pending">Pending</Select.Item>
                  <Select.Item value="conflict">Conflict</Select.Item>
                  <Select.Item value="approved">Approved</Select.Item>
                  <Select.Item value="rejected">Rejected</Select.Item>
                </Select.Content>
              </Select.Root>
              <Select.Root type="single" bind:value={resourceFilter}>
                <Select.Trigger class="w-32.5">
                  {resourceFilter === 'all' ? 'All Resources' : toTitleCase(resourceFilter)}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Resources</Select.Item>
                  <Select.Item value="sitio">Sitio</Select.Item>
                  <Select.Item value="project">Project</Select.Item>
                </Select.Content>
              </Select.Root>
              <Button variant="outline" size="icon" onclick={refreshData}>
                <RefreshCw class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Changes Table -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <FileText class="h-5 w-5" />
            Pending Changes ({filteredChanges.length} entries)
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-40">Submitted</Table.Head>
                <Table.Head>Resource</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Submitter</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head class="w-24">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each paginatedChanges as change (change.id)}
                {@const ResourceIcon = getResourceIcon(change.resourceType)}
                <Table.Row class="transition-colors hover:bg-muted/50">
                  <Table.Cell class="text-sm text-muted-foreground">
                    <div class="flex items-center gap-2">
                      <Clock class="h-4 w-4" />
                      {formatTimestamp(change.submittedAt)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div class="flex items-center gap-2">
                      <ResourceIcon class="h-4 w-4 text-muted-foreground" />
                      <span class="font-medium">{change.resourceName}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline">
                      {toTitleCase(change.resourceType)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span class="text-sm">{change.submittedBy.userName}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={getStatusBadgeVariant(change.status)}>
                      {#if change.status === 'conflict'}
                        <AlertTriangle class="mr-1 h-3 w-3" />
                      {:else if change.status === 'pending'}
                        <Clock class="mr-1 h-3 w-3" />
                      {:else if change.status === 'approved'}
                        <Check class="mr-1 h-3 w-3" />
                      {:else if change.status === 'rejected'}
                        <X class="mr-1 h-3 w-3" />
                      {/if}
                      {toTitleCase(change.status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Button variant="ghost" size="icon" onclick={() => openDetailDialog(change)}>
                      <Eye class="h-4 w-4" />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {:else}
                <Table.Row>
                  <Table.Cell colspan={6} class="py-8 text-center text-muted-foreground">
                    {#if pendingChanges.length === 0}
                      No pending changes. Changes submitted for review will appear here.
                    {:else}
                      No changes match your filters.
                    {/if}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>

          <!-- Pagination -->
          {#if totalPages > 1}
            <div class="mt-4 flex items-center justify-between">
              <p class="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * perPage + 1} to {Math.min(
                  currentPage * perPage,
                  filteredChanges.length
                )} of {filteredChanges.length} entries
              </p>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onclick={() => (currentPage = currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onclick={() => (currentPage = currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  </div>

  <!-- Detail Dialog -->
  <Dialog.Root bind:open={detailDialogOpen}>
    <Dialog.Content class="max-h-[90vh] max-w-3xl! overflow-y-auto">
      {#if selectedChange}
        <Dialog.Header>
          <Dialog.Title class="flex items-center gap-2">
            {@const ResourceIcon = getResourceIcon(selectedChange.resourceType)}
            <ResourceIcon class="h-5 w-5" />
            {selectedChange.resourceName}
          </Dialog.Title>
          <Dialog.Description>Review the proposed changes below</Dialog.Description>
        </Dialog.Header>

        <div class="space-y-4">
          <!-- Change Info -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-muted-foreground">Resource Type</p>
              <p class="font-medium">{toTitleCase(selectedChange.resourceType)}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Status</p>
              <Badge variant={getStatusBadgeVariant(selectedChange.status)}>
                {toTitleCase(selectedChange.status)}
              </Badge>
            </div>
            <div>
              <p class="text-muted-foreground">Submitted By</p>
              <p class="font-medium">{selectedChange.submittedBy.userName}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Submitted At</p>
              <p class="font-medium">{formatTimestamp(selectedChange.submittedAt)}</p>
            </div>
          </div>

          <!-- Submitter Comment -->
          {#if selectedChange.submitterComment}
            <div class="rounded-lg border bg-muted/50 p-3">
              <p class="mb-1 text-sm font-medium">Submitter Comment</p>
              <p class="text-sm text-muted-foreground">{selectedChange.submitterComment}</p>
            </div>
          {/if}

          <!-- Conflict Warning -->
          {#if selectedChange.status === 'conflict'}
            <div
              class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
            >
              <AlertTriangle class="h-5 w-5 text-red-600" />
              <div class="flex-1">
                <p class="font-medium text-red-800 dark:text-red-200">Conflict Detected</p>
                <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                  The resource has been modified since this change was submitted. You must resolve
                  this conflict before the change can be applied.
                </p>
                <div class="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onclick={() => handleResolveConflict('apply_proposed')}
                    disabled={isProcessing}
                  >
                    <Check class="mr-1 h-4 w-4" />
                    Apply Proposed Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onclick={() => handleResolveConflict('discard')}
                    disabled={isProcessing}
                  >
                    <X class="mr-1 h-4 w-4" />
                    Discard Changes
                  </Button>
                </div>
              </div>
            </div>
          {/if}

          <!-- Diff View -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium">Changes Overview</p>
                {#if selectedComparisonYear}
                  <Badge variant="secondary" class="text-xs">
                    Year {selectedComparisonYear}
                  </Badge>
                {/if}
              </div>
              <Badge variant="outline" class="text-xs">
                {selectedFieldDiffs.length} field(s) changed
              </Badge>
            </div>

            <!-- Field-by-Field Comparison -->
            <div class="space-y-3 rounded-lg border bg-card p-4">
              {#each selectedFieldDiffs as diff}
                <div
                  class="rounded-lg border transition-colors hover:bg-muted/50 {diff.type ===
                  'added'
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                    : diff.type === 'removed'
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                      : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'}"
                >
                  <div class="p-3">
                    <!-- Field Header -->
                    <div class="mb-2 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        {#if diff.type === 'added'}
                          <div
                            class="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          >
                            <Plus class="h-3 w-3" />
                            Added
                          </div>
                        {:else if diff.type === 'removed'}
                          <div
                            class="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300"
                          >
                            <Minus class="h-3 w-3" />
                            Removed
                          </div>
                        {:else}
                          <div
                            class="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                          >
                            <ArrowRight class="h-3 w-3" />
                            Modified
                          </div>
                        {/if}
                        <span class="text-sm font-semibold">{formatFieldName(diff.field)}</span>
                      </div>
                    </div>

                    <!-- Value Comparison -->
                    <div class="grid gap-3 md:grid-cols-2">
                      {#if diff.type !== 'added'}
                        <div class="space-y-1">
                          <p class="text-xs font-medium text-muted-foreground">Original Value</p>
                          <div
                            class="rounded-md bg-background/80 p-2 text-sm shadow-sm ring-1 ring-gray-200 ring-inset dark:ring-gray-800"
                          >
                            {#if typeof diff.original === 'object'}
                              <pre class="overflow-x-auto text-xs">{JSON.stringify(
                                  diff.original,
                                  null,
                                  2
                                )}</pre>
                            {:else}
                              <span class="wrap-break-word">{formatValue(diff.original)}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      {#if diff.type !== 'removed'}
                        <div class="space-y-1" class:md:col-span-2={diff.type === 'added'}>
                          <p class="text-xs font-medium text-muted-foreground">
                            {diff.type === 'added' ? 'New Value' : 'Proposed Value'}
                          </p>
                          <div
                            class="rounded-md bg-background/80 p-2 text-sm font-medium shadow-sm ring-1 ring-inset {diff.type ===
                            'added'
                              ? 'ring-green-300 dark:ring-green-800'
                              : 'ring-orange-300 dark:ring-orange-800'}"
                          >
                            {#if typeof diff.proposed === 'object'}
                              <pre class="overflow-x-auto text-xs">{JSON.stringify(
                                  diff.proposed,
                                  null,
                                  2
                                )}</pre>
                            {:else}
                              <span class="wrap-break-word">{formatValue(diff.proposed)}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {:else}
                <div class="py-8 text-center text-sm text-muted-foreground">
                  No changes detected
                </div>
              {/each}
            </div>

            <!-- Raw JSON Toggle (Collapsed by default) -->
            <details class="group">
              <summary
                class="cursor-pointer rounded-lg border bg-muted/30 p-3 text-sm font-medium hover:bg-muted/50"
              >
                <span class="flex items-center gap-2">
                  <span>View Raw JSON Data</span>
                  <Badge variant="outline" class="text-xs">Advanced</Badge>
                </span>
              </summary>
              <div class="mt-2 grid gap-4 md:grid-cols-2">
                <div>
                  <p class="mb-1 text-xs font-medium text-muted-foreground">Original Data</p>
                  <pre
                    class="max-h-60 overflow-auto rounded-lg border bg-muted p-3 text-xs">{JSON.stringify(
                      selectedChange.originalData,
                      null,
                      2
                    )}</pre>
                </div>
                <div>
                  <p class="mb-1 text-xs font-medium text-muted-foreground">Proposed Data</p>
                  <pre
                    class="max-h-60 overflow-auto rounded-lg border bg-muted p-3 text-xs">{JSON.stringify(
                      selectedChange.proposedData,
                      null,
                      2
                    )}</pre>
                </div>
              </div>
            </details>
          </div>

          <!-- Already Reviewed Info -->
          {#if selectedChange.reviewedBy}
            <div class="rounded-lg border bg-muted/50 p-3">
              <p class="mb-1 text-sm font-medium">Reviewed By</p>
              <p class="text-sm text-muted-foreground">
                {selectedChange.reviewedBy.userName} on {formatTimestamp(
                  selectedChange.reviewedAt || ''
                )}
              </p>
              {#if selectedChange.reviewerComment}
                <p class="mt-2 text-sm text-muted-foreground">
                  <span class="font-medium">Comment:</span>
                  {selectedChange.reviewerComment}
                </p>
              {/if}
            </div>
          {:else if selectedChange.status === 'pending'}
            <!-- Review Actions -->
            {#if !canReview(selectedChange)}
              <div
                class="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950"
              >
                <AlertTriangle class="h-5 w-5 text-yellow-600" />
                <p class="text-sm text-yellow-800 dark:text-yellow-200">
                  You cannot review your own submission. Another reviewer must approve or reject
                  this change.
                </p>
              </div>
            {:else}
              <div class="space-y-3">
                <div>
                  <label for="review-comment" class="mb-1 block text-sm font-medium">
                    Review Comment (Optional)
                  </label>
                  <Textarea
                    id="review-comment"
                    bind:value={reviewComment}
                    placeholder="Add a comment about your decision..."
                    rows={3}
                  />
                </div>
                <div class="flex justify-end gap-2">
                  <Button variant="destructive" onclick={handleReject} disabled={isProcessing}>
                    <X class="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button variant="default" onclick={handleApprove} disabled={isProcessing}>
                    <Check class="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            {/if}
          {/if}
        </div>

        <Dialog.Footer>
          <Button variant="outline" onclick={closeDetailDialog}>Close</Button>
        </Dialog.Footer>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
{/if}
