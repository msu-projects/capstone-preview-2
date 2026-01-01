<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioProfile } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import {
		AlertTriangle,
		Bird,
		Briefcase,
		CheckCircle2,
		CircleDollarSign,
		Leaf,
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

	// Worker class distribution data for bar chart
	const workerClassData = $derived([
		{ label: 'Priv. HH', value: sitio.workerClass.privateHousehold },
		{ label: 'Priv. Est', value: sitio.workerClass.privateEstablishment },
		{ label: 'Govt', value: sitio.workerClass.government },
		{ label: 'Self-Emp', value: sitio.workerClass.selfEmployed },
		{ label: 'Employer', value: sitio.workerClass.employer },
		{ label: 'OFW', value: sitio.workerClass.ofw }
	]);

	// Food security status configuration
	const foodSecurityConfig = $derived(() => {
		const configs = {
			secure: {
				label: 'None / Food Secure',
				active: true,
				variant: 'default' as const,
				bgClass: 'border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/10'
			},
			seasonal_scarcity: {
				label: 'Seasonal Scarcity',
				active: true,
				variant: 'secondary' as const,
				bgClass: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800/30 dark:bg-yellow-900/10'
			},
			critical_shortage: {
				label: 'Chronic / Critical Shortage',
				active: true,
				variant: 'destructive' as const,
				bgClass: 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10'
			}
		};

		return Object.entries(configs).map(([key, config]) => ({
			...config,
			isActive: sitio.foodSecurity === key
		}));
	});

	// Hazards data
	const hazardsList = $derived([
		{ name: 'Flood', frequency: sitio.hazards.flood.frequency || '0' },
		{ name: 'Landslide', frequency: sitio.hazards.landslide.frequency || '0' },
		{ name: 'Drought', frequency: sitio.hazards.drought.frequency || '0' },
		{ name: 'Earthquake', frequency: sitio.hazards.earthquake.frequency || '0' }
	]);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Column: Main Content (2/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-2">
		<!-- Labor & Income Card -->
		<InfoCard
			title="Labor & Income"
			description="Employment classification and income levels"
			icon={Briefcase}
			iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
			iconTextColor="text-emerald-500"
		>
			{#snippet children()}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Income Stats -->
					<div class="flex flex-col gap-3">
						<!-- Average Daily Income -->
						<div
							class="flex flex-1 flex-col items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-center transition-all hover:shadow-sm dark:border-emerald-800/30 dark:bg-emerald-900/10"
						>
							<span
								class="text-xs font-medium tracking-wide text-emerald-800 uppercase dark:text-emerald-300"
							>
								Avg. Daily Income
							</span>
							<span class="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
								{formatCurrency(sitio.averageDailyIncome)}
							</span>
							<span class="mt-0.5 text-xs text-emerald-700/70 dark:text-emerald-400/70">
								Per household head
							</span>
						</div>

						<!-- Labor Force Total -->
						<div
							class="flex flex-1 flex-col items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50/80 p-4 text-center transition-all hover:shadow-sm dark:border-indigo-800/30 dark:bg-indigo-900/10"
						>
							<span
								class="text-xs font-medium tracking-wide text-indigo-800 uppercase dark:text-indigo-300"
							>
								Labor Force
							</span>
							<span class="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
								{sitio.laborForceCount.toLocaleString()}
							</span>
							<span class="mt-0.5 text-xs text-indigo-700/70 dark:text-indigo-400/70">
								Total Individuals
							</span>
						</div>
					</div>

					<!-- Worker Class Distribution Chart -->
					<div class="flex flex-col gap-3">
						<h4 class="text-sm font-medium text-slate-900 dark:text-white">
							Worker Class Distribution
						</h4>
						<div class="h-48">
							<BarChart
								data={workerClassData}
								orientation="vertical"
								height={230}
								showGrid={false}
								rotateAlways
							/>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Agriculture Card -->
		<InfoCard
			title="Agriculture"
			description="Farming activities and resources"
			icon={Wheat}
			iconBgColor="bg-amber-50 dark:bg-amber-900/20"
			iconTextColor="text-amber-500"
		>
			{#snippet children()}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Agriculture Stats -->
					<div class="grid grid-cols-3 gap-3">
						<div
							class="flex flex-col items-center rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-center transition-all hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
						>
							<span class="text-xl font-bold text-slate-900 dark:text-white">
								{sitio.agriculture.numberOfFarmers}
							</span>
							<span class="text-xs text-muted-foreground">Farmers</span>
						</div>
						<div
							class="flex flex-col items-center rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-center transition-all hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
						>
							<span class="text-xl font-bold text-slate-900 dark:text-white">
								{sitio.agriculture.numberOfAssociations}
							</span>
							<span class="text-xs text-muted-foreground">Associations</span>
						</div>
						<div
							class="flex flex-col items-center rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-center transition-all hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
						>
							<span class="text-xl font-bold text-slate-900 dark:text-white">
								{sitio.agriculture.estimatedFarmAreaHectares}
							</span>
							<span class="text-xs text-muted-foreground">Hectares</span>
						</div>
					</div>

					<div class="space-y-4">
						<!-- Major Crops -->
						<div>
							<div class="mb-2 flex items-center gap-2">
								<Leaf class="size-3.5 text-green-600" />
								<h4 class="text-sm font-medium text-slate-900 dark:text-white">Major Crops</h4>
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each sitio.crops as crop}
									<Badge
										variant="outline"
										class="border-green-100 bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
									>
										{crop}
									</Badge>
								{/each}
								{#if sitio.crops.length === 0}
									<span class="text-sm text-muted-foreground">No crops reported</span>
								{/if}
							</div>
						</div>

						<!-- Livestock -->
						<div>
							<div class="mb-2 flex items-center gap-2">
								<Bird class="size-3.5 text-amber-600" />
								<h4 class="text-sm font-medium text-slate-900 dark:text-white">Livestock</h4>
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each sitio.livestock as animal}
									<Badge
										variant="outline"
										class="border-amber-100 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
									>
										{animal}
									</Badge>
								{/each}
								{#if sitio.livestock.length === 0}
									<span class="text-sm text-muted-foreground">No livestock reported</span>
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
			description="Household food sufficiency"
			icon={Utensils}
			iconBgColor="bg-orange-50 dark:bg-orange-900/20"
			iconTextColor="text-orange-500"
		>
			{#snippet children()}
				<div class="flex flex-col gap-2.5">
					{#each foodSecurityConfig() as status}
						<div
							class="flex items-center gap-3 rounded-lg border p-3 transition-all {status.isActive
								? status.bgClass
								: 'border-slate-200 bg-white opacity-50 dark:border-slate-700 dark:bg-slate-800'}"
						>
							{#if status.isActive}
								<CheckCircle2 class="size-4 text-green-600 dark:text-green-400" />
							{:else}
								<div
									class="size-4 rounded-full border-2 border-slate-300 dark:border-slate-600"
								></div>
							{/if}
							<span
								class="text-sm {status.isActive
									? 'font-medium text-slate-900 dark:text-white'
									: 'text-slate-600 dark:text-slate-400'}"
							>
								{status.label}
							</span>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Hazards Card -->
		<InfoCard
			title="Hazards"
			description="Susceptibility to natural risks (past 12 months)"
			icon={AlertTriangle}
			iconBgColor="bg-red-50 dark:bg-red-900/20"
			iconTextColor="text-red-500"
		>
			{#snippet children()}
				<div
					class="flex flex-col gap-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
				>
					<div
						class="grid grid-cols-3 bg-slate-50/80 p-3 text-[10px] font-semibold text-muted-foreground uppercase dark:bg-slate-800/50"
					>
						<div class="col-span-2">Hazard</div>
						<div class="col-span-1 text-right">Frequency</div>
					</div>
					{#each hazardsList as hazard, index}
						{@const frequency = parseInt(hazard.frequency) || 0}
						{#if frequency > 0}
							<div
								class="grid grid-cols-3 items-center border-t border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
							>
								<div class="col-span-2 text-sm font-medium text-slate-900 dark:text-white">
									{hazard.name}
								</div>
								<div
									class="col-span-1 text-right text-sm font-semibold text-slate-700 dark:text-slate-300"
								>
									{hazard.frequency}
								</div>
							</div>
						{/if}
					{/each}
					{#if hazardsList.every((h) => parseInt(h.frequency) === 0 || !h.frequency)}
						<div
							class="border-t border-slate-100 bg-white p-4 text-center text-sm text-muted-foreground dark:border-slate-800 dark:bg-slate-800/30"
						>
							No hazard incidents reported
						</div>
					{/if}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Peace & Order Card -->
		<InfoCard
			title="Peace & Order"
			description="Current community status"
			icon={CircleDollarSign}
			iconBgColor="bg-blue-50 dark:bg-blue-900/20"
			iconTextColor="text-blue-500"
		>
			{#snippet children()}
				<div class="flex items-center justify-center py-3">
					{#if sitio.peaceOrder === 'stable'}
						<Badge
							variant="outline"
							class="border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
						>
							<CheckCircle2 class="mr-2 size-4" />
							Stable
						</Badge>
					{:else if sitio.peaceOrder === 'occasional_tensions'}
						<Badge
							variant="outline"
							class="border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400"
						>
							<AlertTriangle class="mr-2 size-4" />
							Occasional Tensions
						</Badge>
					{:else}
						<Badge
							variant="outline"
							class="border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
						>
							<AlertTriangle class="mr-2 size-4" />
							Unstable
						</Badge>
					{/if}
				</div>
			{/snippet}
		</InfoCard>
	</div>
</div>
