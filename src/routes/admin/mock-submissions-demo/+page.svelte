<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import {
    getSubmissionGenerationParams,
    loadMockSubmissions,
    resetSubmissionsMockData
  } from '$lib/mock-data';
  import type { PendingChange } from '$lib/types';
  import { CheckCircle, RefreshCw, Trash2 } from '@lucide/svelte';

  let submissions = $state<PendingChange[]>([]);
  let params = $state(getSubmissionGenerationParams());

  function loadSubmissions() {
    submissions = loadMockSubmissions();
  }

  function resetData() {
    if (confirm('This will clear all existing submission data and regenerate. Continue?')) {
      resetSubmissionsMockData();
      loadSubmissions();
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'needs_revision':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'conflict':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'superseded':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return '';
    }
  }

  $effect(() => {
    loadSubmissions();
  });

  const stats = $derived({
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    needsRevision: submissions.filter((s) => s.status === 'needs_revision').length,
    conflict: submissions.filter((s) => s.status === 'conflict').length,
    superseded: submissions.filter((s) => s.status === 'superseded').length,
    sitios: submissions.filter((s) => s.resourceType === 'sitio').length,
    projects: submissions.filter((s) => s.resourceType === 'project').length
  });
</script>

<div class="container mx-auto space-y-6 p-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Mock Submissions Demo</h1>
      <p class="mt-2 text-muted-foreground">
        Testing the submission and review mock data generator
      </p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" onclick={loadSubmissions}>
        <RefreshCw class="mr-2 h-4 w-4" />
        Reload
      </Button>
      <Button variant="destructive" onclick={resetData}>
        <Trash2 class="mr-2 h-4 w-4" />
        Reset & Regenerate
      </Button>
    </div>
  </div>

  <!-- Configuration Info -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Generation Configuration</Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <p class="text-sm text-muted-foreground">Default Count</p>
          <p class="text-2xl font-bold">{params.count}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground">Seed</p>
          <p class="text-2xl font-bold">{params.seed}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground">Total Generated</p>
          <p class="text-2xl font-bold">{stats.total}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground">Resource Types</p>
          <p class="text-sm font-medium">
            {stats.sitios} Sitios, {stats.projects} Projects
          </p>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Statistics -->
  <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-sm text-muted-foreground">Pending</p>
          <p class="text-3xl font-bold text-blue-600">{stats.pending}</p>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-sm text-muted-foreground">Approved</p>
          <p class="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-sm text-muted-foreground">Rejected</p>
          <p class="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-sm text-muted-foreground">Needs Revision</p>
          <p class="text-3xl font-bold text-orange-600">{stats.needsRevision}</p>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-sm text-muted-foreground">Conflict</p>
          <p class="text-3xl font-bold text-yellow-600">{stats.conflict}</p>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-sm text-muted-foreground">Superseded</p>
          <p class="text-3xl font-bold text-gray-600">{stats.superseded}</p>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Sample Submissions -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Sample Submissions (First 10)</Card.Title>
      <Card.Description>
        Showing a preview of generated submissions. Visit /admin/my-submissions for full interface.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="space-y-4">
        {#each submissions.slice(0, 10) as submission}
          <div class="space-y-2 rounded-lg border p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="mb-1 flex items-center gap-2">
                  <Badge variant="outline" class={getStatusColor(submission.status)}>
                    {submission.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">
                    {submission.resourceType.toUpperCase()}
                  </Badge>
                  {#if !submission.statusChangeSeenBySubmitter}
                    <Badge variant="default" class="bg-blue-500">NEW</Badge>
                  {/if}
                </div>
                <h4 class="font-semibold">{submission.resourceName}</h4>
                <p class="text-sm text-muted-foreground">ID: {submission.id}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-muted-foreground">Submitted by:</span>
                <span class="ml-1 font-medium">{submission.submittedBy.userName}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Submitted at:</span>
                <span class="ml-1">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              </div>
              {#if submission.reviewedBy}
                <div>
                  <span class="text-muted-foreground">Reviewed by:</span>
                  <span class="ml-1 font-medium">{submission.reviewedBy.userName}</span>
                </div>
              {/if}
              {#if submission.reviewedAt}
                <div>
                  <span class="text-muted-foreground">Reviewed at:</span>
                  <span class="ml-1">
                    {new Date(submission.reviewedAt).toLocaleDateString()}
                  </span>
                </div>
              {/if}
            </div>

            {#if submission.submitterComment}
              <div class="text-sm">
                <span class="text-muted-foreground">Comment:</span>
                <span class="ml-1">{submission.submitterComment}</span>
              </div>
            {/if}

            {#if submission.reviewerComment}
              <div class="rounded bg-muted p-2 text-sm">
                <span class="font-medium text-muted-foreground">Reviewer feedback:</span>
                <span class="ml-1">{submission.reviewerComment}</span>
              </div>
            {/if}

            {#if submission.revisionHistory && submission.revisionHistory.length > 0}
              <div class="text-sm text-muted-foreground">
                {submission.revisionHistory.length} revision{submission.revisionHistory.length !== 1
                  ? 's'
                  : ''} in history
              </div>
            {/if}
          </div>
        {/each}
      </div>

      {#if submissions.length > 10}
        <div class="mt-4 text-center text-sm text-muted-foreground">
          Showing 10 of {submissions.length} submissions
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Instructions -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <CheckCircle class="h-5 w-5" />
        How to Use
      </Card.Title>
    </Card.Header>
    <Card.Content class="space-y-2 text-sm">
      <p>
        <strong>1. View Full Interface:</strong> Navigate to
        <a href="/admin/my-submissions" class="text-blue-600 hover:underline"
          >/admin/my-submissions</a
        > to see the complete submission management interface.
      </p>
      <p>
        <strong>2. Filter & Search:</strong> Use the filters to view submissions by status, resource type,
        or search by name/ID.
      </p>
      <p>
        <strong>3. Reset Data:</strong> Click "Reset & Regenerate" above to clear and generate fresh mock
        data.
      </p>
      <p>
        <strong>4. Documentation:</strong> See
        <code class="rounded bg-muted px-1 py-0.5">docs/submission-mock-data.md</code> for complete documentation.
      </p>
      <p>
        <strong>5. Integration:</strong> The mock data is automatically loaded from localStorage and synced
        with the pending changes system.
      </p>
    </Card.Content>
  </Card.Root>
</div>
