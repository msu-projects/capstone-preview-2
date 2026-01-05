<script lang="ts">
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import { ReportFilters, ReportGenerating } from '$lib/components/admin/reports';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { ReportConfig, ReportSection } from '$lib/types/report';
  import { DEFAULT_REPORT_CONFIG } from '$lib/types/report';
  import { downloadAggregateReport, downloadSitioProfileReport } from '$lib/utils/pdf-generator';
  import { getAllAvailableYears } from '$lib/utils/sitio-chart-aggregation';
  import { loadSitios } from '$lib/utils/storage';
  import { FileBarChart, FileDown, Info, User } from '@lucide/svelte';
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
    municipality: undefined as string | undefined,
    barangay: undefined as string | undefined,
    sitioCoding: undefined as string | undefined
  });

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

  // Check if generating sitio-specific report
  const isSitioReport = $derived(!!filters.sitioCoding);

  // Get selected sitio record
  const selectedSitio = $derived(() => {
    if (!filters.sitioCoding) return null;
    return sitios.find((s) => s.coding === filters.sitioCoding) ?? null;
  });

  // Check if selected sitio has data for the selected year
  const sitioHasYearData = $derived(() => {
    const sitio = selectedSitio();
    if (!sitio) return true; // Not a sitio report
    return sitio.availableYears.includes(filters.year);
  });

  // Validate configuration
  const isValid = $derived(
    selectedSections.length > 0 && sitios.length > 0 && (!isSitioReport || sitioHasYearData())
  );

  // Filter sitios based on current filters (for aggregate reports)
  const filteredSitioCount = $derived(() => {
    if (isSitioReport) return 1;
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
      if (isSitioReport && !sitioHasYearData()) {
        toast.error(`Selected sitio has no data for year ${filters.year}. Please choose a different year.`);
        return;
      }
      toast.error('Please select at least one section and ensure sitios data is loaded.');
      return;
    }

    isGenerating = true;
    generationProgress = 0;

    try {
      if (isSitioReport) {
        // Generate sitio profile report
        const sitio = selectedSitio();
        if (!sitio) {
          toast.error('Selected sitio not found.');
          return;
        }

        generationStep = 'Preparing sitio profile report...';
        await updateProgress(10, 'Loading sitio data...');
        await updateProgress(40, 'Building profile sections...');
        await updateProgress(70, 'Formatting content...');
        await updateProgress(90, 'Generating PDF document...');

        downloadSitioProfileReport(sitio, filters.year);

        await updateProgress(100, 'Report generated successfully!');
        toast.success('Sitio profile report downloaded successfully!');
      } else {
        // Generate aggregate report
        generationStep = 'Preparing aggregate report configuration...';
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
            municipality: filters.municipality,
            barangay: filters.barangay
          },
          includeCharts: false,
          includeTrends: false
        };

        // Generate and download the report
        downloadAggregateReport(sitios, config);

        await updateProgress(100, 'Report generated successfully!');
        toast.success('Report downloaded successfully!');
      }
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
    if (isSitioReport) {
      const sitio = selectedSitio();
      return sitio ? `${sitio.sitioName} Profile Report as of ${filters.year}` : `Sitio Profile Report as of ${filters.year}`;
    }

    const parts = ['Aggregate Report'];
    if (filters.municipality) {
      parts.push(`- ${filters.municipality}`);
      if (filters.barangay) {
        parts.push(`, ${filters.barangay}`);
      }
    }
    parts.push(`as of ${filters.year}`);
    return parts.join(' ');
  }
</script>

<svelte:head>
  <title>Generate Reports | Admin</title>
</svelte:head>

<AdminHeader
  title="Generate Reports"
  description="Create PDF reports from dashboard data with customizable sections"
>
  {#snippet badges()}
    <div class="flex items-center gap-2">
      <FileBarChart class="h-5 w-5 text-muted-foreground" />
      <span class="text-sm text-muted-foreground">
        {sitios.length} sitios available
      </span>
    </div>
  {/snippet}
</AdminHeader>

<div class="mx-auto mt-4 flex w-4xl flex-1 flex-col gap-4 p-4 pt-0">
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
    <div class="flex flex-col gap-6">
      <!-- Main Configuration -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Section Selection -->
        <!-- <Card.Root>
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
        </Card.Root> -->

        <!-- Filters -->
        <Card.Root>
          <Card.Header>
            <Card.Title>Filters & Options</Card.Title>
            <Card.Description>Configure year selection and geographic scope</Card.Description>
          </Card.Header>
          <Card.Content>
            <ReportFilters bind:filters {sitios} />
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Summary & Generate -->
      <div class="space-y-6">
        <Card.Root class="sticky top-4">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              {#if isSitioReport}
                <User class="h-4 w-4" />
                Sitio Profile Report
              {:else}
                <FileBarChart class="h-4 w-4" />
                Aggregate Report
              {/if}
            </Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            <!-- Summary Stats -->
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Report Type</span>
                <span class="font-medium">{isSitioReport ? 'Sitio Profile' : 'Aggregate'}</span>
              </div>
              {#if !isSitioReport}
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Sitios Included</span>
                  <span class="font-medium">{filteredSitioCount()}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Sections Selected</span>
                  <span class="font-medium">{selectedSections.length} / 8</span>
                </div>
              {/if}
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Data Year</span>
                <span class="font-medium">as of {filters.year}</span>
              </div>
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
              {#if isSitioReport}
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Sitio</span>
                  <span class="font-medium">{selectedSitio()?.sitioName ?? 'Unknown'}</span>
                </div>
              {/if}
            </div>

            <Separator />

            <!-- Generate Button -->
            <Button class="w-full" size="lg" onclick={generateReport} disabled={!isValid}>
              <FileDown class="mr-2 h-5 w-5" />
              {isSitioReport ? 'Generate Sitio Report' : 'Generate Aggregate Report'}
            </Button>

            {#if !isValid}
              <p class="text-center text-xs text-destructive">
                {#if isSitioReport && !sitioHasYearData()}
                  Selected sitio has no data for {filters.year}
                {:else if selectedSections.length === 0}
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
                {#if isSitioReport}
                  <p>
                    <strong>Sitio Report:</strong> Generates a detailed profile for the selected sitio
                    with all available data for the chosen year.
                  </p>
                {:else}
                  <p>
                    <strong>Aggregate Report:</strong> Combines and summarizes statistics from all sitios
                    matching your filters as of the selected year.
                  </p>
                {/if}
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</div>
