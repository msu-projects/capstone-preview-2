<script lang="ts">
	import SitioMap from '$lib/components/sitios/SitioMap.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioProfile } from '$lib/types';
	import {
		AlertCircle,
		Building2,
		Car,
		CheckCircle2,
		Footprints,
		MapPin,
		Milestone,
		Ship
	} from '@lucide/svelte';

	interface Props {
		sitio: SitioProfile;
	}

	const { sitio }: Props = $props();

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

	// Classification data
	const classifications = $derived([
		{
			label: 'GIDA Area',
			description: 'Geographically Isolated',
			value: sitio.sitioClassification.gida,
			badgeText: sitio.sitioClassification.gida ? 'Yes' : 'No',
			badgeVariant: sitio.sitioClassification.gida ? 'destructive' : 'secondary'
		},
		{
			label: 'IP Community',
			description: 'Indigenous People',
			value: sitio.sitioClassification.indigenous,
			badgeText: sitio.sitioClassification.indigenous ? 'Yes' : 'No',
			badgeVariant: sitio.sitioClassification.indigenous ? 'default' : 'secondary'
		},
		{
			label: 'Conflict',
			description: 'Conflict status',
			value: !sitio.sitioClassification.conflict,
			badgeText: sitio.sitioClassification.conflict ? 'Affected' : 'Cleared',
			badgeVariant: sitio.sitioClassification.conflict ? 'destructive' : 'default'
		}
	] as const);
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Column: Map (2/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-2">
		<InfoCard
			title="Location Map"
			description="Geographic Coordinates and Overview"
			icon={MapPin}
			iconBgColor="bg-primary/10"
			iconTextColor="text-primary"
			headerBgColor="bg-card"
			noPadding
			class="overflow-hidden"
			headerClass="pb-4"
		>
			{#snippet children()}
				{#if sitio.latitude && sitio.longitude}
					<div class="absolute top-6 right-6 z-10">
						<div
							class="flex items-center gap-2 rounded-full border bg-white/90 px-3 py-1.5 font-mono text-xs text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300"
						>
							<MapPin class="size-3.5" />
							<span>{sitio.latitude.toFixed(4)}° N, {sitio.longitude.toFixed(4)}° E</span>
						</div>
					</div>
				{/if}
				<div class="relative h-150 w-full overflow-hidden">
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

	<!-- Right Column: Details (1/3 width) -->
	<div class="flex flex-col gap-6">
		<!-- Location Details Card -->
		<InfoCard
			title="Location Details"
			description="Administrative and Identifying Information"
			icon={Building2}
			iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
			iconTextColor="text-indigo-600 dark:text-indigo-400"
			headerClass="pb-4"
			contentPadding="p-5"
		>
			{#snippet children()}
				<div class="space-y-3">
					<div
						class="flex items-center justify-between rounded-lg bg-slate-50/50 p-2.5 dark:bg-slate-800/30"
					>
						<span class="text-sm text-muted-foreground">Municipality</span>
						<span class="text-sm font-semibold text-foreground">{sitio.municipality}</span>
					</div>
					<div
						class="flex items-center justify-between rounded-lg bg-slate-50/50 p-2.5 dark:bg-slate-800/30"
					>
						<span class="text-sm text-muted-foreground">Barangay</span>
						<span class="text-sm font-semibold text-foreground">{sitio.barangay}</span>
					</div>
					<div
						class="flex items-center justify-between rounded-lg bg-slate-50/50 p-2.5 dark:bg-slate-800/30"
					>
						<span class="text-sm text-muted-foreground">Province</span>
						<span class="text-sm font-semibold text-foreground">South Cotabato</span>
					</div>
					{#if sitio.sitioCode}
						<div
							class="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700"
						>
							<span class="text-sm text-muted-foreground">Sitio Code</span>
							<code
								class="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary dark:bg-primary/20"
							>
								{sitio.sitioCode}
							</code>
						</div>
					{/if}
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
			headerClass="pb-4"
			contentPadding="py-5"
		>
			{#snippet children()}
				<div class="grid grid-cols-2 gap-3">
					{#each accessModes as mode}
						{@const Icon = mode.icon}
						<div
							class="flex items-start gap-2.5 rounded-lg border p-2.5 transition-all {mode.enabled
								? 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5'
								: 'border-slate-100 bg-slate-50/50 opacity-50 dark:border-slate-700 dark:bg-slate-800/30'}"
							title={mode.title}
						>
							<div
								class="rounded-md p-1.5 {mode.enabled
									? 'bg-blue-100 dark:bg-blue-500/20'
									: 'bg-slate-200 dark:bg-slate-700'}"
							>
								<Icon
									class="size-3.5 {mode.enabled
										? 'text-blue-600 dark:text-blue-400'
										: 'text-slate-400'}"
								/>
							</div>
							<div class="flex flex-col">
								<span class="text-xs font-medium text-foreground">{mode.label}</span>
								<span class="text-[10px] leading-tight text-muted-foreground">
									{mode.description}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Sitio Classification Card -->
		<InfoCard
			title="Sitio Classification"
			description="Designations for area status"
			icon={CheckCircle2}
			iconBgColor="bg-slate-100 dark:bg-slate-500/10"
			iconTextColor="text-slate-600 dark:text-slate-400"
			headerClass="pb-4"
			contentPadding="py-5"
		>
			{#snippet children()}
				<div class="space-y-2.5">
					{#each classifications as classification}
						<div
							class="group relative flex items-center justify-between rounded-lg border bg-slate-50/80 p-3 transition-all hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
						>
							<div class="flex flex-col">
								<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
									{classification.label}
								</span>
								<span class="text-[10px] leading-tight text-muted-foreground">
									{classification.description}
								</span>
							</div>
							<Badge
								variant={classification.badgeVariant}
								class="ml-2 shrink-0 gap-1.5 text-xs font-semibold"
							>
								{#if classification.value}
									<span class="size-1.5 rounded-full bg-current"></span>
								{:else}
									<AlertCircle class="size-3" />
								{/if}
								{classification.badgeText}
							</Badge>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>
	</div>
</div>
