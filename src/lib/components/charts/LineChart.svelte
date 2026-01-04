<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getChartColors, getDefaultSeriesColors } from '$lib/utils/chart-colors';
  import { Chart } from '@flowbite-svelte-plugins/chart';
  import type { ApexOptions } from 'apexcharts';

  export interface LineChartSeries {
    name: string;
    data: number[];
    color?: string;
  }

  interface Props {
    series: LineChartSeries[];
    categories: string[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    title?: string;
    curve?: 'smooth' | 'straight' | 'stepline';
    showDataLabels?: boolean;
    yAxisFormatter?: (val: number) => string;
  }

  let {
    series,
    categories,
    height = 300,
    showGrid = true,
    showLegend = true,
    title,
    curve = 'smooth',
    showDataLabels = false,
    yAxisFormatter = (val) => val.toLocaleString()
  }: Props = $props();

  // Get theme-aware colors
  const colors = $derived(getChartColors());
  const defaultColors = $derived(getDefaultSeriesColors());

  // Prepare series data with colors
  const chartSeries = $derived(
    series.map((s, i) => ({
      name: s.name,
      data: s.data,
      color: s.color || defaultColors[i % defaultColors.length]
    }))
  );

  // Prepare chart options
  const options = $derived<ApexOptions>({
    chart: {
      type: 'line',
      height: height,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        speed: 800
      }
    },
    stroke: {
      curve: curve,
      width: 3
    },
    dataLabels: {
      enabled: showDataLabels
    },
    series: chartSeries.map((s) => ({
      name: s.name,
      data: s.data
    })),
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: colors.labelColor,
          fontSize: '12px',
          fontWeight: 500
        }
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
          colors: colors.labelColor,
          fontSize: '12px',
          fontWeight: 500
        },
        formatter: yAxisFormatter
      }
    },
    grid: {
      show: showGrid,
      borderColor: colors.gridColor,
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    colors: chartSeries.map((s) => s.color),
    markers: {
      size: 5,
      colors: chartSeries.map((s) => s.color),
      strokeColors: themeStore.resolvedTheme === 'dark' ? '#1e293b' : '#fff',
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: themeStore.resolvedTheme,
      y: {
        formatter: yAxisFormatter
      }
    },
    legend: {
      show: showLegend,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontWeight: 500,
      labels: {
        colors: colors.labelColor
      },
      markers: {
        size: 8,
        shape: 'circle'
      },
      itemMargin: {
        horizontal: 12,
        vertical: 8
      }
    }
  });
</script>

<div class="w-full">
  {#if title}
    <h3 class="mb-2 text-sm font-semibold text-foreground">{title}</h3>
  {/if}
  <div class="w-full" style="height: {height}px;">
    {#key themeStore.resolvedTheme}
      <Chart {options} />
    {/key}
  </div>
</div>
