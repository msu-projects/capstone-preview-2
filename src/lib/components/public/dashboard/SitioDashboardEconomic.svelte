<script lang="ts">
  import DonutChart from '$lib/components/charts/DonutChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import TreemapChart from '$lib/components/charts/TreemapChart.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import type { SitioRecord } from '$lib/types';
  import {
    aggregateLivelihood,
    aggregateSafety,
    getAllAvailableYears,
    getMultiYearMetrics,
    getYearComparison,
    prepareTimeSeriesData,
    type LivelihoodAggregation,
    type SafetyAggregation,
    type YearComparison
  } from '$lib/utils/sitio-chart-aggregation';
  import {
    Banknote,
    Bird,
    Briefcase,
    Building2,
    ChartLine,
    CheckCircle2,
    Droplets,
    Globe,
    HandCoins,
    Home,
    Info,
    Landmark,
    Leaf,
    Mountain,
    ShieldAlert,
    Sprout,
    Tractor,
    TrendingDown,
    TrendingUp,
    UserCheck,
    Users,
    Waves,
    Wheat,
    Wind
  } from '@lucide/svelte';

  interface Props {
    sitios: SitioRecord[];
    selectedYear?: number;
  }

  let { sitios, selectedYear }: Props = $props();

  // Modal states for trend modals
  let showIncomeTrendModal = $state(false);
  let showPovertyTrendModal = $state(false);
  let showAgricultureTrendModal = $state(false);

  // Get available years for comparison
  const availableYears = $derived(getAllAvailableYears(sitios));
  const currentYear = $derived(selectedYear || availableYears[0] || new Date().getFullYear());
  const hasMultipleYears = $derived(availableYears.length > 1);

  // Year-over-year comparison data
  const yearComparison = $derived<YearComparison>(getYearComparison(sitios, currentYear));

  // Aggregated livelihood data (using selected year)
  const livelihood = $derived<LivelihoodAggregation>(aggregateLivelihood(sitios, currentYear));

  // Aggregated safety/hazard data (using selected year)
  const safety = $derived<SafetyAggregation>(aggregateSafety(sitios, currentYear));

  // Time series data for income trend
  const incomeTrendData = $derived(prepareTimeSeriesData(sitios, ['averageDailyIncome']));

  // Time series data for poverty trend (both below and above poverty)
  const povertyTrendData = $derived.by(() => {
    const yearlyMetrics = getMultiYearMetrics(sitios);
    const categories = yearlyMetrics.map((m) => m.year.toString());

    // Calculate both below and above poverty counts for each year
    const belowPovertyData: number[] = [];
    const abovePovertyData: number[] = [];

    yearlyMetrics.forEach((yearMetric) => {
      const yearNum = yearMetric.year;
      const yearLivelihood = aggregateLivelihood(sitios, yearNum);
      const belowCount = yearLivelihood.povertyCount;
      const aboveCount = Math.max(0, yearLivelihood.sitiosWithIncome - yearLivelihood.povertyCount);

      belowPovertyData.push(belowCount);
      abovePovertyData.push(aboveCount);
    });

    return {
      categories,
      series: [
        {
          name: 'Below Poverty Line',
          data: belowPovertyData,
          color: 'hsl(0, 84%, 60%)'
        },
        {
          name: 'Above Poverty Line',
          data: abovePovertyData,
          color: 'hsl(142, 71%, 45%)'
        }
      ]
    };
  });

  // Time series data for agriculture trend
  const agricultureTrendData = $derived.by(() => {
    const yearlyMetrics = getMultiYearMetrics(sitios);
    const categories = yearlyMetrics.map((m) => m.year.toString());

    // Calculate agriculture metrics for each year
    const farmersData: number[] = [];
    const orgsData: number[] = [];
    const areaData: number[] = [];

    yearlyMetrics.forEach((yearMetric) => {
      const yearNum = yearMetric.year;
      const yearLivelihood = aggregateLivelihood(sitios, yearNum);

      farmersData.push(yearLivelihood.totalFarmers);
      orgsData.push(yearLivelihood.totalFarmerOrgs);
      areaData.push(Math.round(yearLivelihood.totalFarmArea * 10) / 10);
    });

    return {
      categories,
      series: [
        {
          name: 'Farmers',
          data: farmersData,
          color: 'hsl(38, 92%, 50%)'
        },
        {
          name: 'Organizations',
          data: orgsData,
          color: 'hsl(142, 71%, 45%)'
        },
        {
          name: 'Farm Area (ha)',
          data: areaData,
          color: 'hsl(120, 60%, 50%)'
        }
      ]
    };
  });

  // Total workers
  const totalWorkers = $derived(
    livelihood.workerPrivateHousehold +
      livelihood.workerPrivateEstablishment +
      livelihood.workerGovernment +
      livelihood.workerSelfEmployed +
      livelihood.workerEmployer +
      livelihood.workerOFW
  );

  // Worker class distribution data for donut chart with descriptions
  const workerClassData = $derived([
    {
      label: 'Private HH',
      fullLabel: 'Private Household',
      value: livelihood.workerPrivateHousehold,
      color: 'hsl(262, 83%, 58%)',
      icon: Home,
      description:
        'Workers in private households for pay, including domestic helpers, household cooks, gardeners, and family drivers.'
    },
    {
      label: 'Private Est.',
      fullLabel: 'Private Establishment',
      value: livelihood.workerPrivateEstablishment,
      color: 'hsl(217, 91%, 60%)',
      icon: Building2,
      description:
        'Workers in private establishments including private industry, religious groups, unions, and non-profit organizations.'
    },
    {
      label: 'Government',
      fullLabel: 'Government Worker',
      value: livelihood.workerGovernment,
      color: 'hsl(142, 71%, 45%)',
      icon: Landmark,
      description: 'Workers in government or government corporations and their instrumentalities.'
    },
    {
      label: 'Self-Employed',
      fullLabel: 'Self-Employed',
      value: livelihood.workerSelfEmployed,
      color: 'hsl(38, 92%, 50%)',
      icon: UserCheck,
      description:
        'Workers for profit or fees in own business, farm, profession or trade without any paid employee.'
    },
    {
      label: 'Employer',
      fullLabel: 'Employer',
      value: livelihood.workerEmployer,
      color: 'hsl(340, 75%, 55%)',
      icon: Briefcase,
      description:
        'Workers in their own business, farm, profession or trade with one or more regular paid employees.'
    },
    {
      label: 'OFW',
      fullLabel: 'Overseas Filipino Worker',
      value: livelihood.workerOFW,
      color: 'hsl(173, 80%, 40%)',
      icon: Globe,
      description:
        'Workers employed abroad, including those working for foreign governments or private entities overseas.'
    }
  ]);

  // Calculate percentages for worker class
  const workerClassWithPercent = $derived(
    workerClassData.map((item) => ({
      ...item,
      percent: totalWorkers > 0 ? Math.round((item.value / totalWorkers) * 100) : 0
    }))
  );

  // Income class distribution (poverty levels)
  // Based on 2025 DEPDev poverty threshold: ₱668/day for a family of 5
  const incomeClassData = $derived([
    {
      label: 'Below Poverty',
      fullLabel: 'Below Poverty Line (<₱668/day)',
      value: livelihood.povertyCount,
      color: 'hsl(0, 84%, 60%)',
      icon: TrendingDown,
      description:
        'Sitios with average daily income below ₱668/day (2025 DEPDev poverty threshold for a family of 5).'
    },
    {
      label: 'Above Poverty',
      fullLabel: 'Above Poverty Line (≥₱668/day)',
      value: Math.max(0, livelihood.sitiosWithIncome - livelihood.povertyCount),
      color: 'hsl(142, 71%, 45%)',
      icon: TrendingUp,
      description:
        'Sitios with average daily income at or above ₱668/day (2025 DEPDev poverty threshold for a family of 5).'
    }
  ]);

  // Income level indicator (2025 DEPDev threshold: ₱668/day)
  const incomeLevel = $derived(() => {
    const daily = livelihood.averageDailyIncomeOverall;
    if (daily >= 668)
      return {
        label: 'Above Poverty Line',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-100 dark:bg-emerald-900/40',
        icon: TrendingUp,
        trend: 'up'
      };
    return {
      label: 'Below Poverty Line',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500',
      bgLight: 'bg-red-100 dark:bg-red-900/40',
      icon: TrendingDown,
      trend: 'critical'
    };
  });

  // Poverty rate
  const povertyRate = $derived(
    livelihood.sitiosWithIncome > 0
      ? (livelihood.povertyCount / livelihood.sitiosWithIncome) * 100
      : 0
  );

  // Above threshold count
  const aboveThresholdCount = $derived(
    Math.max(0, livelihood.sitiosWithIncome - livelihood.povertyCount)
  );

  // Top crops
  const topCrops = $derived(() => {
    const entries = Array.from(livelihood.cropCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return entries.map(([crop, count]) => ({
      label: crop,
      value: count
    }));
  });

  // Top livestock
  const topLivestock = $derived(() => {
    const entries = Array.from(livelihood.livestockCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return entries.map(([animal, count]) => ({
      label: animal,
      value: count
    }));
  });

  // Agriculture summary stats
  const agricultureStats = $derived([
    {
      label: 'Total Farmers',
      value: livelihood.totalFarmers,
      icon: Tractor,
      color: 'bg-amber-500'
    },
    {
      label: 'Organizations',
      value: livelihood.totalFarmerOrgs,
      icon: Users,
      color: 'bg-emerald-500'
    },
    {
      label: 'Farm Area (ha)',
      value: livelihood.totalFarmArea.toFixed(1),
      icon: Sprout,
      color: 'bg-green-500'
    }
  ]);

  // Hazard exposure data
  const hazardData = $derived([
    {
      label: 'Flood',
      icon: Waves,
      color: 'hsl(217, 91%, 60%)',
      bgColor: 'bg-blue-500',
      frequencyCounts: safety.floodFrequencyCounts,
      description: 'Flood occurrences in the past 12 months'
    },
    {
      label: 'Landslide',
      icon: Mountain,
      color: 'hsl(30, 70%, 50%)',
      bgColor: 'bg-orange-500',
      frequencyCounts: safety.landslideFrequencyCounts,
      description: 'Landslide occurrences in the past 12 months'
    },
    {
      label: 'Drought',
      icon: Droplets,
      color: 'hsl(38, 92%, 50%)',
      bgColor: 'bg-amber-500',
      frequencyCounts: safety.droughtFrequencyCounts,
      description: 'Drought occurrences in the past 12 months'
    },
    {
      label: 'Earthquake',
      icon: Wind,
      color: 'hsl(0, 84%, 60%)',
      bgColor: 'bg-red-500',
      frequencyCounts: safety.earthquakeFrequencyCounts,
      description: 'Earthquake occurrences in the past 12 months'
    }
  ]);

  // Calculate hazard statistics
  const hazardStats = $derived.by(() => {
    const stats = hazardData.map((hazard) => {
      const counts = Array.from(hazard.frequencyCounts.entries());
      const totalSitios = counts.reduce((sum, [, count]) => sum + count, 0);
      const affectedSitios = counts
        .filter(([freq]) => freq > 0)
        .reduce((sum, [, count]) => sum + count, 0);
      const totalOccurrences = counts.reduce((sum, [freq, count]) => sum + freq * count, 0);
      const avgFrequency = totalSitios > 0 ? totalOccurrences / totalSitios : 0;

      return {
        ...hazard,
        totalSitios,
        affectedSitios,
        totalOccurrences,
        avgFrequency,
        affectedPercent: totalSitios > 0 ? (affectedSitios / totalSitios) * 100 : 0
      };
    });
    return stats;
  });
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <!-- Left Column: Main Content (2/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-2">
    <!-- Income & Employment Card -->
    <InfoCard
      title="Income & Employment"
      description="Average daily income and worker distribution across all sitios"
      icon={Briefcase}
      iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
      iconTextColor="text-emerald-500"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && incomeTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical income trend"
            onclick={() => (showIncomeTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        {@const level = incomeLevel()}
        <div class="flex flex-col gap-6">
          <!-- Top Stats Row -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <!-- Average Daily Income - Hero Stat -->
            <div
              class="relative col-span-1 overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-emerald-50/80 to-teal-50/50 p-5 sm:col-span-2 dark:border-emerald-800/30 dark:from-emerald-900/20 dark:via-emerald-900/15 dark:to-teal-900/10"
            >
              <div
                class="absolute -top-6 -right-6 size-32 rounded-full bg-emerald-200/30 blur-2xl dark:bg-emerald-500/10"
              ></div>
              <div class="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <div class="flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <div class="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-800/40">
                      <Banknote class="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span
                      class="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300"
                    >
                      Average Daily Income
                    </span>
                    <HelpTooltip>
                      Average daily income across {livelihood.sitiosWithIncome} sitios with income data
                    </HelpTooltip>
                  </div>
                  <p
                    class="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
                  >
                    ₱{livelihood.averageDailyIncomeOverall.toFixed(0)}
                  </p>
                </div>
                <div class="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                  <div class="flex items-center gap-1.5 rounded-full px-3 py-1.5 {level.bgLight}">
                    <level.icon class="size-4 {level.color}" />
                    <span class="text-sm font-semibold {level.color}">
                      {level.label}
                    </span>
                  </div>
                  <span class="text-xs text-muted-foreground"
                    >across {livelihood.sitiosWithIncome} sitios</span
                  >
                </div>
              </div>
            </div>

            <!-- Total Workers Mini Card -->
            <div
              class="flex flex-col justify-center rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/80 to-indigo-50/50 p-5 text-center dark:border-violet-800/30 dark:from-violet-900/15 dark:to-indigo-900/10"
            >
              <span
                class="text-[10px] font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300"
              >
                Total Workers
              </span>
              <p class="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                {totalWorkers.toLocaleString()}
              </p>
              <p class="mt-1 text-[10px] text-muted-foreground">tracked across sitios</p>
            </div>
          </div>

          <!-- Income Distribution Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div
              class="group relative overflow-hidden rounded-xl border border-red-100 bg-white p-4 transition-all hover:shadow-md dark:border-red-800/30 dark:bg-slate-800/50"
            >
              <div
                class="absolute inset-0 bg-linear-to-br from-red-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-red-900/20"
              ></div>
              <div class="relative flex items-center gap-3">
                <div class="rounded-xl bg-red-100 p-2.5 dark:bg-red-800/40">
                  <TrendingDown class="size-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div class="flex items-center gap-1">
                    <span
                      class="text-[10px] font-semibold tracking-wide text-red-700 uppercase dark:text-red-300"
                    >
                      Below Poverty
                    </span>
                    <HelpTooltip side="top">
                      Based on 2025 DEPDev poverty threshold of ₱668/day (₱20,000/month) for a
                      family of 5
                    </HelpTooltip>
                  </div>
                  <p class="text-2xl font-bold text-slate-900 dark:text-white">
                    {livelihood.povertyCount}
                  </p>
                  <p class="text-[10px] text-muted-foreground">&lt;₱668/day</p>
                </div>
              </div>
            </div>

            <div
              class="group relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-4 transition-all hover:shadow-md dark:border-emerald-800/30 dark:bg-slate-800/50"
            >
              <div
                class="absolute inset-0 bg-linear-to-br from-emerald-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-emerald-900/20"
              ></div>
              <div class="relative flex items-center gap-3">
                <div class="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-800/40">
                  <TrendingUp class="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div class="flex items-center gap-1">
                    <span
                      class="text-[10px] font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300"
                    >
                      Above Poverty
                    </span>
                    <HelpTooltip side="top">
                      Based on 2025 DEPDev poverty threshold of ₱668/day (₱20,000/month) for a
                      family of 5
                    </HelpTooltip>
                  </div>
                  <p class="text-2xl font-bold text-slate-900 dark:text-white">
                    {aboveThresholdCount}
                  </p>
                  <p class="text-[10px] text-muted-foreground">≥₱668/day</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Worker Classification Section -->
          <div
            class="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
          >
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <HandCoins class="size-4 text-slate-500" />
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                  Worker Classification
                </h4>
              </div>
              <HelpTooltip side="left">
                Aggregated distribution of workers by employment type across all sitios. Click on
                each category to learn more.
              </HelpTooltip>
            </div>

            <div class="flex flex-col gap-5 lg:flex-row lg:items-start">
              <!-- Donut Chart -->
              <div class="flex shrink-0 justify-center lg:justify-start">
                <div class="relative w-40">
                  <DonutChart
                    data={workerClassData}
                    centerLabel="Total"
                    centerValue={totalWorkers.toLocaleString()}
                    height={160}
                    showLegend={false}
                  />
                </div>
              </div>

              <!-- Worker Class Grid with Descriptions -->
              <div class="grid flex-1 grid-cols-2 gap-2 md:grid-cols-3">
                {#each workerClassWithPercent as worker}
                  {@const WorkerIcon = worker.icon}
                  <Popover.Root>
                    <Popover.Trigger>
                      <div
                        class="group relative flex h-full cursor-pointer flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-600"
                      >
                        <div class="flex items-center gap-2">
                          <div
                            class="size-2.5 shrink-0 rounded-full"
                            style="background-color: {worker.color}"
                          ></div>
                          <span
                            class="truncate text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            {worker.label}
                          </span>
                          <Info
                            class="ml-auto size-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </div>
                        <div class="flex items-baseline gap-1">
                          <span class="text-xl font-bold text-slate-900 dark:text-white">
                            {worker.value.toLocaleString()}
                          </span>
                          <span class="text-xs text-muted-foreground">
                            ({worker.percent}%)
                          </span>
                        </div>
                      </div>
                    </Popover.Trigger>
                    <Popover.Content class="w-72" side="top">
                      <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-2">
                          <div class="rounded-lg p-1.5" style="background-color: {worker.color}20">
                            <WorkerIcon class="size-4" style="color: {worker.color}" />
                          </div>
                          <div>
                            <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                              {worker.fullLabel}
                            </h4>
                            <p class="text-xs text-muted-foreground">
                              {worker.value.toLocaleString()} workers ({worker.percent}%)
                            </p>
                          </div>
                        </div>
                        <p class="text-xs leading-relaxed text-muted-foreground">
                          {worker.description}
                        </p>
                      </div>
                    </Popover.Content>
                  </Popover.Root>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Agriculture Card -->
    <InfoCard
      title="Agriculture"
      description="Farming activities, crops, and livestock across all sitios"
      icon={Wheat}
      iconBgColor="bg-amber-50 dark:bg-amber-900/20"
      iconTextColor="text-amber-500"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && agricultureTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical agriculture trend"
            onclick={() => (showAgricultureTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <div class="flex flex-col gap-6">
          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-3">
            {#each agricultureStats as stat}
              <div
                class="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 text-center transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50"
              >
                <div
                  class="absolute inset-0 bg-linear-to-br from-transparent to-slate-50/50 opacity-0 transition-opacity group-hover:opacity-100 dark:to-slate-700/20"
                ></div>
                <div class="relative">
                  <div
                    class="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl {stat.color}/10"
                  >
                    <stat.icon class="size-5 {stat.color.replace('bg-', 'text-')}" />
                  </div>
                  <p class="text-2xl font-bold text-slate-900 dark:text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p class="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            {/each}
          </div>

          <!-- Crops & Livestock Grid -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Major Crops Treemap -->
            <div
              class="rounded-xl border border-green-100 bg-linear-to-br from-green-50/80 to-emerald-50/50 p-4 dark:border-green-800/30 dark:from-green-900/15 dark:to-emerald-900/10"
            >
              <div class="mb-3 flex items-center gap-2">
                <div class="rounded-lg bg-green-100 p-1.5 dark:bg-green-800/40">
                  <Leaf class="size-4 text-green-600 dark:text-green-400" />
                </div>
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                  Top Crops Grown
                </h4>
                <HelpTooltip>Number of sitios growing each crop type</HelpTooltip>
              </div>
              {#if topCrops().length > 0}
                <div class="h-48">
                  <TreemapChart data={topCrops()} height={192} title="sitios" />
                </div>
              {:else}
                <div class="flex h-48 items-center justify-center">
                  <div class="text-center">
                    <Sprout class="mx-auto size-8 text-slate-300 dark:text-slate-600" />
                    <p class="mt-2 text-sm text-muted-foreground">No crop data available</p>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Livestock Treemap -->
            <div
              class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50/80 to-orange-50/50 p-4 dark:border-amber-800/30 dark:from-amber-900/15 dark:to-orange-900/10"
            >
              <div class="mb-3 flex items-center gap-2">
                <div class="rounded-lg bg-amber-100 p-1.5 dark:bg-amber-800/40">
                  <Bird class="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                  Top Livestock Raised
                </h4>
                <HelpTooltip>Number of sitios raising each livestock type</HelpTooltip>
              </div>
              {#if topLivestock().length > 0}
                <div class="h-48">
                  <TreemapChart data={topLivestock()} height={192} title="sitios" />
                </div>
              {:else}
                <div class="flex h-48 items-center justify-center">
                  <div class="text-center">
                    <Bird class="mx-auto size-8 text-slate-300 dark:text-slate-600" />
                    <p class="mt-2 text-sm text-muted-foreground">No livestock data available</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/snippet}
    </InfoCard>
  </div>

  <!-- Right Column: Sidebar (1/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-1">
    <!-- Income Distribution Card -->
    <InfoCard
      title="Income Distribution"
      description="Sitios by income threshold"
      icon={Banknote}
      iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
      iconTextColor="text-indigo-500"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && povertyTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical poverty trend"
            onclick={() => (showPovertyTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <div class="flex flex-col gap-4">
          <!-- Donut Chart -->
          <div class="flex justify-center">
            <div class="relative w-48">
              <DonutChart
                data={incomeClassData}
                centerLabel="Sitios"
                centerValue={livelihood.sitiosWithIncome.toString()}
                height={192}
                showLegend={false}
              />
            </div>
          </div>

          <!-- Legend -->
          <div class="flex flex-col gap-2">
            {#each incomeClassData as income}
              {@const IncomeIcon = income.icon}
              <Popover.Root>
                <Popover.Trigger>
                  <div
                    class="group flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-600"
                  >
                    <div
                      class="size-3 shrink-0 rounded-full"
                      style="background-color: {income.color}"
                    ></div>
                    <div class="flex-1 text-left">
                      <span class="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {income.label}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="text-lg font-bold text-slate-900 dark:text-white">
                        {income.value}
                      </span>
                      <Info
                        class="size-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                  </div>
                </Popover.Trigger>
                <Popover.Content class="w-64" side="left">
                  <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <div class="rounded-lg p-1.5" style="background-color: {income.color}20">
                        <IncomeIcon class="size-4" style="color: {income.color}" />
                      </div>
                      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                        {income.fullLabel}
                      </h4>
                    </div>
                    <p class="text-xs leading-relaxed text-muted-foreground">
                      {income.description}
                    </p>
                  </div>
                </Popover.Content>
              </Popover.Root>
            {/each}
          </div>

          <!-- Poverty Rate Summary -->
          <!-- <div
            class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-muted-foreground uppercase">Poverty Rate</span>
              <span
                class="text-lg font-bold {povertyRate <= 20
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : povertyRate <= 40
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'}"
              >
                {povertyRate.toFixed(1)}%
              </span>
            </div>
          </div> -->
        </div>
      {/snippet}
    </InfoCard>

    <!-- Top Products Card -->
    <InfoCard
      title="Agricultural Products"
      description="Most common crops and livestock"
      icon={Leaf}
      iconBgColor="bg-green-50 dark:bg-green-900/20"
      iconTextColor="text-green-500"
    >
      {#snippet children()}
        <div class="flex flex-col gap-4">
          <!-- Top 5 Crops -->
          <div>
            <div class="mb-2 flex items-center gap-2">
              <Sprout class="size-3.5 text-green-500" />
              <span class="text-xs font-semibold text-slate-700 uppercase dark:text-slate-300"
                >Top Crops</span
              >
            </div>
            <div class="flex flex-wrap gap-1.5">
              {#each topCrops().slice(0, 5) as crop}
                <Badge
                  variant="outline"
                  class="border-green-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-green-700 shadow-sm dark:border-green-600/30 dark:bg-green-900/30 dark:text-green-300"
                >
                  <Sprout class="mr-1 size-3" />
                  {crop.label}
                  <span class="ml-1 text-green-500/70">({crop.value})</span>
                </Badge>
              {/each}
              {#if topCrops().length === 0}
                <span class="text-sm text-muted-foreground italic">No crops reported</span>
              {/if}
            </div>
          </div>

          <!-- Top 5 Livestock -->
          <div>
            <div class="mb-2 flex items-center gap-2">
              <Bird class="size-3.5 text-amber-500" />
              <span class="text-xs font-semibold text-slate-700 uppercase dark:text-slate-300"
                >Top Livestock</span
              >
            </div>
            <div class="flex flex-wrap gap-1.5">
              {#each topLivestock().slice(0, 5) as animal}
                <Badge
                  variant="outline"
                  class="border-amber-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-700 shadow-sm dark:border-amber-600/30 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {animal.label}
                  <span class="ml-1 text-amber-500/70">({animal.value})</span>
                </Badge>
              {/each}
              {#if topLivestock().length === 0}
                <span class="text-sm text-muted-foreground italic">No livestock reported</span>
              {/if}
            </div>
          </div>

          <!-- Summary -->
          <div
            class="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700/50 dark:bg-slate-800/50"
          >
            <div class="text-center">
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {livelihood.cropCounts.size}
              </p>
              <p class="text-[10px] text-muted-foreground">Crop Types</p>
            </div>
            <div class="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div class="text-center">
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {livelihood.livestockCounts.size}
              </p>
              <p class="text-[10px] text-muted-foreground">Livestock Types</p>
            </div>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Environmental Hazards Card -->
    <InfoCard
      title="Environmental Hazards"
      description="Natural hazards exposure (past 12 months)"
      icon={ShieldAlert}
      iconBgColor="bg-red-50 dark:bg-red-900/20"
      iconTextColor="text-red-500"
    >
      {#snippet children()}
        <div class="flex flex-col gap-3">
          {#each hazardStats as hazard}
            {@const HazardIcon = hazard.icon}
            <div
              class="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50"
            >
              <div class="flex items-start gap-3">
                <div class="rounded-lg p-2" style="background-color: {hazard.color}20">
                  <HazardIcon class="size-5" style="color: {hazard.color}" />
                </div>
                <div class="flex-1">
                  <div class="mb-2 flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                        {hazard.label}
                      </h4>
                      <p class="text-xs text-muted-foreground">{hazard.description}</p>
                    </div>
                    <HelpTooltip side="left">
                      {hazard.affectedSitios} out of {hazard.totalSitios} sitios reported {hazard.label.toLowerCase()}
                      occurrences
                    </HelpTooltip>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-center">
                      <p class="text-lg font-bold text-slate-900 dark:text-white">
                        {hazard.affectedSitios}
                      </p>
                      <p class="text-[10px] text-muted-foreground">Affected</p>
                    </div>
                    <div class="text-center">
                      <p class="text-lg font-bold text-slate-900 dark:text-white">
                        {hazard.totalOccurrences}
                      </p>
                      <p class="text-[10px] text-muted-foreground">Total Events</p>
                    </div>
                    <div class="text-center">
                      <p class="text-lg font-bold text-slate-900 dark:text-white">
                        {hazard.avgFrequency.toFixed(1)}
                      </p>
                      <p class="text-[10px] text-muted-foreground">Avg/Sitio</p>
                    </div>
                  </div>
                  {#if hazard.affectedPercent > 0}
                    <div class="mt-2">
                      <div class="mb-1 flex items-center justify-between">
                        <span class="text-[10px] text-muted-foreground">Exposure Rate</span>
                        <span class="text-xs font-semibold" style="color: {hazard.color}">
                          {hazard.affectedPercent.toFixed(0)}%
                        </span>
                      </div>
                      <div
                        class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
                      >
                        <div
                          class="h-full rounded-full transition-all"
                          style="width: {hazard.affectedPercent}%; background-color: {hazard.color}"
                        ></div>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>

    <!-- Quick Stats Card -->
    <div
      class="hidden rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-slate-100/50 p-4 dark:border-slate-700/50 dark:from-slate-800/50 dark:to-slate-900/30"
    >
      <div class="mb-3 flex items-center gap-2">
        <CheckCircle2 class="size-4 text-slate-500" />
        <h4 class="text-sm font-semibold text-slate-900 dark:text-white">Quick Summary</h4>
      </div>
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">Sitios with Data</span>
          <span class="text-sm font-semibold text-slate-900 dark:text-white"
            >{livelihood.sitiosWithIncome}</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">Total Daily Income</span>
          <span class="text-sm font-semibold text-slate-900 dark:text-white"
            >₱{livelihood.averageDailyIncomeTotal.toLocaleString()}</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">Avg per Sitio</span>
          <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
            >₱{livelihood.averageDailyIncomeOverall.toFixed(0)}/day</span
          >
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Income Trend Modal -->
<Dialog.Root bind:open={showIncomeTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
          <Banknote class="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        Average Daily Income - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year income trends across {incomeTrendData.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={incomeTrendData.series}
        categories={incomeTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `₱${val.toLocaleString()}`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Poverty Distribution Trend Modal -->
<Dialog.Root bind:open={showPovertyTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
          <TrendingDown class="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        Income Distribution - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year distribution of sitios by poverty threshold across {povertyTrendData
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={povertyTrendData.series}
        categories={povertyTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Agriculture Trend Modal -->
<Dialog.Root bind:open={showAgricultureTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
          <Wheat class="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        Agriculture - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year agriculture metrics across {agricultureTrendData.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={agricultureTrendData.series}
        categories={agricultureTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
