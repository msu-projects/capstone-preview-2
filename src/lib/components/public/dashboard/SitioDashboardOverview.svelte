<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import RadarChart from '$lib/components/charts/RadarChart.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateDemographics,
		aggregateGeographic,
		aggregateRecommendations,
		aggregateUtilities,
		type DemographicsAggregation,
		type GeographicAggregation,
		type RecommendationsAggregation,
		type UtilitiesAggregation
	} from '$lib/utils/sitio-chart-aggregation';
	import {
		Building2,
		Home,
		Lightbulb,
		MapPin,
		ShieldAlert,
		Toilet,
		Users,
		Zap
	} from '@lucide/svelte';
	import DashboardStatCard from './DashboardStatCard.svelte';

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
	}

	let { sitios, selectedYear }: Props = $props();

	// Aggregated data
	const demographics = $derived<DemographicsAggregation>(aggregateDemographics(sitios));
	const utilities = $derived<UtilitiesAggregation>(aggregateUtilities(sitios));
	const geographic = $derived<GeographicAggregation>(aggregateGeographic(sitios));
	const recommendations = $derived<RecommendationsAggregation>(aggregateRecommendations(sitios));

	// Classification distribution for donut chart
	const classificationData = $derived([
		{ label: 'GIDA', value: demographics.gidaCount, color: 'hsl(45, 93%, 47%)' },
		{ label: 'Indigenous', value: demographics.indigenousCount, color: 'hsl(217, 91%, 60%)' },
		{ label: 'Conflict Affected', value: demographics.conflictCount, color: 'hsl(0, 84%, 60%)' }
	]);

	// Utilities coverage for radar chart
	const utilitiesCoverageData = $derived([
		{ label: 'Electricity', value: utilities.electricityPercent },
		{ label: 'Toilet Access', value: utilities.toiletPercent },
		{ label: 'Internet', value: utilities.internetPercent }
	]);

	// Geographic distribution for bar chart
	const municipalityData = $derived(
		geographic.municipalities.slice(0, 8).map((m) => ({
			label: m.municipality,
			value: m.sitioCount
		}))
	);
</script>

<div class="space-y-6">
	<!-- Key Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<DashboardStatCard
			title="Total Sitios"
			value={sitios.length}
			subtitle="{geographic.totalBarangays} barangays, {geographic.totalMunicipalities} municipalities"
			icon={MapPin}
			variant="primary"
		/>
		<DashboardStatCard
			title="Total Population"
			value={demographics.totalPopulation}
			subtitle="Avg {demographics.averageHouseholdSize.toFixed(1)} per household"
			icon={Users}
			variant="success"
		/>
		<DashboardStatCard
			title="Total Households"
			value={demographics.totalHouseholds}
			icon={Home}
			variant="default"
			subtitle="Avg {(demographics.totalHouseholds / sitios.length).toFixed(1)}  per sitios"
		/>
	</div>

	<!-- Utility Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<DashboardStatCard
			title="Electricity Access Rate"
			value="{utilities.electricityPercent.toFixed(1)}%"
			subtitle="{utilities.householdsWithElectricity.toLocaleString()} households"
			icon={Zap}
			variant={utilities.electricityPercent >= 80
				? 'success'
				: utilities.electricityPercent >= 50
					? 'warning'
					: 'danger'}
		/>
		<DashboardStatCard
			title="Toilet Access Rate"
			value="{utilities.toiletPercent.toFixed(1)}%"
			subtitle="{utilities.householdsWithToilet.toLocaleString()} households"
			icon={Toilet}
			variant={utilities.toiletPercent >= 80
				? 'success'
				: utilities.toiletPercent >= 50
					? 'warning'
					: 'danger'}
		/>
		<DashboardStatCard
			title="Internet Access"
			value="{utilities.internetPercent.toFixed(1)}%"
			subtitle="{utilities.householdsWithInternet.toLocaleString()} households"
			icon={Lightbulb}
			variant={utilities.internetPercent >= 50
				? 'success'
				: utilities.internetPercent >= 25
					? 'warning'
					: 'danger'}
		/>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Classification Distribution -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<ShieldAlert class="size-5 text-amber-500" />
					Sitio Classification
				</Card.Title>
				<Card.Description>Distribution of sitios by vulnerability classification</Card.Description>
			</Card.Header>
			<Card.Content>
				<DonutChart
					data={classificationData}
					centerLabel="Total Sitios"
					centerValue={sitios.length.toString()}
					height={280}
				/>
			</Card.Content>
		</Card.Root>

		<!-- Utilities Coverage Radar -->
		<Card.Root class="hidden">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Zap class="size-5 text-emerald-500" />
					Utilities Coverage
				</Card.Title>
				<Card.Description>Percentage of households with access to basic utilities</Card.Description>
			</Card.Header>
			<Card.Content>
				<RadarChart
					data={utilitiesCoverageData}
					height={280}
					title="Coverage %"
					color="hsl(142, 71%, 45%)"
				/>
			</Card.Content>
		</Card.Root>

		<!-- Municipality Distribution -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Building2 class="size-5 text-slate-500" />
					Sitios by Municipality
				</Card.Title>
				<Card.Description>Top municipalities by number of recorded sitios</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart data={municipalityData} height={280} orientation="horizontal" title="Sitios" />
			</Card.Content>
		</Card.Root>
	</div>
</div>
