<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { SitioMultiSelect } from '$lib/components/ui/sitio-multi-select';
  import * as Tabs from '$lib/components/ui/tabs';
  import type { SitioRecord } from '$lib/types';
  import {
    METRIC_GROUP_LABELS,
    type AggregateLevel,
    type ComparisonConfig,
    type ComparisonLimits,
    type ComparisonMetricGroup,
    type ComparisonType
  } from '$lib/types/comparison';
  import { cn } from '$lib/utils';
  import { getAllAvailableYears } from '$lib/utils/sitio-chart-aggregation';
  import { AlertCircle, Building2, Calendar, GitCompareArrows, MapPin } from '@lucide/svelte';

  interface Props {
    config: ComparisonConfig;
    sitios: SitioRecord[];
    limits: ComparisonLimits;
    onCompare: () => void;
    class?: string;
  }

  let { config = $bindable(), sitios, limits, onCompare, class: className = '' }: Props = $props();

  // Available years from all sitios
  const availableYears = $derived(getAllAvailableYears(sitios));

  // Get unique municipalities and barangays for aggregate comparison
  const availableMunicipalities = $derived(() => {
    const municipalities = new Set<string>();
    for (const sitio of sitios) {
      municipalities.add(sitio.municipality);
    }
    return Array.from(municipalities).sort();
  });

  const availableBarangays = $derived(() => {
    const barangays = new Set<string>();
    for (const sitio of sitios) {
      barangays.add(sitio.barangay);
    }
    return Array.from(barangays).sort();
  });

  // Validation state
  const validationErrors = $derived(() => {
    const errors: string[] = [];

    if (config.type === 'temporal') {
      if (config.sitioIds.length !== 1) {
        errors.push('Select exactly 1 sitio for temporal comparison');
      }
      if (config.years.length < 2) {
        errors.push('Select at least 2 years');
      }
      if (config.years.length > limits.maxYears) {
        errors.push(`Maximum ${limits.maxYears} years allowed`);
      }
    }

    if (config.type === 'spatial') {
      if (config.sitioIds.length < 2) {
        errors.push('Select at least 2 sitios');
      }
      if (config.sitioIds.length > limits.maxSitios) {
        errors.push(`Maximum ${limits.maxSitios} sitios allowed`);
      }
      if (config.years.length !== 1) {
        errors.push('Select exactly 1 year');
      }
    }

    if (config.type === 'aggregate') {
      if (!config.aggregateLevel) {
        errors.push('Select an aggregate level');
      }
      if (!config.aggregateEntities || config.aggregateEntities.length < 2) {
        errors.push('Select at least 2 entities to compare');
      }
      if (config.aggregateEntities && config.aggregateEntities.length > limits.maxSitios) {
        errors.push(`Maximum ${limits.maxSitios} entities allowed`);
      }
      if (config.years.length !== 1) {
        errors.push('Select exactly 1 year');
      }
    }

    if (config.metricGroups.length === 0) {
      errors.push('Select at least one metric group');
    }

    return errors;
  });

  const isValid = $derived(validationErrors().length === 0);

  // Handle comparison type change
  function handleTypeChange(type: ComparisonType) {
    config.type = type;
    // Reset selections based on type
    if (type === 'temporal') {
      config.sitioIds = config.sitioIds.slice(0, 1);
      // Keep multiple years
    } else if (type === 'spatial') {
      config.years = config.years.slice(0, 1);
      // Keep multiple sitios (up to limit)
      if (config.sitioIds.length > limits.maxSitios) {
        config.sitioIds = config.sitioIds.slice(0, limits.maxSitios);
      }
    } else if (type === 'aggregate') {
      config.years = config.years.slice(0, 1);
      config.aggregateLevel = config.aggregateLevel || 'municipality';
      config.aggregateEntities = config.aggregateEntities || [];
    }
  }

  // Handle year selection
  function toggleYear(year: number) {
    if (config.type === 'spatial' || config.type === 'aggregate') {
      // Single year selection
      config.years = [year];
    } else {
      // Multiple year selection for temporal
      if (config.years.includes(year)) {
        config.years = config.years.filter((y) => y !== year);
      } else if (config.years.length < limits.maxYears) {
        config.years = [...config.years, year].sort((a, b) => a - b);
      }
    }
  }

  // Handle entity selection for aggregate comparison
  function toggleEntity(entity: string) {
    if (!config.aggregateEntities) {
      config.aggregateEntities = [entity];
      return;
    }

    if (config.aggregateEntities.includes(entity)) {
      config.aggregateEntities = config.aggregateEntities.filter((e) => e !== entity);
    } else if (config.aggregateEntities.length < limits.maxSitios) {
      config.aggregateEntities = [...config.aggregateEntities, entity];
    }
  }

  // Handle metric group toggle
  function toggleMetricGroup(group: ComparisonMetricGroup) {
    if (config.metricGroups.includes(group)) {
      config.metricGroups = config.metricGroups.filter((g) => g !== group);
    } else {
      config.metricGroups = [...config.metricGroups, group];
    }
  }

  // Select all / deselect all metric groups
  function toggleAllMetrics() {
    const allGroups: ComparisonMetricGroup[] = [
      'demographics',
      'utilities',
      'infrastructure',
      'livelihood'
    ];
    if (config.metricGroups.length === allGroups.length) {
      config.metricGroups = [];
    } else {
      config.metricGroups = allGroups;
    }
  }

  const comparisonTypeLabels: Record<ComparisonType, { label: string; description: string }> = {
    temporal: {
      label: 'Year-over-Year',
      description: 'Compare one sitio across multiple years'
    },
    spatial: {
      label: 'Sitio-to-Sitio',
      description: 'Compare multiple sitios for the same year'
    },
    aggregate: {
      label: 'Area Comparison',
      description: 'Compare aggregated data by municipality or barangay'
    }
  };

  const aggregateLevelOptions = [
    { value: 'municipality', label: 'By Municipality' },
    { value: 'barangay', label: 'By Barangay' }
  ];
</script>

<Card.Root class={cn('', className)}>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <GitCompareArrows class="size-5" />
      Configure Comparison
    </Card.Title>
    <Card.Description>Select comparison type, data points, and metrics to analyze</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-6">
    <!-- Comparison Type Tabs -->
    <div class="space-y-3">
      <Label class="text-sm font-medium">Comparison Type</Label>
      <Tabs.Root value={config.type} onValueChange={(v) => handleTypeChange(v as ComparisonType)}>
        <Tabs.List class="grid h-auto w-full grid-cols-3 gap-2 bg-transparent p-0">
          <Tabs.Trigger
            value="temporal"
            class="group flex h-auto flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-background px-3 py-4 text-sm font-medium transition-all hover:border-primary/50 hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm"
          >
            <Calendar
              class="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-data-[state=active]:text-primary"
            />
            <span class="text-center leading-tight">Year-over-Year</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="spatial"
            class="group flex h-auto flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-background px-3 py-4 text-sm font-medium transition-all hover:border-primary/50 hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm"
          >
            <MapPin
              class="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-data-[state=active]:text-primary"
            />
            <span class="text-center leading-tight">Sitio-to-Sitio</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="aggregate"
            class="group flex h-auto flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-background px-3 py-4 text-sm font-medium transition-all hover:border-primary/50 hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm"
          >
            <Building2
              class="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-data-[state=active]:text-primary"
            />
            <span class="text-center leading-tight">Area Compare</span>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <p class="text-sm text-muted-foreground">
        {comparisonTypeLabels[config.type].description}
      </p>
    </div>

    <!-- Sitio Selection (for temporal and spatial) -->
    {#if config.type === 'temporal' || config.type === 'spatial'}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label class="text-sm font-medium">
            {config.type === 'spatial' ? `Select Sitios (max ${limits.maxSitios})` : 'Select Sitio'}
          </Label>
          <span class="text-xs text-muted-foreground">
            {config.sitioIds.length} selected
          </span>
        </div>
        <SitioMultiSelect bind:value={config.sitioIds} placeholder="Search and select sitios..." />
      </div>
    {/if}

    <!-- Aggregate Level and Entity Selection (for aggregate type) -->
    {#if config.type === 'aggregate'}
      <div class="space-y-2">
        <Label class="text-sm font-medium">Aggregate Level</Label>
        <Select.Root
          type="single"
          value={config.aggregateLevel || 'municipality'}
          onValueChange={(v) => {
            config.aggregateLevel = v as AggregateLevel;
            config.aggregateEntities = [];
          }}
        >
          <Select.Trigger class="w-full">
            {aggregateLevelOptions.find((o) => o.value === config.aggregateLevel)?.label ||
              'Select level'}
          </Select.Trigger>
          <Select.Content>
            {#each aggregateLevelOptions as option}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label class="text-sm font-medium">
            Select {config.aggregateLevel === 'municipality' ? 'Municipalities' : 'Barangays'} (max {limits.maxSitios})
          </Label>
          <span class="text-xs text-muted-foreground">
            {config.aggregateEntities?.length || 0} selected
          </span>
        </div>
        <div class="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
          {#each config.aggregateLevel === 'municipality' ? availableMunicipalities() : availableBarangays() as entity}
            {@const isSelected = config.aggregateEntities?.includes(entity)}
            <label
              class={cn(
                'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleEntity(entity)}
                disabled={!isSelected &&
                  (config.aggregateEntities?.length || 0) >= limits.maxSitios}
              />
              <span class="text-sm">{entity}</span>
            </label>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Year Selection -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">
          {config.type === 'temporal' ? `Select Years (max ${limits.maxYears})` : 'Select Year'}
        </Label>
        <span class="text-xs text-muted-foreground">
          {config.years.length} selected
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each availableYears as year}
          {@const isSelected = config.years.includes(year)}
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onclick={() => toggleYear(year)}
            class={cn('min-w-15', isSelected && 'ring-2 ring-primary ring-offset-2')}
          >
            {year}
          </Button>
        {/each}
      </div>
    </div>

    <!-- Metric Groups -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">Metrics to Compare</Label>
        <Button variant="ghost" size="sm" onclick={toggleAllMetrics}>
          {config.metricGroups.length === 4 ? 'Deselect All' : 'Select All'}
        </Button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        {#each Object.entries(METRIC_GROUP_LABELS) as [key, label]}
          {@const group = key as ComparisonMetricGroup}
          {@const isAvailable = [
            'demographics',
            'utilities',
            'infrastructure',
            'livelihood'
          ].includes(group)}
          {#if isAvailable}
            <label
              class={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                config.metricGroups.includes(group)
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
            >
              <Checkbox
                checked={config.metricGroups.includes(group)}
                onCheckedChange={() => toggleMetricGroup(group)}
              />
              <span class="text-sm">{label}</span>
            </label>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Validation Errors -->
    {#if validationErrors().length > 0}
      <div
        class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/50"
      >
        <div class="flex items-start gap-2">
          <AlertCircle class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div class="space-y-1">
            {#each validationErrors() as error}
              <p class="text-sm text-amber-700 dark:text-amber-300">{error}</p>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Compare Button -->
    <Button onclick={onCompare} disabled={!isValid} class="w-full" size="lg">
      <GitCompareArrows class="mr-2 size-4" />
      Generate Comparison
    </Button>
  </Card.Content>
</Card.Root>
