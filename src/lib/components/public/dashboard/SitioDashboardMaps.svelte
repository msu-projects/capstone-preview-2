<script lang="ts">
	import SitioClusterMap from '$lib/components/map/SitioClusterMap.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateCoordinates,
		aggregateRecommendations,
		getDataForYearOrLatest,
		type CoordinatesAggregation,
		type RecommendationsAggregation
	} from '$lib/utils/sitio-chart-aggregation';
	import { Info, MapPin } from '@lucide/svelte';

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
		onSitioClick?: (sitioId: number) => void;
	}

	let { sitios, selectedYear, onSitioClick }: Props = $props();

	// Aggregated data (using selected year)
	const coordinates = $derived<CoordinatesAggregation>(aggregateCoordinates(sitios, selectedYear));
	const recommendations = $derived<RecommendationsAggregation>(
		aggregateRecommendations(sitios, selectedYear)
	);

	// Prepare markers with classifications
	const markers = $derived(
		sitios
			.map((sitio) => {
				const profile = getDataForYearOrLatest(sitio, selectedYear);
				if (!profile || !profile.latitude || !profile.longitude) return null;

				return {
					id: sitio.id,
					name: profile.sitioName,
					barangay: profile.barangay,
					municipality: profile.municipality,
					latitude: profile.latitude,
					longitude: profile.longitude,
					classification: sitio.sitioClassification
				};
			})
			.filter((m): m is NonNullable<typeof m> => m !== null)
	);

	// Stats for the legend
	const markerStats = $derived({
		total: markers.length
	});

	function handleMarkerClick(marker: { id: number }) {
		onSitioClick?.(marker.id);
	}
</script>

<div class="space-y-6">
	<!-- Map Info Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card.Root class="bg-slate-50 dark:bg-slate-800/50">
			<Card.Content class="flex items-center gap-3 p-4">
				<div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
					<MapPin class="size-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{markerStats.total}</p>
					<p class="text-sm text-slate-500 dark:text-slate-400">Sitios on Map</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Main Map -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<MapPin class="size-5 text-blue-500" />
				Sitio Locations Map
			</Card.Title>
			<Card.Description>
				Geographic distribution of sitios. Click on markers for details.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if markers.length > 0}
				<SitioClusterMap
					{markers}
					bounds={coordinates.bounds}
					center={coordinates.center}
					height="500px"
					onMarkerClick={handleMarkerClick}
				/>
			{:else}
				<div
					class="flex h-125 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
				>
					<MapPin class="size-12 text-slate-400 dark:text-slate-500" />
					<p class="mt-4 text-slate-500 dark:text-slate-400">No sitios with coordinates found</p>
					<p class="mt-1 text-sm text-slate-400 dark:text-slate-500">
						Sitios need latitude/longitude data to appear on the map
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Legend -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<Info class="size-5 text-slate-500" />
				Map Legend
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div>
				<h4 class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
					Classification Badges
				</h4>
				<div class="flex flex-wrap gap-3">
					<div class="flex items-center gap-2">
						<span
							class="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
							>GIDA</span
						>
						<span class="text-sm text-slate-500 dark:text-slate-400">Geographically Isolated</span>
					</div>
					<div class="flex items-center gap-2">
						<span
							class="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
							>IP</span
						>
						<span class="text-sm text-slate-500 dark:text-slate-400">Indigenous Peoples</span>
					</div>
					<div class="flex items-center gap-2">
						<span
							class="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300"
							>Conflict</span
						>
						<span class="text-sm text-slate-500 dark:text-slate-400">Conflict Affected</span>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
