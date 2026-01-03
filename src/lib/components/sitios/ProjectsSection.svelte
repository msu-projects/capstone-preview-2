<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { ProjectWithSitios } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import { getProjectsWithSitiosBySitioId } from '$lib/utils/project-storage';
	import {
		Calendar,
		ExternalLink,
		FolderKanban,
		ImageIcon,
		MapPin,
		Plus,
		TrendingUp
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface Props {
		sitioId: number;
		/** Show admin actions (edit/delete) - only for admin views */
		showAdminActions?: boolean;
		/** Base URL for project links */
		baseUrl?: string;
	}

	let { sitioId, showAdminActions = false, baseUrl = '/admin/projects' }: Props = $props();

	let projects = $state<ProjectWithSitios[]>([]);
	let isLoading = $state(true);

	onMount(() => {
		loadProjects();
	});

	function loadProjects() {
		isLoading = true;
		projects = getProjectsWithSitiosBySitioId(sitioId);
		isLoading = false;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getAverageCost(): number {
		return projects.length > 0 ? projects.reduce((sum, p) => sum + p.cost, 0) / projects.length : 0;
	}
</script>

<div class="space-y-6">
	<!-- Enhanced Summary Section -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Total Projects Card -->
		<Card.Root
			class="overflow-hidden border-l-4 border-l-primary bg-linear-to-br from-primary/5 to-transparent py-0 transition-all hover:shadow-md"
		>
			<Card.Content class="p-6">
				<div class="flex items-start justify-between">
					<div class="space-y-1">
						<p class="text-sm font-medium text-muted-foreground">Total Projects</p>
						<p class="text-3xl font-bold tracking-tight">{projects.length}</p>
					</div>
					<div class="rounded-full bg-primary/10 p-3">
						<FolderKanban class="size-5 text-primary" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Total Investment Card -->
		<Card.Root
			class="overflow-hidden border-l-4 border-l-green-500 bg-linear-to-br from-green-500/5 to-transparent py-0 transition-all hover:shadow-md"
		>
			<Card.Content class="p-6">
				<div class="flex items-start justify-between">
					<div class="space-y-1">
						<p class="text-sm font-medium text-muted-foreground">Total Investment</p>
						<p class="text-3xl font-bold tracking-tight">
							{formatCurrency(projects.reduce((sum, p) => sum + p.cost, 0))}
						</p>
					</div>
					<div class="rounded-full bg-green-500/10 p-3">
						<TrendingUp class="size-5 text-green-600 dark:text-green-500" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Average Cost Card / Add Button -->
		{#if showAdminActions}
			<Card.Root
				class="overflow-hidden border-2 border-dashed border-primary/30 bg-linear-to-br from-primary/5 to-transparent py-0 transition-all hover:border-primary/50 hover:shadow-md"
			>
				<Card.Content class="flex h-full items-center justify-center p-6">
					<Button href="/admin/projects/new" class="h-auto flex-col gap-2 py-4" variant="ghost">
						<div class="rounded-full bg-primary/10 p-3">
							<Plus class="size-6 text-primary" />
						</div>
						<span class="font-semibold">Add New Project</span>
					</Button>
				</Card.Content>
			</Card.Root>
		{:else if projects.length > 0}
			<Card.Root
				class="overflow-hidden border-l-4 border-l-blue-500 bg-linear-to-br from-blue-500/5 to-transparent py-0 transition-all hover:shadow-md"
			>
				<Card.Content class="p-6">
					<div class="flex items-start justify-between">
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Average Cost</p>
							<p class="text-3xl font-bold tracking-tight">
								{formatCurrency(getAverageCost())}
							</p>
						</div>
						<div class="rounded-full bg-blue-500/10 p-3">
							<TrendingUp class="size-5 text-blue-600 dark:text-blue-500" />
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
	<!-- Loading State -->
	{#if isLoading}
		<div class="flex h-48 items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
				<p class="text-sm text-muted-foreground">Loading projects...</p>
			</div>
		</div>
	{:else if projects.length === 0}
		<!-- Enhanced Empty State -->
		<Card.Root class="border-2 border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
				<div class="mb-4 rounded-full bg-muted p-6">
					<FolderKanban class="size-12 text-muted-foreground" />
				</div>
				<h3 class="mb-2 text-xl font-semibold">No Projects Yet</h3>
				<p class="mb-6 max-w-sm text-sm text-muted-foreground">
					No implemented projects have been linked to this sitio. Start by adding your first project
					to track development initiatives.
				</p>
				{#if showAdminActions}
					<Button href="/admin/projects/new">
						<Plus class="mr-2 size-4" />
						Add First Project
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Enhanced Projects Grid -->
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each projects as project (project.id)}
				<Card.Root
					class="group gap-0 overflow-hidden border py-0 transition-all hover:border-primary/50 hover:shadow-lg"
				>
					<!-- Project Image with Overlay -->
					<div class="relative">
						{#if project.images.length > 0}
							<div class="relative aspect-video overflow-hidden bg-muted">
								<img
									src={project.images[0]}
									alt={project.title}
									class="size-full object-cover transition-all duration-300 group-hover:scale-110"
								/>
								<!-- Gradient Overlay -->
								<div
									class="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
								></div>
								{#if project.images.length > 1}
									<Badge class="absolute top-3 right-3 bg-black/70 text-white backdrop-blur-sm">
										<ImageIcon class="mr-1 size-3" />
										{project.images.length}
									</Badge>
								{/if}

								<!-- Cost Badge on Image -->
								<div class="absolute bottom-3 left-3">
									<Badge class="bg-primary font-bold text-primary-foreground shadow-lg">
										{formatCurrency(project.cost)}
									</Badge>
								</div>
							</div>
						{:else}
							<div
								class="flex aspect-video items-center justify-center bg-linear-to-br from-muted to-muted/50"
							>
								<div class="text-center">
									<ImageIcon class="mx-auto mb-2 size-12 text-muted-foreground/40" />
									<p class="text-xs text-muted-foreground">No image</p>
								</div>
							</div>
						{/if}
					</div>

					<Card.Content class="space-y-4 p-5">
						<!-- Title & Description -->
						<div class="space-y-2">
							<h3
								class="line-clamp-2 text-lg leading-tight font-bold transition-colors group-hover:text-primary"
							>
								{project.title}
							</h3>
							<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
								{project.description}
							</p>
						</div>

						<!-- Metadata Section -->
						<div class="space-y-3">
							<!-- Date -->
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<Calendar class="size-4" />
								<span>{formatDate(project.createdAt)}</span>
							</div>

							<!-- Multi-Sitio Indicator -->
							{#if project.sitioNames.length > 1}
								<div class="space-y-2">
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<MapPin class="size-4" />
										<span class="font-medium">Multi-sitio project</span>
									</div>
									<div class="flex flex-wrap gap-1.5">
										{#each project.sitioNames.slice(0, 3) as name}
											{@const sitioName = name.split(',')[0]}
											<Badge variant="secondary" class="text-xs font-normal">
												{sitioName}
											</Badge>
										{/each}
										{#if project.sitioNames.length > 3}
											<Badge variant="secondary" class="text-xs font-medium">
												+{project.sitioNames.length - 3} more
											</Badge>
										{/if}
									</div>
								</div>
							{/if}
						</div>

						<!-- Action Button -->
						<Button href="{baseUrl}/{project.id}" class="w-full" variant="outline">
							View Details
							<ExternalLink class="ml-2 size-4" />
						</Button>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Smooth transitions for hover effects */
	:global(.group) {
		transition: all 0.2s ease-in-out;
	}
</style>
