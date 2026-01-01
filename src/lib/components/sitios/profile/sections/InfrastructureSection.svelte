<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
	import InfoCard from '$lib/components/ui/info-card/InfoCard.svelte';
	import type { SitioProfile } from '$lib/types';
	import {
		Building2,
		Car,
		Check,
		Droplets,
		Footprints,
		Milestone,
		Navigation,
		Router,
		Ship,
		Zap
	} from '@lucide/svelte';

	interface Props {
		sitio: SitioProfile;
	}

	const { sitio }: Props = $props();

	// Calculate utility percentages
	const electricityPercent = $derived(
		sitio.totalHouseholds > 0
			? Math.round((sitio.householdsWithElectricity / sitio.totalHouseholds) * 100)
			: 0
	);

	const toiletPercent = $derived(
		sitio.totalHouseholds > 0
			? Math.round((sitio.householdsWithToilet / sitio.totalHouseholds) * 100)
			: 0
	);

	const internetPercent = $derived(
		sitio.totalHouseholds > 0
			? Math.round((sitio.householdsWithInternet / sitio.totalHouseholds) * 100)
			: 0
	);

	const electricitySources = $derived([
		{
			label: 'Grid',
			count: sitio.electricitySources.grid,
			value:
				sitio.totalHouseholds > 0
					? Math.round((sitio.electricitySources.grid / sitio.totalHouseholds) * 100)
					: 0,
			color: 'bg-indigo-500'
		},
		{
			label: 'Solar',
			count: sitio.electricitySources.solar,
			value:
				sitio.totalHouseholds > 0
					? Math.round((sitio.electricitySources.solar / sitio.totalHouseholds) * 100)
					: 0,
			color: 'bg-yellow-500'
		},
		{
			label: 'Battery',
			count: sitio.electricitySources.battery,
			value:
				sitio.totalHouseholds > 0
					? Math.round((sitio.electricitySources.battery / sitio.totalHouseholds) * 100)
					: 0,
			color: 'bg-emerald-500'
		},
		{
			label: 'Generator',
			count: sitio.electricitySources.generator,
			value:
				sitio.totalHouseholds > 0
					? Math.round((sitio.electricitySources.generator / sitio.totalHouseholds) * 100)
					: 0,
			color: 'bg-orange-500'
		}
	]);

	// Internal infrastructure (roads)
	const roadTypes = $derived([
		{
			type: 'Concrete',
			color: 'bg-blue-500',
			exists: sitio.infrastructure.concrete.exists,
			length: sitio.infrastructure.concrete.length || 0,
			condition: sitio.infrastructure.concrete.condition
		},
		{
			type: 'Asphalt',
			color: 'bg-slate-300 dark:bg-slate-700',
			exists: sitio.infrastructure.asphalt.exists,
			length: sitio.infrastructure.asphalt.length || 0,
			condition: sitio.infrastructure.asphalt.condition
		},
		{
			type: 'Gravel',
			color: 'bg-orange-400',
			exists: sitio.infrastructure.gravel.exists,
			length: sitio.infrastructure.gravel.length || 0,
			condition: sitio.infrastructure.gravel.condition
		},
		{
			type: 'Natural',
			color: 'bg-stone-500',
			exists: sitio.infrastructure.natural.exists,
			length: sitio.infrastructure.natural.length || 0,
			condition: sitio.infrastructure.natural.condition
		}
	]);

	// Calculate total road network length
	const totalRoadLength = $derived(
		roadTypes.reduce((sum, road) => (road.exists === 'yes' ? sum + road.length : sum), 0)
	);

	// Water sources data
	const waterSources = $derived([
		{
			type: 'Natural Source',
			status: sitio.waterSources.natural.exists,
			functional: sitio.waterSources.natural.functioningCount || 0,
			defective: sitio.waterSources.natural.notFunctioningCount || 0
		},
		{
			type: 'Level 1 (Point Source)',
			status: sitio.waterSources.level1.exists,
			functional: sitio.waterSources.level1.functioningCount || 0,
			defective: sitio.waterSources.level1.notFunctioningCount || 0
		},
		{
			type: 'Level 2 (Communal)',
			status: sitio.waterSources.level2.exists,
			functional: sitio.waterSources.level2.functioningCount || 0,
			defective: sitio.waterSources.level2.notFunctioningCount || 0
		},
		{
			type: 'Level 3 (Individual)',
			status: sitio.waterSources.level3.exists,
			functional: sitio.waterSources.level3.functioningCount || 0,
			defective: sitio.waterSources.level3.notFunctioningCount || 0
		}
	]);

	// Access modes
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

	// Community facilities
	const facilitiesList = $derived([
		{
			name: 'Health Center',
			facility: sitio.facilities.healthCenter
		},
		{
			name: 'Pharmacy',
			facility: sitio.facilities.pharmacy
		},
		{
			name: 'Community Toilet',
			facility: sitio.facilities.communityToilet
		},
		{
			name: 'Kindergarten',
			facility: sitio.facilities.kindergarten
		},
		{
			name: 'Elem. School',
			facility: sitio.facilities.elementarySchool
		},
		{
			name: 'High School',
			facility: sitio.facilities.highSchool
		},
		{
			name: 'Madrasah',
			facility: sitio.facilities.madrasah
		},
		{
			name: 'Market',
			facility: sitio.facilities.market
		}
	]);

	// Condition labels
	function getConditionLabel(condition: number | undefined): { text: string; class: string } {
		switch (condition) {
			case 5:
				return { text: 'Excellent', class: 'text-emerald-600 dark:text-emerald-400' };
			case 4:
				return { text: 'Good', class: 'text-green-600 dark:text-green-400' };
			case 3:
				return { text: 'Fair', class: 'text-yellow-600 dark:text-yellow-400' };
			case 2:
				return { text: 'Poor', class: 'text-orange-600 dark:text-orange-400' };
			case 1:
				return { text: 'Bad', class: 'text-red-600 dark:text-red-400' };
			default:
				return { text: 'N/A', class: 'text-slate-400' };
		}
	}

	// Road condition descriptions
	function getRoadConditionDescription(condition: number | undefined): string {
		switch (condition) {
			case 5:
				return 'Optimal condition; new or like-new surface.';
			case 4:
				return 'Smooth ride; sound structure with minimal wear.';
			case 3:
				return 'Functional but bumpy; minor cracks and wear.';
			case 2:
				return 'Rough ride; significant potholes and cracking.';
			case 1:
				return 'Unsafe or impassable; severe damage like deep potholes or collapse.';
			default:
				return '';
		}
	}

	// Facility condition descriptions
	function getFacilityConditionDescription(condition: number | undefined): string {
		switch (condition) {
			case 5:
				return 'In optimal condition; newly built, renovated, or exceeds standard requirements.';
			case 4:
				return 'Fully functional and well-maintained; requires only routine maintenance.';
			case 3:
				return 'Functional with minor defects; needs minor repairs and preventive maintenance.';
			case 2:
				return 'Functional but with significant wear; requires major repairs soon to prevent failure.';
			case 1:
				return 'Severely damaged, unsafe, or non-functional; requires immediate major intervention.';
			default:
				return '';
		}
	}

	// Mobile signal info
	const signalInfo = $derived(() => {
		const signalMap: Record<string, { label: string; bars: number }> = {
			none: { label: 'No Signal', bars: 0 },
			'2g': { label: '2G', bars: 1 },
			'3g': { label: '3G', bars: 2 },
			'4g': { label: '4G LTE', bars: 3 },
			'5g': { label: '5G', bars: 4 }
		};
		return signalMap[sitio.mobileSignal] || { label: 'Unknown', bars: 0 };
	});
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Column: Main Content (2/3 width) -->
	<div class="flex flex-col gap-6 lg:col-span-2">
		<!-- Access to Utilities Card -->
		<InfoCard
			title="Access to Utilities"
			description="Detailed breakdown of basic services coverage"
			icon={Zap}
			iconBgColor="bg-yellow-50 dark:bg-yellow-900/20"
			iconTextColor="text-yellow-500"
		>
			{#snippet children()}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Electricity Section -->
					<div class="flex flex-col gap-4">
						<div title="Percentage of households with access to electricity">
							<div class="flex justify-between">
								<span class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
									Electricity Access
								</span>
								<span class="text-sm font-bold text-slate-900 dark:text-white">
									{electricityPercent}%
								</span>
							</div>
							<div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2.5 rounded-full bg-yellow-400 transition-all duration-500"
									style="width: {electricityPercent}%"
								></div>
							</div>
							<p class="mt-2 text-xs text-muted-foreground">
								{sitio.householdsWithElectricity} of {sitio.totalHouseholds} households
							</p>
							<div
								class="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
							>
								<p
									class="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
								>
									Source Breakdown (per Household)
								</p>
								<div class="space-y-2">
									{#each electricitySources.filter((v) => v.value > 0) as source}
										<div class="flex items-center gap-2 text-xs">
											<span class="w-16 text-slate-500 dark:text-slate-400">{source.label}</span>
											<div class="mx-2 h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
												<div
													class="h-1.5 rounded-full {source.color} transition-all duration-500"
													style="width: {source.value}%"
												></div>
											</div>
											<div class="flex min-w-20 items-baseline justify-end gap-1">
												<span class="text-[10px] text-muted-foreground">({source.count})</span>
												<span class="font-medium text-slate-900 dark:text-white"
													>{source.value}%</span
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
									{toiletPercent}%
								</span>
							</div>
							<div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2.5 rounded-full bg-green-500 transition-all duration-500"
									style="width: {toiletPercent}%"
								></div>
							</div>
							<p class="mt-2 text-xs text-muted-foreground">
								{sitio.householdsWithToilet} of {sitio.totalHouseholds} households
							</p>
						</div>

						<!-- Internet Connectivity -->
						<div title="Percentage of households with internet connection">
							<div class="mb-2 flex justify-between">
								<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
									Internet Connectivity
								</span>
								<span class="text-sm font-bold text-slate-900 dark:text-white">
									{internetPercent}%
								</span>
							</div>
							<div class="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									class="h-2.5 rounded-full bg-blue-400 transition-all duration-500"
									style="width: {internetPercent}%"
								></div>
								<p class="mt-2 text-xs text-muted-foreground">
									{sitio.householdsWithInternet} of {sitio.totalHouseholds} households
								</p>
							</div>
						</div>
					</div>
				</div>
			{/snippet}
		</InfoCard>

		<!-- Internal Infrastructure Card -->
		<InfoCard
			title="Internal Infrastructure"
			description="Road network conditions and surface types"
			icon={Car}
			iconBgColor="bg-slate-50 dark:bg-slate-900/20"
			iconTextColor="text-slate-400"
		>
			{#snippet children()}
				<div class="flex flex-col gap-4">
					<div
						class="grid grid-cols-12 gap-2 border-b border-slate-100 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase dark:border-slate-800"
					>
						<div class="col-span-4">Type</div>
						<div class="col-span-3 text-right">Status</div>
						<div class="col-span-2 text-right">Length</div>
						<div class="col-span-3 text-right">Condition</div>
					</div>
					{#each roadTypes as road}
						<div
							class="grid grid-cols-12 items-center gap-2"
							class:opacity-60={road.exists === 'no'}
						>
							<div class="col-span-4 flex items-center gap-2">
								<div class="h-8 w-1.5 rounded-full {road.color}"></div>
								<span class="text-sm font-bold text-slate-900 dark:text-white">{road.type}</span>
							</div>
							<div class="col-span-3 flex justify-end">
								{#if road.exists === 'yes'}
									<Badge
										variant="outline"
										class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
									>
										<Check class="mr-1 size-3.5" />
										Yes
									</Badge>
								{:else}
									<Badge
										variant="outline"
										class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
									>
										No
									</Badge>
								{/if}
							</div>
							<div class="col-span-2 text-right">
								{#if road.exists === 'yes'}
									<span class="text-sm font-bold text-slate-700 dark:text-slate-300"
										>{road.length.toFixed(1)}</span
									>
									<span class="text-[10px] text-muted-foreground">km</span>
								{:else}
									<span class="text-sm text-slate-400">—</span>
								{/if}
							</div>
							<div class="col-span-3 flex items-center justify-end gap-1">
								{#if road.exists === 'yes' && road.condition}
									{@const conditionInfo = getConditionLabel(road.condition)}
									{@const description = getRoadConditionDescription(road.condition)}
									<span class="text-xs font-bold {conditionInfo.class}">
										{conditionInfo.text}
									</span>
									<HelpTooltip content={description} />
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
						{#each roadTypes.filter((r) => r.exists === 'yes') as road, index}
							{@const percentage = totalRoadLength > 0 ? (road.length / totalRoadLength) * 100 : 0}
							<div
								class="h-full {road.color} {index <
								roadTypes.filter((r) => r.exists === 'yes').length - 1
									? 'border-r border-white dark:border-slate-800'
									: ''}"
								style="width: {percentage}%"
							></div>
						{/each}
					</div>
					<div class="mt-3 flex flex-wrap gap-4">
						{#each roadTypes.filter((r) => r.exists === 'yes') as road}
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
			description="Availability and functional status of water facilities"
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
								<th class="pb-3 text-center">Status</th>
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
										{#if source.status === 'yes'}
											<Badge
												variant="outline"
												class="border-green-100 bg-green-50 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
											>
												Yes
											</Badge>
										{:else}
											<Badge
												variant="outline"
												class="border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
											>
												No
											</Badge>
										{/if}
									</td>
									<td class="py-3 text-center text-slate-700 dark:text-slate-300">
										{source.status === 'yes' ? source.functional : '—'}
									</td>
									<td
										class="py-3 text-center {source.defective > 0
											? 'font-medium text-red-500'
											: 'text-slate-400'}"
									>
										{source.status === 'yes' ? source.defective : '—'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/snippet}
		</InfoCard>
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
					{#each accessModes as mode}
						{@const Icon = mode.icon}
						<div
							class="flex items-center gap-2.5 rounded-lg border p-2.5 transition-all {mode.enabled
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
								<span class="text-[13px] font-medium text-foreground">{mode.label}</span>
								<span class="text-[11px] leading-tight text-muted-foreground">
									{mode.description}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>

		<!-- Mobile Signal Card -->
		<InfoCard
			title="Mobile Signal"
			description="Network availability & strength"
			icon={Router}
			iconBgColor="bg-slate-50 dark:bg-slate-900/20"
			iconTextColor="text-slate-400"
			contentPadding="px-4 py-2"
		>
			<div class="mt-4 flex justify-between gap-1.5">
				{#each ['2G', '3G', '4G', '5G'] as network, index}
					{@const isActive = index + 1 <= signalInfo().bars}
					<div class="flex flex-1 flex-col items-center gap-1.5">
						<div
							class="h-3 w-full rounded transition-all {isActive
								? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
								: 'bg-slate-100 dark:bg-slate-700'}"
						></div>
						<span
							class="text-sm font-bold {isActive
								? 'text-slate-900 dark:text-white'
								: 'text-slate-400 dark:text-slate-500'}"
						>
							{network}
						</span>
					</div>
				{/each}
			</div>
		</InfoCard>

		<!-- Community Facilities Card -->
		<InfoCard
			title="Community Facilities"
			description="Infrastructure for health, education, and services"
			icon={Building2}
			iconBgColor="bg-purple-50 dark:bg-purple-900/20"
			iconTextColor="text-purple-500"
		>
			{#snippet children()}
				<div
					class="mb-3 rounded border border-blue-100 bg-blue-50 p-2 dark:border-blue-800/30 dark:bg-blue-900/10"
				>
					<p class="text-[10px] leading-tight text-blue-700 dark:text-blue-300">
						<span class="font-bold">Note:</span> Condition rating refers to the best facility present
						in the sitio if multiple exist.
					</p>
				</div>
				<div class="grid grid-cols-1 gap-4">
					{#each facilitiesList as { name, facility }}
						<div
							class="flex items-center justify-between rounded-lg border p-3 {facility.exists ===
							'yes'
								? 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/20'
								: 'dark:bg-card-dark border-slate-100 bg-white dark:border-slate-700'}"
						>
							<div class="flex flex-col">
								<span class="text-sm font-bold text-slate-900 dark:text-white">{name}</span>
								{#if facility.exists === 'yes'}
									<span
										class="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"
									>
										<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
										Present ({facility.count || 1})
									</span>
								{:else}
									<span class="flex items-center gap-1 text-xs font-medium text-slate-500">
										<Navigation class="size-3" />
										{#if facility.distanceToNearest}
											{facility.distanceToNearest} km away
										{:else}
											Not Available
										{/if}
									</span>
								{/if}
							</div>
							{#if facility.exists === 'yes' && facility.condition}
								{@const conditionInfo = getConditionLabel(facility.condition)}
								{@const description = getFacilityConditionDescription(facility.condition)}
								<div class="flex items-center gap-1">
									<span class="text-[10px] font-bold {conditionInfo.class}">
										{conditionInfo.text}
									</span>
									<HelpTooltip content={description} />
								</div>
							{:else if facility.exists === 'no'}
								<div class="flex flex-col items-end opacity-50">
									<span class="text-xs font-semibold text-slate-400 uppercase">None</span>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/snippet}
		</InfoCard>
	</div>
</div>
