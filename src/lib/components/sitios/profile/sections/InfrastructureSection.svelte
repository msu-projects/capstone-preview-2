<script lang="ts">
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import { getNationalAverages } from '$lib/config/national-averages';
  import type { SitioProfile, SitioRecord } from '$lib/types';
  import {
    Building2,
    Car,
    ChartLine,
    Check,
    Droplets,
    Footprints,
    GraduationCap,
    Milestone,
    Navigation,
    Router,
    Ship,
    TrendingDown,
    TrendingUp,
    Zap
  } from '@lucide/svelte';

  interface Props {
    sitio: SitioProfile;
    sitioRecord?: SitioRecord;
    selectedYear?: number;
  }

  const { sitio, sitioRecord, selectedYear }: Props = $props();

  // Get national averages with config overrides
  const NATIONAL_AVERAGES = $derived(getNationalAverages());

  // Modal states for trend modals
  let showUtilityTrendModal = $state(false);
  let showRoadTrendModal = $state(false);
  let showWaterTrendModal = $state(false);
  let showSanitationTrendModal = $state(false);
  let showSignalTrendModal = $state(false);
  let showClassroomTrendModal = $state(false);

  // Get available years for comparison
  const availableYears = $derived(sitioRecord?.availableYears || []);
  const hasMultipleYears = $derived(availableYears.length > 1);

  // Time series data for utilities trends
  const utilityTrendData = $derived.by(() => {
    if (!sitioRecord || !hasMultipleYears) {
      return { categories: [], series: [] };
    }

    const categories = availableYears.map((y) => y.toString());
    const series = [
      { name: 'Electricity', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      { name: 'Sanitary Toilet', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: 'Internet', data: [] as number[], color: 'hsl(142, 71%, 45%)' }
    ];

    availableYears.forEach((year) => {
      const yearData = sitioRecord.yearlyData[year.toString()];
      if (yearData) {
        const electricityCount = yearData.householdsWithElectricity || 0;
        const toiletCount = yearData.householdsWithToilet || 0;
        const internetCount = yearData.householdsWithInternet || 0;

        series[0].data.push(electricityCount);
        series[1].data.push(toiletCount);
        series[2].data.push(internetCount);
      }
    });

    return { categories, series };
  });

  // Time series data for road infrastructure trends
  const roadTrendData = $derived.by(() => {
    if (!sitioRecord || !hasMultipleYears) {
      return { categories: [], series: [] };
    }

    const categories = availableYears.map((y) => y.toString());
    const series = [
      { name: 'Concrete', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: 'Asphalt', data: [] as number[], color: 'hsl(215, 20%, 55%)' },
      { name: 'Gravel', data: [] as number[], color: 'hsl(27, 87%, 67%)' },
      { name: 'Natural', data: [] as number[], color: 'hsl(25, 5%, 45%)' }
    ];

    availableYears.forEach((year) => {
      const yearData = sitioRecord.yearlyData[year.toString()];
      if (yearData) {
        series[0].data.push(yearData.infrastructure.concrete.length || 0);
        series[1].data.push(yearData.infrastructure.asphalt.length || 0);
        series[2].data.push(yearData.infrastructure.gravel.length || 0);
        series[3].data.push(yearData.infrastructure.natural.length || 0);
      }
    });

    return { categories, series };
  });

  // Time series data for water sources trends
  const waterTrendData = $derived.by(() => {
    if (!sitioRecord || !hasMultipleYears) {
      return { categories: [], series: [] };
    }

    const categories = availableYears.map((y) => y.toString());
    const series = [
      { name: 'Natural Source', data: [] as number[], color: 'hsl(142, 71%, 45%)' },
      { name: 'Level 1', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: 'Level 2', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      { name: 'Level 3', data: [] as number[], color: 'hsl(263, 70%, 50%)' }
    ];

    availableYears.forEach((year) => {
      const yearData = sitioRecord.yearlyData[year.toString()];
      if (yearData) {
        series[0].data.push(yearData.waterSources.natural.functioningCount || 0);
        series[1].data.push(yearData.waterSources.level1.functioningCount || 0);
        series[2].data.push(yearData.waterSources.level2.functioningCount || 0);
        series[3].data.push(yearData.waterSources.level3.functioningCount || 0);
      }
    });

    return { categories, series };
  });

  // Time series data for sanitation types trends
  const sanitationTrendData = $derived.by(() => {
    if (!sitioRecord || !hasMultipleYears) {
      return { categories: [], series: [] };
    }

    const categories = availableYears.map((y) => y.toString());
    const series = [
      { name: 'Water Sealed', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      { name: 'Pit Latrine', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      { name: 'Community CR', data: [] as number[], color: 'hsl(263, 70%, 50%)' },
      { name: 'Open Defecation', data: [] as number[], color: 'hsl(0, 84%, 60%)' }
    ];

    availableYears.forEach((year) => {
      const yearData = sitioRecord.yearlyData[year.toString()];
      if (yearData) {
        const waterSealed = yearData.sanitationTypes.waterSealed ? 1 : 0;
        const pitLatrine = yearData.sanitationTypes.pitLatrine ? 1 : 0;
        const communityCR = yearData.sanitationTypes.communityCR ? 1 : 0;
        const openDefecation = yearData.sanitationTypes.openDefecation ? 1 : 0;

        series[0].data.push(waterSealed);
        series[1].data.push(pitLatrine);
        series[2].data.push(communityCR);
        series[3].data.push(openDefecation);
      }
    });

    return { categories, series };
  });

  // Time series data for mobile signal trends
  const signalTrendData = $derived.by(() => {
    if (!sitioRecord || !hasMultipleYears) {
      return { categories: [], series: [] };
    }

    const categories = availableYears.map((y) => y.toString());
    const signalLevels = {
      '5g': { name: '5G', data: [] as number[], color: 'hsl(142, 71%, 45%)' },
      '4g': { name: '4G', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      '3g': { name: '3G', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      '2g': { name: '2G', data: [] as number[], color: 'hsl(27, 87%, 67%)' },
      none: { name: 'None', data: [] as number[], color: 'hsl(0, 84%, 60%)' }
    };

    availableYears.forEach((year) => {
      const yearData = sitioRecord.yearlyData[year.toString()];
      if (yearData) {
        const signal = yearData.mobileSignal;
        signalLevels['5g'].data.push(signal === '5g' ? 1 : 0);
        signalLevels['4g'].data.push(signal === '4g' ? 1 : 0);
        signalLevels['3g'].data.push(signal === '3g' ? 1 : 0);
        signalLevels['2g'].data.push(signal === '2g' ? 1 : 0);
        signalLevels.none.data.push(signal === 'none' ? 1 : 0);
      }
    });

    return { categories, series: Object.values(signalLevels) };
  });

  // Time series data for classroom density trends
  const classroomTrendData = $derived.by(() => {
    if (!sitioRecord || !hasMultipleYears) {
      return { categories: [], series: [] };
    }

    const categories = availableYears.map((y) => y.toString());
    const densityLevels = {
      less_than_46: { name: '<46 (Blue)', data: [] as number[], color: 'hsl(217, 91%, 60%)' },
      '46_50': { name: '46-50 (Yellow)', data: [] as number[], color: 'hsl(45, 93%, 47%)' },
      '51_55': { name: '51-55 (Gold)', data: [] as number[], color: 'hsl(25, 95%, 53%)' },
      more_than_56: { name: '>56 (Red)', data: [] as number[], color: 'hsl(0, 84%, 60%)' },
      no_classroom: { name: 'No Classroom', data: [] as number[], color: 'hsl(0, 0%, 30%)' }
    };

    availableYears.forEach((year) => {
      const yearData = sitioRecord.yearlyData[year.toString()];
      if (yearData) {
        const ratio = yearData.studentsPerRoom;
        densityLevels.less_than_46.data.push(ratio === 'less_than_46' ? 1 : 0);
        densityLevels['46_50'].data.push(ratio === '46_50' ? 1 : 0);
        densityLevels['51_55'].data.push(ratio === '51_55' ? 1 : 0);
        densityLevels.more_than_56.data.push(ratio === 'more_than_56' ? 1 : 0);
        densityLevels.no_classroom.data.push(ratio === 'no_classroom' ? 1 : 0);
      }
    });

    return { categories, series: Object.values(densityLevels) };
  });

  // Calculate utility percentages
  const electricityPercent = $derived(
    sitio.totalHouseholds > 0
      ? Math.round((sitio.householdsWithElectricity / sitio.totalHouseholds) * 100)
      : 0
  );

  const toiletPercent = $derived(
    sitio.totalHouseholds > 0
      ? Math.round((sitio.householdsWithToilet / sitio.totalHouseholds) * 100)
      : 0
  );

  // Sanitation types data
  const sanitationTypes = $derived([
    {
      label: 'Water-Sealed',
      enabled: sitio.sanitationTypes.waterSealed,
      color: 'bg-blue-500',
      description: 'Modern flush toilets with water seal'
    },
    {
      label: 'Pit Latrine',
      enabled: sitio.sanitationTypes.pitLatrine,
      color: 'bg-amber-500',
      description: 'Traditional pit latrines'
    },
    {
      label: 'Community CR',
      enabled: sitio.sanitationTypes.communityCR,
      color: 'bg-purple-500',
      description: 'Shared community comfort rooms'
    },
    {
      label: 'Open Defecation',
      enabled: sitio.sanitationTypes.openDefecation,
      color: 'bg-red-500',
      description: 'No proper sanitation facility'
    }
  ]);

  // Zero Open Defecation (ZOD) Analytics
  const zodAnalytics = $derived(() => {
    const hasOpenDefecation = sitio.sanitationTypes.openDefecation;
    return {
      hasWarning: hasOpenDefecation,
      message: hasOpenDefecation
        ? 'Open defecation practice detected - requires immediate intervention'
        : 'No open defecation reported - ZOD compliant'
    };
  });

  // Classroom Density Analytics (Pupil:Room Ratio)
  const classroomDensityAnalytics = $derived(() => {
    const studentsPerRoom = sitio.studentsPerRoom;

    switch (studentsPerRoom) {
      case 'less_than_46':
        return {
          status: 'excellent',
          colorCode: 'blue',
          label: 'Less than 46',
          remark: 'Meet Republic Act 7880 with one shift',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800/30',
          badgeBg: 'bg-blue-500',
          severity: 'low'
        };
      case '46_50':
        return {
          status: 'warning',
          colorCode: 'yellow',
          label: '46.00 - 50.99',
          remark: 'Fails to meet RA 7880 with one shift',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          borderColor: 'border-yellow-200 dark:border-yellow-800/30',
          badgeBg: 'bg-yellow-500',
          severity: 'medium'
        };
      case '51_55':
        return {
          status: 'critical',
          colorCode: 'gold',
          label: '51.00 - 55.99',
          remark: 'Does not meet RA 7880 even with double shifting',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-800/30',
          badgeBg: 'bg-amber-500',
          severity: 'high'
        };
      case 'more_than_56':
        return {
          status: 'severe',
          colorCode: 'red',
          label: 'More than 56',
          remark: 'Does not meet RA 7880, schools with severe shortage of classrooms',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800/30',
          badgeBg: 'bg-red-500',
          severity: 'critical'
        };
      case 'no_classroom':
        return {
          status: 'none',
          colorCode: 'black',
          label: 'No Classroom Available',
          remark: 'No existing instructional rooms',
          bgColor: 'bg-slate-50 dark:bg-slate-900/20',
          textColor: 'text-slate-700 dark:text-slate-300',
          borderColor: 'border-slate-200 dark:border-slate-800/30',
          badgeBg: 'bg-slate-700',
          severity: 'critical'
        };
    }
  });

  const internetPercent = $derived(
    sitio.totalHouseholds > 0
      ? Math.round((sitio.householdsWithInternet / sitio.totalHouseholds) * 100)
      : 0
  );

  // Analytics: Compare against national averages
  const electricityAnalytics = $derived(() => {
    const diff = electricityPercent - NATIONAL_AVERAGES.electricity.percent;
    return {
      diff: Math.abs(diff).toFixed(1),
      isAbove: diff >= 0,
      status: diff >= 0 ? 'above' : 'below'
    };
  });

  const toiletAnalytics = $derived(() => {
    const diff = toiletPercent - NATIONAL_AVERAGES.sanitaryToilet.percent;
    return {
      diff: Math.abs(diff).toFixed(1),
      isAbove: diff >= 0,
      status: diff >= 0 ? 'above' : 'below'
    };
  });

  const internetAnalytics = $derived(() => {
    const diff = internetPercent - NATIONAL_AVERAGES.internet.percent;
    return {
      diff: Math.abs(diff).toFixed(1),
      isAbove: diff >= 0,
      status: diff >= 0 ? 'above' : 'below'
    };
  });

  // Road Network Analytics: Calculate paved vs unpaved percentages
  const roadNetworkAnalytics = $derived(() => {
    const pavedLength =
      (sitio.infrastructure.concrete.length || 0) + (sitio.infrastructure.asphalt.length || 0);
    const unpavedLength =
      (sitio.infrastructure.gravel.length || 0) + (sitio.infrastructure.natural.length || 0);
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
      totalLength: totalLength.toFixed(2)
    };
  });

  const electricitySources = $derived([
    {
      label: 'Grid',
      count: sitio.electricitySources.grid,
      value:
        sitio.totalHouseholds > 0
          ? Math.round((sitio.electricitySources.grid / sitio.totalHouseholds) * 100)
          : 0,
      color: 'bg-indigo-500'
    },
    {
      label: 'Solar',
      count: sitio.electricitySources.solar,
      value:
        sitio.totalHouseholds > 0
          ? Math.round((sitio.electricitySources.solar / sitio.totalHouseholds) * 100)
          : 0,
      color: 'bg-yellow-500'
    },
    {
      label: 'Battery',
      count: sitio.electricitySources.battery,
      value:
        sitio.totalHouseholds > 0
          ? Math.round((sitio.electricitySources.battery / sitio.totalHouseholds) * 100)
          : 0,
      color: 'bg-emerald-500'
    },
    {
      label: 'Generator',
      count: sitio.electricitySources.generator,
      value:
        sitio.totalHouseholds > 0
          ? Math.round((sitio.electricitySources.generator / sitio.totalHouseholds) * 100)
          : 0,
      color: 'bg-orange-500'
    }
  ]);

  // Internal infrastructure (roads)
  const roadTypes = $derived([
    {
      type: 'Concrete',
      color: 'bg-blue-500',
      exists: sitio.infrastructure.concrete.exists,
      length: sitio.infrastructure.concrete.length || 0,
      condition: sitio.infrastructure.concrete.condition
    },
    {
      type: 'Asphalt',
      color: 'bg-slate-300 dark:bg-slate-700',
      exists: sitio.infrastructure.asphalt.exists,
      length: sitio.infrastructure.asphalt.length || 0,
      condition: sitio.infrastructure.asphalt.condition
    },
    {
      type: 'Gravel',
      color: 'bg-orange-400',
      exists: sitio.infrastructure.gravel.exists,
      length: sitio.infrastructure.gravel.length || 0,
      condition: sitio.infrastructure.gravel.condition
    },
    {
      type: 'Natural',
      color: 'bg-stone-500',
      exists: sitio.infrastructure.natural.exists,
      length: sitio.infrastructure.natural.length || 0,
      condition: sitio.infrastructure.natural.condition
    }
  ]);

  // Calculate total road network length
  const totalRoadLength = $derived(
    roadTypes.reduce((sum, road) => (road.exists === 'yes' ? sum + road.length : sum), 0)
  );

  // Water sources data
  const waterSources = $derived([
    {
      type: 'Natural Source',
      status: sitio.waterSources.natural.exists,
      functional: sitio.waterSources.natural.functioningCount || 0,
      defective: sitio.waterSources.natural.notFunctioningCount || 0
    },
    {
      type: 'Level 1 (Point Source)',
      status: sitio.waterSources.level1.exists,
      functional: sitio.waterSources.level1.functioningCount || 0,
      defective: sitio.waterSources.level1.notFunctioningCount || 0
    },
    {
      type: 'Level 2 (Communal)',
      status: sitio.waterSources.level2.exists,
      functional: sitio.waterSources.level2.functioningCount || 0,
      defective: sitio.waterSources.level2.notFunctioningCount || 0
    },
    {
      type: 'Level 3 (Individual)',
      status: sitio.waterSources.level3.exists,
      functional: sitio.waterSources.level3.functioningCount || 0,
      defective: sitio.waterSources.level3.notFunctioningCount || 0
    }
  ]);

  // Access modes
  const accessModes = $derived([
    {
      icon: Car,
      label: 'Paved',
      description: 'Standard road access',
      enabled: sitio.mainAccess.pavedRoad,
      title: 'Access to the sitio is primarily via paved roads'
    },
    {
      icon: Milestone,
      label: 'Unpaved',
      description: 'Dirt/Rough roads',
      enabled: sitio.mainAccess.unpavedRoad,
      title: 'Access to the sitio is via unpaved or dirt roads'
    },
    {
      icon: Footprints,
      label: 'Footpath',
      description: 'Walking trails only',
      enabled: sitio.mainAccess.footpath,
      title: 'Access is limited to footpaths or trails'
    },
    {
      icon: Ship,
      label: 'Boat',
      description: 'Waterway access',
      enabled: sitio.mainAccess.boat,
      title: 'Access is primarily via water transportation'
    }
  ]);

  // Community facilities
  const facilitiesList = $derived([
    {
      name: 'Health Center',
      facility: sitio.facilities.healthCenter
    },
    {
      name: 'Pharmacy',
      facility: sitio.facilities.pharmacy
    },
    {
      name: 'Community Toilet',
      facility: sitio.facilities.communityToilet
    },
    {
      name: 'Kindergarten',
      facility: sitio.facilities.kindergarten
    },
    {
      name: 'Elem. School',
      facility: sitio.facilities.elementarySchool
    },
    {
      name: 'High School',
      facility: sitio.facilities.highSchool
    },
    {
      name: 'Madrasah',
      facility: sitio.facilities.madrasah
    },
    {
      name: 'Market',
      facility: sitio.facilities.market
    }
  ]);

  // Condition labels
  function getConditionLabel(condition: number | undefined): { text: string; class: string } {
    switch (condition) {
      case 5:
        return { text: 'Excellent', class: 'text-emerald-600 dark:text-emerald-400' };
      case 4:
        return { text: 'Good', class: 'text-green-600 dark:text-green-400' };
      case 3:
        return { text: 'Average', class: 'text-yellow-600 dark:text-yellow-400' };
      case 2:
        return { text: 'Poor', class: 'text-orange-600 dark:text-orange-400' };
      case 1:
        return { text: 'Bad', class: 'text-red-600 dark:text-red-400' };
      default:
        return { text: 'N/A', class: 'text-slate-400' };
    }
  }

  // Road condition descriptions
  function getRoadConditionDescription(condition: number | undefined): string {
    switch (condition) {
      case 5:
        return 'Optimal condition; new or like-new surface.';
      case 4:
        return 'Smooth ride; sound structure with minimal wear.';
      case 3:
        return 'Functional but bumpy; minor cracks and wear.';
      case 2:
        return 'Rough ride; significant potholes and cracking.';
      case 1:
        return 'Unsafe or impassable; severe damage like deep potholes or collapse.';
      default:
        return '';
    }
  }

  // Facility condition descriptions
  function getFacilityConditionDescription(condition: number | undefined): string {
    switch (condition) {
      case 5:
        return 'In optimal condition; newly built, renovated, or exceeds standard requirements.';
      case 4:
        return 'Fully functional and well-maintained; requires only routine maintenance.';
      case 3:
        return 'Functional with minor defects; needs minor repairs and preventive maintenance.';
      case 2:
        return 'Functional but with significant wear; requires major repairs soon to prevent failure.';
      case 1:
        return 'Severely damaged, unsafe, or non-functional; requires immediate major intervention.';
      default:
        return '';
    }
  }

  // Mobile signal info
  const signalInfo = $derived(() => {
    const signalMap: Record<string, { label: string; bars: number }> = {
      none: { label: 'No Signal', bars: 0 },
      '2g': { label: '2G', bars: 1 },
      '3g': { label: '3G', bars: 2 },
      '4g': { label: '4G LTE', bars: 3 },
      '5g': { label: '5G', bars: 4 }
    };
    return signalMap[sitio.mobileSignal] || { label: 'Unknown', bars: 0 };
  });
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <!-- Left Column: Main Content (2/3 width) -->
  <div class="flex flex-col gap-6 lg:col-span-2">
    <!-- Access to Utilities Card -->
    <InfoCard
      title="Access to Utilities"
      description="Detailed breakdown of basic services coverage"
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
          class="mb-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
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
                  {electricityPercent}%
                </span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2.5 rounded-full bg-yellow-400 transition-all duration-500"
                  style="width: {electricityPercent}%"
                ></div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  {sitio.householdsWithElectricity} of {sitio.totalHouseholds} households
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
                          style="width: {source.value}%"
                        ></div>
                      </div>
                      <div class="flex min-w-20 items-baseline justify-end gap-1">
                        <span class="text-[10px] text-muted-foreground">({source.count})</span>
                        <span class="font-medium text-slate-900 dark:text-white"
                          >{source.value}%</span
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
                  {toiletPercent}%
                </span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2.5 rounded-full bg-green-500 transition-all duration-500"
                  style="width: {toiletPercent}%"
                ></div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  {sitio.householdsWithToilet} of {sitio.totalHouseholds} households
                </p>
                <span class="text-[10px] text-muted-foreground">
                  PH Avg: {NATIONAL_AVERAGES.sanitaryToilet.percent}%
                </span>
              </div>
              <div
                class="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p
                  class="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                >
                  Sanitation Types Used
                </p>
                <div class="flex flex-wrap gap-2">
                  {#each sanitationTypes.filter((v) => v.enabled) as sanitation}
                    <div
                      class="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                      title={sanitation.description}
                    >
                      <div class="h-2 w-2 rounded-full {sanitation.color}"></div>
                      <span class="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {sanitation.label}
                      </span>
                    </div>
                  {/each}
                  {#if !sanitationTypes.some((v) => v.enabled)}
                    <span class="text-xs text-muted-foreground italic">No data available</span>
                  {/if}
                </div>

                <!-- ZOD Analytics Warning -->
                {#if zodAnalytics().hasWarning}
                  <div
                    class="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 dark:border-red-500/30 dark:bg-red-500/10"
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
                      <p class="mt-0.5 text-xs text-red-700 dark:text-red-400">
                        {zodAnalytics().message}
                      </p>
                    </div>
                  </div>
                {:else}
                  <div
                    class="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                  >
                    <Check class="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <p class="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {zodAnalytics().message}
                    </p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Internet Connectivity -->
            <div title="Percentage of households with internet connection">
              <div class="mb-2 flex justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Internet Connectivity
                </span>
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {internetPercent}%
                </span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-2.5 rounded-full bg-blue-400 transition-all duration-500"
                  style="width: {internetPercent}%"
                ></div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  {sitio.householdsWithInternet} of {sitio.totalHouseholds} households
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

    <!-- Internal Infrastructure Card -->
    <InfoCard
      title="Internal Infrastructure"
      description="Road network conditions and surface types"
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
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">Road Network Summary</h4>
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
                    {roadNetworkAnalytics().pavedDiff}% {roadNetworkAnalytics().pavedIsAbove
                      ? 'above'
                      : 'below'}
                  </Badge>
                </div>
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
                    {roadNetworkAnalytics().unpavedDiff}% {roadNetworkAnalytics().unpavedIsAbove
                      ? 'above'
                      : 'below'}
                  </Badge>
                </div>
              </div>
            </div>
            <div class="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
              <p class="text-xs text-muted-foreground">
                Total road length: <span class="font-semibold text-slate-700 dark:text-slate-300"
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
              No road data available for analytics comparison.
            </p>
          </div>
        {/if}

        <div class="flex flex-col gap-4">
          <div
            class="grid grid-cols-12 gap-2 border-b border-slate-100 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase dark:border-slate-800"
          >
            <div class="col-span-4">Type</div>
            <div class="col-span-3 text-right">Status</div>
            <div class="col-span-2 text-right">Length</div>
            <div class="col-span-3 text-right">Condition</div>
          </div>
          {#each roadTypes as road}
            <div
              class="grid grid-cols-12 items-center gap-2"
              class:opacity-60={road.exists === 'no'}
            >
              <div class="col-span-4 flex items-center gap-2">
                <div class="h-8 w-1.5 rounded-full {road.color}"></div>
                <span class="text-sm font-bold text-slate-900 dark:text-white">{road.type}</span>
              </div>
              <div class="col-span-3 flex justify-end">
                {#if road.exists === 'yes'}
                  <Badge
                    variant="outline"
                    class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                  >
                    <Check class="mr-1 size-3.5" />
                    Yes
                  </Badge>
                {:else}
                  <Badge
                    variant="outline"
                    class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    No
                  </Badge>
                {/if}
              </div>
              <div class="col-span-2 text-right">
                {#if road.exists === 'yes'}
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-300"
                    >{road.length.toFixed(1)}</span
                  >
                  <span class="text-[10px] text-muted-foreground">km</span>
                {:else}
                  <span class="text-sm text-slate-400">—</span>
                {/if}
              </div>
              <div class="col-span-3 flex items-center justify-end gap-1">
                {#if road.exists === 'yes' && road.condition}
                  {@const conditionInfo = getConditionLabel(road.condition)}
                  {@const description = getRoadConditionDescription(road.condition)}
                  <span class="text-xs font-bold {conditionInfo.class}">
                    {conditionInfo.text}
                  </span>
                  <HelpTooltip content={description} />
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
            {#each roadTypes.filter((r) => r.exists === 'yes') as road, index}
              {@const percentage = totalRoadLength > 0 ? (road.length / totalRoadLength) * 100 : 0}
              <div
                class="h-full {road.color} {index <
                roadTypes.filter((r) => r.exists === 'yes').length - 1
                  ? 'border-r border-white dark:border-slate-800'
                  : ''}"
                style="width: {percentage}%"
              ></div>
            {/each}
          </div>
          <div class="mt-3 flex flex-wrap gap-4">
            {#each roadTypes.filter((r) => r.exists === 'yes') as road}
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
      description="Availability and functional status of water facilities"
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
                <th class="pb-3 text-center">Status</th>
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
                    {#if source.status === 'yes'}
                      <Badge
                        variant="outline"
                        class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                      >
                        Yes
                      </Badge>
                    {:else}
                      <Badge
                        variant="outline"
                        class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
                      >
                        No
                      </Badge>
                    {/if}
                  </td>
                  <td class="py-3 text-center text-slate-700 dark:text-slate-300">
                    {source.status === 'yes' ? source.functional : '—'}
                  </td>
                  <td
                    class="py-3 text-center {source.defective > 0
                      ? 'font-medium text-red-500'
                      : 'text-slate-400'}"
                  >
                    {source.status === 'yes' ? source.defective : '—'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/snippet}
    </InfoCard>
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
          {#each accessModes as mode}
            {@const Icon = mode.icon}
            <div
              class="flex items-center gap-2.5 rounded-lg border p-2.5 transition-all {mode.enabled
                ? 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5'
                : 'border-slate-100 bg-slate-50/50 opacity-50 dark:border-slate-700 dark:bg-slate-800/30'}"
              title={mode.title}
            >
              <div
                class="rounded-md p-1.5 {mode.enabled
                  ? 'bg-blue-100 dark:bg-blue-500/20'
                  : 'bg-slate-200 dark:bg-slate-700'}"
              >
                <Icon
                  class="size-3.5 {mode.enabled
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400'}"
                />
              </div>
              <div class="flex flex-col">
                <span class="text-[13px] font-medium text-foreground">{mode.label}</span>
                <span class="text-[11px] leading-tight text-muted-foreground">
                  {mode.description}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>

    <!-- Mobile Signal Card -->
    <InfoCard
      title="Mobile Signal"
      description="Network availability & strength"
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
      <div class="mt-4 flex justify-between gap-1.5">
        {#each ['2G', '3G', '4G', '5G'] as network, index}
          {@const isActive = index + 1 <= signalInfo().bars}
          <div class="flex flex-1 flex-col items-center gap-1.5">
            <div
              class="h-3 w-full rounded transition-all {isActive
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                : 'bg-slate-100 dark:bg-slate-700'}"
            ></div>
            <span
              class="text-sm font-bold {isActive
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 dark:text-slate-500'}"
            >
              {network}
            </span>
          </div>
        {/each}
      </div>
    </InfoCard>

    <!-- Classroom Density Analytics Card -->
    <InfoCard
      title="Classroom Density"
      description="Pupil:Room Ratio Analysis"
      icon={GraduationCap}
      iconBgColor={classroomDensityAnalytics().bgColor}
      iconTextColor={classroomDensityAnalytics().textColor}
      contentPadding="p-4"
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
        <div
          class="rounded-lg border p-4 {classroomDensityAnalytics()
            .borderColor} {classroomDensityAnalytics().bgColor}"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 rounded-full {classroomDensityAnalytics().badgeBg}"></div>
              <span class="text-sm font-bold {classroomDensityAnalytics().textColor}">
                {classroomDensityAnalytics().colorCode.toUpperCase()}
              </span>
            </div>
            <Badge
              variant="outline"
              class="{classroomDensityAnalytics().borderColor} {classroomDensityAnalytics()
                .bgColor} {classroomDensityAnalytics().textColor} font-bold"
            >
              {classroomDensityAnalytics().label}
            </Badge>
          </div>
          <p class="text-sm leading-relaxed {classroomDensityAnalytics().textColor}">
            {classroomDensityAnalytics().remark}
          </p>
        </div>

        <!-- Severity Indicator -->
        {#if classroomDensityAnalytics().severity === 'high' || classroomDensityAnalytics().severity === 'critical'}
          <div
            class="mt-3 flex items-start gap-2 rounded-md border p-2.5 {classroomDensityAnalytics()
              .severity === 'critical'
              ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
              : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'}"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-4 shrink-0 {classroomDensityAnalytics().severity === 'critical'
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400'}"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="flex-1">
              <p
                class="text-xs font-semibold {classroomDensityAnalytics().severity === 'critical'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-amber-700 dark:text-amber-300'}"
              >
                {classroomDensityAnalytics().severity === 'critical'
                  ? 'Critical Intervention Required'
                  : 'Immediate Action Recommended'}
              </p>
              <p
                class="mt-1 text-[11px] leading-tight {classroomDensityAnalytics().severity ===
                'critical'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'}"
              >
                {classroomDensityAnalytics().severity === 'critical'
                  ? 'This sitio requires urgent attention to address severe classroom shortage or lack of educational facilities.'
                  : 'Consider implementing classroom expansion programs or double shifting schedules to improve student learning conditions.'}
              </p>
            </div>
          </div>
        {/if}
        <!-- RA 7880 Information -->
        <div
          class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-800/30 dark:bg-blue-900/10"
        >
          <p
            class="text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-300"
          >
            Republic Act 7880
          </p>
          <p class="mt-1 text-xs leading-tight text-blue-600 dark:text-blue-400">
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
      description="Infrastructure for health, education, and services"
      icon={Building2}
      iconBgColor="bg-purple-50 dark:bg-purple-900/20"
      iconTextColor="text-purple-500"
    >
      {#snippet children()}
        <div
          class="mb-3 rounded border border-blue-100 bg-blue-50 p-2 dark:border-blue-800/30 dark:bg-blue-900/10"
        >
          <p class="text-[10px] leading-tight text-blue-700 dark:text-blue-300">
            <span class="font-bold">Note:</span> Condition rating refers to the best facility present
            in the sitio if multiple exist.
          </p>
        </div>
        <div class="grid grid-cols-1 gap-4">
          {#each facilitiesList as { name, facility }}
            <div
              class="flex items-center justify-between rounded-lg border p-3 {facility.exists ===
              'yes'
                ? 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/20'
                : 'dark:bg-card-dark border-slate-100 bg-white dark:border-slate-700'}"
            >
              <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-900 dark:text-white">{name}</span>
                {#if facility.exists === 'yes'}
                  <span
                    class="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Present ({facility.count || 1})
                  </span>
                {:else}
                  <span class="flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Navigation class="size-3" />
                    {#if facility.distanceToNearest}
                      {facility.distanceToNearest} km away
                    {:else}
                      Not Available
                    {/if}
                  </span>
                {/if}
              </div>
              {#if facility.exists === 'yes' && facility.condition}
                {@const conditionInfo = getConditionLabel(facility.condition)}
                {@const description = getFacilityConditionDescription(facility.condition)}
                <div class="flex items-center gap-1">
                  <span class="text-[10px] font-bold {conditionInfo.class}">
                    {conditionInfo.text}
                  </span>
                  <HelpTooltip content={description} />
                </div>
              {:else if facility.exists === 'no'}
                <div class="flex flex-col items-end opacity-50">
                  <span class="text-xs font-semibold text-slate-400 uppercase">None</span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/snippet}
    </InfoCard>
  </div>
</div>

<!-- Utility Trend Modal -->
<Dialog.Root bind:open={showUtilityTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/20">
          <Zap class="size-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        Utilities Access - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year utility coverage across {utilityTrendData.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={utilityTrendData.series}
        categories={utilityTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => `${val.toFixed(0)} HH`}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

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
          .length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={sanitationTrendData.series}
        categories={sanitationTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => (val === 1 ? 'Yes' : 'No')}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Mobile Signal Trend Modal -->
<Dialog.Root bind:open={showSignalTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <Router class="size-5 text-slate-600 dark:text-slate-400" />
        </div>
        Mobile Signal - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year mobile signal availability across {signalTrendData.categories.length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={signalTrendData.series}
        categories={signalTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => (val === 1 ? 'Available' : 'N/A')}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Classroom Density Trend Modal -->
<Dialog.Root bind:open={showClassroomTrendModal}>
  <Dialog.Content class="max-w-3xl!">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
          <GraduationCap class="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        Classroom Density - Historical Trend
      </Dialog.Title>
      <Dialog.Description>
        Year-over-year classroom density (pupil:room ratio) across {classroomTrendData.categories
          .length} years
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <LineChart
        series={classroomTrendData.series}
        categories={classroomTrendData.categories}
        height={300}
        curve="smooth"
        showLegend={true}
        yAxisFormatter={(val) => (val === 1 ? 'Yes' : 'No')}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
