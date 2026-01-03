<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Base64Gallery } from '$lib/components/ui/base64-gallery';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { ProjectWithSitios } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import { deleteProject, getProjectById, getProjectWithSitios } from '$lib/utils/project-storage';
	import {
		ArrowLeft,
		Calendar,
		ExternalLink,
		ImageIcon,
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
</script>

<svelte:head>
	<title>{project?.title || 'Project'} - Admin | CATCH-UP Data Bank</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<Loader2 class="size-8 animate-spin text-muted-foreground" />
	</div>
{:else if project}
	<AdminHeader title={project.title} description="Project Details">
		{#snippet actions()}
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
		<!-- Back Button -->
		<Button variant="ghost" size="sm" href="/admin/projects" class="gap-2">
			<ArrowLeft class="size-4" />
			Back to Projects
		</Button>

		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Main Content -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Project Images -->
				{#if project.images.length > 0}
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<ImageIcon class="size-5" />
								Project Images
							</Card.Title>
						</Card.Header>
						<Card.Content>
							<Base64Gallery images={project.images} />
						</Card.Content>
					</Card.Root>
				{/if}

				<!-- Project Description -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Description</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
					</Card.Content>
				</Card.Root>

				<!-- Project Location Map -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<MapPin class="size-5" />
							Project Location
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<div bind:this={mapContainer} class="h-64 w-full rounded-lg border"></div>
						<p class="mt-2 text-sm text-muted-foreground">
							Coordinates: {project.location.latitude.toFixed(6)}, {project.location.longitude.toFixed(
								6
							)}
						</p>
					</Card.Content>
				</Card.Root>

				<!-- Sitios Involved -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<MapPin class="size-5" />
							Sitios Involved ({project.sitioIds.length})
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#each project.sitioNames as sitioName, index (index)}
								{@const sitioId = project.sitioIds[index]}
								<div class="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div class="flex items-center gap-2">
										<MapPin class="size-4 text-primary" />
										<span class="font-medium">{sitioName}</span>
									</div>
									<Button variant="ghost" size="sm" href="/admin/sitios/{sitioId}">
										<ExternalLink class="size-4" />
									</Button>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Project Summary -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Project Summary</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Project Cost</span>
							<Badge variant="secondary" class="text-base font-semibold">
								{formatCurrency(project.cost)}
							</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Sitios Involved</span>
							<Badge variant="outline">{project.sitioIds.length}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Images</span>
							<Badge variant="outline">{project.images.length}</Badge>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Timestamps -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Calendar class="size-5" />
							Timeline
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div>
							<p class="text-sm text-muted-foreground">Project Date</p>
							<p class="font-medium">
								{project.projectDate ? formatDate(project.projectDate) : 'Not specified'}
							</p>
						</div>
						<div>
							<p class="text-sm text-muted-foreground">Created</p>
							<p class="font-medium">{formatDate(project.createdAt)}</p>
						</div>
						<div>
							<p class="text-sm text-muted-foreground">Last Updated</p>
							<p class="font-medium">{formatDate(project.updatedAt)}</p>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Quick Actions -->
				{#if canManage}
					<Card.Root>
						<Card.Header>
							<Card.Title>Quick Actions</Card.Title>
						</Card.Header>
						<Card.Content class="space-y-2">
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
