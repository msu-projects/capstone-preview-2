<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getChartColors, getDefaultSeriesColors } from '$lib/utils/chart-colors';
  import { Chart } from '@flowbite-svelte-plugins/chart';
  import type { ApexOptions } from 'apexcharts';

  export interface BarChartData {
    label: string;
    value: number;
    color?: string;
  }

  interface Props {
    data: BarChartData[];
    orientation?: 'horizontal' | 'vertical';
    height?: number;
    showGrid?: boolean;
    title?: string;
    rotate?: number;
    rotateAlways?: boolean;
    onBarClick?: (data: { label: string; value: number; index: number }) => void;
  }

  let {
    data,
    orientation = 'vertical',
    height = 300,
    showGrid = true,
    title,
    rotateAlways,
    rotate = -30,
    onBarClick
  }: Props = $props();

  // Get theme-aware colors
  const colors = $derived(getChartColors());
  const defaultColors = $derived(getDefaultSeriesColors());

  // Prepare chart data with colors
  const chartData = $derived(
    data.map((d, i) => ({
      ...d,
      color: d.color || defaultColors[i % defaultColors.length]
    }))
  );

  // Prepare chart options
  const options = $derived<ApexOptions>({
    chart: {
      type: 'bar',
      height: height,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      toolbar: {
        show: false
      },
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          if (onBarClick && config.dataPointIndex >= 0) {
            const selectedData = data[config.dataPointIndex];
            onBarClick({
              label: selectedData.label,
              value: selectedData.value,
              index: config.dataPointIndex
            });
          }
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: orientation === 'horizontal',
        columnWidth: orientation === 'vertical' ? '60%' : undefined,
        barHeight: orientation === 'horizontal' ? '70%' : undefined,
        borderRadius: 6,
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    series: [
      {
        name: title || 'Value',
        data: chartData.map((d) => d.value)
      }
    ],
    xaxis: {
      categories: chartData.map((d) => d.label),
      labels: {
        style: {
          colors: colors.labelColor,
          fontSize: '12px',
          fontWeight: 500
        },
        rotate,
        rotateAlways
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
        formatter: (val) => val.toLocaleString()
      }
    },
    grid: {
      show: showGrid,
      borderColor: colors.gridColor,
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
    colors: chartData.map((d) => d.color),
    fill: {
      opacity: 1,
      colors: chartData.map((d) => d.color)
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => val.toLocaleString()
      }
    },
    legend: {
      show: false
    },
    states: {
      hover: {
        filter: {
          type: 'lighten'
        }
      }
    }
  });
</script>

<div class="w-full" class:cursor-pointer={!!onBarClick}>
  {#if title}
    <h3 class="mb-2 text-sm font-semibold text-foreground">{title}</h3>
  {/if}
  <div class="w-full" style="height: {height}px;">
    {#key themeStore.resolvedTheme}
      <Chart {options} />
    {/key}
  </div>
</div>
