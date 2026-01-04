<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import type {
    ComparisonDiff,
    ComparisonMetricValue,
    SpatialComparisonResult,
    TemporalComparisonResult
  } from '$lib/types/comparison';
  import { cn } from '$lib/utils';
  import MetricChangeIndicator from './MetricChangeIndicator.svelte';

  interface Props {
    result: TemporalComparisonResult | SpatialComparisonResult;
    title?: string;
    showChanges?: boolean;
    class?: string;
  }

  let { result, title, showChanges = true, class: className = '' }: Props = $props();

  // Get headers based on comparison type
  const headers = $derived(() => {
    if (result.type === 'temporal') {
      return result.years.map(String);
    } else {
      return result.sitios.map((s) => `${s.sitioName}`);
    }
  });

  // Get all metrics across selected groups
  const allMetrics = $derived(() => {
    const metrics: Array<{ group: string; metrics: ComparisonMetricValue[] }> = [];

    for (const [group, groupMetrics] of Object.entries(result.metricsByGroup)) {
      if (groupMetrics.length > 0) {
        metrics.push({ group, metrics: groupMetrics });
      }
    }

    return metrics;
  });

  // Get change for a metric between columns (only for temporal)
  function getOverallChange(metricKey: string): ComparisonDiff | null {
    if (result.type !== 'temporal' || !showChanges) return null;
    return result.overallTrend[metricKey] ?? null;
  }

  // Get ranking badge for spatial comparison
  function getRankBadge(metricKey: string, sitioId: number): number | null {
    if (result.type !== 'spatial') return null;
    return result.rankings[metricKey]?.[sitioId] ?? null;
  }

  const groupLabels: Record<string, string> = {
    demographics: 'Demographics & Population',
    utilities: 'Basic Utilities',
    infrastructure: 'Roads & Infrastructure',
    facilities: 'Community Facilities',
    livelihood: 'Livelihood & Agriculture',
    safety: 'Safety & Risk',
    education: 'Education',
    customFields: 'Custom Fields'
  };
</script>

<Card.Root class={cn('overflow-hidden py-0', className)}>
  {#if title}
    <Card.Header class="pb-3">
      <Card.Title class="text-lg">{title}</Card.Title>
    </Card.Header>
  {/if}
  <Card.Content class="p-4">
    <div class="overflow-x-auto rounded-lg">
      <Table.Root>
        <Table.Header>
          <Table.Row class="bg-muted/50">
            <Table.Head class="w-50 font-semibold">Metric</Table.Head>
            {#each headers() as header}
              <Table.Head class="text-center font-semibold">{header}</Table.Head>
            {/each}
            {#if result.type === 'temporal' && showChanges}
              <Table.Head class="text-center font-semibold">Change</Table.Head>
            {/if}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each allMetrics() as { group, metrics }}
            <!-- Group header row -->
            <Table.Row class="bg-muted/30">
              <Table.Cell
                colspan={headers().length + (result.type === 'temporal' && showChanges ? 2 : 1)}
                class="py-2"
              >
                <span class="text-sm font-semibold text-muted-foreground">
                  {groupLabels[group] ?? group}
                </span>
              </Table.Cell>
            </Table.Row>

            <!-- Metric rows -->
            {#each metrics as metric (metric.key)}
              <Table.Row class="transition-colors hover:bg-muted/20">
                <Table.Cell class="font-medium">
                  <div class="flex flex-col">
                    <span>{metric.label}</span>
                    {#if metric.unit}
                      <span class="text-xs text-muted-foreground">({metric.unit})</span>
                    {/if}
                  </div>
                </Table.Cell>

                {#each metric.values as value, idx (value.subjectId)}
                  <Table.Cell class="text-center">
                    <div class="flex flex-col items-center gap-1">
                      <span class="font-mono">{value.displayValue}</span>
                      {#if result.type === 'spatial'}
                        {@const rank = getRankBadge(metric.key, parseInt(value.subjectId))}
                        {#if rank !== null}
                          <Badge
                            variant={rank === 1 ? 'default' : rank === 2 ? 'secondary' : 'outline'}
                            class="px-1.5 py-0 text-[10px]"
                          >
                            #{rank}
                          </Badge>
                        {/if}
                      {/if}
                    </div>
                  </Table.Cell>
                {/each}

                {#if result.type === 'temporal' && showChanges}
                  <Table.Cell class="text-center">
                    <MetricChangeIndicator
                      diff={getOverallChange(metric.key)}
                      showPercent
                      showValue={false}
                    />
                  </Table.Cell>
                {/if}
              </Table.Row>
            {/each}
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </Card.Content>
</Card.Root>
