<script lang="ts">
	import SitioMap from '$lib/components/sitios/SitioMap.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioProfile } from '$lib/types';
	import {
		AlertTriangle,
		ArrowRight,
		Car,
		CheckCircle2,
		Droplets,
		Footprints,
		Globe,
		Landmark,
		MapPin,
		Milestone,
		ShieldAlert,
		ShieldCheck,
		Ship,
		Signal,
		Sparkles,
		Users,
		Wifi,
		Zap
	} from '@lucide/svelte';

	interface Props {
		sitio: SitioProfile;
		changeTab: (
			tab: 'overview' | 'demographics' | 'infrastructure' | 'economy' | 'assessment'
		) => void;
	}

	const { sitio, changeTab }: Props = $props();

	// Access mode configurations
	const accessModes = $derived([
		{
			icon: Car,
			label: 'Paved',
			description: 'Standard road access',
			enabled: sitio.mainAccess.pavedRoad,
			title: 'Access to the sitio is primarily via paved roads'
		},
		{
			icon: Milestone,
			label: 'Unpaved',
			description: 'Dirt/Rough roads',
			enabled: sitio.mainAccess.unpavedRoad,
			title: 'Access to the sitio is via unpaved or dirt roads'
		},
		{
			icon: Footprints,
			label: 'Footpath',
			description: 'Walking trails only',
			enabled: sitio.mainAccess.footpath,
			title: 'Access is limited to footpaths or trails'
		},
		{
			icon: Ship,
			label: 'Boat',
			description: 'Waterway access',
			enabled: sitio.mainAccess.boat,
			title: 'Access is primarily via water transportation'
		}
	]);

	// Classification data with icons
	const classificationItems = $derived([
		{
			label: 'GIDA Status',
			description: 'Geographically Isolated and Disadvantaged Area',
			active: sitio.sitioClassification.gida,
			activeIcon: AlertTriangle,
			inactiveIcon: CheckCircle2,
			activeColor: 'text-amber-600 dark:text-amber-400',
			activeBg: 'bg-amber-50 dark:bg-amber-500/10',
			activeBorder: 'border-amber-200 dark:border-amber-500/30'
		},
		{
			label: 'Indigenous Community',
			description: 'Indigenous Peoples (IP) Area',
			active: sitio.sitioClassification.indigenous,
			activeIcon: Users,
			inactiveIcon: Users,
			activeColor: 'text-emerald-600 dark:text-emerald-400',
			activeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
			activeBorder: 'border-emerald-200 dark:border-emerald-500/30'
		},
		{
			label: 'Conflict-Affected',
			description: 'Conflict-affected area',
			active: !sitio.sitioClassification.conflict,
			activeIcon: ShieldCheck,
			inactiveIcon: ShieldAlert,
			activeColor: 'text-blue-600 dark:text-blue-400',
			activeBg: 'bg-blue-50 dark:bg-blue-500/10',
			activeBorder: 'border-blue-200 dark:border-blue-500/30',
			invertedLogic: true
		}
	]);

	// Calculate key highlights
	const electricityRate = $derived(
		sitio.totalHouseholds > 0
			? Math.round((sitio.householdsWithElectricity / sitio.totalHouseholds) * 100)
			: 0
	);

	const internetRate = $derived(
		sitio.totalHouseholds > 0
			? Math.round((sitio.householdsWithInternet / sitio.totalHouseholds) * 100)
			: 0
	);

	const sanitationRate = $derived(
		sitio.totalHouseholds > 0
			? Math.round((sitio.householdsWithToilet / sitio.totalHouseholds) * 100)
			: 0
	);

	// Mobile signal display
	const signalDisplay = $derived(
		{
			none: { label: 'No Signal', color: 'text-red-500' },
			'2g': { label: '2G', color: 'text-orange-500' },
			'3g': { label: '3G', color: 'text-yellow-500' },
			'4g': { label: '4G LTE', color: 'text-emerald-500' },
			'5g': { label: '5G', color: 'text-blue-500' }
		}[sitio.mobileSignal] || { label: 'Unknown', color: 'text-slate-400' }
	);

	// Quick facts for the snapshot
	const quickFacts = $derived([
		{
			icon: Zap,
			label: 'Electricity',
			value: `${electricityRate}%`,
			subtext: 'of households',
			color: 'text-yellow-500'
		},
		{
			icon: Wifi,
			label: 'Internet',
			value: `${internetRate}%`,
			subtext: 'connectivity',
			color: 'text-blue-500'
		},
		{
			icon: Droplets,
			label: 'Sanitation',
			value: `${sanitationRate}%`,
			subtext: 'with toilets',
			color: 'text-cyan-500'
		},
		{
			icon: Signal,
			label: 'Mobile Signal',
			value: signalDisplay.label,
			subtext: 'best available',
			color: signalDisplay.color
		}
	]);

	// Food security status
	const foodSecurityStatus = $derived(
		{
			secure: {
				label: 'Secure',
				color: 'text-emerald-600 dark:text-emerald-400',
				bg: 'bg-emerald-50 dark:bg-emerald-500/10'
			},
			seasonal_scarcity: {
				label: 'Seasonal Scarcity',
				color: 'text-amber-600 dark:text-amber-400',
				bg: 'bg-amber-50 dark:bg-amber-500/10'
			},
			critical_shortage: {
				label: 'Critical Shortage',
				color: 'text-red-600 dark:text-red-400',
				bg: 'bg-red-50 dark:bg-red-500/10'
			}
		}[sitio.foodSecurity] || {
			label: 'Unknown',
			color: 'text-slate-500',
			bg: 'bg-slate-50 dark:bg-slate-500/10'
		}
	);
</script>

<div class="space-y-6">
	<!-- Top Row: Map + Community Snapshot -->
	<div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
		<!-- Map Section (2/3 width on xl) -->
		<div class="xl:col-span-2">
			<InfoCard
				title="Location Map"
				description="Geographic location and coordinates"
				icon={MapPin}
				iconBgColor="bg-primary/10"
				iconTextColor="text-primary"
				headerBgColor="bg-card"
				class="h-full overflow-hidden"
				headerClass="pb-4"
				contentPadding="h-full p-0"
			>
				{#snippet children()}
					{#if sitio.latitude && sitio.longitude}
						<div class="absolute top-6 right-6 z-10">
							<div
								class="flex items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 font-mono text-xs text-slate-600 shadow-md backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95 dark:text-slate-300"
							>
								<MapPin class="size-3.5 text-primary" />
								<span>{sitio.latitude.toFixed(4)}° N, {sitio.longitude.toFixed(4)}° E</span>
							</div>
						</div>
					{/if}
					<div class="relative h-full w-full overflow-hidden">
						<SitioMap
							latitude={sitio.latitude}
							longitude={sitio.longitude}
							sitioName={sitio.sitioName}
							height="100%"
						/>
					</div>
				{/snippet}
			</InfoCard>
		</div>

		<!-- Community Snapshot (1/3 width on xl) -->
		<div class="flex flex-col gap-6">
			<!-- Location Info Card -->
			<InfoCard
				title="Administrative Location"
				description="Official geographic and administrative boundaries"
				icon={Landmark}
				iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
				iconTextColor="text-indigo-600 dark:text-indigo-400"
				headerClass="pb-3"
				contentPadding="p-4"
				class="flex-1"
			>
				{#snippet children()}
					<div class="space-y-2">
						<div
							class="flex items-center justify-between rounded-lg bg-linear-to-r from-slate-50 to-transparent p-2.5 dark:from-slate-800/50"
						>
							<span class="text-sm text-muted-foreground">Province</span>
							<span class="text-sm font-semibold text-foreground">South Cotabato</span>
						</div>
						<div
							class="flex items-center justify-between rounded-lg bg-linear-to-r from-slate-50 to-transparent p-2.5 dark:from-slate-800/50"
						>
							<span class="text-sm text-muted-foreground">Municipality</span>
							<span class="text-sm font-semibold text-foreground">{sitio.municipality}</span>
						</div>
						<div
							class="flex items-center justify-between rounded-lg bg-linear-to-r from-slate-50 to-transparent p-2.5 dark:from-slate-800/50"
						>
							<span class="text-sm text-muted-foreground">Barangay</span>
							<span class="text-sm font-semibold text-foreground">{sitio.barangay}</span>
						</div>
						{#if sitio.sitioCode}
							<div
								class="flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5 dark:border-slate-700"
							>
								<span class="text-sm text-muted-foreground">Sitio Code</span>
								<code
									class="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary dark:bg-primary/20"
								>
									{sitio.sitioCode}
								</code>
							</div>
						{/if}
					</div>
				{/snippet}
			</InfoCard>

			<!-- Quick Utilities Overview -->
			<InfoCard
				title="Utilities at a Glance"
				description="Key infrastructure and connectivity metrics"
				icon={Sparkles}
				iconBgColor="bg-violet-50 dark:bg-violet-500/10"
				iconTextColor="text-violet-600 dark:text-violet-400"
				headerClass="pb-3"
				contentPadding="p-4"
				class="flex-1"
			>
				{#snippet children()}
					<div class="space-y-3">
						<div class="grid grid-cols-2 gap-3">
							{#each quickFacts as fact}
								{@const Icon = fact.icon}
								<div
									class="group rounded-xl border border-slate-100 bg-linear-to-br from-slate-50/80 to-white p-3 transition-all hover:shadow-sm dark:border-slate-700/50 dark:from-slate-800/50 dark:to-slate-800/30"
								>
									<div class="flex items-start gap-2">
										<div class="rounded-lg bg-white p-1.5 shadow-sm dark:bg-slate-700">
											<Icon class="size-4 {fact.color}" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-xs text-muted-foreground">{fact.label}</p>
											<p class="text-lg leading-tight font-bold text-foreground">{fact.value}</p>
											<p class="truncate text-[10px] text-muted-foreground">{fact.subtext}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
						<Button
							variant="outline"
							size="sm"
							class="w-full gap-2"
							onclick={() => {
								changeTab('infrastructure');
								scrollTo({ top: 450 });
							}}
						>
							View Full Infrastructure Details
							<ArrowRight class="size-3.5" />
						</Button>
					</div>
				{/snippet}
			</InfoCard>
		</div>
	</div>

	<!-- Bottom Row: Classification, Status, and Access -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
		<!-- Sitio Classification Card - Redesigned -->
		<InfoCard
			title="Sitio Classification"
			description="Special area designations"
			icon={Globe}
			iconBgColor="bg-slate-100 dark:bg-slate-500/10"
			iconTextColor="text-slate-600 dark:text-slate-400"
			headerClass="pb-3"
			contentPadding="p-4"
			class="col-span-2"
		>
			{#snippet children()}
				<div class="space-y-3">
					{#each classificationItems as item}
						{@const ActiveIcon = item.activeIcon}
						{@const InactiveIcon = item.inactiveIcon}
						{@const isActive = item.invertedLogic ? item.active : item.active}
						{@const showWarning = item.invertedLogic ? !item.active : item.active}
						<div
							class="group relative flex items-center gap-3 rounded-xl border p-3 transition-all {showWarning &&
							!item.invertedLogic
								? `${item.activeBorder} ${item.activeBg}`
								: item.invertedLogic && isActive
									? `${item.activeBorder} ${item.activeBg}`
									: 'border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30'}"
						>
							<div
								class="shrink-0 rounded-lg p-2 {showWarning && !item.invertedLogic
									? item.activeBg
									: item.invertedLogic && isActive
										? item.activeBg
										: 'bg-slate-100 dark:bg-slate-700'}"
							>
								{#if item.invertedLogic}
									{#if isActive}
										<ActiveIcon class="size-4 {item.activeColor}" />
									{:else}
										<InactiveIcon class="size-4 text-red-500" />
									{/if}
								{:else if item.active}
									<ActiveIcon class="size-4 {item.activeColor}" />
								{:else}
									<InactiveIcon class="size-4 text-slate-400 dark:text-slate-500" />
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-foreground">{item.label}</p>
								<p class="truncate text-xs text-muted-foreground">{item.description}</p>
							</div>
							<Badge
								variant={item.invertedLogic
									? isActive
										? 'default'
										: 'destructive'
									: item.active
										? 'secondary'
										: 'outline'}
								class="shrink-0"
							>
								{#if item.invertedLogic}
									{isActive ? 'No' : 'Yes'}
								{:else}
									{item.active ? 'Yes' : 'No'}
								{/if}
							</Badge>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Main Access Modes Card -->
		<InfoCard
			title="Main Access Modes"
			description="Primary transportation methods"
			icon={Car}
			iconBgColor="bg-blue-50 dark:bg-blue-500/10"
			iconTextColor="text-blue-600 dark:text-blue-400"
			headerClass="pb-3"
			contentPadding="p-4"
		>
			{#snippet children()}
				<div class="space-y-1.5">
					{#each accessModes as mode}
						{@const Icon = mode.icon}
						<div
							class="group relative flex items-center gap-3 rounded-xl border p-2 transition-all {mode.enabled
								? 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5'
								: 'border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30'}"
							title={mode.title}
						>
							<div
								class="shrink-0 rounded-lg p-2 {mode.enabled
									? 'bg-blue-100 dark:bg-blue-500/20'
									: 'bg-slate-200 dark:bg-slate-700'}"
							>
								<Icon
									class="size-4 {mode.enabled
										? 'text-blue-600 dark:text-blue-400'
										: 'text-slate-400'}"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-foreground">{mode.label}</p>
								<p class="truncate text-xs text-muted-foreground">{mode.description}</p>
							</div>
							<Badge variant={mode.enabled ? 'default' : 'outline'} class="shrink-0">
								{mode.enabled ? 'Available' : 'N/A'}
							</Badge>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>
	</div>
</div>
