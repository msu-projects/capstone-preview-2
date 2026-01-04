<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';
  import { getBarangaysForMunicipality, getMunicipalities } from '$lib/config/location-data';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { ProjectWithSitios } from '$lib/types';
  import { formatCurrency } from '$lib/utils/formatters';
  import { deleteProject, loadProjectsWithSitios } from '$lib/utils/project-storage';
  import {
    Eye,
    FilterX,
    FolderKanban,
    ImageIcon,
    MapPin,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // Permission check
  const canManageProjects = $derived(authStore.canCreateSitio()); // Same permission as sitio management

  // State
  let projects = $state<ProjectWithSitios[]>([]);
  let searchQuery = $state('');
  let municipalityFilter = $state<string>('all');
  let barangayFilter = $state<string>('all');
  let currentPage = $state(1);
  let itemsPerPage = $state(10);
  let sortBy = $state<'title' | 'cost' | 'sitios' | 'date' | 'projectDate'>('projectDate');
  let sortOrder = $state<'asc' | 'desc'>('desc');

  // Dialog states
  let isDeleteDialogOpen = $state(false);
  let selectedProject = $state<ProjectWithSitios | null>(null);

  // Derived values
  const municipalities = $derived(getMunicipalities());
  const barangays = $derived(
    municipalityFilter !== 'all' ? getBarangaysForMunicipality(municipalityFilter) : []
  );

  // Filter projects
  const filteredProjects = $derived.by(() => {
    let result = projects.filter((project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.sitioNames.some((name) => name.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Municipality/Barangay filter - filter based on sitio names which contain location info
      if (municipalityFilter !== 'all') {
        const matchesMunicipality = project.sitioNames.some((name) =>
          name.toLowerCase().includes(municipalityFilter.toLowerCase())
        );
        if (!matchesMunicipality) return false;
      }

      if (barangayFilter !== 'all') {
        const matchesBarangay = project.sitioNames.some((name) =>
          name.toLowerCase().includes(barangayFilter.toLowerCase())
        );
        if (!matchesBarangay) return false;
      }

      return true;
    });

    return result;
  });

  // Sort projects
  const sortedProjects = $derived.by(() => {
    return [...filteredProjects].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'sitios':
          comparison = a.sitioIds.length - b.sitioIds.length;
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'projectDate':
          const dateA = a.projectDate ? new Date(a.projectDate).getTime() : 0;
          const dateB = b.projectDate ? new Date(b.projectDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  });

  // Pagination
  const totalPages = $derived(Math.ceil(sortedProjects.length / itemsPerPage));
  const paginatedProjects = $derived(
    sortedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  );

  // Stats
  const stats = $derived.by(() => {
    const totalCost = projects.reduce((sum, p) => sum + p.cost, 0);
    const uniqueSitios = new Set(projects.flatMap((p) => p.sitioIds));
    return {
      totalProjects: projects.length,
      totalCost,
      uniqueSitios: uniqueSitios.size,
      avgProjectCost: projects.length > 0 ? totalCost / projects.length : 0
    };
  });

  const hasActiveFilters = $derived(
    searchQuery !== '' || municipalityFilter !== 'all' || barangayFilter !== 'all'
  );

  // Load data
  onMount(() => {
    refreshData();
  });

  function refreshData() {
    projects = loadProjectsWithSitios();
    currentPage = 1;
  }

  function handleToggleSort(column: typeof sortBy) {
    if (sortBy === column) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortOrder = column === 'date' ? 'desc' : 'asc';
    }
  }

  function handleView(id: number) {
    goto(`/admin/projects/${id}`);
  }

  function handleEdit(id: number) {
    goto(`/admin/projects/${id}/edit`);
  }

  function handleDelete(project: ProjectWithSitios) {
    selectedProject = project;
    isDeleteDialogOpen = true;
  }

  function confirmDelete() {
    if (!selectedProject) return;

    const success = deleteProject(selectedProject.id);
    if (success) {
      toast.success(`Project "${selectedProject.title}" deleted successfully`);
      refreshData();
    } else {
      toast.error('Failed to delete project');
    }
    isDeleteDialogOpen = false;
    selectedProject = null;
  }

  function clearFilters() {
    searchQuery = '';
    municipalityFilter = 'all';
    barangayFilter = 'all';
    currentPage = 1;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Projects - Admin | CATCH-UP Data Bank</title>
</svelte:head>

<AdminHeader title="Projects" description="Manage implemented projects across sitios">
  {#snippet actions()}
    <Button variant="outline" size="sm" onclick={refreshData}>
      <RefreshCw class="mr-2 size-4" />
      Refresh
    </Button>
    {#if canManageProjects}
      <Button size="sm" href="/admin/projects/new">
        <Plus class="mr-2 size-4" />
        Add Project
      </Button>
    {/if}
  {/snippet}
</AdminHeader>

<div class="space-y-6 p-6">
  <!-- Stats Cards -->
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <Card.Root>
      <Card.Content class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Total Projects</p>
            <p class="text-2xl font-bold">{stats.totalProjects}</p>
          </div>
          <FolderKanban class="size-8 text-muted-foreground/50" />
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Total Cost</p>
            <p class="text-2xl font-bold">{formatCurrency(stats.totalCost)}</p>
          </div>
          <span class="text-2xl text-muted-foreground/50">₱</span>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Sitios Involved</p>
            <p class="text-2xl font-bold">{stats.uniqueSitios}</p>
          </div>
          <MapPin class="size-8 text-muted-foreground/50" />
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Avg. Project Cost</p>
            <p class="text-2xl font-bold">{formatCurrency(stats.avgProjectCost)}</p>
          </div>
          <span class="text-2xl text-muted-foreground/50">~</span>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Filters -->
  <Card.Root>
    <Card.Content class="p-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <!-- Search -->
        <div class="relative flex-1">
          <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects..."
            class="pl-10"
            bind:value={searchQuery}
          />
        </div>

        <!-- Municipality Filter -->
        <Select.Root type="single" bind:value={municipalityFilter}>
          <Select.Trigger class="w-full lg:w-48">
            {municipalityFilter === 'all' ? 'All Municipalities' : municipalityFilter}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Municipalities</Select.Item>
            {#each municipalities as mun}
              <Select.Item value={mun}>{mun}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <!-- Barangay Filter -->
        <Select.Root
          type="single"
          bind:value={barangayFilter}
          disabled={municipalityFilter === 'all'}
        >
          <Select.Trigger class="w-full lg:w-48">
            {barangayFilter === 'all' ? 'All Barangays' : barangayFilter}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Barangays</Select.Item>
            {#each barangays as brgy}
              <Select.Item value={brgy}>{brgy}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        {#if hasActiveFilters}
          <Button variant="ghost" size="sm" onclick={clearFilters}>
            <FilterX class="mr-2 size-4" />
            Clear
          </Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Projects Table -->
  <Card.Root>
    <Card.Content class="p-0">
      {#if paginatedProjects.length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <FolderKanban class="mb-4 size-12 text-muted-foreground/50" />
          <h3 class="text-lg font-medium">No projects found</h3>
          <p class="text-sm text-muted-foreground">
            {#if hasActiveFilters}
              Try adjusting your filters or search query.
            {:else}
              Get started by adding your first project.
            {/if}
          </p>
          {#if canManageProjects && !hasActiveFilters}
            <Button class="mt-4" href="/admin/projects/new">
              <Plus class="mr-2 size-4" />
              Add Project
            </Button>
          {/if}
        </div>
      {:else}
        <div class="overflow-x-auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-12"></Table.Head>
                <Table.Head>
                  <button
                    class="flex items-center gap-1 hover:text-foreground"
                    onclick={() => handleToggleSort('title')}
                  >
                    Title
                    {#if sortBy === 'title'}
                      <span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    {/if}
                  </button>
                </Table.Head>
                <Table.Head>
                  <button
                    class="flex items-center gap-1 hover:text-foreground"
                    onclick={() => handleToggleSort('sitios')}
                  >
                    Sitios
                    {#if sortBy === 'sitios'}
                      <span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    {/if}
                  </button>
                </Table.Head>
                <Table.Head>
                  <button
                    class="flex items-center gap-1 hover:text-foreground"
                    onclick={() => handleToggleSort('cost')}
                  >
                    Cost
                    {#if sortBy === 'cost'}
                      <span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    {/if}
                  </button>
                </Table.Head>
                <Table.Head>
                  <button
                    class="flex items-center gap-1 hover:text-foreground"
                    onclick={() => handleToggleSort('date')}
                  >
                    Date Added
                    {#if sortBy === 'date'}
                      <span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    {/if}
                  </button>
                </Table.Head>
                <Table.Head class="text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each paginatedProjects as project (project.id)}
                <Table.Row class="group">
                  <Table.Cell>
                    {#if project.images.length > 0}
                      <div class="size-10 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          class="size-full object-cover"
                        />
                      </div>
                    {:else}
                      <div
                        class="flex size-10 items-center justify-center rounded-md border bg-muted"
                      >
                        <ImageIcon class="size-5 text-muted-foreground" />
                      </div>
                    {/if}
                  </Table.Cell>
                  <Table.Cell>
                    <div class="max-w-xs">
                      <p class="truncate font-medium">{project.title}</p>
                      <p class="truncate text-xs text-muted-foreground">
                        {project.description.slice(0, 60)}{project.description.length > 60
                          ? '...'
                          : ''}
                      </p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div class="flex flex-wrap gap-1">
                      {#if project.sitioNames.length <= 2}
                        {#each project.sitioNames as name}
                          <Badge variant="secondary" class="text-xs">{name.split(',')[0]}</Badge>
                        {/each}
                      {:else}
                        <Badge variant="secondary" class="text-xs"
                          >{project.sitioNames[0].split(',')[0]}</Badge
                        >
                        <Badge variant="outline" class="text-xs"
                          >+{project.sitioNames.length - 1} more</Badge
                        >
                      {/if}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span class="font-medium">{formatCurrency(project.cost)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span class="text-sm text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div
                      class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Button variant="ghost" size="icon" onclick={() => handleView(project.id)}>
                        <Eye class="size-4" />
                      </Button>
                      {#if canManageProjects}
                        <Button variant="ghost" size="icon" onclick={() => handleEdit(project.id)}>
                          <Pencil class="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="text-destructive hover:text-destructive"
                          onclick={() => handleDelete(project)}
                        >
                          <Trash2 class="size-4" />
                        </Button>
                      {/if}
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="flex items-center justify-between border-t px-4 py-3">
            <p class="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
                currentPage * itemsPerPage,
                sortedProjects.length
              )} of {sortedProjects.length} projects
            </p>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onclick={() => (currentPage = currentPage - 1)}
              >
                Previous
              </Button>
              <span class="text-sm">Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onclick={() => (currentPage = currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        {/if}
      {/if}
    </Card.Content>
  </Card.Root>
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Project</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete "{selectedProject?.title}"? This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
        onclick={confirmDelete}
      >
        Delete
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
