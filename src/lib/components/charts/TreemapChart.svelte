<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getChartColors, getDefaultSeriesColors } from '$lib/utils/chart-colors';
  import { Chart } from '@flowbite-svelte-plugins/chart';
  import type { ApexOptions } from 'apexcharts';

  export interface TreemapData {
    label: string;
    value: number;
    color?: string;
  }

  interface Props {
    data: TreemapData[];
    height?: number;
    title?: string;
    distributed?: boolean;
    onSegmentClick?: (data: { label: string; value: number; index: number }) => void;
  }

  let { data, height = 350, title, distributed = true, onSegmentClick }: Props = $props();

  // Get theme-aware colors
  const chartColors = $derived(getChartColors());
  const defaultColors = $derived(getDefaultSeriesColors());

  // Transform data for treemap
  const treemapData = $derived(
    data.map((d, i) => ({
      x: d.label,
      y: d.value,
      fillColor: d.color || defaultColors[i % defaultColors.length]
    }))
  );

  // Color scale for non-distributed mode
  const colorScale = $derived(
    themeStore.resolvedTheme === 'dark'
      ? [
          { from: 0, to: 10, color: '#475569' },
          { from: 11, to: 50, color: '#64748b' },
          { from: 51, to: 100, color: '#94a3b8' },
          { from: 101, to: 500, color: '#cbd5e1' },
          { from: 501, to: 10000, color: '#e2e8f0' }
        ]
      : [
          { from: 0, to: 10, color: '#cbd5e1' },
          { from: 11, to: 50, color: '#94a3b8' },
          { from: 51, to: 100, color: '#64748b' },
          { from: 101, to: 500, color: '#475569' },
          { from: 501, to: 10000, color: '#334155' }
        ]
  );

  const options = $derived<ApexOptions>({
    chart: {
      type: 'treemap',
      height: height,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      toolbar: {
        show: false
      },
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          if (onSegmentClick && config.dataPointIndex >= 0) {
            const selectedData = data[config.dataPointIndex];
            onSegmentClick({
              label: selectedData.label,
              value: selectedData.value,
              index: config.dataPointIndex
            });
          }
        }
      }
    },
    series: [
      {
        data: treemapData
      }
    ],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '13px',
        fontWeight: 600,
        colors: ['#fff']
      },
      formatter: function (text, op) {
        return [text, op.value.toLocaleString()];
      },
      offsetY: -4
    },
    plotOptions: {
      treemap: {
        distributed: distributed,
        enableShades: !distributed,
        shadeIntensity: 0.5,
        colorScale: {
          ranges: distributed ? [] : colorScale
        }
      }
    },
    tooltip: {
      theme: themeStore.resolvedTheme,
      y: {
        formatter: (val) => val.toLocaleString()
      }
    },
    stroke: {
      width: 2,
      colors: [themeStore.resolvedTheme === 'dark' ? '#1e293b' : '#fff']
    }
  });
</script>

<div class="treemap-chart" class:cursor-pointer={!!onSegmentClick}>
  {#key themeStore.resolvedTheme}
    <Chart {options} />
  {/key}
</div>

<style>
  .treemap-chart {
    width: 100%;
  }
</style>
