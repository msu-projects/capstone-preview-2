<script lang="ts">
	import SitioClusterMap from '$lib/components/map/SitioClusterMap.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateCoordinates,
		getDataForYearOrLatest,
		type CoordinatesAggregation
	} from '$lib/utils/sitio-chart-aggregation';
	import { Layers, Map, MapPin, MapPinned, Navigation } from '@lucide/svelte';

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
		onSitioClick?: (sitioId: number) => void;
	}

	let { sitios, selectedYear, onSitioClick }: Props = $props();

	// Aggregated coordinates data
	const coordinates = $derived<CoordinatesAggregation>(aggregateCoordinates(sitios, selectedYear));

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

	// Classification counts
	const classificationCounts = $derived(() => {
		const counts = { gida: 0, ip: 0, conflict: 0, none: 0 };
		markers.forEach((marker) => {
			if (marker.classification?.gida) counts.gida++;
			if (marker.classification?.indigenous) counts.ip++;
			if (marker.classification?.conflict) counts.conflict++;
			if (
				!marker.classification?.gida &&
				!marker.classification?.indigenous &&
				!marker.classification?.conflict
			) {
				counts.none++;
			}
		});
		return counts;
	});

	function handleMarkerClick(marker: { id: number }) {
		onSitioClick?.(marker.id);
	}
</script>

<div class="space-y-4">
	<!-- Stats Row -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div
			class="flex items-center gap-3 rounded-xl border border-slate-200 bg-linear-to-br from-blue-50 to-white p-3 shadow-sm dark:border-slate-700 dark:from-blue-950/30 dark:to-slate-900"
		>
			<div class="rounded-lg bg-blue-500/10 p-2">
				<MapPinned class="size-5 text-blue-600 dark:text-blue-400" />
			</div>
			<div>
				<p class="text-xl font-bold text-slate-900 dark:text-slate-100">{markers.length}</p>
				<p class="text-xs text-slate-500 dark:text-slate-400">Mapped Sitios</p>
			</div>
		</div>

		<div
			class="flex items-center gap-3 rounded-xl border border-slate-200 bg-linear-to-br from-amber-50 to-white p-3 shadow-sm dark:border-slate-700 dark:from-amber-950/30 dark:to-slate-900"
		>
			<div class="rounded-lg bg-amber-500/10 p-2">
				<Navigation class="size-5 text-amber-600 dark:text-amber-400" />
			</div>
			<div>
				<p class="text-xl font-bold text-slate-900 dark:text-slate-100">
					{classificationCounts().gida}
				</p>
				<p class="text-xs text-slate-500 dark:text-slate-400">GIDA Areas</p>
			</div>
		</div>

		<div
			class="flex items-center gap-3 rounded-xl border border-slate-200 bg-linear-to-br from-indigo-50 to-white p-3 shadow-sm dark:border-slate-700 dark:from-indigo-950/30 dark:to-slate-900"
		>
			<div class="rounded-lg bg-indigo-500/10 p-2">
				<Layers class="size-5 text-indigo-600 dark:text-indigo-400" />
			</div>
			<div>
				<p class="text-xl font-bold text-slate-900 dark:text-slate-100">
					{classificationCounts().ip}
				</p>
				<p class="text-xs text-slate-500 dark:text-slate-400">IP Communities</p>
			</div>
		</div>

		<div
			class="flex items-center gap-3 rounded-xl border border-slate-200 bg-linear-to-br from-rose-50 to-white p-3 shadow-sm dark:border-slate-700 dark:from-rose-950/30 dark:to-slate-900"
		>
			<div class="rounded-lg bg-rose-500/10 p-2">
				<MapPin class="size-5 text-rose-600 dark:text-rose-400" />
			</div>
			<div>
				<p class="text-xl font-bold text-slate-900 dark:text-slate-100">
					{classificationCounts().conflict}
				</p>
				<p class="text-xs text-slate-500 dark:text-slate-400">Conflict Areas</p>
			</div>
		</div>
	</div>

	<!-- Main Map Card -->
	<Card.Root class="gap-0 overflow-hidden border-slate-200 py-0 shadow-sm dark:border-slate-700">
		<Card.Header
			class="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/50"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-blue-500/10 p-1.5">
						<Map class="size-4 text-blue-600 dark:text-blue-400" />
					</div>
					<Card.Title class="text-base font-semibold">Geographic Distribution</Card.Title>
				</div>
				{#if markers.length > 0}
					<span
						class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
					>
						{markers.length} location{markers.length !== 1 ? 's' : ''}
					</span>
				{/if}
			</div>
			<Card.Description class="mt-1 text-xs">
				Interactive map showing sitio locations. Click markers for details.
			</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			{#if markers.length > 0}
				<div class="relative">
					<SitioClusterMap
						{markers}
						bounds={coordinates.bounds}
						center={coordinates.center}
						height="480px"
						onMarkerClick={handleMarkerClick}
					/>
					<!-- Floating Legend -->
					<div
						class="absolute bottom-4 left-4 z-1000 rounded-lg border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95"
					>
						<p class="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
							Marker Colors
						</p>
						<div class="flex flex-col gap-1.5">
							<div class="flex items-center gap-2">
								<div class="h-4 w-4 rounded-full bg-red-500"></div>
								<span class="text-xs text-slate-600 dark:text-slate-300">Conflict Affected</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="h-4 w-4 rounded-full bg-orange-500"></div>
								<span class="text-xs text-slate-600 dark:text-slate-300"
									>Geographically Isolated (GIDA)</span
								>
							</div>
							<div class="flex items-center gap-2">
								<div class="h-4 w-4 rounded-full bg-violet-500"></div>
								<span class="text-xs text-slate-600 dark:text-slate-300"
									>Indigenous Peoples (IP)</span
								>
							</div>
							<div class="flex items-center gap-2">
								<div class="h-4 w-4 rounded-full bg-blue-500"></div>
								<span class="text-xs text-slate-600 dark:text-slate-300">Standard</span>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div
					class="flex h-96 flex-col items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900"
				>
					<div class="rounded-full bg-slate-200/80 p-4 dark:bg-slate-700/50">
						<MapPin class="size-10 text-slate-400 dark:text-slate-500" />
					</div>
					<p class="mt-4 font-medium text-slate-600 dark:text-slate-300">No mapped locations</p>
					<p class="mt-1 max-w-xs text-center text-sm text-slate-400 dark:text-slate-500">
						Sitios require latitude and longitude coordinates to appear on the map
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
