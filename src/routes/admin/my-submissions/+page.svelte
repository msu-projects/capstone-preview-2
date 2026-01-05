<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';
  import { Textarea } from '$lib/components/ui/textarea';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { PendingChange, PendingChangeStatus } from '$lib/types';
  import toTitleCase from '$lib/utils/common';
  import {
    getPendingChanges,
    getUnreadStatusChanges,
    markAllStatusChangesAsSeen,
    markStatusChangeAsSeen,
    updatePendingSubmission,
    withdrawSubmission
  } from '$lib/utils/pending-changes-storage';
  import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle,
    Clock,
    Edit,
    Eye,
    FileText,
    FolderKanban,
    History,
    MapPin,
    Minus,
    MoreVertical,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
    X,
    XCircle
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // State
  let mySubmissions = $state<PendingChange[]>([]);
  let filteredSubmissions = $state<PendingChange[]>([]);
  let searchQuery = $state('');
  let statusFilter = $state<PendingChangeStatus | 'all'>('all');
  let resourceTypeFilter = $state<'all' | 'sitio' | 'project'>('all');
  let selectedChange = $state<PendingChange | null>(null);
  let isDetailDialogOpen = $state(false);
  let isEditDialogOpen = $state(false);
  let isWithdrawDialogOpen = $state(false);
  let editedData = $state<string>('');
  let editComment = $state('');
  let withdrawReason = $state('');
  let isProcessing = $state(false);

  // Statistics
  let statistics = $derived({
    pending: mySubmissions.filter((c) => c.status === 'pending').length,
    approved: mySubmissions.filter((c) => c.status === 'approved').length,
    rejected: mySubmissions.filter((c) => c.status === 'rejected').length,
    needsRevision: mySubmissions.filter((c) => c.status === 'needs_revision').length,
    conflict: mySubmissions.filter((c) => c.status === 'conflict').length,
    superseded: mySubmissions.filter((c) => c.status === 'superseded').length,
    total: mySubmissions.length
  });

  // Load submissions from storage
  function loadSubmissions() {
    const userId = authStore.currentUser?.id;
    if (!userId) {
      mySubmissions = [];
      return;
    }

    // Get all submissions by current user
    mySubmissions = getPendingChanges({ submittedByUserId: userId });
    applyFilters();
  }

  // Check for unread status changes and show toast
  function checkUnreadStatusChanges() {
    const userId = authStore.currentUser?.id;
    if (!userId) return;

    const unread = getUnreadStatusChanges(userId);
    if (unread.length > 0) {
      const approvedCount = unread.filter((c) => c.status === 'approved').length;
      const rejectedCount = unread.filter((c) => c.status === 'rejected').length;
      const needsRevisionCount = unread.filter((c) => c.status === 'needs_revision').length;

      const messages: string[] = [];
      if (approvedCount > 0) messages.push(`${approvedCount} approved`);
      if (rejectedCount > 0) messages.push(`${rejectedCount} rejected`);
      if (needsRevisionCount > 0) messages.push(`${needsRevisionCount} needs revision`);

      toast.info(`You have ${unread.length} new update(s): ${messages.join(', ')}`, {
        duration: 5000
      });

      // Mark all as seen
      markAllStatusChangesAsSeen(userId);
    }
  }

  // Apply filters
  function applyFilters() {
    filteredSubmissions = mySubmissions.filter((change) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        change.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        change.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (change.submitterComment?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // Status filter
      const matchesStatus = statusFilter === 'all' || change.status === statusFilter;

      // Resource type filter
      const matchesType =
        resourceTypeFilter === 'all' || change.resourceType === resourceTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  $effect(() => {
    searchQuery;
    statusFilter;
    resourceTypeFilter;
    applyFilters();
  });

  function viewDetails(change: PendingChange) {
    selectedChange = change;
    isDetailDialogOpen = true;

    // Mark as seen when viewed
    if (change.statusChangeSeenBySubmitter === false) {
      markStatusChangeAsSeen(change.id);
    }
  }

  function canEdit(change: PendingChange): boolean {
    return ['pending', 'needs_revision', 'rejected'].includes(change.status);
  }

  function canWithdraw(change: PendingChange): boolean {
    return change.status === 'pending';
  }

  function handleEdit(change: PendingChange) {
    selectedChange = change;
    editedData = JSON.stringify(change.proposedData, null, 2);
    editComment = change.submitterComment || '';
    isEditDialogOpen = true;
  }

  function handleWithdraw(change: PendingChange) {
    selectedChange = change;
    withdrawReason = '';
    isWithdrawDialogOpen = true;
  }

  async function saveEdit() {
    if (!selectedChange || isProcessing) return;

    try {
      isProcessing = true;
      const parsedData = JSON.parse(editedData);

      const success = updatePendingSubmission(selectedChange.id, {
        proposedData: parsedData,
        submitterComment: editComment
      });

      if (success) {
        toast.success('Submission updated successfully');
        isEditDialogOpen = false;
        loadSubmissions();
      } else {
        toast.error('Failed to update submission');
      }
    } catch (error) {
      toast.error('Invalid JSON data');
      console.error(error);
    } finally {
      isProcessing = false;
    }
  }

  async function confirmWithdraw() {
    if (!selectedChange || isProcessing) return;

    try {
      isProcessing = true;
      const success = withdrawSubmission(selectedChange.id, withdrawReason);

      if (success) {
        toast.success('Submission withdrawn successfully');
        isWithdrawDialogOpen = false;
        loadSubmissions();
      } else {
        toast.error('Failed to withdraw submission');
      }
    } finally {
      isProcessing = false;
    }
  }

  function getStatusBadgeVariant(
    status: PendingChangeStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'needs_revision':
        return 'outline';
      case 'conflict':
        return 'outline';
      case 'superseded':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  function getStatusIcon(status: PendingChangeStatus) {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'needs_revision':
        return Edit;
      case 'conflict':
        return AlertTriangle;
      case 'superseded':
        return RefreshCw;
      default:
        return Clock;
    }
  }

  // Get status display text
  function getStatusText(status: PendingChangeStatus): string {
    if (status === 'needs_revision') return 'Needs Revision';
    return toTitleCase(status);
  }

  // Get status-specific classes for badge
  function getStatusClasses(status: PendingChangeStatus): string {
    switch (status) {
      case 'approved':
        return 'bg-green-600 text-white dark:bg-green-600';
      case 'needs_revision':
        return 'border-orange-600 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-900/20 dark:text-orange-400';
      case 'conflict':
        return 'border-yellow-600 bg-yellow-50 text-yellow-700 dark:border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return '';
    }
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

  // Check if a change can be resubmitted
  function canResubmit(change: PendingChange): boolean {
    return change.status === 'needs_revision' || change.status === 'rejected';
  }

  // Navigate to edit page for resubmission
  function handleEditAndResubmit(change: PendingChange) {
    const basePath =
      change.resourceType === 'sitio'
        ? `/admin/sitios/${change.resourceId}/edit`
        : `/admin/projects/${change.resourceId}/edit`;

    goto(`${basePath}?pendingChangeId=${change.id}`);
  }

  function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function getChangedFields(change: PendingChange): string[] {
    if (!change.originalData || !change.proposedData) return [];
    const original = change.originalData as Record<string, unknown>;
    const proposed = change.proposedData as Record<string, unknown>;
    const changedFields: string[] = [];

    for (const key in proposed) {
      if (JSON.stringify(original[key]) !== JSON.stringify(proposed[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  function getFieldValue(data: unknown, field: string): string {
    if (!data) return 'N/A';
    const obj = data as Record<string, unknown>;
    const value = obj[field];
    if (value === null || value === undefined) return 'N/A';
    return String(value);
  }

  onMount(() => {
    loadSubmissions();
    checkUnreadStatusChanges();
  });
</script>

<svelte:head>
  <title>My Submissions</title>
</svelte:head>

<AdminHeader
  title="My Submissions"
  description="Track your submitted changes and their review status"
>
  {#snippet actions()}
    <Button variant="outline" size="sm" onclick={loadSubmissions}>
      <RefreshCw class="mr-2 h-4 w-4" />
      Refresh
    </Button>
  {/snippet}
</AdminHeader>

<div class="container mx-auto max-w-7xl space-y-6 p-4 pb-8 md:p-6">
  <!-- Statistics Cards -->
  <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-muted-foreground">Total</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{statistics.total}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-blue-200 dark:border-blue-900">
      <Card.Header class="pb-2">
        <Card.Title
          class="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          <Clock class="h-4 w-4" />
          Pending
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.pending}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-orange-200 dark:border-orange-900">
      <Card.Header class="pb-2">
        <Card.Title
          class="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400"
        >
          <Edit class="h-4 w-4" />
          Needs Revision
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {statistics.needsRevision}
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-green-200 dark:border-green-900">
      <Card.Header class="pb-2">
        <Card.Title
          class="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400"
        >
          <CheckCircle class="h-4 w-4" />
          Approved
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {statistics.approved}
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-red-200 dark:border-red-900">
      <Card.Header class="pb-2">
        <Card.Title
          class="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400"
        >
          <XCircle class="h-4 w-4" />
          Rejected
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.rejected}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="border-yellow-200 dark:border-yellow-900">
      <Card.Header class="pb-2">
        <Card.Title
          class="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400"
        >
          <AlertTriangle class="h-4 w-4" />
          Conflicts
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {statistics.conflict}
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Filters Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Filter Submissions</Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="grid gap-4 md:grid-cols-3">
        <!-- Search -->
        <div class="relative">
          <Search class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or ID..."
            bind:value={searchQuery}
            class="pl-9"
          />
        </div>

        <!-- Status Filter -->
        <Select.Root
          type="single"
          value={statusFilter}
          onValueChange={(value) => {
            if (value) {
              statusFilter = value as PendingChangeStatus | 'all';
            }
          }}
        >
          <Select.Trigger>
            {statusFilter === 'all'
              ? 'All Statuses'
              : statusFilter === 'needs_revision'
                ? 'Needs Revision'
                : toTitleCase(statusFilter)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Statuses</Select.Item>
            <Select.Item value="pending">Pending</Select.Item>
            <Select.Item value="needs_revision">Needs Revision</Select.Item>
            <Select.Item value="approved">Approved</Select.Item>
            <Select.Item value="rejected">Rejected</Select.Item>
            <Select.Item value="conflict">Conflict</Select.Item>
            <Select.Item value="superseded">Superseded</Select.Item>
          </Select.Content>
        </Select.Root>

        <!-- Resource Type Filter -->
        <Select.Root
          type="single"
          value={resourceTypeFilter}
          onValueChange={(value) => {
            if (value) {
              resourceTypeFilter = value as 'all' | 'sitio' | 'project';
            }
          }}
        >
          <Select.Trigger>
            {resourceTypeFilter === 'all' ? 'All Types' : toTitleCase(resourceTypeFilter)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Types</Select.Item>
            <Select.Item value="sitio">Sitios</Select.Item>
            <Select.Item value="project">Projects</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Submissions Table -->
  <Card.Root class="gap-3 pb-0">
    <Card.Header>
      <Card.Title>My Submissions ({filteredSubmissions.length})</Card.Title>
      <Card.Description>Changes you have submitted for review</Card.Description>
    </Card.Header>
    <Card.Content class="p-3">
      <div class="overflow-x-auto rounded-lg">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="w-12">Type</Table.Head>
              <Table.Head>Resource</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head class="hidden lg:table-cell">Submitted</Table.Head>
              <Table.Head class="hidden xl:table-cell">Reviewed</Table.Head>
              <Table.Head class="w-24">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredSubmissions as change}
              <Table.Row>
                <!-- Resource Type Icon -->
                <Table.Cell>
                  {#if change.resourceType === 'sitio'}
                    <div
                      class="flex items-center justify-center rounded-md bg-blue-100 p-2 dark:bg-blue-900/20"
                    >
                      <MapPin class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  {:else}
                    <div
                      class="flex items-center justify-center rounded-md bg-purple-100 p-2 dark:bg-purple-900/20"
                    >
                      <FolderKanban class="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  {/if}
                </Table.Cell>

                <!-- Resource Name -->
                <Table.Cell>
                  <div class="space-y-1">
                    <div class="font-medium">{change.resourceName}</div>
                    <div class="text-xs text-muted-foreground">
                      ID: {change.id}
                    </div>
                    {#if change.submitterComment}
                      <div class="line-clamp-1 text-xs text-muted-foreground">
                        {change.submitterComment}
                      </div>
                    {/if}
                  </div>
                </Table.Cell>

                <!-- Status -->
                <Table.Cell>
                  {@const Icon = getStatusIcon(change.status)}
                  <div class="flex items-center gap-2">
                    <Badge
                      variant={getStatusBadgeVariant(change.status)}
                      class="gap-1.5 {getStatusClasses(change.status)}"
                    >
                      <Icon class="h-3 w-3" />
                      {getStatusText(change.status)}
                    </Badge>
                    {#if change.statusChangeSeenBySubmitter === false}
                      <span class="h-2 w-2 rounded-full bg-blue-500" title="New update"></span>
                    {/if}
                  </div>
                </Table.Cell>

                <!-- Submitted Time -->
                <Table.Cell class="hidden lg:table-cell">
                  <div class="space-y-1">
                    <div class="text-sm">{formatRelativeTime(change.submittedAt)}</div>
                    <div class="text-xs text-muted-foreground">
                      {formatDateTime(change.submittedAt)}
                    </div>
                  </div>
                </Table.Cell>

                <!-- Reviewed Time -->
                <Table.Cell class="hidden xl:table-cell">
                  {#if change.reviewedAt && change.reviewedBy}
                    <div class="space-y-1">
                      <div class="text-sm">{formatRelativeTime(change.reviewedAt)}</div>
                      <div class="text-xs text-muted-foreground">
                        by {change.reviewedBy.userName}
                      </div>
                    </div>
                  {:else}
                    <span class="text-sm text-muted-foreground">—</span>
                  {/if}
                </Table.Cell>

                <!-- Actions -->
                <Table.Cell>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="ghost" size="sm">
                        <MoreVertical class="h-4 w-4" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item onclick={() => viewDetails(change)}>
                        <Eye class="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenu.Item>
                      {#if canEdit(change)}
                        <DropdownMenu.Item onclick={() => handleEdit(change)}>
                          <Edit class="mr-2 h-4 w-4" />
                          Edit Submission
                        </DropdownMenu.Item>
                      {/if}
                      {#if canWithdraw(change)}
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                          onclick={() => handleWithdraw(change)}
                          class="text-destructive focus:text-destructive"
                        >
                          <Trash2 class="mr-2 h-4 w-4" />
                          Withdraw
                        </DropdownMenu.Item>
                      {/if}
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={6} class="h-24 text-center">
                  <div class="text-muted-foreground">No submissions found</div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    </Card.Content>
  </Card.Root>
</div>

<!-- Detail Dialog -->
<Dialog.Root bind:open={isDetailDialogOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-3xl! overflow-y-auto">
    {#if selectedChange}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          {#if selectedChange.resourceType === 'sitio'}
            <MapPin class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {:else}
            <FolderKanban class="h-5 w-5 text-purple-600 dark:text-purple-400" />
          {/if}
          {selectedChange.resourceName}
        </Dialog.Title>
        <Dialog.Description>
          {@const Icon = getStatusIcon(selectedChange.status)}
          Submission ID: {selectedChange.id} •
          <Badge
            variant={getStatusBadgeVariant(selectedChange.status)}
            class="ml-2 gap-1.5 {getStatusClasses(selectedChange.status)}"
          >
            <Icon class="h-3 w-3" />
            {getStatusText(selectedChange.status)}
          </Badge>
        </Dialog.Description>
      </Dialog.Header>

      <div class="space-y-6">
        <!-- Action Required Banner for Needs Revision -->
        {#if selectedChange.status === 'needs_revision'}
          <div
            class="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950"
          >
            <Edit class="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div class="flex-1">
              <p class="font-medium text-orange-800 dark:text-orange-200">Revision Required</p>
              <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">
                The reviewer has requested changes. Please address the feedback and resubmit.
              </p>
              <Button
                size="sm"
                class="mt-3"
                onclick={() => selectedChange && handleEditAndResubmit(selectedChange)}
              >
                <Edit class="mr-1 h-4 w-4" />
                Edit & Resubmit
              </Button>
            </div>
          </div>
        {/if}

        <!-- Action Required Banner for Rejected -->
        {#if selectedChange.status === 'rejected'}
          <div
            class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
          >
            <XCircle class="h-5 w-5 text-red-600 dark:text-red-400" />
            <div class="flex-1">
              <p class="font-medium text-red-800 dark:text-red-200">Submission Rejected</p>
              <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                This submission was rejected. You can review the feedback and submit a new update if
                needed.
              </p>
              <Button
                size="sm"
                variant="outline"
                class="mt-3"
                onclick={() => selectedChange && handleEditAndResubmit(selectedChange)}
              >
                <Edit class="mr-1 h-4 w-4" />
                Create New Submission
              </Button>
            </div>
          </div>
        {/if}

        <!-- Submission Info -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <div class="text-sm font-medium text-muted-foreground">Submitted</div>
            <div class="mt-1 text-sm">{formatDateTime(selectedChange.submittedAt)}</div>
            <div class="text-xs text-muted-foreground">
              {formatRelativeTime(selectedChange.submittedAt)}
            </div>
          </div>

          {#if selectedChange.reviewedAt && selectedChange.reviewedBy}
            <div>
              <div class="text-sm font-medium text-muted-foreground">Reviewed</div>
              <div class="mt-1 text-sm">{formatDateTime(selectedChange.reviewedAt)}</div>
              <div class="text-xs text-muted-foreground">
                by {selectedChange.reviewedBy.userName}
              </div>
            </div>
          {/if}
        </div>

        <!-- Revision History -->
        {#if selectedChange.revisionHistory && selectedChange.revisionHistory.length > 0}
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <History class="h-4 w-4 text-muted-foreground" />
              <p class="text-sm font-medium">Revision History</p>
            </div>
            <div class="relative ml-2 border-l-2 border-muted pl-4">
              {#each selectedChange.revisionHistory as entry}
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
                      <span class="text-sm font-medium">{formatRevisionAction(entry.action)}</span>
                      <span class="text-xs text-muted-foreground">by {entry.userName}</span>
                      <span class="text-xs text-muted-foreground">•</span>
                      <span class="text-xs text-muted-foreground"
                        >{formatRelativeTime(entry.timestamp)}</span
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

        <!-- Comments -->
        {#if selectedChange.submitterComment}
          <div>
            <div class="text-sm font-medium text-muted-foreground">Your Comment</div>
            <div class="mt-2 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900">
              {selectedChange.submitterComment}
            </div>
          </div>
        {/if}

        {#if selectedChange.reviewerComment}
          <div>
            <div class="text-sm font-medium text-muted-foreground">Reviewer's Comment</div>
            <div
              class="mt-2 rounded-md p-3 text-sm {selectedChange.status === 'approved'
                ? 'bg-green-50 dark:bg-green-900/20'
                : selectedChange.status === 'rejected'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : selectedChange.status === 'needs_revision'
                    ? 'bg-orange-50 dark:bg-orange-900/20'
                    : 'bg-slate-50 dark:bg-slate-900'}"
            >
              {selectedChange.reviewerComment}
            </div>
          </div>
        {/if}

        <!-- Conflict Details -->
        {#if selectedChange.status === 'conflict' && selectedChange.conflictDetails}
          <div>
            <div
              class="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400"
            >
              <AlertTriangle class="h-4 w-4" />
              Conflicts Detected
            </div>
            <div class="space-y-2">
              {#each selectedChange.conflictDetails as conflict}
                <div
                  class="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-900/20"
                >
                  <div class="text-sm font-medium">{toTitleCase(conflict.field)}</div>
                  <div class="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span class="text-muted-foreground">Current Value:</span>
                      <span class="ml-2 font-medium">{String(conflict.currentValue)}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Your Value:</span>
                      <span class="ml-2 font-medium">{String(conflict.proposedValue)}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Changes Comparison -->
        <div>
          <div class="mb-3 text-sm font-medium text-muted-foreground">Proposed Changes</div>
          <div class="space-y-2">
            {#each getChangedFields(selectedChange) as field}
              {@const original = getFieldValue(selectedChange.originalData, field)}
              {@const proposed = getFieldValue(selectedChange.proposedData, field)}
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-md border p-3">
                <div>
                  <div class="mb-1 text-xs font-medium text-muted-foreground">
                    {toTitleCase(field)}
                  </div>
                  <div class="flex items-center gap-2">
                    <Minus class="h-4 w-4 text-red-500" />
                    <span class="text-sm text-red-600 dark:text-red-400">{original}</span>
                  </div>
                </div>
                <ArrowRight class="h-4 w-4 text-muted-foreground" />
                <div>
                  <div class="mb-1 text-xs font-medium text-muted-foreground">New Value</div>
                  <div class="flex items-center gap-2">
                    <Plus class="h-4 w-4 text-green-500" />
                    <span class="text-sm text-green-600 dark:text-green-400">{proposed}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" onclick={() => (isDetailDialogOpen = false)}>Close</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root bind:open={isEditDialogOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-2xl! overflow-y-auto">
    {#if selectedChange}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <Edit class="h-5 w-5" />
          Edit Submission
        </Dialog.Title>
        <Dialog.Description>
          {selectedChange.resourceName}
          {#if selectedChange.status === 'needs_revision'}
            • Needs Revision
          {:else if selectedChange.status === 'rejected'}
            • Rejected - You can edit and resubmit
          {:else}
            • Pending Review
          {/if}
        </Dialog.Description>
      </Dialog.Header>

      <div class="space-y-4">
        {#if selectedChange.reviewerComment}
          <div class="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
            <div
              class="mb-1 flex items-center gap-2 font-semibold text-orange-800 dark:text-orange-300"
            >
              <AlertTriangle class="h-4 w-4" />
              Reviewer Feedback
            </div>
            <p class="text-sm text-orange-700 dark:text-orange-400">
              {selectedChange.reviewerComment}
            </p>
          </div>
        {/if}

        <div class="space-y-2">
          <label for="edit-data" class="text-sm font-medium"> Proposed Changes (JSON) </label>
          <Textarea
            id="edit-data"
            bind:value={editedData}
            rows={15}
            class="font-mono text-xs"
            placeholder="Enter proposed data as JSON"
          />
          <p class="text-xs text-muted-foreground">
            Edit the JSON data to update your proposed changes
          </p>
        </div>

        <div class="space-y-2">
          <label for="edit-comment" class="text-sm font-medium"> Comment (Optional) </label>
          <Textarea
            id="edit-comment"
            bind:value={editComment}
            rows={3}
            placeholder="Explain what you changed..."
          />
        </div>
      </div>

      <Dialog.Footer>
        <Button
          variant="outline"
          onclick={() => (isEditDialogOpen = false)}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button onclick={saveEdit} disabled={isProcessing}>
          {#if isProcessing}
            <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
            Saving...
          {:else}
            <Check class="mr-2 h-4 w-4" />
            {selectedChange.status === 'pending' ? 'Update Submission' : 'Update & Resubmit'}
          {/if}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Withdraw Dialog -->
<Dialog.Root bind:open={isWithdrawDialogOpen}>
  <Dialog.Content class="max-w-md!">
    {#if selectedChange}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2 text-destructive">
          <Trash2 class="h-5 w-5" />
          Withdraw Submission
        </Dialog.Title>
        <Dialog.Description>Are you sure you want to withdraw this submission?</Dialog.Description>
      </Dialog.Header>

      <div class="space-y-4">
        <div class="rounded-lg bg-muted p-3">
          <div class="text-sm font-medium">{selectedChange.resourceName}</div>
          <div class="text-xs text-muted-foreground">ID: {selectedChange.id}</div>
        </div>

        <div class="space-y-2">
          <label for="withdraw-reason" class="text-sm font-medium"> Reason (Optional) </label>
          <Textarea
            id="withdraw-reason"
            bind:value={withdrawReason}
            rows={3}
            placeholder="Why are you withdrawing this submission?"
          />
        </div>

        <div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <p>⚠️ This action cannot be undone. The submission will be permanently removed.</p>
        </div>
      </div>

      <Dialog.Footer>
        <Button
          variant="outline"
          onclick={() => (isWithdrawDialogOpen = false)}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button variant="destructive" onclick={confirmWithdraw} disabled={isProcessing}>
          {#if isProcessing}
            <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
            Withdrawing...
          {:else}
            <Trash2 class="mr-2 h-4 w-4" />
            Withdraw Submission
          {/if}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
