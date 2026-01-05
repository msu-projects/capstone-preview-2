<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Dialog from '$lib/components/ui/dialog';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import type { AuditAction, AuditFieldChange, AuditLog, AuditResourceType } from '$lib/types';
  import toTitleCase from '$lib/utils/common';
  import {
    Activity,
    ArrowRight,
    Calendar,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Download,
    FileText,
    Globe,
    Hash,
    Layers,
    LogIn,
    LogOut,
    Minus,
    Pencil,
    Plus,
    Trash,
    Upload,
    User,
    type IconProps
  } from '@lucide/svelte';
  import type { Component } from 'svelte';

  interface Props {
    log: AuditLog | null;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { log, open = $bindable(false), onOpenChange }: Props = $props();

  // Track which years are expanded
  let expandedYears = $state<Set<string>>(new Set());

  function handleOpenChange(newOpen: boolean) {
    open = newOpen;
    onOpenChange?.(newOpen);
    // Reset expanded state when dialog closes
    if (!newOpen) {
      expandedYears = new Set();
    }
  }

  function toggleYear(year: string) {
    const newSet = new Set(expandedYears);
    if (newSet.has(year)) {
      newSet.delete(year);
    } else {
      newSet.add(year);
    }
    expandedYears = newSet;
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
      resolve_conflict: Pencil
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

  function formatFullTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return '';
  }

  function formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  function formatSimpleValue(value: unknown): string {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty)';
      return value.join(', ');
    }
    return String(value);
  }

  // Check if a value is a year key (4-digit year string)
  function isYearKey(key: string): boolean {
    return /^\d{4}$/.test(key);
  }

  // Check if the field is yearly data
  function isYearlyDataField(field: string): boolean {
    return field === 'yearlyData';
  }

  // Extract year-based changes from yearly data change
  interface YearChange {
    year: string;
    type: 'added' | 'removed' | 'modified';
    fields: FieldChange[];
  }

  interface FieldChange {
    field: string;
    path: string[];
    oldValue: unknown;
    newValue: unknown;
  }

  function parseYearlyDataChanges(change: AuditFieldChange): YearChange[] {
    const oldData = (change.oldValue as Record<string, unknown>) || {};
    const newData = (change.newValue as Record<string, unknown>) || {};
    const yearChanges: YearChange[] = [];

    const allYears = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const year of allYears) {
      if (!isYearKey(year)) continue;

      const oldYearData = oldData[year] as Record<string, unknown> | undefined;
      const newYearData = newData[year] as Record<string, unknown> | undefined;

      if (!oldYearData && newYearData) {
        // Year was added
        yearChanges.push({
          year,
          type: 'added',
          fields: extractAllFields(newYearData, [])
        });
      } else if (oldYearData && !newYearData) {
        // Year was removed
        yearChanges.push({
          year,
          type: 'removed',
          fields: extractAllFields(oldYearData, [])
        });
      } else if (oldYearData && newYearData) {
        // Year was modified - find the differences
        const fields = findDifferences(oldYearData, newYearData, []);
        if (fields.length > 0) {
          yearChanges.push({
            year,
            type: 'modified',
            fields
          });
        }
      }
    }

    return yearChanges.sort((a, b) => b.year.localeCompare(a.year));
  }

  function extractAllFields(obj: Record<string, unknown>, path: string[]): FieldChange[] {
    const fields: FieldChange[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        fields.push(...extractAllFields(value as Record<string, unknown>, currentPath));
      } else {
        fields.push({
          field: key,
          path: currentPath,
          oldValue: undefined,
          newValue: value
        });
      }
    }

    return fields;
  }

  function findDifferences(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    path: string[]
  ): FieldChange[] {
    const differences: FieldChange[] = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const currentPath = [...path, key];
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      // Skip if both are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

      // If both are objects (but not arrays), recurse
      if (
        oldValue !== null &&
        newValue !== null &&
        typeof oldValue === 'object' &&
        typeof newValue === 'object' &&
        !Array.isArray(oldValue) &&
        !Array.isArray(newValue)
      ) {
        differences.push(
          ...findDifferences(
            oldValue as Record<string, unknown>,
            newValue as Record<string, unknown>,
            currentPath
          )
        );
      } else {
        differences.push({
          field: key,
          path: currentPath,
          oldValue,
          newValue
        });
      }
    }

    return differences;
  }

  // Format a nested path for display
  function formatPath(path: string[]): string {
    return path.map(formatFieldName).join(' → ');
  }

  // Check if a change is a nested object change
  function isNestedObjectChange(change: AuditFieldChange): boolean {
    return (
      typeof change.oldValue === 'object' &&
      typeof change.newValue === 'object' &&
      !Array.isArray(change.oldValue) &&
      !Array.isArray(change.newValue) &&
      change.oldValue !== null &&
      change.newValue !== null
    );
  }

  // Parse nested object changes into flat field changes
  function parseNestedChanges(change: AuditFieldChange): FieldChange[] {
    return findDifferences(
      (change.oldValue as Record<string, unknown>) || {},
      (change.newValue as Record<string, unknown>) || {},
      [change.field]
    );
  }

  // Get regular (non-yearly) changes
  function getRegularChanges(changes: AuditFieldChange[]): AuditFieldChange[] {
    return changes.filter((c) => !isYearlyDataField(c.field));
  }

  // Get yearly data changes
  function getYearlyChanges(changes: AuditFieldChange[]): AuditFieldChange[] {
    return changes.filter((c) => isYearlyDataField(c.field));
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[90vh] max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Activity class="h-5 w-5" />
        Activity Details
      </Dialog.Title>
      <Dialog.Description>Full details of the audit log entry</Dialog.Description>
    </Dialog.Header>

    {#if log}
      {@const ActionIcon = getActionIcon(log.action)}
      {@const regularChanges = log.changes ? getRegularChanges(log.changes) : []}
      {@const yearlyChanges = log.changes ? getYearlyChanges(log.changes) : []}
      <ScrollArea class="max-h-[70vh] pr-4">
        <div class="space-y-4">
          <!-- User Info -->
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <User class="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p class="font-semibold">{log.user_name}</p>
              <p class="text-sm text-muted-foreground">User ID: {log.user_id}</p>
            </div>
          </div>

          <Separator />

          <!-- Action & Resource -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Action</span>
              <Badge variant={getActionBadgeVariant(log.action)}>
                <ActionIcon class="mr-1 h-3 w-3" />
                {toTitleCase(log.action)}
              </Badge>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Resource Type</span>
              <Badge variant={getResourceBadgeVariant(log.resource_type)}>
                {toTitleCase(log.resource_type)}
              </Badge>
            </div>

            {#if log.resource_name}
              <div class="flex items-center justify-between gap-4">
                <span class="shrink-0 text-sm text-muted-foreground">Resource Name</span>
                <span class="truncate text-sm font-medium">{log.resource_name}</span>
              </div>
            {/if}

            {#if log.resource_id}
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Resource ID</span>
                <div class="flex items-center gap-1 font-mono text-sm">
                  <Hash class="h-3 w-3" />
                  {log.resource_id}
                </div>
              </div>
            {/if}
          </div>

          <Separator />

          <!-- Regular Field Changes (non-yearly) -->
          {#if regularChanges.length > 0}
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <Layers class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium">
                  Field Changes ({regularChanges.length} field{regularChanges.length !== 1
                    ? 's'
                    : ''})
                </span>
              </div>
              <div class="space-y-2">
                {#each regularChanges as change}
                  {#if isNestedObjectChange(change)}
                    <!-- Nested object change - show individual field differences -->
                    {@const nestedChanges = parseNestedChanges(change)}
                    <div class="rounded-md border bg-muted/30 p-3">
                      <p class="mb-3 text-sm font-medium text-foreground">
                        {formatFieldName(change.field)}
                        <span class="ml-2 text-xs font-normal text-muted-foreground">
                          ({nestedChanges.length} sub-field{nestedChanges.length !== 1 ? 's' : ''})
                        </span>
                      </p>
                      <div class="space-y-2">
                        {#each nestedChanges as nestedChange}
                          <div class="rounded border border-border/50 bg-background/50 p-2 text-xs">
                            <p class="mb-1.5 font-medium text-muted-foreground">
                              {formatPath(nestedChange.path.slice(1))}
                            </p>
                            <div class="flex items-center gap-2">
                              <span
                                class="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-destructive"
                              >
                                {formatSimpleValue(nestedChange.oldValue)}
                              </span>
                              <ArrowRight class="h-3 w-3 shrink-0 text-muted-foreground" />
                              <span
                                class="rounded bg-green-500/10 px-1.5 py-0.5 font-mono text-green-600 dark:text-green-400"
                              >
                                {formatSimpleValue(nestedChange.newValue)}
                              </span>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {:else}
                    <!-- Simple field change -->
                    <div class="rounded-md border bg-muted/30 p-3">
                      <p class="mb-2 text-sm font-medium text-foreground">
                        {formatFieldName(change.field)}
                      </p>
                      <div class="flex items-center gap-2 text-xs">
                        <span
                          class="rounded bg-destructive/10 px-2 py-1 font-mono break-all text-destructive"
                        >
                          {formatSimpleValue(change.oldValue)}
                        </span>
                        <ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span
                          class="rounded bg-green-500/10 px-2 py-1 font-mono break-all text-green-600 dark:text-green-400"
                        >
                          {formatSimpleValue(change.newValue)}
                        </span>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>

            {#if yearlyChanges.length > 0}
              <Separator />
            {/if}
          {/if}

          <!-- Yearly Data Changes -->
          {#if yearlyChanges.length > 0}
            {#each yearlyChanges as yearlyChange}
              {@const yearChanges = parseYearlyDataChanges(yearlyChange)}
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <CalendarDays class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm font-medium">
                    Yearly Data Changes ({yearChanges.length} year{yearChanges.length !== 1
                      ? 's'
                      : ''})
                  </span>
                </div>

                <div class="space-y-2">
                  {#each yearChanges as yearChange}
                    <Collapsible.Root
                      open={expandedYears.has(yearChange.year)}
                      onOpenChange={() => toggleYear(yearChange.year)}
                    >
                      <div class="rounded-lg border bg-muted/30">
                        <Collapsible.Trigger
                          class="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50"
                        >
                          <div class="flex items-center gap-3">
                            <div
                              class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10"
                            >
                              <span class="text-xs font-bold text-primary">{yearChange.year}</span>
                            </div>
                            <div>
                              <p class="text-sm font-medium">
                                Year {yearChange.year}
                              </p>
                              <p class="text-xs text-muted-foreground">
                                {yearChange.fields.length} field{yearChange.fields.length !== 1
                                  ? 's'
                                  : ''}
                                {yearChange.type === 'added'
                                  ? 'added'
                                  : yearChange.type === 'removed'
                                    ? 'removed'
                                    : 'changed'}
                              </p>
                            </div>
                          </div>
                          <div class="flex items-center gap-2">
                            {#if yearChange.type === 'added'}
                              <Badge
                                variant="default"
                                class="bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:text-green-400"
                              >
                                <Plus class="mr-1 h-3 w-3" />
                                Added
                              </Badge>
                            {:else if yearChange.type === 'removed'}
                              <Badge variant="destructive">
                                <Minus class="mr-1 h-3 w-3" />
                                Removed
                              </Badge>
                            {:else}
                              <Badge variant="secondary">
                                <Pencil class="mr-1 h-3 w-3" />
                                Modified
                              </Badge>
                            {/if}
                            {#if expandedYears.has(yearChange.year)}
                              <ChevronDown class="h-4 w-4 text-muted-foreground" />
                            {:else}
                              <ChevronRight class="h-4 w-4 text-muted-foreground" />
                            {/if}
                          </div>
                        </Collapsible.Trigger>

                        <Collapsible.Content>
                          <div class="border-t px-3 pt-2 pb-3">
                            <div class="max-h-60 space-y-1.5 overflow-y-auto">
                              {#each yearChange.fields.slice(0, 50) as fieldChange}
                                <div
                                  class="flex flex-col gap-1 rounded border border-border/50 bg-background/50 p-2 text-xs sm:flex-row sm:items-center sm:gap-2"
                                >
                                  <span
                                    class="min-w-0 shrink-0 font-medium text-muted-foreground sm:w-32 sm:truncate"
                                    title={formatPath(fieldChange.path)}
                                  >
                                    {formatPath(fieldChange.path)}
                                  </span>
                                  <div class="flex flex-1 items-center gap-2">
                                    {#if yearChange.type !== 'added'}
                                      <span
                                        class="max-w-24 truncate rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-destructive sm:max-w-none"
                                        title={formatSimpleValue(fieldChange.oldValue)}
                                      >
                                        {formatSimpleValue(fieldChange.oldValue)}
                                      </span>
                                    {/if}
                                    {#if yearChange.type === 'modified'}
                                      <ArrowRight class="h-3 w-3 shrink-0 text-muted-foreground" />
                                    {/if}
                                    {#if yearChange.type !== 'removed'}
                                      <span
                                        class="max-w-24 truncate rounded bg-green-500/10 px-1.5 py-0.5 font-mono text-green-600 sm:max-w-none dark:text-green-400"
                                        title={formatSimpleValue(fieldChange.newValue)}
                                      >
                                        {formatSimpleValue(fieldChange.newValue)}
                                      </span>
                                    {/if}
                                  </div>
                                </div>
                              {/each}
                              {#if yearChange.fields.length > 50}
                                <p class="py-2 text-center text-xs text-muted-foreground">
                                  ...and {yearChange.fields.length - 50} more fields
                                </p>
                              {/if}
                            </div>
                          </div>
                        </Collapsible.Content>
                      </div>
                    </Collapsible.Root>
                  {/each}
                </div>
              </div>
            {/each}

            <Separator />
          {/if}

          <!-- No changes message -->
          {#if (!log.changes || log.changes.length === 0) && log.action !== 'login' && log.action !== 'logout' && log.action !== 'view'}
            <div class="rounded-md border border-dashed bg-muted/20 p-4 text-center">
              <p class="text-sm text-muted-foreground">No field changes recorded</p>
            </div>
            <Separator />
          {/if}

          <!-- Details -->
          {#if log.details}
            <div class="space-y-2">
              <span class="text-sm font-medium">Details</span>
              <p class="rounded-md bg-muted p-3 text-sm">
                {log.details}
              </p>
            </div>

            <Separator />
          {/if}

          <!-- Metadata -->
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-4">
              <div class="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                <Calendar class="h-4 w-4" />
                Timestamp
              </div>
              <div class="text-right">
                <p class="text-sm">{formatFullTimestamp(log.timestamp)}</p>
                {#if formatRelativeTime(log.timestamp)}
                  <p class="text-xs text-muted-foreground">
                    {formatRelativeTime(log.timestamp)}
                  </p>
                {/if}
              </div>
            </div>

            {#if log.ip_address}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1 text-sm text-muted-foreground">
                  <Globe class="h-4 w-4" />
                  IP Address
                </div>
                <span class="font-mono text-sm">{log.ip_address}</span>
              </div>
            {/if}

            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Log ID</span>
              <span class="max-w-48 truncate font-mono text-xs text-muted-foreground">
                {log.id}
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>
    {/if}
  </Dialog.Content>
</Dialog.Root>
