<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateDemographics,
		aggregateGeographic,
		aggregateUtilities,
		getAllAvailableYears,
		getYearComparison,
		prepareTimeSeriesData,
		type DemographicsAggregation,
		type GeographicAggregation,
		type UtilitiesAggregation,
		type YearComparison
	} from '$lib/utils/sitio-chart-aggregation';
	import {
		AlertTriangle,
		Building2,
		Droplets,
		Globe,
		Home,
		Landmark,
		MapPin,
		ShieldAlert,
		Signal,
		Sparkles,
		TrendingUp,
		Users,
		Wifi,
		Zap
	} from '@lucide/svelte';

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
	}

	let { sitios, selectedYear }: Props = $props();

	// Get available years for comparison
	const availableYears = $derived(getAllAvailableYears(sitios));
	const currentYear = $derived(selectedYear || availableYears[0] || new Date().getFullYear());
	const hasMultipleYears = $derived(availableYears.length > 1);

	// Year-over-year comparison data
	const yearComparison = $derived<YearComparison>(getYearComparison(sitios, currentYear));

	// Aggregated data (using selected year)
	const demographics = $derived<DemographicsAggregation>(
		aggregateDemographics(sitios, currentYear)
	);
	const utilities = $derived<UtilitiesAggregation>(aggregateUtilities(sitios, currentYear));
	const geographic = $derived<GeographicAggregation>(aggregateGeographic(sitios, currentYear));

	// Time series data for population trend chart
	const populationTrendData = $derived(
		prepareTimeSeriesData(sitios, ['totalPopulation', 'totalHouseholds'])
	);

	// Classification distribution for donut chart
	const classificationData = $derived([
		{ label: 'GIDA', value: demographics.gidaCount, color: 'hsl(45, 93%, 47%)' },
		{ label: 'Indigenous', value: demographics.indigenousCount, color: 'hsl(217, 91%, 60%)' },
		{ label: 'Conflict Affected', value: demographics.conflictCount, color: 'hsl(0, 84%, 60%)' }
	]);

	// Geographic distribution for bar chart
	const municipalityData = $derived(
		geographic.municipalities.slice(0, 8).map((m) => ({
			label: m.municipality,
			value: m.sitioCount
		}))
	);

	// Key stats for quick overview with YoY trends
	const keyStats = $derived([
		{
			icon: MapPin,
			label: 'Total Sitios',
			value: sitios.length.toLocaleString(),
			subtext: 'recorded communities',
			color: 'text-blue-500',
			trend: null // Sitio count is cumulative, no YoY comparison
		},
		{
			icon: Users,
			label: 'Population',
			value: demographics.totalPopulation.toLocaleString(),
			subtext: `${demographics.averageHouseholdSize.toFixed(1)} avg/household`,
			color: 'text-emerald-500',
			trend: yearComparison.trends.population
		},
		{
			icon: Home,
			label: 'Households',
			value: demographics.totalHouseholds.toLocaleString(),
			subtext: `${sitios.length > 0 ? (demographics.totalHouseholds / sitios.length).toFixed(1) : 0} avg/sitio`,
			color: 'text-violet-500',
			trend: yearComparison.trends.households
		},
		{
			icon: Building2,
			label: 'Coverage',
			value: `${geographic.totalMunicipalities}`,
			subtext: `municipalities, ${geographic.totalBarangays} barangays`,
			color: 'text-amber-500',
			trend: null // Administrative coverage doesn't have YoY
		}
	]);

	// Utilities overview stats with YoY trends
	const utilityStats = $derived([
		{
			icon: Zap,
			label: 'Electricity',
			value: `${utilities.electricityPercent.toFixed(1)}%`,
			subtext: `${utilities.householdsWithElectricity.toLocaleString()} households`,
			color: 'text-yellow-500',
			bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
			borderColor: 'border-yellow-200 dark:border-yellow-500/30',
			status:
				utilities.electricityPercent >= 80
					? 'good'
					: utilities.electricityPercent >= 50
						? 'warning'
						: 'critical',
			trend: yearComparison.trends.electricityAccess
		},
		{
			icon: Droplets,
			label: 'Sanitation',
			value: `${utilities.toiletPercent.toFixed(1)}%`,
			subtext: `${utilities.householdsWithToilet.toLocaleString()} households`,
			color: 'text-cyan-500',
			bgColor: 'bg-cyan-50 dark:bg-cyan-500/10',
			borderColor: 'border-cyan-200 dark:border-cyan-500/30',
			status:
				utilities.toiletPercent >= 80
					? 'good'
					: utilities.toiletPercent >= 50
						? 'warning'
						: 'critical',
			trend: yearComparison.trends.toiletAccess
		},
		{
			icon: Wifi,
			label: 'Internet',
			value: `${utilities.internetPercent.toFixed(1)}%`,
			subtext: `${utilities.householdsWithInternet.toLocaleString()} households`,
			color: 'text-blue-500',
			bgColor: 'bg-blue-50 dark:bg-blue-500/10',
			borderColor: 'border-blue-200 dark:border-blue-500/30',
			status:
				utilities.internetPercent >= 50
					? 'good'
					: utilities.internetPercent >= 25
						? 'warning'
						: 'critical',
			trend: yearComparison.trends.internetAccess
		},
		{
			icon: Signal,
			label: 'Mobile Signal',
			value: `${utilities.signal4G + utilities.signal5G}`,
			subtext: `sitios with 4G/5G coverage`,
			color: 'text-indigo-500',
			bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
			borderColor: 'border-indigo-200 dark:border-indigo-500/30',
			status: utilities.signal4G + utilities.signal5G > sitios.length / 2 ? 'good' : 'warning',
			trend: null
		}
	]);

	// Classification items
	const classificationItems = $derived([
		{
			label: 'GIDA Status',
			description: 'Geographically Isolated and Disadvantaged Area',
			count: demographics.gidaCount,
			percent:
				sitios.length > 0 ? ((demographics.gidaCount / sitios.length) * 100).toFixed(1) : '0',
			icon: AlertTriangle,
			color: 'text-amber-600 dark:text-amber-400',
			bgColor: 'bg-amber-50 dark:bg-amber-500/10',
			borderColor: 'border-amber-200 dark:border-amber-500/30'
		},
		{
			label: 'Indigenous Community',
			description: 'Indigenous Peoples (IP) Area',
			count: demographics.indigenousCount,
			percent:
				sitios.length > 0 ? ((demographics.indigenousCount / sitios.length) * 100).toFixed(1) : '0',
			icon: Users,
			color: 'text-emerald-600 dark:text-emerald-400',
			bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
			borderColor: 'border-emerald-200 dark:border-emerald-500/30'
		},
		{
			label: 'Conflict-Affected',
			description: 'Conflict-affected area',
			count: demographics.conflictCount,
			percent:
				sitios.length > 0 ? ((demographics.conflictCount / sitios.length) * 100).toFixed(1) : '0',
			icon: ShieldAlert,
			color: 'text-red-600 dark:text-red-400',
			bgColor: 'bg-red-50 dark:bg-red-500/10',
			borderColor: 'border-red-200 dark:border-red-500/30'
		}
	]);

	// Status badge helper
	function getStatusBadge(status: string) {
		switch (status) {
			case 'good':
				return { variant: 'default' as const, text: 'Good' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Moderate' };
			case 'critical':
				return { variant: 'destructive' as const, text: 'Critical' };
			default:
				return { variant: 'outline' as const, text: 'Unknown' };
		}
	}
</script>

<div class="space-y-5">
	<!-- Top Row: Key Statistics + Administrative Summary -->
	<div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
		<!-- Key Statistics Card -->
		<div class="lg:col-span-8">
			<InfoCard
				title="Community Overview"
				description="Key statistics across all recorded sitios"
				icon={Sparkles}
				iconBgColor="bg-primary/10"
				iconTextColor="text-primary"
				headerClass="pb-4"
				contentPadding="p-5"
				class="h-full"
			>
				{#snippet children()}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each keyStats as stat}
							{@const Icon = stat.icon}
							<div
								class="group flex items-center gap-3 rounded-lg border border-slate-200 bg-linear-to-br from-slate-50 to-white p-3.5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800/30 dark:hover:border-slate-600"
							>
								<div
									class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-700/50 dark:ring-slate-700"
								>
									<Icon class="size-5 {stat.color}" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-xs font-medium text-muted-foreground">{stat.label}</p>
									<p class="mt-0.5 text-xl leading-none font-bold text-foreground">
										{stat.value}
									</p>
									<div class="mt-1 flex items-center gap-2">
										<p class="truncate text-xs text-muted-foreground/70">{stat.subtext}</p>
										{#if stat.trend && hasMultipleYears}
											<span
												class="inline-flex items-center text-xs font-medium {stat.trend.isPositive
													? 'text-emerald-600 dark:text-emerald-400'
													: 'text-rose-600 dark:text-rose-400'}"
											>
												{stat.trend.value >= 0 ? '↑' : '↓'}
												{Math.abs(stat.trend.value)}%
											</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/snippet}
			</InfoCard>
		</div>

		<!-- Administrative Location Summary -->
		<div class="lg:col-span-4">
			<InfoCard
				title="Administrative Coverage"
				description="Geographic and administrative scope"
				icon={Landmark}
				iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
				iconTextColor="text-indigo-600 dark:text-indigo-400"
				headerClass="pb-4"
				contentPadding="p-5"
				class="h-full"
			>
				{#snippet children()}
					<div class="space-y-2">
						<div
							class="flex items-center justify-between rounded-lg bg-linear-to-r from-slate-50 to-transparent px-3.5 py-2.5 dark:from-slate-800/50"
						>
							<span class="text-sm font-medium text-muted-foreground">Province</span>
							<span class="text-sm font-semibold text-foreground">South Cotabato</span>
						</div>
						<div
							class="flex items-center justify-between rounded-lg bg-linear-to-r from-slate-50 to-transparent px-3.5 py-2.5 dark:from-slate-800/50"
						>
							<span class="text-sm font-medium text-muted-foreground">Municipalities</span>
							<span class="text-sm font-semibold text-foreground"
								>{geographic.totalMunicipalities}</span
							>
						</div>
						<div
							class="flex items-center justify-between rounded-lg bg-linear-to-r from-slate-50 to-transparent px-3.5 py-2.5 dark:from-slate-800/50"
						>
							<span class="text-sm font-medium text-muted-foreground">Barangays</span>
							<span class="text-sm font-semibold text-foreground">{geographic.totalBarangays}</span>
						</div>
						<div
							class="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 px-3.5 pt-3 dark:border-slate-700"
						>
							<span class="text-sm font-medium text-muted-foreground">Total Sitios</span>
							<code
								class="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary dark:bg-primary/20"
							>
								{sitios.length}
							</code>
						</div>
					</div>
				{/snippet}
			</InfoCard>
		</div>
	</div>

	<!-- Utilities Overview Section -->
	<InfoCard
		title="Utilities at a Glance"
		description="Infrastructure and connectivity metrics across all sitios"
		icon={Zap}
		iconBgColor="bg-violet-50 dark:bg-violet-500/10"
		iconTextColor="text-violet-600 dark:text-violet-400"
		headerClass="pb-4"
		contentPadding="p-5"
	>
		{#snippet children()}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each utilityStats as util}
					{@const Icon = util.icon}
					<div
						class="group flex items-start gap-3 rounded-xl border p-4 transition-all hover:border-slate-300 hover:shadow-sm dark:hover:border-slate-600 {util.borderColor} {util.bgColor}"
					>
						<div
							class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-700/50 dark:ring-white/10"
						>
							<Icon class="size-5 {util.color}" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs font-medium text-muted-foreground">{util.label}</p>
							<p class="mt-1 text-2xl leading-none font-bold text-foreground">
								{util.value}
							</p>
							<div class="mt-1.5 flex items-center gap-2">
								<p class="text-xs text-muted-foreground/70">{util.subtext}</p>
								{#if util.trend && hasMultipleYears}
									<span
										class="inline-flex items-center text-xs font-medium {util.trend.isPositive
											? 'text-emerald-600 dark:text-emerald-400'
											: 'text-rose-600 dark:text-rose-400'}"
									>
										{util.trend.value >= 0 ? '↑' : '↓'}
										{Math.abs(util.trend.value)}%
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/snippet}
	</InfoCard>

	<!-- Population Trend Chart (only show if multiple years) -->
	{#if hasMultipleYears && populationTrendData.categories.length > 1}
		<Card.Root>
			<Card.Header class="pb-2">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
						<TrendingUp class="size-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<Card.Title class="text-base">Population & Household Trends</Card.Title>
						<Card.Description>Year-over-year growth across all sitios</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<LineChart
					series={populationTrendData.series}
					categories={populationTrendData.categories}
					height={280}
					curve="smooth"
					showLegend={true}
					yAxisFormatter={(val) => val.toLocaleString()}
				/>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Bottom Row: Classification + Charts -->
	<div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
		<!-- Sitio Classification Card -->
		<div class="lg:col-span-5">
			<InfoCard
				title="Sitio Classifications"
				description="Special area designations and vulnerability status"
				icon={Globe}
				iconBgColor="bg-slate-100 dark:bg-slate-500/10"
				iconTextColor="text-slate-600 dark:text-slate-400"
				headerClass="pb-4"
				contentPadding="p-5"
				class="h-full"
			>
				{#snippet children()}
					<div class="space-y-2.5">
						{#each classificationItems as item}
							{@const Icon = item.icon}
							<div
								class="group relative flex items-center gap-3 rounded-lg border p-3 transition-all {item.count >
								0
									? `${item.borderColor} ${item.bgColor}`
									: 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30'}"
							>
								<div
									class="flex size-10 shrink-0 items-center justify-center rounded-lg {item.count >
									0
										? item.bgColor
										: 'bg-slate-100 dark:bg-slate-700'}"
								>
									<Icon
										class="size-5 {item.count > 0
											? item.color
											: 'text-slate-400 dark:text-slate-500'}"
									/>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm leading-tight font-semibold text-foreground">{item.label}</p>
									<p class="mt-0.5 truncate text-xs text-muted-foreground/70">{item.description}</p>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<Badge variant={item.count > 0 ? 'secondary' : 'outline'} class="text-xs">
										{item.percent}%
									</Badge>
									<span
										class="min-w-[2ch] text-right text-lg font-bold {item.count > 0
											? item.color
											: 'text-slate-400'}"
									>
										{item.count}
									</span>
								</div>
							</div>
						{/each}
					</div>

					<!-- Classification Donut Chart -->
					<div class="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
						<DonutChart
							data={classificationData}
							centerLabel="Total Sitios"
							centerValue={sitios.length.toString()}
							height={180}
						/>
					</div>
				{/snippet}
			</InfoCard>
		</div>

		<!-- Municipality Distribution -->
		<div class="lg:col-span-7">
			<InfoCard
				title="Sitios by Municipality"
				description="Top municipalities by number of recorded sitios"
				icon={Building2}
				iconBgColor="bg-blue-50 dark:bg-blue-500/10"
				iconTextColor="text-blue-600 dark:text-blue-400"
				headerClass="pb-4"
				contentPadding="p-5"
				class="h-full"
			>
				{#snippet children()}
					<BarChart data={municipalityData} height={320} orientation="horizontal" title="Sitios" />
				{/snippet}
			</InfoCard>
		</div>
	</div>
</div>
