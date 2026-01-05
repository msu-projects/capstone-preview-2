<script lang="ts">
  import CustomFieldChart from '$lib/components/charts/CustomFieldChart.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import type {
    CustomFieldDefinition,
    CustomFieldGroup,
    SitioProfile,
    SitioRecord
  } from '$lib/types';
  import { AGGREGATION_TYPE_LABELS } from '$lib/types';
  import { cn } from '$lib/utils';
  import {
    getActiveCustomFieldDefinitions,
    getActiveCustomFieldGroups
  } from '$lib/utils/custom-fields-storage';
  import type { Icon as IconType } from '@lucide/svelte';
  import {
    Activity,
    Award,
    BookOpen,
    Briefcase,
    Building,
    Calendar,
    CheckCircle2,
    ChevronDown,
    CircleCheck,
    CircleDot,
    Droplet,
    Folder,
    Hash,
    Heart,
    HelpCircle,
    Home,
    Info,
    Layers,
    Leaf,
    List,
    ListChecks,
    Map as MapIcon,
    PieChart,
    Settings,
    Shield,
    Star,
    Target,
    ToggleLeft,
    Truck,
    Type,
    Users,
    Zap
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  interface Props {
    sitio: SitioProfile;
    sitioRecord?: SitioRecord;
    selectedYear?: number;
  }

  const { sitio, sitioRecord, selectedYear }: Props = $props();

  let definitions = $state<CustomFieldDefinition[]>([]);
  let groups = $state<CustomFieldGroup[]>([]);
  let collapsedGroups = $state<Set<string>>(new Set());

  onMount(() => {
    definitions = getActiveCustomFieldDefinitions();
    groups = getActiveCustomFieldGroups();
  });

  // Get icon component from name
  function getIconComponent(iconName: string | undefined): typeof IconType {
    const iconMap: Record<string, typeof IconType> = {
      Folder,
      Layers,
      Users,
      Building,
      Home,
      Briefcase,
      Heart,
      Shield,
      Leaf,
      Droplet,
      Zap,
      BookOpen,
      Truck,
      Map: MapIcon,
      Activity,
      PieChart,
      Settings,
      Star,
      Target,
      Award
    };
    return iconName && iconMap[iconName] ? iconMap[iconName] : Folder;
  }

  // Get icon for data type
  function getDataTypeIcon(dataType: CustomFieldDefinition['dataType']) {
    switch (dataType) {
      case 'text':
        return Type;
      case 'number':
        return Hash;
      case 'boolean':
        return ToggleLeft;
      case 'date':
        return Calendar;
      case 'array':
        return List;
      case 'checkbox':
        return ListChecks;
      case 'radio':
        return CircleCheck;
      default:
        return Type;
    }
  }

  // Format value for display
  function formatValue(value: unknown, dataType: CustomFieldDefinition['dataType']): string {
    if (value === undefined || value === null || value === '') {
      return 'Not recorded';
    }
    switch (dataType) {
      case 'text':
        return String(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        if (typeof value === 'string' && value) {
          return new Date(value).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        return 'Not recorded';
      case 'array':
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : 'Empty list';
        }
        return 'Not recorded';
      case 'checkbox':
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : 'None selected';
        }
        return 'Not recorded';
      case 'radio':
        return typeof value === 'string' ? value : 'Not recorded';
      default:
        return String(value);
    }
  }

  // Get custom field value from sitio
  function getFieldValue(fieldName: string): unknown {
    return sitio.customFields?.[fieldName];
  }

  // Check if field has a value
  function hasValue(value: unknown, dataType: CustomFieldDefinition['dataType']): boolean {
    if (value === undefined || value === null) return false;
    if (dataType === 'text' && value === '') return false;
    if (dataType === 'boolean') return true;
    if (dataType === 'date' && value === '') return false;
    if (dataType === 'array' && Array.isArray(value)) return value.length > 0;
    if (dataType === 'checkbox' && Array.isArray(value)) return value.length > 0;
    if (dataType === 'radio' && value === '') return false;
    return true;
  }

  // Get fields organized by groups
  const fieldsByGroup = $derived.by(() => {
    const grouped = new Map<string | null, CustomFieldDefinition[]>();

    // Initialize with all active groups
    for (const group of groups) {
      grouped.set(group.id, []);
    }
    grouped.set(null, []); // Uncategorized

    for (const field of definitions) {
      const groupId = field.groupId ?? null;
      // If group doesn't exist (archived), put in uncategorized
      if (groupId && !groups.some((g) => g.id === groupId)) {
        grouped.get(null)!.push(field);
      } else {
        if (!grouped.has(groupId)) {
          grouped.set(groupId, []);
        }
        grouped.get(groupId)!.push(field);
      }
    }

    // Sort fields within each group
    for (const [, fieldList] of grouped) {
      fieldList.sort((a: CustomFieldDefinition, b: CustomFieldDefinition) => {
        const orderA = a.groupDisplayOrder ?? a.displayOrder;
        const orderB = b.groupDisplayOrder ?? b.displayOrder;
        return orderA - orderB;
      });
    }

    return grouped;
  });

  $inspect(fieldsByGroup);

  // Statistics
  const fieldsRecordedCount = $derived(
    definitions.filter((d) => hasValue(getFieldValue(d.fieldName), d.dataType)).length
  );

  // Toggle group collapse
  function toggleCollapse(groupId: string) {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(groupId)) {
      newSet.delete(groupId);
    } else {
      newSet.add(groupId);
    }
    collapsedGroups = newSet;
  }

  // Get group field count with values
  function getGroupRecordedCount(groupFields: CustomFieldDefinition[]): number {
    return groupFields.filter((d) => hasValue(getFieldValue(d.fieldName), d.dataType)).length;
  }

  // Color mappings for icons
  const groupIconColors: Record<string, { bg: string; text: string }> = {
    Users: { bg: 'bg-blue-100', text: 'text-blue-600' },
    Heart: { bg: 'bg-rose-100', text: 'text-rose-600' },
    Shield: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    Leaf: { bg: 'bg-green-100', text: 'text-green-600' },
    Droplet: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    Zap: { bg: 'bg-amber-100', text: 'text-amber-600' },
    BookOpen: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    Building: { bg: 'bg-slate-100', text: 'text-slate-600' },
    Home: { bg: 'bg-orange-100', text: 'text-orange-600' },
    Briefcase: { bg: 'bg-purple-100', text: 'text-purple-600' },
    Truck: { bg: 'bg-teal-100', text: 'text-teal-600' },
    Map: { bg: 'bg-sky-100', text: 'text-sky-600' },
    Activity: { bg: 'bg-red-100', text: 'text-red-600' },
    PieChart: { bg: 'bg-violet-100', text: 'text-violet-600' },
    Folder: { bg: 'bg-gray-100', text: 'text-gray-600' }
  };

  function getIconColors(iconName: string | undefined) {
    return groupIconColors[iconName ?? 'Folder'] ?? groupIconColors['Folder'];
  }
</script>

{#if definitions.length === 0}
  <!-- Empty state when no custom fields are defined -->
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center"
  >
    <div
      class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
    >
      <Layers class="size-8" />
    </div>
    <h3 class="mt-4 text-lg font-medium">No Supplementary Data</h3>
    <p class="mt-2 max-w-sm text-sm text-muted-foreground">
      No custom data fields have been configured for monitoring. Administrators can define
      additional fields in the system configuration.
    </p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"
        >
          <Layers class="size-5" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Supplementary Data</h3>
          <p class="text-sm text-muted-foreground">
            {fieldsRecordedCount} of {definitions.length} fields recorded
          </p>
        </div>
      </div>
      <Badge variant="secondary">
        {groups.length} group{groups.length !== 1 ? 's' : ''}
      </Badge>
    </div>

    <!-- Groups Display -->
    <div class="space-y-4">
      {#each [...groups, { id: null, name: 'Uncategorized', icon: 'Folder', isCollapsible: true, description: 'Fields not assigned to any group' }] as group (group.id ?? '__uncategorized__')}
        {@const groupFields = fieldsByGroup.get(group.id ?? null) ?? []}
        {@const groupFieldsWithData = groupFields.filter((d) =>
          hasValue(getFieldValue(d.fieldName), d.dataType)
        )}
        {@const recordedCount = getGroupRecordedCount(groupFields)}
        {@const IconComponent = getIconComponent(group.icon)}
        {@const iconColors = getIconColors(group.icon)}

        {#if groupFieldsWithData.length > 0}
          {@const isCollapsed = group.id ? collapsedGroups.has(group.id) : false}

          <InfoCard
            title={group.name}
            description={group.description}
            icon={IconComponent}
            iconBgColor={iconColors.bg}
            iconTextColor={iconColors.text}
            badgeText="{recordedCount}/{groupFields.length} recorded"
            contentPadding="p-0"
          >
            {#snippet headerAction()}
              {#if group.isCollapsible && group.id}
                <button
                  type="button"
                  class="rounded-md p-1 hover:bg-muted"
                  onclick={() => group.id && toggleCollapse(group.id)}
                >
                  <ChevronDown
                    class={cn(
                      'size-5 text-muted-foreground transition-transform',
                      isCollapsed && '-rotate-90'
                    )}
                  />
                </button>
              {/if}
            {/snippet}

            {#if !isCollapsed}
              <div class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each groupFieldsWithData as def (def.id)}
                  {@const value = getFieldValue(def.fieldName)}
                  {@const hasVal = hasValue(value, def.dataType)}
                  {@const DataTypeIcon = getDataTypeIcon(def.dataType)}

                  <!-- Field Card based on data type -->
                  {#if def.dataType === 'boolean'}
                    <!-- Boolean Field -->
                    <div
                      class={cn(
                        'group relative flex flex-col gap-3 rounded-lg border p-4 transition-all hover:shadow-md',
                        value === true &&
                          'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30',
                        value === false &&
                          'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30',
                        !hasVal && 'border-dashed border-muted-foreground/25 bg-muted/30'
                      )}
                    >
                      <div class="flex items-center justify-between">
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium">{def.displayLabel}</p>
                          {#if def.description}
                            <p class="mt-0.5 truncate text-xs text-muted-foreground">
                              {def.description}
                            </p>
                          {/if}
                        </div>
                        <div class="shrink-0">
                          {#if value === true}
                            <div
                              class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
                            >
                              <CheckCircle2 class="size-5" />
                              <span class="font-semibold">Yes</span>
                            </div>
                          {:else if value === false}
                            <div class="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                              <CircleDot class="size-5" />
                              <span class="font-semibold">No</span>
                            </div>
                          {:else}
                            <span class="text-sm text-muted-foreground italic">N/A</span>
                          {/if}
                        </div>
                      </div>
                      <!-- Chart visualization if enabled -->
                      {#if def.visualizationConfig?.enableChart}
                        <div class="border-t pt-3">
                          <CustomFieldChart fieldDef={def} {value} {sitioRecord} {selectedYear} />
                        </div>
                      {/if}
                    </div>
                  {:else if def.dataType === 'number'}
                    <!-- Number Field -->
                    <div
                      class={cn(
                        'group relative rounded-lg border p-4 transition-all hover:shadow-md',
                        hasVal
                          ? 'bg-card hover:border-blue-200 dark:hover:border-blue-800'
                          : 'border-dashed border-muted-foreground/25 bg-muted/30'
                      )}
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium">{def.displayLabel}</p>
                          <p class="mt-0.5 hidden text-xs text-muted-foreground">
                            {AGGREGATION_TYPE_LABELS[def.aggregationType]}
                          </p>
                        </div>
                        {#if def.description}
                          <Tooltip.Root>
                            <Tooltip.Trigger>
                              <HelpCircle
                                class="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <p class="max-w-xs text-xs">{def.description}</p>
                            </Tooltip.Content>
                          </Tooltip.Root>
                        {/if}
                      </div>
                      <div class="mt-2">
                        {#if hasVal}
                          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatValue(value, def.dataType)}
                          </p>
                        {:else}
                          <p class="text-sm text-muted-foreground italic">Not recorded</p>
                        {/if}
                      </div>
                      <!-- Chart visualization if enabled -->
                      {#if def.visualizationConfig?.enableChart}
                        <div class="mt-3 border-t pt-3">
                          <CustomFieldChart fieldDef={def} {value} {sitioRecord} {selectedYear} />
                        </div>
                      {/if}
                    </div>
                  {:else if def.dataType === 'date'}
                    <!-- Date Field -->
                    <div
                      class={cn(
                        'group rounded-lg border p-4 transition-all hover:shadow-md',
                        hasVal ? 'bg-card' : 'border-dashed border-muted-foreground/25 bg-muted/30'
                      )}
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class={cn(
                            'flex size-10 items-center justify-center rounded-lg',
                            hasVal ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-muted'
                          )}
                        >
                          <Calendar
                            class={cn(
                              'size-5',
                              hasVal ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium">{def.displayLabel}</p>
                          {#if hasVal}
                            <p class="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                              {formatValue(value, def.dataType)}
                            </p>
                          {:else}
                            <p class="text-sm text-muted-foreground italic">Not recorded</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {:else if def.dataType === 'checkbox'}
                    <!-- Checkbox Field (Multiple Selection) -->
                    {@const selectedItems = Array.isArray(value) ? value : []}
                    <div
                      class={cn(
                        'group rounded-lg border p-4 transition-all hover:shadow-md',
                        hasVal ? 'bg-card' : 'border-dashed border-muted-foreground/25 bg-muted/30'
                      )}
                    >
                      <div class="mb-2 flex items-start justify-between gap-2">
                        <p class="text-sm font-medium">{def.displayLabel}</p>
                        {#if def.description}
                          <Tooltip.Root>
                            <Tooltip.Trigger>
                              <HelpCircle
                                class="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <p class="max-w-xs text-xs">{def.description}</p>
                            </Tooltip.Content>
                          </Tooltip.Root>
                        {/if}
                      </div>
                      {#if hasVal && selectedItems.length > 0}
                        <div class="flex flex-wrap gap-1.5">
                          {#each selectedItems as item}
                            <Badge
                              class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                            >
                              {item}
                            </Badge>
                          {/each}
                        </div>
                        <p class="mt-2 text-xs text-muted-foreground">
                          {selectedItems.length} of {def.validationRules.choices?.length || 0} selected
                        </p>
                      {:else}
                        <p class="text-sm text-muted-foreground italic">None selected</p>
                      {/if}
                      <!-- Chart visualization if enabled -->
                      {#if def.visualizationConfig?.enableChart}
                        <div class="mt-3 border-t pt-3">
                          <CustomFieldChart fieldDef={def} {value} {sitioRecord} {selectedYear} />
                        </div>
                      {/if}
                    </div>
                  {:else if def.dataType === 'radio'}
                    <!-- Radio Field (Single Selection) -->
                    <div
                      class={cn(
                        'group rounded-lg border p-4 transition-all hover:shadow-md',
                        hasVal
                          ? 'border-pink-200 bg-pink-50/50 dark:border-pink-900 dark:bg-pink-950/30'
                          : 'border-dashed border-muted-foreground/25 bg-muted/30'
                      )}
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class={cn(
                            'flex size-10 items-center justify-center rounded-lg',
                            hasVal ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-muted'
                          )}
                        >
                          <CircleCheck
                            class={cn(
                              'size-5',
                              hasVal ? 'text-pink-600 dark:text-pink-400' : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium">{def.displayLabel}</p>
                          {#if hasVal}
                            <p class="font-medium text-pink-600 dark:text-pink-400">
                              {formatValue(value, def.dataType)}
                            </p>
                          {:else}
                            <p class="text-sm text-muted-foreground italic">Not selected</p>
                          {/if}
                        </div>
                      </div>
                      <!-- Chart visualization if enabled -->
                      {#if def.visualizationConfig?.enableChart}
                        <div class="mt-3 border-t pt-3">
                          <CustomFieldChart fieldDef={def} {value} {sitioRecord} {selectedYear} />
                        </div>
                      {/if}
                    </div>
                  {:else if def.dataType === 'array'}
                    <!-- Array/List Field -->
                    {@const items = Array.isArray(value) ? value : []}
                    <div
                      class={cn(
                        'group rounded-lg border p-4 transition-all hover:shadow-md',
                        hasVal ? 'bg-card' : 'border-dashed border-muted-foreground/25 bg-muted/30'
                      )}
                    >
                      <div class="mb-2 flex items-start justify-between gap-2">
                        <p class="text-sm font-medium">{def.displayLabel}</p>
                        {#if def.description}
                          <Tooltip.Root>
                            <Tooltip.Trigger>
                              <HelpCircle
                                class="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <p class="max-w-xs text-xs">{def.description}</p>
                            </Tooltip.Content>
                          </Tooltip.Root>
                        {/if}
                      </div>
                      {#if hasVal && items.length > 0}
                        <ul class="space-y-1">
                          {#each items.slice(0, 5) as item, i}
                            <li class="flex items-center gap-2 text-sm">
                              <span
                                class="flex size-5 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                              >
                                {i + 1}
                              </span>
                              {item}
                            </li>
                          {/each}
                          {#if items.length > 5}
                            <li class="text-xs text-muted-foreground">
                              +{items.length - 5} more items
                            </li>
                          {/if}
                        </ul>
                        <p class="mt-2 text-xs text-muted-foreground">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </p>
                      {:else}
                        <p class="text-sm text-muted-foreground italic">Empty list</p>
                      {/if}
                    </div>
                  {:else}
                    <!-- Text Field (default) -->
                    <div
                      class={cn(
                        'group rounded-lg border p-4 transition-all hover:shadow-md',
                        hasVal ? 'bg-card' : 'border-dashed border-muted-foreground/25 bg-muted/30'
                      )}
                    >
                      <div class="mb-2 flex items-start justify-between gap-2">
                        <p class="text-sm font-medium">{def.displayLabel}</p>
                        {#if def.description}
                          <Tooltip.Root>
                            <Tooltip.Trigger>
                              <HelpCircle
                                class="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <p class="max-w-xs text-xs">{def.description}</p>
                            </Tooltip.Content>
                          </Tooltip.Root>
                        {/if}
                      </div>
                      {#if hasVal}
                        <p class="text-sm">{formatValue(value, def.dataType)}</p>
                      {:else}
                        <p class="text-sm text-muted-foreground italic">Not recorded</p>
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </InfoCard>
        {/if}
      {/each}
    </div>

    <!-- Info Note -->
    <div
      class="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/50"
    >
      <Info class="mt-0.5 size-5 shrink-0 text-violet-600 dark:text-violet-400" />
      <div class="text-sm text-violet-800 dark:text-violet-200">
        <p class="font-medium">About Supplementary Data</p>
        <p class="mt-1 text-violet-700 dark:text-violet-300">
          These fields are defined by administrators to capture additional monitoring data specific
          to current program needs. The available fields may change over time as requirements
          evolve.
        </p>
      </div>
    </div>
  </div>
{/if}
