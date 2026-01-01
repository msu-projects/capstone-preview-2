<script lang="ts">
	import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { SitioProfile, SitioRecord } from '$lib/types';
	import { loadSitios } from '$lib/utils/storage';
	import { ArrowLeft, ArrowRight, Grid3x3, Lightbulb, List, MapPin, Search } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let sitios = $state<SitioRecord[]>([]);
	let isLoading = $state(true);
	let searchTerm = $state('');
	let selectedMunicipality = $state<string>('all');
	let selectedBarangay = $state<string>('all');
	let sortBy = $state<string>('name');
	let currentPage = $state(1);
	let viewMode = $state<'grid' | 'list'>('grid');
	const itemsPerPage = 12;

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

	onMount(() => {
		sitios = loadSitios();
		isLoading = false;
	});

	// Filter sitios
	const filteredSitios = $derived.by(() => {
		let filtered = sitios.filter((s) => {
			// Municipality filter
			if (selectedMunicipality !== 'all' && s.municipality !== selectedMunicipality) {
				return false;
			}

			// Barangay filter
			if (selectedBarangay !== 'all' && s.barangay !== selectedBarangay) {
				return false;
			}

			// Search term filter
			if (searchTerm) {
				const term = searchTerm.toLowerCase();
				return (
					s.sitioName.toLowerCase().includes(term) ||
					s.municipality.toLowerCase().includes(term) ||
					s.barangay.toLowerCase().includes(term)
				);
			}

			return true;
		});

		// Sort the filtered results
		return filtered.sort((a, b) => {
			const aLatest = getLatestData(a);
			const bLatest = getLatestData(b);
			if (!aLatest || !bLatest) {
				return 0;
			}

			switch (sortBy) {
				case 'name':
					return a.sitioName.localeCompare(b.sitioName);
				case 'population-high':
					return bLatest.totalPopulation - aLatest.totalPopulation;
				case 'population-low':
					return aLatest.totalPopulation - bLatest.totalPopulation;
				case 'households-high':
					return bLatest.totalHouseholds - aLatest.totalHouseholds;
				case 'households-low':
					return aLatest.totalHouseholds - bLatest.totalHouseholds;
				case 'need-high':
					return bLatest.averageNeedScore - aLatest.averageNeedScore;
				case 'need-low':
					return aLatest.averageNeedScore - bLatest.averageNeedScore;
				default:
					return 0;
			}
		});
	});

	function getLatestData(sitio: SitioRecord): SitioProfile | undefined {
		const latestYear = Object.keys(sitio.yearlyData).toReversed().at(0);
		if (!latestYear) {
			return;
		}

		return sitio.yearlyData[latestYear];
	}

	// Paginate
	const totalPages = $derived(Math.ceil(filteredSitios.length / itemsPerPage));
	const paginatedSitios = $derived(
		filteredSitios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	// Handle filter changes
	function handleMunicipalityChange(value: string | undefined) {
		selectedMunicipality = value || 'all';
		selectedBarangay = 'all';
		currentPage = 1;
	}

	function handleBarangayChange(value: string | undefined) {
		selectedBarangay = value || 'all';
		currentPage = 1;
	}

	function handleSortChange(value: string | undefined) {
		sortBy = value || 'name';
		currentPage = 1;
	}
</script>

<svelte:head>
	<title>All Sitios - South Cotabato Data Bank</title>
	<meta
		name="description"
		content="Browse all sitio profiles and community data across South Cotabato"
	/>
</svelte:head>

<div
	class="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20"
>
	<!-- Breadcrumb -->
	<AppBreadcrumb
		items={[{ label: 'Sitios Dashboard', href: '/sitios' }, { label: 'All Sitios' }]}
	/>

	<!-- Header -->
	<section class="border-b bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
		<div class="container mx-auto px-4">
			<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-4">
					<Button href="/sitios" variant="ghost" size="icon" class="shrink-0">
						<ArrowLeft class="size-5" />
					</Button>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<h1
								class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100"
							>
								All Sitios
							</h1>
							<Badge variant="secondary" class="gap-1">
								<MapPin class="size-3" />
								{filteredSitios.length}
								{filteredSitios.length === 1 ? 'sitio' : 'sitios'}
							</Badge>
						</div>
						<p class="mt-1 text-slate-600 dark:text-slate-400">
							Browse and search through all registered sitios in South Cotabato
						</p>
					</div>
				</div>
				<div class="flex gap-2">
					<Button href="/recommendations" variant="outline" class="gap-2">
						<Lightbulb class="size-4" />
						<span class="hidden sm:inline">Find Recommendations</span>
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Filters & Grid -->
	<section class="container mx-auto px-4 py-6">
		<!-- Filters -->
		<Card.Root class="mb-6 shadow-sm">
			<Card.Content class="pt-6">
				<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-1 flex-wrap gap-3">
						<!-- Search -->
						<div class="relative w-full sm:max-w-xs">
							<Search
								class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								type="search"
								placeholder="Search sitios..."
								bind:value={searchTerm}
								class="pl-9"
								oninput={() => (currentPage = 1)}
							/>
						</div>

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
						<Select.Root
							type="single"
							value={selectedBarangay}
							onValueChange={handleBarangayChange}
						>
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

						<!-- Sort Filter -->
						<Select.Root type="single" value={sortBy} onValueChange={handleSortChange}>
							<Select.Trigger class="w-full sm:w-50">
								{#if sortBy === 'name'}
									Sort: Name (A-Z)
								{:else if sortBy === 'population-high'}
									Sort: Population ↓
								{:else if sortBy === 'population-low'}
									Sort: Population ↑
								{:else if sortBy === 'households-high'}
									Sort: Households ↓
								{:else if sortBy === 'households-low'}
									Sort: Households ↑
								{:else if sortBy === 'need-high'}
									Sort: Need Score ↓
								{:else if sortBy === 'need-low'}
									Sort: Need Score ↑
								{/if}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="name">Name (A-Z)</Select.Item>
								<Select.Item value="need-high">Need Score (High→Low)</Select.Item>
								<Select.Item value="need-low">Need Score (Low→High)</Select.Item>
								<Select.Item value="population-high">Population (High→Low)</Select.Item>
								<Select.Item value="population-low">Population (Low→High)</Select.Item>
								<Select.Item value="households-high">Households (High→Low)</Select.Item>
								<Select.Item value="households-low">Households (Low→High)</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex items-center gap-2">
						<!-- View Mode Toggle -->
						<Tabs.Root bind:value={viewMode} class="w-auto">
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="grid" class="gap-1.5">
									<Grid3x3 class="size-4" />
									<span class="hidden sm:inline">Grid</span>
								</Tabs.Trigger>
								<Tabs.Trigger value="list" class="gap-1.5">
									<List class="size-4" />
									<span class="hidden sm:inline">List</span>
								</Tabs.Trigger>
							</Tabs.List>
						</Tabs.Root>
					</div>
				</div>

				<div class="flex items-center justify-between text-sm text-muted-foreground">
					<span>
						Showing {paginatedSitios.length} of {filteredSitios.length}
						{filteredSitios.length === 1 ? 'sitio' : 'sitios'}
					</span>
					{#if searchTerm || selectedMunicipality !== 'all' || selectedBarangay !== 'all'}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => {
								searchTerm = '';
								selectedMunicipality = 'all';
								selectedBarangay = 'all';
								currentPage = 1;
							}}
						>
							Clear filters
						</Button>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Loading State -->
		{#if isLoading}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each Array(8) as _}
					<Card.Root class="overflow-hidden">
						<Card.Content class="pt-5">
							<div class="mb-3 flex items-start justify-between">
								<div class="space-y-2">
									<Skeleton class="h-5 w-32" />
									<Skeleton class="h-4 w-24" />
								</div>
								<Skeleton class="h-5 w-16" />
							</div>
							<div class="grid grid-cols-3 gap-2">
								{#each Array(3) as _}
									<Skeleton class="h-16 w-full rounded-lg" />
								{/each}
							</div>
							<Skeleton class="mt-4 h-9 w-full" />
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{:else if paginatedSitios.length === 0}
			<!-- Empty State -->
			<Card.Root class="py-12 text-center">
				<Card.Content>
					<div
						class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100"
					>
						<MapPin class="size-6 text-slate-400" />
					</div>
					<h3 class="text-lg font-semibold text-slate-900">No Sitios Found</h3>
					<p class="mt-1 text-slate-500">Try adjusting your search or filter criteria.</p>
					<Button
						variant="outline"
						class="mt-4"
						onclick={() => {
							searchTerm = '';
							selectedMunicipality = 'all';
							selectedBarangay = 'all';
							sortBy = 'name';
						}}
					>
						Clear Filters
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Sitios Grid View -->
			{#if viewMode === 'grid'}
				<!-- Grid View -->
			{:else}
				<!-- List View -->
			{/if}

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-8 flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === 1}
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					>
						<ArrowLeft class="mr-1 size-4" />
						Previous
					</Button>
					<div class="flex items-center gap-1">
						{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
							const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
							return start + i;
						}).filter((p) => p <= totalPages) as pageNum}
							<Button
								variant={currentPage === pageNum ? 'default' : 'outline'}
								size="sm"
								class="w-10"
								onclick={() => (currentPage = pageNum)}
							>
								{pageNum}
							</Button>
						{/each}
					</div>
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === totalPages}
						onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					>
						Next
						<ArrowRight class="ml-1 size-4" />
					</Button>
				</div>
			{/if}
		{/if}
	</section>
</div>
