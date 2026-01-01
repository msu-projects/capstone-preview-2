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
	import {
		ArrowLeft,
		ArrowRight,
		Grid3x3,
		Home,
		Lightbulb,
		List,
		MapPin,
		Search,
		Signal,
		Users,
		Zap
	} from '@lucide/svelte';
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

	/**
	 * Get the need score badge variant and color based on score
	 */
	function getNeedScoreStyle(score: number): {
		variant: 'default' | 'secondary' | 'destructive' | 'outline';
		class: string;
		label: string;
	} {
		if (score >= 2.5) {
			return {
				variant: 'destructive',
				class: 'bg-red-500 hover:bg-red-600 text-white',
				label: 'Critical'
			};
		} else if (score >= 2) {
			return {
				variant: 'default',
				class: 'bg-orange-500 hover:bg-orange-600 text-white',
				label: 'High'
			};
		} else if (score >= 1.5) {
			return {
				variant: 'default',
				class: 'bg-yellow-500 hover:bg-yellow-600 text-white',
				label: 'Medium'
			};
		} else {
			return {
				variant: 'secondary',
				class: 'bg-green-500 hover:bg-green-600 text-white',
				label: 'Low'
			};
		}
	}

	/**
	 * Calculate percentage safely
	 */
	function calcPercent(value: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((value / total) * 100);
	}

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
				<div class="hidden gap-2">
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
			<Card.Content class="">
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
						<Card.Content class="p-0">
							<!-- Header skeleton -->
							<div
								class="flex items-start justify-between border-b border-slate-100 p-4 dark:border-slate-800"
							>
								<div class="flex-1 space-y-2">
									<Skeleton class="h-5 w-32" />
									<Skeleton class="h-4 w-40" />
								</div>
								<Skeleton class="h-6 w-10 rounded-full" />
							</div>
							<!-- Stats skeleton -->
							<div class="grid grid-cols-2 gap-3 p-4">
								<Skeleton class="h-24 w-full rounded-lg" />
								<Skeleton class="h-24 w-full rounded-lg" />
							</div>
							<!-- Indicators skeleton -->
							<div class="space-y-2 border-t border-slate-100 px-4 pt-3 pb-2 dark:border-slate-800">
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-full" />
							</div>
							<!-- Link skeleton -->
							<div class="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
								<Skeleton class="h-5 w-24" />
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{:else if paginatedSitios.length === 0}
			<!-- Empty State -->
			<Card.Root class="py-12 text-center">
				<Card.Content>
					<div
						class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
					>
						<MapPin class="size-6 text-slate-400 dark:text-slate-500" />
					</div>
					<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">No Sitios Found</h3>
					<p class="mt-1 text-slate-500 dark:text-slate-400">
						Try adjusting your search or filter criteria.
					</p>
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
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each paginatedSitios as sitio (sitio.coding)}
						{@const latestData = getLatestData(sitio)}
						{@const needStyle = getNeedScoreStyle(latestData?.averageNeedScore ?? 0)}
						{@const toiletPercent = calcPercent(
							latestData?.householdsWithToilet ?? 0,
							latestData?.totalHouseholds ?? 1
						)}
						{@const electricityPercent = calcPercent(
							latestData?.householdsWithElectricity ?? 0,
							latestData?.totalHouseholds ?? 1
						)}
						{@const signalLevel = latestData?.mobileSignal ?? 'none'}
						<Card.Root
							class="group overflow-hidden border-slate-200 py-0 transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:hover:border-blue-700"
						>
							<Card.Content class="p-0">
								<!-- Header with name and need score -->
								<div
									class="flex items-start justify-between border-b border-slate-100 p-4 dark:border-slate-800"
								>
									<div class="min-w-0 flex-1">
										<h3
											class="truncate font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400"
										>
											{sitio.sitioName}
										</h3>
										<p
											class="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400"
										>
											<MapPin class="size-3 shrink-0" />
											<span class="truncate"
												>{sitio.barangay}, {sitio.municipality.toUpperCase()}</span
											>
										</p>
									</div>
									<Badge class="{needStyle.class} ml-2 shrink-0">
										{(latestData?.averageNeedScore ?? 0).toFixed(1)}
									</Badge>
								</div>

								<!-- Stats Grid -->
								<div class="grid grid-cols-2 gap-3 p-4">
									<!-- Population -->
									<div
										class="flex flex-col items-center rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30"
									>
										<div
											class="mb-1.5 flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50"
										>
											<Users class="size-4 text-blue-600 dark:text-blue-400" />
										</div>
										<span class="text-lg font-bold text-slate-900 dark:text-slate-100">
											{(latestData?.totalPopulation ?? 0).toLocaleString()}
										</span>
										<span class="text-xs text-slate-500 dark:text-slate-400">Population</span>
									</div>

									<!-- Households -->
									<div
										class="flex flex-col items-center rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"
									>
										<div
											class="mb-1.5 flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50"
										>
											<Home class="size-4 text-emerald-600 dark:text-emerald-400" />
										</div>
										<span class="text-lg font-bold text-slate-900 dark:text-slate-100">
											{(latestData?.totalHouseholds ?? 0).toLocaleString()}
										</span>
										<span class="text-xs text-slate-500 dark:text-slate-400">Households</span>
									</div>
								</div>

								<!-- Indicators -->
								<div
									class="space-y-2 border-t border-slate-100 px-4 pt-3 pb-2 dark:border-slate-800"
								>
									<!-- Toilet Access -->
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-500 dark:text-slate-400">🚽 Toilet Access</span>
										<span class="font-medium text-slate-700 dark:text-slate-300"
											>{toiletPercent}%</span
										>
									</div>

									<!-- Electricity -->
									<div class="flex items-center justify-between text-sm">
										<span class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
											<Zap class="size-3.5 text-yellow-500" />
											Electricity
										</span>
										<span class="font-medium text-slate-700 dark:text-slate-300"
											>{electricityPercent}%</span
										>
									</div>

									<!-- Mobile Signal -->
									<div class="flex items-center justify-between text-sm">
										<span class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
											<Signal class="size-3.5 text-blue-500" />
											Signal
										</span>
										<span class="font-medium text-slate-700 uppercase dark:text-slate-300"
											>{signalLevel === 'none' ? 'None' : signalLevel}</span
										>
									</div>
								</div>

								<!-- View Profile Link -->
								<a
									href="/sitios/{sitio.id}"
									class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-slate-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
								>
									<span>View Profile</span>
									<ArrowRight class="size-4" />
								</a>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{:else}
				<!-- List View -->
				<div class="space-y-3">
					{#each paginatedSitios as sitio (sitio.coding)}
						{@const latestData = getLatestData(sitio)}
						{@const needStyle = getNeedScoreStyle(latestData?.averageNeedScore ?? 0)}
						{@const toiletPercent = calcPercent(
							latestData?.householdsWithToilet ?? 0,
							latestData?.totalHouseholds ?? 1
						)}
						{@const electricityPercent = calcPercent(
							latestData?.householdsWithElectricity ?? 0,
							latestData?.totalHouseholds ?? 1
						)}
						{@const signalLevel = latestData?.mobileSignal ?? 'none'}
						<Card.Root
							class="group overflow-hidden border-slate-200 transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:hover:border-blue-700"
						>
							<Card.Content class="p-0">
								<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
									<!-- Left: Name & Location -->
									<div class="flex items-center gap-4">
										<Badge class="{needStyle.class} shrink-0">
											{(latestData?.averageNeedScore ?? 0).toFixed(1)}
										</Badge>
										<div class="min-w-0">
											<h3
												class="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400"
											>
												{sitio.sitioName}
											</h3>
											<p class="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
												<MapPin class="size-3 shrink-0" />
												{sitio.barangay}, {sitio.municipality.toUpperCase()}
											</p>
										</div>
									</div>

									<!-- Middle: Stats -->
									<div class="flex flex-wrap items-center gap-4 sm:gap-6">
										<div class="flex items-center gap-2">
											<div
												class="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50"
											>
												<Users class="size-4 text-blue-600 dark:text-blue-400" />
											</div>
											<div class="text-sm">
												<div class="font-semibold text-slate-900 dark:text-slate-100">
													{(latestData?.totalPopulation ?? 0).toLocaleString()}
												</div>
												<div class="text-xs text-slate-500 dark:text-slate-400">Population</div>
											</div>
										</div>

										<div class="flex items-center gap-2">
											<div
												class="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50"
											>
												<Home class="size-4 text-emerald-600 dark:text-emerald-400" />
											</div>
											<div class="text-sm">
												<div class="font-semibold text-slate-900 dark:text-slate-100">
													{(latestData?.totalHouseholds ?? 0).toLocaleString()}
												</div>
												<div class="text-xs text-slate-500 dark:text-slate-400">Households</div>
											</div>
										</div>

										<div class="hidden items-center gap-4 text-sm lg:flex">
											<div class="text-center">
												<div class="font-medium text-slate-700 dark:text-slate-300">
													{toiletPercent}%
												</div>
												<div class="text-xs text-slate-500 dark:text-slate-400">Toilet</div>
											</div>
											<div class="text-center">
												<div class="font-medium text-slate-700 dark:text-slate-300">
													{electricityPercent}%
												</div>
												<div class="text-xs text-slate-500 dark:text-slate-400">Electricity</div>
											</div>
											<div class="text-center">
												<div class="font-medium text-slate-700 uppercase dark:text-slate-300">
													{signalLevel === 'none' ? '—' : signalLevel}
												</div>
												<div class="text-xs text-slate-500 dark:text-slate-400">Signal</div>
											</div>
										</div>
									</div>

									<!-- Right: Action -->
									<Button
										href="/sitios/{sitio.coding}"
										variant="ghost"
										class="gap-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
									>
										View Profile
										<ArrowRight class="size-4" />
									</Button>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
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
