<script lang="ts">
  import AuditLogDetailDialog from '$lib/components/admin/AuditLogDetailDialog.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import type { AuditAction, AuditLog, AuditResourceType } from '$lib/types';
  import toTitleCase from '$lib/utils/common';
  import {
    Activity,
    ArrowRight,
    Download,
    FileText,
    LogIn,
    LogOut,
    Pencil,
    Plus,
    RotateCcw,
    Trash,
    Upload,
    User,
    type IconProps
  } from '@lucide/svelte';
  import type { Component } from 'svelte';

  interface Props {
    activities: AuditLog[];
    isLoading?: boolean;
  }

  let { activities, isLoading = false }: Props = $props();

  let selectedLog = $state<AuditLog | null>(null);
  let dialogOpen = $state(false);

  function openLogDetail(log: AuditLog) {
    selectedLog = log;
    dialogOpen = true;
  }

  function formatActivityTime(timestamp: string): string {
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getActionIcon(action: AuditAction): Component<IconProps> {
    const iconMap: Record<AuditAction, Component<IconProps>> = {
      login: LogIn,
      logout: LogOut,
      create: Plus,
      update: Pencil,
      delete: Trash,
      view: FileText,
      export: Download,
      import: Upload,
      submit_for_review: FileText,
      approve: Plus,
      reject: Trash,
      resolve_conflict: Pencil,
      rollback: RotateCcw,
      request_revision: Pencil,
      resubmit: RotateCcw
    };
    return iconMap[action] || Activity;
  }

  function getActionBadgeVariant(
    action: AuditAction
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (action) {
      case 'delete':
        return 'destructive';
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'rollback':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  function getResourceBadgeVariant(
    resource: AuditResourceType
  ): 'default' | 'secondary' | 'outline' {
    switch (resource) {
      case 'user':
        return 'default';
      default:
        return 'outline';
    }
  }
</script>

<Card.Card class="shadow-sm">
  <Card.CardHeader>
    <Card.CardTitle class="">
      <div class="flex items-center justify-between">
        <span class="text-xl font-semibold">Recent Activity</span>
        <a
          href="/admin/audit"
          class="flex items-center gap-1 text-sm font-normal text-muted-foreground hover:text-foreground"
        >
          View All
          <ArrowRight class="size-4" />
        </a>
      </div>
    </Card.CardTitle>
  </Card.CardHeader>
  <Card.CardContent>
    {#if isLoading}
      <div class="space-y-6">
        {#each Array(5) as _}
          <div class="flex gap-3">
            <Skeleton class="size-10 rounded-full" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-3 w-full" />
              <Skeleton class="h-3 w-16" />
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="space-y-4">
        {#each activities as activity}
          {@const ActionIcon = getActionIcon(activity.action)}
          <button
            type="button"
            class="flex w-full gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
            onclick={() => openLogDetail(activity)}
          >
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <User class="size-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium">{activity.user_name}</p>
                <span class="text-xs text-muted-foreground">
                  {formatActivityTime(activity.timestamp)}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <Badge variant={getActionBadgeVariant(activity.action)} class="text-xs">
                  <ActionIcon class="mr-1 h-3 w-3" />
                  {toTitleCase(activity.action)}
                </Badge>
                <Badge variant={getResourceBadgeVariant(activity.resource_type)} class="text-xs">
                  {toTitleCase(activity.resource_type)}
                </Badge>
                {#if activity.resource_name}
                  <span class="truncate text-xs text-muted-foreground">
                    {activity.resource_name}
                  </span>
                {/if}
              </div>
              {#if activity.details}
                <p class="truncate text-xs text-muted-foreground">
                  {activity.details}
                </p>
              {/if}
            </div>
          </button>
        {:else}
          <p class="py-4 text-center text-sm text-muted-foreground">No recent activity</p>
        {/each}
      </div>
    {/if}
  </Card.CardContent>
</Card.Card>

<AuditLogDetailDialog log={selectedLog} bind:open={dialogOpen} />
