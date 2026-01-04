<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import CsvImportDialog from '$lib/components/admin/sitios/CsvImportDialog.svelte';
  import SitiosTable from '$lib/components/admin/sitios/SitiosTable.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { getBarangaysForMunicipality, getMunicipalities } from '$lib/config/location-data';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { SitioProfile, SitioRecord } from '$lib/types';
  import { deleteSitio, loadSitios, updateSitio } from '$lib/utils/storage';
  import {
    Building2,
    CalendarPlus,
    Copy,
    FileSpreadsheet,
    FilterX,
    House,
    MapPin,
    Plus,
    RefreshCw,
    Search,
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

  // Initialize with data values
  const initialMunicipality = $derived(data.municipality || 'all');
  const initialBarangay = $derived(data.barangay || 'all');

  // State
  let sitios = $state<SitioRecord[]>([]);
  let searchQuery = $state('');
  let municipalityFilter = $derived(initialMunicipality);
  let barangayFilter = $derived(initialBarangay);
  let selectedYear = $state<string>('latest');
  let currentPage = $state(1);
  let itemsPerPage = $state(10);
  let sortBy = $state<'name' | 'municipality' | 'barangay' | 'population' | 'households'>('name');
  let sortOrder = $state<'asc' | 'desc'>('asc');

  // Dialog states
  let isDeleteDialogOpen = $state(false);
  let isManageYearsDialogOpen = $state(false);
  let isCsvImportDialogOpen = $state(false);
  let selectedSitio = $state<SitioRecord | null>(null);
  let newYearToAdd = $state<number>(new Date().getFullYear());
  let copyFromYear = $state<string>('none');

  // Derived values
  const municipalities = $derived(getMunicipalities());
  const barangays = $derived(
    municipalityFilter !== 'all' ? getBarangaysForMunicipality(municipalityFilter) : []
  );

  // Get all available years across all sitios
  const allAvailableYears = $derived.by(() => {
    const yearsSet = new Set<number>();
    sitios.forEach((sitio) => {
      sitio.availableYears.forEach((year) => yearsSet.add(year));
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  });

  // Extended sitio type for display
  interface SitioDisplay extends SitioRecord {
    name?: string;
    population?: number;
    households?: number;
  }

  // Filter and transform sitios
  const filteredSitios = $derived.by(() => {
    let result = sitios.filter((sitio) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          sitio.sitioName.toLowerCase().includes(query) ||
          sitio.barangay.toLowerCase().includes(query) ||
          sitio.municipality.toLowerCase().includes(query) ||
          sitio.coding.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Municipality filter
      if (municipalityFilter !== 'all' && sitio.municipality !== municipalityFilter) return false;

      // Barangay filter
      if (barangayFilter !== 'all' && sitio.barangay !== barangayFilter) return false;

      // Year filter - only show sitios that have data for selected year
      if (selectedYear !== 'latest' && selectedYear !== 'all') {
        if (!sitio.availableYears.includes(parseInt(selectedYear))) return false;
      }

      return true;
    });

    return result;
  });

  // Transform sitios with computed display values
  const displaySitios = $derived.by(() => {
    const targetYear =
      selectedYear === 'latest' || selectedYear === 'all' ? null : parseInt(selectedYear);

    return filteredSitios.map((sitio): SitioDisplay => {
      // Get the year to use for data
      const yearToUse = targetYear
        ? targetYear.toString()
        : sitio.availableYears.length > 0
          ? Math.max(...sitio.availableYears).toString()
          : null;

      const yearData = yearToUse ? sitio.yearlyData[yearToUse] : null;

      return {
        ...sitio,
        name: sitio.sitioName,
        population: yearData?.totalPopulation ?? 0,
        households: yearData?.totalHouseholds ?? 0
      };
    });
  });

  // Sort sitios
  const sortedSitios = $derived.by(() => {
    return [...displaySitios].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'municipality':
          comparison = a.municipality.localeCompare(b.municipality);
          break;
        case 'barangay':
          comparison = a.barangay.localeCompare(b.barangay);
          break;
        case 'population':
          comparison = (a.population || 0) - (b.population || 0);
          break;
        case 'households':
          comparison = (a.households || 0) - (b.households || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  });

  // Pagination
  const totalPages = $derived(Math.ceil(sortedSitios.length / itemsPerPage));
  const paginatedSitios = $derived(
    sortedSitios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  );

  // Stats
  const stats = $derived.by(() => {
    const uniqueMunicipalities = new Set(sitios.map((s) => s.municipality));
    const uniqueBarangays = new Set(sitios.map((s) => s.barangay));
    const totalPopulation = displaySitios.reduce((sum, s) => sum + (s.population || 0), 0);
    const totalHouseholds = displaySitios.reduce((sum, s) => sum + (s.households || 0), 0);

    return {
      totalSitios: sitios.length,
      municipalities: uniqueMunicipalities.size,
      barangays: uniqueBarangays.size,
      totalPopulation,
      totalHouseholds
    };
  });

  const hasActiveFilters = $derived(
    searchQuery !== '' ||
      municipalityFilter !== 'all' ||
      barangayFilter !== 'all' ||
      selectedYear !== 'latest'
  );

  // Load data
  onMount(() => {
    refreshData();
  });

  function refreshData() {
    sitios = loadSitios();
    currentPage = 1;
  }

  function handleToggleSort(column: typeof sortBy) {
    if (sortBy === column) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortOrder = 'asc';
    }
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

  function clearFilters() {
    searchQuery = '';
    municipalityFilter = 'all';
    barangayFilter = 'all';
    selectedYear = 'latest';
    currentPage = 1;
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

  // Reset barangay when municipality changes
  $effect(() => {
    if (municipalityFilter === 'all') {
      barangayFilter = 'all';
    }
  });

  // Reset page when filters change
  $effect(() => {
    searchQuery;
    municipalityFilter;
    barangayFilter;
    selectedYear;
    currentPage = 1;
  });
</script>

<svelte:head>
  <title>Sitios Management - South Cotabato Data Bank</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-muted/30">
  <!-- Header -->
  <AdminHeader
    title="Sitios Management"
    description="Manage sitio records and yearly data"
    breadcrumbs={[{ label: 'Sitios' }]}
  >
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

    <!-- Filters -->
    <Card.Root>
      <Card.Content>
        <div class="flex flex-col gap-4">
          <!-- Search and Filters Row -->
          <div class="flex flex-col gap-4 md:flex-row md:items-center">
            <div class="relative flex-1">
              <Search
                class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input placeholder="Search sitios..." bind:value={searchQuery} class="pl-10" />
            </div>
            <div class="flex flex-wrap gap-2">
              <Select.Root type="single" bind:value={municipalityFilter}>
                <Select.Trigger class="w-40">
                  {municipalityFilter === 'all' ? 'All Municipalities' : municipalityFilter}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Municipalities</Select.Item>
                  {#each municipalities as municipality}
                    <Select.Item value={municipality}>{municipality}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>

              <Select.Root
                type="single"
                bind:value={barangayFilter}
                disabled={municipalityFilter === 'all'}
              >
                <Select.Trigger class="w-40">
                  {barangayFilter === 'all' ? 'All Barangays' : barangayFilter}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Barangays</Select.Item>
                  {#each barangays as brgy}
                    <Select.Item value={brgy}>{brgy}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>

              <!-- <Select.Root type="single" bind:value={selectedYear}>
                <Select.Trigger class="w-32">
                  <Calendar class="mr-2 size-4" />
                  {selectedYear === 'latest'
                    ? 'Latest'
                    : selectedYear === 'all'
                      ? 'All Years'
                      : selectedYear}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="latest">Latest Year</Select.Item>
                  <Select.Item value="all">All Years</Select.Item>
                  {#each allAvailableYears as year}
                    <Select.Item value={year.toString()}>{year}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root> -->

              {#if hasActiveFilters}
                <Button variant="outline" size="icon" onclick={clearFilters}>
                  <FilterX class="h-4 w-4" />
                </Button>
              {/if}

              <Button variant="outline" size="icon" onclick={refreshData}>
                <RefreshCw class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Sitios Table -->
    <SitiosTable
      sitios={paginatedSitios}
      totalSitios={sortedSitios.length}
      {currentPage}
      {itemsPerPage}
      {totalPages}
      {sortBy}
      {sortOrder}
      onToggleSort={handleToggleSort}
      onRefresh={refreshData}
      onDelete={handleDelete}
      onDownloadPDF={handleDownloadPDF}
      onPageChange={(page) => (currentPage = page)}
      onEdit={handleEdit}
      onClearFilters={clearFilters}
      {hasActiveFilters}
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
