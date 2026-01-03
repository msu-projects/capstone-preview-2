<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Base64Gallery } from '$lib/components/ui/base64-gallery';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { ProjectWithSitios } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import { getProjectById, getProjectWithSitios } from '$lib/utils/project-storage';
	import {
		ArrowLeft,
		Calendar,
		ExternalLink,
		FolderKanban,
		ImageIcon,
		Loader2,
		MapPin
	} from '@lucide/svelte';
	import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// State
	let project = $state<ProjectWithSitios | null>(null);
	let isLoading = $state(true);

	// Map state
	let mapContainer = $state<HTMLDivElement | undefined>();
	let map: LeafletMap | null = $state(null);
	let marker: LeafletMarker | null = $state(null);
	let L: typeof import('leaflet') | null = $state(null);

	const projectId = $derived(parseInt(page.params.id || '0'));

	const breadcrumbItems = $derived([
		{ label: 'Home', href: '/' },
		{ label: 'Projects', href: '/projects' },
		{ label: project?.title || 'Project Details' }
	]);

	onMount(async () => {
		loadProject();
	});

	function loadProject() {
		isLoading = true;
		const rawProject = getProjectById(projectId);

		if (!rawProject) {
			toast.error('Project not found');
			goto('/');
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

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{project?.title || 'Project'} - South Cotabato Data Bank</title>
	{#if project}
		<meta name="description" content={project.description.slice(0, 160)} />
	{/if}
</svelte:head>

<div
	class="min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900"
>
	{#if isLoading}
		<div class="flex h-screen items-center justify-center">
			<Loader2 class="size-8 animate-spin text-muted-foreground" />
		</div>
	{:else if project}
		<AppBreadcrumb items={breadcrumbItems} isAdminView={false} />

		<!-- Header -->
		<div class="border-b bg-white/50 dark:bg-slate-900/50">
			<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div class="flex items-start gap-4">
					<div class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
						<FolderKanban class="size-7 text-primary" />
					</div>
					<div class="min-w-0 flex-1">
						<h1 class="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
							{project.title}
						</h1>
						<div class="mt-2 flex flex-wrap items-center gap-3">
							<Badge variant="secondary" class="text-base font-semibold">
								{formatCurrency(project.cost)}
							</Badge>
							<span class="text-sm text-muted-foreground">
								{project.sitioIds.length} sitio{project.sitioIds.length !== 1 ? 's' : ''} involved
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="grid gap-8 lg:grid-cols-3">
				<!-- Main Content -->
				<div class="space-y-8 lg:col-span-2">
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
							<Card.Title>About This Project</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="leading-relaxed whitespace-pre-wrap text-muted-foreground">
								{project.description}
							</p>
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
							<div bind:this={mapContainer} class="h-72 w-full rounded-lg border"></div>
							<p class="mt-2 text-sm text-muted-foreground">
								Coordinates: {project.location.latitude.toFixed(6)}, {project.location.longitude.toFixed(
									6
								)}
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Sitios Involved -->
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<MapPin class="size-5" />
								Sitios Involved
							</Card.Title>
						</Card.Header>
						<Card.Content>
							<div class="space-y-2">
								{#each project.sitioNames as sitioName, index (index)}
									{@const sitioId = project.sitioIds[index]}
									<a
										href="/sitios/{sitioId}"
										class="flex items-center justify-between rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
									>
										<div class="flex items-center gap-2">
											<MapPin class="size-4 text-primary" />
											<span class="text-sm font-medium">{sitioName}</span>
										</div>
										<ExternalLink class="size-4 text-muted-foreground" />
									</a>
								{/each}
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Project Info -->
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<Calendar class="size-5" />
								Project Info
							</Card.Title>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div>
								<p class="text-sm text-muted-foreground">Project Cost</p>
								<p class="text-lg font-semibold">{formatCurrency(project.cost)}</p>
							</div>
							<div>
								<p class="text-sm text-muted-foreground">Project Date</p>
								<p class="font-medium">
									{project.projectDate ? formatDate(project.projectDate) : 'Not specified'}
								</p>
							</div>
							<div>
								<p class="text-sm text-muted-foreground">Date Added</p>
								<p class="font-medium">{formatDate(project.createdAt)}</p>
							</div>
							{#if project.updatedAt !== project.createdAt}
								<div>
									<p class="text-sm text-muted-foreground">Last Updated</p>
									<p class="font-medium">{formatDate(project.updatedAt)}</p>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Back Button -->
					<Button variant="outline" class="w-full" onclick={() => history.back()}>
						<ArrowLeft class="mr-2 size-4" />
						Go Back
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.custom-marker) {
		background: transparent;
		border: none;
	}
</style>
