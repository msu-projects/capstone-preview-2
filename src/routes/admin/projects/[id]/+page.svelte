<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import { type BreadcrumbItem } from '$lib/components/AppBreadcrumb.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Base64Gallery } from '$lib/components/ui/base64-gallery';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { ProjectWithSitios } from '$lib/types';
  import { formatCurrency } from '$lib/utils/formatters';
  import { deleteProject, getProjectById, getProjectWithSitios } from '$lib/utils/project-storage';
  import {
    ArrowLeft,
    Banknote,
    Calendar,
    ChevronRight,
    Clock,
    FolderKanban,
    ImageIcon,
    Info,
    Loader2,
    MapPin,
    Pencil,
    Trash2
  } from '@lucide/svelte';
  import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // Permission check
  const canManage = $derived(authStore.canCreateSitio());

  // State
  let project = $state<ProjectWithSitios | null>(null);
  let isLoading = $state(true);
  let isDeleteDialogOpen = $state(false);
  let isDeleting = $state(false);

  // Map state
  let mapContainer = $state<HTMLDivElement | undefined>();
  let map: LeafletMap | null = $state(null);
  let marker: LeafletMarker | null = $state(null);
  let L: typeof import('leaflet') | null = $state(null);

  const projectId = $derived(parseInt(page.params.id || '0'));

  onMount(async () => {
    loadProject();
  });

  function loadProject() {
    isLoading = true;
    const rawProject = getProjectById(projectId);

    if (!rawProject) {
      toast.error('Project not found');
      goto('/admin/projects');
      return;
    }

    project = getProjectWithSitios(rawProject);
    isLoading = false;

    // Initialize map after project is loaded
    setTimeout(initMap, 100);
  }

  async function initMap() {
    if (!mapContainer || !project) return;

    // Dynamically import Leaflet
    L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    // Initialize map
    map = L.map(mapContainer).setView([project.location.latitude, project.location.longitude], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add marker
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="flex items-center justify-center w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
					<circle cx="12" cy="10" r="3"/>
				</svg>
			</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    marker = L.marker([project.location.latitude, project.location.longitude], {
      icon: customIcon
    }).addTo(map);
  }

  function handleEdit() {
    goto(`/admin/projects/${projectId}/edit`);
  }

  function handleDelete() {
    isDeleteDialogOpen = true;
  }

  async function confirmDelete() {
    if (!project) return;

    isDeleting = true;
    const success = deleteProject(project.id);

    if (success) {
      toast.success(`Project "${project.title}" deleted successfully`);
      goto('/admin/projects');
    } else {
      toast.error('Failed to delete project');
    }

    isDeleting = false;
    isDeleteDialogOpen = false;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const breadcrumbs = $derived<BreadcrumbItem[]>([
    {
      label: 'Project',
      href: '/admin/projects'
    },
    {
      label: project?.title || ''
    }
  ]);
</script>

<svelte:head>
  <title>{project?.title || 'Project'} - Admin | CATCH-UP Data Bank</title>
</svelte:head>

{#if isLoading}
  <div class="flex h-screen items-center justify-center">
    <Loader2 class="size-8 animate-spin text-muted-foreground" />
  </div>
{:else if project}
  <AdminHeader
    title="Project Details"
    description="View and manage project information"
    {breadcrumbs}
  >
    {#snippet actions()}
      <Button variant="ghost" size="sm" href="/admin/projects" class="gap-2">
        <ArrowLeft class="size-4" />
        Back to Projects
      </Button>
      {#if canManage}
        <Button variant="outline" onclick={handleEdit}>
          <Pencil class="mr-2 size-4" />
          Edit
        </Button>
        <Button variant="destructive" onclick={handleDelete}>
          <Trash2 class="mr-2 size-4" />
          Delete
        </Button>
      {/if}
    {/snippet}
  </AdminHeader>

  <div class="space-y-6 p-6">
    <!-- Hero Section -->
    <div
      class="rounded-xl border bg-linear-to-br from-primary/5 via-primary/3 to-transparent p-6 dark:from-primary/10 dark:via-primary/5"
    >
      <div class="flex items-start gap-5">
        <div
          class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 shadow-lg shadow-primary/20"
        >
          <FolderKanban class="size-8 text-white" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {project.title}
          </h2>
          <p class="mt-2 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {project.description.length > 180
              ? project.description.slice(0, 180) + '...'
              : project.description}
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <div
              class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-slate-800"
            >
              <Banknote class="size-5 text-primary" />
              <div>
                <p class="text-xs font-medium text-muted-foreground">Total Cost</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(project.cost)}
                </p>
              </div>
            </div>
            <div
              class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-slate-800"
            >
              <MapPin class="size-5 text-primary" />
              <div>
                <p class="text-xs font-medium text-muted-foreground">Sitios</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">
                  {project.sitioIds.length}
                </p>
              </div>
            </div>
            <div
              class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-slate-800"
            >
              <ImageIcon class="size-5 text-primary" />
              <div>
                <p class="text-xs font-medium text-muted-foreground">Images</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">
                  {project.images.length}
                </p>
              </div>
            </div>
            {#if project.projectDate}
              <div
                class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-slate-800"
              >
                <Calendar class="size-5 text-primary" />
                <div>
                  <p class="text-xs font-medium text-muted-foreground">Project Date</p>
                  <p class="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatDate(project.projectDate)}
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main Content -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Project Images -->
        {#if project.images.length > 0}
          <Card.Root class="overflow-hidden">
            <Card.Header class="bg-linear-to-r from-slate-50 to-transparent dark:from-slate-900">
              <Card.Title class="flex items-center gap-2 text-lg">
                <ImageIcon class="size-5 text-primary" />
                Project Gallery
              </Card.Title>
              <Card.Description>Visual documentation of the project</Card.Description>
            </Card.Header>
            <Card.Content class="p-6">
              <Base64Gallery images={project.images} />
            </Card.Content>
          </Card.Root>
        {/if}

        <!-- Project Description -->
        <Card.Root class="gap-0 overflow-hidden py-0">
          <Card.Header class="bg-linear-to-r from-slate-50 to-transparent py-5 dark:from-slate-900">
            <Card.Title class="flex items-center gap-2 text-lg">
              <Info class="size-5 text-primary" />
              Project Overview
            </Card.Title>
            <Card.Description>Detailed information about this project</Card.Description>
          </Card.Header>
          <Card.Content class="p-6">
            <p
              class="text-base leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300"
            >
              {project.description}
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Project Location Map -->
        <Card.Root class="gap-0 overflow-hidden py-0">
          <Card.Header class="bg-linear-to-r from-slate-50 to-transparent py-5 dark:from-slate-900">
            <Card.Title class="flex items-center gap-2 text-lg">
              <MapPin class="size-5 text-primary" />
              Location Map
            </Card.Title>
            <Card.Description>Geographic location of the project</Card.Description>
          </Card.Header>
          <Card.Content class="p-6">
            <div
              bind:this={mapContainer}
              class="h-80 w-full overflow-hidden rounded-xl border shadow-sm"
            ></div>
            <div
              class="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-900"
            >
              <MapPin class="size-4 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">
                <span class="font-medium">Coordinates:</span>
                {project.location.latitude.toFixed(6)}, {project.location.longitude.toFixed(6)}
              </p>
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Sitios Involved -->
        <Card.Root class="gap-0 overflow-hidden py-0">
          <Card.Header class="bg-linear-to-r from-slate-50 to-transparent py-5 dark:from-slate-900">
            <Card.Title class="flex items-center gap-2 text-lg">
              <MapPin class="size-5 text-primary" />
              Covered Sitios
            </Card.Title>
            <Card.Description>
              {project.sitioIds.length} sitio{project.sitioIds.length !== 1 ? 's' : ''} benefiting from
              this project
            </Card.Description>
          </Card.Header>
          <Card.Content class="p-4">
            <div class="space-y-2">
              {#each project.sitioNames as sitioName, index (index)}
                {@const sitioId = project.sitioIds[index]}
                <a
                  href="/admin/sitios/{sitioId}"
                  class="group flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20"
                    >
                      <MapPin class="size-4 text-primary" />
                    </div>
                    <span class="text-sm font-medium">{sitioName}</span>
                  </div>
                  <ChevronRight
                    class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </a>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Project Details -->
        <Card.Root class="gap-0 overflow-hidden py-0">
          <Card.Header class="bg-linear-to-r from-slate-50 to-transparent py-5 dark:from-slate-900">
            <Card.Title class="flex items-center gap-2 text-lg">
              <Info class="size-5 text-primary" />
              Quick Details
            </Card.Title>
          </Card.Header>
          <Card.Content class="p-4">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                >
                  <Banknote class="size-5 text-primary" />
                </div>
                <div>
                  <p class="text-xs font-medium text-muted-foreground">Total Investment</p>
                  <p class="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(project.cost)}
                  </p>
                </div>
              </div>

              <Separator />

              {#if project.projectDate}
                <div class="flex items-start gap-3">
                  <div
                    class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                  >
                    <Calendar class="size-5 text-primary" />
                  </div>
                  <div>
                    <p class="text-xs font-medium text-muted-foreground">Project Date</p>
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatDate(project.projectDate)}
                    </p>
                  </div>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Quick Actions -->
        {#if canManage}
          <Card.Root class="gap-0 overflow-hidden py-0">
            <Card.Header
              class="bg-linear-to-r from-slate-50 to-transparent py-5 dark:from-slate-900"
            >
              <Card.Title class="text-lg">Quick Actions</Card.Title>
              <Card.Description>Manage this project</Card.Description>
            </Card.Header>
            <Card.Content class="space-y-2 p-4">
              <Button variant="outline" class="w-full justify-start" onclick={handleEdit}>
                <Pencil class="mr-2 size-4" />
                Edit Project
              </Button>
              <Button
                variant="outline"
                class="w-full justify-start text-destructive hover:text-destructive"
                onclick={handleDelete}
              >
                <Trash2 class="mr-2 size-4" />
                Delete Project
              </Button>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </div>

    <!-- Footer Metadata -->
    <div class="rounded-lg border bg-slate-50/50 px-6 py-4 dark:bg-slate-900/50">
      <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <div class="flex items-center gap-2">
          <Clock class="size-4" />
          <span>
            Created on {formatDate(project.createdAt)}
          </span>
        </div>
        {#if project.updatedAt !== project.createdAt}
          <div class="flex items-center gap-2">
            <Clock class="size-4" />
            <span>
              Last updated on {formatDate(project.updatedAt)}
            </span>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Project</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete "{project?.title}"? This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={isDeleting}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
        onclick={confirmDelete}
        disabled={isDeleting}
      >
        {#if isDeleting}
          <Loader2 class="mr-2 size-4 animate-spin" />
          Deleting...
        {:else}
          Delete
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  :global(.custom-marker) {
    background: transparent;
    border: none;
  }
</style>
