<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateAccessModes,
		aggregateFacilities,
		aggregateInfrastructure,
		aggregateUtilities,
		getAllAvailableYears,
		getYearComparison,
		prepareTimeSeriesData,
		type AccessModesAggregation,
		type FacilitiesAggregation,
		type InfrastructureAggregation,
		type UtilitiesAggregation,
		type YearComparison
	} from '$lib/utils/sitio-chart-aggregation';
	import {
		Building2,
		Car,
		Check,
		Droplets,
		Footprints,
		GraduationCap,
		Milestone,
		Router,
		Ship,
		TrendingDown,
		TrendingUp,
		Zap
	} from '@lucide/svelte';

	// Philippine National Averages for Utility Access
	const NATIONAL_AVERAGES = {
		electricity: {
			percent: 93.12,
			source: 'Department of Energy (DOE), 2024',
			url: 'https://www.pna.gov.ph/articles/1228482'
		},
		sanitaryToilet: {
			percent: 91.7,
			source: 'PSA 2020 Census of Population and Housing',
			url: 'https://psa.gov.ph/content/household-characteristics-2020-census-population-and-housing'
		},
		internet: {
			percent: 48.8,
			source: 'PSA/DICT 2024 NICTHS Survey',
			url: 'https://ptvnews.ph/psa-dict-record-spike-in-internet-connected-households-increased-online-access-among-filipino-populace/'
		}
	} as const;

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
	}

	let { sitios, selectedYear }: Props = $props();

	// Total sitios for percentage calculations
	const totalSitios = $derived(sitios.length);

	// Get available years for comparison
	const availableYears = $derived(getAllAvailableYears(sitios));
	const currentYear = $derived(selectedYear || availableYears[0] || new Date().getFullYear());
	const hasMultipleYears = $derived(availableYears.length > 1);

	// Year-over-year comparison data
	const yearComparison = $derived<YearComparison>(getYearComparison(sitios, currentYear));

	// Time series data for utilities trends
	const utilityTrendData = $derived(
		prepareTimeSeriesData(sitios, ['electricityPercent', 'toiletPercent', 'internetPercent'])
	);

	// Aggregated data (using selected year)
	const infrastructure = $derived<InfrastructureAggregation>(
		aggregateInfrastructure(sitios, currentYear)
	);
	const facilities = $derived<FacilitiesAggregation>(aggregateFacilities(sitios, currentYear));
	const utilities = $derived<UtilitiesAggregation>(aggregateUtilities(sitios, currentYear));
	const accessModes = $derived<AccessModesAggregation>(aggregateAccessModes(sitios, currentYear));

	// Electricity sources data
	const electricitySources = $derived([
		{
			label: 'Grid',
			count: utilities.electricityGrid,
			percent:
				utilities.totalHouseholds > 0
					? Math.round((utilities.electricityGrid / utilities.totalHouseholds) * 100)
					: 0,
			color: 'bg-indigo-500'
		},
		{
			label: 'Solar',
			count: utilities.electricitySolar,
			percent:
				utilities.totalHouseholds > 0
					? Math.round((utilities.electricitySolar / utilities.totalHouseholds) * 100)
					: 0,
			color: 'bg-yellow-500'
		},
		{
			label: 'Battery',
			count: utilities.electricityBattery,
			percent:
				utilities.totalHouseholds > 0
					? Math.round((utilities.electricityBattery / utilities.totalHouseholds) * 100)
					: 0,
			color: 'bg-emerald-500'
		},
		{
			label: 'Generator',
			count: utilities.electricityGenerator,
			percent:
				utilities.totalHouseholds > 0
					? Math.round((utilities.electricityGenerator / utilities.totalHouseholds) * 100)
					: 0,
			color: 'bg-orange-500'
		}
	]);

	// Road types data
	const roadTypes = $derived([
		{
			type: 'Concrete',
			color: 'bg-blue-500',
			sitioCount: infrastructure.roadConcrete.exists,
			length: infrastructure.roadConcrete.totalLength,
			data: infrastructure.roadConcrete
		},
		{
			type: 'Asphalt',
			color: 'bg-slate-400 dark:bg-slate-500',
			sitioCount: infrastructure.roadAsphalt.exists,
			length: infrastructure.roadAsphalt.totalLength,
			data: infrastructure.roadAsphalt
		},
		{
			type: 'Gravel',
			color: 'bg-orange-400',
			sitioCount: infrastructure.roadGravel.exists,
			length: infrastructure.roadGravel.totalLength,
			data: infrastructure.roadGravel
		},
		{
			type: 'Natural',
			color: 'bg-stone-500',
			sitioCount: infrastructure.roadNatural.exists,
			length: infrastructure.roadNatural.totalLength,
			data: infrastructure.roadNatural
		}
	]);

	// Total road length
	const totalRoadLength = $derived(
		infrastructure.roadAsphalt.totalLength +
			infrastructure.roadConcrete.totalLength +
			infrastructure.roadGravel.totalLength +
			infrastructure.roadNatural.totalLength
	);

	// Water sources data
	const waterSources = $derived([
		{
			type: 'Natural Source',
			sitioCount: infrastructure.waterNatural.exists,
			functional: infrastructure.waterNatural.functioning,
			defective: infrastructure.waterNatural.notFunctioning
		},
		{
			type: 'Level 1 (Point Source)',
			sitioCount: infrastructure.waterLevel1.exists,
			functional: infrastructure.waterLevel1.functioning,
			defective: infrastructure.waterLevel1.notFunctioning
		},
		{
			type: 'Level 2 (Communal)',
			sitioCount: infrastructure.waterLevel2.exists,
			functional: infrastructure.waterLevel2.functioning,
			defective: infrastructure.waterLevel2.notFunctioning
		},
		{
			type: 'Level 3 (Individual)',
			sitioCount: infrastructure.waterLevel3.exists,
			functional: infrastructure.waterLevel3.functioning,
			defective: infrastructure.waterLevel3.notFunctioning
		}
	]);

	// Total water sources count
	const totalWaterSources = $derived(
		infrastructure.waterNatural.exists +
			infrastructure.waterLevel1.exists +
			infrastructure.waterLevel2.exists +
			infrastructure.waterLevel3.exists
	);

	// Access modes
	const accessModesDisplay = $derived([
		{
			icon: Car,
			label: 'Paved Road',
			count: accessModes.pavedRoad,
			description: 'Standard road access'
		},
		{
			icon: Milestone,
			label: 'Unpaved Road',
			count: accessModes.unpavedRoad,
			description: 'Dirt/Rough roads'
		},
		{
			icon: Footprints,
			label: 'Footpath',
			count: accessModes.footpath,
			description: 'Walking trails only'
		},
		{
			icon: Ship,
			label: 'Boat',
			count: accessModes.boat,
			description: 'Waterway access'
		}
	]);

	// Mobile signal data
	const mobileSignalData = $derived([
		{ label: '5G', count: utilities.signal5G, color: 'bg-emerald-500' },
		{ label: '4G', count: utilities.signal4G, color: 'bg-blue-500' },
		{ label: '3G', count: utilities.signal3G, color: 'bg-yellow-500' },
		{ label: '2G', count: utilities.signal2G, color: 'bg-orange-500' },
		{ label: 'None', count: utilities.signalNone, color: 'bg-red-500' }
	]);

	// Best signal level
	const bestSignalLevel = $derived(() => {
		if (utilities.signal5G > 0) return { level: '5G', bars: 4 };
		if (utilities.signal4G > 0) return { level: '4G', bars: 3 };
		if (utilities.signal3G > 0) return { level: '3G', bars: 2 };
		if (utilities.signal2G > 0) return { level: '2G', bars: 1 };
		return { level: 'None', bars: 0 };
	});

	// Facilities list
	const facilitiesList = $derived([
		{
			name: 'Health Center',
			data: facilities.healthCenter
		},
		{
			name: 'Pharmacy',
			data: facilities.pharmacy
		},
		{
			name: 'Community Toilet',
			data: facilities.communityToilet
		},
		{
			name: 'Kindergarten',
			data: facilities.kindergarten
		},
		{
			name: 'Elem. School',
			data: facilities.elementarySchool
		},
		{
			name: 'High School',
			data: facilities.highSchool
		},
		{
			name: 'Madrasah',
			data: facilities.madrasah
		},
		{
			name: 'Market',
			data: facilities.market
		}
	]);

	// Sanitation types donut
	const sanitationData = $derived([
		{
			label: 'Water Sealed',
			value: infrastructure.sanitationWaterSealed,
			color: 'hsl(142, 71%, 45%)'
		},
		{
			label: 'Pit Latrine',
			value: infrastructure.sanitationPitLatrine,
			color: 'hsl(45, 93%, 47%)'
		},
		{
			label: 'Community CR',
			value: infrastructure.sanitationCommunityCR,
			color: 'hsl(217, 91%, 60%)'
		},
		{
			label: 'Open Defecation',
			value: infrastructure.sanitationOpenDefecation,
			color: 'hsl(0, 84%, 60%)'
		}
	]);

	// Zero Open Defecation (ZOD) Analytics
	const zodAnalytics = $derived(() => {
		const sitiosWithOD = infrastructure.sanitationOpenDefecation;
		const percentage = totalSitios > 0 ? Math.round((sitiosWithOD / totalSitios) * 100) : 0;
		return {
			sitiosWithOD,
			percentage,
			hasWarning: sitiosWithOD > 0,
			message:
				sitiosWithOD > 0
					? `${sitiosWithOD} sitio${sitiosWithOD > 1 ? 's' : ''} (${percentage}%) report open defecation - ZOD intervention required`
					: 'All sitios report proper sanitation facilities - ZOD compliant'
		};
	});

	// Analytics: Compare against national averages
	const electricityAnalytics = $derived(() => {
		const diff = utilities.electricityPercent - NATIONAL_AVERAGES.electricity.percent;
		return {
			diff: Math.abs(diff).toFixed(1),
			isAbove: diff >= 0,
			status: diff >= 0 ? 'above' : 'below'
		};
	});

	const toiletAnalytics = $derived(() => {
		const diff = utilities.toiletPercent - NATIONAL_AVERAGES.sanitaryToilet.percent;
		return {
			diff: Math.abs(diff).toFixed(1),
			isAbove: diff >= 0,
			status: diff >= 0 ? 'above' : 'below'
		};
	});

	const internetAnalytics = $derived(() => {
		const diff = utilities.internetPercent - NATIONAL_AVERAGES.internet.percent;
		return {
			diff: Math.abs(diff).toFixed(1),
			isAbove: diff >= 0,
			status: diff >= 0 ? 'above' : 'below'
		};
	});

	// Students per room distribution
	const studentsPerRoomData = $derived([
		{ label: '<46', value: infrastructure.studentsPerRoomLessThan46, color: 'hsl(142, 71%, 45%)' },
		{ label: '46-50', value: infrastructure.studentsPerRoom46_50, color: 'hsl(217, 91%, 60%)' },
		{ label: '51-55', value: infrastructure.studentsPerRoom51_55, color: 'hsl(45, 93%, 47%)' },
		{ label: '>56', value: infrastructure.studentsPerRoomMoreThan56, color: 'hsl(25, 95%, 53%)' },
		{
			label: 'No Classroom',
			value: infrastructure.studentsPerRoomNoClassroom,
			color: 'hsl(0, 84%, 60%)'
		}
	]);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Column: Main Content (2/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-2">
		<!-- Access to Utilities Card -->
		<InfoCard
			title="Access to Utilities"
			description="Aggregate coverage across {totalSitios} sitios"
			icon={Zap}
			iconBgColor="bg-yellow-50 dark:bg-yellow-900/20"
			iconTextColor="text-yellow-500"
		>
			{#snippet children()}
				<!-- Analytics Summary -->
				<div
					class="mb-6 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
				>
					<div class="mb-3 flex items-center gap-2">
						<p class="text-xs font-bold tracking-wider text-muted-foreground uppercase">
							Comparison vs. Philippine National Average
						</p>
						<HelpTooltip>
							{#snippet children()}
								<div class="space-y-2 text-xs">
									<p class="font-semibold">National Average Sources:</p>
									<ul class="list-inside list-disc space-y-1">
										<li>
											<strong>Electricity ({NATIONAL_AVERAGES.electricity.percent}%):</strong>
											{NATIONAL_AVERAGES.electricity.source}
										</li>
										<li>
											<strong
												>Sanitary Toilets ({NATIONAL_AVERAGES.sanitaryToilet.percent}%):</strong
											>
											{NATIONAL_AVERAGES.sanitaryToilet.source}
										</li>
										<li>
											<strong>Internet ({NATIONAL_AVERAGES.internet.percent}%):</strong>
											{NATIONAL_AVERAGES.internet.source}
										</li>
									</ul>
								</div>
							{/snippet}
						</HelpTooltip>
					</div>
					<div class="flex flex-wrap gap-2">
						<!-- Electricity Badge -->
						<Badge
							variant="outline"
							class="gap-1.5 {electricityAnalytics().isAbove
								? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
								: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'}"
						>
							{#if electricityAnalytics().isAbove}
								<TrendingUp class="size-3.5" />
							{:else}
								<TrendingDown class="size-3.5" />
							{/if}
							<Zap class="size-3" />
							Electricity {electricityAnalytics().diff}% {electricityAnalytics().status} avg
						</Badge>
						<!-- Sanitary Toilet Badge -->
						<Badge
							variant="outline"
							class="gap-1.5 {toiletAnalytics().isAbove
								? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
								: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'}"
						>
							{#if toiletAnalytics().isAbove}
								<TrendingUp class="size-3.5" />
							{:else}
								<TrendingDown class="size-3.5" />
							{/if}
							<Droplets class="size-3" />
							Sanitation {toiletAnalytics().diff}% {toiletAnalytics().status} avg
						</Badge>
						<!-- Internet Badge -->
						<Badge
							variant="outline"
							class="gap-1.5 {internetAnalytics().isAbove
								? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
								: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'}"
						>
							{#if internetAnalytics().isAbove}
								<TrendingUp class="size-3.5" />
							{:else}
								<TrendingDown class="size-3.5" />
							{/if}
							<Router class="size-3" />
							Internet {internetAnalytics().diff}% {internetAnalytics().status} avg
						</Badge>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Electricity Section -->
					<div class="flex flex-col gap-4">
						<div title="Percentage of households with access to electricity">
							<div class="flex justify-between">
								<span class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
									Electricity Access
								</span>
								<span class="text-sm font-bold text-slate-900 dark:text-white">
									{utilities.electricityPercent.toFixed(1)}%
								</span>
							</div>
							<div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2.5 rounded-full bg-yellow-400 transition-all duration-500"
									style="width: {Math.min(utilities.electricityPercent, 100)}%"
								></div>
							</div>
							<div class="mt-2 flex items-center justify-between">
								<p class="text-xs text-muted-foreground">
									{utilities.householdsWithElectricity.toLocaleString()} of {utilities.totalHouseholds.toLocaleString()}
									households
								</p>
								<span class="text-[10px] text-muted-foreground">
									PH Avg: {NATIONAL_AVERAGES.electricity.percent}%
								</span>
							</div>
							<div
								class="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
							>
								<p
									class="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
								>
									Source Breakdown (per Household)
								</p>
								<div class="space-y-2">
									{#each electricitySources as source}
										<div class="flex items-center gap-2 text-xs">
											<span class="w-16 text-slate-500 dark:text-slate-400">{source.label}</span>
											<div class="mx-2 h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
												<div
													class="h-1.5 rounded-full {source.color} transition-all duration-500"
													style="width: {source.percent}%"
												></div>
											</div>
											<div class="flex min-w-20 items-baseline justify-end gap-1">
												<span class="text-[10px] text-muted-foreground"
													>({source.count.toLocaleString()})</span
												>
												<span class="font-medium text-slate-900 dark:text-white"
													>{source.percent}%</span
												>
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>

					<!-- Other Utilities -->
					<div class="flex flex-col gap-4">
						<!-- Sanitary Toilets -->
						<div title="Percentage of households with sanitary toilet facilities">
							<div class="mb-2 flex justify-between">
								<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
									Sanitary Toilets
								</span>
								<span class="text-sm font-bold text-slate-900 dark:text-white">
									{utilities.toiletPercent.toFixed(1)}%
								</span>
							</div>
							<div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2.5 rounded-full bg-green-500 transition-all duration-500"
									style="width: {Math.min(utilities.toiletPercent, 100)}%"
								></div>
							</div>
							<div class="mt-2 flex items-center justify-between">
								<p class="text-xs text-muted-foreground">
									{utilities.householdsWithToilet.toLocaleString()} of {utilities.totalHouseholds.toLocaleString()}
									households
								</p>
								<span class="text-[10px] text-muted-foreground">
									PH Avg: {NATIONAL_AVERAGES.sanitaryToilet.percent}%
								</span>
							</div>
						</div>

						<!-- Internet Connectivity -->
						<div title="Percentage of households with internet connection">
							<div class="mb-2 flex justify-between">
								<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
									Internet Connectivity
								</span>
								<span class="text-sm font-bold text-slate-900 dark:text-white">
									{utilities.internetPercent.toFixed(1)}%
								</span>
							</div>
							<div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2.5 rounded-full bg-blue-400 transition-all duration-500"
									style="width: {Math.min(utilities.internetPercent, 100)}%"
								></div>
							</div>
							<div class="mt-2 flex items-center justify-between">
								<p class="text-xs text-muted-foreground">
									{utilities.householdsWithInternet.toLocaleString()} of {utilities.totalHouseholds.toLocaleString()}
									households
								</p>
								<span class="text-[10px] text-muted-foreground">
									PH Avg: {NATIONAL_AVERAGES.internet.percent}%
								</span>
							</div>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Utility Access Trend Chart (only show if multiple years) -->
		{#if hasMultipleYears && utilityTrendData.categories.length > 1}
			<Card.Root>
				<Card.Header class="pb-2">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
							<TrendingUp class="size-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<div>
							<Card.Title class="text-base">Utility Access Trends</Card.Title>
							<Card.Description>Year-over-year utility coverage improvements (%)</Card.Description>
						</div>
					</div>
					<!-- Trend badges -->
					<div class="mt-2 flex flex-wrap gap-2">
						{#if yearComparison.trends.electricityAccess}
							<Badge
								variant={yearComparison.trends.electricityAccess.isPositive
									? 'default'
									: 'destructive'}
								class="gap-1"
							>
								<Zap class="size-3" />
								Electricity {yearComparison.trends.electricityAccess.value >= 0 ? '+' : ''}
								{yearComparison.trends.electricityAccess.value.toFixed(1)}% vs last year
							</Badge>
						{/if}
						{#if yearComparison.trends.toiletAccess}
							<Badge
								variant={yearComparison.trends.toiletAccess.isPositive ? 'default' : 'destructive'}
								class="gap-1"
							>
								<Droplets class="size-3" />
								Sanitation {yearComparison.trends.toiletAccess.value >= 0 ? '+' : ''}
								{yearComparison.trends.toiletAccess.value.toFixed(1)}% vs last year
							</Badge>
						{/if}
						{#if yearComparison.trends.internetAccess}
							<Badge
								variant={yearComparison.trends.internetAccess.isPositive
									? 'default'
									: 'destructive'}
								class="gap-1"
							>
								<Router class="size-3" />
								Internet {yearComparison.trends.internetAccess.value >= 0 ? '+' : ''}
								{yearComparison.trends.internetAccess.value.toFixed(1)}% vs last year
							</Badge>
						{/if}
					</div>
				</Card.Header>
				<Card.Content>
					<LineChart
						series={utilityTrendData.series}
						categories={utilityTrendData.categories}
						height={280}
						curve="smooth"
						showLegend={true}
						yAxisFormatter={(val) => `${val.toFixed(1)}%`}
					/>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Internal Infrastructure (Roads) Card -->
		<InfoCard
			title="Road Infrastructure"
			description="Road network conditions across all sitios"
			icon={Car}
			iconBgColor="bg-slate-50 dark:bg-slate-900/20"
			iconTextColor="text-slate-400"
		>
			{#snippet children()}
				<div class="flex flex-col gap-4">
					<div
						class="grid grid-cols-12 gap-2 border-b border-slate-100 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase dark:border-slate-800"
					>
						<div class="col-span-3">Type</div>
						<div class="col-span-3 text-right">Sitios</div>
						<div class="col-span-3 text-right">Total Length</div>
						<div class="col-span-3 text-right">Condition</div>
					</div>
					{#each roadTypes as road}
						<div
							class="grid grid-cols-12 items-center gap-2"
							class:opacity-60={road.sitioCount === 0}
						>
							<div class="col-span-3 flex items-center gap-2">
								<div class="h-8 w-1.5 rounded-full {road.color}"></div>
								<span class="text-sm font-bold text-slate-900 dark:text-white">{road.type}</span>
							</div>
							<div class="col-span-3 flex justify-end">
								{#if road.sitioCount > 0}
									<Badge
										variant="outline"
										class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
									>
										<Check class="mr-1 size-3.5" />
										{road.sitioCount}
									</Badge>
								{:else}
									<Badge
										variant="outline"
										class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
									>
										0
									</Badge>
								{/if}
							</div>
							<div class="col-span-3 text-right">
								{#if road.sitioCount > 0}
									<span class="text-sm font-bold text-slate-700 dark:text-slate-300"
										>{road.length.toFixed(1)}</span
									>
									<span class="text-[10px] text-muted-foreground">km</span>
								{:else}
									<span class="text-sm text-slate-400">—</span>
								{/if}
							</div>
							<div class="col-span-3 flex flex-col items-end gap-0.5">
								{#if road.sitioCount > 0}
									<div class="flex gap-1">
										{#if road.data.excellent > 0}
											<Badge
												variant="outline"
												class="border-emerald-100 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
												>{road.data.excellent} exc</Badge
											>
										{/if}
										{#if road.data.good > 0}
											<Badge
												variant="outline"
												class="border-green-100 bg-green-50 px-1.5 py-0 text-[10px] text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
												>{road.data.good} good</Badge
											>
										{/if}
									</div>
									<div class="flex gap-1">
										{#if road.data.fair > 0}
											<Badge
												variant="outline"
												class="border-yellow-100 bg-yellow-50 px-1.5 py-0 text-[10px] text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400"
												>{road.data.fair} fair</Badge
											>
										{/if}
										{#if road.data.poor > 0 || road.data.bad > 0}
											<Badge
												variant="outline"
												class="border-red-100 bg-red-50 px-1.5 py-0 text-[10px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
												>{road.data.poor + road.data.bad} poor</Badge
											>
										{/if}
									</div>
								{:else}
									<span class="text-sm text-slate-400">—</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
					<div class="mb-3 flex items-end justify-between">
						<div>
							<p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
								Total Road Network
							</p>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{totalRoadLength.toFixed(1)}
								<span class="text-sm font-medium text-muted-foreground">km</span>
							</p>
						</div>
					</div>
					<div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
						{#each roadTypes.filter((r) => r.sitioCount > 0 && r.length > 0) as road, index}
							{@const percentage = totalRoadLength > 0 ? (road.length / totalRoadLength) * 100 : 0}
							<div
								class="h-full {road.color} {index <
								roadTypes.filter((r) => r.sitioCount > 0 && r.length > 0).length - 1
									? 'border-r border-white dark:border-slate-800'
									: ''}"
								style="width: {percentage}%"
							></div>
						{/each}
					</div>
					<div class="mt-3 flex flex-wrap gap-4">
						{#each roadTypes.filter((r) => r.sitioCount > 0 && r.length > 0) as road}
							{@const percentage =
								totalRoadLength > 0 ? Math.round((road.length / totalRoadLength) * 100) : 0}
							<div class="flex items-center gap-1.5">
								<div class="h-2 w-2 rounded-full {road.color}"></div>
								<span class="text-xs text-muted-foreground">{road.type} ({percentage}%)</span>
							</div>
						{/each}
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Water Sources Card -->
		<InfoCard
			title="Water Sources"
			description="Availability and status across {totalWaterSources} sources in {totalSitios} sitios"
			icon={Droplets}
			iconBgColor="bg-blue-50 dark:bg-blue-900/20"
			iconTextColor="text-blue-500"
		>
			{#snippet children()}
				<div class="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
					<table class="w-full border-collapse text-left">
						<thead>
							<tr
								class="border-b border-slate-100 text-[10px] font-bold tracking-wider text-muted-foreground uppercase dark:border-slate-800"
							>
								<th class="pb-3 pl-2">Source Type</th>
								<th class="pb-3 text-center">Sitios</th>
								<th class="pb-3 text-center">Functional</th>
								<th class="pb-3 text-center">Defective</th>
							</tr>
						</thead>
						<tbody class="text-sm">
							{#each waterSources as source, index}
								<tr
									class={index < waterSources.length - 1
										? 'border-b border-slate-50 dark:border-slate-800/50'
										: ''}
								>
									<td class="py-3 pl-2 font-medium text-slate-900 dark:text-white">
										{source.type}
									</td>
									<td class="py-3 text-center">
										{#if source.sitioCount > 0}
											<Badge
												variant="outline"
												class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
											>
												{source.sitioCount}
											</Badge>
										{:else}
											<Badge
												variant="outline"
												class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
											>
												0
											</Badge>
										{/if}
									</td>
									<td class="py-3 text-center text-green-600 dark:text-green-400">
										{source.sitioCount > 0 ? source.functional : '—'}
									</td>
									<td
										class="py-3 text-center {source.defective > 0
											? 'font-medium text-red-500'
											: 'text-slate-400'}"
									>
										{source.sitioCount > 0 ? source.defective : '—'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Sanitation & Education Row -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Sanitation Types -->
			<InfoCard
				title="Sanitation Types"
				description="Distribution across sitios"
				icon={Droplets}
				iconBgColor="bg-teal-50 dark:bg-teal-900/20"
				iconTextColor="text-teal-500"
			>
				{#snippet children()}
					<DonutChart data={sanitationData} centerLabel="Sitios" height={220} />

					<!-- ZOD Analytics -->
					<div class="mt-4">
						{#if zodAnalytics().hasWarning}
							<div
								class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="size-4 shrink-0 text-red-600 dark:text-red-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<div class="flex-1">
									<p class="text-xs font-semibold text-red-800 dark:text-red-300">
										Zero Open Defecation (ZOD) Alert
									</p>
									<p class="mt-1 text-xs text-red-700 dark:text-red-400">
										{zodAnalytics().message}
									</p>
								</div>
							</div>
						{:else}
							<div
								class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/10"
							>
								<Check class="size-4 text-emerald-600 dark:text-emerald-400" />
								<p class="text-xs font-medium text-emerald-700 dark:text-emerald-300">
									{zodAnalytics().message}
								</p>
							</div>
						{/if}
					</div>
				{/snippet}
			</InfoCard>

			<!-- Classroom Density -->
			<InfoCard
				title="Classroom Density"
				description="Students per classroom ratio"
				icon={GraduationCap}
				iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
				iconTextColor="text-indigo-500"
			>
				{#snippet children()}
					<BarChart data={studentsPerRoomData} height={220} title="Sitios" />
				{/snippet}
			</InfoCard>
		</div>
	</div>

	<!-- Right Column: Sidebar (1/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-1">
		<!-- Main Access Modes Card -->
		<InfoCard
			title="Main Access Modes"
			description="Primary transportation methods"
			icon={Car}
			iconBgColor="bg-blue-50 dark:bg-blue-500/10"
			iconTextColor="text-blue-600 dark:text-blue-400"
			headerClass="pb-4"
			contentPadding="p-3"
		>
			{#snippet children()}
				<div class="grid grid-cols-2 gap-3">
					{#each accessModesDisplay as mode}
						{@const Icon = mode.icon}
						{@const isActive = mode.count > 0}
						<div
							class="flex items-center gap-2.5 rounded-lg border p-2.5 transition-all {isActive
								? 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5'
								: 'border-slate-100 bg-slate-50/50 opacity-50 dark:border-slate-700 dark:bg-slate-800/30'}"
							title="{mode.count} sitios with {mode.label.toLowerCase()} access"
						>
							<div
								class="rounded-md p-1.5 {isActive
									? 'bg-blue-100 dark:bg-blue-500/20'
									: 'bg-slate-200 dark:bg-slate-700'}"
							>
								<Icon
									class="size-3.5 {isActive
										? 'text-blue-600 dark:text-blue-400'
										: 'text-slate-400'}"
								/>
							</div>
							<div class="flex flex-col">
								<span class="text-[13px] font-medium text-foreground">{mode.label}</span>
								<span class="text-[11px] leading-tight text-muted-foreground">
									{mode.count} sitios
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Mobile Signal Card -->
		<InfoCard
			title="Mobile Signal Coverage"
			description="Network availability across sitios"
			icon={Router}
			iconBgColor="bg-slate-50 dark:bg-slate-900/20"
			iconTextColor="text-slate-400"
			contentPadding="px-4 py-2"
		>
			{#snippet children()}
				<div class="space-y-3">
					<!-- Signal bars visualization -->
					<div class="flex justify-between gap-1.5">
						{#each ['2G', '3G', '4G', '5G'] as network, index}
							{@const signalData = mobileSignalData.find((s) => s.label === network)}
							{@const hasSignal = signalData && signalData.count > 0}
							<div class="flex flex-1 flex-col items-center gap-1.5">
								<div
									class="h-3 w-full rounded transition-all {hasSignal
										? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
										: 'bg-slate-100 dark:bg-slate-700'}"
								></div>
								<span
									class="text-sm font-bold {hasSignal
										? 'text-slate-900 dark:text-white'
										: 'text-slate-400 dark:text-slate-500'}"
								>
									{network}
								</span>
							</div>
						{/each}
					</div>
					<!-- Signal distribution breakdown -->
					<div
						class="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
					>
						<p class="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
							Sitio Distribution
						</p>
						<div class="space-y-1.5">
							{#each mobileSignalData as signal}
								{@const percent =
									totalSitios > 0 ? Math.round((signal.count / totalSitios) * 100) : 0}
								<div class="flex items-center justify-between text-xs">
									<span class="text-slate-600 dark:text-slate-400">{signal.label}</span>
									<div class="flex items-center gap-2">
										<span class="text-muted-foreground">{signal.count}</span>
										<span class="min-w-8 text-right font-medium text-slate-900 dark:text-white"
											>{percent}%</span
										>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Community Facilities Card -->
		<InfoCard
			title="Community Facilities"
			description="Presence across all sitios"
			icon={Building2}
			iconBgColor="bg-purple-50 dark:bg-purple-900/20"
			iconTextColor="text-purple-500"
		>
			{#snippet children()}
				<div class="grid grid-cols-1 gap-3">
					{#each facilitiesList as { name, data }}
						{@const existsPercent =
							totalSitios > 0 ? Math.round((data.exists / totalSitios) * 100) : 0}
						<div
							class="flex items-center justify-between rounded-lg border p-3 {data.exists > 0
								? 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/20'
								: 'dark:bg-card-dark border-slate-100 bg-white dark:border-slate-700'}"
						>
							<div class="flex flex-col">
								<span class="text-sm font-bold text-slate-900 dark:text-white">{name}</span>
								{#if data.exists > 0}
									<span
										class="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"
									>
										<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
										{data.exists} sitios ({existsPercent}%)
									</span>
								{:else}
									<span class="text-xs font-medium text-slate-500"> Not present in any sitio </span>
								{/if}
							</div>
							{#if data.exists > 0}
								<div class="flex flex-col items-end gap-0.5">
									<div class="flex gap-1">
										{#if data.excellent > 0}
											<Badge
												variant="outline"
												class="border-emerald-100 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
												>{data.excellent} exc</Badge
											>
										{/if}
										{#if data.good > 0}
											<Badge
												variant="outline"
												class="border-green-100 bg-green-50 px-1.5 py-0 text-[10px] text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
												>{data.good} good</Badge
											>
										{/if}
									</div>
									<div class="flex gap-1">
										{#if data.fair > 0}
											<Badge
												variant="outline"
												class="border-yellow-100 bg-yellow-50 px-1.5 py-0 text-[10px] text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400"
												>{data.fair} fair</Badge
											>
										{/if}
										{#if data.poor > 0 || data.critical > 0}
											<Badge
												variant="outline"
												class="border-red-100 bg-red-50 px-1.5 py-0 text-[10px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
												>{data.poor + data.critical} poor</Badge
											>
										{/if}
									</div>
								</div>
							{:else}
								<span class="text-xs font-semibold text-slate-400 uppercase opacity-50">None</span>
							{/if}
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>
	</div>
</div>
