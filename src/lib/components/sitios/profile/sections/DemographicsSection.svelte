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
  import type { SitioProfile, SitioRecord } from '$lib/types';
  import { prepareTimeSeriesData } from '$lib/utils/sitio-chart-aggregation';
  import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Baby,
    BarChart3,
    Briefcase,
    ChartLine,
    Clock,
    CreditCard,
    ExternalLink,
    IdCard,
    Landmark,
    Minus,
    PersonStanding,
    PieChart,
    Scale,
    School,
    TrendingDown,
    TrendingUp,
    UserRound,
    Users,
    Vote
  } from '@lucide/svelte';

  interface Props {
    sitio: SitioProfile;
    sitioRecord?: SitioRecord;
  }

  const { sitio, sitioRecord }: Props = $props();

  // Modal states for trend modals
  let showGenderTrendModal = $state(false);
  let showAgeTrendModal = $state(false);
  let showLaborTrendModal = $state(false);
  let showCulturalTrendModal = $state(false);
  let showVulnerableTrendModal = $state(false);
  let showDependencyTrendModal = $state(false);
  let showHouseholdTrendModal = $state(false);

  // Check if we have multiple years of data
  const hasMultipleYears = $derived(
    sitioRecord && sitioRecord.availableYears && sitioRecord.availableYears.length > 1
  );

  // Prepare time series data if we have a sitioRecord
  const sitioArray = $derived(sitioRecord ? [sitioRecord] : []);

  // Time series data for population trend chart
  const populationGenderTrend = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, ['totalMale', 'totalFemale'])
      : { categories: [], series: [] }
  );

  // Time series data for age groups
  const ageGroupTrend = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, ['youth', 'workingAge', 'elderly'])
      : { categories: [], series: [] }
  );

  // Time series data for labor force trend
  const laborForceTrend = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, ['totalLaborWorkforce', 'totalUnemployed'])
      : { categories: [], series: [] }
  );

  // Time series data for cultural groups
  const culturalGroupsTrend = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, [
          'totalSchoolAgeChildren',
          'totalMuslim',
          'totalIP',
          'totalVoters'
        ])
      : { categories: [], series: [] }
  );

  // Time series data for vulnerable sectors
  const vulnerableSectorsTrend = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, [
          'totalSeniors',
          'totalOSY',
          'totalNoBirthCert',
          'totalNoNationalID'
        ])
      : { categories: [], series: [] }
  );

  // Time series data for households
  const householdsTrend = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, ['totalHouseholds'])
      : { categories: [], series: [] }
  );

  // Time series data for total population
  const populationTrend = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, ['totalPopulation'])
      : { categories: [], series: [] }
  );

  // Time series data for dependency ratio (calculated from labor force data)
  const dependencyRatioTrend = $derived(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], ratioSeries: [], populationSeries: [] };
    }

    const years = sitioRecord.availableYears || [];
    const categories = years.map((y) => y.toString());

    const dependencyRatios: number[] = [];
    const dependentPops: number[] = [];

    years.forEach((year) => {
      const yearData = sitioRecord.yearlyData[year.toString()];
      if (yearData) {
        const laborForce = yearData.laborForceCount || 0;
        const totalPop = yearData.totalPopulation || 0;
        const dependentPop = totalPop - laborForce;
        const depRatio = laborForce > 0 ? (dependentPop / laborForce) * 100 : 0;

        dependencyRatios.push(Math.round(depRatio * 10) / 10);
        dependentPops.push(dependentPop);
      } else {
        dependencyRatios.push(0);
        dependentPops.push(0);
      }
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

  // Gender distribution data for donut chart
  const genderData = $derived([
    {
      label: 'Male',
      value: sitio.population.totalMale,
      color: 'hsl(217, 91%, 60%)'
    },
    {
      label: 'Female',
      value: sitio.population.totalFemale,
      color: 'hsl(330, 81%, 60%)'
    }
  ]);

  // Age distribution data for donut chart
  // Working Age (15-64) = laborForceCount
  // Elderly (65+) = seniorsCount (60+) - laborForce60to64Count (60-64 who still work)
  // Youth (0-14) = totalPopulation - workingAge - elderly
  const ageDistribution = $derived(() => {
    const laborForce = sitio.laborForceCount || 0;
    const seniors = sitio.vulnerableGroups.seniorsCount || 0;
    const seniorWorkers = sitio.vulnerableGroups.laborForce60to64Count || 0;

    const workingAge = laborForce;
    const elderly = Math.max(0, seniors - seniorWorkers);
    const youth = Math.max(0, sitio.totalPopulation - workingAge - elderly);

    const total = youth + workingAge + elderly;
    const youthPercent = total > 0 ? ((youth / total) * 100).toFixed(1) : '0';
    const workingAgePercent = total > 0 ? ((workingAge / total) * 100).toFixed(1) : '0';
    const elderlyPercent = total > 0 ? ((elderly / total) * 100).toFixed(1) : '0';

    return {
      youth,
      workingAge,
      elderly,
      youthPercent,
      workingAgePercent,
      elderlyPercent
    };
  });

  // Age distribution donut chart data
  const ageData = $derived([
    {
      label: 'Youth (0-14)',
      value: ageDistribution().youth,
      color: 'hsl(25, 95%, 60%)' // Orange
    },
    {
      label: 'Working Age (15-64)',
      value: ageDistribution().workingAge,
      color: 'hsl(217, 91%, 60%)' // Blue
    },
    {
      label: 'Elderly (65+)',
      value: ageDistribution().elderly,
      color: 'hsl(200, 18%, 60%)' // Gray
    }
  ]);

  // Calculate labor force metrics
  const laborMetrics = $derived(() => {
    const laborForce = sitio.laborForceCount || 0;
    const unemployed = sitio.vulnerableGroups.unemployedCount || 0;
    const employed = laborForce - unemployed;
    const employmentRate = laborForce > 0 ? Math.round((employed / laborForce) * 100) : 0;
    const participationRate =
      sitio.totalPopulation > 0 ? Math.round((laborForce / sitio.totalPopulation) * 100) : 0;
    const seniorWorkforce = sitio.vulnerableGroups.laborForce60to64Count || 0;
    const seniorSharePercent =
      laborForce > 0 ? ((seniorWorkforce / laborForce) * 100).toFixed(1) : '0';

    // Dependency ratio calculation
    // Dependents = population not in labor force (children + elderly)
    const dependentPopulation = sitio.totalPopulation - laborForce;
    const dependencyRatio = laborForce > 0 ? (dependentPopulation / laborForce) * 100 : 0;
    const youngDependents = sitio.schoolAgeChildren || 0; // Proxy for youth dependents
    const elderlyDependents = sitio.vulnerableGroups.seniorsCount || 0;

    return {
      laborForce,
      unemployed,
      employed,
      employmentRate,
      participationRate,
      seniorWorkforce,
      seniorSharePercent,
      dependentPopulation,
      dependencyRatio: dependencyRatio.toFixed(1),
      youngDependents,
      elderlyDependents
    };
  });

  // Cultural groups data
  const culturalGroups = $derived([
    {
      icon: School,
      label: 'School-Age Children',
      value: sitio.schoolAgeChildren,
      percentage:
        sitio.totalPopulation > 0
          ? ((sitio.schoolAgeChildren / sitio.totalPopulation) * 100).toFixed(1)
          : '0',
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-500/10'
      // description: 'Ages 5-17'
    },
    {
      icon: Landmark,
      label: 'Muslim',
      value: sitio.vulnerableGroups.muslimCount,
      percentage:
        sitio.totalPopulation > 0
          ? ((sitio.vulnerableGroups.muslimCount / sitio.totalPopulation) * 100).toFixed(1)
          : '0',
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      icon: Users,
      label: 'Indigenous People',
      value: sitio.vulnerableGroups.ipCount,
      percentage:
        sitio.totalPopulation > 0
          ? ((sitio.vulnerableGroups.ipCount / sitio.totalPopulation) * 100).toFixed(1)
          : '0',
      color: 'bg-indigo-500',
      lightBg: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      icon: Vote,
      label: 'Registered Voters',
      value: sitio.registeredVoters,
      percentage:
        sitio.totalPopulation > 0
          ? ((sitio.registeredVoters / sitio.totalPopulation) * 100).toFixed(1)
          : '0',
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-500/10'
    }
  ]);

  // Labor & Employment Analytics (comparison with national averages/targets)
  const laborAnalytics = $derived(() => {
    const metrics = laborMetrics();
    const unemploymentRate = metrics.laborForce > 0 ? 100 - metrics.employmentRate : 0;

    // Helper to check if a metric is a target
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

  // Vulnerable sectors data
  const vulnerableSectors = $derived([
    {
      icon: UserRound,
      label: 'Senior Citizens',
      value: sitio.vulnerableGroups.seniorsCount,
      percentage:
        sitio.totalPopulation > 0
          ? ((sitio.vulnerableGroups.seniorsCount / sitio.totalPopulation) * 100).toFixed(1)
          : '0',
      color: 'bg-orange-500',
      lightBg: 'bg-orange-50 dark:bg-orange-500/10'
    },
    {
      icon: School,
      label: 'Out of School Youth',
      value: sitio.vulnerableGroups.outOfSchoolYouth,
      percentage:
        sitio.schoolAgeChildren > 0
          ? ((sitio.vulnerableGroups.outOfSchoolYouth / sitio.schoolAgeChildren) * 100).toFixed(1)
          : '0',
      description: 'of School-Age Children',
      color: 'bg-red-500',
      lightBg: 'bg-red-50 dark:bg-red-500/10'
    },
    {
      icon: IdCard,
      label: 'No PhilSys ID',
      value: sitio.vulnerableGroups.noNationalIDCount,
      percentage:
        sitio.totalPopulation > 0
          ? ((sitio.vulnerableGroups.noNationalIDCount / sitio.totalPopulation) * 100).toFixed(1)
          : '0',
      color: 'bg-slate-500',
      lightBg: 'bg-slate-100 dark:bg-slate-500/10'
    },
    {
      icon: CreditCard,
      label: 'No Birth Certificate',
      value: sitio.vulnerableGroups.noBirthCertCount,
      percentage:
        sitio.totalPopulation > 0
          ? ((sitio.vulnerableGroups.noBirthCertCount / sitio.totalPopulation) * 100).toFixed(1)
          : '0',
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50 dark:bg-amber-500/10'
    }
  ]);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <!-- Left Column: Main Charts (2/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-2">
    <!-- Gender Distribution Card -->
    <InfoCard
      title="Gender Distribution"
      description="Breakdown of population by sex"
      icon={PersonStanding}
      iconBgColor="bg-pink-50 dark:bg-pink-900/20"
      iconTextColor="text-pink-600 dark:text-pink-400"
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
      {#snippet children()}
        <div class="flex flex-col items-center justify-around gap-8 p-2 md:flex-row">
          <!-- Donut Chart -->
          <div class="relative w-48 shrink-0 md:w-56">
            <DonutChart
              data={genderData}
              centerLabel="Total"
              centerValue={sitio.totalPopulation.toLocaleString()}
              height={224}
              showLegend={false}
            />
          </div>

          <!-- Gender Stats -->
          <div class="flex w-full max-w-xs flex-col gap-6">
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
                  {sitio.totalPopulation > 0
                    ? Math.round((sitio.population.totalMale / sitio.totalPopulation) * 100)
                    : 0}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {sitio.population.totalMale.toLocaleString()}
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
                  {sitio.totalPopulation > 0
                    ? Math.round((sitio.population.totalFemale / sitio.totalPopulation) * 100)
                    : 0}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {sitio.population.totalFemale.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">Individuals</p>
            </div>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Age Distribution Card -->
    <InfoCard
      title="Population by Age Group"
      description="Breakdown of population by age brackets"
      icon={PieChart}
      iconBgColor="bg-teal-50 dark:bg-teal-900/20"
      iconTextColor="text-teal-600 dark:text-teal-400"
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
      {#snippet children()}
        <div class="flex flex-col items-center justify-around gap-8 p-2 md:flex-row">
          <!-- Donut Chart -->
          <div class="relative w-48 shrink-0 md:w-56">
            <DonutChart
              data={ageData}
              centerLabel="Total"
              centerValue={sitio.totalPopulation.toLocaleString()}
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
                  {ageDistribution().youthPercent}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {ageDistribution().youth.toLocaleString()}
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
                  {ageDistribution().workingAgePercent}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {ageDistribution().workingAge.toLocaleString()}
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
                  {ageDistribution().elderlyPercent}%
                </span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {ageDistribution().elderly.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">Individuals</p>
            </div>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Labor Workforce Card -->
    <InfoCard
      title="Labor & Employment"
      description="Workforce statistics and economic dependency"
      icon={Briefcase}
      iconBgColor="bg-purple-100 dark:bg-purple-900/20"
      iconTextColor="text-purple-600 dark:text-purple-400"
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
      {#snippet children()}
        <div class="space-y-6">
          <!-- Top Stats Row -->
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <!-- Labor Force -->
            <div
              class="rounded-xl border border-purple-100 bg-linear-to-br from-purple-50 to-purple-100/50 p-4 dark:border-purple-900/30 dark:from-purple-900/20 dark:to-purple-900/10"
            >
              <div class="mb-2 flex items-center gap-2">
                <div class="rounded-lg bg-purple-500/10 p-1.5">
                  <Users class="size-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span class="text-xs font-medium text-purple-700 dark:text-purple-300"
                  >Labor Force</span
                >
                <HelpTooltip content="Ages 15-64" class="text-purple-700" />
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {laborMetrics().laborForce.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {laborMetrics().participationRate}% of population
              </p>
            </div>

            <!-- Employed -->
            <div
              class="rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-emerald-100/50 p-4 dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-emerald-900/10"
            >
              <div class="mb-2 flex items-center gap-2">
                <div class="rounded-lg bg-emerald-500/10 p-1.5">
                  <TrendingUp class="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span class="text-xs font-medium text-emerald-700 dark:text-emerald-300"
                  >Employed</span
                >
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {laborMetrics().employed.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {laborMetrics().employmentRate}% employment rate
              </p>
            </div>

            <!-- Unemployed -->
            <div
              class="rounded-xl border border-rose-100 bg-linear-to-br from-rose-50 to-rose-100/50 p-4 dark:border-rose-900/30 dark:from-rose-900/20 dark:to-rose-900/10"
            >
              <div class="mb-2 flex items-center gap-2">
                <div class="rounded-lg bg-rose-500/10 p-1.5">
                  <TrendingDown class="size-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span class="text-xs font-medium text-rose-700 dark:text-rose-300">Unemployed</span>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {laborMetrics().unemployed.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {100 - laborMetrics().employmentRate}% of labor force
              </p>
            </div>

            <!-- Senior Workforce -->
            <div
              class="rounded-xl border border-orange-100 bg-linear-to-br from-orange-50 to-orange-100/50 p-4 dark:border-orange-900/30 dark:from-orange-900/20 dark:to-orange-900/10"
            >
              <div class="mb-2 flex items-center gap-2">
                <div class="rounded-lg bg-orange-500/10 p-1.5">
                  <Clock class="size-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-xs font-medium text-orange-700 dark:text-orange-300">
                    Senior Workers
                  </span>
                  <HelpTooltip
                    content="Ages 60-64 included in the labor force"
                    class="text-orange-700"
                  />
                </div>
              </div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {laborMetrics().seniorWorkforce.toLocaleString()}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {laborMetrics().seniorSharePercent}% of workforce
              </p>
            </div>
          </div>

          <!-- Employment Rate Visualization -->
          <div
            class="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30"
          >
            <div class="mb-4 flex items-center justify-between">
              <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Employment Distribution
              </h4>
            </div>

            <!-- Stacked Bar -->
            <div
              class="relative mb-3 h-8 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
              <div
                class="absolute top-0 left-0 flex h-full items-center justify-center bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style="width: {laborMetrics().employmentRate}%"
              >
                {#if laborMetrics().employmentRate > 15}
                  <span class="text-xs font-bold text-white drop-shadow">
                    {laborMetrics().employmentRate}%
                  </span>
                {/if}
              </div>
              <div
                class="absolute top-0 flex h-full items-center justify-center bg-linear-to-r from-rose-500 to-rose-400 transition-all duration-700"
                style="left: {laborMetrics().employmentRate}%; width: {100 -
                  laborMetrics().employmentRate}%"
              >
                {#if 100 - laborMetrics().employmentRate > 15}
                  <span class="text-xs font-bold text-white drop-shadow">
                    {100 - laborMetrics().employmentRate}%
                  </span>
                {/if}
              </div>
            </div>

            <!-- Legend -->
            <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <div class="flex items-center gap-2">
                <span class="size-3 rounded-full bg-linear-to-r from-emerald-500 to-emerald-400"
                ></span>
                <span class="text-xs text-muted-foreground"
                  >Employed ({laborMetrics().employed.toLocaleString()})</span
                >
              </div>
              <div class="flex items-center gap-2">
                <span class="size-3 rounded-full bg-linear-to-r from-rose-500 to-rose-400"></span>
                <span class="text-xs text-muted-foreground"
                  >Unemployed ({laborMetrics().unemployed.toLocaleString()})</span
                >
              </div>
            </div>
          </div>

          <!-- Dependency Ratio Section -->
          <div
            class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50/50 p-5 dark:border-amber-900/30 dark:from-amber-900/15 dark:to-orange-900/10"
          >
            <div class="mb-4 flex items-center gap-3">
              <div class="rounded-xl bg-amber-500/15 p-2.5 dark:bg-amber-500/20">
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

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <!-- Dependency Ratio -->
              <div
                class="flex flex-col items-center justify-center rounded-xl bg-white/70 p-6 shadow-sm dark:bg-slate-800/50"
              >
                <div class="relative mb-3 size-24">
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
                        parseFloat(laborMetrics().dependencyRatio),
                        100
                      )} 100"
                      stroke-linecap="round"
                      stroke-width="3.5"
                    ></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-2xl font-bold text-slate-900 dark:text-white">
                      {laborMetrics().dependencyRatio}
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
                class="flex flex-col items-center justify-center rounded-xl bg-white/70 p-6 shadow-sm dark:bg-slate-800/50"
              >
                <div class="mb-3 rounded-full bg-amber-500/15 p-4 dark:bg-amber-500/20">
                  <Users class="size-10 text-amber-600 dark:text-amber-400" />
                </div>
                <span class="text-2xl font-bold text-slate-900 dark:text-white">
                  {laborMetrics().dependentPopulation.toLocaleString()}
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
                    content="Comparison of local labor metrics against Philippine national averages and targets. Values marked with 'Target' compare against government targets rather than current averages."
                    class="text-blue-700"
                  />
                </div>
                <p class="text-xs text-muted-foreground">Sitio vs. Philippine Benchmarks</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Unemployment Rate Comparison -->
              <div class="rounded-lg bg-white/70 p-3 dark:bg-slate-800/50">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Unemployment
                  </span>
                  {#if laborAnalytics().unemploymentComparison.status === 'better'}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <ArrowDown class="size-3" />
                      Better
                    </span>
                  {:else if laborAnalytics().unemploymentComparison.status === 'worse'}
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
                    {laborAnalytics().unemploymentRate.toFixed(1)}%
                  </p>
                  <p class="text-xs text-muted-foreground">
                    vs {laborAnalytics().nationalAverages.unemploymentRate.percent}%
                  </p>
                </div>
                <div class="mt-2 space-y-1">
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full transition-all duration-500 {laborAnalytics()
                        .unemploymentComparison.status === 'better'
                        ? 'bg-emerald-500'
                        : laborAnalytics().unemploymentComparison.status === 'worse'
                          ? 'bg-red-500'
                          : 'bg-slate-400'}"
                      style="width: {Math.min(laborAnalytics().unemploymentRate * 5, 100)}%"
                    ></div>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style="width: {laborAnalytics().nationalAverages.unemploymentRate.percent *
                        5}%"
                    ></div>
                  </div>
                </div>
                <p class="mt-1 text-center text-[10px] text-muted-foreground">
                  Local • {laborAnalytics().unemploymentComparison.isTarget
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
                  {#if laborAnalytics().dependencyComparison.status === 'better'}
                    <span
                      class="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <ArrowDown class="size-3" />
                      Lower
                    </span>
                  {:else if laborAnalytics().dependencyComparison.status === 'worse'}
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
                    {laborMetrics().dependencyRatio}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    vs {laborAnalytics().nationalAverages.ageDependencyRatio.percent}
                  </p>
                </div>
                <div class="mt-2 space-y-1">
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full transition-all duration-500 {laborAnalytics()
                        .dependencyComparison.status === 'better'
                        ? 'bg-emerald-500'
                        : laborAnalytics().dependencyComparison.status === 'worse'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'}"
                      style="width: {Math.min(parseFloat(laborMetrics().dependencyRatio), 100)}%"
                    ></div>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      class="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style="width: {laborAnalytics().nationalAverages.ageDependencyRatio.percent}%"
                    ></div>
                  </div>
                </div>
                <p class="mt-1 text-center text-[10px] text-muted-foreground">
                  Local • {laborAnalytics().dependencyComparison.isTarget
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
                  href={laborAnalytics().nationalAverages.unemploymentRate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] text-blue-600 shadow-sm transition-colors hover:bg-blue-50 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-slate-600"
                >
                  PSA Labor Force Survey
                  <ExternalLink class="size-2.5" />
                </a>
                <a
                  href={laborAnalytics().nationalAverages.ageDependencyRatio.url}
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
      {/snippet}
    </InfoCard>
  </div>

  <!-- Right Column: Sidebar Stats (1/3 width) -->
  <div class="flex flex-col gap-6">
    <!-- Households & Population Card -->
    <InfoCard
      title="Households & Population"
      description="Community size metrics"
      icon={Users}
      iconBgColor="bg-cyan-50 dark:bg-cyan-900/20"
      iconTextColor="text-cyan-600 dark:text-cyan-400"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && householdsTrend.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical trend"
            onclick={() => (showHouseholdTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <div class="space-y-6">
          <!-- Total Households -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <Users class="size-5 text-cyan-600 dark:text-cyan-400" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Households
                </span>
              </div>
              <span class="text-lg font-bold text-slate-900 dark:text-white">
                {sitio.totalHouseholds.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-cyan-500 transition-all duration-500"
                style="width: 100%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">Family units</p>
          </div>

          <!-- Total Population -->
          <div>
            <div class="mb-2 flex items-end justify-between">
              <div class="flex items-center gap-2">
                <Users class="size-5 text-blue-600 dark:text-blue-400" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Population
                </span>
              </div>
              <span class="text-lg font-bold text-slate-900 dark:text-white">
                {sitio.totalPopulation.toLocaleString()}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                class="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style="width: 100%"
              ></div>
            </div>
            <p class="mt-1 text-right text-xs text-muted-foreground">Total individuals</p>
          </div>

          <!-- Average Household Size -->
          <div
            class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Avg. Household Size
                </p>
                <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {sitio.totalHouseholds > 0
                    ? (sitio.totalPopulation / sitio.totalHouseholds).toFixed(1)
                    : '0'}
                </p>
              </div>
              <div class="rounded-lg bg-cyan-100 p-3 dark:bg-cyan-900/30">
                <Users class="size-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">People per household</p>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Cultural & Demographic Groups -->
    <InfoCard
      title="Cultural & Demographic Groups"
      description="Population composition"
      icon={Users}
      iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
      iconTextColor="text-indigo-600 dark:text-indigo-400"
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
      {#snippet children()}
        <div class="space-y-6">
          {#each culturalGroups as group}
            {@const Icon = group.icon}
            <div>
              <div class="mb-2 flex items-end justify-between">
                <div class="flex items-center gap-2">
                  <Icon class="size-5 {group.color.replace('bg-', 'text-')}" />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >{group.label}</span
                  >
                  <!-- {#if group.description}
                    <span class="text-xs text-muted-foreground">({group.description})</span>
                  {/if} -->
                  {#if group.label === 'School-Age Children'}
                    <HelpTooltip content="Children ages 5-17 who are of school-going age" />
                  {/if}
                </div>
                <span class="text-lg font-bold text-slate-900 dark:text-white">
                  {group.value.toLocaleString()}
                </span>
              </div>
              <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2 rounded-full {group.color} transition-all duration-500"
                  style="width: {Math.min(parseFloat(group.percentage), 100)}%"
                ></div>
              </div>
              <p class="mt-1 text-right text-xs text-muted-foreground">
                {group.percentage}% of Population
              </p>
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>

    <!-- Vulnerable Sectors -->
    <InfoCard
      title="Vulnerable Sectors"
      description="Priority populations"
      icon={UserRound}
      iconBgColor="bg-orange-50 dark:bg-orange-900/20"
      iconTextColor="text-orange-600 dark:text-orange-400"
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
      {#snippet children()}
        <div class="space-y-6">
          {#each vulnerableSectors as sector}
            {@const Icon = sector.icon}
            {@const hasWarning = sector.value > 1 && sector.label !== 'Senior Citizens'}
            {@const getWarningMessage = (label: string) => {
              switch (label) {
                case 'Out of School Youth':
                  return 'Some youth not attending school. This may indicate barriers to education access, economic hardship, or lack of educational facilities.';
                case 'No PhilSys ID':
                  return 'A portion of population lacks national ID. This limits access to government services, financial inclusion, and may indicate registration barriers.';
                case 'No Birth Certificate':
                  return 'Some residents lack birth certificates. This affects legal identity, access to services, education enrollment, and may indicate civil registration gaps.';
                default:
                  return 'This sector requires attention and targeted interventions.';
              }
            }}
            <div>
              <div class="mb-2 flex items-end justify-between">
                <div class="flex items-center gap-2">
                  <Icon class="size-5 {sector.color.replace('bg-', 'text-')}" />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >{sector.label}</span
                  >
                  {#if sector.label === 'Senior Citizens'}
                    <HelpTooltip content="Residents aged 60 years and above" />
                  {:else if sector.label === 'Out of School Youth'}
                    <HelpTooltip
                      content="School-age children (5-17 years) not currently attending school"
                    />
                  {/if}
                  {#if hasWarning}
                    <div
                      class="flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 dark:bg-amber-900/30"
                    >
                      <AlertTriangle class="size-3 text-amber-600 dark:text-amber-400" />
                      <span class="text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                        >Alert</span
                      >
                      <HelpTooltip
                        content={getWarningMessage(sector.label)}
                        class="text-amber-700"
                      />
                    </div>
                  {/if}
                </div>
                <span class="text-lg font-bold text-slate-900 dark:text-white">
                  {sector.value.toLocaleString()}
                </span>
              </div>
              <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2 rounded-full {sector.color} transition-all duration-500"
                  style="width: {Math.min(parseFloat(sector.percentage), 100)}%"
                ></div>
              </div>
              <p class="mt-1 text-right text-xs text-muted-foreground">
                {sector.percentage}% {sector.description || 'of Population'}
              </p>
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>
  </div>
</div>

<!-- Gender Distribution Trend Modal -->
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
        categories={populationGenderTrend.categories}
        series={populationGenderTrend.series}
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
        categories={ageGroupTrend.categories}
        series={ageGroupTrend.series}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Labor Force Trend Modal -->
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
        categories={laborForceTrend.categories}
        series={laborForceTrend.series}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Cultural Groups Trend Modal -->
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
        categories={culturalGroupsTrend.categories}
        series={culturalGroupsTrend.series}
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
        categories={vulnerableSectorsTrend.categories}
        series={vulnerableSectorsTrend.series}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Household & Population Trend Modal -->
<Dialog.Root bind:open={showHouseholdTrendModal}>
  <Dialog.Content class="max-w-4xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-900/20">
          <Users class="size-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        Households & Population - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year trends across {householdsTrend.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-6 py-4">
      <!-- Households Chart -->
      <div>
        <h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Total Households
        </h4>
        <LineChart
          categories={householdsTrend.categories}
          series={householdsTrend.series}
          height={250}
          curve="smooth"
          showLegend={true}
          yAxisFormatter={(val) => val.toLocaleString()}
        />
      </div>

      <!-- Population Chart -->
      <div>
        <h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Total Population
        </h4>
        <LineChart
          categories={populationTrend.categories}
          series={populationTrend.series}
          height={250}
          curve="smooth"
          showLegend={true}
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
