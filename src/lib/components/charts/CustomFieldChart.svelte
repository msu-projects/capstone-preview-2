<script lang="ts">
  import BarChart from '$lib/components/charts/BarChart.svelte';
  import DonutChart from '$lib/components/charts/DonutChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Progress } from '$lib/components/ui/progress';
  import type { CustomFieldDefinition, SitioRecord } from '$lib/types';
  import { DEFAULT_VISUALIZATION_CONFIG } from '$lib/types';
  import {
    extractBooleanTrendData,
    extractFieldTrendData,
    generatePreviewData,
    transformArrayToBar,
    transformBooleanToDonut,
    transformCheckboxToBar,
    transformNumberToBar,
    transformRadioToDonut
  } from '$lib/utils/custom-field-visualization';
  import { Expand, TrendingUp } from '@lucide/svelte';

  interface Props {
    /** The custom field definition */
    fieldDef: CustomFieldDefinition;
    /** The value of the custom field */
    value: unknown;
    /** Optional sitio record for trend data (needed if showTrend is enabled) */
    sitioRecord?: SitioRecord;
    /** Current selected year */
    selectedYear?: number;
    /** Use preview/sample data (for admin config preview) */
    usePreviewData?: boolean;
    /** Custom class for the container */
    class?: string;
  }

  let {
    fieldDef,
    value,
    sitioRecord,
    selectedYear,
    usePreviewData = false,
    class: className = ''
  }: Props = $props();

  const config = $derived(fieldDef.visualizationConfig ?? DEFAULT_VISUALIZATION_CONFIG);

  let showTrendModal = $state(false);

  // Generate chart data based on field type and value
  const chartData = $derived.by(() => {
    if (usePreviewData) {
      return generatePreviewData(fieldDef);
    }

    switch (fieldDef.dataType) {
      case 'boolean':
        return { donutData: transformBooleanToDonut(value, config) };

      case 'radio':
        return {
          donutData: transformRadioToDonut(value, fieldDef.validationRules.choices ?? [], config)
        };

      case 'checkbox':
        return {
          barData: transformCheckboxToBar(value, fieldDef.validationRules.choices ?? [], config)
        };

      case 'number':
        return {
          barData: transformNumberToBar(value, fieldDef.displayLabel, config)
        };

      case 'array':
        return { barData: transformArrayToBar(value, config) };

      case 'text':
        // For text, we can show a simple "has value" indicator
        return {
          barData: transformNumberToBar(value ? 1 : 0, value ? 'Recorded' : 'Not Recorded', config)
        };

      case 'date':
        // Show if date is recorded
        return {
          barData: transformNumberToBar(value ? 1 : 0, value ? 'Recorded' : 'Not Recorded', config)
        };

      default:
        return {};
    }
  });

  // Generate trend data if enabled and sitioRecord is available
  const trendData = $derived.by(() => {
    if (!config.showTrend || !sitioRecord) return null;

    if (usePreviewData) {
      const preview = generatePreviewData(fieldDef);
      return preview.lineData;
    }

    if (fieldDef.dataType === 'number') {
      return extractFieldTrendData(fieldDef.id, sitioRecord, config.trendYears);
    }

    if (fieldDef.dataType === 'boolean') {
      return extractBooleanTrendData(fieldDef.id, sitioRecord, config.trendYears);
    }

    return null;
  });

  // Determine which chart to render based on config
  const shouldShowDonut = $derived(
    config.chartType === 'donut' && chartData.donutData && chartData.donutData.length > 0
  );

  const shouldShowBar = $derived(
    config.chartType === 'bar' && chartData.barData && chartData.barData.length > 0
  );

  const shouldShowLine = $derived(
    config.chartType === 'line' && trendData?.series && trendData.series.length > 0
  );

  const shouldShowProgress = $derived(
    config.chartType === 'progress' && fieldDef.dataType === 'number'
  );

  // For progress bar, calculate percentage
  const progressValue = $derived(() => {
    if (fieldDef.dataType !== 'number' || typeof value !== 'number') return 0;
    const max = fieldDef.validationRules.max ?? 100;
    const min = fieldDef.validationRules.min ?? 0;
    return ((value - min) / (max - min)) * 100;
  });

  const hasAnyChart = $derived(
    shouldShowDonut || shouldShowBar || shouldShowLine || shouldShowProgress
  );
</script>

{#if config.enableChart && hasAnyChart}
  <div class="custom-field-chart {className}">
    {#if config.displayMode === 'modal'}
      <!-- Modal mode: Show button to open chart in modal -->
      <Button variant="outline" size="sm" class="gap-2" onclick={() => (showTrendModal = true)}>
        <Expand class="size-4" />
        View Chart
      </Button>

      <Dialog.Root bind:open={showTrendModal}>
        <Dialog.Content class="max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>{fieldDef.displayLabel}</Dialog.Title>
            {#if fieldDef.description}
              <Dialog.Description>{fieldDef.description}</Dialog.Description>
            {/if}
          </Dialog.Header>
          <div class="py-4">
            {#if shouldShowDonut && chartData.donutData}
              <DonutChart
                data={chartData.donutData}
                height={config.chartHeight}
                centerLabel={fieldDef.displayLabel}
              />
            {:else if shouldShowBar && chartData.barData}
              <BarChart data={chartData.barData} height={config.chartHeight} />
            {:else if shouldShowLine && trendData}
              <LineChart
                series={trendData.series}
                categories={trendData.categories}
                height={config.chartHeight}
                title="{fieldDef.displayLabel} Trend"
              />
            {:else if shouldShowProgress}
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span>{fieldDef.displayLabel}</span>
                  <span class="font-medium"
                    >{typeof value === 'number' ? value.toLocaleString() : 0}</span
                  >
                </div>
                <Progress value={progressValue()} class="h-3" />
              </div>
            {/if}
          </div>
        </Dialog.Content>
      </Dialog.Root>
    {:else if config.displayMode === 'card'}
      <!-- Card mode: Standalone card with chart -->
      <div
        class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
      >
        <h4 class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          {fieldDef.displayLabel}
        </h4>
        {#if shouldShowDonut && chartData.donutData}
          <DonutChart data={chartData.donutData} height={config.chartHeight} centerLabel="Value" />
        {:else if shouldShowBar && chartData.barData}
          <BarChart data={chartData.barData} height={config.chartHeight} />
        {:else if shouldShowLine && trendData}
          <LineChart
            series={trendData.series}
            categories={trendData.categories}
            height={config.chartHeight}
          />
        {:else if shouldShowProgress}
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Value</span>
              <span class="font-medium"
                >{typeof value === 'number' ? value.toLocaleString() : 0}</span
              >
            </div>
            <Progress value={progressValue()} class="h-3" />
          </div>
        {/if}
      </div>
    {:else}
      <!-- Inline mode: Embedded chart -->
      <div class="inline-chart">
        {#if shouldShowDonut && chartData.donutData}
          <DonutChart data={chartData.donutData} height={config.chartHeight} showLegend={true} />
        {:else if shouldShowBar && chartData.barData}
          <BarChart data={chartData.barData} height={config.chartHeight} />
        {:else if shouldShowLine && trendData}
          <LineChart
            series={trendData.series}
            categories={trendData.categories}
            height={config.chartHeight}
          />
        {:else if shouldShowProgress}
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>{fieldDef.displayLabel}</span>
              <span class="font-medium"
                >{typeof value === 'number' ? value.toLocaleString() : 0}</span
              >
            </div>
            <Progress value={progressValue()} class="h-3" />
          </div>
        {/if}
      </div>
    {/if}

    <!-- Trend button if trend is enabled but not already showing line chart -->
    {#if config.showTrend && trendData && config.chartType !== 'line'}
      <Button variant="ghost" size="sm" class="mt-2 gap-2" onclick={() => (showTrendModal = true)}>
        <TrendingUp class="size-4" />
        View Trend
      </Button>

      <Dialog.Root bind:open={showTrendModal}>
        <Dialog.Content class="max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>{fieldDef.displayLabel} - Trend</Dialog.Title>
            <Dialog.Description>
              {config.trendYears}-year trend for {fieldDef.displayLabel}
            </Dialog.Description>
          </Dialog.Header>
          <div class="py-4">
            <LineChart
              series={trendData.series}
              categories={trendData.categories}
              height={300}
              title="{fieldDef.displayLabel} Over Time"
            />
          </div>
        </Dialog.Content>
      </Dialog.Root>
    {/if}
  </div>
{/if}
