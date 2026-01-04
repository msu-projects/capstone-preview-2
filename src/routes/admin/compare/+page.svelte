<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
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
  import { logAuditAction } from '$lib/utils/audit';
  import {
    executeComparison,
    parseConfigFromURL,
    serializeConfigToURL,
    validateComparisonConfig
  } from '$lib/utils/comparison';
  import { loadComparisonLimits } from '$lib/utils/config-storage';
  import { loadSitios } from '$lib/utils/storage';
  import {
    AlertTriangle,
    CheckCircle2,
    Download,
    GitCompareArrows,
    RotateCcw,
    Share2
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // State
  let sitios = $state<SitioRecord[]>([]);
  let isLoading = $state(true);
  let isExporting = $state(false);
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

  // Export comparison as PDF
  async function exportComparisonPDF() {
    if (!comparisonResult) return;

    isExporting = true;

    try {
      // Dynamic import for pdfmake
      const pdfMake = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;

      if (pdfFonts && pdfFonts.vfs) {
        pdfMake.vfs = pdfFonts.vfs;
      }

      // Generate PDF content based on comparison type
      const docDefinition = generateComparisonPDF(comparisonResult);
      pdfMake.createPdf(docDefinition).download(`comparison-report-${Date.now()}.pdf`);

      // Log audit action
      logAuditAction(
        'export',
        'report',
        undefined,
        'Comparison Report',
        `Exported ${comparisonResult.type} comparison report`
      );

      toast.success('Export Successful', {
        description: 'Your comparison report has been downloaded'
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Export Failed', {
        description: 'Could not generate PDF. Please try again.'
      });
    } finally {
      isExporting = false;
    }
  }

  // Generate PDF document definition
  function generateComparisonPDF(result: ComparisonResult) {
    const content: any[] = [];

    // Title
    content.push({
      text: 'Data Comparison Report',
      style: 'header',
      margin: [0, 0, 0, 10]
    });

    // Comparison type badge
    content.push({
      text: `Comparison Type: ${result.type.charAt(0).toUpperCase() + result.type.slice(1)}`,
      style: 'subheader',
      margin: [0, 0, 0, 5]
    });

    // Details based on type
    if (result.type === 'temporal') {
      content.push({
        text: `Sitio: ${result.sitio.sitioName}, ${result.sitio.barangay}, ${result.sitio.municipality}`,
        margin: [0, 0, 0, 5]
      });
      content.push({
        text: `Years: ${result.years.join(', ')}`,
        margin: [0, 0, 0, 15]
      });
    } else if (result.type === 'spatial') {
      content.push({
        text: `Sitios: ${result.sitios.map((s) => `${s.sitioName}, ${s.barangay}`).join(' | ')}`,
        margin: [0, 0, 0, 5]
      });
      content.push({
        text: `Year: ${result.year}`,
        margin: [0, 0, 0, 15]
      });
    } else if (result.type === 'aggregate') {
      content.push({
        text: `${result.aggregateLevel === 'municipality' ? 'Municipalities' : 'Barangays'}: ${result.entities.map((e) => e.name).join(', ')}`,
        margin: [0, 0, 0, 5]
      });
      content.push({
        text: `Year: ${result.year}`,
        margin: [0, 0, 0, 15]
      });
    }

    // Generated timestamp
    content.push({
      text: `Generated: ${new Date().toLocaleString()}`,
      style: 'timestamp',
      margin: [0, 0, 0, 20]
    });

    // Metrics tables
    for (const [group, metrics] of Object.entries(result.metricsByGroup)) {
      if (metrics.length === 0) continue;

      // Group header
      content.push({
        text: group.charAt(0).toUpperCase() + group.slice(1),
        style: 'groupHeader',
        margin: [0, 10, 0, 5]
      });

      // Table
      let tableHeaders: string[];
      if (result.type === 'temporal') {
        tableHeaders = ['Metric', ...result.years.map(String), 'Change'];
      } else if (result.type === 'spatial') {
        tableHeaders = ['Metric', ...result.sitios.map((s) => s.sitioName)];
      } else {
        tableHeaders = ['Metric', ...result.entities.map((e) => e.name)];
      }

      const tableBody = [tableHeaders];

      for (const metric of metrics) {
        const row = [metric.label];
        for (const value of metric.values) {
          row.push(value.displayValue);
        }

        // Add change column for temporal
        if (result.type === 'temporal') {
          const change = result.overallTrend[metric.key];
          row.push(
            change
              ? `${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(1)}%`
              : '-'
          );
        }

        tableBody.push(row);
      }

      let widths: (string | number)[];
      if (result.type === 'temporal') {
        widths = ['*', ...result.years.map(() => 'auto' as const), 'auto'];
      } else if (result.type === 'spatial') {
        widths = ['*', ...result.sitios.map(() => 'auto' as const)];
      } else {
        widths = ['*', ...result.entities.map(() => 'auto' as const)];
      }

      content.push({
        table: {
          headerRows: 1,
          widths,
          body: tableBody
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15]
      });
    }

    return {
      content,
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        subheader: {
          fontSize: 14,
          bold: true,
          color: '#666666'
        },
        groupHeader: {
          fontSize: 12,
          bold: true,
          color: '#333333'
        },
        timestamp: {
          fontSize: 10,
          color: '#999999'
        }
      },
      defaultStyle: {
        fontSize: 10
      },
      pageSize: 'A4' as const,
      pageMargins: [40, 60, 40, 60] as [number, number, number, number]
    };
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

  const breadcrumbItems = [{ label: 'Dashboard', href: '/admin' }, { label: 'Compare Data' }];
</script>

<svelte:head>
  <title>Compare Data | Admin | South Cotabato Convergence Data Bank</title>
</svelte:head>

<AdminHeader title="Compare Data" breadcrumbs={breadcrumbItems}>
  {#snippet actions()}
    {#if hasCompared}
      <Button variant="outline" size="sm" onclick={shareComparison}>
        <Share2 class="mr-2 size-4" />
        Share
      </Button>
      <Button variant="outline" size="sm" onclick={exportComparisonPDF} disabled={isExporting}>
        {#if isExporting}
          <span class="mr-2 size-4 animate-spin">⏳</span>
        {:else}
          <Download class="mr-2 size-4" />
        {/if}
        Export PDF
      </Button>
      <Button variant="outline" size="sm" onclick={resetComparison}>
        <RotateCcw class="mr-2 size-4" />
        Reset
      </Button>
    {/if}
  {/snippet}
</AdminHeader>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
  {#if isLoading}
    <DashboardSkeleton />
  {:else if sitios.length === 0}
    <Card.Root class="p-12 text-center">
      <AlertTriangle class="mx-auto size-12 text-muted-foreground" />
      <h2 class="mt-4 text-lg font-semibold">No Data Available</h2>
      <p class="mt-2 text-muted-foreground">
        There are no sitios in the system to compare. Please add sitio data first.
      </p>
      <Button class="mt-4" href="/admin/sitios/new">Add Sitio</Button>
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
                Select a comparison type, choose sitios and years, then click "Generate Comparison"
                to see the results.
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
                <Card.Description class="flex items-center gap-2">
                  <Badge variant="secondary" class="capitalize">
                    {comparisonResult.type}
                  </Badge>
                  <span>{comparisonTitle()}</span>
                </Card.Description>
              </Card.Header>
            </Card.Root>

            <!-- Results Tabs -->
            <Tabs.Root value="table">
              <Tabs.List class="grid w-full grid-cols-2">
                <Tabs.Trigger value="table">Data Table</Tabs.Trigger>
                <Tabs.Trigger value="charts">Charts</Tabs.Trigger>
              </Tabs.List>

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
                        Comparing aggregated data across {comparisonResult.entities.length}
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

              <Tabs.Content value="charts" class="mt-4">
                <ComparisonCharts result={comparisonResult} />
              </Tabs.Content>
            </Tabs.Root>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
