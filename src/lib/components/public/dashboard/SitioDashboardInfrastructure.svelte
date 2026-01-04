<script lang="ts">
  import DonutChart from '$lib/components/charts/DonutChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import { NATIONAL_AVERAGES } from '$lib/config/national-averages';
  import type { SitioRecord } from '$lib/types';
  import {
    aggregateAccessModes,
    aggregateFacilities,
    aggregateInfrastructure,
    aggregateUtilities,
    getAllAvailableYears,
    getYearComparison,
    prepareTimeSeriesData,
    type AccessModesAggregation,
    type FacilitiesAggregation,
    type InfrastructureAggregation,
    type UtilitiesAggregation,
    type YearComparison
  } from '$lib/utils/sitio-chart-aggregation';
  import {
    Building2,
    Car,
    ChartLine,
    Check,
    Droplets,
    Footprints,
    GraduationCap,
    Milestone,
    Router,
    Ship,
    TrendingDown,
    TrendingUp,
    Zap
  } from '@lucide/svelte';

  // Modal states for trend modals
  let showUtilityTrendModal = $state(false);
  let showRoadTrendModal = $state(false);
  let showWaterTrendModal = $state(false);
  let showSanitationTrendModal = $state(false);
  let showSignalTrendModal = $state(false);
  let showClassroomTrendModal = $state(false);

  interface Props {
    sitios: SitioRecord[];
    selectedYear?: number;
  }

  let { sitios, selectedYear }: Props = $props();

  // Total sitios for percentage calculations
  const totalSitios = $derived(sitios.length);

  // Get available years for comparison
  const availableYears = $derived(getAllAvailableYears(sitios));
  const currentYear = $derived(selectedYear || availableYears[0] || new Date().getFullYear());
  const hasMultipleYears = $derived(availableYears.length > 1);

  // Year-over-year comparison data
  const yearComparison = $derived<YearComparison>(getYearComparison(sitios, currentYear));

  // Time series data for utilities trends
  const utilityTrendData = $derived(
    prepareTimeSeriesData(sitios, ['electricityPercent', 'toiletPercent', 'internetPercent'])
  );

  // Time series data for road infrastructure trends
  const roadTrendData = $derived(
    prepareTimeSeriesData(sitios, ['roadConcrete', 'roadAsphalt', 'roadGravel', 'roadNatural'])
  );

  // Time series data for water sources trends
  const waterTrendData = $derived.by(() => {
    const years = getAllAvailableYears(sitios);
    const categories = years.map((y) => y.toString());

    const series = [
      { name: 'Natural Source (Functional)', data: [] as number[], color: 'hsl(142, 71%, 45%)' },
      { name: 'Level 1 (Functional)', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: 'Level 2 (Functional)', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      { name: 'Level 3 (Functional)', data: [] as number[], color: 'hsl(263, 70%, 50%)' }
    ];

    years.forEach((year) => {
      const infra = aggregateInfrastructure(sitios, year);
      series[0].data.push(infra.waterNatural.functioning);
      series[1].data.push(infra.waterLevel1.functioning);
      series[2].data.push(infra.waterLevel2.functioning);
      series[3].data.push(infra.waterLevel3.functioning);
    });

    return { categories, series };
  });

  // Time series data for sanitation types trends
  const sanitationTrendData = $derived.by(() => {
    const years = getAllAvailableYears(sitios);
    const categories = years.map((y) => y.toString());

    const series = [
      { name: 'Water Sealed', data: [] as number[], color: 'hsl(142, 71%, 45%)' },
      { name: 'Pit Latrine', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      { name: 'Community CR', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: 'Open Defecation', data: [] as number[], color: 'hsl(0, 84%, 60%)' }
    ];

    years.forEach((year) => {
      const infra = aggregateInfrastructure(sitios, year);
      series[0].data.push(infra.sanitationWaterSealed);
      series[1].data.push(infra.sanitationPitLatrine);
      series[2].data.push(infra.sanitationCommunityCR);
      series[3].data.push(infra.sanitationOpenDefecation);
    });

    return { categories, series };
  });

  // Time series data for mobile signal trends
  const signalTrendData = $derived.by(() => {
    const years = getAllAvailableYears(sitios);
    const categories = years.map((y) => y.toString());

    const series = [
      { name: '5G', data: [] as number[], color: 'hsl(142, 71%, 45%)' },
      { name: '4G', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: '3G', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      { name: '2G', data: [] as number[], color: 'hsl(27, 87%, 67%)' },
      { name: 'None', data: [] as number[], color: 'hsl(0, 84%, 60%)' }
    ];

    years.forEach((year) => {
      const util = aggregateUtilities(sitios, year);
      series[0].data.push(util.signal5G);
      series[1].data.push(util.signal4G);
      series[2].data.push(util.signal3G);
      series[3].data.push(util.signal2G);
      series[4].data.push(util.signalNone);
    });

    return { categories, series };
  });

  // Time series data for classroom density trends
  const classroomTrendData = $derived.by(() => {
    const years = getAllAvailableYears(sitios);
    const categories = years.map((y) => y.toString());

    const series = [
      { name: '<46 (Blue)', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: '46-50 (Yellow)', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      { name: '51-55 (Gold)', data: [] as number[], color: 'hsl(25, 95%, 53%)' },
      { name: '>56 (Red)', data: [] as number[], color: 'hsl(0, 84%, 60%)' },
      { name: 'No Classroom', data: [] as number[], color: 'hsl(0, 0%, 30%)' }
    ];

    years.forEach((year) => {
      const infra = aggregateInfrastructure(sitios, year);
      series[0].data.push(infra.studentsPerRoomLessThan46);
      series[1].data.push(infra.studentsPerRoom46_50);
      series[2].data.push(infra.studentsPerRoom51_55);
      series[3].data.push(infra.studentsPerRoomMoreThan56);
      series[4].data.push(infra.studentsPerRoomNoClassroom);
    });

    return { categories, series };
  });

  // Aggregated data (using selected year)
  const infrastructure = $derived<InfrastructureAggregation>(
    aggregateInfrastructure(sitios, currentYear)
  );
  const facilities = $derived<FacilitiesAggregation>(aggregateFacilities(sitios, currentYear));
  const utilities = $derived<UtilitiesAggregation>(aggregateUtilities(sitios, currentYear));
  const accessModes = $derived<AccessModesAggregation>(aggregateAccessModes(sitios, currentYear));

  // Electricity sources data
  const electricitySources = $derived([
    {
      label: 'Grid',
      count: utilities.electricityGrid,
      percent:
        utilities.totalHouseholds > 0
          ? Math.round((utilities.electricityGrid / utilities.totalHouseholds) * 100)
          : 0,
      color: 'bg-indigo-500'
    },
    {
      label: 'Solar',
      count: utilities.electricitySolar,
      percent:
        utilities.totalHouseholds > 0
          ? Math.round((utilities.electricitySolar / utilities.totalHouseholds) * 100)
          : 0,
      color: 'bg-yellow-500'
    },
    {
      label: 'Battery',
      count: utilities.electricityBattery,
      percent:
        utilities.totalHouseholds > 0
          ? Math.round((utilities.electricityBattery / utilities.totalHouseholds) * 100)
          : 0,
      color: 'bg-emerald-500'
    },
    {
      label: 'Generator',
      count: utilities.electricityGenerator,
      percent:
        utilities.totalHouseholds > 0
          ? Math.round((utilities.electricityGenerator / utilities.totalHouseholds) * 100)
          : 0,
      color: 'bg-orange-500'
    }
  ]);

  // Road types data
  const roadTypes = $derived([
    {
      type: 'Concrete',
      color: 'bg-blue-500',
      sitioCount: infrastructure.roadConcrete.exists,
      length: infrastructure.roadConcrete.totalLength,
      data: infrastructure.roadConcrete
    },
    {
      type: 'Asphalt',
      color: 'bg-slate-400 dark:bg-slate-500',
      sitioCount: infrastructure.roadAsphalt.exists,
      length: infrastructure.roadAsphalt.totalLength,
      data: infrastructure.roadAsphalt
    },
    {
      type: 'Gravel',
      color: 'bg-orange-400',
      sitioCount: infrastructure.roadGravel.exists,
      length: infrastructure.roadGravel.totalLength,
      data: infrastructure.roadGravel
    },
    {
      type: 'Natural',
      color: 'bg-stone-500',
      sitioCount: infrastructure.roadNatural.exists,
      length: infrastructure.roadNatural.totalLength,
      data: infrastructure.roadNatural
    }
  ]);

  // Total road length
  const totalRoadLength = $derived(
    infrastructure.roadAsphalt.totalLength +
      infrastructure.roadConcrete.totalLength +
      infrastructure.roadGravel.totalLength +
      infrastructure.roadNatural.totalLength
  );

  // Water sources data
  const waterSources = $derived([
    {
      type: 'Natural Source',
      sitioCount: infrastructure.waterNatural.exists,
      functional: infrastructure.waterNatural.functioning,
      defective: infrastructure.waterNatural.notFunctioning
    },
    {
      type: 'Level 1 (Point Source)',
      sitioCount: infrastructure.waterLevel1.exists,
      functional: infrastructure.waterLevel1.functioning,
      defective: infrastructure.waterLevel1.notFunctioning
    },
    {
      type: 'Level 2 (Communal)',
      sitioCount: infrastructure.waterLevel2.exists,
      functional: infrastructure.waterLevel2.functioning,
      defective: infrastructure.waterLevel2.notFunctioning
    },
    {
      type: 'Level 3 (Individual)',
      sitioCount: infrastructure.waterLevel3.exists,
      functional: infrastructure.waterLevel3.functioning,
      defective: infrastructure.waterLevel3.notFunctioning
    }
  ]);

  // Total water sources count
  const totalWaterSources = $derived(
    infrastructure.waterNatural.exists +
      infrastructure.waterLevel1.exists +
      infrastructure.waterLevel2.exists +
      infrastructure.waterLevel3.exists
  );

  // Access modes
  const accessModesDisplay = $derived([
    {
      icon: Car,
      label: 'Paved Road',
      count: accessModes.pavedRoad,
      description: 'Standard road access'
    },
    {
      icon: Milestone,
      label: 'Unpaved Road',
      count: accessModes.unpavedRoad,
      description: 'Dirt/Rough roads'
    },
    {
      icon: Footprints,
      label: 'Footpath',
      count: accessModes.footpath,
      description: 'Walking trails only'
    },
    {
      icon: Ship,
      label: 'Boat',
      count: accessModes.boat,
      description: 'Waterway access'
    }
  ]);

  // Mobile signal data
  const mobileSignalData = $derived([
    { label: '5G', count: utilities.signal5G, color: 'bg-emerald-500' },
    { label: '4G', count: utilities.signal4G, color: 'bg-blue-500' },
    { label: '3G', count: utilities.signal3G, color: 'bg-yellow-500' },
    { label: '2G', count: utilities.signal2G, color: 'bg-orange-500' },
    { label: 'None', count: utilities.signalNone, color: 'bg-red-500' }
  ]);

  // Best signal level
  const bestSignalLevel = $derived(() => {
    if (utilities.signal5G > 0) return { level: '5G', bars: 4 };
    if (utilities.signal4G > 0) return { level: '4G', bars: 3 };
    if (utilities.signal3G > 0) return { level: '3G', bars: 2 };
    if (utilities.signal2G > 0) return { level: '2G', bars: 1 };
    return { level: 'None', bars: 0 };
  });

  // Facilities list
  const facilitiesList = $derived([
    {
      name: 'Health Center',
      data: facilities.healthCenter
    },
    {
      name: 'Pharmacy',
      data: facilities.pharmacy
    },
    {
      name: 'Community Toilet',
      data: facilities.communityToilet
    },
    {
      name: 'Kindergarten',
      data: facilities.kindergarten
    },
    {
      name: 'Elem. School',
      data: facilities.elementarySchool
    },
    {
      name: 'High School',
      data: facilities.highSchool
    },
    {
      name: 'Madrasah',
      data: facilities.madrasah
    },
    {
      name: 'Market',
      data: facilities.market
    }
  ]);

  // Sanitation types donut
  const sanitationData = $derived([
    {
      label: 'Water Sealed',
      value: infrastructure.sanitationWaterSealed,
      color: 'hsl(142, 71%, 45%)'
    },
    {
      label: 'Pit Latrine',
      value: infrastructure.sanitationPitLatrine,
      color: 'hsl(45, 93%, 47%)'
    },
    {
      label: 'Community CR',
      value: infrastructure.sanitationCommunityCR,
      color: 'hsl(217, 91%, 60%)'
    },
    {
      label: 'Open Defecation',
      value: infrastructure.sanitationOpenDefecation,
      color: 'hsl(0, 84%, 60%)'
    }
  ]);

  // Zero Open Defecation (ZOD) Analytics
  const zodAnalytics = $derived(() => {
    const sitiosWithOD = infrastructure.sanitationOpenDefecation;
    const percentage = totalSitios > 0 ? Math.round((sitiosWithOD / totalSitios) * 100) : 0;
    return {
      sitiosWithOD,
      percentage,
      hasWarning: sitiosWithOD > 0,
      message:
        sitiosWithOD > 0
          ? `${sitiosWithOD} sitio${sitiosWithOD > 1 ? 's' : ''} (${percentage}%) report open defecation - ZOD intervention required`
          : 'All sitios report proper sanitation facilities - ZOD compliant'
    };
  });

  // Analytics: Compare against national averages
  const electricityAnalytics = $derived(() => {
    const diff = utilities.electricityPercent - NATIONAL_AVERAGES.electricity.percent;
    return {
      diff: Math.abs(diff).toFixed(1),
      isAbove: diff >= 0,
      status: diff >= 0 ? 'above' : 'below'
    };
  });

  const toiletAnalytics = $derived(() => {
    const diff = utilities.toiletPercent - NATIONAL_AVERAGES.sanitaryToilet.percent;
    return {
      diff: Math.abs(diff).toFixed(1),
      isAbove: diff >= 0,
      status: diff >= 0 ? 'above' : 'below'
    };
  });

  const internetAnalytics = $derived(() => {
    const diff = utilities.internetPercent - NATIONAL_AVERAGES.internet.percent;
    return {
      diff: Math.abs(diff).toFixed(1),
      isAbove: diff >= 0,
      status: diff >= 0 ? 'above' : 'below'
    };
  });

  // Road Network Analytics: Aggregate paved vs unpaved percentages across all sitios
  const roadNetworkAnalytics = $derived(() => {
    const pavedLength =
      infrastructure.roadConcrete.totalLength + infrastructure.roadAsphalt.totalLength;
    const unpavedLength =
      infrastructure.roadGravel.totalLength + infrastructure.roadNatural.totalLength;
    const totalLength = pavedLength + unpavedLength;

    if (totalLength === 0) {
      return {
        hasData: false,
        pavedPercent: 0,
        unpavedPercent: 0,
        pavedDiff: 0,
        unpavedDiff: 0,
        pavedIsAbove: false,
        unpavedIsAbove: false
      };
    }

    const pavedPercent = (pavedLength / totalLength) * 100;
    const unpavedPercent = (unpavedLength / totalLength) * 100;
    const pavedDiff = pavedPercent - NATIONAL_AVERAGES.pavedRoads.percent;
    const unpavedDiff = unpavedPercent - NATIONAL_AVERAGES.unpavedRoads.percent;

    return {
      hasData: true,
      pavedPercent: pavedPercent,
      unpavedPercent: unpavedPercent,
      pavedDiff: Math.abs(pavedDiff).toFixed(1),
      unpavedDiff: Math.abs(unpavedDiff).toFixed(1),
      pavedIsAbove: pavedDiff >= 0,
      unpavedIsAbove: unpavedDiff >= 0,
      totalLength: totalLength.toFixed(2),
      pavedLength: pavedLength.toFixed(2),
      unpavedLength: unpavedLength.toFixed(2)
    };
  });

  // Students per room distribution
  const studentsPerRoomData = $derived([
    {
      label: '<46 (Blue)',
      value: infrastructure.studentsPerRoomLessThan46,
      color: 'hsl(217, 91%, 60%)',
      remark: 'Meet RA 7880 with one shift'
    },
    {
      label: '46-50 (Yellow)',
      value: infrastructure.studentsPerRoom46_50,
      color: 'hsl(45, 93%, 47%)',
      remark: 'Fails to meet RA 7880 with one shift'
    },
    {
      label: '51-55 (Gold)',
      value: infrastructure.studentsPerRoom51_55,
      color: 'hsl(25, 95%, 53%)',
      remark: 'Does not meet RA 7880 even with double shifting'
    },
    {
      label: '>56 (Red)',
      value: infrastructure.studentsPerRoomMoreThan56,
      color: 'hsl(0, 84%, 60%)',
      remark: 'Severe shortage of classrooms'
    },
    {
      label: 'No Classroom (Black)',
      value: infrastructure.studentsPerRoomNoClassroom,
      color: 'hsl(0, 0%, 30%)',
      remark: 'No existing instructional rooms'
    }
  ]);

  // Classroom Density Analytics (Pupil:Room Ratio)
  const classroomDensityAnalytics = $derived(() => {
    const compliantSitios = infrastructure.studentsPerRoomLessThan46;
    const warningSitios = infrastructure.studentsPerRoom46_50;
    const criticalSitios = infrastructure.studentsPerRoom51_55;
    const severeSitios = infrastructure.studentsPerRoomMoreThan56;
    const noClassroomSitios = infrastructure.studentsPerRoomNoClassroom;

    const totalWithData = totalSitios;
    const sitiosNeedingIntervention =
      warningSitios + criticalSitios + severeSitios + noClassroomSitios;
    const compliancePercent =
      totalWithData > 0 ? Math.round((compliantSitios / totalWithData) * 100) : 0;
    const interventionPercent =
      totalWithData > 0 ? Math.round((sitiosNeedingIntervention / totalWithData) * 100) : 0;

    return {
      compliantSitios,
      warningSitios,
      criticalSitios,
      severeSitios,
      noClassroomSitios,
      sitiosNeedingIntervention,
      compliancePercent,
      interventionPercent,
      hasCompliance: compliantSitios > 0,
      hasWarnings: sitiosNeedingIntervention > 0,
      message:
        compliantSitios === totalWithData
          ? 'All sitios meet RA 7880 classroom standards'
          : `${sitiosNeedingIntervention} sitio${sitiosNeedingIntervention > 1 ? 's' : ''} (${interventionPercent}%) require intervention for classroom shortage`
    };
  });
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <!-- Left Column: Main Content (2/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-2">
    <!-- Access to Utilities Card -->
    <InfoCard
      title="Access to Utilities"
      description="Aggregate coverage across {totalSitios} sitios"
      icon={Zap}
      iconBgColor="bg-yellow-50 dark:bg-yellow-900/20"
      iconTextColor="text-yellow-500"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && utilityTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical trend"
            onclick={() => (showUtilityTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <!-- Analytics Summary -->
        <div
          class="mb-6 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
        >
          <div class="mb-3 flex items-center gap-2">
            <p class="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Comparison vs. Philippine National Average
            </p>
            <HelpTooltip>
              {#snippet children()}
                <div class="space-y-2 text-xs">
                  <p class="font-semibold">National Average Sources:</p>
                  <ul class="list-inside list-disc space-y-1">
                    <li>
                      <strong>Electricity ({NATIONAL_AVERAGES.electricity.percent}%):</strong>
                      {NATIONAL_AVERAGES.electricity.source}
                    </li>
                    <li>
                      <strong
                        >Sanitary Toilets ({NATIONAL_AVERAGES.sanitaryToilet.percent}%):</strong
                      >
                      {NATIONAL_AVERAGES.sanitaryToilet.source}
                    </li>
                    <li>
                      <strong>Internet ({NATIONAL_AVERAGES.internet.percent}%):</strong>
                      {NATIONAL_AVERAGES.internet.source}
                    </li>
                  </ul>
                </div>
              {/snippet}
            </HelpTooltip>
          </div>
          <div class="flex flex-wrap gap-2">
            <!-- Electricity Badge -->
            <Badge
              variant="outline"
              class="gap-1.5 {electricityAnalytics().isAbove
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'}"
            >
              {#if electricityAnalytics().isAbove}
                <TrendingUp class="size-3.5" />
              {:else}
                <TrendingDown class="size-3.5" />
              {/if}
              <Zap class="size-3" />
              Electricity {electricityAnalytics().diff}% {electricityAnalytics().status} avg
            </Badge>
            <!-- Sanitary Toilet Badge -->
            <Badge
              variant="outline"
              class="gap-1.5 {toiletAnalytics().isAbove
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'}"
            >
              {#if toiletAnalytics().isAbove}
                <TrendingUp class="size-3.5" />
              {:else}
                <TrendingDown class="size-3.5" />
              {/if}
              <Droplets class="size-3" />
              Sanitation {toiletAnalytics().diff}% {toiletAnalytics().status} avg
            </Badge>
            <!-- Internet Badge -->
            <Badge
              variant="outline"
              class="gap-1.5 {internetAnalytics().isAbove
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'}"
            >
              {#if internetAnalytics().isAbove}
                <TrendingUp class="size-3.5" />
              {:else}
                <TrendingDown class="size-3.5" />
              {/if}
              <Router class="size-3" />
              Internet {internetAnalytics().diff}% {internetAnalytics().status} avg
            </Badge>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- Electricity Section -->
          <div class="flex flex-col gap-4">
            <div title="Percentage of households with access to electricity">
              <div class="flex justify-between">
                <span class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Electricity Access
                </span>
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {utilities.electricityPercent.toFixed(1)}%
                </span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2.5 rounded-full bg-yellow-400 transition-all duration-500"
                  style="width: {Math.min(utilities.electricityPercent, 100)}%"
                ></div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  {utilities.householdsWithElectricity.toLocaleString()} of {utilities.totalHouseholds.toLocaleString()}
                  households
                </p>
                <span class="text-[10px] text-muted-foreground">
                  PH Avg: {NATIONAL_AVERAGES.electricity.percent}%
                </span>
              </div>
              <div
                class="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p
                  class="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                >
                  Source Breakdown (per Household)
                </p>
                <div class="space-y-2">
                  {#each electricitySources as source}
                    <div class="flex items-center gap-2 text-xs">
                      <span class="w-16 text-slate-500 dark:text-slate-400">{source.label}</span>
                      <div class="mx-2 h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          class="h-1.5 rounded-full {source.color} transition-all duration-500"
                          style="width: {source.percent}%"
                        ></div>
                      </div>
                      <div class="flex min-w-20 items-baseline justify-end gap-1">
                        <span class="text-[10px] text-muted-foreground"
                          >({source.count.toLocaleString()})</span
                        >
                        <span class="font-medium text-slate-900 dark:text-white"
                          >{source.percent}%</span
                        >
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>

          <!-- Other Utilities -->
          <div class="flex flex-col gap-4">
            <!-- Sanitary Toilets -->
            <div title="Percentage of households with sanitary toilet facilities">
              <div class="mb-2 flex justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sanitary Toilets
                </span>
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {utilities.toiletPercent.toFixed(1)}%
                </span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2.5 rounded-full bg-green-500 transition-all duration-500"
                  style="width: {Math.min(utilities.toiletPercent, 100)}%"
                ></div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  {utilities.householdsWithToilet.toLocaleString()} of {utilities.totalHouseholds.toLocaleString()}
                  households
                </p>
                <span class="text-[10px] text-muted-foreground">
                  PH Avg: {NATIONAL_AVERAGES.sanitaryToilet.percent}%
                </span>
              </div>
            </div>

            <!-- Internet Connectivity -->
            <div title="Percentage of households with internet connection">
              <div class="mb-2 flex justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Internet Connectivity
                </span>
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {utilities.internetPercent.toFixed(1)}%
                </span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2.5 rounded-full bg-blue-400 transition-all duration-500"
                  style="width: {Math.min(utilities.internetPercent, 100)}%"
                ></div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  {utilities.householdsWithInternet.toLocaleString()} of {utilities.totalHouseholds.toLocaleString()}
                  households
                </p>
                <span class="text-[10px] text-muted-foreground">
                  PH Avg: {NATIONAL_AVERAGES.internet.percent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Internal Infrastructure (Roads) Card -->
    <InfoCard
      title="Road Infrastructure"
      description="Road network conditions across all sitios"
      icon={Car}
      iconBgColor="bg-slate-50 dark:bg-slate-900/20"
      iconTextColor="text-slate-400"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && roadTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical trend"
            onclick={() => (showRoadTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <!-- Road Network Analytics: Paved vs Unpaved Comparison -->
        {#if roadNetworkAnalytics().hasData}
          <div
            class="mb-6 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20"
          >
            <div class="mb-3 flex items-start gap-2">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                Aggregate Road Network Summary
              </h4>
              <HelpTooltip>
                <div class="space-y-1 text-xs">
                  <p>
                    <strong>Paved Roads ({NATIONAL_AVERAGES.pavedRoads.percent}%):</strong> Concrete +
                    Asphalt
                  </p>
                  <p>
                    <strong>Unpaved Roads ({NATIONAL_AVERAGES.unpavedRoads.percent}%):</strong> Gravel
                    + Natural
                  </p>
                  <p class="border-t border-slate-200 pt-1 dark:border-slate-700">
                    <em>Source: {NATIONAL_AVERAGES.pavedRoads.source}</em>
                  </p>
                </div>
              </HelpTooltip>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Paved Roads Analytics -->
              <div class="flex flex-col gap-2">
                <div class="flex items-baseline justify-between">
                  <span class="text-xs text-muted-foreground">Paved Roads (Concrete + Asphalt)</span
                  >
                  <span class="text-lg font-bold text-slate-900 dark:text-white">
                    {roadNetworkAnalytics().pavedPercent.toFixed(1)}%
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground"
                    >PH Avg: {NATIONAL_AVERAGES.pavedRoads.percent}%</span
                  >
                  <Badge
                    variant="outline"
                    class={roadNetworkAnalytics().pavedIsAbove
                      ? 'border-green-100 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400'
                      : 'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400'}
                  >
                    {#if roadNetworkAnalytics().pavedIsAbove}
                      <TrendingUp class="mr-1 size-3" />
                    {:else}
                      <TrendingDown class="mr-1 size-3" />
                    {/if}
                    {roadNetworkAnalytics().pavedDiff}%
                    {roadNetworkAnalytics().pavedIsAbove ? 'above' : 'below'}
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground">
                  Total: <span class="font-semibold text-slate-700 dark:text-slate-300"
                    >{roadNetworkAnalytics().pavedLength} km</span
                  >
                </p>
              </div>
              <!-- Unpaved Roads Analytics -->
              <div class="flex flex-col gap-2">
                <div class="flex items-baseline justify-between">
                  <span class="text-xs text-muted-foreground">Unpaved Roads (Gravel + Natural)</span
                  >
                  <span class="text-lg font-bold text-slate-900 dark:text-white">
                    {roadNetworkAnalytics().unpavedPercent.toFixed(1)}%
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground"
                    >PH Avg: {NATIONAL_AVERAGES.unpavedRoads.percent}%</span
                  >
                  <Badge
                    variant="outline"
                    class={roadNetworkAnalytics().unpavedIsAbove
                      ? 'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400'
                      : 'border-green-100 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400'}
                  >
                    {#if roadNetworkAnalytics().unpavedIsAbove}
                      <TrendingUp class="mr-1 size-3" />
                    {:else}
                      <TrendingDown class="mr-1 size-3" />
                    {/if}
                    {roadNetworkAnalytics().unpavedDiff}%
                    {roadNetworkAnalytics().unpavedIsAbove ? 'above' : 'below'}
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground">
                  Total: <span class="font-semibold text-slate-700 dark:text-slate-300"
                    >{roadNetworkAnalytics().unpavedLength} km</span
                  >
                </p>
              </div>
            </div>
            <div class="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
              <p class="text-xs text-muted-foreground">
                Total road network across all sitios: <span
                  class="font-semibold text-slate-700 dark:text-slate-300"
                  >{roadNetworkAnalytics().totalLength} km</span
                >
              </p>
            </div>
          </div>
        {:else}
          <div
            class="mb-6 rounded-lg border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"
          >
            <p class="text-sm text-amber-700 dark:text-amber-400">
              No road data available across sitios for analytics comparison.
            </p>
          </div>
        {/if}

        <div class="flex flex-col gap-4">
          <div
            class="grid grid-cols-12 gap-2 border-b border-slate-100 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase dark:border-slate-800"
          >
            <div class="col-span-3">Type</div>
            <div class="col-span-3 text-right">Sitios</div>
            <div class="col-span-3 text-right">Total Length</div>
            <div class="col-span-3 text-right">Condition</div>
          </div>
          {#each roadTypes as road}
            <div
              class="grid grid-cols-12 items-center gap-2"
              class:opacity-60={road.sitioCount === 0}
            >
              <div class="col-span-3 flex items-center gap-2">
                <div class="h-8 w-1.5 rounded-full {road.color}"></div>
                <span class="text-sm font-bold text-slate-900 dark:text-white">{road.type}</span>
              </div>
              <div class="col-span-3 flex justify-end">
                {#if road.sitioCount > 0}
                  <Badge
                    variant="outline"
                    class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                  >
                    <Check class="mr-1 size-3.5" />
                    {road.sitioCount}
                  </Badge>
                {:else}
                  <Badge
                    variant="outline"
                    class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    0
                  </Badge>
                {/if}
              </div>
              <div class="col-span-3 text-right">
                {#if road.sitioCount > 0}
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-300"
                    >{road.length.toFixed(1)}</span
                  >
                  <span class="text-[10px] text-muted-foreground">km</span>
                {:else}
                  <span class="text-sm text-slate-400">—</span>
                {/if}
              </div>
              <div class="col-span-3 flex flex-col items-end gap-0.5">
                {#if road.sitioCount > 0}
                  <div class="flex gap-1">
                    {#if road.data.excellent > 0}
                      <Badge
                        variant="outline"
                        class="border-emerald-100 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                        >{road.data.excellent} exc</Badge
                      >
                    {/if}
                    {#if road.data.good > 0}
                      <Badge
                        variant="outline"
                        class="border-green-100 bg-green-50 px-1.5 py-0 text-[10px] text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                        >{road.data.good} good</Badge
                      >
                    {/if}
                  </div>
                  <div class="flex gap-1">
                    {#if road.data.fair > 0}
                      <Badge
                        variant="outline"
                        class="border-yellow-100 bg-yellow-50 px-1.5 py-0 text-[10px] text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400"
                        >{road.data.fair} fair</Badge
                      >
                    {/if}
                    {#if road.data.poor > 0 || road.data.bad > 0}
                      <Badge
                        variant="outline"
                        class="border-red-100 bg-red-50 px-1.5 py-0 text-[10px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                        >{road.data.poor + road.data.bad} poor</Badge
                      >
                    {/if}
                  </div>
                {:else}
                  <span class="text-sm text-slate-400">—</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
          <div class="mb-3 flex items-end justify-between">
            <div>
              <p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Total Road Network
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {totalRoadLength.toFixed(1)}
                <span class="text-sm font-medium text-muted-foreground">km</span>
              </p>
            </div>
          </div>
          <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            {#each roadTypes.filter((r) => r.sitioCount > 0 && r.length > 0) as road, index}
              {@const percentage = totalRoadLength > 0 ? (road.length / totalRoadLength) * 100 : 0}
              <div
                class="h-full {road.color} {index <
                roadTypes.filter((r) => r.sitioCount > 0 && r.length > 0).length - 1
                  ? 'border-r border-white dark:border-slate-800'
                  : ''}"
                style="width: {percentage}%"
              ></div>
            {/each}
          </div>
          <div class="mt-3 flex flex-wrap gap-4">
            {#each roadTypes.filter((r) => r.sitioCount > 0 && r.length > 0) as road}
              {@const percentage =
                totalRoadLength > 0 ? Math.round((road.length / totalRoadLength) * 100) : 0}
              <div class="flex items-center gap-1.5">
                <div class="h-2 w-2 rounded-full {road.color}"></div>
                <span class="text-xs text-muted-foreground">{road.type} ({percentage}%)</span>
              </div>
            {/each}
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Water Sources Card -->
    <InfoCard
      title="Water Sources"
      description="Availability and status across {totalWaterSources} sources in {totalSitios} sitios"
      icon={Droplets}
      iconBgColor="bg-blue-50 dark:bg-blue-900/20"
      iconTextColor="text-blue-500"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && waterTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical trend"
            onclick={() => (showWaterTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <div class="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr
                class="border-b border-slate-100 text-[10px] font-bold tracking-wider text-muted-foreground uppercase dark:border-slate-800"
              >
                <th class="pb-3 pl-2">Source Type</th>
                <th class="pb-3 text-center">Sitios</th>
                <th class="pb-3 text-center">Functional</th>
                <th class="pb-3 text-center">Defective</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              {#each waterSources as source, index}
                <tr
                  class={index < waterSources.length - 1
                    ? 'border-b border-slate-50 dark:border-slate-800/50'
                    : ''}
                >
                  <td class="py-3 pl-2 font-medium text-slate-900 dark:text-white">
                    {source.type}
                  </td>
                  <td class="py-3 text-center">
                    {#if source.sitioCount > 0}
                      <Badge
                        variant="outline"
                        class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                      >
                        {source.sitioCount}
                      </Badge>
                    {:else}
                      <Badge
                        variant="outline"
                        class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
                      >
                        0
                      </Badge>
                    {/if}
                  </td>
                  <td class="py-3 text-center text-green-600 dark:text-green-400">
                    {source.sitioCount > 0 ? source.functional : '—'}
                  </td>
                  <td
                    class="py-3 text-center {source.defective > 0
                      ? 'font-medium text-red-500'
                      : 'text-slate-400'}"
                  >
                    {source.sitioCount > 0 ? source.defective : '—'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Sanitation & Education Row -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- Sanitation Types -->
      <InfoCard
        title="Sanitation Types"
        description="Distribution across sitios"
        icon={Droplets}
        iconBgColor="bg-teal-50 dark:bg-teal-900/20"
        iconTextColor="text-teal-500"
        class="col-span-2"
      >
        {#snippet headerAction()}
          {#if hasMultipleYears && sanitationTrendData.categories.length > 1}
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-foreground"
              title="View historical trend"
              onclick={() => (showSanitationTrendModal = true)}
            >
              <ChartLine class="size-4" />
            </Button>
          {/if}
        {/snippet}
        {#snippet children()}
          <DonutChart data={sanitationData} centerLabel="Sitios" height={220} />

          <!-- ZOD Analytics -->
          <div class="mt-4">
            {#if zodAnalytics().hasWarning}
              <div
                class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="size-4 shrink-0 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-red-800 dark:text-red-300">
                    Zero Open Defecation (ZOD) Alert
                  </p>
                  <p class="mt-1 text-xs text-red-700 dark:text-red-400">
                    {zodAnalytics().message}
                  </p>
                </div>
              </div>
            {:else}
              <div
                class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              >
                <Check class="size-4 text-emerald-600 dark:text-emerald-400" />
                <p class="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {zodAnalytics().message}
                </p>
              </div>
            {/if}
          </div>
        {/snippet}
      </InfoCard>

      <!-- Classroom Density -->
      <!-- <InfoCard
				title="Classroom Density"
				description="Students per classroom ratio"
				icon={GraduationCap}
				iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
				iconTextColor="text-indigo-500"
			>
				{#snippet children()}
					<BarChart data={studentsPerRoomData} height={220} title="Sitios" />
				{/snippet}
			</InfoCard> -->
    </div>
  </div>

  <!-- Right Column: Sidebar (1/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-1">
    <!-- Main Access Modes Card -->
    <InfoCard
      title="Main Access Modes"
      description="Primary transportation methods"
      icon={Car}
      iconBgColor="bg-blue-50 dark:bg-blue-500/10"
      iconTextColor="text-blue-600 dark:text-blue-400"
      headerClass="pb-4"
      contentPadding="p-3"
    >
      {#snippet children()}
        <div class="grid grid-cols-2 gap-3">
          {#each accessModesDisplay as mode}
            {@const Icon = mode.icon}
            {@const isActive = mode.count > 0}
            <div
              class="flex items-center gap-2.5 rounded-lg border p-2.5 transition-all {isActive
                ? 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5'
                : 'border-slate-100 bg-slate-50/50 opacity-50 dark:border-slate-700 dark:bg-slate-800/30'}"
              title="{mode.count} sitios with {mode.label.toLowerCase()} access"
            >
              <div
                class="rounded-md p-1.5 {isActive
                  ? 'bg-blue-100 dark:bg-blue-500/20'
                  : 'bg-slate-200 dark:bg-slate-700'}"
              >
                <Icon
                  class="size-3.5 {isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400'}"
                />
              </div>
              <div class="flex flex-col">
                <span class="text-[13px] font-medium text-foreground">{mode.label}</span>
                <span class="text-[11px] leading-tight text-muted-foreground">
                  {mode.count} sitios
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>

    <!-- Mobile Signal Card -->
    <InfoCard
      title="Mobile Signal Coverage"
      description="Network availability across sitios"
      icon={Router}
      iconBgColor="bg-slate-50 dark:bg-slate-900/20"
      iconTextColor="text-slate-400"
      contentPadding="px-4 py-2"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && signalTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical trend"
            onclick={() => (showSignalTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <div class="space-y-3">
          <!-- Signal bars visualization -->
          <div class="flex justify-between gap-1.5">
            {#each ['2G', '3G', '4G', '5G'] as network, index}
              {@const signalData = mobileSignalData.find((s) => s.label === network)}
              {@const hasSignal = signalData && signalData.count > 0}
              <div class="flex flex-1 flex-col items-center gap-1.5">
                <div
                  class="h-3 w-full rounded transition-all {hasSignal
                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                    : 'bg-slate-100 dark:bg-slate-700'}"
                ></div>
                <span
                  class="text-sm font-bold {hasSignal
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'}"
                >
                  {network}
                </span>
              </div>
            {/each}
          </div>
          <!-- Signal distribution breakdown -->
          <div
            class="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <p class="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Sitio Distribution
            </p>
            <div class="space-y-1.5">
              {#each mobileSignalData as signal}
                {@const percent =
                  totalSitios > 0 ? Math.round((signal.count / totalSitios) * 100) : 0}
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-600 dark:text-slate-400">{signal.label}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">{signal.count}</span>
                    <span class="min-w-8 text-right font-medium text-slate-900 dark:text-white"
                      >{percent}%</span
                    >
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Classroom Density Analytics Card -->
    <InfoCard
      title="Classroom Density"
      description="Pupil:Room Ratio Analysis"
      icon={GraduationCap}
      iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
      iconTextColor="text-indigo-600 dark:text-indigo-400"
    >
      {#snippet headerAction()}
        {#if hasMultipleYears && classroomTrendData.categories.length > 1}
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-foreground"
            title="View historical trend"
            onclick={() => (showClassroomTrendModal = true)}
          >
            <ChartLine class="size-4" />
          </Button>
        {/if}
      {/snippet}
      {#snippet children()}
        <!-- Summary Analytics -->
        <div
          class="mb-4 rounded-lg border p-3 {classroomDensityAnalytics().hasWarnings
            ? 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
            : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'}"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              class="text-[10px] font-bold tracking-wider uppercase {classroomDensityAnalytics()
                .hasWarnings
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300'}"
            >
              RA 7880 Compliance Summary
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-muted-foreground">Compliant Sitios</p>
              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {classroomDensityAnalytics().compliantSitios}
              </p>
              <p class="text-[10px] text-muted-foreground">
                {classroomDensityAnalytics().compliancePercent}% of total
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Need Intervention</p>
              <p
                class="text-2xl font-bold {classroomDensityAnalytics().hasWarnings
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400'}"
              >
                {classroomDensityAnalytics().sitiosNeedingIntervention}
              </p>
              <p class="text-[10px] text-muted-foreground">
                {classroomDensityAnalytics().interventionPercent}% of total
              </p>
            </div>
          </div>
          <p
            class="mt-2 text-xs {classroomDensityAnalytics().hasWarnings
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-emerald-700 dark:text-emerald-300'}"
          >
            {classroomDensityAnalytics().message}
          </p>
        </div>

        <!-- Breakdown by Category -->
        <div class="space-y-2">
          <p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Breakdown by Pupil:Room Ratio
          </p>
          {#each studentsPerRoomData as category}
            <div
              class="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div class="mb-1.5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" style="background-color: {category.color}"
                  ></span>
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {category.label}
                  </span>
                </div>
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {category.value} sitio{category.value !== 1 ? 's' : ''}
                </span>
              </div>
              <p class="text-[11px] leading-tight text-muted-foreground">
                {category.remark}
              </p>
            </div>
          {/each}
        </div>

        <!-- RA 7880 Information -->
        <div
          class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-2.5 dark:border-blue-800/30 dark:bg-blue-900/10"
        >
          <p
            class="text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-300"
          >
            Republic Act 7880
          </p>
          <p class="mt-1 text-[11px] leading-tight text-blue-600 dark:text-blue-400">
            Fair and Equitable Access to Education Act - mandates reasonable pupil-classroom ratio
            to ensure quality education delivery.
          </p>
          <p
            class="mt-2 border-t border-blue-200 pt-2 text-[10px] leading-tight text-blue-500 dark:border-blue-700 dark:text-blue-400"
          >
            <span class="font-semibold">Source:</span>
            <a
              href="https://rtei.okfn.org/documents/The_Basic_Education_Information_System_BEIS_.pdf"
              target="_blank"
              rel="noopener noreferrer"
              class="underline hover:text-blue-700 dark:hover:text-blue-300"
            >
              Basic Education Information System (BEIS)
            </a>
          </p>
        </div>
      {/snippet}
    </InfoCard>

    <!-- Community Facilities Card -->
    <InfoCard
      title="Community Facilities"
      description="Presence across all sitios"
      icon={Building2}
      iconBgColor="bg-purple-50 dark:bg-purple-900/20"
      iconTextColor="text-purple-500"
    >
      {#snippet children()}
        <div class="grid grid-cols-1 gap-3">
          {#each facilitiesList as { name, data }}
            {@const existsPercent =
              totalSitios > 0 ? Math.round((data.exists / totalSitios) * 100) : 0}
            <div
              class="flex items-center justify-between rounded-lg border p-3 {data.exists > 0
                ? 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/20'
                : 'dark:bg-card-dark border-slate-100 bg-white dark:border-slate-700'}"
            >
              <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-900 dark:text-white">{name}</span>
                {#if data.exists > 0}
                  <span
                    class="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    {data.exists} sitios ({existsPercent}%)
                  </span>
                {:else}
                  <span class="text-xs font-medium text-slate-500"> Not present in any sitio </span>
                {/if}
              </div>
              {#if data.exists > 0}
                <div class="flex flex-col items-end gap-0.5">
                  <div class="flex gap-1">
                    {#if data.excellent > 0}
                      <Badge
                        variant="outline"
                        class="border-emerald-100 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                        >{data.excellent} exc</Badge
                      >
                    {/if}
                    {#if data.good > 0}
                      <Badge
                        variant="outline"
                        class="border-green-100 bg-green-50 px-1.5 py-0 text-[10px] text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                        >{data.good} good</Badge
                      >
                    {/if}
                  </div>
                  <div class="flex gap-1">
                    {#if data.fair > 0}
                      <Badge
                        variant="outline"
                        class="border-yellow-100 bg-yellow-50 px-1.5 py-0 text-[10px] text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400"
                        >{data.fair} fair</Badge
                      >
                    {/if}
                    {#if data.poor > 0 || data.critical > 0}
                      <Badge
                        variant="outline"
                        class="border-red-100 bg-red-50 px-1.5 py-0 text-[10px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                        >{data.poor + data.critical} poor</Badge
                      >
                    {/if}
                  </div>
                </div>
              {:else}
                <span class="text-xs font-semibold text-slate-400 uppercase opacity-50">None</span>
              {/if}
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>
  </div>
</div>

<!-- Road Infrastructure Trend Modal -->
<Dialog.Root bind:open={showRoadTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <Car class="size-5 text-slate-600 dark:text-slate-400" />
        </div>
        Road Infrastructure - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year road network development across {roadTrendData.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={roadTrendData.series}
        categories={roadTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toFixed(1)} km`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Water Sources Trend Modal -->
<Dialog.Root bind:open={showWaterTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
          <Droplets class="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        Water Sources - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year functional water sources across {waterTrendData.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={waterTrendData.series}
        categories={waterTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toFixed(0)} units`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Sanitation Types Trend Modal -->
<Dialog.Root bind:open={showSanitationTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/20">
          <Droplets class="size-5 text-teal-600 dark:text-teal-400" />
        </div>
        Sanitation Types - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year sanitation facility distribution across {sanitationTrendData.categories
          .length}
        years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={sanitationTrendData.series}
        categories={sanitationTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toFixed(0)} sitios`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Mobile Signal Coverage Trend Modal -->
<Dialog.Root bind:open={showSignalTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-slate-100 p-2 dark:bg-slate-900/20">
          <Router class="size-5 text-slate-600 dark:text-slate-400" />
        </div>
        Mobile Signal Coverage - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year network coverage improvements across {signalTrendData.categories.length}
        years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={signalTrendData.series}
        categories={signalTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toFixed(0)} sitios`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Classroom Density Trend Modal -->
<Dialog.Root bind:open={showClassroomTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/20">
          <GraduationCap class="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        Classroom Density - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year pupil:room ratio distribution across {classroomTrendData.categories.length}
        years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={classroomTrendData.series}
        categories={classroomTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toFixed(0)} sitios`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Utility Access Trend Modal -->
<Dialog.Root bind:open={showUtilityTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/20">
          <Zap class="size-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        Utility Access - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year utility coverage improvements across {utilityTrendData.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <!-- Trend badges -->
      <div class="mb-4 flex flex-wrap gap-2">
        {#if yearComparison.trends.electricityAccess}
          <Badge
            variant={yearComparison.trends.electricityAccess.isPositive ? 'default' : 'destructive'}
            class="gap-1"
          >
            <Zap class="size-3" />
            Electricity {yearComparison.trends.electricityAccess.value >= 0 ? '+' : ''}
            {yearComparison.trends.electricityAccess.value.toFixed(1)}% vs last year
          </Badge>
        {/if}
        {#if yearComparison.trends.toiletAccess}
          <Badge
            variant={yearComparison.trends.toiletAccess.isPositive ? 'default' : 'destructive'}
            class="gap-1"
          >
            <Droplets class="size-3" />
            Sanitation {yearComparison.trends.toiletAccess.value >= 0 ? '+' : ''}
            {yearComparison.trends.toiletAccess.value.toFixed(1)}% vs last year
          </Badge>
        {/if}
        {#if yearComparison.trends.internetAccess}
          <Badge
            variant={yearComparison.trends.internetAccess.isPositive ? 'default' : 'destructive'}
            class="gap-1"
          >
            <Router class="size-3" />
            Internet {yearComparison.trends.internetAccess.value >= 0 ? '+' : ''}
            {yearComparison.trends.internetAccess.value.toFixed(1)}% vs last year
          </Badge>
        {/if}
      </div>
      <LineChart
        series={utilityTrendData.series}
        categories={utilityTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toFixed(1)}%`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
