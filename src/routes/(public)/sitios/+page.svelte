<script lang="ts">
	import { goto } from '$app/navigation';
	import { DashboardSkeleton } from '$lib/components/sitios/dashboard';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { SitioRecord } from '$lib/types';
	import toTitleCase from '$lib/utils/common';
	import { loadSitios } from '$lib/utils/storage';
	import { FileText, Lightbulb, List, MapPin, X } from '@lucide/svelte';
	import { onMount } from 'svelte';

	// Props from +page.ts
	interface Props {
		data: {
			municipality: string;
			barangay: string;
			tab: string;
		};
	}

	const { data }: Props = $props();

	let sitios = $state<SitioRecord[]>([]);
	let isLoading = $state(true);

	// Filter state synced with URL
	let selectedMunicipality = $derived(data.municipality);
	let selectedBarangay = $derived(data.barangay);
	let activeTab = $derived(data.tab);

	// Sync state when data changes (e.g., browser back/forward)
	$effect(() => {
		selectedMunicipality = data.municipality;
		selectedBarangay = data.barangay;
		activeTab = data.tab;
	});

	onMount(() => {
		sitios = loadSitios();
		isLoading = false;
	});

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

	// Filter sitios based on selections
	const filteredSitios = $derived.by(() => {
		return sitios.filter((s) => {
			if (selectedMunicipality !== 'all' && s.municipality !== selectedMunicipality) {
				return false;
			}
			if (selectedBarangay !== 'all' && s.barangay !== selectedBarangay) {
				return false;
			}
			return true;
		});
	});

	// Create filter label for display
	const filterLabel = $derived.by(() => {
		if (selectedMunicipality === 'all') return 'All Sitios';
		if (selectedBarangay === 'all') return selectedMunicipality;
		return `${selectedBarangay}, ${selectedMunicipality}`;
	});

	// Check if filters are active
	const hasActiveFilters = $derived(selectedMunicipality !== 'all' || selectedBarangay !== 'all');

	// Update URL when filters or tab change
	function updateUrl() {
		const params = new URLSearchParams();
		if (selectedMunicipality !== 'all') params.set('municipality', selectedMunicipality);
		if (selectedBarangay !== 'all') params.set('barangay', selectedBarangay);
		if (activeTab !== 'demographic') params.set('tab', activeTab);

		const queryString = params.toString();
		goto(`/sitios${queryString ? `?${queryString}` : ''}`, { replaceState: true, noScroll: true });
	}

	// Handle filter changes
	function handleMunicipalityChange(value: string | undefined) {
		selectedMunicipality = value || 'all';
		selectedBarangay = 'all'; // Reset barangay when municipality changes
		updateUrl();
	}

	function handleBarangayChange(value: string | undefined) {
		selectedBarangay = value || 'all';
		updateUrl();
	}

	function handleTabChange(value: string) {
		activeTab = value;
		updateUrl();
	}

	function clearFilters() {
		selectedMunicipality = 'all';
		selectedBarangay = 'all';
		updateUrl();
	}

	// Tab configuration
	const tabs = [
		{ id: 'overview', label: 'Overview', icon: FileText }
		// Other tabs
	];
</script>

<svelte:head>
	<title>Sitios Dashboard - South Cotabato Data Bank</title>
	<meta
		name="description"
		content="Explore aggregated sitio data and community indicators across South Cotabato"
	/>
</svelte:head>

<div>
	<!-- Breadcrumb -->
	<!-- <AppBreadcrumb items={[{ label: 'Sitios Dashboard' }]} sticky={false} /> -->

	<!-- Hero Section -->
	<section
		class="relative overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50/30 py-8 md:py-12 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30"
	>
		<div
			class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"
		></div>

		<div class="relative container mx-auto px-4">
			<div class="mx-auto max-w-3xl text-center">
				<Badge
					variant="secondary"
					class="mb-4 gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
				>
					<MapPin class="size-3" />
					{toTitleCase(filterLabel) || 'All Sitios'} Data Dashboard
				</Badge>
				<h1
					class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-slate-100"
				>
					Sitio Dashboard
				</h1>
				<p class="mt-4 text-lg text-slate-600 dark:text-slate-400">
					Aggregated community data across South Cotabato. Filter by municipality or barangay to
					explore specific areas.
				</p>

				<div class="mt-5 flex flex-col items-center justify-center gap-3">
					<Button variant="default" size="default" href="/sitios/list" class="gap-2">
						<List class="size-4" />
						View Sitio List
					</Button>

					<Button
						variant="outline"
						size="default"
						href="/recommendations"
						class="gap-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
					>
						<Lightbulb class="size-4" />
						Find Recommended Sitios for Projects
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Filter Bar & Tabs -->
	<section class="container mx-auto px-4 py-6">
		<!-- Filter Bar -->
		<div class="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap items-center gap-3">
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
				<Select.Root type="single" value={selectedBarangay} onValueChange={handleBarangayChange}>
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

				<!-- Clear Filters -->
				{#if hasActiveFilters}
					<Button variant="ghost" size="sm" onclick={clearFilters} class="gap-1.5">
						<X class="size-4" />
						Clear Filters
					</Button>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<!-- Current filter label -->
				{#if hasActiveFilters}
					<Badge variant="secondary" class="gap-1.5">
						<MapPin class="size-3" />
						{filterLabel}
					</Badge>
				{/if}
			</div>
		</div>

		<!-- Loading State -->
		{#if isLoading}
			<DashboardSkeleton />
		{:else if filteredSitios.length === 0}
			<!-- Empty State -->
			<Card.Root class="py-16 text-center">
				<Card.Content>
					<div
						class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
					>
						<MapPin class="size-8 text-slate-400" />
					</div>
					<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">No Sitios Found</h3>
					<p class="mt-2 text-slate-500 dark:text-slate-400">
						No sitios match your current filter criteria. Try adjusting your filters.
					</p>
					<Button onclick={clearFilters} class="mt-4">Clear Filters</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Tabs -->
			<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
				<div
					class="sticky top-0 z-50 -mx-4 bg-linear-to-b from-slate-50 to-transparent px-4 pt-2 pb-2 sm:-mx-6 sm:px-6 dark:from-slate-900"
				>
					<Tabs.List
						class="inline-flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-800 dark:ring-slate-700/50"
					>
						{#each tabs as tab}
							<Tabs.Trigger
								value={tab.id}
								class="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
							>
								<tab.icon class="size-4" />
								<span class="hidden sm:inline">{tab.label}</span>
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
				</div>

				<div class="mt-3">
					<!-- Tabs Contents -->
					<Tabs.Content value="overview">
						<div class="space-y-8">
							<!-- Overview Section -->
						</div>
					</Tabs.Content>
					<!-- Other tabs -->
				</div>
			</Tabs.Root>
		{/if}
	</section>
</div>
