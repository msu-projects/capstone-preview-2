<script lang="ts">
  import DonutChart from '$lib/components/charts/DonutChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import {
    INCOME_CLUSTER_CONFIG,
    getIncomeCluster,
    getIncomeClusterLabel,
    getIncomeClusterRangeLabel
  } from '$lib/config/poverty-thresholds';
  import type { SitioProfile, SitioRecord } from '$lib/types';
  import { formatCurrency } from '$lib/utils/formatters';
  import {
    aggregateLivelihood,
    getMultiYearMetrics,
    prepareTimeSeriesData
  } from '$lib/utils/sitio-chart-aggregation';
  import {
    AlertTriangle,
    Banknote,
    Bird,
    Briefcase,
    Building2,
    Cat,
    ChartLine,
    CheckCircle2,
    CircleAlert,
    Dog,
    Droplets,
    Flame,
    Globe,
    HandCoins,
    Home,
    Info,
    Landmark,
    Leaf,
    Mountain,
    Sprout,
    Syringe,
    Tractor,
    TreeDeciduous,
    UserCheck,
    Users,
    Utensils,
    Wheat
  } from '@lucide/svelte';

  interface Props {
    sitio: SitioProfile;
    sitioRecord?: SitioRecord;
    selectedYear?: number;
  }

  const { sitio, sitioRecord, selectedYear }: Props = $props();

  // Modal states for trend modals
  let showIncomeTrendModal = $state(false);
  let showPovertyTrendModal = $state(false);
  let showWorkerClassTrendModal = $state(false);
  let showFarmersTrendModal = $state(false);
  let showOrgsTrendModal = $state(false);
  let showFarmAreaTrendModal = $state(false);
  let showBackyardGardensTrendModal = $state(false);
  let showPetsTrendModal = $state(false);

  // Check if we have multiple years of data
  const hasMultipleYears = $derived(
    sitioRecord && sitioRecord.availableYears && sitioRecord.availableYears.length > 1
  );

  // Prepare time series data if we have a sitioRecord
  const sitioArray = $derived(sitioRecord ? [sitioRecord] : []);

  // Time series data for income trend
  const incomeTrendData = $derived(
    hasMultipleYears
      ? prepareTimeSeriesData(sitioArray, ['averageDailyIncome'])
      : { categories: [], series: [] }
  );

  // Time series data for income cluster trend (single sitio - shows income class changes over time)
  const incomeClusterTrendData = $derived.by(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], series: [] };
    }

    const categories: string[] = [];
    const incomeData: number[] = [];

    sitioRecord.availableYears?.forEach((year) => {
      const yearData = sitioRecord.yearlyData?.[year];
      if (yearData) {
        categories.push(year.toString());
        incomeData.push(yearData.averageDailyIncome || 0);
      }
    });

    return {
      categories,
      series: [
        {
          name: 'Average Daily Income',
          data: incomeData,
          color: 'hsl(142, 71%, 45%)'
        }
      ]
    };
  });

  // Time series data for farmers trend
  const farmersTrendData = $derived.by(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], series: [] };
    }

    const yearlyMetrics = getMultiYearMetrics(sitioArray);
    const categories = yearlyMetrics.map((m) => m.year.toString());
    const farmersData: number[] = [];

    yearlyMetrics.forEach((yearMetric) => {
      const yearNum = yearMetric.year;
      const yearLivelihood = aggregateLivelihood(sitioArray, yearNum);
      farmersData.push(yearLivelihood.totalFarmers);
    });

    return {
      categories,
      series: [
        {
          name: 'Farmers',
          data: farmersData,
          color: 'hsl(38, 92%, 50%)'
        }
      ]
    };
  });

  // Time series data for organizations trend
  const orgsTrendData = $derived.by(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], series: [] };
    }

    const yearlyMetrics = getMultiYearMetrics(sitioArray);
    const categories = yearlyMetrics.map((m) => m.year.toString());
    const orgsData: number[] = [];

    yearlyMetrics.forEach((yearMetric) => {
      const yearNum = yearMetric.year;
      const yearLivelihood = aggregateLivelihood(sitioArray, yearNum);
      orgsData.push(yearLivelihood.totalFarmerOrgs);
    });

    return {
      categories,
      series: [
        {
          name: 'Organizations',
          data: orgsData,
          color: 'hsl(142, 71%, 45%)'
        }
      ]
    };
  });

  // Time series data for farm area trend
  const farmAreaTrendData = $derived.by(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], series: [] };
    }

    const yearlyMetrics = getMultiYearMetrics(sitioArray);
    const categories = yearlyMetrics.map((m) => m.year.toString());
    const areaData: number[] = [];

    yearlyMetrics.forEach((yearMetric) => {
      const yearNum = yearMetric.year;
      const yearLivelihood = aggregateLivelihood(sitioArray, yearNum);
      areaData.push(Math.round(yearLivelihood.totalFarmArea * 10) / 10);
    });

    return {
      categories,
      series: [
        {
          name: 'Farm Area (ha)',
          data: areaData,
          color: 'hsl(120, 60%, 50%)'
        }
      ]
    };
  });

  // Time series data for backyard gardens trend
  const backyardGardensTrendData = $derived.by(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], series: [] };
    }

    const categories: string[] = [];
    const householdsData: number[] = [];

    sitioRecord.availableYears?.forEach((year) => {
      const yearData = sitioRecord.yearlyData?.[year];
      if (yearData) {
        categories.push(year.toString());
        householdsData.push(yearData.backyardGardens?.householdsWithGardens ?? 0);
      }
    });

    return {
      categories,
      series: [
        {
          name: 'Households with Gardens',
          data: householdsData,
          color: 'hsl(173, 80%, 40%)'
        }
      ]
    };
  });

  // Time series data for pets trend
  const petsTrendData = $derived.by(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], series: [] };
    }

    const categories: string[] = [];
    const dogsData: number[] = [];
    const catsData: number[] = [];
    const vaccinatedDogsData: number[] = [];
    const vaccinatedCatsData: number[] = [];

    sitioRecord.availableYears?.forEach((year) => {
      const yearData = sitioRecord.yearlyData?.[year];
      if (yearData) {
        categories.push(year.toString());

        const dogsCount = yearData.pets?.dogsCount ?? 0;
        const catsCount = yearData.pets?.catsCount ?? 0;
        const vaccinatedDogs = yearData.pets?.vaccinatedDogs ?? 0;
        const vaccinatedCats = yearData.pets?.vaccinatedCats ?? 0;

        dogsData.push(dogsCount);
        catsData.push(catsCount);
        vaccinatedDogsData.push(vaccinatedDogs);
        vaccinatedCatsData.push(vaccinatedCats);
      }
    });

    return {
      categories,
      series: [
        {
          name: 'Dogs',
          data: dogsData,
          color: 'hsl(38, 92%, 50%)'
        },
        {
          name: 'Cats',
          data: catsData,
          color: 'hsl(24, 95%, 53%)'
        },
        {
          name: 'Vaccinated Dogs',
          data: vaccinatedDogsData,
          color: 'hsl(142, 71%, 45%)'
        },
        {
          name: 'Vaccinated Cats',
          data: vaccinatedCatsData,
          color: 'hsl(173, 80%, 40%)'
        }
      ]
    };
  });

  // Time series data for worker classification trend
  const workerClassTrendData = $derived.by(() => {
    if (!hasMultipleYears || !sitioRecord) {
      return { categories: [], series: [] };
    }

    const categories: string[] = [];
    const privateHouseholdData: number[] = [];
    const privateEstablishmentData: number[] = [];
    const governmentData: number[] = [];
    const selfEmployedData: number[] = [];
    const employerData: number[] = [];
    const ofwData: number[] = [];

    sitioRecord.availableYears?.forEach((year) => {
      const yearData = sitioRecord.yearlyData?.[year];
      if (yearData && yearData.workerClass) {
        categories.push(year.toString());
        privateHouseholdData.push(yearData.workerClass.privateHousehold || 0);
        privateEstablishmentData.push(yearData.workerClass.privateEstablishment || 0);
        governmentData.push(yearData.workerClass.government || 0);
        selfEmployedData.push(yearData.workerClass.selfEmployed || 0);
        employerData.push(yearData.workerClass.employer || 0);
        ofwData.push(yearData.workerClass.ofw || 0);
      }
    });

    return {
      categories,
      series: [
        {
          name: 'Private Household',
          data: privateHouseholdData,
          color: 'hsl(262, 83%, 58%)'
        },
        {
          name: 'Private Establishment',
          data: privateEstablishmentData,
          color: 'hsl(217, 91%, 60%)'
        },
        {
          name: 'Government',
          data: governmentData,
          color: 'hsl(142, 71%, 45%)'
        },
        {
          name: 'Self-Employed',
          data: selfEmployedData,
          color: 'hsl(38, 92%, 50%)'
        },
        {
          name: 'Employer',
          data: employerData,
          color: 'hsl(340, 75%, 55%)'
        },
        {
          name: 'OFW',
          data: ofwData,
          color: 'hsl(173, 80%, 40%)'
        }
      ]
    };
  });

  // Calculate total workers
  const totalWorkers = $derived(
    sitio.workerClass.privateHousehold +
      sitio.workerClass.privateEstablishment +
      sitio.workerClass.government +
      sitio.workerClass.selfEmployed +
      sitio.workerClass.employer +
      sitio.workerClass.ofw
  );

  // Worker class distribution data for donut chart with descriptions
  const workerClassData = $derived([
    {
      label: 'Private HH',
      fullLabel: 'Private Household',
      value: sitio.workerClass.privateHousehold,
      color: 'hsl(262, 83%, 58%)',
      icon: Home,
      description:
        'Works in a private household for pay, in cash or in kind. Examples include domestic helpers, household cooks, gardeners, and family drivers.'
    },
    {
      label: 'Private Est.',
      fullLabel: 'Private Establishment',
      value: sitio.workerClass.privateEstablishment,
      color: 'hsl(217, 91%, 60%)',
      icon: Building2,
      description:
        'Works in a private establishment for pay. Includes persons working for private industry, religious groups, unions, and non-profit organizations.'
    },
    {
      label: 'Government',
      fullLabel: 'Government Worker',
      value: sitio.workerClass.government,
      color: 'hsl(142, 71%, 45%)',
      icon: Landmark,
      description:
        'Works for government or a government corporation or any of its instrumentalities.'
    },
    {
      label: 'Self-Employed',
      fullLabel: 'Self-Employed',
      value: sitio.workerClass.selfEmployed,
      color: 'hsl(38, 92%, 50%)',
      icon: UserCheck,
      description:
        'Works for profit or fees in own business, farm, profession or trade without any paid employee. Examples: bookkeeper, CPA, doctors, etc.'
    },
    {
      label: 'Employer',
      fullLabel: 'Employer',
      value: sitio.workerClass.employer,
      color: 'hsl(340, 75%, 55%)',
      icon: Briefcase,
      description:
        'Works in their own business, farm, profession or trade with one or more regular paid employees, including paid family members.'
    },
    {
      label: 'OFW',
      fullLabel: 'Overseas Filipino Worker',
      value: sitio.workerClass.ofw,
      color: 'hsl(173, 80%, 40%)',
      icon: Globe,
      description:
        'Works for the government of another country. Includes OFWs working abroad whose pay is provided by that foreign government.'
    }
  ]);

  // Calculate percentages for worker class
  const workerClassWithPercent = $derived(
    workerClassData.map((item) => ({
      ...item,
      percent: totalWorkers > 0 ? Math.round((item.value / totalWorkers) * 100) : 0
    }))
  );

  // Income level indicator based on 7-tier income clusters
  const incomeLevel = $derived(() => {
    const daily = sitio.averageDailyIncome;
    const cluster = getIncomeCluster(daily);
    const config = INCOME_CLUSTER_CONFIG[cluster];

    return {
      label: config.label,
      color: config.textColor,
      bg: config.bgColor,
      bgLight: config.bgLight,
      cluster,
      rangeLabel: getIncomeClusterRangeLabel(cluster)
    };
  });

  // Employment rate calculation
  const employmentRate = $derived(
    sitio.laborForceCount > 0 ? Math.round((totalWorkers / sitio.laborForceCount) * 100) : 0
  );

  // Income cluster for this sitio
  const incomeCluster = $derived(getIncomeCluster(sitio.averageDailyIncome));

  // Food security configuration
  const foodSecurityConfig = $derived(() => {
    const configs = {
      secure: {
        label: 'Food Secure',
        description: 'Adequate food supply year-round',
        icon: CheckCircle2,
        color: 'emerald',
        bgClass:
          'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-emerald-950/10'
      },
      seasonal_scarcity: {
        label: 'Seasonal Scarcity',
        description: 'Food shortages during certain periods',
        icon: CircleAlert,
        color: 'amber',
        bgClass:
          'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:border-amber-800/40 dark:from-amber-900/20 dark:to-amber-950/10'
      },
      critical_shortage: {
        label: 'Critical Shortage',
        description: 'Chronic food insufficiency',
        icon: AlertTriangle,
        color: 'red',
        bgClass:
          'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 dark:border-red-800/40 dark:from-red-900/20 dark:to-red-950/10'
      }
    };

    return Object.entries(configs).map(([key, config]) => ({
      ...config,
      key,
      isActive: sitio.foodSecurity === key
    }));
  });

  // Hazards data with icons and severity
  const hazardsList = $derived([
    {
      name: 'Flood',
      frequency: sitio.hazards.flood.frequency || 0,
      icon: Droplets,
      color: 'blue'
    },
    {
      name: 'Landslide',
      frequency: sitio.hazards.landslide.frequency || 0,
      icon: Mountain,
      color: 'amber'
    },
    {
      name: 'Drought',
      frequency: sitio.hazards.drought.frequency || 0,
      icon: Flame,
      color: 'orange'
    },
    {
      name: 'Earthquake',
      frequency: sitio.hazards.earthquake.frequency || 0,
      icon: AlertTriangle,
      color: 'red'
    }
  ]);

  // Total hazard frequency
  const totalHazardFrequency = $derived(hazardsList.reduce((sum, h) => sum + h.frequency, 0));
  const hasHazards = $derived(totalHazardFrequency > 0);

  // Pets data
  const hasPets = $derived(sitio.pets && (sitio.pets.catsCount > 0 || sitio.pets.dogsCount > 0));
  const totalPets = $derived(sitio.pets ? sitio.pets.catsCount + sitio.pets.dogsCount : 0);
  const catVaccinationRate = $derived(
    sitio.pets && sitio.pets.catsCount > 0
      ? Math.round((sitio.pets.vaccinatedCats / sitio.pets.catsCount) * 100)
      : 0
  );
  const dogVaccinationRate = $derived(
    sitio.pets && sitio.pets.dogsCount > 0
      ? Math.round((sitio.pets.vaccinatedDogs / sitio.pets.dogsCount) * 100)
      : 0
  );

  // Backyard gardens data
  const hasBackyardGardens = $derived(
    sitio.backyardGardens && sitio.backyardGardens.householdsWithGardens > 0
  );
  const backyardGardenRate = $derived(
    sitio.backyardGardens && sitio.totalHouseholds > 0
      ? Math.round((sitio.backyardGardens.householdsWithGardens / sitio.totalHouseholds) * 100)
      : 0
  );

  // Agriculture summary stats
  const agricultureStats = $derived([
    {
      label: 'Farmers',
      value: sitio.agriculture.numberOfFarmers,
      icon: Tractor,
      color: 'bg-amber-500'
    },
    {
      label: 'Associations',
      value: sitio.agriculture.numberOfAssociations,
      icon: Users,
      color: 'bg-emerald-500'
    },
    {
      label: 'Hectares',
      value: sitio.agriculture.estimatedFarmAreaHectares,
      icon: Sprout,
      color: 'bg-green-500'
    }
  ]);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <!-- Left Column: Main Content (2/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-2">
    <!-- Labor & Income Card -->
    <InfoCard
      title="Labor & Income"
      description="Employment distribution and household earnings"
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
                      Average daily income per household based on survey data
                    </HelpTooltip>
                  </div>
                  <p
                    class="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
                  >
                    {formatCurrency(sitio.averageDailyIncome)}
                  </p>
                </div>
                <div class="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                  <div class="flex items-center gap-1.5 rounded-full px-3 py-1.5 {level.bgLight}">
                    <span class="text-sm font-semibold {level.color}">
                      {level.label}
                    </span>
                  </div>
                  <span class="text-xs text-muted-foreground">per household</span>
                </div>
              </div>
            </div>

            <!-- Employment Rate Mini Card -->
            <div
              class="flex flex-col justify-center rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/80 to-indigo-50/50 p-5 text-center dark:border-violet-800/30 dark:from-violet-900/15 dark:to-indigo-900/10"
            >
              <span
                class="text-[10px] font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300"
              >
                Employment Rate
              </span>
              <p class="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                {employmentRate}%
              </p>
              <p class="mt-1 text-[10px] text-muted-foreground">
                {totalWorkers} of {sitio.laborForceCount}
              </p>
            </div>
          </div>

          <!-- Income Cluster Classification Card -->
          {#if incomeCluster}
            {@const clusterConfig = INCOME_CLUSTER_CONFIG[incomeCluster]}
            <div
              class="rounded-2xl border p-4"
              style="border-color: {clusterConfig.color}30; background: linear-gradient(to bottom right, {clusterConfig.color}10, {clusterConfig.color}05)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="rounded-lg p-1.5" style="background-color: {clusterConfig.color}20">
                    <Banknote class="size-4" style="color: {clusterConfig.color}" />
                  </div>
                  <div>
                    <div class="flex items-center gap-1">
                      <span class="text-xs font-semibold" style="color: {clusterConfig.color}">
                        {getIncomeClusterLabel(incomeCluster)}
                      </span>
                      <HelpTooltip side="top">
                        {clusterConfig.description}
                      </HelpTooltip>
                    </div>
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      {getIncomeClusterRangeLabel(incomeCluster)}
                    </p>
                  </div>
                </div>
                <div
                  class="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style="background-color: {clusterConfig.color}20; color: {clusterConfig.color}"
                >
                  {formatCurrency(sitio.averageDailyIncome)}/day
                </div>
              </div>
            </div>
          {/if}

          <!-- Labor Force Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div
              class="group relative overflow-hidden rounded-xl border border-indigo-100 bg-white p-4 transition-all hover:shadow-md dark:border-indigo-800/30 dark:bg-slate-800/50"
            >
              <div
                class="absolute inset-0 bg-linear-to-br from-indigo-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-indigo-900/20"
              ></div>
              <div class="relative flex items-center gap-3">
                <div class="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-800/40">
                  <Users class="size-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <span
                    class="text-[10px] font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300"
                  >
                    Labor Force
                  </span>
                  <p class="text-2xl font-bold text-slate-900 dark:text-white">
                    {sitio.laborForceCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div
              class="group relative overflow-hidden rounded-xl border border-teal-100 bg-white p-4 transition-all hover:shadow-md dark:border-teal-800/30 dark:bg-slate-800/50"
            >
              <div
                class="absolute inset-0 bg-linear-to-br from-teal-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-teal-900/20"
              ></div>
              <div class="relative flex items-center gap-3">
                <div class="rounded-xl bg-teal-100 p-2.5 dark:bg-teal-800/40">
                  <Briefcase class="size-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <span
                    class="text-[10px] font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300"
                  >
                    Total Workers
                  </span>
                  <p class="text-2xl font-bold text-slate-900 dark:text-white">
                    {totalWorkers.toLocaleString()}
                  </p>
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
              <div class="flex items-center gap-2">
                {#if hasMultipleYears && workerClassTrendData.categories.length > 1}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-muted-foreground hover:text-foreground"
                    title="View historical worker classification trend"
                    onclick={() => (showWorkerClassTrendModal = true)}
                  >
                    <ChartLine class="size-4" />
                  </Button>
                {/if}
                <HelpTooltip side="left">
                  Distribution of workers by employment type. Click on each category to learn more.
                </HelpTooltip>
              </div>
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
                            {worker.value}
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
                              {worker.value} workers ({worker.percent}%)
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
      description="Farming activities, crops, and livestock"
      icon={Wheat}
      iconBgColor="bg-amber-50 dark:bg-amber-900/20"
      iconTextColor="text-amber-500"
    >
      {#snippet children()}
        <div class="flex flex-col gap-6">
          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-3">
            {#each agricultureStats as stat, index}
              <div
                class="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 text-center transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50"
              >
                <div
                  class="absolute inset-0 bg-linear-to-br from-transparent to-slate-50/50 opacity-0 transition-opacity group-hover:opacity-100 dark:to-slate-700/20"
                ></div>
                <div class="relative">
                  {#if hasMultipleYears}
                    <div class="absolute -top-1 -right-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-6 text-muted-foreground hover:text-foreground"
                        title="View historical trend"
                        onclick={() => {
                          if (index === 0) showFarmersTrendModal = true;
                          else if (index === 1) showOrgsTrendModal = true;
                          else if (index === 2) showFarmAreaTrendModal = true;
                        }}
                      >
                        <ChartLine class="size-3" />
                      </Button>
                    </div>
                  {/if}
                  <div
                    class="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl {stat.color}/10"
                  >
                    <stat.icon class="size-5 {stat.color.replace('bg-', 'text-')}" />
                  </div>
                  <p class="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  <p class="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            {/each}
          </div>

          <!-- Crops & Livestock Grid -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Major Crops -->
            <div
              class="rounded-xl border border-green-100 bg-linear-to-br from-green-50/80 to-emerald-50/50 p-4 dark:border-green-800/30 dark:from-green-900/15 dark:to-emerald-900/10"
            >
              <div class="mb-3 flex items-center gap-2">
                <div class="rounded-lg bg-green-100 p-1.5 dark:bg-green-800/40">
                  <Leaf class="size-4 text-green-600 dark:text-green-400" />
                </div>
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white">Major Crops</h4>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each sitio.crops as crop}
                  <Badge
                    variant="outline"
                    class="border-green-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-green-700 shadow-sm dark:border-green-600/30 dark:bg-green-900/30 dark:text-green-300"
                  >
                    <Sprout class="mr-1 size-3" />
                    {crop}
                  </Badge>
                {/each}
                {#if sitio.crops.length === 0}
                  <span class="text-sm text-muted-foreground italic">No crops reported</span>
                {/if}
              </div>
            </div>

            <!-- Livestock -->
            <div
              class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50/80 to-orange-50/50 p-4 dark:border-amber-800/30 dark:from-amber-900/15 dark:to-orange-900/10"
            >
              <div class="mb-3 flex items-center gap-2">
                <div class="rounded-lg bg-amber-100 p-1.5 dark:bg-amber-800/40">
                  <Bird class="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white">Livestock</h4>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each sitio.livestock as animal}
                  <Badge
                    variant="outline"
                    class="border-amber-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-700 shadow-sm dark:border-amber-600/30 dark:bg-amber-900/30 dark:text-amber-300"
                  >
                    {animal}
                  </Badge>
                {/each}
                {#if sitio.livestock.length === 0}
                  <span class="text-sm text-muted-foreground italic">No livestock reported</span>
                {/if}
              </div>
            </div>
          </div>

          <!-- Backyard Gardens -->
          <div
            class="rounded-xl border border-teal-100 bg-linear-to-br from-teal-50/80 to-cyan-50/50 p-4 dark:border-teal-800/30 dark:from-teal-900/15 dark:to-cyan-900/10"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="rounded-lg bg-teal-100 p-1.5 dark:bg-teal-800/40">
                  <TreeDeciduous class="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                  Backyard Gardens
                </h4>
              </div>
              {#if hasMultipleYears && backyardGardensTrendData.categories.length > 1}
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-6 text-muted-foreground hover:text-foreground"
                  title="View historical trend"
                  onclick={() => (showBackyardGardensTrendModal = true)}
                >
                  <ChartLine class="size-3" />
                </Button>
              {/if}
            </div>
            {#if hasBackyardGardens}
              <div class="space-y-3">
                <!-- Households with Gardens -->
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-700 dark:text-slate-300">
                    Households with Gardens
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-slate-900 dark:text-white">
                      {sitio.backyardGardens?.householdsWithGardens ?? 0}
                    </span>
                    <Badge
                      variant="outline"
                      class="border-teal-200 bg-teal-50 text-xs text-teal-700 dark:border-teal-600/30 dark:bg-teal-900/30 dark:text-teal-300"
                    >
                      {backyardGardenRate}%
                    </Badge>
                  </div>
                </div>
                <!-- Common Crops -->
                {#if sitio.backyardGardens?.commonCrops && sitio.backyardGardens.commonCrops.length > 0}
                  <div class="mt-2 border-t border-teal-200/50 pt-2 dark:border-teal-700/30">
                    <span class="text-xs text-muted-foreground">Crop Categories</span>
                    <div class="mt-1.5 flex flex-wrap gap-1.5">
                      {#each sitio.backyardGardens.commonCrops as crop}
                        <Badge
                          variant="outline"
                          class="border-teal-200 bg-white/80 px-2 py-0.5 text-xs font-medium text-teal-700 shadow-sm dark:border-teal-600/30 dark:bg-teal-900/30 dark:text-teal-300"
                        >
                          <Sprout class="mr-1 size-3" />
                          {crop}
                        </Badge>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <span class="text-sm text-muted-foreground italic">No backyard gardens reported</span>
            {/if}
          </div>
        </div>
      {/snippet}
    </InfoCard>
  </div>

  <!-- Right Column: Sidebar (1/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-1">
    <!-- Food Security Card -->
    <InfoCard
      title="Food Security"
      description="Household food sufficiency status"
      icon={Utensils}
      iconBgColor="bg-orange-50 dark:bg-orange-900/20"
      iconTextColor="text-orange-500"
    >
      {#snippet children()}
        <div class="flex flex-col gap-3">
          {#each foodSecurityConfig() as status}
            {@const StatusIcon = status.icon}
            <div
              class="relative overflow-hidden rounded-xl border p-4 transition-all {status.isActive
                ? status.bgClass + ' shadow-sm'
                : 'border-slate-200 bg-slate-50/50 opacity-40 dark:border-slate-700 dark:bg-slate-800/30'}"
            >
              {#if status.isActive && status.key === 'secure'}
                <div
                  class="absolute -top-2 -right-2 size-16 rounded-full bg-emerald-200/40 blur-xl dark:bg-emerald-500/10"
                ></div>
              {:else if status.isActive && status.key === 'seasonal_scarcity'}
                <div
                  class="absolute -top-2 -right-2 size-16 rounded-full bg-amber-200/40 blur-xl dark:bg-amber-500/10"
                ></div>
              {:else if status.isActive && status.key === 'critical_shortage'}
                <div
                  class="absolute -top-2 -right-2 size-16 rounded-full bg-red-200/40 blur-xl dark:bg-red-500/10"
                ></div>
              {/if}
              <div class="relative flex items-start gap-3">
                <div
                  class="rounded-lg p-1.5 {status.isActive
                    ? status.key === 'secure'
                      ? 'bg-emerald-100 dark:bg-emerald-800/40'
                      : status.key === 'seasonal_scarcity'
                        ? 'bg-amber-100 dark:bg-amber-800/40'
                        : 'bg-red-100 dark:bg-red-800/40'
                    : 'bg-slate-100 dark:bg-slate-700/50'}"
                >
                  <StatusIcon
                    class="size-4 {status.isActive
                      ? status.key === 'secure'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : status.key === 'seasonal_scarcity'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      : 'text-slate-400 dark:text-slate-500'}"
                  />
                </div>
                <div class="flex-1">
                  <span
                    class="text-sm font-semibold {status.isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-500'}"
                  >
                    {status.label}
                  </span>
                  {#if status.isActive}
                    <p class="mt-0.5 text-xs text-muted-foreground">{status.description}</p>
                  {/if}
                </div>
                {#if status.isActive}
                  <div
                    class="rounded-full p-0.5 {status.key === 'secure'
                      ? 'bg-emerald-100 dark:bg-emerald-800/40'
                      : status.key === 'seasonal_scarcity'
                        ? 'bg-amber-100 dark:bg-amber-800/40'
                        : 'bg-red-100 dark:bg-red-800/40'}"
                  >
                    <CheckCircle2
                      class="size-4 {status.key === 'secure'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : status.key === 'seasonal_scarcity'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'}"
                    />
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>

    <!-- Pets & Vaccination Card -->
    <InfoCard
      title="Household Pets"
      description="Pet population and vaccination coverage"
      icon={Dog}
      iconBgColor="bg-violet-50 dark:bg-violet-900/20"
      iconTextColor="text-violet-500"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && petsTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical pets trend"
            onclick={() => (showPetsTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        {#if hasPets}
          <div class="flex flex-col gap-4">
            <!-- Total Pets Summary -->
            <div
              class="relative overflow-hidden rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-violet-50/80 to-purple-50/50 p-5 dark:border-violet-800/30 dark:from-violet-900/20 dark:via-violet-900/15 dark:to-purple-900/10"
            >
              <div
                class="absolute -top-6 -right-6 size-32 rounded-full bg-violet-200/30 blur-2xl dark:bg-violet-500/10"
              ></div>
              <div class="relative flex items-center justify-between">
                <div>
                  <span
                    class="text-xs font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300"
                  >
                    Total Pets
                  </span>
                  <p class="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                    {totalPets.toLocaleString()}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800/30"
                  >
                    <Dog class="size-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div
                    class="flex size-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-800/30"
                  >
                    <Cat class="size-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Dogs Section -->
            {#if sitio.pets && sitio.pets.dogsCount > 0}
              <div
                class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50/80 to-yellow-50/50 p-4 dark:border-amber-800/30 dark:from-amber-900/15 dark:to-yellow-900/10"
              >
                <div class="mb-3 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="rounded-lg bg-amber-100 p-1.5 dark:bg-amber-800/40">
                      <Dog class="size-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">Dogs</h4>
                      <p class="text-xs text-muted-foreground">
                        {sitio.pets.dogsCount.toLocaleString()} total
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      class="text-2xl font-bold {dogVaccinationRate >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : dogVaccinationRate >= 40
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'}"
                    >
                      {dogVaccinationRate}%
                    </div>
                    <p class="text-xs text-muted-foreground">vaccinated</p>
                  </div>
                </div>
                <div
                  class="relative h-3 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/30"
                >
                  <div
                    class="h-full rounded-full transition-all {dogVaccinationRate >= 70
                      ? 'bg-emerald-500'
                      : dogVaccinationRate >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'}"
                    style="width: {dogVaccinationRate}%"
                  ></div>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">
                    {sitio.pets.vaccinatedDogs.toLocaleString()} vaccinated
                  </span>
                  <span class="text-muted-foreground">
                    {(sitio.pets.dogsCount - sitio.pets.vaccinatedDogs).toLocaleString()} unvaccinated
                  </span>
                </div>
              </div>
            {/if}

            <!-- Cats Section -->
            {#if sitio.pets && sitio.pets.catsCount > 0}
              <div
                class="rounded-xl border border-orange-100 bg-linear-to-br from-orange-50/80 to-red-50/50 p-4 dark:border-orange-800/30 dark:from-orange-900/15 dark:to-red-900/10"
              >
                <div class="mb-3 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="rounded-lg bg-orange-100 p-1.5 dark:bg-orange-800/40">
                      <Cat class="size-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">Cats</h4>
                      <p class="text-xs text-muted-foreground">
                        {sitio.pets.catsCount.toLocaleString()} total
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      class="text-2xl font-bold {catVaccinationRate >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : catVaccinationRate >= 40
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'}"
                    >
                      {catVaccinationRate}%
                    </div>
                    <p class="text-xs text-muted-foreground">vaccinated</p>
                  </div>
                </div>
                <div
                  class="relative h-3 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/30"
                >
                  <div
                    class="h-full rounded-full transition-all {catVaccinationRate >= 70
                      ? 'bg-emerald-500'
                      : catVaccinationRate >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'}"
                    style="width: {catVaccinationRate}%"
                  ></div>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">
                    {sitio.pets.vaccinatedCats.toLocaleString()} vaccinated
                  </span>
                  <span class="text-muted-foreground">
                    {(sitio.pets.catsCount - sitio.pets.vaccinatedCats).toLocaleString()} unvaccinated
                  </span>
                </div>
              </div>
            {/if}

            <!-- Vaccination Status Summary -->
            <div
              class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80"
            >
              <div class="flex items-center gap-2">
                <Syringe class="size-4 text-emerald-600 dark:text-emerald-400" />
                <span class="text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                  Vaccination Summary
                </span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {(
                      (sitio.pets?.vaccinatedDogs ?? 0) + (sitio.pets?.vaccinatedCats ?? 0)
                    ).toLocaleString()}
                  </div>
                  <div class="text-xs text-muted-foreground">Vaccinated</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    {(
                      totalPets -
                      ((sitio.pets?.vaccinatedDogs ?? 0) + (sitio.pets?.vaccinatedCats ?? 0))
                    ).toLocaleString()}
                  </div>
                  <div class="text-xs text-muted-foreground">Unvaccinated</div>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 py-8 text-center dark:border-slate-700/50 dark:bg-slate-800/30"
          >
            <div class="rounded-full bg-slate-100 p-3 dark:bg-slate-700/50">
              <Dog class="size-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p class="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              No Pets Reported
            </p>
            <p class="mt-1 text-xs text-muted-foreground">No household pet data available</p>
          </div>
        {/if}
      {/snippet}
    </InfoCard>

    <!-- Hazards Card -->
    <InfoCard
      title="Natural Hazards"
      description="Incidents in the past 12 months"
      icon={AlertTriangle}
      iconBgColor="bg-red-50 dark:bg-red-900/20"
      iconTextColor="text-red-500"
    >
      {#snippet children()}
        {#if hasHazards}
          <div class="flex flex-col gap-3">
            {#each hazardsList as hazard}
              {@const HazardIcon = hazard.icon}
              {#if hazard.frequency > 0}
                <div
                  class="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50"
                >
                  <div
                    class="rounded-lg p-2 {hazard.name === 'Flood'
                      ? 'bg-blue-100 dark:bg-blue-800/30'
                      : hazard.name === 'Landslide'
                        ? 'bg-amber-100 dark:bg-amber-800/30'
                        : hazard.name === 'Drought'
                          ? 'bg-orange-100 dark:bg-orange-800/30'
                          : 'bg-red-100 dark:bg-red-800/30'}"
                  >
                    <HazardIcon
                      class="size-4 {hazard.name === 'Flood'
                        ? 'text-blue-600 dark:text-blue-400'
                        : hazard.name === 'Landslide'
                          ? 'text-amber-600 dark:text-amber-400'
                          : hazard.name === 'Drought'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-red-600 dark:text-red-400'}"
                    />
                  </div>
                  <div class="flex-1">
                    <span class="text-sm font-medium text-slate-900 dark:text-white">
                      {hazard.name}
                    </span>
                  </div>
                  <div class="text-right">
                    <span class="text-lg font-bold text-slate-900 dark:text-white">
                      {hazard.frequency}
                    </span>
                    <span class="ml-1 text-xs text-muted-foreground">
                      {hazard.frequency === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                </div>
              {/if}
            {/each}

            <!-- Total Summary -->
            <div
              class="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground uppercase"
                  >Total Incidents</span
                >
                <span class="text-lg font-bold text-slate-900 dark:text-white">
                  {totalHazardFrequency}
                </span>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/50 py-8 text-center dark:border-emerald-800/30 dark:bg-emerald-900/10"
          >
            <div class="rounded-full bg-emerald-100 p-3 dark:bg-emerald-800/40">
              <CheckCircle2 class="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p class="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              No Hazard Incidents
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Past 12 months</p>
          </div>
        {/if}
      {/snippet}
    </InfoCard>

    <!-- Peace & Order Card removed -->
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
        Year-over-year income trends for {sitio.sitioName} across {incomeTrendData.categories
          .length} years
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

<!-- Income Cluster Trend Modal -->
<Dialog.Root bind:open={showPovertyTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
          <Banknote class="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        Income Trend - Historical
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year average daily income for {sitio.sitioName} across {incomeClusterTrendData
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={incomeClusterTrendData.series}
        categories={incomeClusterTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `₱${val.toLocaleString()}`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Worker Classification Trend Modal -->
<Dialog.Root bind:open={showWorkerClassTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-slate-50 p-2 dark:bg-slate-900/20">
          <HandCoins class="size-5 text-slate-600 dark:text-slate-400" />
        </div>
        Worker Classification - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year distribution of workers by employment type for {sitio.sitioName} across {workerClassTrendData
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={workerClassTrendData.series}
        categories={workerClassTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Farmers Trend Modal -->
<Dialog.Root bind:open={showFarmersTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
          <Tractor class="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        Farmers - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year number of farmers for {sitio.sitioName} across {farmersTrendData.categories
          .length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={farmersTrendData.series}
        categories={farmersTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Organizations Trend Modal -->
<Dialog.Root bind:open={showOrgsTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
          <Users class="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        Farmer Organizations - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year number of farmer associations for {sitio.sitioName} across {orgsTrendData
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={orgsTrendData.series}
        categories={orgsTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Farm Area Trend Modal -->
<Dialog.Root bind:open={showFarmAreaTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
          <Sprout class="size-5 text-green-600 dark:text-green-400" />
        </div>
        Farm Area - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year total farm area in hectares for {sitio.sitioName} across {farmAreaTrendData
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={farmAreaTrendData.series}
        categories={farmAreaTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toLocaleString()} ha`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Backyard Gardens Trend Modal -->
<Dialog.Root bind:open={showBackyardGardensTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-teal-50 p-2 dark:bg-teal-900/20">
          <TreeDeciduous class="size-5 text-teal-600 dark:text-teal-400" />
        </div>
        Backyard Gardens - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year households with backyard gardens for {sitio.sitioName} across {backyardGardensTrendData
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={backyardGardensTrendData.series}
        categories={backyardGardensTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Pets Trend Modal -->
<Dialog.Root bind:open={showPetsTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-violet-50 p-2 dark:bg-violet-900/20">
          <Dog class="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        Household Pets - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year pet population and vaccination rates for {sitio.sitioName} across {petsTrendData
          .categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={petsTrendData.series}
        categories={petsTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => val.toLocaleString()}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
