<script lang="ts">
  import DonutChart from '$lib/components/charts/DonutChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import {
    LABOR_EMPLOYMENT_AVERAGES,
    getLaborComparisonStatus
  } from '$lib/config/national-averages';
  import type { SitioRecord } from '$lib/types';
  import {
    aggregateDemographics,
    getAllAvailableYears,
    getYearComparison,
    prepareTimeSeriesData,
    type DemographicsAggregation,
    type YearComparison
  } from '$lib/utils/sitio-chart-aggregation';
  import {
    ArrowDown,
    ArrowUp,
    Baby,
    BarChart3,
    Briefcase,
    ChartLine,
    Clock,
    CreditCard,
    ExternalLink,
    Heart,
    IdCard,
    Landmark,
    Minus,
    PersonStanding,
    PieChart,
    Scale,
    School,
    TrendingDown,
    TrendingUp,
    UserCheck,
    UserRound,
    Users,
    Vote
  } from '@lucide/svelte';
  import DashboardStatCard from './DashboardStatCard.svelte';

  // Modal states for trend modals
  let showGenderTrendModal = $state(false);
  let showAgeTrendModal = $state(false);
  let showLaborTrendModal = $state(false);
  let showCulturalTrendModal = $state(false);
  let showVulnerableTrendModal = $state(false);
  let showDependencyTrendModal = $state(false);

  interface Props {
    sitios: SitioRecord[];
    selectedYear?: number;
  }

  let { sitios, selectedYear }: Props = $props();

  // Get available years for comparison
  const availableYears = $derived(getAllAvailableYears(sitios));
  const currentYear = $derived(selectedYear || availableYears[0] || new Date().getFullYear());
  const hasMultipleYears = $derived(availableYears.length > 1);

  // Year-over-year comparison data
  const yearComparison = $derived<YearComparison>(getYearComparison(sitios, currentYear));

  // Aggregated demographics data (using selected year)
  const demographics = $derived<DemographicsAggregation>(
    aggregateDemographics(sitios, currentYear)
  );

  // Time series data for population trend chart
  const populationGenderTrend = $derived(
    prepareTimeSeriesData(sitios, ['totalMale', 'totalFemale'])
  );

  // Time series data for labor force trend
  const laborForceTrend = $derived(
    prepareTimeSeriesData(sitios, ['totalLaborWorkforce', 'totalUnemployed'])
  );

  // Time series data for age groups
  const ageGroupTrend = $derived(prepareTimeSeriesData(sitios, ['youth', 'workingAge', 'elderly']));

  // Time series data for cultural groups
  const culturalGroupsTrend = $derived(
    prepareTimeSeriesData(sitios, [
      'totalSchoolAgeChildren',
      'totalMuslim',
      'totalIP',
      'totalVoters'
    ])
  );

  // Time series data for vulnerable sectors
  const vulnerableSectorsTrend = $derived(
    prepareTimeSeriesData(sitios, [
      'totalSeniors',
      'totalOSY',
      'totalNoBirthCert',
      'totalNoNationalID'
    ])
  );

  // Time series data for dependency ratio (calculated from aggregated metrics)
  const dependencyRatioTrend = $derived(() => {
    const allYears = getAllAvailableYears(sitios);
    const categories = allYears.map((y) => y.toString());

    const dependencyRatios: number[] = [];
    const dependentPops: number[] = [];

    allYears.forEach((year) => {
      const demo = aggregateDemographics(sitios, year);
      const laborForce = demo.totalLaborWorkforce || 0;
      const totalPop = demo.totalPopulation || 0;
      const dependentPop = totalPop - laborForce;
      const depRatio = laborForce > 0 ? (dependentPop / laborForce) * 100 : 0;

      dependencyRatios.push(Math.round(depRatio * 10) / 10);
      dependentPops.push(dependentPop);
    });

    return {
      categories,
      ratioSeries: [
        {
          name: 'Dependency Ratio',
          data: dependencyRatios,
          color: 'hsl(45, 93%, 47%)'
        }
      ],
      populationSeries: [
        {
          name: 'Dependent Population',
          data: dependentPops,
          color: 'hsl(25, 95%, 53%)'
        }
      ]
    };
  });

  // Gender distribution for donut chart
  const genderData = $derived([
    { label: 'Male', value: demographics.totalMale, color: 'hsl(217, 91%, 60%)' },
    { label: 'Female', value: demographics.totalFemale, color: 'hsl(330, 81%, 60%)' }
  ]);

  // Age distribution for donut chart (using aggregated data from demographics)
  const ageData = $derived([
    {
      label: 'Youth (0-14)',
      value: demographics.youth,
      color: 'hsl(25, 95%, 60%)' // Orange
    },
    {
      label: 'Working Age (15-64)',
      value: demographics.workingAge,
      color: 'hsl(217, 91%, 60%)' // Blue
    },
    {
      label: 'Elderly (65+)',
      value: demographics.elderly,
      color: 'hsl(200, 18%, 60%)' // Gray
    }
  ]);

  // Calculate labor force metrics
  const laborMetrics = $derived.by(() => {
    const laborForce = demographics.totalLaborWorkforce || 0;
    const unemployed = demographics.totalUnemployed || 0;
    const employed = laborForce - unemployed;
    const employmentRate = laborForce > 0 ? Math.round((employed / laborForce) * 100) : 0;
    const participationRate =
      demographics.totalPopulation > 0
        ? Math.round((laborForce / demographics.totalPopulation) * 100)
        : 0;
    const seniorWorkforce = demographics.totalLaborForce60to64 || 0;
    const seniorSharePercent =
      laborForce > 0 ? ((seniorWorkforce / laborForce) * 100).toFixed(1) : '0';

    // Dependency ratio calculation
    const dependentPopulation = demographics.totalPopulation - laborForce;
    const dependencyRatio = laborForce > 0 ? (dependentPopulation / laborForce) * 100 : 0;

    return {
      laborForce,
      unemployed,
      employed,
      employmentRate,
      participationRate,
      seniorWorkforce,
      seniorSharePercent,
      dependentPopulation,
      dependencyRatio: dependencyRatio.toFixed(1)
    };
  });

  // Cultural & demographic groups for bar chart
  const culturalGroupsData = $derived([
    {
      label: 'School-Age Children',
      value: demographics.totalSchoolAgeChildren,
      color: 'hsl(217, 91%, 60%)'
    },
    { label: 'Muslim Population', value: demographics.totalMuslim, color: 'hsl(142, 71%, 45%)' },
    { label: 'Indigenous People', value: demographics.totalIP, color: 'hsl(263, 70%, 50%)' },
    { label: 'Registered Voters', value: demographics.totalVoters, color: 'hsl(280, 65%, 60%)' }
  ]);

  // Vulnerable sectors for bar chart
  const vulnerableSectorsData = $derived([
    { label: 'Senior Citizens', value: demographics.totalSeniors, color: 'hsl(25, 95%, 53%)' },
    { label: 'Out of School Youth', value: demographics.totalOSY, color: 'hsl(0, 84%, 60%)' },
    {
      label: 'No Birth Certificate',
      value: demographics.totalNoBirthCert,
      color: 'hsl(45, 93%, 47%)'
    },
    { label: 'No PhilSys ID', value: demographics.totalNoNationalID, color: 'hsl(200, 18%, 46%)' }
  ]);

  // Labor & Employment Analytics (comparison with national averages/targets)
  const laborAnalytics = $derived.by(() => {
    const metrics = laborMetrics;
    const unemploymentRate = metrics.laborForce > 0 ? 100 - metrics.employmentRate : 0;

    // Helper to check if a metric is a target (type-safe check)
    const isTarget = (metric: Record<string, unknown>) =>
      'target' in metric && metric.target === true;

    // Get comparison statuses - pass isTarget flag based on the data
    const unemploymentComparison = getLaborComparisonStatus(
      unemploymentRate,
      LABOR_EMPLOYMENT_AVERAGES.unemploymentRate.percent,
      'unemployment',
      isTarget(LABOR_EMPLOYMENT_AVERAGES.unemploymentRate)
    );

    const dependencyComparison = getLaborComparisonStatus(
      parseFloat(metrics.dependencyRatio),
      LABOR_EMPLOYMENT_AVERAGES.ageDependencyRatio.percent,
      'dependency',
      isTarget(LABOR_EMPLOYMENT_AVERAGES.ageDependencyRatio)
    );

    return {
      unemploymentRate,
      unemploymentComparison,
      dependencyComparison,
      nationalAverages: LABOR_EMPLOYMENT_AVERAGES
    };
  });
</script>

<div class="space-y-6">
  <!-- Population Stats Grid -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <DashboardStatCard
      title="Total Population"
      value={demographics.totalPopulation}
      subtitle="{demographics.malePercent.toFixed(1)}% male, {demographics.femalePercent.toFixed(
        1
      )}% female"
      icon={Users}
      variant="primary"
      trend={hasMultipleYears && yearComparison.trends.population
        ? yearComparison.trends.population
        : undefined}
    />
    <DashboardStatCard
      title="Total Households"
      value={demographics.totalHouseholds}
      subtitle="Avg {demographics.averageHouseholdSize.toFixed(1)} members/household"
      icon={Heart}
      variant="success"
      trend={hasMultipleYears && yearComparison.trends.households
        ? yearComparison.trends.households
        : undefined}
    />
    <DashboardStatCard
      title="Registered Voters"
      value={demographics.totalVoters}
      subtitle="{demographics.voterRegistrationPercent.toFixed(1)}% registration rate"
      icon={Vote}
      variant="default"
      trend={hasMultipleYears && yearComparison.trends.voters
        ? yearComparison.trends.voters
        : undefined}
    />
    <DashboardStatCard
      title="Labor Workforce"
      value={demographics.totalLaborWorkforce}
      subtitle="{laborMetrics.participationRate}% participation rate"
      icon={Briefcase}
      variant={demographics.unemploymentRate >= 20
        ? 'danger'
        : demographics.unemploymentRate >= 10
          ? 'warning'
          : 'success'}
      trend={hasMultipleYears && yearComparison.trends.laborWorkforce
        ? yearComparison.trends.laborWorkforce
        : undefined}
    />
  </div>

  <!-- Main Content Grid: 2/3 + 1/3 layout on large screens -->
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left Column: Main Charts (2/3 width) -->
    <div class="flex flex-col gap-6 lg:col-span-2">
      <!-- Gender Distribution Card -->
      <InfoCard
        title="Gender Distribution"
        description="Breakdown of population by sex"
        icon={PersonStanding}
        iconBgColor="bg-pink-100"
        iconTextColor="text-pink-600"
        headerBgColor="bg-pink-50/50"
      >
        {#snippet headerAction()}
          {#if hasMultipleYears && populationGenderTrend.categories.length > 1}
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-foreground"
              title="View historical trend"
              onclick={() => (showGenderTrendModal = true)}
            >
              <ChartLine class="size-4" />
            </Button>
          {/if}
        {/snippet}
        <div class="flex flex-col items-center justify-around gap-8 md:flex-row">
          <!-- Donut Chart -->
          <div class="relative w-48 shrink-0 md:w-56">
            <DonutChart
              data={genderData}
              centerLabel="Total"
              centerValue={demographics.totalPopulation.toLocaleString()}
              height={224}
              showLegend={false}
            />
          </div>

          <!-- Gender Stats -->
          <div class="flex w-full max-w-xs flex-col gap-4">
            <!-- Male Stats -->
            <div
              class="rounded-xl border border-blue-100 bg-blue-50 p-4 transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-blue-900/10"
            >
              <div class="mb-1 flex items-center justify-between">
                <span class="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  Total Male
                </span>
                <span
                  class="rounded bg-white px-2 py-0.5 text-xs font-bold text-blue-600 shadow-sm dark:bg-slate-800/80"
                >
                  {demographics.malePercent.toFixed(1)}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {demographics.totalMale.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">Individuals</p>
            </div>

            <!-- Female Stats -->
            <div
              class="rounded-xl border border-pink-100 bg-pink-50 p-4 transition-all hover:shadow-md dark:border-pink-900/20 dark:bg-pink-900/10"
            >
              <div class="mb-1 flex items-center justify-between">
                <span class="text-sm font-semibold text-pink-900 dark:text-pink-200">
                  Total Female
                </span>
                <span
                  class="rounded bg-white px-2 py-0.5 text-xs font-bold text-pink-600 shadow-sm dark:bg-slate-800/80"
                >
                  {demographics.femalePercent.toFixed(1)}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {demographics.totalFemale.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">Individuals</p>
            </div>
          </div>
        </div>
      </InfoCard>

      <!-- Age Distribution Card -->
      <InfoCard
        title="Population by Age Group"
        description="Breakdown of population by age brackets"
        icon={PieChart}
        iconBgColor="bg-teal-100"
        iconTextColor="text-teal-600"
        headerBgColor="bg-teal-50/50"
      >
        {#snippet headerAction()}
          {#if hasMultipleYears && ageGroupTrend.categories.length > 1}
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-foreground"
              title="View historical trend"
              onclick={() => (showAgeTrendModal = true)}
            >
              <ChartLine class="size-4" />
            </Button>
          {/if}
        {/snippet}
        <div class="flex flex-col items-center justify-around gap-8 md:flex-row">
          <!-- Donut Chart -->
          <div class="relative w-48 shrink-0 md:w-56">
            <DonutChart
              data={ageData}
              centerLabel="Total"
              centerValue={demographics.totalPopulation.toLocaleString()}
              height={224}
              showLegend={false}
            />
          </div>

          <!-- Age Group Stats -->
          <div class="flex w-full max-w-xs flex-col gap-4">
            <!-- Youth Stats -->
            <div
              class="rounded-xl border border-orange-100 bg-orange-50 p-4 transition-all hover:shadow-md dark:border-orange-900/20 dark:bg-orange-900/10"
            >
              <div class="mb-1 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Baby class="size-4 text-orange-600 dark:text-orange-400" />
                  <span class="text-sm font-semibold text-orange-900 dark:text-orange-200">
                    Youth (0-14)
                  </span>
                </div>
                <span
                  class="rounded bg-white px-2 py-0.5 text-xs font-bold text-orange-600 shadow-sm dark:bg-slate-800/80"
                >
                  {demographics.youthPercent.toFixed(1)}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {demographics.youth.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">Individuals</p>
            </div>

            <!-- Working Age Stats -->
            <div
              class="rounded-xl border border-blue-100 bg-blue-50 p-4 transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-blue-900/10"
            >
              <div class="mb-1 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Briefcase class="size-4 text-blue-600 dark:text-blue-400" />
                  <span class="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    Working Age (15-64)
                  </span>
                </div>
                <span
                  class="rounded bg-white px-2 py-0.5 text-xs font-bold text-blue-600 shadow-sm dark:bg-slate-800/80"
                >
                  {demographics.workingAgePercent.toFixed(1)}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {demographics.workingAge.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">Individuals</p>
            </div>

            <!-- Elderly Stats -->
            <div
              class="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/30"
            >
              <div class="mb-1 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UserRound class="size-4 text-slate-600 dark:text-slate-400" />
                  <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Elderly (65+)
                  </span>
                </div>
                <span
                  class="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-700"
                >
                  {demographics.elderlyPercent.toFixed(1)}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {demographics.elderly.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">Individuals</p>
            </div>
          </div>
        </div>
      </InfoCard>

      <!-- Labor & Employment Card -->
      <InfoCard
        title="Labor & Employment"
        description="Workforce statistics and economic dependency"
        icon={Briefcase}
        iconBgColor="bg-purple-100"
        iconTextColor="text-purple-600"
        headerBgColor="bg-purple-50/50"
        contentPadding="py-6"
      >
        {#snippet headerAction()}
          {#if hasMultipleYears && laborForceTrend.categories.length > 1}
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-foreground"
              title="View historical trend"
              onclick={() => (showLaborTrendModal = true)}
            >
              <ChartLine class="size-4" />
            </Button>
          {/if}
        {/snippet}
        <div class="space-y-6">
          <!-- Top Stats Row -->
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <!-- Labor Force -->
            <div
              class="rounded-xl border border-purple-100 bg-linear-to-br from-purple-50 to-purple-100/50 p-3 dark:border-purple-900/30 dark:from-purple-900/20 dark:to-purple-900/10"
            >
              <div class="mb-2 flex items-center gap-1.5">
                <div class="rounded-lg bg-purple-500/10 p-1">
                  <Users class="size-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <span class="text-xs font-medium text-purple-700 dark:text-purple-300"
                  >Labor Force</span
                >
                <HelpTooltip content="Ages 15-64" class="text-purple-700" />
              </div>
              <p class="text-xl font-bold text-slate-900 dark:text-white">
                {laborMetrics.laborForce.toLocaleString()}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {laborMetrics.participationRate}% of population
              </p>
            </div>

            <!-- Employed -->
            <div
              class="rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-emerald-100/50 p-3 dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-emerald-900/10"
            >
              <div class="mb-2 flex items-center gap-1.5">
                <div class="rounded-lg bg-emerald-500/10 p-1">
                  <TrendingUp class="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span class="text-xs font-medium text-emerald-700 dark:text-emerald-300"
                  >Employed</span
                >
              </div>
              <p class="text-xl font-bold text-slate-900 dark:text-white">
                {laborMetrics.employed.toLocaleString()}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {laborMetrics.employmentRate}% rate
              </p>
            </div>

            <!-- Unemployed -->
            <div
              class="rounded-xl border border-rose-100 bg-linear-to-br from-rose-50 to-rose-100/50 p-3 dark:border-rose-900/30 dark:from-rose-900/20 dark:to-rose-900/10"
            >
              <div class="mb-2 flex items-center gap-1.5">
                <div class="rounded-lg bg-rose-500/10 p-1">
                  <TrendingDown class="size-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <span class="text-xs font-medium text-rose-700 dark:text-rose-300">Unemployed</span>
              </div>
              <p class="text-xl font-bold text-slate-900 dark:text-white">
                {laborMetrics.unemployed.toLocaleString()}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {100 - laborMetrics.employmentRate}% of labor force
              </p>
            </div>

            <!-- Senior Workforce -->
            <div
              class="rounded-xl border border-orange-100 bg-linear-to-br from-orange-50 to-orange-100/50 p-3 dark:border-orange-900/30 dark:from-orange-900/20 dark:to-orange-900/10"
            >
              <div class="mb-2 flex items-center gap-1.5">
                <div class="rounded-lg bg-orange-500/10 p-1">
                  <Clock class="size-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <span class="text-xs font-medium text-orange-700 dark:text-orange-300">
                  Senior Workers
                </span>
                <HelpTooltip content="Ages 60-64 in labor force" class="text-orange-700" />
              </div>
              <p class="text-xl font-bold text-slate-900 dark:text-white">
                {laborMetrics.seniorWorkforce.toLocaleString()}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {laborMetrics.seniorSharePercent}% of workforce
              </p>
            </div>
          </div>

          <!-- Employment Rate Visualization -->
          <div
            class="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
          >
            <h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Employment Distribution
            </h4>

            <!-- Stacked Bar -->
            <div
              class="relative mb-3 h-7 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
              <div
                class="absolute top-0 left-0 flex h-full items-center justify-center bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style="width: {laborMetrics.employmentRate}%"
              >
                {#if laborMetrics.employmentRate > 15}
                  <span class="text-xs font-bold text-white drop-shadow">
                    {laborMetrics.employmentRate}%
                  </span>
                {/if}
              </div>
              <div
                class="absolute top-0 flex h-full items-center justify-center bg-linear-to-r from-rose-500 to-rose-400 transition-all duration-700"
                style="left: {laborMetrics.employmentRate}%; width: {100 -
                  laborMetrics.employmentRate}%"
              >
                {#if 100 - laborMetrics.employmentRate > 15}
                  <span class="text-xs font-bold text-white drop-shadow">
                    {100 - laborMetrics.employmentRate}%
                  </span>
                {/if}
              </div>
            </div>

            <!-- Legend -->
            <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
              <div class="flex items-center gap-2">
                <span class="size-2.5 rounded-full bg-linear-to-r from-emerald-500 to-emerald-400"
                ></span>
                <span class="text-xs text-muted-foreground"
                  >Employed ({laborMetrics.employed.toLocaleString()})</span
                >
              </div>
              <div class="flex items-center gap-2">
                <span class="size-2.5 rounded-full bg-linear-to-r from-rose-500 to-rose-400"></span>
                <span class="text-xs text-muted-foreground"
                  >Unemployed ({laborMetrics.unemployed.toLocaleString()})</span
                >
              </div>
            </div>
          </div>

          <!-- Dependency Ratio Section -->
          <div
            class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50/50 p-4 dark:border-amber-900/30 dark:from-amber-900/15 dark:to-orange-900/10"
          >
            <div class="mb-4 flex items-center gap-3">
              <div class="rounded-xl bg-amber-500/15 p-2 dark:bg-amber-500/20">
                <Scale class="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Economic Dependency
                  </h4>
                  <HelpTooltip
                    content="Measures the relationship between working and non-working population. Calculated as (Total Population - Labor Force) / Labor Force × 100."
                    class="text-amber-700"
                  />
                </div>
                <p class="text-xs text-muted-foreground">Population economic support structure</p>
              </div>
              {#if hasMultipleYears && dependencyRatioTrend().categories.length > 1}
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-muted-foreground hover:text-foreground"
                  title="View historical trend"
                  onclick={() => (showDependencyTrendModal = true)}
                >
                  <ChartLine class="size-4" />
                </Button>
              {/if}
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Dependency Ratio -->
              <div
                class="flex flex-col items-center justify-center rounded-xl bg-white/70 p-4 shadow-sm dark:bg-slate-800/50"
              >
                <div class="relative mb-2 size-20">
                  <svg class="size-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      class="stroke-amber-200 dark:stroke-amber-900/50"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.9155"
                      stroke-width="3.5"
                    ></circle>
                    <circle
                      class="stroke-amber-500 dark:stroke-amber-400"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.9155"
                      stroke-dasharray="{Math.min(
                        parseFloat(laborMetrics.dependencyRatio),
                        100
                      )} 100"
                      stroke-linecap="round"
                      stroke-width="3.5"
                    ></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-xl font-bold text-slate-900 dark:text-white">
                      {laborMetrics.dependencyRatio}
                    </span>
                  </div>
                </div>
                <span class="text-sm font-semibold text-amber-700 dark:text-amber-300"
                  >Dependency Ratio</span
                >
                <span class="text-xs text-muted-foreground">per 100 workers</span>
              </div>

              <!-- Dependent Population -->
              <div
                class="flex flex-col items-center justify-center rounded-xl bg-white/70 p-4 shadow-sm dark:bg-slate-800/50"
              >
                <div class="mb-2 rounded-full bg-amber-500/15 p-3 dark:bg-amber-500/20">
                  <Users class="size-8 text-amber-600 dark:text-amber-400" />
                </div>
                <span class="text-xl font-bold text-slate-900 dark:text-white">
                  {laborMetrics.dependentPopulation.toLocaleString()}
                </span>
                <span class="text-sm font-semibold text-amber-700 dark:text-amber-300"
                  >Dependent Population</span
                >
                <span class="text-xs text-muted-foreground">non-working residents</span>
              </div>
            </div>
          </div>

          <!-- Labor & Employment Analytics Section -->
          <div
            class="rounded-xl border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50/50 p-4 dark:border-blue-900/30 dark:from-blue-900/15 dark:to-indigo-900/10"
          >
            <div class="mb-4 flex items-center gap-3">
              <div class="rounded-xl bg-blue-500/15 p-2 dark:bg-blue-500/20">
                <BarChart3 class="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Labor & Employment Analytics
                  </h4>
                  <HelpTooltip
                    content="Comparison of aggregated labor metrics against Philippine national averages and targets. Values marked with 'Target' compare against government targets rather than current averages."
                    class="text-blue-700"
                  />
                </div>
                <p class="text-xs text-muted-foreground">Aggregated vs. Philippine Benchmarks</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Unemployment Rate Comparison -->
              <div class="rounded-lg bg-white/70 p-3 dark:bg-slate-800/50">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Unemployment
                  </span>
                  {#if laborAnalytics.unemploymentComparison.status === 'better'}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <ArrowDown class="size-3" />
                      Better
                    </span>
                  {:else if laborAnalytics.unemploymentComparison.status === 'worse'}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-red-600 dark:text-red-400"
                    >
                      <ArrowUp class="size-3" />
                      Higher
                    </span>
                  {:else}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                      <Minus class="size-3" />
                      Similar
                    </span>
                  {/if}
                </div>
                <div class="flex items-baseline justify-between gap-2">
                  <p class="text-lg font-bold text-slate-900 dark:text-white">
                    {laborAnalytics.unemploymentRate.toFixed(1)}%
                  </p>
                  <p class="text-xs text-muted-foreground">
                    vs {laborAnalytics.nationalAverages.unemploymentRate.percent}%
                  </p>
                </div>
                <div class="mt-2 space-y-1">
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full transition-all duration-500 {laborAnalytics
                        .unemploymentComparison.status === 'better'
                        ? 'bg-emerald-500'
                        : laborAnalytics.unemploymentComparison.status === 'worse'
                          ? 'bg-red-500'
                          : 'bg-slate-400'}"
                      style="width: {Math.min(laborAnalytics.unemploymentRate * 5, 100)}%"
                    ></div>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style="width: {laborAnalytics.nationalAverages.unemploymentRate.percent * 5}%"
                    ></div>
                  </div>
                </div>
                <p class="mt-1 text-center text-[10px] text-muted-foreground">
                  Local • {laborAnalytics.unemploymentComparison.isTarget
                    ? 'PH Target'
                    : 'PH Average'}
                </p>
              </div>

              <!-- Dependency Ratio Comparison -->
              <div class="rounded-lg bg-white/70 p-3 dark:bg-slate-800/50">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Dependency
                  </span>
                  {#if laborAnalytics.dependencyComparison.status === 'better'}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <ArrowDown class="size-3" />
                      Lower
                    </span>
                  {:else if laborAnalytics.dependencyComparison.status === 'worse'}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                    >
                      <ArrowUp class="size-3" />
                      Higher
                    </span>
                  {:else}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                      <Minus class="size-3" />
                      Similar
                    </span>
                  {/if}
                </div>
                <div class="flex items-baseline justify-between gap-2">
                  <p class="text-lg font-bold text-slate-900 dark:text-white">
                    {laborMetrics.dependencyRatio}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    vs {laborAnalytics.nationalAverages.ageDependencyRatio.percent}
                  </p>
                </div>
                <div class="mt-2 space-y-1">
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full transition-all duration-500 {laborAnalytics
                        .dependencyComparison.status === 'better'
                        ? 'bg-emerald-500'
                        : laborAnalytics.dependencyComparison.status === 'worse'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'}"
                      style="width: {Math.min(parseFloat(laborMetrics.dependencyRatio), 100)}%"
                    ></div>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style="width: {laborAnalytics.nationalAverages.ageDependencyRatio.percent}%"
                    ></div>
                  </div>
                </div>
                <p class="mt-1 text-center text-[10px] text-muted-foreground">
                  Local • {laborAnalytics.dependencyComparison.isTarget
                    ? 'PH Target'
                    : 'PH Average'}
                </p>
              </div>
            </div>

            <!-- Data Sources -->
            <div
              class="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-700 dark:bg-slate-800/30"
            >
              <p class="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                Data Sources:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <a
                  href={laborAnalytics.nationalAverages.unemploymentRate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] text-blue-600 shadow-sm transition-colors hover:bg-blue-50 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-slate-600"
                >
                  PSA Labor Force Survey
                  <ExternalLink class="size-2.5" />
                </a>
                <a
                  href={laborAnalytics.nationalAverages.ageDependencyRatio.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] text-blue-600 shadow-sm transition-colors hover:bg-blue-50 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-slate-600"
                >
                  World Bank Data
                  <ExternalLink class="size-2.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>

    <!-- Right Column: Sidebar Stats (1/3 width) -->
    <div class="flex flex-col gap-6">
      <!-- Cultural & Demographic Groups -->
      <InfoCard
        title="Cultural & Demographic Groups"
        description="Population composition across sitios"
        icon={Users}
        iconBgColor="bg-indigo-100"
        iconTextColor="text-indigo-600"
        headerBgColor="bg-indigo-50/50"
      >
        {#snippet headerAction()}
          {#if hasMultipleYears && culturalGroupsTrend.categories.length > 1}
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-foreground"
              title="View historical trend"
              onclick={() => (showCulturalTrendModal = true)}
            >
              <ChartLine class="size-4" />
            </Button>
          {/if}
        {/snippet}
        <div class="space-y-5">
          <!-- School-Age Children -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <School class="size-4 text-blue-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >School-Age Children</span
                >
                <HelpTooltip content="Children ages 5-17 who are of school-going age" />
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalSchoolAgeChildren.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style="width: {Math.min(
                  (demographics.totalSchoolAgeChildren / demographics.totalPopulation) * 100,
                  100
                )}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {((demographics.totalSchoolAgeChildren / demographics.totalPopulation) * 100).toFixed(
                1
              )}% of Population
            </p>
          </div>

          <!-- Muslim Population -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <Landmark class="size-4 text-emerald-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Muslim</span>
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalMuslim.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                style="width: {Math.min(
                  (demographics.totalMuslim / demographics.totalPopulation) * 100,
                  100
                )}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {((demographics.totalMuslim / demographics.totalPopulation) * 100).toFixed(1)}% of
              Population
            </p>
          </div>

          <!-- Indigenous People -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <Users class="size-4 text-indigo-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >Indigenous People</span
                >
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalIP.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                style="width: {Math.min(
                  (demographics.totalIP / demographics.totalPopulation) * 100,
                  100
                )}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {((demographics.totalIP / demographics.totalPopulation) * 100).toFixed(1)}% of
              Population
            </p>
          </div>

          <!-- Registered Voters -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <Vote class="size-4 text-purple-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >Registered Voters</span
                >
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalVoters.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-purple-500 transition-all duration-500"
                style="width: {Math.min(
                  (demographics.totalVoters / demographics.totalPopulation) * 100,
                  100
                )}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {demographics.voterRegistrationPercent.toFixed(1)}% of Population
            </p>
          </div>
        </div>
      </InfoCard>

      <!-- Vulnerable Sectors -->
      <InfoCard
        title="Vulnerable Sectors"
        description="Priority populations requiring attention"
        icon={UserRound}
        iconBgColor="bg-orange-100"
        iconTextColor="text-orange-600"
        headerBgColor="bg-orange-50/50"
      >
        {#snippet headerAction()}
          {#if hasMultipleYears && vulnerableSectorsTrend.categories.length > 1}
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-foreground"
              title="View historical trend"
              onclick={() => (showVulnerableTrendModal = true)}
            >
              <ChartLine class="size-4" />
            </Button>
          {/if}
        {/snippet}
        <div class="space-y-5">
          <!-- Senior Citizens -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <UserCheck class="size-4 text-orange-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >Senior Citizens</span
                >
                <HelpTooltip content="Residents aged 60 years and above" />
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalSeniors.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-orange-500 transition-all duration-500"
                style="width: {Math.min(demographics.seniorPercent, 100)}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {demographics.seniorPercent.toFixed(1)}% of Population
            </p>
          </div>

          <!-- Out of School Youth -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <School class="size-4 text-red-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >Out of School Youth</span
                >
                <HelpTooltip
                  content="School-age children (5-17 years) not currently attending school"
                />
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalOSY.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-red-500 transition-all duration-500"
                style="width: {Math.min(
                  demographics.totalSchoolAgeChildren > 0
                    ? (demographics.totalOSY / demographics.totalSchoolAgeChildren) * 100
                    : 0,
                  100
                )}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {demographics.totalSchoolAgeChildren > 0
                ? ((demographics.totalOSY / demographics.totalSchoolAgeChildren) * 100).toFixed(1)
                : '0'}% of School-Age Children
            </p>
          </div>

          <!-- No PhilSys ID -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <IdCard class="size-4 text-slate-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >No PhilSys ID</span
                >
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalNoNationalID.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-slate-500 transition-all duration-500"
                style="width: {Math.min(
                  (demographics.totalNoNationalID / demographics.totalPopulation) * 100,
                  100
                )}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {((demographics.totalNoNationalID / demographics.totalPopulation) * 100).toFixed(1)}%
              of Population
            </p>
          </div>

          <!-- No Birth Certificate -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <CreditCard class="size-4 text-amber-500" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >No Birth Certificate</span
                >
              </div>
              <span class="text-base font-bold text-slate-900 dark:text-white">
                {demographics.totalNoBirthCert.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-amber-500 transition-all duration-500"
                style="width: {Math.min(
                  (demographics.totalNoBirthCert / demographics.totalPopulation) * 100,
                  100
                )}%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">
              {((demographics.totalNoBirthCert / demographics.totalPopulation) * 100).toFixed(1)}%
              of Population
            </p>
          </div>
        </div>
      </InfoCard>

      <!-- Sitio Classification Summary -->
      <InfoCard
        title="Sitio Classifications"
        description="Special area designations and vulnerability status"
        icon={UserCheck}
        iconBgColor="bg-slate-100"
        iconTextColor="text-slate-600"
        headerBgColor="bg-slate-50/50"
      >
        <div class="space-y-3">
          <div
            class="rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/30 dark:bg-amber-900/20"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-2.5">
                <span class="mt-0.5 size-3 shrink-0 rounded-full bg-amber-500"></span>
                <div class="min-w-0 flex-1">
                  <span class="text-sm leading-tight font-semibold text-slate-900 dark:text-white"
                    >GIDA Status</span
                  >
                  <p class="mt-0.5 text-xs text-muted-foreground/80">
                    Geographically Isolated and Disadvantaged Area
                  </p>
                </div>
              </div>
              <span class="text-lg font-bold text-slate-900 dark:text-white">
                {demographics.gidaCount}
              </span>
            </div>
          </div>
          <div
            class="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900/30 dark:bg-emerald-900/20"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-2.5">
                <span class="mt-0.5 size-3 shrink-0 rounded-full bg-emerald-500"></span>
                <div class="min-w-0 flex-1">
                  <span class="text-sm leading-tight font-semibold text-slate-900 dark:text-white"
                    >Indigenous Community</span
                  >
                  <p class="mt-0.5 text-xs text-muted-foreground/80">
                    Indigenous Peoples (IP) Area
                  </p>
                </div>
              </div>
              <span class="text-lg font-bold text-slate-900 dark:text-white">
                {demographics.indigenousCount}
              </span>
            </div>
          </div>
          <div
            class="rounded-lg border border-red-200 bg-red-50 p-3.5 dark:border-red-900/30 dark:bg-red-900/20"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-2.5">
                <span class="mt-0.5 size-3 shrink-0 rounded-full bg-red-500"></span>
                <div class="min-w-0 flex-1">
                  <span class="text-sm leading-tight font-semibold text-slate-900 dark:text-white"
                    >Conflict-Affected</span
                  >
                  <p class="mt-0.5 text-xs text-muted-foreground/80">Conflict-affected area</p>
                </div>
              </div>
              <span class="text-lg font-bold text-slate-900 dark:text-white">
                {demographics.conflictCount}
              </span>
            </div>
          </div>
          <p class="text-center text-xs text-muted-foreground">
            Note: Sitios may have multiple classifications
          </p>
        </div>
      </InfoCard>
    </div>
  </div>
</div>

<!-- Gender Trend Modal -->
<Dialog.Root bind:open={showGenderTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-pink-50 p-2 dark:bg-pink-900/20">
          <PersonStanding class="size-5 text-pink-600 dark:text-pink-400" />
        </div>
        Gender Distribution - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year population trends by gender across {populationGenderTrend.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={populationGenderTrend.series}
        categories={populationGenderTrend.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Age Distribution Trend Modal -->
<Dialog.Root bind:open={showAgeTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-teal-50 p-2 dark:bg-teal-900/20">
          <PieChart class="size-5 text-teal-600 dark:text-teal-400" />
        </div>
        Age Distribution - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year population trends by age group across {ageGroupTrend.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={ageGroupTrend.series}
        categories={ageGroupTrend.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Labor & Employment Trend Modal -->
<Dialog.Root bind:open={showLaborTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
          <Briefcase class="size-5 text-purple-600 dark:text-purple-400" />
        </div>
        Labor & Employment - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year labor force and unemployment trends across {laborForceTrend.categories
          .length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={laborForceTrend.series}
        categories={laborForceTrend.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Cultural & Demographic Groups Trend Modal -->
<Dialog.Root bind:open={showCulturalTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
          <Users class="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        Cultural & Demographic Groups - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year trends for cultural and demographic groups across {culturalGroupsTrend
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={culturalGroupsTrend.series}
        categories={culturalGroupsTrend.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Vulnerable Sectors Trend Modal -->
<Dialog.Root bind:open={showVulnerableTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
          <UserRound class="size-5 text-orange-600 dark:text-orange-400" />
        </div>
        Vulnerable Sectors - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year trends for vulnerable populations across {vulnerableSectorsTrend.categories
          .length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={vulnerableSectorsTrend.series}
        categories={vulnerableSectorsTrend.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Dependency Ratio Trend Modal -->
<Dialog.Root bind:open={showDependencyTrendModal}>
  <Dialog.Content class="max-w-4xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
          <Scale class="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        Economic Dependency - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year dependency metrics across {dependencyRatioTrend().categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-6 py-4">
      <!-- Dependency Ratio Chart -->
      <div>
        <h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Dependency Ratio (per 100 workers)
        </h4>
        <LineChart
          categories={dependencyRatioTrend().categories}
          series={dependencyRatioTrend().ratioSeries}
          height={250}
          curve="smooth"
          showLegend={false}
          yAxisFormatter={(val) => val.toFixed(1)}
        />
      </div>

      <!-- Dependent Population Chart -->
      <div>
        <h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Dependent Population (non-working residents)
        </h4>
        <LineChart
          categories={dependencyRatioTrend().categories}
          series={dependencyRatioTrend().populationSeries}
          height={250}
          curve="smooth"
          showLegend={false}
          yAxisFormatter={(val) => val.toLocaleString()}
        />
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Dependency Ratio Trend Modal -->
<Dialog.Root bind:open={showDependencyTrendModal}>
  <Dialog.Content class="max-w-4xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
          <Scale class="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        Economic Dependency - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year dependency metrics across {dependencyRatioTrend().categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-6 py-4">
      <!-- Dependency Ratio Chart -->
      <div>
        <h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Dependency Ratio (per 100 workers)
        </h4>
        <LineChart
          categories={dependencyRatioTrend().categories}
          series={dependencyRatioTrend().ratioSeries}
          height={250}
          curve="smooth"
          showLegend={false}
          yAxisFormatter={(val) => val.toFixed(1)}
        />
      </div>

      <!-- Dependent Population Chart -->
      <div>
        <h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Dependent Population (non-working residents)
        </h4>
        <LineChart
          categories={dependencyRatioTrend().categories}
          series={dependencyRatioTrend().populationSeries}
          height={250}
          curve="smooth"
          showLegend={false}
          yAxisFormatter={(val) => val.toLocaleString()}
        />
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
