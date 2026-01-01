<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import type { SitioProfile } from '$lib/types';
	import { formatNumber } from '$lib/utils/formatters';
	import { Calendar, Home, MapPin, TrendingUp, Users, Vote } from '@lucide/svelte';

	interface Props {
		sitio: SitioProfile;
	}

	const { sitio }: Props = $props();

	const avgHouseholdSize = $derived(
		sitio.totalHouseholds > 0 ? (sitio.totalPopulation / sitio.totalHouseholds).toFixed(1) : '0'
	);

	const voterPercentage = $derived(
		sitio.totalPopulation > 0
			? Math.round((sitio.registeredVoters / sitio.totalPopulation) * 100)
			: 0
	);

	const keyMetrics = $derived([
		{
			label: 'Total Population',
			value: formatNumber(sitio.totalPopulation),
			icon: Users,
			bgColor: 'bg-blue-50 dark:bg-blue-950/30',
			iconBgColor: 'bg-blue-50 dark:bg-blue-500/20',
			textColor: 'text-blue-600 dark:text-blue-400',
			trend: '+2.5% from last year'
		},
		{
			label: 'Total Households',
			value: formatNumber(sitio.totalHouseholds),
			icon: Home,
			bgColor: 'bg-orange-50 dark:bg-orange-950/30',
			iconBgColor: 'bg-orange-50 dark:bg-orange-500/20',
			textColor: 'text-orange-600 dark:text-orange-400',
			trend: '+1.2% growth'
		},
		{
			label: 'Avg. Household Size',
			value: avgHouseholdSize,
			icon: Users,
			bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
			iconBgColor: 'bg-indigo-50 dark:bg-indigo-500/20',
			textColor: 'text-indigo-600 dark:text-indigo-400',
			trend: 'Calculated Estimate',
			trendNeutral: true
		},
		{
			label: 'Total Voters',
			value: formatNumber(sitio.registeredVoters),
			icon: Vote,
			bgColor: 'bg-purple-50 dark:bg-purple-950/30',
			iconBgColor: 'bg-purple-50 dark:bg-purple-500/20',
			textColor: 'text-purple-600 dark:text-purple-400',
			trend: `${voterPercentage}% of Population`,
			trendPositive: true
		}
	]);
</script>

<!-- Header -->
<header class="relative overflow-hidden bg-white dark:bg-slate-900">
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30"
	></div>
	<div
		class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"
	></div>

	<!-- Accent Line -->
	<div
		class="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500"
	></div>

	<div class="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
			<!-- Left: Sitio Info -->
			<div class="flex-1 space-y-4">
				<!-- Location Badges -->
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant="secondary" class="gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100">
						<MapPin class="size-3" />
						{sitio.municipality}
					</Badge>
					<Badge variant="secondary" class="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
						{sitio.barangay}
					</Badge>
					{#if sitio.sitioCode}
						<Badge variant="outline" class="font-mono text-slate-500">
							Code: {sitio.sitioCode}
						</Badge>
					{/if}
				</div>

				<!-- Title & Need Score -->
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
					<!-- Title -->
					<div class="flex-1">
						<h1
							class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-slate-100"
						>
							{sitio.sitioName}
						</h1>
						<p class="mt-2 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
							Community profile for {sitio.sitioName}, Barangay {sitio.barangay}, {sitio.municipality}.
							South Cotabato Province.
						</p>
					</div>
				</div>

				<!-- Quick Info -->
				<div class="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
					<span class="flex items-center gap-1.5">
						<Calendar class="size-4" />
						Last updated: January 1, 2026
					</span>
					{#if sitio.latitude && sitio.longitude}
						<span class="flex items-center gap-1.5">
							<MapPin class="size-4" />
							{sitio.latitude.toFixed(4)}°N, {sitio.longitude.toFixed(4)}°E
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Key Metrics Grid -->
		<div class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each keyMetrics as metric}
				<Card.Root
					class="group relative flex flex-col justify-between overflow-hidden border py-0 shadow-sm"
				>
					<Card.Content class="relative z-10 flex h-full flex-col justify-between p-5">
						<div class="flex items-start justify-between">
							<div>
								<h3 class="mb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
									{metric.label}
								</h3>
								<p class="text-3xl font-black text-slate-900 dark:text-white">
									{metric.value}
								</p>
							</div>
							<div class="rounded-lg {metric.iconBgColor} p-2 {metric.textColor}">
								<metric.icon class="size-5" />
							</div>
						</div>
						<div
							class="flex items-center gap-1 text-xs font-bold {metric.trendNeutral
								? 'text-muted-foreground'
								: metric.trendPositive
									? 'text-green-500'
									: 'text-green-500'}"
						>
							{#if !metric.trendNeutral}
								<TrendingUp class="size-3.5" />
							{/if}
							<span>{metric.trend}</span>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</header>
