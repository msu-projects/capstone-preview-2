<script lang="ts">
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { getBarangaysForMunicipality, getMunicipalities } from '$lib/config/location-data';
  import type { SitioRecord } from '$lib/types';
  import type { ReportFilters } from '$lib/types/report';
  import { getAllAvailableYears } from '$lib/utils/sitio-chart-aggregation';

  interface Props {
    filters: ReportFilters;
    sitios: SitioRecord[];
    onfilterschange?: (filters: ReportFilters) => void;
  }

  let { filters = $bindable(), sitios, onfilterschange }: Props = $props();

  // Get available years from sitios data
  const availableYears = $derived(getAllAvailableYears(sitios).sort((a, b) => b - a));
  const municipalities = getMunicipalities();

  // Get barangays for selected municipality
  const barangays = $derived(
    filters.municipality ? getBarangaysForMunicipality(filters.municipality) : []
  );

  // Get sitios available for selected municipality and barangay
  const availableSitios = $derived(() => {
    if (!filters.municipality || !filters.barangay) return [];
    return sitios
      .filter(
        (sitio) =>
          sitio.municipality === filters.municipality && sitio.barangay === filters.barangay
      )
      .sort((a, b) => a.sitioName.localeCompare(b.sitioName));
  });

  function updateYear(value: string | undefined) {
    if (value) {
      filters = { ...filters, year: parseInt(value) };
      onfilterschange?.(filters);
    }
  }

  function updateMunicipality(value: string | undefined) {
    filters = {
      ...filters,
      municipality: value || undefined,
      barangay: undefined, // Reset barangay when municipality changes
      sitioCoding: undefined // Reset sitio when municipality changes
    };
    onfilterschange?.(filters);
  }

  function updateBarangay(value: string | undefined) {
    filters = {
      ...filters,
      barangay: value || undefined,
      sitioCoding: undefined // Reset sitio when barangay changes
    };
    onfilterschange?.(filters);
  }

  function updateSitio(value: string | undefined) {
    filters = { ...filters, sitioCoding: value || undefined };
    onfilterschange?.(filters);
  }

  // Get the selected sitio name for display
  const selectedSitioName = $derived(() => {
    if (!filters.sitioCoding) return null;
    const sitio = sitios.find((s) => s.coding === filters.sitioCoding);
    return sitio?.sitioName ?? null;
  });
</script>

<div class="space-y-6">
  <!-- Year Selection -->
  <div class="space-y-4">
    <h3 class="text-sm font-medium">Data Year</h3>
    <div class="space-y-2">
      <Label for="year">Report Year</Label>
      <Select.Root type="single" value={filters.year.toString()} onValueChange={updateYear}>
        <Select.Trigger id="year" class="w-full">
          {filters.year}
        </Select.Trigger>
        <Select.Content>
          {#each availableYears as year}
            <Select.Item value={year.toString()}>{year}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <p class="text-xs text-muted-foreground">Generate report with data as of this year</p>
    </div>
  </div>

  <!-- Geographic Filters -->
  <div class="space-y-4">
    <h3 class="text-sm font-medium">Geographic Scope</h3>
    <p class="text-xs text-muted-foreground">
      Leave blank to aggregate all data. Select a location to narrow down the scope.
    </p>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <Label for="municipality">Municipality</Label>
        <Select.Root
          type="single"
          value={filters.municipality ?? ''}
          onValueChange={updateMunicipality}
        >
          <Select.Trigger id="municipality" class="w-full">
            {filters.municipality ?? 'All Municipalities'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">All Municipalities</Select.Item>
            {#each municipalities as municipality}
              <Select.Item value={municipality}>{municipality}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <Label for="barangay">Barangay</Label>
        <Select.Root
          type="single"
          value={filters.barangay ?? ''}
          onValueChange={updateBarangay}
          disabled={!filters.municipality}
        >
          <Select.Trigger id="barangay" class="w-full">
            {filters.barangay ?? 'All Barangays'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">All Barangays</Select.Item>
            {#each barangays as barangay}
              <Select.Item value={barangay}>{barangay}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <!-- Sitio Selection (only shown when municipality and barangay are selected) -->
    {#if filters.municipality && filters.barangay}
      <div class="space-y-2">
        <Label for="sitio">Sitio (Optional)</Label>
        <Select.Root
          type="single"
          value={filters.sitioCoding ?? ''}
          onValueChange={updateSitio}
          disabled={availableSitios().length === 0}
        >
          <Select.Trigger id="sitio" class="w-full">
            {selectedSitioName() ?? 'All Sitios (Aggregated)'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">All Sitios (Aggregated)</Select.Item>
            {#each availableSitios() as sitio}
              <Select.Item value={sitio.coding}>{sitio.sitioName}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <p class="text-xs text-muted-foreground">
          {#if availableSitios().length === 0}
            No sitios found for this location
          {:else if filters.sitioCoding}
            Generate individual sitio profile report
          {:else}
            Select a sitio to generate an individual profile report instead of aggregated data
          {/if}
        </p>
      </div>
    {/if}
  </div>
</div>
