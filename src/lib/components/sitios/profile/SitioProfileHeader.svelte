<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { SitioProfile } from '$lib/types';
	import { formatNumber } from '$lib/utils/formatters';
	import { Calendar, Edit, Home, TrendingUp, Users, Vote } from '@lucide/svelte';

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
<div class="mx-auto max-w-7xl space-y-6 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
	<!-- Title and Actions -->
	<div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
		<div class="flex flex-col gap-1">
			<h1 class="text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-white">
				{sitio.sitioName} Profile
			</h1>
			<p class="text-sm text-muted-foreground md:text-base">Last Survey: October 12, 2023</p>
		</div>
		<div class="flex gap-3">
			<Button variant="outline" class="flex items-center gap-2 text-sm font-semibold">
				<Calendar class="size-4" />
				<span>2023</span>
			</Button>
			<Button class="flex items-center gap-2 text-sm font-bold">
				<Edit class="size-4" />
				<span>Update Data</span>
			</Button>
		</div>
	</div>

	<!-- Key Metrics Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
