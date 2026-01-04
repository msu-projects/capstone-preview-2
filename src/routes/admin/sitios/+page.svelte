<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import CsvImportDialog from '$lib/components/admin/sitios/CsvImportDialog.svelte';
  import SitioListDisplay from '$lib/components/sitios/SitioListDisplay.svelte';
  import SitioListFilters from '$lib/components/sitios/SitioListFilters.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { SitioProfile, SitioRecord } from '$lib/types';
  import {
    buildURLWithConfig,
    hasActiveFilters as checkHasActiveFilters,
    parseListConfigFromURL,
    prepareSitiosForSort,
    processSitios
  } from '$lib/utils/sitio-sorting';
  import { deleteSitio, loadSitios, updateSitio } from '$lib/utils/storage';
  import {
    Building2,
    CalendarPlus,
    Copy,
    FileSpreadsheet,
    House,
    MapPin,
    Plus,
    Trash2,
    Users
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    data: {
      municipality: string;
      barangay: string;
      tab: string;
    };
  }

  let { data }: Props = $props();

  // Permission check
  const canCreateSitio = $derived(authStore.canCreateSitio());

  // State
  let sitios = $state<SitioRecord[]>([]);
  let currentPage = $state(1);
  let itemsPerPage = $state(10);

  // Parse list config from URL
  const listConfig = $derived.by(() => {
    return parseListConfigFromURL($page.url.searchParams);
  });

  // Dialog states
  let isDeleteDialogOpen = $state(false);
  let isManageYearsDialogOpen = $state(false);
  let isCsvImportDialogOpen = $state(false);
  let selectedSitio = $state<SitioRecord | null>(null);
  let newYearToAdd = $state<number>(new Date().getFullYear());
  let copyFromYear = $state<string>('none');

  // Prepare sitios with profile data
  const sitiosWithProfile = $derived(prepareSitiosForSort(sitios, 'latest'));

  // Process sitios (filter + sort)
  const processedSitios = $derived(processSitios(sitiosWithProfile, listConfig));

  // Pagination
  const totalPages = $derived(Math.ceil(processedSitios.length / itemsPerPage));
  const paginatedSitios = $derived(
    processedSitios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  );

  // Check if filters are active
  const hasActiveFilters = $derived(checkHasActiveFilters(listConfig));

  // Stats (computed from all sitios, not filtered)
  const stats = $derived.by(() => {
    const uniqueMunicipalities = new Set(sitios.map((s) => s.municipality));
    const uniqueBarangays = new Set(sitios.map((s) => s.barangay));

    // Get totals from processed sitios
    const totalPopulation = sitiosWithProfile.reduce(
      (sum, s) => sum + (s.profile.totalPopulation ?? 0),
      0
    );
    const totalHouseholds = sitiosWithProfile.reduce(
      (sum, s) => sum + (s.profile.totalHouseholds ?? 0),
      0
    );

    return {
      totalSitios: sitios.length,
      municipalities: uniqueMunicipalities.size,
      barangays: uniqueBarangays.size,
      totalPopulation,
      totalHouseholds
    };
  });

  // Load data
  onMount(() => {
    refreshData();
  });

  function refreshData() {
    sitios = loadSitios();
    currentPage = 1;
  }

  function handleEdit(id: number) {
    goto(`/admin/sitios/${id}/edit`);
  }

  function handleDelete(id: number) {
    selectedSitio = sitios.find((s) => s.id === id) || null;
    isDeleteDialogOpen = true;
  }

  function confirmDelete() {
    if (!selectedSitio) return;

    const success = deleteSitio(selectedSitio.id);
    if (success) {
      toast.success(`Sitio "${selectedSitio.sitioName}" deleted successfully`);
      refreshData();
    } else {
      toast.error('Failed to delete sitio');
    }
    isDeleteDialogOpen = false;
    selectedSitio = null;
  }

  function handleDownloadPDF(id: number) {
    // PDF generation - would integrate with pdf-generator.ts
    toast.info('PDF generation coming soon');
  }

  function handleManageYears(id: number) {
    const sitio = sitios.find((s) => s.id === id);
    if (sitio) {
      openManageYears(sitio);
    }
  }

  function handleCsvImportComplete(results: {
    totalProcessed: number;
    successful: number;
    byYear: Record<number, { count: number }>;
  }) {
    // Refresh data after import
    refreshData();
    const yearSummary = Object.entries(results.byYear)
      .map(([year, data]) => `${year}: ${data.count}`)
      .join(', ');
    toast.success(`Imported ${results.successful} records (${yearSummary})`);
  }

  function openManageYears(sitio: SitioRecord) {
    selectedSitio = sitio;
    newYearToAdd = new Date().getFullYear();
    copyFromYear = 'none';
    isManageYearsDialogOpen = true;
  }

  function addYearToSitio() {
    if (!selectedSitio) return;

    // Check if year already exists
    if (selectedSitio.availableYears.includes(newYearToAdd)) {
      toast.error(`Year ${newYearToAdd} already exists for this sitio`);
      return;
    }

    // Create new year data
    let newYearData: SitioProfile;

    if (copyFromYear !== 'none' && selectedSitio.yearlyData[copyFromYear]) {
      // Copy from existing year
      newYearData = JSON.parse(JSON.stringify(selectedSitio.yearlyData[copyFromYear]));
    } else {
      // Create empty profile with basic info from sitio
      newYearData = createEmptyProfile(selectedSitio);
    }

    // Update sitio
    const updatedYearlyData = {
      ...selectedSitio.yearlyData,
      [newYearToAdd.toString()]: newYearData
    };
    const updatedAvailableYears = [...selectedSitio.availableYears, newYearToAdd].sort(
      (a, b) => b - a
    );

    const success = updateSitio(selectedSitio.id, {
      yearlyData: updatedYearlyData,
      availableYears: updatedAvailableYears,
      updatedAt: new Date().toISOString()
    });

    if (success) {
      toast.success(`Added year ${newYearToAdd} to "${selectedSitio.sitioName}"`);
      refreshData();
      // Update selected sitio reference
      selectedSitio = sitios.find((s) => s.id === selectedSitio?.id) || null;
    } else {
      toast.error('Failed to add year');
    }
  }

  function removeYearFromSitio(year: number) {
    if (!selectedSitio) return;

    // Prevent removing last year
    if (selectedSitio.availableYears.length <= 1) {
      toast.error('Cannot remove the last year. A sitio must have at least one year of data.');
      return;
    }

    const { [year.toString()]: removed, ...remainingYearlyData } = selectedSitio.yearlyData;
    const updatedAvailableYears = selectedSitio.availableYears.filter((y) => y !== year);

    const success = updateSitio(selectedSitio.id, {
      yearlyData: remainingYearlyData,
      availableYears: updatedAvailableYears,
      updatedAt: new Date().toISOString()
    });

    if (success) {
      toast.success(`Removed year ${year} from "${selectedSitio.sitioName}"`);
      refreshData();
      selectedSitio = sitios.find((s) => s.id === selectedSitio?.id) || null;
    } else {
      toast.error('Failed to remove year');
    }
  }

  function createEmptyProfile(sitio: SitioRecord): SitioProfile {
    return {
      municipality: sitio.municipality,
      barangay: sitio.barangay,
      sitioName: sitio.sitioName,
      sitioCode: sitio.coding,
      latitude: sitio.latitude,
      longitude: sitio.longitude,
      sitioClassification: { ...sitio.sitioClassification },
      mainAccess: { pavedRoad: false, unpavedRoad: false, footpath: false, boat: false },
      totalPopulation: 0,
      totalHouseholds: 0,
      registeredVoters: 0,
      laborForceCount: 0,
      schoolAgeChildren: 0,
      population: { totalMale: 0, totalFemale: 0 },
      vulnerableGroups: {
        muslimCount: 0,
        ipCount: 0,
        seniorsCount: 0,
        laborForce60to64Count: 0,
        unemployedCount: 0,
        noBirthCertCount: 0,
        noNationalIDCount: 0,
        outOfSchoolYouth: 0
      },
      householdsWithToilet: 0,
      householdsWithElectricity: 0,
      electricitySources: { grid: 0, solar: 0, battery: 0, generator: 0 },
      mobileSignal: 'none',
      householdsWithInternet: 0,
      facilities: {
        healthCenter: { exists: 'no' },
        pharmacy: { exists: 'no' },
        communityToilet: { exists: 'no' },
        kindergarten: { exists: 'no' },
        elementarySchool: { exists: 'no' },
        highSchool: { exists: 'no' },
        madrasah: { exists: 'no' },
        market: { exists: 'no' }
      },
      infrastructure: {
        asphalt: { exists: 'no' },
        concrete: { exists: 'no' },
        gravel: { exists: 'no' },
        natural: { exists: 'no' }
      },
      studentsPerRoom: 'less_than_46',
      waterSources: {
        natural: { exists: 'no' },
        level1: { exists: 'no' },
        level2: { exists: 'no' },
        level3: { exists: 'no' }
      },
      sanitationTypes: {
        waterSealed: false,
        pitLatrine: false,
        communityCR: false,
        openDefecation: false
      },
      workerClass: {
        privateHousehold: 0,
        privateEstablishment: 0,
        government: 0,
        selfEmployed: 0,
        employer: 0,
        ofw: 0
      },
      averageDailyIncome: 0,
      agriculture: {
        numberOfFarmers: 0,
        numberOfAssociations: 0,
        estimatedFarmAreaHectares: 0
      },
      crops: [],
      livestock: [],
      pets: {
        catsCount: 0,
        dogsCount: 0,
        vaccinatedCats: 0,
        vaccinatedDogs: 0
      },
      backyardGardens: {
        householdsWithGardens: 0,
        commonCrops: [] as import('$lib/types/sitio-profile').BackyardCropCategory[]
      },
      hazards: {
        flood: { frequency: 0 },
        landslide: { frequency: 0 },
        drought: { frequency: 0 },
        earthquake: { frequency: 0 }
      },
      foodSecurity: 'secure',
      priorities: [
        { name: 'waterSystem', rating: 0 },
        { name: 'communityCR', rating: 0 },
        { name: 'solarStreetLights', rating: 0 },
        { name: 'roadOpening', rating: 0 },
        { name: 'farmTools', rating: 0 },
        { name: 'healthServices', rating: 0 },
        { name: 'educationSupport', rating: 0 }
      ],
      averageNeedScore: 0,
      recommendations: []
    };
  }
</script>

<svelte:head>
  <title>Sitios Management - South Cotabato Data Bank</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-muted/30">
  <!-- Header -->
  <AdminHeader title="Sitios Management" description="Manage sitio records and yearly data">
    {#snippet actions()}
      {#if canCreateSitio}
        <Button variant="outline" size="sm" onclick={() => (isCsvImportDialogOpen = true)}>
          <FileSpreadsheet class="size-4 sm:mr-2" />
          <span class="hidden sm:inline">Import CSV</span>
        </Button>
        <Button href="/admin/sitios/new" size="sm">
          <Plus class="size-4 sm:mr-2" />
          <span class="hidden sm:inline">Add Sitio</span>
        </Button>
      {/if}
    {/snippet}
  </AdminHeader>

  <!-- Content -->
  <div class="flex-1 space-y-6 p-4 md:p-6">
    <!-- Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Content class="flex items-center gap-4">
          <div class="rounded-lg bg-primary/10 p-3">
            <MapPin class="size-5 text-primary" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total Sitios</p>
            <p class="text-2xl font-bold">{stats.totalSitios}</p>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="flex items-center gap-4">
          <div class="rounded-lg bg-blue-500/10 p-3">
            <Building2 class="size-5 text-blue-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Municipalities</p>
            <p class="text-2xl font-bold">{stats.municipalities}</p>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="flex items-center gap-4">
          <div class="rounded-lg bg-purple-500/10 p-3">
            <Users class="size-5 text-purple-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total Population</p>
            <p class="text-2xl font-bold">{stats.totalPopulation.toLocaleString()}</p>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="flex items-center gap-4">
          <div class="rounded-lg bg-green-500/10 p-3">
            <House class="size-5 text-green-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total Households</p>
            <p class="text-2xl font-bold">{stats.totalHouseholds.toLocaleString()}</p>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Filters and Sort -->
    <SitioListFilters
      config={listConfig}
      onConfigChange={(newConfig) => goto(buildURLWithConfig('/admin/sitios', newConfig))}
      basePath="/admin/sitios"
      mode="admin"
    />

    <!-- Sitios Display -->
    <SitioListDisplay
      sitios={paginatedSitios}
      totalCount={processedSitios.length}
      bind:currentPage
      {itemsPerPage}
      {totalPages}
      selectedIndicators={listConfig.sortIndicators}
      mode="admin"
      {hasActiveFilters}
      onRefresh={refreshData}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onManageYears={handleManageYears}
      onDownloadPDF={handleDownloadPDF}
    />
  </div>
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Sitio</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete "{selectedSitio?.sitioName}"? This will permanently remove
        all data for this sitio including all yearly records. This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={confirmDelete}
        class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
      >
        Delete Sitio
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Manage Years Dialog -->
<Dialog.Root bind:open={isManageYearsDialogOpen}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Manage Years</Dialog.Title>
      <Dialog.Description>
        Add or remove yearly data for "{selectedSitio?.sitioName}"
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-6 py-4">
      <!-- Current Years -->
      <div class="space-y-3">
        <Label class="text-sm font-medium">Current Years</Label>
        {#if selectedSitio && selectedSitio.availableYears.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each selectedSitio.availableYears.sort((a, b) => b - a) as year}
              <Badge variant="secondary" class="gap-1.5 py-1.5 pr-1.5 pl-3">
                {year}
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-5 hover:bg-destructive/20"
                  onclick={() => removeYearFromSitio(year)}
                  disabled={selectedSitio.availableYears.length <= 1}
                >
                  <Trash2 class="size-3" />
                </Button>
              </Badge>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-muted-foreground">No years available</p>
        {/if}
      </div>

      <!-- Add New Year -->
      <div class="space-y-3 border-t pt-4">
        <Label class="text-sm font-medium">Add New Year</Label>
        <div class="flex gap-2">
          <Input type="number" bind:value={newYearToAdd} min={1900} max={2100} class="w-24" />
          <Select.Root type="single" bind:value={copyFromYear}>
            <Select.Trigger class="flex-1">
              <Copy class="mr-2 size-4" />
              {copyFromYear === 'none' ? 'Start fresh' : `Copy from ${copyFromYear}`}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="none">Start with empty data</Select.Item>
              {#if selectedSitio}
                {#each selectedSitio.availableYears.sort((a, b) => b - a) as year}
                  <Select.Item value={year.toString()}>Copy from {year}</Select.Item>
                {/each}
              {/if}
            </Select.Content>
          </Select.Root>
        </div>
        <Button onclick={addYearToSitio} class="w-full">
          <CalendarPlus class="mr-2 size-4" />
          Add Year {newYearToAdd}
        </Button>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isManageYearsDialogOpen = false)}>Done</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- CSV Import Dialog -->
<CsvImportDialog bind:open={isCsvImportDialogOpen} onImportComplete={handleCsvImportComplete} />
