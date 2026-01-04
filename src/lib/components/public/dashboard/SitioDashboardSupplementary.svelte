<script lang="ts">
  import BarChart from '$lib/components/charts/BarChart.svelte';
  import DonutChart from '$lib/components/charts/DonutChart.svelte';
  import StackedBarChart from '$lib/components/charts/StackedBarChart.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
  import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
  import type { CustomFieldDefinition, CustomFieldGroup, SitioRecord } from '$lib/types';
  import { AGGREGATION_TYPE_LABELS, DEFAULT_VISUALIZATION_CONFIG } from '$lib/types';
  import { aggregateFieldAcrossSitios } from '$lib/utils/custom-field-visualization';
  import {
    getActiveCustomFieldDefinitions,
    getActiveCustomFieldGroups
  } from '$lib/utils/custom-fields-storage';
  import type { Icon as IconType } from '@lucide/svelte';
  import {
    Activity,
    Award,
    BarChart3,
    BookOpen,
    Briefcase,
    Building,
    Calendar,
    ChevronDown,
    ChevronUp,
    CircleCheck,
    Droplet,
    Folder,
    Hash,
    Heart,
    Home,
    Layers,
    Leaf,
    List,
    ListChecks,
    Map as MapIcon,
    PieChart,
    Settings,
    Shield,
    Star,
    Target,
    ToggleLeft,
    Truck,
    Type,
    Users,
    Zap
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import DashboardStatCard from './DashboardStatCard.svelte';

  interface Props {
    sitios: SitioRecord[];
    selectedYear?: number;
  }

  let { sitios, selectedYear }: Props = $props();

  let definitions = $state<CustomFieldDefinition[]>([]);
  let groups = $state<CustomFieldGroup[]>([]);
  let collapsedGroups = $state<Set<string>>(new Set());

  onMount(() => {
    definitions = getActiveCustomFieldDefinitions();
    groups = getActiveCustomFieldGroups();
  });

  // Get current year data
  const currentYear = $derived(selectedYear || new Date().getFullYear());

  // Helper to get year data from a sitio
  function getYearData(sitio: SitioRecord, year: number) {
    const yearStr = year.toString();
    if (sitio.yearlyData[yearStr]) return sitio.yearlyData[yearStr];
    // Fallback to latest year
    const latestYear = Math.max(...sitio.availableYears);
    return sitio.yearlyData[latestYear.toString()];
  }

  // Helper to get custom field value
  function getFieldValue(sitio: SitioRecord, fieldId: string): unknown {
    const yearData = getYearData(sitio, currentYear);
    return yearData?.customFields?.[fieldId];
  }

  // Group fields by their groupId
  const fieldsByGroup = $derived(() => {
    const grouped = new Map<string | null, CustomFieldDefinition[]>();

    // Sort definitions by their groupDisplayOrder within groups
    const sortedDefs = [...definitions].sort((a, b) => {
      // If both have same group, sort by groupDisplayOrder
      if (a.groupId === b.groupId) {
        return (a.groupDisplayOrder ?? 0) - (b.groupDisplayOrder ?? 0);
      }
      // Otherwise sort by displayOrder
      return a.displayOrder - b.displayOrder;
    });

    for (const def of sortedDefs) {
      const key = def.groupId ?? null;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(def);
    }

    return grouped;
  });

  // Get groups that have at least one field with data
  const activeGroups = $derived(() => {
    const result: { group: CustomFieldGroup | null; fields: CustomFieldDefinition[] }[] = [];

    // Add groups with fields
    for (const group of groups.toSorted((a, b) => a.displayOrder - b.displayOrder)) {
      const fields = fieldsByGroup().get(group.id) ?? [];
      if (fields.length > 0 && hasGroupData(fields)) {
        result.push({ group, fields });
      }
    }

    // Add uncategorized fields if any
    const uncategorizedFields = fieldsByGroup().get(null) ?? [];
    if (uncategorizedFields.length > 0 && hasGroupData(uncategorizedFields)) {
      result.push({ group: null, fields: uncategorizedFields });
    }

    return result;
  });

  // Check if any fields in a group have data
  function hasGroupData(fields: CustomFieldDefinition[]): boolean {
    for (const def of fields) {
      for (const sitio of sitios) {
        const value = getFieldValue(sitio, def.id);
        if (value !== null && value !== undefined && value !== '') {
          return true;
        }
      }
    }
    return false;
  }

  // Toggle group collapse
  function toggleGroup(groupId: string) {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(groupId)) {
      newSet.delete(groupId);
    } else {
      newSet.add(groupId);
    }
    collapsedGroups = newSet;
  }

  // Get icon component from icon name
  function getGroupIcon(iconName: string | undefined): typeof IconType {
    const iconMap: Record<string, typeof IconType> = {
      Folder,
      Layers,
      Users,
      Building,
      Home,
      Briefcase,
      Heart,
      Shield,
      Leaf,
      Droplet,
      Zap,
      BookOpen,
      Truck,
      Map: MapIcon,
      Activity,
      PieChart,
      Settings,
      Star,
      Target,
      Award
    };
    return iconName && iconMap[iconName] ? iconMap[iconName] : Layers;
  }

  // Get icon colors based on icon name
  function getGroupIconColors(iconName: string | undefined): {
    bgColor: string;
    textColor: string;
    headerBgColor: string;
  } {
    switch (iconName) {
      case 'Users':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-600 dark:text-blue-400',
          headerBgColor: 'bg-blue-50/50 dark:bg-blue-950/30'
        };
      case 'Building':
        return {
          bgColor: 'bg-slate-100 dark:bg-slate-900/30',
          textColor: 'text-slate-600 dark:text-slate-400',
          headerBgColor: 'bg-slate-50/50 dark:bg-slate-950/30'
        };
      case 'Heart':
        return {
          bgColor: 'bg-rose-100 dark:bg-rose-900/30',
          textColor: 'text-rose-600 dark:text-rose-400',
          headerBgColor: 'bg-rose-50/50 dark:bg-rose-950/30'
        };
      case 'GraduationCap':
        return {
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-600 dark:text-amber-400',
          headerBgColor: 'bg-amber-50/50 dark:bg-amber-950/30'
        };
      case 'Landmark':
        return {
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-600 dark:text-purple-400',
          headerBgColor: 'bg-purple-50/50 dark:bg-purple-950/30'
        };
      case 'TreePine':
        return {
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          headerBgColor: 'bg-emerald-50/50 dark:bg-emerald-950/30'
        };
      case 'Briefcase':
        return {
          bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
          textColor: 'text-cyan-600 dark:text-cyan-400',
          headerBgColor: 'bg-cyan-50/50 dark:bg-cyan-950/30'
        };
      case 'Home':
        return {
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-600 dark:text-orange-400',
          headerBgColor: 'bg-orange-50/50 dark:bg-orange-950/30'
        };
      case 'Zap':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          headerBgColor: 'bg-yellow-50/50 dark:bg-yellow-950/30'
        };
      case 'Shield':
        return {
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
          textColor: 'text-indigo-600 dark:text-indigo-400',
          headerBgColor: 'bg-indigo-50/50 dark:bg-indigo-950/30'
        };
      case 'Layers':
      default:
        return {
          bgColor: 'bg-violet-100 dark:bg-violet-900/30',
          textColor: 'text-violet-600 dark:text-violet-400',
          headerBgColor: 'bg-violet-50/50 dark:bg-violet-950/30'
        };
    }
  }

  // Aggregate data for a number field
  function aggregateNumberField(def: CustomFieldDefinition): {
    total: number;
    count: number;
    min: number;
    max: number;
    avg: number;
  } {
    const values: number[] = [];

    for (const sitio of sitios) {
      const value = getFieldValue(sitio, def.id);
      if (typeof value === 'number' && !isNaN(value)) {
        values.push(value);
      }
    }

    if (values.length === 0) {
      return { total: 0, count: 0, min: 0, max: 0, avg: 0 };
    }

    const total = values.reduce((sum, v) => sum + v, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = total / values.length;

    return { total, count: values.length, min, max, avg };
  }

  // Aggregate data for a boolean field
  function aggregateBooleanField(def: CustomFieldDefinition): {
    yes: number;
    no: number;
    notRecorded: number;
  } {
    let yes = 0;
    let no = 0;
    let notRecorded = 0;

    for (const sitio of sitios) {
      const value = getFieldValue(sitio, def.id);
      if (value === true) {
        yes++;
      } else if (value === false) {
        no++;
      } else {
        notRecorded++;
      }
    }

    return { yes, no, notRecorded };
  }

  // Aggregate data for a text field (frequency count)
  function aggregateTextField(def: CustomFieldDefinition): Map<string, number> {
    const counts = new Map<string, number>();

    for (const sitio of sitios) {
      const value = getFieldValue(sitio, def.id);
      if (typeof value === 'string' && value.trim()) {
        const normalized = value.trim();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }

    return counts;
  }

  // Aggregate data for a checkbox field (count per option)
  function aggregateCheckboxField(def: CustomFieldDefinition): Map<string, number> {
    const counts = new Map<string, number>();

    for (const sitio of sitios) {
      const value = getFieldValue(sitio, def.id);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string' && item.trim()) {
            const normalized = item.trim();
            counts.set(normalized, (counts.get(normalized) || 0) + 1);
          }
        }
      }
    }

    return counts;
  }

  // Aggregate data for a radio field (count per option)
  function aggregateRadioField(def: CustomFieldDefinition): Map<string, number> {
    const counts = new Map<string, number>();

    for (const sitio of sitios) {
      const value = getFieldValue(sitio, def.id);
      if (typeof value === 'string' && value.trim()) {
        const normalized = value.trim();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }

    return counts;
  }

  // Aggregate data for an array field (count per item)
  function aggregateArrayField(def: CustomFieldDefinition): Map<string, number> {
    const counts = new Map<string, number>();

    for (const sitio of sitios) {
      const value = getFieldValue(sitio, def.id);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string' && item.trim()) {
            const normalized = item.trim();
            counts.set(normalized, (counts.get(normalized) || 0) + 1);
          }
        }
      }
    }

    return counts;
  }

  // Get display value for aggregation
  function getAggregationValue(def: CustomFieldDefinition): string {
    if (def.dataType !== 'number') return '-';

    const agg = aggregateNumberField(def);
    switch (def.aggregationType) {
      case 'sum':
        return agg.total.toLocaleString();
      case 'average':
        return agg.avg.toFixed(1);
      case 'count':
        return agg.count.toLocaleString();
      case 'min':
        return agg.min.toLocaleString();
      case 'max':
        return agg.max.toLocaleString();
      default:
        return agg.total.toLocaleString();
    }
  }

  // Get color based on aggregation type
  function getAggregationColor(type: CustomFieldDefinition['aggregationType']): string {
    switch (type) {
      case 'sum':
        return 'hsl(217, 91%, 60%)';
      case 'average':
        return 'hsl(280, 70%, 60%)';
      case 'count':
        return 'hsl(142, 71%, 45%)';
      case 'min':
        return 'hsl(189, 85%, 45%)';
      case 'max':
        return 'hsl(24, 95%, 53%)';
      default:
        return 'hsl(217, 91%, 60%)';
    }
  }

  // Get icon for data type
  function getDataTypeIcon(dataType: CustomFieldDefinition['dataType']) {
    switch (dataType) {
      case 'text':
        return Type;
      case 'number':
        return Hash;
      case 'boolean':
        return ToggleLeft;
      case 'date':
        return Calendar;
      case 'array':
        return List;
      case 'checkbox':
        return ListChecks;
      case 'radio':
        return CircleCheck;
      default:
        return Type;
    }
  }

  // Fields configured to show on dashboard via visualizationConfig
  const dashboardEnabledFields = $derived(
    definitions.filter(
      (def) => def.visualizationConfig?.showOnDashboard && def.visualizationConfig?.enableChart
    )
  );

  // Get aggregated chart data for a dashboard-enabled field
  function getDashboardFieldChartData(def: CustomFieldDefinition) {
    return aggregateFieldAcrossSitios(def, sitios, currentYear);
  }

  // Statistics overview
  const statsOverview = $derived(() => {
    const totalFields = definitions.length;
    const sitiosWithData = sitios.filter((sitio) => {
      const yearData = getYearData(sitio, currentYear);
      return yearData?.customFields && Object.keys(yearData.customFields).length > 0;
    }).length;

    return {
      totalFields,
      sitiosWithData,
      coveragePercent: sitios.length > 0 ? Math.round((sitiosWithData / sitios.length) * 100) : 0,
      groupCount: groups.length,
      dashboardChartsCount: dashboardEnabledFields.length
    };
  });

  // Prepare stacked bar data for boolean fields in a group
  function getBooleanStackedData(fields: CustomFieldDefinition[]) {
    const booleanFields = fields.filter((f) => f.dataType === 'boolean');
    if (booleanFields.length === 0) return null;

    const categories = booleanFields.map((def) => def.displayLabel);
    const yesData: number[] = [];
    const noData: number[] = [];
    const naData: number[] = [];

    booleanFields.forEach((def) => {
      const agg = aggregateBooleanField(def);
      yesData.push(agg.yes);
      noData.push(agg.no);
      naData.push(agg.notRecorded);
    });

    return {
      categories,
      series: [
        { name: 'Yes', data: yesData, color: 'hsl(142, 71%, 45%)' },
        { name: 'No', data: noData, color: 'hsl(0, 84%, 60%)' },
        ...(naData.some((v) => v > 0)
          ? [{ name: 'N/A', data: naData, color: 'hsl(220, 9%, 46%)' }]
          : [])
      ]
    };
  }

  // Count fields with data in a group
  function getFieldsWithDataCount(fields: CustomFieldDefinition[]): number {
    return fields.filter((def) => {
      for (const sitio of sitios) {
        const value = getFieldValue(sitio, def.id);
        if (value !== null && value !== undefined && value !== '') {
          return true;
        }
      }
      return false;
    }).length;
  }
</script>

{#if definitions.length === 0}
  <!-- Empty state when no custom fields are defined -->
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center"
  >
    <div
      class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
    >
      <Layers class="size-8" />
    </div>
    <h3 class="mt-4 text-lg font-medium">No Supplementary Data</h3>
    <p class="mt-2 max-w-sm text-sm text-muted-foreground">
      No custom data fields have been configured. Administrators can define supplementary fields in
      Configuration → Custom Fields.
    </p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"
        >
          <Layers class="size-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold">Supplementary Data</h2>
            <Badge variant="secondary" class="text-xs">
              {statsOverview().coveragePercent}% coverage
            </Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            Aggregated custom field data across {sitios.length} sitios
          </p>
        </div>
      </div>
    </div>

    <!-- Overview Stats Row -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardStatCard
        title="Total Fields"
        value={definitions.length.toString()}
        subtitle="Custom fields configured"
        icon={Layers}
        variant="primary"
      />
      <DashboardStatCard
        title="Sitios with Data"
        value={statsOverview().sitiosWithData.toString()}
        subtitle="of {sitios.length} sitios"
        icon={Users}
        variant="success"
      />
      <DashboardStatCard
        title="Field Groups"
        value={groups.length.toString()}
        subtitle="Organized categories"
        icon={Layers}
        variant="warning"
      />
      <DashboardStatCard
        title="Coverage Rate"
        value="{statsOverview().coveragePercent}%"
        subtitle="Data completeness"
        icon={ToggleLeft}
        variant="primary"
      />
    </div>

    <!-- Dashboard-Enabled Charts Section -->
    {#if dashboardEnabledFields.length > 0}
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"
            >
              <BarChart3 class="size-5" />
            </div>
            <div>
              <Card.Title>Custom Field Visualizations</Card.Title>
              <Card.Description>
                Charts configured by administrators for dashboard display
              </Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each dashboardEnabledFields as def (def.id)}
              {@const chartData = getDashboardFieldChartData(def)}
              {@const config = def.visualizationConfig ?? DEFAULT_VISUALIZATION_CONFIG}
              <div class="rounded-lg border bg-card p-4">
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="font-medium">{def.displayLabel}</h4>
                  <Badge variant="secondary" class="text-xs">
                    {AGGREGATION_TYPE_LABELS[def.aggregationType]}
                  </Badge>
                </div>
                {#if def.description}
                  <p class="mb-3 text-xs text-muted-foreground">{def.description}</p>
                {/if}
                {#if chartData.type === 'donut' && chartData.donutData}
                  <DonutChart
                    data={chartData.donutData}
                    height={config.chartHeight}
                    centerLabel="Total"
                    centerValue={chartData.total?.toString() ?? '0'}
                  />
                {:else if chartData.type === 'bar' && chartData.barData}
                  <BarChart data={chartData.barData} height={config.chartHeight} />
                {:else if chartData.type === 'number' && chartData.barData}
                  <div class="flex flex-col items-center justify-center py-6">
                    <p class="text-3xl font-bold text-primary">
                      {chartData.numericValue?.toLocaleString() ?? '0'}
                    </p>
                    <p class="mt-1 text-sm text-muted-foreground">
                      {AGGREGATION_TYPE_LABELS[def.aggregationType]} across {chartData.total} sitios
                    </p>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- Groups with aggregated data -->
    {#if activeGroups().length === 0}
      <div
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center"
      >
        <div
          class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Layers class="size-8" />
        </div>
        <h3 class="mt-4 text-lg font-medium">No Data Recorded</h3>
        <p class="mt-2 max-w-sm text-sm text-muted-foreground">
          Fields are configured but no data has been recorded yet. Data will appear here once sitios
          have supplementary field values.
        </p>
      </div>
    {:else}
      <div class="space-y-6">
        {#each activeGroups() as { group, fields } (group?.id ?? 'uncategorized')}
          {@const groupId = group?.id ?? 'uncategorized'}
          {@const isCollapsed = collapsedGroups.has(groupId)}
          {@const isCollapsible = group?.isCollapsible ?? false}
          {@const iconColors = getGroupIconColors(group?.icon)}
          {@const GroupIcon = getGroupIcon(group?.icon)}
          {@const fieldsWithData = getFieldsWithDataCount(fields)}

          <InfoCard
            title={group?.name ?? 'Other Fields'}
            description={group?.description}
            icon={GroupIcon}
            iconBgColor={iconColors.bgColor}
            iconTextColor={iconColors.textColor}
            headerBgColor={iconColors.headerBgColor}
            badgeText="{fieldsWithData} of {fields.length} fields"
            contentPadding="p-0"
          >
            {#snippet headerAction()}
              {#if isCollapsible}
                <button
                  type="button"
                  class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onclick={() => toggleGroup(groupId)}
                >
                  {#if isCollapsed}
                    <ChevronDown class="size-5" />
                  {:else}
                    <ChevronUp class="size-5" />
                  {/if}
                </button>
              {/if}
            {/snippet}

            <Collapsible.Root open={!isCollapsed}>
              <Collapsible.Content>
                <div class="p-6">
                  <!-- Number Fields in this group -->
                  {#each [fields.filter((f) => f.dataType === 'number')] as numberFields}
                    {#if numberFields.length > 0}
                      <div class="mb-6">
                        <h4
                          class="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
                        >
                          <Hash class="size-4" />
                          Numeric Metrics
                        </h4>
                        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {#each numberFields as def (def.id)}
                            {@const agg = aggregateNumberField(def)}
                            <Card.Root
                              class="group relative overflow-hidden py-0 transition-shadow hover:shadow-md"
                            >
                              <div
                                class="absolute top-0 left-0 h-1 w-full opacity-80"
                                style="background-color: {getAggregationColor(def.aggregationType)}"
                              ></div>
                              <Card.Content class="p-4">
                                <div class="flex items-start justify-between gap-2">
                                  <div class="min-w-0 flex-1">
                                    <p class="truncate text-xs font-medium text-muted-foreground">
                                      {def.displayLabel}
                                    </p>
                                    <p class="mt-1 text-2xl font-bold">
                                      {getAggregationValue(def)}
                                    </p>
                                    <p class="mt-0.5 text-xs text-muted-foreground">
                                      {AGGREGATION_TYPE_LABELS[def.aggregationType]} • {agg.count} sitios
                                    </p>
                                  </div>
                                  {#if def.description}
                                    <HelpTooltip content={def.description} />
                                  {/if}
                                </div>
                                {#if agg.count > 0}
                                  <div
                                    class="mt-3 flex items-center gap-3 border-t pt-2 text-xs text-muted-foreground"
                                  >
                                    <span
                                      >Min: <span class="font-medium text-foreground"
                                        >{agg.min.toLocaleString()}</span
                                      ></span
                                    >
                                    <span
                                      >Max: <span class="font-medium text-foreground"
                                        >{agg.max.toLocaleString()}</span
                                      ></span
                                    >
                                    <span
                                      >Avg: <span class="font-medium text-foreground"
                                        >{agg.avg.toFixed(1)}</span
                                      ></span
                                    >
                                  </div>
                                {/if}
                              </Card.Content>
                            </Card.Root>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}

                  <!-- Boolean Fields in this group -->
                  {#each [fields.filter((f) => f.dataType === 'boolean')] as booleanFields}
                    {#if booleanFields.length > 0}
                      {@const stackedData = getBooleanStackedData(fields)}
                      <div class="mb-6">
                        <h4
                          class="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
                        >
                          <ToggleLeft class="size-4" />
                          Yes/No Indicators
                        </h4>

                        {#if stackedData && stackedData.categories.length > 1}
                          <Card.Root class="mb-4 shadow-sm">
                            <Card.Header class="pb-2">
                              <Card.Title class="text-sm">Response Distribution</Card.Title>
                            </Card.Header>
                            <Card.Content class="pt-2">
                              <StackedBarChart
                                series={stackedData.series}
                                categories={stackedData.categories}
                                height={Math.max(180, stackedData.categories.length * 35)}
                                stacked100={true}
                                orientation="horizontal"
                                showDataLabels={false}
                              />
                            </Card.Content>
                          </Card.Root>
                        {/if}

                        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {#each booleanFields as def (def.id)}
                            {@const agg = aggregateBooleanField(def)}
                            {@const total = agg.yes + agg.no}
                            {@const yesPercent =
                              total > 0 ? ((agg.yes / total) * 100).toFixed(0) : '0'}
                            <Card.Root class="group transition-shadow hover:shadow-md">
                              <Card.Header class="pb-2">
                                <div class="flex items-center justify-between">
                                  <Card.Title class="truncate text-sm font-medium"
                                    >{def.displayLabel}</Card.Title
                                  >
                                  {#if def.description}
                                    <HelpTooltip content={def.description} />
                                  {/if}
                                </div>
                              </Card.Header>
                              <Card.Content>
                                <div class="flex items-center gap-4">
                                  <div class="flex-1">
                                    <DonutChart
                                      data={[
                                        {
                                          label: 'Yes',
                                          value: agg.yes,
                                          color: 'hsl(142, 76%, 36%)'
                                        },
                                        { label: 'No', value: agg.no, color: 'hsl(0, 84%, 60%)' },
                                        ...(agg.notRecorded > 0
                                          ? [
                                              {
                                                label: 'N/A',
                                                value: agg.notRecorded,
                                                color: 'hsl(220, 9%, 46%)'
                                              }
                                            ]
                                          : [])
                                      ]}
                                      height={120}
                                      showLegend={false}
                                    />
                                  </div>
                                  <div class="space-y-1 text-right">
                                    <p
                                      class="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                                    >
                                      {yesPercent}%
                                    </p>
                                    <p class="text-xs text-muted-foreground">
                                      {agg.yes} of {sitios.length}
                                    </p>
                                    <Badge variant="outline" class="text-xs">
                                      {agg.yes} yes • {agg.no} no
                                    </Badge>
                                  </div>
                                </div>
                              </Card.Content>
                            </Card.Root>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}

                  <!-- Text Fields in this group -->
                  {#each [fields.filter((f) => f.dataType === 'text')] as textFields}
                    {#if textFields.length > 0}
                      <div class="mb-6">
                        <h4
                          class="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
                        >
                          <Type class="size-4" />
                          Text Fields
                        </h4>
                        <div class="grid gap-4 sm:grid-cols-2">
                          {#each textFields as def (def.id)}
                            {@const counts = aggregateTextField(def)}
                            {@const sortedEntries = [...counts.entries()]
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)}
                            <Card.Root class="shadow-sm">
                              <Card.Header class="pb-2">
                                <div class="flex items-center justify-between">
                                  <div>
                                    <Card.Title class="text-sm font-medium"
                                      >{def.displayLabel}</Card.Title
                                    >
                                    <Card.Description class="text-xs">
                                      {counts.size} unique values
                                    </Card.Description>
                                  </div>
                                  {#if def.description}
                                    <HelpTooltip content={def.description} />
                                  {/if}
                                </div>
                              </Card.Header>
                              <Card.Content class="pt-2">
                                {#if sortedEntries.length > 0}
                                  <BarChart
                                    data={sortedEntries.map(([label, value]) => ({
                                      label: label.length > 20 ? label.slice(0, 20) + '...' : label,
                                      value
                                    }))}
                                    height={140}
                                    orientation="horizontal"
                                  />
                                {:else}
                                  <div
                                    class="flex flex-col items-center justify-center py-6 text-muted-foreground"
                                  >
                                    <Type class="mb-2 size-8 opacity-50" />
                                    <p class="text-sm">No data recorded</p>
                                  </div>
                                {/if}
                              </Card.Content>
                            </Card.Root>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}

                  <!-- Checkbox Fields in this group -->
                  {#each [fields.filter((f) => f.dataType === 'checkbox')] as checkboxFields}
                    {#if checkboxFields.length > 0}
                      <div class="mb-6">
                        <h4
                          class="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
                        >
                          <ListChecks class="size-4" />
                          Multi-Select Fields
                        </h4>
                        <div class="grid gap-4 sm:grid-cols-2">
                          {#each checkboxFields as def (def.id)}
                            {@const counts = aggregateCheckboxField(def)}
                            {@const sortedEntries = [...counts.entries()]
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 6)}
                            {@const totalSelections = [...counts.values()].reduce(
                              (a, b) => a + b,
                              0
                            )}
                            <Card.Root class="shadow-sm">
                              <Card.Header class="pb-2">
                                <div class="flex items-center justify-between">
                                  <div>
                                    <Card.Title class="text-sm font-medium"
                                      >{def.displayLabel}</Card.Title
                                    >
                                    <Card.Description class="text-xs">
                                      {totalSelections} total selections
                                    </Card.Description>
                                  </div>
                                  {#if def.description}
                                    <HelpTooltip content={def.description} />
                                  {/if}
                                </div>
                              </Card.Header>
                              <Card.Content class="pt-2">
                                {#if sortedEntries.length > 0}
                                  <div class="space-y-3">
                                    <DonutChart
                                      data={sortedEntries.map(([label, value], idx) => ({
                                        label:
                                          label.length > 20 ? label.slice(0, 20) + '...' : label,
                                        value,
                                        color: `hsl(${240 + idx * 25}, 65%, 55%)`
                                      }))}
                                      height={120}
                                      showLegend={false}
                                    />
                                    <div class="mt-3 flex flex-wrap gap-1.5">
                                      {#each sortedEntries.slice(0, 4) as [label, count]}
                                        <Badge variant="secondary" class="text-xs">
                                          {label.length > 15 ? label.slice(0, 15) + '...' : label}: {count}
                                        </Badge>
                                      {/each}
                                      {#if sortedEntries.length > 4}
                                        <Badge variant="outline" class="text-xs"
                                          >+{sortedEntries.length - 4} more</Badge
                                        >
                                      {/if}
                                    </div>
                                  </div>
                                {:else}
                                  <div
                                    class="flex flex-col items-center justify-center py-6 text-muted-foreground"
                                  >
                                    <ListChecks class="mb-2 size-8 opacity-50" />
                                    <p class="text-sm">No selections recorded</p>
                                  </div>
                                {/if}
                              </Card.Content>
                            </Card.Root>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}

                  <!-- Radio Fields in this group -->
                  {#each [fields.filter((f) => f.dataType === 'radio')] as radioFields}
                    {#if radioFields.length > 0}
                      <div class="mb-6">
                        <h4
                          class="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
                        >
                          <CircleCheck class="size-4" />
                          Single Selection Fields
                        </h4>
                        <div class="grid gap-4 sm:grid-cols-2">
                          {#each radioFields as def (def.id)}
                            {@const counts = aggregateRadioField(def)}
                            {@const sortedEntries = [...counts.entries()]
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)}
                            {@const totalResponses = [...counts.values()].reduce(
                              (a, b) => a + b,
                              0
                            )}
                            <Card.Root class="shadow-sm">
                              <Card.Header class="pb-2">
                                <div class="flex items-center justify-between">
                                  <div>
                                    <Card.Title class="text-sm font-medium"
                                      >{def.displayLabel}</Card.Title
                                    >
                                    <Card.Description class="text-xs">
                                      {totalResponses} responses
                                    </Card.Description>
                                  </div>
                                  {#if def.description}
                                    <HelpTooltip content={def.description} />
                                  {/if}
                                </div>
                              </Card.Header>
                              <Card.Content class="pt-2">
                                {#if sortedEntries.length > 0}
                                  <BarChart
                                    data={sortedEntries.map(([label, value]) => ({
                                      label: label.length > 20 ? label.slice(0, 20) + '...' : label,
                                      value
                                    }))}
                                    height={140}
                                    orientation="horizontal"
                                  />
                                {:else}
                                  <div
                                    class="flex flex-col items-center justify-center py-6 text-muted-foreground"
                                  >
                                    <CircleCheck class="mb-2 size-8 opacity-50" />
                                    <p class="text-sm">No selections recorded</p>
                                  </div>
                                {/if}
                              </Card.Content>
                            </Card.Root>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}

                  <!-- Array/List Fields in this group -->
                  {#each [fields.filter((f) => f.dataType === 'array')] as arrayFields}
                    {#if arrayFields.length > 0}
                      <div>
                        <h4
                          class="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
                        >
                          <List class="size-4" />
                          List Fields
                        </h4>
                        <div class="grid gap-4 sm:grid-cols-2">
                          {#each arrayFields as def (def.id)}
                            {@const counts = aggregateArrayField(def)}
                            {@const sortedEntries = [...counts.entries()]
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 8)}
                            {@const totalItems = [...counts.values()].reduce((a, b) => a + b, 0)}
                            <Card.Root class="shadow-sm">
                              <Card.Header class="pb-2">
                                <div class="flex items-center justify-between">
                                  <div>
                                    <Card.Title class="text-sm font-medium"
                                      >{def.displayLabel}</Card.Title
                                    >
                                    <Card.Description class="text-xs">
                                      {counts.size} unique items, {totalItems} total
                                    </Card.Description>
                                  </div>
                                  {#if def.description}
                                    <HelpTooltip content={def.description} />
                                  {/if}
                                </div>
                              </Card.Header>
                              <Card.Content class="pt-2">
                                {#if sortedEntries.length > 0}
                                  <div class="space-y-2">
                                    {#each sortedEntries as [item, count], idx}
                                      <div
                                        class="flex items-center justify-between rounded-lg bg-teal-50/50 px-3 py-2 dark:bg-teal-950/30"
                                      >
                                        <div class="flex items-center gap-2">
                                          <span
                                            class="flex size-5 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
                                          >
                                            {idx + 1}
                                          </span>
                                          <span class="text-sm">
                                            {item.length > 25 ? item.slice(0, 25) + '...' : item}
                                          </span>
                                        </div>
                                        <Badge variant="secondary" class="text-xs">
                                          {count} sitio{count !== 1 ? 's' : ''}
                                        </Badge>
                                      </div>
                                    {/each}
                                    {#if counts.size > 8}
                                      <p class="text-center text-xs text-muted-foreground">
                                        +{counts.size - 8} more items
                                      </p>
                                    {/if}
                                  </div>
                                {:else}
                                  <div
                                    class="flex flex-col items-center justify-center py-6 text-muted-foreground"
                                  >
                                    <List class="mb-2 size-8 opacity-50" />
                                    <p class="text-sm">No list items recorded</p>
                                  </div>
                                {/if}
                              </Card.Content>
                            </Card.Root>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </InfoCard>
        {/each}
      </div>
    {/if}
  </div>
{/if}
