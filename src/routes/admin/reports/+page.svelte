<script lang="ts">
  import { goto } from '$app/navigation';
  import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
  import {
    ReportFilters,
    ReportGenerating,
    ReportSectionSelector
  } from '$lib/components/admin/reports';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Switch } from '$lib/components/ui/switch';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { ReportConfig, ReportSection } from '$lib/types/report';
  import { DEFAULT_REPORT_CONFIG } from '$lib/types/report';
  import { downloadAggregateReport } from '$lib/utils/pdf-generator';
  import { getAllAvailableYears } from '$lib/utils/sitio-chart-aggregation';
  import { loadSitios } from '$lib/utils/storage';
  import { ArrowLeft, FileBarChart, FileDown, Info, Settings2 } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // Check permissions
  const canExport = $derived(
    authStore.currentUser?.role === 'admin' ||
      authStore.currentUser?.role === 'superadmin' ||
      authStore.currentUser?.role === 'viewer'
  );

  // Load sitios data
  let sitios = $state(loadSitios());
  let isLoading = $state(true);

  onMount(() => {
    sitios = loadSitios();
    isLoading = false;
  });

  // Get available years
  const availableYears = $derived(getAllAvailableYears(sitios).sort((a, b) => b - a));
  const latestYear = $derived(availableYears[0] || new Date().getFullYear());

  // Report configuration state
  let selectedSections = $state<ReportSection[]>([...DEFAULT_REPORT_CONFIG.sections]);
  let filters = $state({
    year: new Date().getFullYear(),
    compareYear: undefined as number | undefined,
    municipality: undefined as string | undefined,
    barangay: undefined as string | undefined
  });
  // Charts in PDF are currently not supported - feature coming soon
  let includeCharts = $state(false);
  let includeTrends = $state(DEFAULT_REPORT_CONFIG.includeTrends);

  // Generation state
  let isGenerating = $state(false);
  let generationProgress = $state(0);
  let generationStep = $state('');

  // Update year when data loads
  $effect(() => {
    if (availableYears.length > 0 && filters.year === new Date().getFullYear()) {
      filters.year = latestYear;
    }
  });

  // Validate configuration
  const isValid = $derived(selectedSections.length > 0 && sitios.length > 0);

  // Filter sitios based on current filters
  const filteredSitioCount = $derived(() => {
    return sitios.filter((sitio) => {
      if (filters.municipality && sitio.municipality !== filters.municipality) {
        return false;
      }
      if (filters.barangay && sitio.barangay !== filters.barangay) {
        return false;
      }
      return true;
    }).length;
  });

  async function generateReport() {
    if (!isValid) {
      toast.error('Please select at least one section and ensure sitios data is loaded.');
      return;
    }

    isGenerating = true;
    generationProgress = 0;
    generationStep = 'Preparing report configuration...';

    try {
      // Simulate progress steps
      await updateProgress(10, 'Loading sitio data...');
      await updateProgress(30, 'Aggregating statistics...');
      await updateProgress(50, 'Building report sections...');
      await updateProgress(70, 'Formatting tables and content...');
      await updateProgress(90, 'Generating PDF document...');

      // Build report config
      const config: ReportConfig = {
        type: 'aggregate',
        title: generateReportTitle(),
        sections: selectedSections,
        filters: {
          year: filters.year,
          compareYear: includeTrends ? filters.compareYear : undefined,
          municipality: filters.municipality,
          barangay: filters.barangay
        },
        includeCharts,
        includeTrends
      };

      // Generate and download the report
      downloadAggregateReport(sitios, config);

      await updateProgress(100, 'Report generated successfully!');
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setTimeout(() => {
        isGenerating = false;
        generationProgress = 0;
        generationStep = '';
      }, 1000);
    }
  }

  async function updateProgress(progress: number, step: string) {
    generationProgress = progress;
    generationStep = step;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  function generateReportTitle(): string {
    const parts = ['Aggregate Data Report'];
    if (filters.municipality) {
      parts.push(`- ${filters.municipality}`);
      if (filters.barangay) {
        parts.push(`, ${filters.barangay}`);
      }
    }
    parts.push(`(${filters.year})`);
    return parts.join(' ');
  }

  const breadcrumbItems = [
    { label: 'Admin', href: '/admin' },
    { label: 'Reports', href: '/admin/reports' }
  ];
</script>

<svelte:head>
  <title>Generate Reports | Admin</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
  <AppBreadcrumb items={breadcrumbItems} />

  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" onclick={() => goto('/admin')}>
        <ArrowLeft class="h-5 w-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Generate Reports</h1>
        <p class="text-muted-foreground">
          Create PDF reports from dashboard data with customizable sections
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <FileBarChart class="h-5 w-5 text-muted-foreground" />
      <span class="text-sm text-muted-foreground">
        {sitios.length} sitios available
      </span>
    </div>
  </div>

  {#if !canExport}
    <Card.Root class="border-destructive">
      <Card.Content class="pt-6">
        <div class="flex items-center gap-3">
          <Info class="h-5 w-5 text-destructive" />
          <p class="text-sm text-destructive">
            You don't have permission to generate reports. Please contact an administrator.
          </p>
        </div>
      </Card.Content>
    </Card.Root>
  {:else if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-pulse text-muted-foreground">Loading sitios data...</div>
    </div>
  {:else if isGenerating}
    <Card.Root>
      <Card.Content class="pt-6">
        <ReportGenerating currentStep={generationStep} progress={generationProgress} />
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main Configuration -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Section Selection -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Settings2 class="h-5 w-5" />
              Report Sections
            </Card.Title>
            <Card.Description>Choose which sections to include in your report</Card.Description>
          </Card.Header>
          <Card.Content>
            <ReportSectionSelector bind:selectedSections />
          </Card.Content>
        </Card.Root>

        <!-- Filters -->
        <Card.Root>
          <Card.Header>
            <Card.Title>Filters & Options</Card.Title>
            <Card.Description>
              Configure year selection, geographic scope, and comparison options
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ReportFilters bind:filters {sitios} bind:includeTrends />
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Summary & Generate -->
      <div class="space-y-6">
        <Card.Root class="sticky top-4">
          <Card.Header>
            <Card.Title>Report Summary</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            <!-- Summary Stats -->
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Sitios Included</span>
                <span class="font-medium">{filteredSitioCount()}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Sections Selected</span>
                <span class="font-medium">{selectedSections.length} / 8</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Data Year</span>
                <span class="font-medium">{filters.year}</span>
              </div>
              {#if filters.compareYear}
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Compare With</span>
                  <span class="font-medium">{filters.compareYear}</span>
                </div>
              {/if}
              {#if filters.municipality}
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Municipality</span>
                  <span class="font-medium">{filters.municipality}</span>
                </div>
              {/if}
              {#if filters.barangay}
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Barangay</span>
                  <span class="font-medium">{filters.barangay}</span>
                </div>
              {/if}
            </div>

            <Separator />

            <!-- Options -->
            <div class="space-y-3">
              <div class="flex items-center justify-between opacity-50">
                <div class="flex items-center gap-1.5">
                  <Label for="include-charts" class="text-sm">Include Charts</Label>
                  <span class="text-xs text-muted-foreground">(coming soon)</span>
                </div>
                <Switch id="include-charts" disabled checked={false} />
              </div>
              <div class="flex items-center justify-between">
                <Label for="include-trends" class="text-sm">Include Trends</Label>
                <Switch id="include-trends" bind:checked={includeTrends} />
              </div>
            </div>

            <Separator />

            <!-- Generate Button -->
            <Button class="w-full" size="lg" onclick={generateReport} disabled={!isValid}>
              <FileDown class="mr-2 h-5 w-5" />
              Generate & Download PDF
            </Button>

            {#if !isValid}
              <p class="text-center text-xs text-destructive">
                {#if selectedSections.length === 0}
                  Please select at least one section
                {:else if sitios.length === 0}
                  No sitio data available
                {/if}
              </p>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Info Card -->
        <Card.Root class="py-0">
          <Card.Content class="py-4">
            <div class="flex gap-3">
              <Info class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div class="space-y-1 text-sm text-muted-foreground">
                <p>
                  <strong>Tip:</strong> Reports include aggregated statistics from all sitios matching
                  your filters.
                </p>
                <p>
                  Enable "Include Trends" to see year-over-year comparisons when comparison data is
                  available.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</div>
