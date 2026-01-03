<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { ProjectWithSitios } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import { getProjectsWithSitiosBySitioId } from '$lib/utils/project-storage';
	import { ExternalLink, FolderKanban, ImageIcon, Plus } from '@lucide/svelte';
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
</script>

<div class="space-y-6">
	{#if isLoading}
		<div class="flex h-32 items-center justify-center">
			<div
				class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
			></div>
		</div>
	{:else if projects.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
				<FolderKanban class="mb-4 size-12 text-muted-foreground/50" />
				<h3 class="text-lg font-medium">No Projects Yet</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					No implemented projects have been linked to this sitio.
				</p>
				{#if showAdminActions}
					<Button href="/admin/projects/new" size="sm">
						<Plus class="mr-2 size-4" />
						Add Project
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Projects Grid -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each projects as project (project.id)}
				<Card.Root class="group overflow-hidden transition-shadow hover:shadow-md">
					<!-- Project Image -->
					{#if project.images.length > 0}
						<div class="relative aspect-video overflow-hidden bg-muted">
							<img
								src={project.images[0]}
								alt={project.title}
								class="size-full object-cover transition-transform group-hover:scale-105"
							/>
							{#if project.images.length > 1}
								<Badge class="absolute right-2 bottom-2 bg-black/60 text-white">
									+{project.images.length - 1} more
								</Badge>
							{/if}
						</div>
					{:else}
						<div class="flex aspect-video items-center justify-center bg-muted">
							<ImageIcon class="size-12 text-muted-foreground/50" />
						</div>
					{/if}

					<Card.Content class="p-4">
						<!-- Title & Description -->
						<h3 class="mb-1 line-clamp-1 font-semibold">{project.title}</h3>
						<p class="mb-3 line-clamp-2 text-sm text-muted-foreground">
							{project.description}
						</p>

						<!-- Cost Badge -->
						<div class="mb-3">
							<Badge variant="secondary" class="font-semibold">
								{formatCurrency(project.cost)}
							</Badge>
						</div>

						<!-- Sitios Involved -->
						{#if project.sitioNames.length > 1}
							<div class="mb-3 flex flex-wrap gap-1">
								<span class="text-xs text-muted-foreground">Also in:</span>
								{#each project.sitioNames.slice(0, 2) as name}
									{@const sitioName = name.split(',')[0]}
									<Badge variant="outline" class="text-xs">{sitioName}</Badge>
								{/each}
								{#if project.sitioNames.length > 2}
									<Badge variant="outline" class="text-xs">
										+{project.sitioNames.length - 2}
									</Badge>
								{/if}
							</div>
						{/if}

						<!-- Date & Actions -->
						<div class="flex items-center justify-between">
							<span class="text-xs text-muted-foreground">
								{formatDate(project.createdAt)}
							</span>
							<Button variant="ghost" size="sm" href="{baseUrl}/{project.id}">
								<ExternalLink class="mr-1 size-3" />
								View
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Summary -->
		<Card.Root class="bg-muted/30">
			<Card.Content class="flex flex-wrap items-center justify-between gap-4 p-4">
				<div class="flex items-center gap-6">
					<div>
						<p class="text-sm text-muted-foreground">Total Projects</p>
						<p class="text-2xl font-bold">{projects.length}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Total Investment</p>
						<p class="text-2xl font-bold">
							{formatCurrency(projects.reduce((sum, p) => sum + p.cost, 0))}
						</p>
					</div>
				</div>
				{#if showAdminActions}
					<Button variant="outline" href="/admin/projects/new">
						<Plus class="mr-2 size-4" />
						Add Project
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
