<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import * as Select from '$lib/components/ui/select';
  import { Separator } from '$lib/components/ui/separator';
  import * as Sheet from '$lib/components/ui/sheet';
  import { getBarangaysForMunicipality, getMunicipalities } from '$lib/config/location-data';
  import {
    getCategorizedIndicators,
    getIndicator,
    SORT_PRESETS,
    type SortPreset
  } from '$lib/config/sitio-indicators';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import {
    buildURLWithConfig,
    DEFAULT_LIST_CONFIG,
    MAX_SORT_INDICATORS,
    type FilterConfig,
    type SitioListConfig
  } from '$lib/utils/sitio-sorting';
  import {
    ArrowDown,
    ArrowUp,
    Check,
    ChevronDown,
    ChevronsDownUp,
    ChevronsUpDown,
    ChevronUp,
    FilterX,
    GripVertical,
    Search,
    SlidersHorizontal,
    Sparkles,
    X
  } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    /** Current configuration */
    config: SitioListConfig;
    /** Callback when config changes */
    onConfigChange: (config: SitioListConfig) => void;
    /** Base path for URL building */
    basePath?: string;
    /** Mode for styling/behavior differences */
    mode?: 'admin' | 'public';
    /** Whether to sync with URL */
    syncWithUrl?: boolean;
  }

  let {
    config = $bindable(),
    onConfigChange,
    basePath = '',
    mode = 'admin',
    syncWithUrl = true
  }: Props = $props();

  const isMobile = new IsMobile();
  const categorizedIndicators = getCategorizedIndicators();
  const municipalities = getMunicipalities();

  // Local state
  let isSheetOpen = $state(false);
  let expandedCategories = new SvelteSet<string>();
  let localSearchQuery = $state(config.filters.searchQuery);
  let isIndicatorSectionOpen = $state(true);
  let expandedMobileCategories = new SvelteSet<string>();

  // Derived values
  const barangays = $derived(
    config.filters.municipality !== 'all'
      ? getBarangaysForMunicipality(config.filters.municipality)
      : []
  );

  const selectedIndicatorKeys = $derived(new Set(config.sortIndicators.map((s) => s.key)));

  const hasActiveFilters = $derived(
    config.filters.searchQuery !== '' ||
      config.filters.municipality !== 'all' ||
      config.filters.barangay !== 'all' ||
      config.filters.classifications.gida !== null ||
      config.filters.classifications.indigenous !== null ||
      config.filters.classifications.conflict !== null ||
      config.sortIndicators.length > 0
  );

  const allCategoriesCollapsed = $derived(expandedCategories.size === 0);
  const allMobileCategoriesCollapsed = $derived(expandedMobileCategories.size === 0);

  // Update config and optionally sync to URL
  function updateConfig(newConfig: SitioListConfig) {
    config = newConfig;
    onConfigChange(newConfig);

    if (syncWithUrl && basePath) {
      const url = buildURLWithConfig(basePath, newConfig);
      goto(url, { replaceState: true, noScroll: true, keepFocus: true });
    }
  }

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleSearchInput(value: string) {
    localSearchQuery = value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateConfig({
        ...config,
        filters: { ...config.filters, searchQuery: value }
      });
    }, 300);
  }

  // Toggle indicator selection
  function toggleIndicator(indicatorKey: string) {
    const existing = config.sortIndicators.find((s) => s.key === indicatorKey);

    if (existing) {
      // Remove indicator
      updateConfig({
        ...config,
        sortIndicators: config.sortIndicators.filter((s) => s.key !== indicatorKey)
      });
    } else {
      // Add indicator if under limit
      if (config.sortIndicators.length >= MAX_SORT_INDICATORS) {
        toast.error(`Maximum ${MAX_SORT_INDICATORS} sort indicators allowed`);
        return;
      }

      const indicator = getIndicator(indicatorKey);
      if (indicator) {
        updateConfig({
          ...config,
          sortIndicators: [
            ...config.sortIndicators,
            { key: indicatorKey, order: indicator.defaultOrder }
          ]
        });
      }
    }
  }

  // Toggle sort direction
  function toggleSortDirection(indicatorKey: string) {
    updateConfig({
      ...config,
      sortIndicators: config.sortIndicators.map((s) =>
        s.key === indicatorKey ? { ...s, order: s.order === 'asc' ? 'desc' : 'asc' } : s
      )
    });
  }

  // Move indicator up in priority
  function moveIndicatorUp(index: number) {
    if (index <= 0) return;
    const newIndicators = [...config.sortIndicators];
    [newIndicators[index - 1], newIndicators[index]] = [
      newIndicators[index],
      newIndicators[index - 1]
    ];
    updateConfig({ ...config, sortIndicators: newIndicators });
  }

  // Move indicator down in priority
  function moveIndicatorDown(index: number) {
    if (index >= config.sortIndicators.length - 1) return;
    const newIndicators = [...config.sortIndicators];
    [newIndicators[index], newIndicators[index + 1]] = [
      newIndicators[index + 1],
      newIndicators[index]
    ];
    updateConfig({ ...config, sortIndicators: newIndicators });
  }

  // Remove indicator from selection
  function removeIndicator(indicatorKey: string) {
    updateConfig({
      ...config,
      sortIndicators: config.sortIndicators.filter((s) => s.key !== indicatorKey)
    });
  }

  // Apply preset
  function applyPreset(preset: SortPreset) {
    updateConfig({
      ...config,
      sortIndicators: preset.indicators
    });
    toast.success(`Applied "${preset.label}" preset`);
  }

  // Update municipality filter
  function handleMunicipalityChange(value: string) {
    updateConfig({
      ...config,
      filters: {
        ...config.filters,
        municipality: value,
        barangay: 'all' // Reset barangay when municipality changes
      }
    });
  }

  // Update barangay filter
  function handleBarangayChange(value: string) {
    updateConfig({
      ...config,
      filters: { ...config.filters, barangay: value }
    });
  }

  // Toggle classification filter
  function toggleClassification(key: 'gida' | 'indigenous' | 'conflict') {
    const current = config.filters.classifications[key];
    // Cycle: null -> true -> false -> null
    let next: boolean | null;
    if (current === null) next = true;
    else if (current === true) next = false;
    else next = null;

    updateConfig({
      ...config,
      filters: {
        ...config.filters,
        classifications: { ...config.filters.classifications, [key]: next }
      }
    });
  }

  // Clear all filters
  function clearAllFilters() {
    localSearchQuery = '';
    updateConfig({
      ...DEFAULT_LIST_CONFIG,
      year: config.year
    });
  }

  // Toggle category expansion
  function toggleCategory(categoryKey: string) {
    if (expandedCategories.has(categoryKey)) {
      expandedCategories.delete(categoryKey);
    } else {
      expandedCategories.add(categoryKey);
    }
  }

  // Get classification badge variant
  function getClassificationVariant(
    value: boolean | null
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (value === true) return 'default';
    if (value === false) return 'destructive';
    return 'outline';
  }

  function getClassificationLabel(key: string, value: boolean | null): string {
    const labels: Record<string, string> = {
      gida: 'GIDA',
      indigenous: 'Indigenous',
      conflict: 'Conflict-Affected'
    };
    const prefix = value === null ? '' : value ? '✓ ' : '✗ ';
    return prefix + labels[key];
  }

  // Reset all sort indicators
  function resetIndicators() {
    updateConfig({
      ...config,
      sortIndicators: []
    });
    toast.success('Cleared all sort indicators');
  }

  // Toggle all categories
  function toggleAllCategories() {
    if (allCategoriesCollapsed) {
      // Expand all
      categorizedIndicators.forEach(({ category }) => {
        expandedCategories.add(category.key);
      });
    } else {
      // Collapse all
      expandedCategories.clear();
    }
  }

  // Toggle all mobile categories
  function toggleAllMobileCategories() {
    if (allMobileCategoriesCollapsed) {
      // Expand all
      categorizedIndicators.forEach(({ category }) => {
        expandedMobileCategories.add(category.key);
      });
    } else {
      // Collapse all
      expandedMobileCategories.clear();
    }
  }
</script>

<!-- Desktop Filters Panel -->
{#if !isMobile.current}
  <div class="space-y-4">
    <!-- Search and Location Filters Row -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Search Input -->
      <div class="relative min-w-50 flex-1">
        <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sitios..."
          value={localSearchQuery}
          oninput={(e) => handleSearchInput(e.currentTarget.value)}
          class="pl-10"
        />
      </div>

      <!-- Municipality Select -->
      <Select.Root
        type="single"
        value={config.filters.municipality}
        onValueChange={handleMunicipalityChange}
      >
        <Select.Trigger class="w-44">
          {config.filters.municipality === 'all'
            ? 'All Municipalities'
            : config.filters.municipality}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all">All Municipalities</Select.Item>
          {#each municipalities as municipality}
            <Select.Item value={municipality}>{municipality}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <!-- Barangay Select -->
      <Select.Root
        type="single"
        value={config.filters.barangay}
        onValueChange={handleBarangayChange}
        disabled={config.filters.municipality === 'all'}
      >
        <Select.Trigger class="w-44">
          {config.filters.barangay === 'all' ? 'All Barangays' : config.filters.barangay}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all">All Barangays</Select.Item>
          {#each barangays as brgy}
            <Select.Item value={brgy}>{brgy}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <!-- Classification Toggles -->
      <div class="flex gap-1.5">
        {#each ['gida', 'indigenous', 'conflict'] as key}
          {@const value =
            config.filters.classifications[key as keyof FilterConfig['classifications']]}
          <Button
            variant={getClassificationVariant(value)}
            size="sm"
            onclick={() => toggleClassification(key as 'gida' | 'indigenous' | 'conflict')}
            class="text-xs"
          >
            {getClassificationLabel(key, value)}
          </Button>
        {/each}
      </div>

      <!-- Clear Filters -->
      {#if hasActiveFilters}
        <Button variant="ghost" size="icon" onclick={clearAllFilters} title="Clear all filters">
          <FilterX class="size-4" />
        </Button>
      {/if}
    </div>

    <!-- Sort Indicators Section -->
    <Collapsible.Root bind:open={isIndicatorSectionOpen}>
      <div class="rounded-lg border bg-card">
        <Collapsible.Trigger
          class="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50"
        >
          <div class="flex items-center gap-2">
            <SlidersHorizontal class="size-4" />
            <span class="font-medium">Sort & Rank by Indicators</span>
            {#if config.sortIndicators.length > 0}
              <Badge variant="secondary" class="ml-2">
                {config.sortIndicators.length} selected
              </Badge>
            {/if}
          </div>
          <ChevronDown
            class="size-4 transition-transform duration-200 in-data-[state=open]:rotate-180"
          />
        </Collapsible.Trigger>

        <Collapsible.Content>
          <Separator />
          <div class="p-4">
            <!-- Presets -->
            <div class="mb-4">
              <Label class="mb-2 block text-sm font-medium text-muted-foreground"
                >Quick Presets</Label
              >
              <div class="flex flex-wrap gap-2">
                {#each SORT_PRESETS as preset}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => applyPreset(preset)}
                    title={preset.description}
                  >
                    <Sparkles class="mr-1.5 size-3" />
                    {preset.label}
                  </Button>
                {/each}
                {#if config.sortIndicators.length > 0}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={resetIndicators}
                    title="Clear all sort indicators"
                    class="text-muted-foreground hover:text-destructive"
                  >
                    <X class="mr-1.5 size-3" />
                    Reset All
                  </Button>
                {/if}
              </div>
            </div>

            <Separator class="my-4" />

            <!-- Selected Indicators (Reorderable) -->
            {#if config.sortIndicators.length > 0}
              <div class="mb-4">
                <Label class="mb-2 block text-sm font-medium text-muted-foreground">
                  Sort Priority (use arrows to reorder)
                </Label>
                <div class="space-y-1.5">
                  {#each config.sortIndicators as sortConfig, index (sortConfig.key)}
                    {@const indicator = getIndicator(sortConfig.key)}
                    {#if indicator}
                      <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                        <GripVertical class="size-4 text-muted-foreground" />
                        <Badge variant="outline" class="font-mono text-xs">
                          #{index + 1}
                        </Badge>
                        <span class="flex-1 text-sm font-medium">{indicator.label}</span>
                        <div class="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            class="size-7"
                            onclick={() => moveIndicatorUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp class="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="size-7"
                            onclick={() => moveIndicatorDown(index)}
                            disabled={index === config.sortIndicators.length - 1}
                          >
                            <ChevronDown class="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="size-7"
                            onclick={() => toggleSortDirection(sortConfig.key)}
                            title={sortConfig.order === 'asc' ? 'Ascending' : 'Descending'}
                          >
                            {#if sortConfig.order === 'asc'}
                              <ArrowUp class="size-4" />
                            {:else}
                              <ArrowDown class="size-4" />
                            {/if}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="size-7 hover:bg-destructive/10 hover:text-destructive"
                            onclick={() => removeIndicator(sortConfig.key)}
                          >
                            <X class="size-4" />
                          </Button>
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
              <Separator class="my-4" />
            {/if}

            <!-- Indicator Categories -->
            <div class="mb-2 flex items-center justify-between">
              <Label class="text-sm font-medium text-muted-foreground">
                Available Indicators ({MAX_SORT_INDICATORS - config.sortIndicators.length} more can be
                selected)
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onclick={toggleAllCategories}
                class="gap-1.5 text-xs"
                title={allCategoriesCollapsed ? 'Expand all categories' : 'Collapse all categories'}
              >
                {#if allCategoriesCollapsed}
                  <ChevronsDownUp class="size-3.5" />
                  Expand All
                {:else}
                  <ChevronsUpDown class="size-3.5" />
                  Collapse All
                {/if}
              </Button>
            </div>
            <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {#each categorizedIndicators as { category, indicators }}
                <Collapsible.Root
                  open={expandedCategories.has(category.key)}
                  onOpenChange={(open) => {
                    if (open) {
                      expandedCategories.add(category.key);
                    } else {
                      expandedCategories.delete(category.key);
                    }
                  }}
                >
                  <div class="rounded-md border">
                    <Collapsible.Trigger
                      class="flex w-full items-center justify-between rounded-t-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <span>{category.label}</span>
                      <ChevronDown
                        class="size-4 transition-transform duration-200 in-data-[state=open]:rotate-180"
                      />
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <div class="max-h-48 space-y-0.5 overflow-y-auto border-t p-2">
                        {#each indicators as indicator}
                          {@const isSelected = selectedIndicatorKeys.has(indicator.key)}
                          <button
                            type="button"
                            class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted {isSelected
                              ? 'bg-primary/10'
                              : ''}"
                            onclick={() => toggleIndicator(indicator.key)}
                          >
                            <div
                              class="flex size-4 items-center justify-center rounded border {isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/30'}"
                            >
                              {#if isSelected}
                                <Check class="size-3" />
                              {/if}
                            </div>
                            <span class="flex-1 truncate" title={indicator.description}>
                              {indicator.shortLabel}
                            </span>
                          </button>
                        {/each}
                      </div>
                    </Collapsible.Content>
                  </div>
                </Collapsible.Root>
              {/each}
            </div>
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  </div>

  <!-- Mobile Filters (Sheet) -->
{:else}
  <div class="space-y-3">
    <!-- Search Bar -->
    <div class="relative">
      <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search sitios..."
        value={localSearchQuery}
        oninput={(e) => handleSearchInput(e.currentTarget.value)}
        class="pl-10"
      />
    </div>

    <!-- Filter Button and Selected Badges -->
    <div class="flex items-center gap-2">
      <Button variant="outline" onclick={() => (isSheetOpen = true)} class="gap-2">
        <SlidersHorizontal class="size-4" />
        Filters & Sort
        {#if hasActiveFilters}
          <Badge variant="secondary" class="ml-1">Active</Badge>
        {/if}
      </Button>

      {#if hasActiveFilters}
        <Button variant="ghost" size="icon" onclick={clearAllFilters}>
          <FilterX class="size-4" />
        </Button>
      {/if}
    </div>

    <!-- Selected Sort Indicators Preview -->
    {#if config.sortIndicators.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each config.sortIndicators as sortConfig, index}
          {@const indicator = getIndicator(sortConfig.key)}
          {#if indicator}
            <Badge variant="secondary" class="gap-1">
              <span class="font-mono text-[10px]">#{index + 1}</span>
              {indicator.shortLabel}
              {#if sortConfig.order === 'asc'}
                <ArrowUp class="size-3" />
              {:else}
                <ArrowDown class="size-3" />
              {/if}
            </Badge>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <!-- Mobile Sheet -->
  <Sheet.Root bind:open={isSheetOpen}>
    <Sheet.Content side="bottom" class="h-[85vh] gap-0 px-4">
      <Sheet.Header>
        <Sheet.Title>Filters & Sort</Sheet.Title>
        <Sheet.Description>Configure how sitios are filtered and ranked</Sheet.Description>
      </Sheet.Header>

      <ScrollArea class="h-[calc(85vh-220px)] pr-4">
        <div class="space-y-6 py-4">
          <!-- Location Filters -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Location</Label>
            <Select.Root
              type="single"
              value={config.filters.municipality}
              onValueChange={handleMunicipalityChange}
            >
              <Select.Trigger class="w-full">
                {config.filters.municipality === 'all'
                  ? 'All Municipalities'
                  : config.filters.municipality}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Municipalities</Select.Item>
                {#each municipalities as municipality}
                  <Select.Item value={municipality}>{municipality}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>

            <Select.Root
              type="single"
              value={config.filters.barangay}
              onValueChange={handleBarangayChange}
              disabled={config.filters.municipality === 'all'}
            >
              <Select.Trigger class="w-full">
                {config.filters.barangay === 'all' ? 'All Barangays' : config.filters.barangay}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Barangays</Select.Item>
                {#each barangays as brgy}
                  <Select.Item value={brgy}>{brgy}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <Separator />

          <!-- Classification Filters -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Classification</Label>
            <div class="flex flex-wrap gap-2">
              {#each ['gida', 'indigenous', 'conflict'] as key}
                {@const value =
                  config.filters.classifications[key as keyof FilterConfig['classifications']]}
                <Button
                  variant={getClassificationVariant(value)}
                  size="sm"
                  onclick={() => toggleClassification(key as 'gida' | 'indigenous' | 'conflict')}
                >
                  {getClassificationLabel(key, value)}
                </Button>
              {/each}
            </div>
          </div>

          <Separator />

          <!-- Presets -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Quick Presets</Label>
            <div class="grid grid-cols-2 gap-2">
              {#each SORT_PRESETS as preset}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => {
                    applyPreset(preset);
                  }}
                >
                  <Sparkles class="mr-1.5 size-3" />
                  {preset.label}
                </Button>
              {/each}
              {#if config.sortIndicators.length > 0}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={resetIndicators}
                  class="col-span-2 text-muted-foreground hover:text-destructive"
                >
                  <X class="mr-1.5 size-3" />
                  Reset All Indicators
                </Button>
              {/if}
            </div>
          </div>

          <Separator />

          <!-- Selected Sort Indicators -->
          {#if config.sortIndicators.length > 0}
            <div class="space-y-3">
              <Label class="text-sm font-medium">Sort Priority</Label>
              <div class="space-y-2">
                {#each config.sortIndicators as sortConfig, index (sortConfig.key)}
                  {@const indicator = getIndicator(sortConfig.key)}
                  {#if indicator}
                    <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                      <Badge variant="outline" class="font-mono text-xs">#{index + 1}</Badge>
                      <span class="flex-1 text-sm">{indicator.shortLabel}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-8"
                        onclick={() => toggleSortDirection(sortConfig.key)}
                      >
                        {#if sortConfig.order === 'asc'}
                          <ArrowUp class="size-4" />
                        {:else}
                          <ArrowDown class="size-4" />
                        {/if}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-8"
                        onclick={() => removeIndicator(sortConfig.key)}
                      >
                        <X class="size-4" />
                      </Button>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
            <Separator />
          {/if}

          <!-- Indicator Categories -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label class="text-sm font-medium">
                Select Indicators ({MAX_SORT_INDICATORS - config.sortIndicators.length} remaining)
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onclick={toggleAllMobileCategories}
                class="gap-1.5 text-xs"
                title={allMobileCategoriesCollapsed
                  ? 'Expand all categories'
                  : 'Collapse all categories'}
              >
                {#if allMobileCategoriesCollapsed}
                  <ChevronsDownUp class="size-3.5" />
                  Expand All
                {:else}
                  <ChevronsUpDown class="size-3.5" />
                  Collapse All
                {/if}
              </Button>
            </div>
            {#each categorizedIndicators as { category, indicators }}
              <Collapsible.Root
                open={expandedMobileCategories.has(category.key)}
                onOpenChange={(open) => {
                  if (open) {
                    expandedMobileCategories.add(category.key);
                  } else {
                    expandedMobileCategories.delete(category.key);
                  }
                }}
              >
                <Collapsible.Trigger
                  class="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary"
                >
                  {category.label}
                  <ChevronDown
                    class="size-4 transition-transform duration-200 in-data-[state=open]:rotate-180"
                  />
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <div class="grid grid-cols-2 gap-1 py-2">
                    {#each indicators as indicator}
                      {@const isSelected = selectedIndicatorKeys.has(indicator.key)}
                      <button
                        type="button"
                        class="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted {isSelected
                          ? 'bg-primary/10'
                          : ''}"
                        onclick={() => toggleIndicator(indicator.key)}
                      >
                        <div
                          class="flex size-4 shrink-0 items-center justify-center rounded border {isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'}"
                        >
                          {#if isSelected}
                            <Check class="size-3" />
                          {/if}
                        </div>
                        <span class="truncate text-xs">{indicator.shortLabel}</span>
                      </button>
                    {/each}
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            {/each}
          </div>
        </div>
      </ScrollArea>

      <Sheet.Footer class="mt-0 gap-2 sm:gap-0">
        <Button variant="outline" onclick={clearAllFilters}>Clear All</Button>
        <Button onclick={() => (isSheetOpen = false)}>Apply</Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
{/if}
