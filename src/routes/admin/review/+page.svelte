<script lang="ts">
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Collapsible from '$lib/components/ui/collapsible';
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
    getPendingChanges,
    getPendingChangeSummary,
    rejectChange,
    requestRevisionChange,
    resolveConflict
  } from '$lib/utils/pending-changes-storage';
  import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle,
    ChevronDown,
    Clock,
    Edit,
    Eye,
    FileText,
    FolderKanban,
    History,
    MapPin,
    Minus,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    X,
    XCircle
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // State
  let pendingChanges = $state<PendingChange[]>([]);
  let summary = $state<PendingChangeSummary>({
    pending: 0,
    approved: 0,
    rejected: 0,
    conflict: 0,
    needsRevision: 0,
    superseded: 0
  });
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
  let reviewAction = $state<'approve' | 'reject' | 'revision'>('approve');
  let changesOverviewOpen = $state(false);
  let rawJsonOpen = $state(false);

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
    // Load from real storage
    pendingChanges = getPendingChanges();
    summary = getPendingChangeSummary();
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
      case 'needs_revision':
        return 'outline';
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

  async function handleRequestRevision() {
    if (!selectedChange) return;

    if (!reviewComment || reviewComment.trim() === '') {
      toast.error('Comment is required when requesting revision');
      return;
    }

    isProcessing = true;
    try {
      const result = requestRevisionChange(selectedChange.id, reviewComment);

      if (!result.success) {
        toast.error(result.error || 'Failed to request revision');
        return;
      }

      toast.success('Revision requested. The submitter will be notified.');
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

  // Format revision action for display
  function formatRevisionAction(action: string): string {
    switch (action) {
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'revision_requested':
        return 'Revision Requested';
      case 'resubmitted':
        return 'Resubmitted';
      default:
        return toTitleCase(action);
    }
  }

  // Get icon for revision action
  function getRevisionActionIcon(action: string) {
    switch (action) {
      case 'submitted':
        return FileText;
      case 'approved':
        return Check;
      case 'rejected':
        return X;
      case 'revision_requested':
        return Edit;
      case 'resubmitted':
        return RotateCcw;
      default:
        return Clock;
    }
  }

  // Get color class for revision action
  function getRevisionActionColor(action: string): string {
    switch (action) {
      case 'submitted':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300';
      case 'approved':
        return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300';
      case 'rejected':
        return 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300';
      case 'revision_requested':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300';
      case 'resubmitted':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/50 dark:text-gray-300';
    }
  }

  // Check if a change has been resubmitted
  function hasBeenResubmitted(change: PendingChange): boolean {
    return (change.resubmitCount || 0) > 0;
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
    <AdminHeader title="Review Queue" description="Review and approve pending data changes">
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
      <div class="grid gap-4 md:grid-cols-5">
        <Card.Root>
          <Card.Content class="">
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50"
              >
                <Clock class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50"
              >
                <Edit class="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Needs Revision</p>
                <p class="text-2xl font-bold">{summary.needsRevision}</p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Content class="">
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50"
              >
                <AlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
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
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50"
              >
                <CheckCircle class="h-6 w-6 text-green-600 dark:text-green-400" />
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
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              >
                <XCircle class="h-6 w-6 text-gray-600 dark:text-gray-400" />
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
                <Select.Trigger class="w-36">
                  {statusFilter === 'all'
                    ? 'All Status'
                    : statusFilter === 'needs_revision'
                      ? 'Needs Revision'
                      : toTitleCase(statusFilter)}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Status</Select.Item>
                  <Select.Item value="pending">Pending</Select.Item>
                  <Select.Item value="needs_revision">Needs Revision</Select.Item>
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
                      {#if hasBeenResubmitted(change)}
                        <Badge variant="secondary" class="text-xs">
                          <RotateCcw class="mr-1 h-3 w-3" />
                          Resubmitted
                        </Badge>
                      {/if}
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
                      {:else if change.status === 'needs_revision'}
                        <Edit class="mr-1 h-3 w-3" />
                      {/if}
                      {change.status === 'needs_revision'
                        ? 'Needs Revision'
                        : toTitleCase(change.status)}
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
            <Collapsible.Root bind:open={changesOverviewOpen}>
              <Collapsible.Trigger class="w-full">
                <div
                  class="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div class="flex items-center gap-2">
                    <ChevronDown
                      class="h-4 w-4 transition-transform {changesOverviewOpen ? 'rotate-180' : ''}"
                    />
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
              </Collapsible.Trigger>

              <Collapsible.Content>
                <!-- Field-by-Field Comparison -->
                <div class="mt-3 space-y-3 rounded-lg border bg-card p-4">
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
                              <p class="text-xs font-medium text-muted-foreground">
                                Original Value
                              </p>
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
              </Collapsible.Content>
            </Collapsible.Root>

            <!-- Raw JSON Toggle (Collapsed by default) -->
            <Collapsible.Root bind:open={rawJsonOpen}>
              <Collapsible.Trigger class="w-full">
                <div
                  class="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div class="flex items-center gap-2">
                    <ChevronDown
                      class="h-4 w-4 transition-transform {rawJsonOpen ? 'rotate-180' : ''}"
                    />
                    <span class="text-sm font-medium">View Raw JSON Data</span>
                    <Badge variant="outline" class="text-xs">Advanced</Badge>
                  </div>
                </div>
              </Collapsible.Trigger>

              <Collapsible.Content>
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
              </Collapsible.Content>
            </Collapsible.Root>
          </div>

          <!-- Revision History -->
          {#if selectedChange.revisionHistory && selectedChange.revisionHistory.length > 0}
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <History class="h-4 w-4 text-muted-foreground" />
                <p class="text-sm font-medium">Revision History</p>
              </div>
              <div class="relative ml-2 border-l-2 border-muted pl-4">
                {#each selectedChange.revisionHistory as entry, index}
                  {@const ActionIcon = getRevisionActionIcon(entry.action)}
                  <div class="relative pb-4 last:pb-0">
                    <div
                      class="absolute -left-5.5 flex h-6 w-6 items-center justify-center rounded-full {getRevisionActionColor(
                        entry.action
                      )}"
                    >
                      <ActionIcon class="h-3 w-3" />
                    </div>
                    <div class="ml-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm font-medium">{formatRevisionAction(entry.action)}</span
                        >
                        <span class="text-xs text-muted-foreground">by {entry.userName}</span>
                        <span class="text-xs text-muted-foreground">•</span>
                        <span class="text-xs text-muted-foreground"
                          >{formatTimestamp(entry.timestamp)}</span
                        >
                      </div>
                      {#if entry.comment}
                        <p class="mt-1 text-sm text-muted-foreground">{entry.comment}</p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Already Reviewed Info -->
          {#if selectedChange.reviewedBy && selectedChange.status !== 'pending'}
            <div class="rounded-lg border bg-muted/50 p-3">
              <p class="mb-1 text-sm font-medium">Last Reviewed By</p>
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
          {/if}

          <!-- Review Actions for Pending Changes -->
          {#if selectedChange.status === 'pending'}
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
              <div class="space-y-4">
                <div>
                  <label for="review-comment" class="mb-1 block text-sm font-medium">
                    Review Comment
                    <span class="text-muted-foreground">(required for Reject/Request Revision)</span
                    >
                  </label>
                  <Textarea
                    id="review-comment"
                    bind:value={reviewComment}
                    placeholder="Add a comment about your decision..."
                    rows={3}
                  />
                </div>
                <div class="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="destructive"
                    onclick={handleReject}
                    disabled={isProcessing || !reviewComment.trim()}
                  >
                    <X class="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onclick={handleRequestRevision}
                    disabled={isProcessing || !reviewComment.trim()}
                    class="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                  >
                    <Edit class="mr-1 h-4 w-4" />
                    Request Revision
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
