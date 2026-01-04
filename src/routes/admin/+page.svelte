<script lang="ts">
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import ActivityFeed from '$lib/components/admin/dashboard/ActivityFeed.svelte';
  import {
    DashboardEmptyState,
    SitioDashboardDemographics,
    SitioDashboardEconomic,
    SitioDashboardInfrastructure,
    SitioDashboardMaps,
    SitioDashboardOverview,
    SitioDashboardSupplementary
  } from '$lib/components/public/dashboard';
  import { DashboardSkeleton } from '$lib/components/sitios/dashboard';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';
  import * as Tabs from '$lib/components/ui/tabs';
  import type { SitioRecord } from '$lib/types';
  import { loadAuditLogs } from '$lib/utils/audit';
  import toTitleCase from '$lib/utils/common';
  import { getActiveCustomFieldDefinitions } from '$lib/utils/custom-fields-storage';
  import { getAllAvailableYears } from '$lib/utils/sitio-chart-aggregation';
  import { loadSitios } from '$lib/utils/storage';
  import {
    Activity,
    Building2,
    Calendar,
    FileText,
    Layers,
    Map,
    MapPin,
    TrendingUp,
    Users,
    X
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let sitios = $state<SitioRecord[]>([]);
  let isLoading = $state(true);
  let hasActiveCustomFields = $state(false);

  // Filter state
  let selectedMunicipality = $state('all');
  let selectedBarangay = $state('all');
  let activeTab = $state('overview');
  let selectedYear = $state('latest');

  // Recent activities from audit logs
  const recentActivities = loadAuditLogs().reverse().slice(0, 10);

  onMount(() => {
    sitios = loadSitios();
    hasActiveCustomFields = getActiveCustomFieldDefinitions().length > 0;
    isLoading = false;
  });

  // Get available years from sitios
  const availableYears = $derived(() => {
    const years = getAllAvailableYears(sitios);
    return years.length > 0 ? years : [new Date().getFullYear()];
  });

  // Derived values for filter options
  let uniqueMunicipalities = $derived(
    Array.from(new Set(sitios.map((s) => s.municipality))).sort()
  );
  let uniqueBarangays = $derived(
    Array.from(
      new Set(
        sitios
          .filter((s) => selectedMunicipality === 'all' || s.municipality === selectedMunicipality)
          .map((s) => s.barangay)
      )
    ).sort()
  );

  // Filter sitios based on selections
  const filteredSitios = $derived.by(() => {
    return sitios.filter((s) => {
      if (selectedMunicipality !== 'all' && s.municipality !== selectedMunicipality) {
        return false;
      }
      if (selectedBarangay !== 'all' && s.barangay !== selectedBarangay) {
        return false;
      }
      return true;
    });
  });

  // Create filter label for display
  const filterLabel = $derived.by(() => {
    if (selectedMunicipality === 'all') return 'All Sitios';
    if (selectedBarangay === 'all') return selectedMunicipality;
    return `${selectedBarangay}, ${selectedMunicipality}`;
  });

  // Check if filters are active
  const hasActiveFilters = $derived(selectedMunicipality !== 'all' || selectedBarangay !== 'all');

  // Handle filter changes
  function handleMunicipalityChange(value: string | undefined) {
    selectedMunicipality = value || 'all';
    selectedBarangay = 'all'; // Reset barangay when municipality changes
  }

  function handleBarangayChange(value: string | undefined) {
    selectedBarangay = value || 'all';
  }

  function handleTabChange(value: string) {
    activeTab = value;
  }

  function handleYearChange(value: string | undefined) {
    selectedYear = value || 'latest';
  }

  function clearFilters() {
    selectedMunicipality = 'all';
    selectedBarangay = 'all';
  }

  function handleSitioClick(sitioId: number) {
    window.location.href = `/admin/sitios/${sitioId}`;
  }

  // Tab configuration - conditionally include supplementary tab
  const baseTabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'infrastructure', label: 'Infrastructure', icon: Building2 },
    { id: 'economic', label: 'Economic', icon: TrendingUp }
  ];

  const tabs = $derived([
    ...baseTabs,
    ...(hasActiveCustomFields
      ? [{ id: 'supplementary', label: 'Supplementary', icon: Layers }]
      : []),
    { id: 'maps', label: 'Maps', icon: Map },
    { id: 'activity', label: 'Activity', icon: Activity }
  ]);

  // Selected year as number for components
  const selectedYearNumber = $derived.by(() => {
    if (selectedYear === 'latest') {
      return availableYears()[0];
    }
    return parseInt(selectedYear, 10);
  });
</script>

<svelte:head>
  <title>Admin Dashboard - South Cotabato Data Bank</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-muted/30">
  <!-- Header -->
  <AdminHeader title="Dashboard" description="Overview of sitios, community data, and activities">
    <!-- {#snippet actions()}
      {#if authStore.canPerform('sitios', 'write')}
        <Button size="sm" href="/admin/sitios/new">
          <Plus class="size-4 sm:mr-2" />
          <span class="hidden sm:inline">New Sitio</span>
        </Button>
      {/if}
    {/snippet} -->
  </AdminHeader>

  <!-- Content -->
  <div class="flex-1 space-y-6 p-4 md:p-6">
    <!-- Filter Bar -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Municipality Filter -->
        <Select.Root
          type="single"
          value={selectedMunicipality}
          onValueChange={handleMunicipalityChange}
        >
          <Select.Trigger class="w-full sm:w-45">
            {selectedMunicipality === 'all' ? 'All Municipalities' : selectedMunicipality}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Municipalities</Select.Item>
            {#each uniqueMunicipalities as municipality}
              <Select.Item value={municipality}>{municipality}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <!-- Barangay Filter -->
        <Select.Root type="single" value={selectedBarangay} onValueChange={handleBarangayChange}>
          <Select.Trigger class="w-full sm:w-45">
            {selectedBarangay === 'all' ? 'All Barangays' : selectedBarangay}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Barangays</Select.Item>
            {#each uniqueBarangays as barangay}
              <Select.Item value={barangay}>{barangay}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <!-- Year Filter -->
        <Select.Root type="single" value={selectedYear} onValueChange={handleYearChange}>
          <Select.Trigger class="w-full sm:w-36">
            <Calendar class="mr-2 size-4" />
            {selectedYear === 'latest' ? 'Latest Year' : selectedYear}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="latest">Latest Year</Select.Item>
            {#each availableYears() as year}
              <Select.Item value={year.toString()}>{year}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <!-- Clear Filters -->
        {#if hasActiveFilters}
          <Button variant="ghost" size="sm" onclick={clearFilters} class="gap-1.5">
            <X class="size-4" />
            Clear Filters
          </Button>
        {/if}
      </div>

      <div class="flex items-center gap-3">
        <!-- Current filter label -->
        {#if hasActiveFilters}
          <Badge variant="secondary" class="gap-1.5">
            <MapPin class="size-3" />
            {toTitleCase(filterLabel)}
          </Badge>
        {/if}
        <!-- Sitio count -->
        <Badge variant="outline" class="gap-1.5">
          {filteredSitios.length} sitios
        </Badge>
      </div>
    </div>

    {#if isLoading}
      <DashboardSkeleton />
    {:else if filteredSitios.length === 0}
      <!-- Empty State -->
      <DashboardEmptyState onClearFilters={clearFilters} />
    {:else}
      <!-- Tabs -->
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <div
          class="sticky top-0 z-40 -mx-4 bg-muted/30 px-4 pt-2 pb-2 backdrop-blur-sm md:-mx-6 md:px-6"
        >
          <Tabs.List
            class="inline-flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-background p-1.5 shadow-sm ring-1 ring-border/50"
          >
            {#each tabs as tab}
              <Tabs.Trigger
                value={tab.id}
                class="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <tab.icon class="size-4" />
                <span class="hidden sm:inline">{tab.label}</span>
              </Tabs.Trigger>
            {/each}
          </Tabs.List>
        </div>

        <div class="mt-6">
          <!-- Tab Contents -->
          <Tabs.Content value="overview">
            <SitioDashboardOverview sitios={filteredSitios} selectedYear={selectedYearNumber} />
          </Tabs.Content>

          <Tabs.Content value="demographics">
            <SitioDashboardDemographics sitios={filteredSitios} selectedYear={selectedYearNumber} />
          </Tabs.Content>

          <Tabs.Content value="infrastructure">
            <SitioDashboardInfrastructure
              sitios={filteredSitios}
              selectedYear={selectedYearNumber}
            />
          </Tabs.Content>

          <Tabs.Content value="economic">
            <SitioDashboardEconomic sitios={filteredSitios} selectedYear={selectedYearNumber} />
          </Tabs.Content>

          <Tabs.Content value="maps">
            <SitioDashboardMaps
              sitios={filteredSitios}
              selectedYear={selectedYearNumber}
              onSitioClick={handleSitioClick}
            />
          </Tabs.Content>

          {#if hasActiveCustomFields}
            <Tabs.Content value="supplementary">
              <SitioDashboardSupplementary
                sitios={filteredSitios}
                selectedYear={selectedYearNumber}
              />
            </Tabs.Content>
          {/if}

          <Tabs.Content value="activity">
            <div class="grid gap-6 lg:grid-cols-1">
              <ActivityFeed activities={recentActivities} isLoading={false} />
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    {/if}
  </div>
</div>
