<script lang="ts">
  import GroupedBarChart from '$lib/components/charts/GroupedBarChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import * as Tabs from '$lib/components/ui/tabs';
  import type { SitioRecord } from '$lib/types';
  import { cn } from '$lib/utils';
  import {
    getComparisonEntities,
    getComparisonLevel,
    prepareEntityComparisonBarData,
    type ComparisonEntity,
    type ComparisonLevel,
    type MultiSeriesTimeData,
    type YearlyMetrics
  } from '$lib/utils/sitio-chart-aggregation';
  import { BarChart3, GitCompare, Search, TrendingUp } from '@lucide/svelte';
  import type { Component } from 'svelte';

  interface Props {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description?: string;
    icon: Component;
    iconBgColor?: string;
    iconTextColor?: string;
    // Data for yearly trend view
    trendSeries: MultiSeriesTimeData[];
    trendCategories: string[];
    // Comparison configuration
    sitios: SitioRecord[];
    selectedMunicipality: string;
    selectedBarangay: string;
    selectedYear: number;
    // Metrics to compare
    metrics: (keyof YearlyMetrics)[];
    yAxisFormatter?: (val: number) => string;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    title,
    description,
    icon: Icon,
    iconBgColor = 'bg-blue-50',
    iconTextColor = 'text-blue-600',
    trendSeries,
    trendCategories,
    sitios,
    selectedMunicipality,
    selectedBarangay,
    selectedYear,
    metrics,
    yAxisFormatter = (val) => val.toLocaleString()
  }: Props = $props();

  // Tab state
  let activeTab = $state('trend');

  // Comparison state
  let selectedEntityIds = $state<string[]>([]);
  let searchQuery = $state('');

  // Determine comparison level and available entities
  const comparisonLevel = $derived<ComparisonLevel>(
    getComparisonLevel(selectedMunicipality, selectedBarangay)
  );

  const availableEntities = $derived<ComparisonEntity[]>(
    getComparisonEntities(sitios, comparisonLevel)
  );

  // Filter entities by search query
  const filteredEntities = $derived.by(() => {
    if (!searchQuery.trim()) return availableEntities;
    const query = searchQuery.toLowerCase();

    return availableEntities.filter((e) => e.name.toLowerCase().includes(query));
  });

  // Entity names map for chart labels
  const entityNamesMap = $derived.by(() => {
    const map = new Map<string, string>();
    for (const entity of availableEntities) {
      map.set(entity.id, entity.name);
    }
    return map;
  });

  // Prepare comparison bar chart data (single year comparison)
  const comparisonChartData = $derived.by(() => {
    if (selectedEntityIds.length === 0) {
      return { categories: [], series: [] };
    }
    return prepareEntityComparisonBarData(
      sitios,
      selectedEntityIds,
      comparisonLevel,
      metrics,
      entityNamesMap,
      selectedYear
    );
  });

  // Level labels for UI
  const levelLabels: Record<ComparisonLevel, { singular: string; plural: string }> = {
    municipality: { singular: 'Municipality', plural: 'Municipalities' },
    barangay: { singular: 'Barangay', plural: 'Barangays' },
    sitio: { singular: 'Sitio', plural: 'Sitios' }
  };

  // Toggle entity selection
  function toggleEntity(entityId: string) {
    if (selectedEntityIds.includes(entityId)) {
      selectedEntityIds = selectedEntityIds.filter((id) => id !== entityId);
    } else if (selectedEntityIds.length < 5) {
      selectedEntityIds = [...selectedEntityIds, entityId];
    }
  }

  // Check if entity is selected
  function isSelected(entityId: string): boolean {
    return selectedEntityIds.includes(entityId);
  }

  // Reset state when modal closes
  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      // Reset state on close
      selectedEntityIds = [];
      searchQuery = '';
      activeTab = 'trend';
    }
    onOpenChange?.(newOpen);
  }

  // Show search if more than 10 entities
  const showSearch = $derived(availableEntities.length > 10);
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-4xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class={cn('rounded-lg p-2', iconBgColor, 'dark:bg-opacity-20')}>
          <Icon class={cn('size-5', iconTextColor, 'dark:opacity-80')} />
        </div>
        {title}
      </Dialog.Title>
      {#if description}
        <Dialog.Description>
          {description}
        </Dialog.Description>
      {/if}
    </Dialog.Header>

    <Tabs.Root bind:value={activeTab} class="mt-4">
      <Tabs.List class="w-full">
        <Tabs.Trigger value="trend" class="flex-1 gap-2">
          <TrendingUp class="size-4" />
          <span>Yearly Trend</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="compare" class="flex-1 gap-2">
          <GitCompare class="size-4" />
          <span>Compare {levelLabels[comparisonLevel].plural}</span>
        </Tabs.Trigger>
      </Tabs.List>

      <!-- Yearly Trend Tab -->
      <Tabs.Content value="trend" class="mt-4">
        <div
          class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
        >
          <LineChart
            series={trendSeries}
            categories={trendCategories}
            height={350}
            curve="smooth"
            showLegend={true}
            {yAxisFormatter}
          />
        </div>
        <p class="mt-3 text-center text-xs text-muted-foreground">
          Aggregated data across {sitios.length} sitios over {trendCategories.length} year{trendCategories.length !==
          1
            ? 's'
            : ''}
        </p>
      </Tabs.Content>

      <!-- Comparison Tab -->
      <Tabs.Content value="compare" class="mt-4 space-y-4">
        <!-- Entity Selection -->
        <div
          class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
        >
          <div class="mb-3 flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Select {levelLabels[comparisonLevel].plural} to Compare
            </h4>
            <span class="text-xs text-muted-foreground">
              {selectedEntityIds.length}/5 selected
            </span>
          </div>

          {#if showSearch}
            <div class="relative mb-3">
              <Search
                class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                bind:value={searchQuery}
                placeholder="Search {levelLabels[comparisonLevel].plural.toLowerCase()}..."
                class="pl-9"
              />
            </div>
          {/if}

          <ScrollArea class="h-40 rounded-md border border-slate-200 p-3 dark:border-slate-700">
            {#if filteredEntities.length === 0}
              <p class="py-4 text-center text-sm text-muted-foreground">
                No {levelLabels[comparisonLevel].plural.toLowerCase()} found
              </p>
            {:else}
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {#each filteredEntities as entity (entity.id)}
                  {@const selected = isSelected(entity.id)}
                  {@const disabled = !selected && selectedEntityIds.length >= 5}
                  <label
                    class={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors',
                      selected
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-transparent hover:bg-muted/50',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleEntity(entity.id)}
                      {disabled}
                    />
                    <span class="truncate font-medium">{entity.name}</span>
                    {#if comparisonLevel !== 'sitio'}
                      <span class="ml-auto shrink-0 text-xs text-muted-foreground">
                        ({entity.sitioCount})
                      </span>
                    {/if}
                  </label>
                {/each}
              </div>
            {/if}
          </ScrollArea>
        </div>

        <!-- Comparison Chart -->
        <div
          class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
        >
          {#if selectedEntityIds.length === 0}
            <div class="flex h-75 flex-col items-center justify-center gap-3 text-muted-foreground">
              <BarChart3 class="size-12 opacity-50" />
              <p class="text-sm">
                Select up to 5 {levelLabels[comparisonLevel].plural.toLowerCase()} above to compare
              </p>
            </div>
          {:else if comparisonChartData.categories.length === 0}
            <div class="flex h-75 flex-col items-center justify-center gap-3 text-muted-foreground">
              <BarChart3 class="size-12 opacity-50" />
              <p class="text-sm">
                No data available for the selected {levelLabels[
                  comparisonLevel
                ].plural.toLowerCase()}
              </p>
            </div>
          {:else}
            <GroupedBarChart
              series={comparisonChartData.series}
              categories={comparisonChartData.categories}
              height={300}
              orientation="vertical"
              {yAxisFormatter}
            />
          {/if}
        </div>

        {#if selectedEntityIds.length > 0}
          <p class="text-center text-xs text-muted-foreground">
            Comparing {selectedEntityIds.length}
            {selectedEntityIds.length === 1
              ? levelLabels[comparisonLevel].singular.toLowerCase()
              : levelLabels[comparisonLevel].plural.toLowerCase()} for {selectedYear}
          </p>
        {/if}
      </Tabs.Content>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
