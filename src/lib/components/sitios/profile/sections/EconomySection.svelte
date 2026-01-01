<script lang="ts">
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import type { SitioProfile } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import {
		AlertTriangle,
		Banknote,
		Bird,
		Briefcase,
		Building2,
		CheckCircle2,
		CircleAlert,
		Droplets,
		Flame,
		Globe,
		HandCoins,
		Home,
		Info,
		Landmark,
		Leaf,
		Mountain,
		Sprout,
		Tractor,
		TrendingDown,
		TrendingUp,
		UserCheck,
		Users,
		Utensils,
		Wheat
	} from '@lucide/svelte';

	interface Props {
		sitio: SitioProfile;
	}

	const { sitio }: Props = $props();

	// Calculate total workers
	const totalWorkers = $derived(
		sitio.workerClass.privateHousehold +
			sitio.workerClass.privateEstablishment +
			sitio.workerClass.government +
			sitio.workerClass.selfEmployed +
			sitio.workerClass.employer +
			sitio.workerClass.ofw
	);

	// Worker class distribution data for donut chart with descriptions
	const workerClassData = $derived([
		{
			label: 'Private HH',
			fullLabel: 'Private Household',
			value: sitio.workerClass.privateHousehold,
			color: 'hsl(262, 83%, 58%)',
			icon: Home,
			description:
				'Works in a private household for pay, in cash or in kind. Examples include domestic helpers, household cooks, gardeners, and family drivers.'
		},
		{
			label: 'Private Est.',
			fullLabel: 'Private Establishment',
			value: sitio.workerClass.privateEstablishment,
			color: 'hsl(217, 91%, 60%)',
			icon: Building2,
			description:
				'Works in a private establishment for pay. Includes persons working for private industry, religious groups, unions, and non-profit organizations.'
		},
		{
			label: 'Government',
			fullLabel: 'Government Worker',
			value: sitio.workerClass.government,
			color: 'hsl(142, 71%, 45%)',
			icon: Landmark,
			description:
				'Works for government or a government corporation or any of its instrumentalities.'
		},
		{
			label: 'Self-Employed',
			fullLabel: 'Self-Employed',
			value: sitio.workerClass.selfEmployed,
			color: 'hsl(38, 92%, 50%)',
			icon: UserCheck,
			description:
				'Works for profit or fees in own business, farm, profession or trade without any paid employee. Examples: bookkeeper, CPA, doctors, etc.'
		},
		{
			label: 'Employer',
			fullLabel: 'Employer',
			value: sitio.workerClass.employer,
			color: 'hsl(340, 75%, 55%)',
			icon: Briefcase,
			description:
				'Works in their own business, farm, profession or trade with one or more regular paid employees, including paid family members.'
		},
		{
			label: 'OFW',
			fullLabel: 'Overseas Filipino Worker',
			value: sitio.workerClass.ofw,
			color: 'hsl(173, 80%, 40%)',
			icon: Globe,
			description:
				'Works for the government of another country. Includes OFWs working abroad whose pay is provided by that foreign government.'
		}
	]);

	// Calculate percentages for worker class
	const workerClassWithPercent = $derived(
		workerClassData.map((item) => ({
			...item,
			percent: totalWorkers > 0 ? Math.round((item.value / totalWorkers) * 100) : 0
		}))
	);

	// Income level indicator with more context
	const incomeLevel = $derived(() => {
		const daily = sitio.averageDailyIncome;
		if (daily >= 500)
			return {
				label: 'Above Average',
				color: 'text-emerald-600 dark:text-emerald-400',
				bg: 'bg-emerald-500',
				bgLight: 'bg-emerald-100 dark:bg-emerald-900/40',
				icon: TrendingUp,
				trend: 'up'
			};
		if (daily >= 300)
			return {
				label: 'Average',
				color: 'text-blue-600 dark:text-blue-400',
				bg: 'bg-blue-500',
				bgLight: 'bg-blue-100 dark:bg-blue-900/40',
				icon: TrendingUp,
				trend: 'neutral'
			};
		if (daily >= 150)
			return {
				label: 'Below Average',
				color: 'text-amber-600 dark:text-amber-400',
				bg: 'bg-amber-500',
				bgLight: 'bg-amber-100 dark:bg-amber-900/40',
				icon: TrendingDown,
				trend: 'down'
			};
		return {
			label: 'Low Income',
			color: 'text-red-600 dark:text-red-400',
			bg: 'bg-red-500',
			bgLight: 'bg-red-100 dark:bg-red-900/40',
			icon: TrendingDown,
			trend: 'critical'
		};
	});

	// Employment rate calculation
	const employmentRate = $derived(
		sitio.laborForceCount > 0 ? Math.round((totalWorkers / sitio.laborForceCount) * 100) : 0
	);

	// Food security configuration
	const foodSecurityConfig = $derived(() => {
		const configs = {
			secure: {
				label: 'Food Secure',
				description: 'Adequate food supply year-round',
				icon: CheckCircle2,
				color: 'emerald',
				bgClass:
					'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-emerald-950/10'
			},
			seasonal_scarcity: {
				label: 'Seasonal Scarcity',
				description: 'Food shortages during certain periods',
				icon: CircleAlert,
				color: 'amber',
				bgClass:
					'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:border-amber-800/40 dark:from-amber-900/20 dark:to-amber-950/10'
			},
			critical_shortage: {
				label: 'Critical Shortage',
				description: 'Chronic food insufficiency',
				icon: AlertTriangle,
				color: 'red',
				bgClass:
					'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 dark:border-red-800/40 dark:from-red-900/20 dark:to-red-950/10'
			}
		};

		return Object.entries(configs).map(([key, config]) => ({
			...config,
			key,
			isActive: sitio.foodSecurity === key
		}));
	});

	// Hazards data with icons and severity
	const hazardsList = $derived([
		{
			name: 'Flood',
			frequency: parseInt(sitio.hazards.flood.frequency) || 0,
			icon: Droplets,
			color: 'blue'
		},
		{
			name: 'Landslide',
			frequency: parseInt(sitio.hazards.landslide.frequency) || 0,
			icon: Mountain,
			color: 'amber'
		},
		{
			name: 'Drought',
			frequency: parseInt(sitio.hazards.drought.frequency) || 0,
			icon: Flame,
			color: 'orange'
		},
		{
			name: 'Earthquake',
			frequency: parseInt(sitio.hazards.earthquake.frequency) || 0,
			icon: AlertTriangle,
			color: 'red'
		}
	]);

	// Total hazard frequency
	const totalHazardFrequency = $derived(hazardsList.reduce((sum, h) => sum + h.frequency, 0));
	const hasHazards = $derived(totalHazardFrequency > 0);

	// Agriculture summary stats
	const agricultureStats = $derived([
		{
			label: 'Farmers',
			value: sitio.agriculture.numberOfFarmers,
			icon: Tractor,
			color: 'bg-amber-500'
		},
		{
			label: 'Associations',
			value: sitio.agriculture.numberOfAssociations,
			icon: Users,
			color: 'bg-emerald-500'
		},
		{
			label: 'Hectares',
			value: sitio.agriculture.estimatedFarmAreaHectares,
			icon: Sprout,
			color: 'bg-green-500'
		}
	]);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Column: Main Content (2/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-2">
		<!-- Labor & Income Card -->
		<InfoCard
			title="Labor & Income"
			description="Employment distribution and household earnings"
			icon={Briefcase}
			iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
			iconTextColor="text-emerald-500"
		>
			{#snippet children()}
				{@const level = incomeLevel()}
				<div class="flex flex-col gap-6">
					<!-- Top Stats Row -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<!-- Average Daily Income - Hero Stat -->
						<div
							class="relative col-span-1 overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-emerald-50/80 to-teal-50/50 p-5 sm:col-span-2 dark:border-emerald-800/30 dark:from-emerald-900/20 dark:via-emerald-900/15 dark:to-teal-900/10"
						>
							<div
								class="absolute -top-6 -right-6 size-32 rounded-full bg-emerald-200/30 blur-2xl dark:bg-emerald-500/10"
							></div>
							<div class="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
								<div class="flex-1">
									<div class="mb-1 flex items-center gap-2">
										<div class="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-800/40">
											<Banknote class="size-4 text-emerald-600 dark:text-emerald-400" />
										</div>
										<span
											class="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300"
										>
											Average Daily Income
										</span>
										<HelpTooltip>
											Average daily income per household head based on survey data
										</HelpTooltip>
									</div>
									<p
										class="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
									>
										{formatCurrency(sitio.averageDailyIncome)}
									</p>
								</div>
								<div class="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
									<div class="flex items-center gap-1.5 rounded-full px-3 py-1.5 {level.bgLight}">
										<level.icon class="size-4 {level.color}" />
										<span class="text-sm font-semibold {level.color}">
											{level.label}
										</span>
									</div>
									<span class="text-xs text-muted-foreground">per household head</span>
								</div>
							</div>
						</div>

						<!-- Employment Rate Mini Card -->
						<div
							class="flex flex-col justify-center rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/80 to-indigo-50/50 p-5 text-center dark:border-violet-800/30 dark:from-violet-900/15 dark:to-indigo-900/10"
						>
							<span
								class="text-[10px] font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300"
							>
								Employment Rate
							</span>
							<p class="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
								{employmentRate}%
							</p>
							<p class="mt-1 text-[10px] text-muted-foreground">
								{totalWorkers} of {sitio.laborForceCount}
							</p>
						</div>
					</div>

					<!-- Labor Force Stats -->
					<div class="grid grid-cols-2 gap-3">
						<div
							class="group relative overflow-hidden rounded-xl border border-indigo-100 bg-white p-4 transition-all hover:shadow-md dark:border-indigo-800/30 dark:bg-slate-800/50"
						>
							<div
								class="absolute inset-0 bg-linear-to-br from-indigo-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-indigo-900/20"
							></div>
							<div class="relative flex items-center gap-3">
								<div class="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-800/40">
									<Users class="size-5 text-indigo-600 dark:text-indigo-400" />
								</div>
								<div>
									<span
										class="text-[10px] font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300"
									>
										Labor Force
									</span>
									<p class="text-2xl font-bold text-slate-900 dark:text-white">
										{sitio.laborForceCount.toLocaleString()}
									</p>
								</div>
							</div>
						</div>

						<div
							class="group relative overflow-hidden rounded-xl border border-teal-100 bg-white p-4 transition-all hover:shadow-md dark:border-teal-800/30 dark:bg-slate-800/50"
						>
							<div
								class="absolute inset-0 bg-linear-to-br from-teal-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-teal-900/20"
							></div>
							<div class="relative flex items-center gap-3">
								<div class="rounded-xl bg-teal-100 p-2.5 dark:bg-teal-800/40">
									<Briefcase class="size-5 text-teal-600 dark:text-teal-400" />
								</div>
								<div>
									<span
										class="text-[10px] font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300"
									>
										Total Workers
									</span>
									<p class="text-2xl font-bold text-slate-900 dark:text-white">
										{totalWorkers.toLocaleString()}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Worker Classification Section -->
					<div
						class="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<HandCoins class="size-4 text-slate-500" />
								<h4 class="text-sm font-semibold text-slate-900 dark:text-white">
									Worker Classification
								</h4>
							</div>
							<HelpTooltip side="left">
								Distribution of workers by employment type. Click on each category to learn more.
							</HelpTooltip>
						</div>

						<div class="flex flex-col gap-5 lg:flex-row lg:items-start">
							<!-- Donut Chart -->
							<div class="flex shrink-0 justify-center lg:justify-start">
								<div class="relative w-40">
									<DonutChart
										data={workerClassData}
										centerLabel="Total"
										centerValue={totalWorkers.toLocaleString()}
										height={160}
										showLegend={false}
									/>
								</div>
							</div>

							<!-- Worker Class Grid with Descriptions -->
							<div class="grid flex-1 grid-cols-2 gap-2 md:grid-cols-3">
								{#each workerClassWithPercent as worker}
									{@const WorkerIcon = worker.icon}
									<Popover.Root>
										<Popover.Trigger>
											<div
												class="group relative flex h-full cursor-pointer flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-600"
											>
												<div class="flex items-center gap-2">
													<div
														class="size-2.5 shrink-0 rounded-full"
														style="background-color: {worker.color}"
													></div>
													<span
														class="truncate text-xs font-medium text-slate-700 dark:text-slate-300"
													>
														{worker.label}
													</span>
													<Info
														class="ml-auto size-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
													/>
												</div>
												<div class="flex items-baseline gap-1">
													<span class="text-xl font-bold text-slate-900 dark:text-white">
														{worker.value}
													</span>
													<span class="text-xs text-muted-foreground">
														({worker.percent}%)
													</span>
												</div>
											</div>
										</Popover.Trigger>
										<Popover.Content class="w-72" side="top">
											<div class="flex flex-col gap-3">
												<div class="flex items-center gap-2">
													<div class="rounded-lg p-1.5" style="background-color: {worker.color}20">
														<WorkerIcon class="size-4" style="color: {worker.color}" />
													</div>
													<div>
														<h4 class="text-sm font-semibold text-slate-900 dark:text-white">
															{worker.fullLabel}
														</h4>
														<p class="text-xs text-muted-foreground">
															{worker.value} workers ({worker.percent}%)
														</p>
													</div>
												</div>
												<p class="text-xs leading-relaxed text-muted-foreground">
													{worker.description}
												</p>
											</div>
										</Popover.Content>
									</Popover.Root>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Agriculture Card -->
		<InfoCard
			title="Agriculture"
			description="Farming activities, crops, and livestock"
			icon={Wheat}
			iconBgColor="bg-amber-50 dark:bg-amber-900/20"
			iconTextColor="text-amber-500"
		>
			{#snippet children()}
				<div class="flex flex-col gap-6">
					<!-- Stats Row -->
					<div class="grid grid-cols-3 gap-3">
						{#each agricultureStats as stat}
							<div
								class="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 text-center transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50"
							>
								<div
									class="absolute inset-0 bg-linear-to-br from-transparent to-slate-50/50 opacity-0 transition-opacity group-hover:opacity-100 dark:to-slate-700/20"
								></div>
								<div class="relative">
									<div
										class="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl {stat.color}/10"
									>
										<stat.icon class="size-5 {stat.color.replace('bg-', 'text-')}" />
									</div>
									<p class="text-2xl font-bold text-slate-900 dark:text-white">
										{stat.value.toLocaleString()}
									</p>
									<p class="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
								</div>
							</div>
						{/each}
					</div>

					<!-- Crops & Livestock Grid -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<!-- Major Crops -->
						<div
							class="rounded-xl border border-green-100 bg-linear-to-br from-green-50/80 to-emerald-50/50 p-4 dark:border-green-800/30 dark:from-green-900/15 dark:to-emerald-900/10"
						>
							<div class="mb-3 flex items-center gap-2">
								<div class="rounded-lg bg-green-100 p-1.5 dark:bg-green-800/40">
									<Leaf class="size-4 text-green-600 dark:text-green-400" />
								</div>
								<h4 class="text-sm font-semibold text-slate-900 dark:text-white">Major Crops</h4>
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each sitio.crops as crop}
									<Badge
										variant="outline"
										class="border-green-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-green-700 shadow-sm dark:border-green-600/30 dark:bg-green-900/30 dark:text-green-300"
									>
										<Sprout class="mr-1 size-3" />
										{crop}
									</Badge>
								{/each}
								{#if sitio.crops.length === 0}
									<span class="text-sm text-muted-foreground italic">No crops reported</span>
								{/if}
							</div>
						</div>

						<!-- Livestock -->
						<div
							class="rounded-xl border border-amber-100 bg-linear-to-br from-amber-50/80 to-orange-50/50 p-4 dark:border-amber-800/30 dark:from-amber-900/15 dark:to-orange-900/10"
						>
							<div class="mb-3 flex items-center gap-2">
								<div class="rounded-lg bg-amber-100 p-1.5 dark:bg-amber-800/40">
									<Bird class="size-4 text-amber-600 dark:text-amber-400" />
								</div>
								<h4 class="text-sm font-semibold text-slate-900 dark:text-white">Livestock</h4>
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each sitio.livestock as animal}
									<Badge
										variant="outline"
										class="border-amber-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-700 shadow-sm dark:border-amber-600/30 dark:bg-amber-900/30 dark:text-amber-300"
									>
										{animal}
									</Badge>
								{/each}
								{#if sitio.livestock.length === 0}
									<span class="text-sm text-muted-foreground italic">No livestock reported</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>
	</div>

	<!-- Right Column: Sidebar (1/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-1">
		<!-- Food Security Card -->
		<InfoCard
			title="Food Security"
			description="Household food sufficiency status"
			icon={Utensils}
			iconBgColor="bg-orange-50 dark:bg-orange-900/20"
			iconTextColor="text-orange-500"
		>
			{#snippet children()}
				<div class="flex flex-col gap-3">
					{#each foodSecurityConfig() as status}
						{@const StatusIcon = status.icon}
						<div
							class="relative overflow-hidden rounded-xl border p-4 transition-all {status.isActive
								? status.bgClass + ' shadow-sm'
								: 'border-slate-200 bg-slate-50/50 opacity-40 dark:border-slate-700 dark:bg-slate-800/30'}"
						>
							{#if status.isActive && status.key === 'secure'}
								<div
									class="absolute -top-2 -right-2 size-16 rounded-full bg-emerald-200/40 blur-xl dark:bg-emerald-500/10"
								></div>
							{:else if status.isActive && status.key === 'seasonal_scarcity'}
								<div
									class="absolute -top-2 -right-2 size-16 rounded-full bg-amber-200/40 blur-xl dark:bg-amber-500/10"
								></div>
							{:else if status.isActive && status.key === 'critical_shortage'}
								<div
									class="absolute -top-2 -right-2 size-16 rounded-full bg-red-200/40 blur-xl dark:bg-red-500/10"
								></div>
							{/if}
							<div class="relative flex items-start gap-3">
								<div
									class="rounded-lg p-1.5 {status.isActive
										? status.key === 'secure'
											? 'bg-emerald-100 dark:bg-emerald-800/40'
											: status.key === 'seasonal_scarcity'
												? 'bg-amber-100 dark:bg-amber-800/40'
												: 'bg-red-100 dark:bg-red-800/40'
										: 'bg-slate-100 dark:bg-slate-700/50'}"
								>
									<StatusIcon
										class="size-4 {status.isActive
											? status.key === 'secure'
												? 'text-emerald-600 dark:text-emerald-400'
												: status.key === 'seasonal_scarcity'
													? 'text-amber-600 dark:text-amber-400'
													: 'text-red-600 dark:text-red-400'
											: 'text-slate-400 dark:text-slate-500'}"
									/>
								</div>
								<div class="flex-1">
									<span
										class="text-sm font-semibold {status.isActive
											? 'text-slate-900 dark:text-white'
											: 'text-slate-500 dark:text-slate-500'}"
									>
										{status.label}
									</span>
									{#if status.isActive}
										<p class="mt-0.5 text-xs text-muted-foreground">{status.description}</p>
									{/if}
								</div>
								{#if status.isActive}
									<div
										class="rounded-full p-0.5 {status.key === 'secure'
											? 'bg-emerald-100 dark:bg-emerald-800/40'
											: status.key === 'seasonal_scarcity'
												? 'bg-amber-100 dark:bg-amber-800/40'
												: 'bg-red-100 dark:bg-red-800/40'}"
									>
										<CheckCircle2
											class="size-4 {status.key === 'secure'
												? 'text-emerald-600 dark:text-emerald-400'
												: status.key === 'seasonal_scarcity'
													? 'text-amber-600 dark:text-amber-400'
													: 'text-red-600 dark:text-red-400'}"
										/>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Hazards Card -->
		<InfoCard
			title="Natural Hazards"
			description="Incidents in the past 12 months"
			icon={AlertTriangle}
			iconBgColor="bg-red-50 dark:bg-red-900/20"
			iconTextColor="text-red-500"
		>
			{#snippet children()}
				{#if hasHazards}
					<div class="flex flex-col gap-3">
						{#each hazardsList as hazard}
							{@const HazardIcon = hazard.icon}
							{#if hazard.frequency > 0}
								<div
									class="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50"
								>
									<div
										class="rounded-lg p-2 {hazard.name === 'Flood'
											? 'bg-blue-100 dark:bg-blue-800/30'
											: hazard.name === 'Landslide'
												? 'bg-amber-100 dark:bg-amber-800/30'
												: hazard.name === 'Drought'
													? 'bg-orange-100 dark:bg-orange-800/30'
													: 'bg-red-100 dark:bg-red-800/30'}"
									>
										<HazardIcon
											class="size-4 {hazard.name === 'Flood'
												? 'text-blue-600 dark:text-blue-400'
												: hazard.name === 'Landslide'
													? 'text-amber-600 dark:text-amber-400'
													: hazard.name === 'Drought'
														? 'text-orange-600 dark:text-orange-400'
														: 'text-red-600 dark:text-red-400'}"
										/>
									</div>
									<div class="flex-1">
										<span class="text-sm font-medium text-slate-900 dark:text-white">
											{hazard.name}
										</span>
									</div>
									<div class="text-right">
										<span class="text-lg font-bold text-slate-900 dark:text-white">
											{hazard.frequency}
										</span>
										<span class="ml-1 text-xs text-muted-foreground">
											{hazard.frequency === 1 ? 'time' : 'times'}
										</span>
									</div>
								</div>
							{/if}
						{/each}

						<!-- Total Summary -->
						<div
							class="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80"
						>
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium text-muted-foreground uppercase"
									>Total Incidents</span
								>
								<span class="text-lg font-bold text-slate-900 dark:text-white">
									{totalHazardFrequency}
								</span>
							</div>
						</div>
					</div>
				{:else}
					<div
						class="flex flex-col items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/50 py-8 text-center dark:border-emerald-800/30 dark:bg-emerald-900/10"
					>
						<div class="rounded-full bg-emerald-100 p-3 dark:bg-emerald-800/40">
							<CheckCircle2 class="size-6 text-emerald-600 dark:text-emerald-400" />
						</div>
						<p class="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
							No Hazard Incidents
						</p>
						<p class="mt-1 text-xs text-muted-foreground">Past 12 months</p>
					</div>
				{/if}
			{/snippet}
		</InfoCard>

		<!-- Peace & Order Card removed -->
	</div>
</div>
