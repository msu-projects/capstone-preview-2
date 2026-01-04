<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
  import {
    ComparisonCharts,
    ComparisonConfigPanel,
    ComparisonTable
  } from '$lib/components/compare';
  import { DashboardSkeleton } from '$lib/components/sitios/dashboard';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import type { SitioRecord } from '$lib/types';
  import {
    DEFAULT_COMPARISON_LIMITS,
    type ComparisonConfig,
    type ComparisonResult
  } from '$lib/types/comparison';
  import {
    executeComparison,
    parseConfigFromURL,
    serializeConfigToURL,
    validateComparisonConfig
  } from '$lib/utils/comparison';
  import { loadComparisonLimits } from '$lib/utils/config-storage';
  import { loadSitios } from '$lib/utils/storage';
  import { AlertTriangle, CheckCircle2, GitCompareArrows, RotateCcw, Share2 } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // State
  let sitios = $state<SitioRecord[]>([]);
  let isLoading = $state(true);
  let comparisonResult = $state<ComparisonResult | null>(null);
  let hasCompared = $state(false);

  // Comparison limits (loaded from config)
  let limits = $state(DEFAULT_COMPARISON_LIMITS);

  // Comparison configuration
  let config = $state<ComparisonConfig>({
    type: 'temporal',
    sitioIds: [],
    years: [],
    metricGroups: ['demographics', 'utilities', 'infrastructure', 'livelihood'],
    aggregateLevel: 'municipality',
    aggregateEntities: []
  });

  // Load data on mount
  onMount(() => {
    sitios = loadSitios();
    limits = loadComparisonLimits();

    // Check URL for shared comparison config
    const urlConfig = parseConfigFromURL($page.url.searchParams);
    if (urlConfig) {
      config = urlConfig;
      // Auto-execute comparison if URL config is valid
      const validation = validateComparisonConfig(config, limits);
      if (validation.valid) {
        executeComparisonHandler();
      }
    }

    isLoading = false;
  });

  // Execute comparison
  function executeComparisonHandler() {
    const validation = validateComparisonConfig(config, limits);

    if (!validation.valid) {
      toast.error('Invalid Configuration', {
        description: validation.errors.join('. ')
      });
      return;
    }

    const result = executeComparison(config, sitios);

    if (result) {
      comparisonResult = result;
      hasCompared = true;

      // Update URL with config for sharing
      const params = serializeConfigToURL(config);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      goto(newUrl, { replaceState: true, noScroll: true });
    } else {
      toast.error('Comparison Failed', {
        description: 'Could not generate comparison. Please check your selections.'
      });
    }
  }

  // Share comparison link
  function shareComparison() {
    const params = serializeConfigToURL(config);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    navigator.clipboard.writeText(shareUrl);
    toast.success('Link Copied', {
      description: 'Comparison link copied to clipboard'
    });
  }

  // Reset comparison
  function resetComparison() {
    config = {
      type: 'temporal',
      sitioIds: [],
      years: [],
      metricGroups: ['demographics', 'utilities', 'infrastructure', 'livelihood'],
      aggregateLevel: 'municipality',
      aggregateEntities: []
    };
    comparisonResult = null;
    hasCompared = false;

    // Clear URL params
    goto(window.location.pathname, { replaceState: true, noScroll: true });
  }

  // Get comparison title
  const comparisonTitle = $derived(() => {
    if (!comparisonResult) return '';

    if (comparisonResult.type === 'temporal') {
      const sitio = comparisonResult.sitio;
      return `${sitio.sitioName}, ${sitio.barangay} (${comparisonResult.years.join(' - ')})`;
    } else if (comparisonResult.type === 'spatial') {
      const sitioNames = comparisonResult.sitios.map((s) => s.sitioName).join(', ');
      return `${sitioNames} (${comparisonResult.year})`;
    } else {
      const entityNames = comparisonResult.entities.map((e) => e.name).join(', ');
      return `${entityNames} (${comparisonResult.year})`;
    }
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Compare Data', href: '/compare' }
  ];
</script>

<svelte:head>
  <title>Compare Sitio Data | South Cotabato Convergence Data Bank</title>
  <meta
    name="description"
    content="Compare sitio data across years or between different sitios in South Cotabato"
  />
</svelte:head>

<!-- Breadcrumb -->
<AppBreadcrumb items={breadcrumbItems} />

<div class="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  <!-- Page Header -->
  <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Compare Data</h1>
      <p class="mt-1 text-muted-foreground">
        Analyze trends over time, compare multiple sitios, or compare aggregated area data
      </p>
    </div>
    {#if hasCompared}
      <div class="flex gap-2">
        <Button variant="outline" size="sm" onclick={shareComparison}>
          <Share2 class="mr-2 size-4" />
          Share
        </Button>
        <Button variant="outline" size="sm" onclick={resetComparison}>
          <RotateCcw class="mr-2 size-4" />
          Reset
        </Button>
      </div>
    {/if}
  </div>

  {#if isLoading}
    <DashboardSkeleton />
  {:else if sitios.length === 0}
    <Card.Root class="p-12 text-center">
      <AlertTriangle class="mx-auto size-12 text-muted-foreground" />
      <h2 class="mt-4 text-lg font-semibold">No Data Available</h2>
      <p class="mt-2 text-muted-foreground">
        There are no sitios in the system to compare. Please add sitio data first.
      </p>
    </Card.Root>
  {:else}
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Configuration Panel -->
      <div class="lg:col-span-1">
        <ComparisonConfigPanel bind:config {sitios} {limits} onCompare={executeComparisonHandler} />
      </div>

      <!-- Results Panel -->
      <div class="lg:col-span-2">
        {#if !hasCompared}
          <Card.Root class="flex h-full min-h-96 items-center justify-center">
            <div class="text-center">
              <GitCompareArrows class="mx-auto size-16 text-muted-foreground/50" />
              <h3 class="mt-4 text-lg font-medium">Configure Your Comparison</h3>
              <p class="mt-2 max-w-sm text-sm text-muted-foreground">
                Select a comparison type, choose sitios/areas and years, then click "Generate
                Comparison" to see the results.
              </p>
            </div>
          </Card.Root>
        {:else if comparisonResult}
          <div class="space-y-6">
            <!-- Comparison Header -->
            <Card.Root>
              <Card.Header class="">
                <div class="flex items-center gap-2">
                  <CheckCircle2 class="size-5 text-emerald-500" />
                  <Card.Title>Comparison Results</Card.Title>
                </div>
                <Card.Description class="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" class="capitalize">
                    {comparisonResult.type}
                  </Badge>
                  <span>{comparisonTitle()}</span>
                </Card.Description>
              </Card.Header>
            </Card.Root>

            <!-- Results Tabs -->
            <Tabs.Root value="charts">
              <Tabs.List class="grid w-full grid-cols-2">
                <Tabs.Trigger value="charts">Charts</Tabs.Trigger>
                <Tabs.Trigger value="table">Data Table</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="charts" class="mt-4">
                <ComparisonCharts result={comparisonResult} />
              </Tabs.Content>

              <Tabs.Content value="table" class="mt-4">
                {#if comparisonResult.type === 'temporal' || comparisonResult.type === 'spatial'}
                  <ComparisonTable result={comparisonResult} showChanges />
                {:else if comparisonResult.type === 'aggregate'}
                  <!-- Aggregate comparison table -->
                  <Card.Root>
                    <Card.Header>
                      <Card.Title>
                        {comparisonResult.aggregateLevel === 'municipality'
                          ? 'Municipality'
                          : 'Barangay'} Comparison
                      </Card.Title>
                      <Card.Description>
                        Aggregated data across {comparisonResult.entities.length}
                        {comparisonResult.aggregateLevel === 'municipality'
                          ? 'municipalities'
                          : 'barangays'}
                      </Card.Description>
                    </Card.Header>
                    <Card.Content>
                      <div class="space-y-6">
                        {#each Object.entries(comparisonResult.metricsByGroup) as [group, metrics]}
                          {#if metrics.length > 0}
                            <div>
                              <h4 class="mb-3 font-semibold capitalize">{group}</h4>
                              <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                  <thead>
                                    <tr class="border-b">
                                      <th class="py-2 text-left font-medium">Metric</th>
                                      {#each comparisonResult.entities as entity}
                                        <th class="py-2 text-right font-medium">{entity.name}</th>
                                      {/each}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {#each metrics as metric}
                                      <tr class="border-b">
                                        <td class="py-2">{metric.label}</td>
                                        {#each metric.values as value}
                                          <td class="py-2 text-right font-mono">
                                            {value.displayValue}
                                          </td>
                                        {/each}
                                      </tr>
                                    {/each}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    </Card.Content>
                  </Card.Root>
                {/if}
              </Tabs.Content>
            </Tabs.Root>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
