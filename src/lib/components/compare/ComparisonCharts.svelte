<script lang="ts">
  import BarChart from '$lib/components/charts/BarChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import type {
    AggregateComparisonResult,
    ComparisonMetricGroup,
    SpatialComparisonResult,
    TemporalComparisonResult
  } from '$lib/types/comparison';
  import { cn } from '$lib/utils';
  import { getDefaultSeriesColors } from '$lib/utils/chart-colors';
  import { generateSingleMetricChartData } from '$lib/utils/comparison';

  interface Props {
    result: TemporalComparisonResult | SpatialComparisonResult | AggregateComparisonResult;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  // Get chart colors
  const chartColors = $derived(getDefaultSeriesColors());

  // Get available metric keys for charting
  const availableMetrics = $derived(() => {
    const metrics: Array<{ key: string; label: string; group: ComparisonMetricGroup }> = [];

    for (const [group, groupMetrics] of Object.entries(result.metricsByGroup)) {
      for (const metric of groupMetrics) {
        // Only include numeric metrics
        const hasNumericValues = metric.values.some((v) => typeof v.value === 'number');
        if (hasNumericValues) {
          metrics.push({
            key: metric.key,
            label: metric.label,
            group: group as ComparisonMetricGroup
          });
        }
      }
    }

    return metrics;
  });

  // Selected metrics for charting
  let selectedMetricKeys = $state<string[]>([]);

  // Initialize with default metrics
  $effect(() => {
    if (availableMetrics().length > 0) {
      // Default to first 4 metrics
      selectedMetricKeys = availableMetrics()
        .slice(0, 4)
        .map((m) => m.key);
    }
  });

  // Generate chart data for each selected metric
  const chartsData = $derived(() => {
    return selectedMetricKeys
      .map((key) => {
        const data = generateSingleMetricChartData(result, key);
        if (!data) return null;
        return { key, ...data };
      })
      .filter(Boolean) as Array<{
      key: string;
      labels: string[];
      values: number[];
      metricLabel: string;
    }>;
  });

  // Toggle metric selection
  function toggleMetric(key: string) {
    if (selectedMetricKeys.includes(key)) {
      selectedMetricKeys = selectedMetricKeys.filter((k) => k !== key);
    } else if (selectedMetricKeys.length < 8) {
      selectedMetricKeys = [...selectedMetricKeys, key];
    }
  }

  // Get description based on result type
  const chartDescription = $derived(() => {
    if (result.type === 'temporal') {
      return `Trends over time for ${result.sitio.sitioName}, ${result.sitio.barangay}`;
    } else if (result.type === 'spatial') {
      return `Comparison across ${result.sitios.length} sitios for ${result.year}`;
    } else {
      return `${result.aggregateLevel === 'municipality' ? 'Municipality' : 'Barangay'} comparison for ${result.year}`;
    }
  });
</script>

<Card.Root class={cn('', className)}>
  <Card.Header>
    <Card.Title>Comparison Charts</Card.Title>
    <Card.Description>
      {chartDescription()}
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-6">
    <!-- Metric selector -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">Select metrics to visualize (max 8)</Label>
        <span class="text-xs text-muted-foreground">
          {selectedMetricKeys.length} / 8 selected
        </span>
      </div>
      <ScrollArea class="h-32 rounded-lg border p-3">
        <div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {#each availableMetrics() as metric (metric.key)}
            {@const isSelected = selectedMetricKeys.includes(metric.key)}
            <label
              class={cn(
                'flex cursor-pointer items-center gap-2 rounded-md p-2 text-xs transition-colors',
                isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleMetric(metric.key)}
                disabled={!isSelected && selectedMetricKeys.length >= 8}
              />
              <span class="truncate">{metric.label}</span>
            </label>
          {/each}
        </div>
      </ScrollArea>
    </div>

    <!-- Charts Grid -->
    {#if chartsData().length > 0}
      <div class="grid gap-6">
        {#each chartsData() as chartData, index (chartData.key)}
          <Card.Root class="overflow-hidden">
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">{chartData.metricLabel}</Card.Title>
            </Card.Header>
            <Card.Content class="p-4">
              {#if result.type === 'temporal'}
                <!-- Line chart for temporal comparison -->
                <div class="h-56">
                  <LineChart
                    series={[
                      {
                        name: chartData.metricLabel,
                        data: chartData.values,
                        color: chartColors[index % chartColors.length]
                      }
                    ]}
                    categories={chartData.labels}
                    height={224}
                    showLegend={false}
                    curve="smooth"
                  />
                </div>
              {:else}
                <!-- Bar chart for spatial and aggregate comparison -->
                <div class="h-56">
                  <BarChart
                    data={chartData.labels.map((label, i) => ({
                      label,
                      value: chartData.values[i],
                      color: chartColors[i % chartColors.length]
                    }))}
                    height={224}
                    orientation="vertical"
                  />
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {:else}
      <div class="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p class="text-sm text-muted-foreground">Select metrics above to display charts</p>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
