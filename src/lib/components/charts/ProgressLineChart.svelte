<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';

  export interface ProgressChartDataPoint {
    month: string;
    month_year: string;
    plan_physical: number;
    actual_physical: number | null;
    plan_financial?: number;
    actual_financial?: number | null;
  }

  interface Props {
    data: ProgressChartDataPoint[];
    height?: number;
    showFinancial?: boolean;
  }

  let { data, height = 280, showFinancial = true }: Props = $props();

  // SVG dimensions and margins
  const margin = $derived({ top: 20, right: showFinancial ? 70 : 20, bottom: 40, left: 50 });
  let containerWidth = $state(600);

  // Reactive dimensions
  const innerWidth = $derived(Math.max(containerWidth - margin.left - margin.right, 100));
  const chartHeight = $derived(height - margin.top - margin.bottom);

  // Sort data by month_year ascending for proper line drawing
  const sortedData = $derived([...data].sort((a, b) => a.month_year.localeCompare(b.month_year)));

  // Calculate scales
  const maxFinancial = $derived(
    Math.max(...sortedData.map((d) => Math.max(d.plan_financial ?? 0, d.actual_financial ?? 0)), 1)
  );

  // X scale - evenly distribute points
  function xScale(index: number): number {
    if (sortedData.length <= 1) return innerWidth / 2;
    return (index / (sortedData.length - 1)) * innerWidth;
  }

  // Y scale for percentages (0-100%)
  function yScalePercent(value: number): number {
    return chartHeight - (value / 100) * chartHeight;
  }

  // Y scale for financial values
  function yScaleFinancial(value: number): number {
    return chartHeight - (value / maxFinancial) * chartHeight;
  }

  // Generate path for a line series
  function generatePath(
    points: { x: number; y: number | null }[],
    skipNulls: boolean = true
  ): string {
    const validPoints = skipNulls
      ? points.filter((p) => p.y !== null)
      : points.map((p) => ({ ...p, y: p.y ?? 0 }));

    if (validPoints.length === 0) return '';

    return validPoints
      .map((p, i) => {
        const command = i === 0 ? 'M' : 'L';
        return `${command} ${p.x} ${p.y}`;
      })
      .join(' ');
  }

  // Paths for each series (starting from zero)
  const plannedPhysicalPath = $derived(
    generatePath(
      [
        { x: xScale(0), y: yScalePercent(0) }, // Start from zero
        ...sortedData.map((d, i) => ({ x: xScale(i), y: yScalePercent(d.plan_physical) }))
      ],
      false
    )
  );

  const actualPhysicalPath = $derived(
    generatePath([
      { x: xScale(0), y: yScalePercent(0) }, // Start from zero
      ...sortedData.map((d, i) => ({
        x: xScale(i),
        y: d.actual_physical !== null ? yScalePercent(d.actual_physical) : null
      }))
    ])
  );

  const plannedFinancialPath = $derived(
    generatePath(
      [
        { x: xScale(0), y: yScaleFinancial(0) }, // Start from zero
        ...sortedData.map((d, i) => ({ x: xScale(i), y: yScaleFinancial(d.plan_financial ?? 0) }))
      ],
      false
    )
  );

  const actualFinancialPath = $derived(
    generatePath([
      { x: xScale(0), y: yScaleFinancial(0) }, // Start from zero
      ...sortedData.map((d, i) => ({
        x: xScale(i),
        y: d.actual_financial !== null ? yScaleFinancial(d.actual_financial ?? 0) : null
      }))
    ])
  );

  // Hover state
  let hoveredIndex = $state<number | null>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  function handleMouseMove(event: MouseEvent, index: number) {
    hoveredIndex = index;
    const rect = (event.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect();
    if (rect) {
      tooltipX = event.clientX - rect.left;
      tooltipY = event.clientY - rect.top;
    }
  }

  function handleMouseLeave() {
    hoveredIndex = null;
  }

  // Y-axis ticks for percentages
  const yTicksPercent = [0, 25, 50, 75, 100];

  // Y-axis ticks for financial (dynamic based on max)
  const yTicksFinancial = $derived(() => {
    const step = maxFinancial / 4;
    return [0, step, step * 2, step * 3, maxFinancial];
  });
</script>

<div class="relative w-full" bind:clientWidth={containerWidth}>
  {#if sortedData.length === 0}
    <!-- Empty State -->
    <div
      class="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
      style="height: {height}px"
    >
      <div class="text-center">
        <p class="text-sm text-slate-500 dark:text-slate-400">No progress data recorded yet</p>
        <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Submit monthly updates to see progress trends
        </p>
      </div>
    </div>
  {:else}
    <svg width={containerWidth} {height} class="overflow-visible">
      <g transform="translate({margin.left}, {margin.top})">
        <!-- Grid lines -->
        {#each yTicksPercent as tick}
          <line
            x1={0}
            y1={yScalePercent(tick)}
            x2={innerWidth}
            y2={yScalePercent(tick)}
            stroke="currentColor"
            stroke-opacity="0.1"
            stroke-dasharray="4,4"
          />
        {/each}

        <!-- Y-axis left (Percentage) -->
        <g class="text-xs text-slate-500 dark:text-slate-400">
          {#each yTicksPercent as tick}
            <text
              x={-8}
              y={yScalePercent(tick)}
              text-anchor="end"
              dominant-baseline="middle"
              fill="currentColor"
            >
              {tick}%
            </text>
          {/each}
          <text
            x={-35}
            y={chartHeight / 2}
            text-anchor="middle"
            dominant-baseline="middle"
            transform="rotate(-90, -35, {chartHeight / 2})"
            fill="currentColor"
            class="text-[10px]"
          >
            Physical Progress
          </text>
        </g>

        <!-- Y-axis right (Financial) - only if showFinancial -->
        {#if showFinancial}
          <g class="text-xs text-slate-500 dark:text-slate-400">
            {#each yTicksFinancial() as tick, i}
              <text
                x={innerWidth + 8}
                y={yScaleFinancial(tick)}
                text-anchor="start"
                dominant-baseline="middle"
                fill="currentColor"
              >
                {i === 0 ? '₱0' : formatCurrency(tick)}
              </text>
            {/each}
            <text
              x={innerWidth + 55}
              y={chartHeight / 2}
              text-anchor="middle"
              dominant-baseline="middle"
              transform="rotate(90, {innerWidth + 55}, {chartHeight / 2})"
              fill="currentColor"
              class="text-[10px]"
            >
              Financial
            </text>
          </g>
        {/if}

        <!-- X-axis (Months) -->
        <g class="text-xs text-slate-500 dark:text-slate-400">
          {#each sortedData as point, i}
            <text x={xScale(i)} y={chartHeight + 20} text-anchor="middle" fill="currentColor">
              {point.month.split(' ')[0]}
            </text>
            {#if sortedData.length <= 6 || i === 0 || i === sortedData.length - 1}
              <text
                x={xScale(i)}
                y={chartHeight + 32}
                text-anchor="middle"
                fill="currentColor"
                class="text-[10px] opacity-60"
              >
                {point.month.split(' ')[1]}
              </text>
            {/if}
          {/each}
        </g>

        <!-- Planned Physical (dashed blue) -->
        <path
          d={plannedPhysicalPath}
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
          stroke-dasharray="6,4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Actual Physical (solid blue) -->
        <path
          d={actualPhysicalPath}
          fill="none"
          stroke="#3b82f6"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        {#if showFinancial}
          <!-- Planned Financial (dashed emerald) -->
          <path
            d={plannedFinancialPath}
            fill="none"
            stroke="#10b981"
            stroke-width="2"
            stroke-dasharray="6,4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Actual Financial (solid emerald) -->
          <path
            d={actualFinancialPath}
            fill="none"
            stroke="#10b981"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        {/if}

        <!-- Data points and hover zones -->
        {#each sortedData as point, i}
          <!-- Invisible hover zone -->
          <rect
            x={xScale(i) - 20}
            y={0}
            width={40}
            height={chartHeight}
            fill="transparent"
            class="cursor-pointer"
            onmousemove={(e) => handleMouseMove(e, i)}
            onmouseleave={handleMouseLeave}
            role="button"
            tabindex="0"
            aria-label="View data for {point.month}"
          />

          <!-- Actual Physical point -->
          {#if point.actual_physical !== null}
            <circle
              cx={xScale(i)}
              cy={yScalePercent(point.actual_physical)}
              r={hoveredIndex === i ? 6 : 4}
              fill="#3b82f6"
              class="transition-all duration-150"
            />
          {/if}

          <!-- Planned Physical point -->
          <circle
            cx={xScale(i)}
            cy={yScalePercent(point.plan_physical)}
            r={hoveredIndex === i ? 5 : 3}
            fill="white"
            stroke="#3b82f6"
            stroke-width="2"
            class="transition-all duration-150"
          />

          {#if showFinancial}
            <!-- Actual Financial point -->
            {#if point.actual_financial !== null}
              <circle
                cx={xScale(i)}
                cy={yScaleFinancial(point.actual_financial ?? 0)}
                r={hoveredIndex === i ? 6 : 4}
                fill="#10b981"
                class="transition-all duration-150"
              />
            {/if}

            <!-- Planned Financial point -->
            <circle
              cx={xScale(i)}
              cy={yScaleFinancial(point.plan_financial ?? 0)}
              r={hoveredIndex === i ? 5 : 3}
              fill="white"
              stroke="#10b981"
              stroke-width="2"
              class="transition-all duration-150"
            />
          {/if}

          <!-- Vertical hover line -->
          {#if hoveredIndex === i}
            <line
              x1={xScale(i)}
              y1={0}
              x2={xScale(i)}
              y2={chartHeight}
              stroke="currentColor"
              stroke-opacity="0.2"
              stroke-width="1"
            />
          {/if}
        {/each}
      </g>
    </svg>

    <!-- Tooltip -->
    {#if hoveredIndex !== null}
      {@const point = sortedData[hoveredIndex]}
      <div
        class="pointer-events-none absolute z-10 min-w-40 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800"
        style="left: {Math.min(tooltipX + 10, containerWidth - 180)}px; top: {Math.max(
          tooltipY - 80,
          10
        )}px"
      >
        <div class="mb-2 font-semibold text-slate-900 dark:text-slate-100">{point.month}</div>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-4">
            <span class="flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-blue-500"></span>
              Physical
            </span>
            <span class="font-medium">
              {point.actual_physical !== null ? `${point.actual_physical}%` : '-'}
              <span class="text-slate-400">/ {point.plan_physical}%</span>
            </span>
          </div>
          {#if showFinancial}
            <div class="flex items-center justify-between gap-4">
              <span class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-emerald-500"></span>
                Financial
              </span>
              <span class="font-medium">
                {point.actual_financial !== null && point.actual_financial !== undefined
                  ? formatCurrency(point.actual_financial)
                  : '-'}
              </span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Legend -->
    <div
      class="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400"
    >
      <div class="flex items-center gap-1.5">
        <div class="h-0.5 w-4 bg-blue-500"></div>
        <span>Actual Physical</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="h-0.5 w-4 border-t-2 border-dashed border-blue-500"></div>
        <span>Planned Physical</span>
      </div>
      {#if showFinancial}
        <div class="flex items-center gap-1.5">
          <div class="h-0.5 w-4 bg-emerald-500"></div>
          <span>Actual Financial</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="h-0.5 w-4 border-t-2 border-dashed border-emerald-500"></div>
          <span>Planned Financial</span>
        </div>
      {/if}
    </div>
  {/if}
</div>
