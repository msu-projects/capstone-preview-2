<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { getBarangaysForMunicipality, getMunicipalities } from '$lib/config/location-data';
	import type { SitioRecord } from '$lib/types';
	import type { ReportFilters } from '$lib/types/report';
	import { getAllAvailableYears } from '$lib/utils/sitio-chart-aggregation';

	interface Props {
		filters: ReportFilters;
		sitios: SitioRecord[];
		includeTrends: boolean;
		onfilterschange?: (filters: ReportFilters) => void;
		ontrendschange?: (includeTrends: boolean) => void;
	}

	let {
		filters = $bindable(),
		sitios,
		includeTrends = $bindable(),
		onfilterschange,
		ontrendschange
	}: Props = $props();

	// Get available years from sitios data
	const availableYears = $derived(getAllAvailableYears(sitios).sort((a, b) => b - a));
	const municipalities = getMunicipalities();

	// Get barangays for selected municipality
	const barangays = $derived(
		filters.municipality ? getBarangaysForMunicipality(filters.municipality) : []
	);

	// Comparison year options (exclude current year)
	const comparisonYears = $derived(availableYears.filter((y) => y !== filters.year));

	function updateYear(value: string | undefined) {
		if (value) {
			filters = { ...filters, year: parseInt(value) };
			// Reset compare year if it's the same as new year
			if (filters.compareYear === filters.year) {
				filters = { ...filters, compareYear: undefined };
			}
			onfilterschange?.(filters);
		}
	}

	function updateCompareYear(value: string | undefined) {
		filters = { ...filters, compareYear: value ? parseInt(value) : undefined };
		onfilterschange?.(filters);
	}

	function updateMunicipality(value: string | undefined) {
		filters = {
			...filters,
			municipality: value || undefined,
			barangay: undefined // Reset barangay when municipality changes
		};
		onfilterschange?.(filters);
	}

	function updateBarangay(value: string | undefined) {
		filters = { ...filters, barangay: value || undefined };
		onfilterschange?.(filters);
	}

	function toggleTrends(checked: boolean) {
		includeTrends = checked;
		ontrendschange?.(checked);
	}
</script>

<div class="space-y-6">
	<!-- Year Selection -->
	<div class="space-y-4">
		<h3 class="text-sm font-medium">Data Year</h3>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<Label for="year">Primary Year</Label>
				<Select.Root type="single" value={filters.year.toString()} onValueChange={updateYear}>
					<Select.Trigger id="year" class="w-full">
						{filters.year}
					</Select.Trigger>
					<Select.Content>
						{#each availableYears as year}
							<Select.Item value={year.toString()}>{year}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<p class="text-xs text-muted-foreground">Select the year for report data</p>
			</div>

			<div class="space-y-2">
				<Label for="compare-year">Comparison Year (Optional)</Label>
				<Select.Root
					type="single"
					value={filters.compareYear?.toString() ?? ''}
					onValueChange={updateCompareYear}
				>
					<Select.Trigger id="compare-year" class="w-full">
						{filters.compareYear ?? 'None'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">None</Select.Item>
						{#each comparisonYears as year}
							<Select.Item value={year.toString()}>{year}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<p class="text-xs text-muted-foreground">Compare with previous year data</p>
			</div>
		</div>
	</div>

	<!-- Geographic Filters -->
	<div class="space-y-4">
		<h3 class="text-sm font-medium">Geographic Scope</h3>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<Label for="municipality">Municipality</Label>
				<Select.Root
					type="single"
					value={filters.municipality ?? ''}
					onValueChange={updateMunicipality}
				>
					<Select.Trigger id="municipality" class="w-full">
						{filters.municipality ?? 'All Municipalities'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Municipalities</Select.Item>
						{#each municipalities as municipality}
							<Select.Item value={municipality}>{municipality}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="barangay">Barangay</Label>
				<Select.Root
					type="single"
					value={filters.barangay ?? ''}
					onValueChange={updateBarangay}
					disabled={!filters.municipality}
				>
					<Select.Trigger id="barangay" class="w-full">
						{filters.barangay ?? 'All Barangays'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Barangays</Select.Item>
						{#each barangays as barangay}
							<Select.Item value={barangay}>{barangay}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</div>

	<!-- Trends Toggle -->
	<div class="flex items-center justify-between rounded-lg border p-4">
		<div class="space-y-0.5">
			<Label for="trends-toggle" class="text-base">Include Year-over-Year Trends</Label>
			<p class="text-sm text-muted-foreground">
				Show percentage changes compared to the previous year
			</p>
		</div>
		<Switch
			id="trends-toggle"
			checked={includeTrends}
			onCheckedChange={toggleTrends}
			disabled={comparisonYears.length === 0}
		/>
	</div>
</div>
