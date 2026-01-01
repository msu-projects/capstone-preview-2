<script lang="ts">
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioProfile } from '$lib/types';
	import {
		Baby,
		Briefcase,
		Clock,
		CreditCard,
		IdCard,
		Landmark,
		PersonStanding,
		Scale,
		School,
		TrendingDown,
		TrendingUp,
		UserRound,
		Users,
		Vote
	} from '@lucide/svelte';

	interface Props {
		sitio: SitioProfile;
	}

	const { sitio }: Props = $props();

	// Gender distribution data for donut chart
	const genderData = $derived([
		{
			label: 'Male',
			value: sitio.population.totalMale,
			color: 'hsl(217, 91%, 60%)'
		},
		{
			label: 'Female',
			value: sitio.population.totalFemale,
			color: 'hsl(330, 81%, 60%)'
		}
	]);

	// Calculate labor force metrics
	const laborMetrics = $derived(() => {
		const laborForce = sitio.laborForceCount || 0;
		const unemployed = sitio.vulnerableGroups.unemployedCount || 0;
		const employed = laborForce - unemployed;
		const employmentRate = laborForce > 0 ? Math.round((employed / laborForce) * 100) : 0;
		const participationRate =
			sitio.totalPopulation > 0 ? Math.round((laborForce / sitio.totalPopulation) * 100) : 0;
		const seniorWorkforce = sitio.vulnerableGroups.laborForce60to64Count || 0;
		const seniorSharePercent =
			laborForce > 0 ? ((seniorWorkforce / laborForce) * 100).toFixed(1) : '0';

		// Dependency ratio calculation
		// Dependents = population not in labor force (children + elderly)
		const dependentPopulation = sitio.totalPopulation - laborForce;
		const dependencyRatio = laborForce > 0 ? (dependentPopulation / laborForce) * 100 : 0;
		const youngDependents = sitio.schoolAgeChildren || 0; // Proxy for youth dependents
		const elderlyDependents = sitio.vulnerableGroups.seniorsCount || 0;

		return {
			laborForce,
			unemployed,
			employed,
			employmentRate,
			participationRate,
			seniorWorkforce,
			seniorSharePercent,
			dependentPopulation,
			dependencyRatio: dependencyRatio.toFixed(1),
			youngDependents,
			elderlyDependents
		};
	});

	// Cultural groups data
	const culturalGroups = $derived([
		{
			icon: Landmark,
			label: 'Muslim',
			value: sitio.vulnerableGroups.muslimCount,
			percentage:
				sitio.totalPopulation > 0
					? ((sitio.vulnerableGroups.muslimCount / sitio.totalPopulation) * 100).toFixed(1)
					: '0',
			color: 'bg-emerald-500',
			lightBg: 'bg-emerald-50 dark:bg-emerald-500/10'
		},
		{
			icon: Users,
			label: 'Indigenous People',
			value: sitio.vulnerableGroups.ipCount,
			percentage:
				sitio.totalPopulation > 0
					? ((sitio.vulnerableGroups.ipCount / sitio.totalPopulation) * 100).toFixed(1)
					: '0',
			color: 'bg-indigo-500',
			lightBg: 'bg-indigo-50 dark:bg-indigo-500/10'
		},
		{
			icon: Vote,
			label: 'Registered Voters',
			value: sitio.registeredVoters,
			percentage:
				sitio.totalPopulation > 0
					? ((sitio.registeredVoters / sitio.totalPopulation) * 100).toFixed(1)
					: '0',
			color: 'bg-purple-500',
			lightBg: 'bg-purple-50 dark:bg-purple-500/10'
		}
	]);

	// Vulnerable sectors data
	const vulnerableSectors = $derived([
		{
			icon: UserRound,
			label: 'Senior Citizens',
			value: sitio.vulnerableGroups.seniorsCount,
			percentage:
				sitio.totalPopulation > 0
					? ((sitio.vulnerableGroups.seniorsCount / sitio.totalPopulation) * 100).toFixed(1)
					: '0',
			color: 'bg-orange-500',
			lightBg: 'bg-orange-50 dark:bg-orange-500/10'
		},
		{
			icon: School,
			label: 'Out of School Youth',
			value: sitio.vulnerableGroups.outOfSchoolYouth,
			percentage:
				sitio.schoolAgeChildren > 0
					? ((sitio.vulnerableGroups.outOfSchoolYouth / sitio.schoolAgeChildren) * 100).toFixed(1)
					: '0',
			description: 'of School-Age Children',
			color: 'bg-red-500',
			lightBg: 'bg-red-50 dark:bg-red-500/10'
		},
		{
			icon: IdCard,
			label: 'No PhilSys ID',
			value: sitio.vulnerableGroups.noNationalIDCount,
			percentage:
				sitio.totalPopulation > 0
					? ((sitio.vulnerableGroups.noNationalIDCount / sitio.totalPopulation) * 100).toFixed(1)
					: '0',
			color: 'bg-slate-500',
			lightBg: 'bg-slate-100 dark:bg-slate-500/10'
		},
		{
			icon: CreditCard,
			label: 'No Birth Certificate',
			value: sitio.vulnerableGroups.noBirthCertCount,
			percentage:
				sitio.totalPopulation > 0
					? ((sitio.vulnerableGroups.noBirthCertCount / sitio.totalPopulation) * 100).toFixed(1)
					: '0',
			color: 'bg-amber-500',
			lightBg: 'bg-amber-50 dark:bg-amber-500/10'
		}
	]);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Column: Main Charts (2/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-2">
		<!-- Gender Distribution Card -->
		<InfoCard
			title="Gender Distribution"
			description="Breakdown of population by sex"
			icon={PersonStanding}
			iconBgColor="bg-pink-50 dark:bg-pink-900/20"
			iconTextColor="text-pink-600 dark:text-pink-400"
		>
			{#snippet children()}
				<div class="flex flex-col items-center justify-around gap-8 p-2 md:flex-row">
					<!-- Donut Chart -->
					<div class="relative w-48 shrink-0 md:w-56">
						<DonutChart
							data={genderData}
							centerLabel="Total"
							centerValue={sitio.totalPopulation.toLocaleString()}
							height={224}
							showLegend={false}
						/>
					</div>

					<!-- Gender Stats -->
					<div class="flex w-full max-w-xs flex-col gap-6">
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
									{sitio.totalPopulation > 0
										? Math.round((sitio.population.totalMale / sitio.totalPopulation) * 100)
										: 0}%
								</span>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{sitio.population.totalMale.toLocaleString()}
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
									{sitio.totalPopulation > 0
										? Math.round((sitio.population.totalFemale / sitio.totalPopulation) * 100)
										: 0}%
								</span>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{sitio.population.totalFemale.toLocaleString()}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">Individuals</p>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Labor Workforce Card -->
		<InfoCard
			title="Labor & Employment"
			description="Workforce statistics and economic dependency"
			icon={Briefcase}
			iconBgColor="bg-purple-100 dark:bg-purple-900/20"
			iconTextColor="text-purple-600 dark:text-purple-400"
		>
			{#snippet children()}
				<div class="space-y-6">
					<!-- Top Stats Row -->
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<!-- Labor Force -->
						<div
							class="rounded-xl border border-purple-100 bg-linear-to-br from-purple-50 to-purple-100/50 p-4 dark:border-purple-900/30 dark:from-purple-900/20 dark:to-purple-900/10"
						>
							<div class="mb-2 flex items-center gap-2">
								<div class="rounded-lg bg-purple-500/10 p-1.5">
									<Users class="size-4 text-purple-600 dark:text-purple-400" />
								</div>
								<span class="text-xs font-medium text-purple-700 dark:text-purple-300"
									>Labor Force</span
								>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().laborForce.toLocaleString()}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">
								{laborMetrics().participationRate}% of population
							</p>
						</div>

						<!-- Employed -->
						<div
							class="rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-emerald-100/50 p-4 dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-emerald-900/10"
						>
							<div class="mb-2 flex items-center gap-2">
								<div class="rounded-lg bg-emerald-500/10 p-1.5">
									<TrendingUp class="size-4 text-emerald-600 dark:text-emerald-400" />
								</div>
								<span class="text-xs font-medium text-emerald-700 dark:text-emerald-300"
									>Employed</span
								>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().employed.toLocaleString()}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">
								{laborMetrics().employmentRate}% employment rate
							</p>
						</div>

						<!-- Unemployed -->
						<div
							class="rounded-xl border border-rose-100 bg-linear-to-br from-rose-50 to-rose-100/50 p-4 dark:border-rose-900/30 dark:from-rose-900/20 dark:to-rose-900/10"
						>
							<div class="mb-2 flex items-center gap-2">
								<div class="rounded-lg bg-rose-500/10 p-1.5">
									<TrendingDown class="size-4 text-rose-600 dark:text-rose-400" />
								</div>
								<span class="text-xs font-medium text-rose-700 dark:text-rose-300">Unemployed</span>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().unemployed.toLocaleString()}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">
								{100 - laborMetrics().employmentRate}% of labor force
							</p>
						</div>

						<!-- Senior Workforce -->
						<div
							class="rounded-xl border border-orange-100 bg-linear-to-br from-orange-50 to-orange-100/50 p-4 dark:border-orange-900/30 dark:from-orange-900/20 dark:to-orange-900/10"
						>
							<div class="mb-2 flex items-center gap-2">
								<div class="rounded-lg bg-orange-500/10 p-1.5">
									<Clock class="size-4 text-orange-600 dark:text-orange-400" />
								</div>
								<span class="text-xs font-medium text-orange-700 dark:text-orange-300"
									>Senior Workers</span
								>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{laborMetrics().seniorWorkforce.toLocaleString()}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">
								{laborMetrics().seniorSharePercent}% of workforce
							</p>
						</div>
					</div>

					<!-- Employment Rate Visualization -->
					<div
						class="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30"
					>
						<div class="mb-4 flex items-center justify-between">
							<h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
								Employment Distribution
							</h4>
							<span
								class="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
							>
								{laborMetrics().laborForce.toLocaleString()} workers
							</span>
						</div>

						<!-- Stacked Bar -->
						<div
							class="relative mb-3 h-8 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
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
						<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
							<div class="flex items-center gap-2">
								<span class="size-3 rounded-full bg-linear-to-r from-emerald-500 to-emerald-400"
								></span>
								<span class="text-xs text-muted-foreground"
									>Employed ({laborMetrics().employed.toLocaleString()})</span
								>
							</div>
							<div class="flex items-center gap-2">
								<span class="size-3 rounded-full bg-linear-to-r from-rose-500 to-rose-400"></span>
								<span class="text-xs text-muted-foreground"
									>Unemployed ({laborMetrics().unemployed.toLocaleString()})</span
								>
							</div>
						</div>
					</div>

					<!-- Dependency Ratio Section -->
					<div
						class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50/50 p-5 dark:border-amber-900/30 dark:from-amber-900/15 dark:to-orange-900/10"
					>
						<div class="mb-4 flex items-center gap-3">
							<div class="rounded-xl bg-amber-500/15 p-2.5 dark:bg-amber-500/20">
								<Scale class="size-5 text-amber-600 dark:text-amber-400" />
							</div>
							<div>
								<h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
									Dependency Ratio
								</h4>
								<p class="text-xs text-muted-foreground">Non-working population per 100 workers</p>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<!-- Total Dependency Ratio -->
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
											stroke-width="4"
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
											stroke-width="4"
										></circle>
									</svg>
									<div class="absolute inset-0 flex flex-col items-center justify-center">
										<span class="text-lg font-bold text-slate-900 dark:text-white">
											{laborMetrics().dependencyRatio}
										</span>
									</div>
								</div>
								<span class="text-xs font-semibold text-amber-700 dark:text-amber-300"
									>Total Ratio</span
								>
								<span class="text-[10px] text-muted-foreground">per 100 workers</span>
							</div>

							<!-- Dependents Breakdown -->
							<div class="col-span-1 flex flex-col justify-center gap-3 sm:col-span-2">
								<!-- Young Dependents -->
								<div
									class="flex items-center gap-3 rounded-lg bg-white/70 p-3 dark:bg-slate-800/50"
								>
									<div class="rounded-lg bg-blue-500/10 p-2">
										<Baby class="size-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div class="flex-1">
										<div class="flex items-center justify-between">
											<span class="text-xs font-medium text-slate-600 dark:text-slate-300"
												>School-Age Children</span
											>
											<span class="text-sm font-bold text-slate-900 dark:text-white">
												{laborMetrics().youngDependents.toLocaleString()}
											</span>
										</div>
										<div
											class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30"
										>
											<div
												class="h-full rounded-full bg-blue-500 transition-all duration-500"
												style="width: {sitio.totalPopulation > 0
													? Math.min(
															(laborMetrics().youngDependents / sitio.totalPopulation) * 100,
															100
														)
													: 0}%"
											></div>
										</div>
									</div>
								</div>

								<!-- Elderly Dependents -->
								<div
									class="flex items-center gap-3 rounded-lg bg-white/70 p-3 dark:bg-slate-800/50"
								>
									<div class="rounded-lg bg-purple-500/10 p-2">
										<UserRound class="size-4 text-purple-600 dark:text-purple-400" />
									</div>
									<div class="flex-1">
										<div class="flex items-center justify-between">
											<span class="text-xs font-medium text-slate-600 dark:text-slate-300"
												>Senior Citizens (60+)</span
											>
											<span class="text-sm font-bold text-slate-900 dark:text-white">
												{laborMetrics().elderlyDependents.toLocaleString()}
											</span>
										</div>
										<div
											class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-900/30"
										>
											<div
												class="h-full rounded-full bg-purple-500 transition-all duration-500"
												style="width: {sitio.totalPopulation > 0
													? Math.min(
															(laborMetrics().elderlyDependents / sitio.totalPopulation) * 100,
															100
														)
													: 0}%"
											></div>
										</div>
									</div>
								</div>

								<!-- Total Dependents Summary -->
								<div
									class="flex items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-100/50 px-3 py-2 dark:border-amber-700 dark:bg-amber-900/20"
								>
									<span class="text-xs font-medium text-amber-700 dark:text-amber-300"
										>Total Dependent Population</span
									>
									<span class="text-sm font-bold text-amber-800 dark:text-amber-200">
										{laborMetrics().dependentPopulation.toLocaleString()}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>
	</div>

	<!-- Right Column: Sidebar Stats (1/3 width) -->
	<div class="flex flex-col gap-6">
		<!-- Cultural & Demographic Groups -->
		<InfoCard
			title="Cultural & Demographic Groups"
			description="Population composition"
			icon={Users}
			iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
			iconTextColor="text-indigo-600 dark:text-indigo-400"
		>
			{#snippet children()}
				<div class="space-y-6">
					{#each culturalGroups as group}
						{@const Icon = group.icon}
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<Icon class="size-5 {group.color.replace('bg-', 'text-')}" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>{group.label}</span
									>
								</div>
								<span class="text-lg font-bold text-slate-900 dark:text-white">
									{group.value.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full {group.color} transition-all duration-500"
									style="width: {Math.min(parseFloat(group.percentage), 100)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{group.percentage}% of Population
							</p>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Vulnerable Sectors -->
		<InfoCard
			title="Vulnerable Sectors"
			description="Priority populations"
			icon={UserRound}
			iconBgColor="bg-orange-50 dark:bg-orange-900/20"
			iconTextColor="text-orange-600 dark:text-orange-400"
		>
			{#snippet children()}
				<div class="space-y-6">
					{#each vulnerableSectors as sector}
						{@const Icon = sector.icon}
						<div>
							<div class="mb-2 flex items-end justify-between">
								<div class="flex items-center gap-2">
									<Icon class="size-5 {sector.color.replace('bg-', 'text-')}" />
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>{sector.label}</span
									>
								</div>
								<span class="text-lg font-bold text-slate-900 dark:text-white">
									{sector.value.toLocaleString()}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2 rounded-full {sector.color} transition-all duration-500"
									style="width: {Math.min(parseFloat(sector.percentage), 100)}%"
								></div>
							</div>
							<p class="mt-1 text-right text-xs text-muted-foreground">
								{sector.percentage}% {sector.description || 'of Population'}
							</p>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>
	</div>
</div>
