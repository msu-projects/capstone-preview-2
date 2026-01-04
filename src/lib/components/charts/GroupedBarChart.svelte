<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getChartColors, getDefaultSeriesColors } from '$lib/utils/chart-colors';
  import { Chart } from '@flowbite-svelte-plugins/chart';
  import type { ApexOptions } from 'apexcharts';

  export interface GroupedBarSeries {
    name: string;
    data: number[];
    color?: string;
  }

  interface Props {
    series: GroupedBarSeries[];
    categories: string[];
    height?: number;
    title?: string;
    orientation?: 'horizontal' | 'vertical';
    showDataLabels?: boolean;
    yAxisFormatter?: (val: number) => string;
    xAxisFormatter?: (val: string) => string;
  }

  let {
    series,
    categories,
    height = 300,
    title,
    orientation = 'vertical',
    showDataLabels = false,
    yAxisFormatter = (val) => val.toLocaleString(),
    xAxisFormatter
  }: Props = $props();

  // Get theme-aware colors
  const chartColors = $derived(getChartColors());
  const defaultColors = $derived(getDefaultSeriesColors());

  const seriesColors = $derived(
    series.map((s, i) => s.color || defaultColors[i % defaultColors.length])
  );

  const options = $derived<ApexOptions>({
    chart: {
      type: 'bar',
      height: height,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: orientation === 'horizontal',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        barHeight: orientation === 'horizontal' ? '70%' : undefined,
        columnWidth: orientation === 'vertical' ? '70%' : undefined,
        dataLabels: {
          position: orientation === 'horizontal' ? 'center' : 'top'
        }
      }
    },
    colors: seriesColors,
    dataLabels: {
      enabled: showDataLabels,
      formatter: (val) => Number(val).toLocaleString(),
      style: {
        fontSize: '10px',
        fontWeight: 600,
        colors: ['#fff']
      }
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data
    })),
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: chartColors.labelColor,
          fontSize: '12px',
          fontWeight: 500
        },
        formatter: xAxisFormatter,
        rotate: orientation === 'vertical' && categories.length > 5 ? -45 : 0,
        rotateAlways: orientation === 'vertical' && categories.length > 5
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: chartColors.labelColor,
          fontSize: '12px',
          fontWeight: 500
        },
        formatter: yAxisFormatter
      }
    },
    grid: {
      borderColor: chartColors.gridColor,
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: orientation === 'horizontal'
        }
      },
      yaxis: {
        lines: {
          show: orientation === 'vertical'
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontWeight: 500,
      labels: {
        colors: chartColors.labelColor
      },
      markers: {
        size: 8,
        shape: 'circle'
      }
    },
    tooltip: {
      theme: themeStore.resolvedTheme,
      y: {
        formatter: yAxisFormatter
      }
    }
  });
</script>

<div class="grouped-bar-chart">
  {#if title}
    <h3 class="mb-2 text-sm font-semibold text-foreground">{title}</h3>
  {/if}
  {#key themeStore.resolvedTheme}
    <Chart {options} />
  {/key}
</div>

<style>
  .grouped-bar-chart {
    width: 100%;
  }
</style>
