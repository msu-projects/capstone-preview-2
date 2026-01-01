<script lang="ts">
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioProfile } from '$lib/types';
	import {
		Briefcase,
		Clock,
		CreditCard,
		IdCard,
		Landmark,
		PersonStanding,
		School,
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

		return {
			laborForce,
			unemployed,
			employed,
			employmentRate,
			participationRate,
			seniorWorkforce,
			seniorSharePercent
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
				<div class="flex flex-col items-center justify-around gap-6 md:flex-row">
					<!-- Donut Chart -->
					<div class="relative w-44 shrink-0 md:w-48">
						<DonutChart
							data={genderData}
							centerLabel="Total"
							centerValue={sitio.totalPopulation.toLocaleString()}
							height={200}
							showLegend={false}
						/>
					</div>

					<!-- Gender Stats -->
					<div class="flex w-full max-w-xs flex-col gap-4">
						<!-- Male Stats -->
						<div
							class="rounded-xl border border-blue-100 bg-blue-50/80 p-4 transition-all hover:shadow-sm dark:border-blue-900/30 dark:bg-blue-900/10"
						>
							<div class="mb-1.5 flex items-center justify-between">
								<span class="text-xs font-semibold text-blue-800 dark:text-blue-200">
									Total Male
								</span>
								<span
									class="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-blue-600 shadow-sm dark:bg-slate-800"
								>
									{sitio.totalPopulation > 0
										? Math.round((sitio.population.totalMale / sitio.totalPopulation) * 100)
										: 0}%
								</span>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{sitio.population.totalMale.toLocaleString()}
							</p>
							<p class="mt-0.5 text-xs text-muted-foreground">Individuals</p>
						</div>

						<!-- Female Stats -->
						<div
							class="rounded-xl border border-pink-100 bg-pink-50/80 p-4 transition-all hover:shadow-sm dark:border-pink-900/30 dark:bg-pink-900/10"
						>
							<div class="mb-1.5 flex items-center justify-between">
								<span class="text-xs font-semibold text-pink-800 dark:text-pink-200">
									Total Female
								</span>
								<span
									class="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-pink-600 shadow-sm dark:bg-slate-800"
								>
									{sitio.totalPopulation > 0
										? Math.round((sitio.population.totalFemale / sitio.totalPopulation) * 100)
										: 0}%
								</span>
							</div>
							<p class="text-2xl font-bold text-slate-900 dark:text-white">
								{sitio.population.totalFemale.toLocaleString()}
							</p>
							<p class="mt-0.5 text-xs text-muted-foreground">Individuals</p>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Labor Workforce Card -->
		<InfoCard
			title="Labor Workforce"
			description="Ages 15-64 years old"
			icon={Briefcase}
			iconBgColor="bg-purple-100 dark:bg-purple-900/20"
			iconTextColor="text-purple-600 dark:text-purple-400"
		>
			{#snippet children()}
				<div class="grid h-full grid-cols-1 items-stretch gap-4 md:grid-cols-3">
					<!-- Total Labor Force -->
					<div
						class="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center transition-all hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
					>
						<h4
							class="z-10 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>
							Total Labor Force
						</h4>
						<div class="relative z-10 size-24">
							<svg class="size-full -rotate-90" viewBox="0 0 36 36">
								<path
									class="text-slate-200 dark:text-slate-700"
									d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
								></path>
								<path
									class="text-purple-600 dark:text-purple-500"
									d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="currentColor"
									stroke-dasharray="{laborMetrics().participationRate}, 100"
									stroke-linecap="round"
									stroke-width="3"
								></path>
							</svg>
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="text-xl font-bold text-slate-900 dark:text-white">
									{laborMetrics().laborForce.toLocaleString()}
								</span>
							</div>
						</div>
						<p class="z-10 mt-1 text-xs font-medium text-purple-600 dark:text-purple-400">
							{laborMetrics().participationRate}% Participation
						</p>
					</div>

					<!-- Employment Status -->
					<div
						class="flex flex-col items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
					>
						<h4
							class="mb-2 w-full text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>
							Employment Status
						</h4>
						<div class="flex flex-row items-center gap-3">
							<div class="relative size-20 shrink-0">
								<svg class="size-full -rotate-90" viewBox="0 0 36 36">
									<circle
										class="dark:stroke-slate-700"
										cx="18"
										cy="18"
										fill="none"
										r="15.9155"
										stroke="#e2e8f0"
										stroke-width="4"
									></circle>
									<circle
										cx="18"
										cy="18"
										fill="none"
										r="15.9155"
										stroke="#10b981"
										stroke-dasharray="{laborMetrics().employmentRate} 100"
										stroke-dashoffset="0"
										stroke-width="4"
									></circle>
									<circle
										cx="18"
										cy="18"
										fill="none"
										r="15.9155"
										stroke="#f43f5e"
										stroke-dasharray="{100 - laborMetrics().employmentRate} 100"
										stroke-dashoffset="-{laborMetrics().employmentRate}"
										stroke-width="4"
									></circle>
								</svg>
								<div class="absolute inset-0 flex items-center justify-center">
									<span class="text-xs font-bold text-slate-900 dark:text-white">
										{laborMetrics().employmentRate}%
									</span>
								</div>
							</div>
							<div class="flex min-w-20 flex-col gap-2">
								<div>
									<div class="mb-0.5 flex items-center gap-1.5">
										<span class="size-1.5 rounded-full bg-emerald-500"></span>
										<span class="text-[10px] font-medium text-muted-foreground uppercase">
											Employed
										</span>
									</div>
									<p class="text-base leading-none font-bold text-slate-900 dark:text-white">
										{laborMetrics().employed.toLocaleString()}
									</p>
								</div>
								<div>
									<div class="mb-0.5 flex items-center gap-1.5">
										<span class="size-1.5 rounded-full bg-rose-500"></span>
										<span class="text-[10px] font-medium text-muted-foreground uppercase">
											Unemployed
										</span>
									</div>
									<p class="text-base leading-none font-bold text-slate-900 dark:text-white">
										{laborMetrics().unemployed.toLocaleString()}
									</p>
								</div>
							</div>
						</div>
						<div
							class="mt-2 w-full border-t border-slate-200 pt-2 text-center dark:border-slate-700"
						>
							<p class="text-[10px] text-muted-foreground">Based on current survey data</p>
						</div>
					</div>

					<!-- Senior Workforce -->
					<div
						class="relative flex flex-col items-center justify-between overflow-hidden rounded-xl border border-orange-100 bg-orange-50/80 p-4 text-center transition-all hover:shadow-sm dark:border-orange-900/20 dark:bg-orange-900/10"
					>
						<div class="absolute top-0 right-0 p-2 opacity-10">
							<Clock class="size-12 text-orange-600 dark:text-orange-400" />
						</div>
						<div class="z-10 flex w-full flex-col items-center">
							<div
								class="mb-2 rounded-full bg-orange-100 p-2 text-orange-600 dark:bg-orange-800/30 dark:text-orange-400"
							>
								<Clock class="size-5" />
							</div>
							<p class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
								{laborMetrics().seniorWorkforce}
							</p>
							<p
								class="mt-0.5 text-[10px] font-semibold tracking-wide text-orange-800 uppercase dark:text-orange-200"
							>
								Senior Workforce
							</p>
							<p class="text-[10px] text-orange-700/70 dark:text-orange-300/70">(Ages 60-64)</p>
						</div>
						<div class="z-10 mt-3 w-full">
							<div
								class="mb-1 flex items-center justify-between text-[10px] font-medium text-orange-800/70 dark:text-orange-200/70"
							>
								<span>Share of Labor Force</span>
								<span>{laborMetrics().seniorSharePercent}%</span>
							</div>
							<div
								class="h-1.5 w-full overflow-hidden rounded-full bg-orange-200 dark:bg-orange-900/40"
							>
								<div
									class="h-full rounded-full bg-orange-500 transition-all duration-500"
									style="width: {laborMetrics().seniorSharePercent}%"
								></div>
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
				<div class="space-y-4">
					{#each culturalGroups as group}
						{@const Icon = group.icon}
						<div
							class="rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50/50 dark:border-slate-700/50 dark:hover:bg-slate-800/30"
						>
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="rounded-md p-1.5 {group.lightBg}">
										<Icon class="size-3.5 {group.color.replace('bg-', 'text-')}" />
									</div>
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>{group.label}</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{group.value.toLocaleString()}
								</span>
							</div>
							<div class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-1.5 rounded-full {group.color} transition-all duration-500"
									style="width: {Math.min(parseFloat(group.percentage), 100)}%"
								></div>
							</div>
							<p class="mt-1.5 text-right text-xs text-muted-foreground">
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
				<div class="space-y-4">
					{#each vulnerableSectors as sector}
						{@const Icon = sector.icon}
						<div
							class="rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50/50 dark:border-slate-700/50 dark:hover:bg-slate-800/30"
						>
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="rounded-md p-1.5 {sector.lightBg}">
										<Icon class="size-3.5 {sector.color.replace('bg-', 'text-')}" />
									</div>
									<span class="text-sm font-medium text-slate-700 dark:text-slate-300"
										>{sector.label}</span
									>
								</div>
								<span class="text-base font-bold text-slate-900 dark:text-white">
									{sector.value.toLocaleString()}
								</span>
							</div>
							<div class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-1.5 rounded-full {sector.color} transition-all duration-500"
									style="width: {Math.min(parseFloat(sector.percentage), 100)}%"
								></div>
							</div>
							<p class="mt-1.5 text-right text-xs text-muted-foreground">
								{sector.percentage}% {sector.description || 'of Population'}
							</p>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>
	</div>
</div>
