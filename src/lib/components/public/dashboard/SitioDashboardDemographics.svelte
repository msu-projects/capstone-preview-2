<script lang="ts">
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import * as Card from '$lib/components/ui/card';
	import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateDemographics,
		getAllAvailableYears,
		getYearComparison,
		prepareTimeSeriesData,
		type DemographicsAggregation,
		type YearComparison
	} from '$lib/utils/sitio-chart-aggregation';
	import {
		Briefcase,
		Clock,
		CreditCard,
		Heart,
		IdCard,
		Landmark,
		PersonStanding,
		Scale,
		School,
		TrendingDown,
		TrendingUp,
		UserCheck,
		UserRound,
		Users,
		Vote
	} from '@lucide/svelte';
	import DashboardStatCard from './DashboardStatCard.svelte';

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

	// Aggregated demographics data (using selected year)
	const demographics = $derived<DemographicsAggregation>(
		aggregateDemographics(sitios, currentYear)
	);

	// Time series data for population trend chart
	const populationGenderTrend = $derived(
		prepareTimeSeriesData(sitios, ['totalMale', 'totalFemale'])
	);

	// Time series data for labor force trend
	const laborForceTrend = $derived(
		prepareTimeSeriesData(sitios, ['totalLaborWorkforce', 'totalUnemployed'])
	);

	// Gender distribution for donut chart
	const genderData = $derived([
		{ label: 'Male', value: demographics.totalMale, color: 'hsl(217, 91%, 60%)' },
		{ label: 'Female', value: demographics.totalFemale, color: 'hsl(330, 81%, 60%)' }
	]);

	// Calculate labor force metrics
	const laborMetrics = $derived(() => {
		const laborForce = demographics.totalLaborWorkforce || 0;
		const unemployed = demographics.totalUnemployed || 0;
		const employed = laborForce - unemployed;
		const employmentRate = laborForce > 0 ? Math.round((employed / laborForce) * 100) : 0;
		const participationRate =
			demographics.totalPopulation > 0
				? Math.round((laborForce / demographics.totalPopulation) * 100)
				: 0;
		const seniorWorkforce = demographics.totalLaborForce60to64 || 0;
		const seniorSharePercent =
			laborForce > 0 ? ((seniorWorkforce / laborForce) * 100).toFixed(1) : '0';

		// Dependency ratio calculation
		const dependentPopulation = demographics.totalPopulation - laborForce;
		const dependencyRatio = laborForce > 0 ? (dependentPopulation / laborForce) * 100 : 0;

		return {
			laborForce,
			unemployed,
			employed,
			employmentRate,
			participationRate,
			seniorWorkforce,
			seniorSharePercent,
			dependentPopulation,
			dependencyRatio: dependencyRatio.toFixed(1)
		};
	});

	// Cultural & demographic groups for bar chart
	const culturalGroupsData = $derived([
		{
			label: 'School-Age Children',
			value: demographics.totalSchoolAgeChildren,
			color: 'hsl(217, 91%, 60%)'
		},
		{ label: 'Muslim Population', value: demographics.totalMuslim, color: 'hsl(142, 71%, 45%)' },
		{ label: 'Indigenous People', value: demographics.totalIP, color: 'hsl(263, 70%, 50%)' },
		{ label: 'Registered Voters', value: demographics.totalVoters, color: 'hsl(280, 65%, 60%)' }
	]);

	// Vulnerable sectors for bar chart
	const vulnerableSectorsData = $derived([
		{ label: 'Senior Citizens', value: demographics.totalSeniors, color: 'hsl(25, 95%, 53%)' },
		{ label: 'Out of School Youth', value: demographics.totalOSY, color: 'hsl(0, 84%, 60%)' },
		{
			label: 'No Birth Certificate',
			value: demographics.totalNoBirthCert,
			color: 'hsl(45, 93%, 47%)'
		},
		{ label: 'No PhilSys ID', value: demographics.totalNoNationalID, color: 'hsl(200, 18%, 46%)' }
	]);
</script>

<div class="space-y-6">
	<!-- Population Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<DashboardStatCard
			title="Total Population"
			value={demographics.totalPopulation}
			subtitle="{demographics.malePercent.toFixed(1)}% male, {demographics.femalePercent.toFixed(
				1
			)}% female"
			icon={Users}
			variant="primary"
			trend={hasMultipleYears && yearComparison.trends.population
				? yearComparison.trends.population
				: undefined}
		/>
		<DashboardStatCard
			title="Total Households"
			value={demographics.totalHouseholds}
			subtitle="Avg {demographics.averageHouseholdSize.toFixed(1)} members/household"
			icon={Heart}
			variant="success"
			trend={hasMultipleYears && yearComparison.trends.households
				? yearComparison.trends.households
				: undefined}
		/>
		<DashboardStatCard
			title="Registered Voters"
			value={demographics.totalVoters}
			subtitle="{demographics.voterRegistrationPercent.toFixed(1)}% registration rate"
			icon={Vote}
			variant="default"
		/>
		<DashboardStatCard
			title="Labor Workforce"
			value={demographics.totalLaborWorkforce}
			subtitle="{laborMetrics().participationRate}% participation rate"
			icon={Briefcase}
			variant={demographics.unemploymentRate >= 20
				? 'danger'
				: demographics.unemploymentRate >= 10
					? 'warning'
					: 'success'}
			trend={hasMultipleYears && yearComparison.trends.laborWorkforce
				? yearComparison.trends.laborWorkforce
				: undefined}
		/>
	</div>

	<!-- Population Trend Chart (only show if multiple years) -->
	{#if hasMultipleYears && populationGenderTrend.categories.length > 1}
		<Card.Root>
			<Card.Header class="pb-2">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
						<TrendingUp class="size-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<Card.Title class="text-base">Population by Gender Over Time</Card.Title>
						<Card.Description>Year-over-year population trends</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<LineChart
					series={populationGenderTrend.series}
					categories={populationGenderTrend.categories}
					height={260}
					curve="smooth"
					showLegend={true}
					yAxisFormatter={(val) => val.toLocaleString()}
				/>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Main Content Grid: 2/3 + 1/3 layout on large screens -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left Column: Main Charts (2/3 width) -->
		<div class="flex flex-col gap-6 lg:col-span-2">
			<!-- Gender Distribution Card -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<PersonStanding class="size-5 text-pink-500" />
						Gender Distribution
					</Card.Title>
					<Card.Description>Breakdown of population by sex</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col items-center justify-around gap-8 md:flex-row">
						<!-- Donut Chart -->
						<div class="relative w-48 shrink-0 md:w-56">
							<DonutChart
								data={genderData}
								centerLabel="Total"
								centerValue={demographics.totalPopulation.toLocaleString()}
								height={224}
								showLegend={false}
							/>
						</div>

						<!-- Gender Stats -->
						<div class="flex w-full max-w-xs flex-col gap-4">
							<!-- Male Stats -->
							<div
								class="rounded-xl border border-blue-100 bg-blue-50 p-4 transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-blue-900/10"
							>
								<div class="mb-1 flex items-center justify-between">
									<span class="text-sm font-semibold text-blue-900 dark:text-blue-200">
										Total Male
									</span>
									<span
										class="rounded bg-white px-2 py-0.5 text-xs font-bold text-blue-600 shadow-sm dark:bg-slate-800/80"
									>
										{demographics.malePercent.toFixed(1)}%
									</span>
								</div>
								<p class="text-2xl font-bold text-slate-900 dark:text-white">
									{demographics.totalMale.toLocaleString()}
								</p>
								<p class="mt-1 text-xs text-muted-foreground">Individuals</p>
							</div>

							<!-- Female Stats -->
							<div
								class="rounded-xl border border-pink-100 bg-pink-50 p-4 transition-all hover:shadow-md dark:border-pink-900/20 dark:bg-pink-900/10"
							>
								<div class="mb-1 flex items-center justify-between">
									<span class="text-sm font-semibold text-pink-900 dark:text-pink-200">
										Total Female
									</span>
									<span
										class="rounded bg-white px-2 py-0.5 text-xs font-bold text-pink-600 shadow-sm dark:bg-slate-800/80"
									>
										{demographics.femalePercent.toFixed(1)}%
									</span>
								</div>
								<p class="text-2xl font-bold text-slate-900 dark:text-white">
									{demographics.totalFemale.toLocaleString()}
								</p>
								<p class="mt-1 text-xs text-muted-foreground">Individuals</p>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Labor & Employment Card -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<Briefcase class="size-5 text-purple-500" />
						Labor & Employment
					</Card.Title>
					<Card.Description>Workforce statistics and economic dependency</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<!-- Top Stats Row -->
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						<!-- Labor Force -->
						<div
							class="rounded-xl border border-purple-100 bg-linear-to-br from-purple-50 to-purple-100/50 p-3 dark:border-purple-900/30 dark:from-purple-900/20 dark:to-purple-900/10"
						>
							<div class="mb-2 flex items-center gap-1.5">
								<div class="rounded-lg bg-purple-500/10 p-1">
									<Users class="size-3.5 text-purple-600 dark:text-purple-400" />
								</div>
								<span class="text-xs font-medium text-purple-700 dark:text-purple-300"
									>Labor Force</span
								>
								<HelpTooltip content="Ages 15-64" class="text-purple-700" />
							</div>
							<p class="text-xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().laborForce.toLocaleString()}
							</p>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{laborMetrics().participationRate}% of population
							</p>
						</div>

						<!-- Employed -->
						<div
							class="rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-emerald-100/50 p-3 dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-emerald-900/10"
						>
							<div class="mb-2 flex items-center gap-1.5">
								<div class="rounded-lg bg-emerald-500/10 p-1">
									<TrendingUp class="size-3.5 text-emerald-600 dark:text-emerald-400" />
								</div>
								<span class="text-xs font-medium text-emerald-700 dark:text-emerald-300"
									>Employed</span
								>
							</div>
							<p class="text-xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().employed.toLocaleString()}
							</p>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{laborMetrics().employmentRate}% rate
							</p>
						</div>

						<!-- Unemployed -->
						<div
							class="rounded-xl border border-rose-100 bg-linear-to-br from-rose-50 to-rose-100/50 p-3 dark:border-rose-900/30 dark:from-rose-900/20 dark:to-rose-900/10"
						>
							<div class="mb-2 flex items-center gap-1.5">
								<div class="rounded-lg bg-rose-500/10 p-1">
									<TrendingDown class="size-3.5 text-rose-600 dark:text-rose-400" />
								</div>
								<span class="text-xs font-medium text-rose-700 dark:text-rose-300">Unemployed</span>
							</div>
							<p class="text-xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().unemployed.toLocaleString()}
							</p>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{100 - laborMetrics().employmentRate}% of labor force
							</p>
						</div>

						<!-- Senior Workforce -->
						<div
							class="rounded-xl border border-orange-100 bg-linear-to-br from-orange-50 to-orange-100/50 p-3 dark:border-orange-900/30 dark:from-orange-900/20 dark:to-orange-900/10"
						>
							<div class="mb-2 flex items-center gap-1.5">
								<div class="rounded-lg bg-orange-500/10 p-1">
									<Clock class="size-3.5 text-orange-600 dark:text-orange-400" />
								</div>
								<span class="text-xs font-medium text-orange-700 dark:text-orange-300">
									Senior Workers
								</span>
								<HelpTooltip content="Ages 60-64 in labor force" class="text-orange-700" />
							</div>
							<p class="text-xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().seniorWorkforce.toLocaleString()}
							</p>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{laborMetrics().seniorSharePercent}% of workforce
							</p>
						</div>
					</div>

					<!-- Employment Rate Visualization -->
					<div
						class="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
					>
						<h4 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
							Employment Distribution
						</h4>

						<!-- Stacked Bar -->
						<div
							class="relative mb-3 h-7 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
						>
							<div
								class="absolute top-0 left-0 flex h-full items-center justify-center bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
								style="width: {laborMetrics().employmentRate}%"
							>
								{#if laborMetrics().employmentRate > 15}
									<span class="text-xs font-bold text-white drop-shadow">
										{laborMetrics().employmentRate}%
									</span>
								{/if}
							</div>
							<div
								class="absolute top-0 flex h-full items-center justify-center bg-linear-to-r from-rose-500 to-rose-400 transition-all duration-700"
								style="left: {laborMetrics().employmentRate}%; width: {100 -
									laborMetrics().employmentRate}%"
							>
								{#if 100 - laborMetrics().employmentRate > 15}
									<span class="text-xs font-bold text-white drop-shadow">
										{100 - laborMetrics().employmentRate}%
									</span>
								{/if}
							</div>
						</div>

						<!-- Legend -->
						<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-full bg-linear-to-r from-emerald-500 to-emerald-400"
								></span>
								<span class="text-xs text-muted-foreground"
									>Employed ({laborMetrics().employed.toLocaleString()})</span
								>
							</div>
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-full bg-linear-to-r from-rose-500 to-rose-400"></span>
								<span class="text-xs text-muted-foreground"
									>Unemployed ({laborMetrics().unemployed.toLocaleString()})</span
								>
							</div>
						</div>
					</div>

					<!-- Dependency Ratio Section -->
					<div
						class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50/50 p-4 dark:border-amber-900/30 dark:from-amber-900/15 dark:to-orange-900/10"
					>
						<div class="mb-4 flex items-center gap-3">
							<div class="rounded-xl bg-amber-500/15 p-2 dark:bg-amber-500/20">
								<Scale class="size-5 text-amber-600 dark:text-amber-400" />
							</div>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
										Economic Dependency
									</h4>
									<HelpTooltip
										content="Measures the relationship between working and non-working population. Calculated as (Total Population - Labor Force) / Labor Force × 100."
										class="text-amber-700"
									/>
								</div>
								<p class="text-xs text-muted-foreground">Population economic support structure</p>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<!-- Dependency Ratio -->
							<div
								class="flex flex-col items-center justify-center rounded-xl bg-white/70 p-4 shadow-sm dark:bg-slate-800/50"
							>
								<div class="relative mb-2 size-20">
									<svg class="size-full -rotate-90" viewBox="0 0 36 36">
										<circle
											class="stroke-amber-200 dark:stroke-amber-900/50"
											cx="18"
											cy="18"
											fill="none"
											r="15.9155"
											stroke-width="3.5"
										></circle>
										<circle
											class="stroke-amber-500 dark:stroke-amber-400"
											cx="18"
											cy="18"
											fill="none"
											r="15.9155"
											stroke-dasharray="{Math.min(
												parseFloat(laborMetrics().dependencyRatio),
												100
											)} 100"
											stroke-linecap="round"
											stroke-width="3.5"
										></circle>
									</svg>
									<div class="absolute inset-0 flex flex-col items-center justify-center">
										<span class="text-xl font-bold text-slate-900 dark:text-white">
											{laborMetrics().dependencyRatio}
										</span>
									</div>
								</div>
								<span class="text-sm font-semibold text-amber-700 dark:text-amber-300"
									>Dependency Ratio</span
								>
								<span class="text-xs text-muted-foreground">per 100 workers</span>
							</div>

							<!-- Dependent Population -->
							<div
								class="flex flex-col items-center justify-center rounded-xl bg-white/70 p-4 shadow-sm dark:bg-slate-800/50"
							>
								<div class="mb-2 rounded-full bg-amber-500/15 p-3 dark:bg-amber-500/20">
									<Users class="size-8 text-amber-600 dark:text-amber-400" />
								</div>
								<span class="text-xl font-bold text-slate-900 dark:text-white">
									{laborMetrics().dependentPopulation.toLocaleString()}
								</span>
								<span class="text-sm font-semibold text-amber-700 dark:text-amber-300"
									>Dependent Population</span
								>
								<span class="text-xs text-muted-foreground">non-working residents</span>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right Column: Sidebar Stats (1/3 width) -->
		<div class="flex flex-col gap-6">
			<!-- Cultural & Demographic Groups -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<Users class="size-5 text-indigo-500" />
						Cultural & Demographic Groups
					</Card.Title>
					<Card.Description>Population composition across sitios</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-5">
						<!-- School-Age Children -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<School class="size-4 text-blue-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>School-Age Children</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalSchoolAgeChildren.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-blue-500 transition-all duration-500"
									style="width: {Math.min(
										(demographics.totalSchoolAgeChildren / demographics.totalPopulation) * 100,
										100
									)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{(
									(demographics.totalSchoolAgeChildren / demographics.totalPopulation) *
									100
								).toFixed(1)}% of Population
							</p>
						</div>

						<!-- Muslim Population -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<Landmark class="size-4 text-emerald-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Muslim</span>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalMuslim.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-emerald-500 transition-all duration-500"
									style="width: {Math.min(
										(demographics.totalMuslim / demographics.totalPopulation) * 100,
										100
									)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{((demographics.totalMuslim / demographics.totalPopulation) * 100).toFixed(1)}% of
								Population
							</p>
						</div>

						<!-- Indigenous People -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<Users class="size-4 text-indigo-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>Indigenous People</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalIP.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-indigo-500 transition-all duration-500"
									style="width: {Math.min(
										(demographics.totalIP / demographics.totalPopulation) * 100,
										100
									)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{((demographics.totalIP / demographics.totalPopulation) * 100).toFixed(1)}% of
								Population
							</p>
						</div>

						<!-- Registered Voters -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<Vote class="size-4 text-purple-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>Registered Voters</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalVoters.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-purple-500 transition-all duration-500"
									style="width: {Math.min(
										(demographics.totalVoters / demographics.totalPopulation) * 100,
										100
									)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{demographics.voterRegistrationPercent.toFixed(1)}% of Population
							</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Vulnerable Sectors -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<UserRound class="size-5 text-orange-500" />
						Vulnerable Sectors
					</Card.Title>
					<Card.Description>Priority populations requiring attention</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-5">
						<!-- Senior Citizens -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<UserCheck class="size-4 text-orange-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>Senior Citizens</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalSeniors.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-orange-500 transition-all duration-500"
									style="width: {Math.min(demographics.seniorPercent, 100)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{demographics.seniorPercent.toFixed(1)}% of Population
							</p>
						</div>

						<!-- Out of School Youth -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<School class="size-4 text-red-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>Out of School Youth</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalOSY.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-red-500 transition-all duration-500"
									style="width: {Math.min(
										demographics.totalSchoolAgeChildren > 0
											? (demographics.totalOSY / demographics.totalSchoolAgeChildren) * 100
											: 0,
										100
									)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{demographics.totalSchoolAgeChildren > 0
									? ((demographics.totalOSY / demographics.totalSchoolAgeChildren) * 100).toFixed(1)
									: '0'}% of School-Age Children • From {demographics.sitiosWithOSY} sitios
							</p>
						</div>

						<!-- No PhilSys ID -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<IdCard class="size-4 text-slate-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>No PhilSys ID</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalNoNationalID.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-slate-500 transition-all duration-500"
									style="width: {Math.min(
										(demographics.totalNoNationalID / demographics.totalPopulation) * 100,
										100
									)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{((demographics.totalNoNationalID / demographics.totalPopulation) * 100).toFixed(
									1
								)}% of Population
							</p>
						</div>

						<!-- No Birth Certificate -->
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<CreditCard class="size-4 text-amber-500" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>No Birth Certificate</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{demographics.totalNoBirthCert.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full bg-amber-500 transition-all duration-500"
									style="width: {Math.min(
										(demographics.totalNoBirthCert / demographics.totalPopulation) * 100,
										100
									)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{((demographics.totalNoBirthCert / demographics.totalPopulation) * 100).toFixed(1)}%
								of Population
							</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Sitio Classification Summary -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<UserCheck class="size-5 text-slate-500" />
						Sitio Classifications
					</Card.Title>
					<Card.Description>Special area designations and vulnerability status</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-3">
						<div
							class="rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/30 dark:bg-amber-900/20"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-start gap-2.5">
									<span class="mt-0.5 size-3 shrink-0 rounded-full bg-amber-500"></span>
									<div class="min-w-0 flex-1">
										<span class="text-sm leading-tight font-semibold text-slate-900 dark:text-white"
											>GIDA Status</span
										>
										<p class="mt-0.5 text-xs text-muted-foreground/80">
											Geographically Isolated and Disadvantaged Area
										</p>
									</div>
								</div>
								<span class="text-lg font-bold text-slate-900 dark:text-white">
									{demographics.gidaCount}
								</span>
							</div>
						</div>
						<div
							class="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900/30 dark:bg-emerald-900/20"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-start gap-2.5">
									<span class="mt-0.5 size-3 shrink-0 rounded-full bg-emerald-500"></span>
									<div class="min-w-0 flex-1">
										<span class="text-sm leading-tight font-semibold text-slate-900 dark:text-white"
											>Indigenous Community</span
										>
										<p class="mt-0.5 text-xs text-muted-foreground/80">
											Indigenous Peoples (IP) Area
										</p>
									</div>
								</div>
								<span class="text-lg font-bold text-slate-900 dark:text-white">
									{demographics.indigenousCount}
								</span>
							</div>
						</div>
						<div
							class="rounded-lg border border-red-200 bg-red-50 p-3.5 dark:border-red-900/30 dark:bg-red-900/20"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-start gap-2.5">
									<span class="mt-0.5 size-3 shrink-0 rounded-full bg-red-500"></span>
									<div class="min-w-0 flex-1">
										<span class="text-sm leading-tight font-semibold text-slate-900 dark:text-white"
											>Conflict-Affected</span
										>
										<p class="mt-0.5 text-xs text-muted-foreground/80">Conflict-affected area</p>
									</div>
								</div>
								<span class="text-lg font-bold text-slate-900 dark:text-white">
									{demographics.conflictCount}
								</span>
							</div>
						</div>
						<p class="text-center text-xs text-muted-foreground">
							Note: Sitios may have multiple classifications
						</p>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
