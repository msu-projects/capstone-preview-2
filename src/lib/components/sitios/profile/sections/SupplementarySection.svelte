<script lang="ts">
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import type { CustomFieldDefinition, SitioProfile } from '$lib/types';
  import { AGGREGATION_TYPE_LABELS } from '$lib/types';
  import { cn } from '$lib/utils';
  import { getActiveCustomFieldDefinitions } from '$lib/utils/custom-fields-storage';
  import {
    Calendar,
    CheckCircle2,
    CircleCheck,
    CircleDot,
    FileText,
    Hash,
    HelpCircle,
    Info,
    Layers,
    List,
    ListChecks,
    ToggleLeft,
    Type
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  interface Props {
    sitio: SitioProfile;
  }

  const { sitio }: Props = $props();

  let definitions = $state<CustomFieldDefinition[]>([]);

  onMount(() => {
    definitions = getActiveCustomFieldDefinitions();
  });

  // Get icon for data type
  function getIcon(dataType: CustomFieldDefinition['dataType']) {
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
  function getFieldValue(fieldId: string): unknown {
    return sitio.customFields?.[fieldId];
  }

  // Check if field has a value
  function hasValue(value: unknown, dataType: CustomFieldDefinition['dataType']): boolean {
    if (value === undefined || value === null) return false;
    if (dataType === 'text' && value === '') return false;
    if (dataType === 'boolean') return true; // false is still a valid value
    if (dataType === 'date' && value === '') return false;
    if (dataType === 'array' && Array.isArray(value)) return value.length > 0;
    if (dataType === 'checkbox' && Array.isArray(value)) return value.length > 0;
    if (dataType === 'radio' && value === '') return false;
    return true;
  }

  // Separate fields by type for different visualization needs
  const numberFields = $derived(definitions.filter((d) => d.dataType === 'number'));
  const booleanFields = $derived(definitions.filter((d) => d.dataType === 'boolean'));
  const textFields = $derived(definitions.filter((d) => d.dataType === 'text'));
  const dateFields = $derived(definitions.filter((d) => d.dataType === 'date'));
  const arrayFields = $derived(definitions.filter((d) => d.dataType === 'array'));
  const checkboxFields = $derived(definitions.filter((d) => d.dataType === 'checkbox'));
  const radioFields = $derived(definitions.filter((d) => d.dataType === 'radio'));

  // Prepare data for number fields bar chart
  const numberChartData = $derived(
    numberFields
      .map((def) => {
        const value = getFieldValue(def.id);
        return {
          label: def.displayLabel,
          value: typeof value === 'number' ? value : 0
        };
      })
      .filter((d) => d.value > 0)
  );

  // Prepare radar chart data for number fields (normalize to 0-100 scale)
  const radarChartData = $derived(() => {
    const maxValues = new Map<string, number>();
    // Get reasonable max for each field (could be enhanced with actual max from validation rules)
    numberFields.forEach((def) => {
      const value = getFieldValue(def.id);
      if (typeof value === 'number') {
        maxValues.set(def.id, Math.max(value * 1.5, 100)); // 150% of current or 100
      }
    });

    return numberFields
      .map((def) => {
        const value = getFieldValue(def.id);
        const max = maxValues.get(def.id) || 100;
        const normalized = typeof value === 'number' ? Math.min((value / max) * 100, 100) : 0;
        return {
          label:
            def.displayLabel.length > 15 ? def.displayLabel.slice(0, 15) + '...' : def.displayLabel,
          value: normalized
        };
      })
      .filter((d) => d.value > 0);
  });

  // Prepare data for boolean fields donut chart
  const booleanChartData = $derived(() => {
    const yesCount = booleanFields.filter((def) => getFieldValue(def.id) === true).length;
    const noCount = booleanFields.filter((def) => getFieldValue(def.id) === false).length;
    const notRecorded = booleanFields.length - yesCount - noCount;

    return [
      { label: 'Yes', value: yesCount, color: 'hsl(142, 76%, 36%)' },
      { label: 'No', value: noCount, color: 'hsl(0, 84%, 60%)' },
      ...(notRecorded > 0
        ? [{ label: 'Not recorded', value: notRecorded, color: 'hsl(220, 9%, 46%)' }]
        : [])
    ].filter((d) => d.value > 0);
  });

  const hasAnyData = $derived(
    definitions.some((def) => hasValue(getFieldValue(def.id), def.dataType))
  );

  // Statistics
  const fieldsRecordedCount = $derived(
    definitions.filter((d) => hasValue(getFieldValue(d.id), d.dataType)).length
  );
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
  <div class="space-y-8">
    <!-- Summary Statistics -->
    <section>
      <div class="mb-4 flex items-center gap-2">
        <div
          class="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400"
        >
          <Layers class="size-4" />
        </div>
        <h3 class="text-lg font-semibold">Supplementary Data</h3>
      </div>

      <!-- Overview Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Total Fields Card -->
        <Card.Root class="relative overflow-hidden py-0">
          <div class="absolute top-0 right-0 h-1 w-full bg-violet-500 opacity-80"></div>
          <Card.Content class="p-5 sm:p-7">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Fields</p>
                <p
                  class="mt-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100"
                >
                  {definitions.length}
                </p>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Configured</p>
              </div>
              <div class="shrink-0 rounded-xl bg-violet-100 p-3 dark:bg-violet-900/30">
                <Layers class="size-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Fields Recorded Card -->
        <Card.Root class="relative overflow-hidden py-0">
          <div class="absolute top-0 right-0 h-1 w-full bg-emerald-500 opacity-80"></div>
          <Card.Content class="p-5 sm:p-7">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Fields Recorded
                </p>
                <p
                  class="mt-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100"
                >
                  {fieldsRecordedCount}
                </p>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  of {definitions.length} fields
                </p>
              </div>
              <div class="shrink-0 rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <CheckCircle2 class="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        {#if numberFields.length > 0}
          <!-- Numeric Fields Card -->
          <Card.Root class="relative overflow-hidden py-0">
            <div class="absolute top-0 right-0 h-1 w-full bg-blue-500 opacity-80"></div>
            <Card.Content class="p-5 sm:p-7">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Numeric Fields
                  </p>
                  <p
                    class="mt-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100"
                  >
                    {numberFields.length}
                  </p>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    For quantitative data
                  </p>
                </div>
                <div class="shrink-0 rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Hash class="size-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/if}

        {#if booleanFields.length > 0}
          <!-- Yes/No Fields Card -->
          <Card.Root class="relative overflow-hidden py-0">
            <div class="absolute top-0 right-0 h-1 w-full bg-amber-500 opacity-80"></div>
            <Card.Content class="p-5 sm:p-7">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Yes/No Fields
                  </p>
                  <p
                    class="mt-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100"
                  >
                    {booleanFields.length}
                  </p>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    For categorical data
                  </p>
                </div>
                <div class="shrink-0 rounded-xl bg-amber-100 p-3 dark:bg-amber-900/30">
                  <ToggleLeft class="size-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </section>

    <!-- Visualizations -->
    {#if hasAnyData}
      <section class="hidden space-y-6">
        <!-- Primary Visualizations -->
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Number Fields Bar Chart -->
          <!-- {#if numberChartData.length > 0}
            <Card.Root class="col-span-2 shadow-sm">
              <Card.Header class="pb-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <BarChart3 class="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Card.Title class="text-base">Numeric Data Overview</Card.Title>
                      <Card.Description class="text-xs"
                        >Values for all numeric fields</Card.Description
                      >
                    </div>
                  </div>
                  <Badge variant="outline" class="text-xs">{numberChartData.length} fields</Badge>
                </div>
              </Card.Header>
              <Card.Content class="pt-4">
                <BarChart data={numberChartData} height={220} showGrid={true} />
              </Card.Content>
            </Card.Root>
          {/if} -->

          <!-- Radar Chart for Numeric Data (only if we have 3+ fields) -->
          <!-- {#if radarChartData().length >= 3}
            <Card.Root class="shadow-sm">
              <Card.Header class="pb-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      class="flex size-8 items-center justify-center rounded-lg bg-violet-500/10"
                    >
                      <TrendingUp class="size-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <Card.Title class="text-base">Data Profile</Card.Title>
                      <Card.Description class="text-xs">Relative scale comparison</Card.Description>
                    </div>
                  </div>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <HelpCircle class="size-4 text-muted-foreground" />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <p class="max-w-xs text-xs">
                        Shows how this sitio's values compare on a normalized scale (0-100%)
                      </p>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </div>
              </Card.Header>
              <Card.Content class="pt-2">
                <RadarChart
                  data={radarChartData()}
                  height={220}
                  color="hsl(280, 70%, 60%)"
                  fillOpacity={0.3}
                />
              </Card.Content>
            </Card.Root>
          {:else if booleanFields.length > 0 && booleanChartData().some((d) => d.value > 0)} -->
          <!-- Boolean Fields Donut Chart (shown if not enough for radar) -->
          <!-- <Card.Root class="shadow-sm">
              <Card.Header class="pb-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <PieChart class="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <Card.Title class="text-base">Yes/No Field Summary</Card.Title>
                      <Card.Description class="text-xs"
                        >Distribution of boolean fields</Card.Description
                      >
                    </div>
                  </div>
                </div>
              </Card.Header>
              <Card.Content class="pt-2">
                <div class="flex justify-center">
                  <DonutChart
                    data={booleanChartData()}
                    height={200}
                    showLegend
                    centerLabel="Fields"
                  />
                </div>
              </Card.Content>
            </Card.Root>
          {/if} -->
        </div>

        <!-- Boolean Fields with Radar (if we had radar above) -->
        <!-- {#if radarChartData().length >= 3 && booleanFields.length > 0 && booleanChartData().some((d) => d.value > 0)}
          <Card.Root class="shadow-sm">
            <Card.Header class="pb-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <PieChart class="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <Card.Title class="text-base">Yes/No Field Summary</Card.Title>
                    <Card.Description class="text-xs"
                      >Status of categorical indicators</Card.Description
                    >
                  </div>
                </div>
                <Badge variant="outline" class="text-xs">{booleanFields.length} fields</Badge>
              </div>
            </Card.Header>
            <Card.Content class="pt-4">
              <div class="grid gap-6 md:grid-cols-2">
                <div class="flex justify-center">
                  <DonutChart
                    data={booleanChartData()}
                    height={180}
                    showLegend={false}
                    centerLabel="Total"
                  />
                </div>
                <div class="flex flex-col justify-center gap-3">
                  {#each booleanFields as def (def.id)}
                    {@const value = getFieldValue(def.id)}
                    <div class="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
                      <span class="text-sm font-medium">{def.displayLabel}</span>
                      {#if value === true}
                        <Badge
                          class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          >Yes</Badge
                        >
                      {:else if value === false}
                        <Badge
                          class="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          >No</Badge
                        >
                      {:else}
                        <Badge variant="outline" class="text-muted-foreground">N/A</Badge>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/if} -->
      </section>
    {/if}

    <!-- Detailed Field Values -->
    <section>
      <div class="mb-4 flex items-center gap-2">
        <FileText class="size-5 text-muted-foreground" />
        <h4 class="font-medium">All Field Values</h4>
        <Badge variant="secondary" class="text-xs">
          {fieldsRecordedCount}/{definitions.length} recorded
        </Badge>
      </div>

      <!-- Group by data type for better organization -->
      <div class="space-y-6">
        <!-- Numeric Fields -->
        {#if numberFields.length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <Hash class="size-4 text-blue-500" />
              <span class="text-sm font-medium text-muted-foreground">Numeric Fields</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {#each numberFields as def (def.id)}
                {@const value = getFieldValue(def.id)}
                {@const hasVal = hasValue(value, def.dataType)}
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
                      <p class="mt-0.5 text-xs text-muted-foreground">
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
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Boolean Fields -->
        {#if booleanFields.length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <ToggleLeft class="size-4 text-amber-500" />
              <span class="text-sm font-medium text-muted-foreground">Yes/No Fields</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {#each booleanFields as def (def.id)}
                {@const value = getFieldValue(def.id)}
                {@const hasVal = hasValue(value, def.dataType)}
                <div
                  class={cn(
                    'group relative flex items-center justify-between gap-3 rounded-lg border p-4 transition-all hover:shadow-md',
                    value === true &&
                      'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30',
                    value === false &&
                      'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30',
                    !hasVal && 'border-dashed border-muted-foreground/25 bg-muted/30'
                  )}
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{def.displayLabel}</p>
                    {#if def.description}
                      <p class="mt-0.5 truncate text-xs text-muted-foreground">{def.description}</p>
                    {/if}
                  </div>
                  <div class="shrink-0">
                    {#if value === true}
                      <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
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
              {/each}
            </div>
          </div>
        {/if}

        <!-- Text Fields -->
        {#if textFields.length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <Type class="size-4 text-violet-500" />
              <span class="text-sm font-medium text-muted-foreground">Text Fields</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              {#each textFields as def (def.id)}
                {@const value = getFieldValue(def.id)}
                {@const hasVal = hasValue(value, def.dataType)}
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
              {/each}
            </div>
          </div>
        {/if}

        <!-- Date Fields -->
        {#if dateFields.length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <Calendar class="size-4 text-cyan-500" />
              <span class="text-sm font-medium text-muted-foreground">Date Fields</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {#each dateFields as def (def.id)}
                {@const value = getFieldValue(def.id)}
                {@const hasVal = hasValue(value, def.dataType)}
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
              {/each}
            </div>
          </div>
        {/if}

        <!-- Checkbox Fields (Multiple Selection) -->
        {#if checkboxFields.length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <ListChecks class="size-4 text-indigo-500" />
              <span class="text-sm font-medium text-muted-foreground"
                >Checkbox Fields (Multiple Selection)</span
              >
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              {#each checkboxFields as def (def.id)}
                {@const value = getFieldValue(def.id)}
                {@const hasVal = hasValue(value, def.dataType)}
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
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Radio Fields (Single Selection) -->
        {#if radioFields.length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <CircleCheck class="size-4 text-pink-500" />
              <span class="text-sm font-medium text-muted-foreground"
                >Radio Fields (Single Selection)</span
              >
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {#each radioFields as def (def.id)}
                {@const value = getFieldValue(def.id)}
                {@const hasVal = hasValue(value, def.dataType)}
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
                        <p class="text-sm font-medium text-pink-600 dark:text-pink-400">
                          {formatValue(value, def.dataType)}
                        </p>
                      {:else}
                        <p class="text-sm text-muted-foreground italic">Not selected</p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Array/List Fields -->
        {#if arrayFields.length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <List class="size-4 text-teal-500" />
              <span class="text-sm font-medium text-muted-foreground">List Fields</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              {#each arrayFields as def (def.id)}
                {@const value = getFieldValue(def.id)}
                {@const hasVal = hasValue(value, def.dataType)}
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
                      {#each items as item, i}
                        <li class="flex items-center gap-2 text-sm">
                          <span
                            class="flex size-5 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                          >
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      {/each}
                    </ul>
                    <p class="mt-2 text-xs text-muted-foreground">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                  {:else}
                    <p class="text-sm text-muted-foreground italic">Empty list</p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>

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
