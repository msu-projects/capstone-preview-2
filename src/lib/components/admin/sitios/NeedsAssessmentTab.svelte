<script lang="ts">
	import { FormSection } from '$lib/components/ui/form-section';
	import { HelpTooltip } from '$lib/components/ui/help-tooltip';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { PriorityItem, PriorityName, PriorityRating } from '$lib/types';
	import { cn } from '$lib/utils';
	import {
		AlertTriangle,
		CloudRain,
		Droplet,
		Flame,
		GraduationCap,
		Heart,
		Lightbulb,
		ListChecks,
		Mountain,
		Route,
		Shield,
		Tractor,
		UtensilsCrossed,
		Waves
	} from '@lucide/svelte';

	// Helper type for hazard details matching the document specification
	type HazardDetails = {
		/** Frequency description (text description like "0", "1", "2-3", etc.) */
		frequency: string;
	};

	// Props matching SitioProfile Sections I and J per documentation
	let {
		// Section I - Safety & Risk Context
		hazards = $bindable<{
			flood: HazardDetails;
			landslide: HazardDetails;
			drought: HazardDetails;
			earthquake: HazardDetails;
		}>({
			flood: { frequency: '0' },
			landslide: { frequency: '0' },
			drought: { frequency: '0' },
			earthquake: { frequency: '0' }
		}),
		/** Current Peace and Order Status */
		peaceOrder = $bindable<'stable' | 'occasional_tensions' | 'unstable'>('stable'),
		/** Primary food security concern */
		foodSecurity = $bindable<'secure' | 'seasonal_scarcity' | 'critical_shortage'>('secure'),

		// Section J - Sitio Priority Needs - using the documented structure
		priorities = $bindable<PriorityItem[]>([
			{ name: 'waterSystem', rating: 0 },
			{ name: 'communityCR', rating: 0 },
			{ name: 'solarStreetLights', rating: 0 },
			{ name: 'roadOpening', rating: 0 },
			{ name: 'farmTools', rating: 0 },
			{ name: 'healthServices', rating: 0 },
			{ name: 'educationSupport', rating: 0 }
		])
	}: {
		hazards: {
			flood: HazardDetails;
			landslide: HazardDetails;
			drought: HazardDetails;
			earthquake: HazardDetails;
		};
		peaceOrder: 'stable' | 'occasional_tensions' | 'unstable';
		foodSecurity: 'secure' | 'seasonal_scarcity' | 'critical_shortage';
		priorities: PriorityItem[];
	} = $props();

	// Hazard labels for display (only the 4 documented hazard types)
	const hazardLabels: Record<keyof typeof hazards, { name: string; icon: typeof CloudRain }> = {
		flood: { name: 'Flood', icon: CloudRain },
		landslide: { name: 'Landslide', icon: Mountain },
		drought: { name: 'Drought', icon: Flame },
		earthquake: { name: 'Earthquake', icon: Waves }
	};

	// Frequency options for hazards
	const frequencyOptions = ['0', '1', '2-3', '4-5', 'More than 5', 'Seasonal'];

	// Priority labels and icons
	const priorityLabels: Record<
		PriorityName,
		{ name: string; description: string; icon: typeof Droplet }
	> = {
		waterSystem: {
			name: 'Water System',
			description: 'Potable water supply infrastructure',
			icon: Droplet
		},
		communityCR: {
			name: 'Community CR',
			description: 'Community comfort room facilities',
			icon: Waves
		},
		solarStreetLights: {
			name: 'Solar Street Lights',
			description: 'Solar-powered street lighting',
			icon: Lightbulb
		},
		roadOpening: {
			name: 'Road Opening',
			description: 'Road construction and improvement',
			icon: Route
		},
		farmTools: {
			name: 'Farm Tools',
			description: 'Agricultural tools and equipment',
			icon: Tractor
		},
		healthServices: {
			name: 'Health Services',
			description: 'Healthcare and medical services',
			icon: Heart
		},
		educationSupport: {
			name: 'Education Support',
			description: 'Educational facilities and programs',
			icon: GraduationCap
		}
	};

	// Rating labels
	const ratingLabels: Record<PriorityRating, { label: string; color: string }> = {
		0: { label: 'Not needed', color: 'bg-muted text-muted-foreground' },
		1: { label: 'Low', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
		2: { label: 'Medium', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
		3: { label: 'Very urgent', color: 'bg-rose-500/20 text-rose-600 border-rose-500/30' }
	};

	// Section completion checks
	const hasHazards = $derived(Object.values(hazards).some((h) => h.frequency !== '0'));
	const hasPriorities = $derived(priorities.some((p) => p.rating > 0));

	// Helper function to update a priority rating
	function updatePriorityRating(priorityName: PriorityName, rating: PriorityRating) {
		priorities = priorities.map((p) => (p.name === priorityName ? { ...p, rating } : p));
	}
</script>

<div class="space-y-6">
	<!-- Hazards Section -->
	<FormSection
		title="Hazards & Risks"
		description="Identify natural hazards affecting the sitio"
		icon={AlertTriangle}
		variant="rose"
		isComplete={hasHazards}
	>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each Object.entries(hazards) as [key, hazard]}
				{@const k = key as keyof typeof hazards}
				{@const HazardIcon = hazardLabels[k].icon}
				<div
					class={cn(
						'rounded-xl border-2 p-4 transition-all',
						hazards[k].frequency !== '0' && 'border-rose-500/30 bg-rose-500/5 shadow-sm'
					)}
				>
					<div class="mb-3 flex items-center gap-2">
						<div
							class={cn(
								'flex size-8 items-center justify-center rounded-lg',
								hazards[k].frequency !== '0'
									? 'bg-rose-500/20 text-rose-600'
									: 'bg-muted text-muted-foreground'
							)}
						>
							<HazardIcon class="size-4" />
						</div>
						<Label for={`hazard-${k}`} class="text-sm font-semibold">
							{hazardLabels[k].name}
						</Label>
					</div>
					<div class="space-y-1.5">
						<Label class="text-xs text-muted-foreground">Frequency in past 12 months</Label>
						<Select.Root
							type="single"
							value={hazards[k].frequency}
							onValueChange={(v) => {
								if (v) hazards[k].frequency = v;
							}}
						>
							<Select.Trigger
								id={`hazard-${k}`}
								class={cn(
									'h-11 rounded-lg',
									hazards[k].frequency !== '0' && 'border-rose-500/30 bg-rose-500/5'
								)}
							>
								{hazards[k].frequency === '0' ? 'None' : hazards[k].frequency}
							</Select.Trigger>
							<Select.Content>
								{#each frequencyOptions as option}
									<Select.Item value={option}>
										{option === '0' ? 'None' : option}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			{/each}
		</div>
	</FormSection>

	<!-- Peace & Order Section -->
	<FormSection
		title="Peace & Order"
		description="Current peace and order status in the community"
		icon={Shield}
		variant="warning"
		defaultOpen={false}
	>
		<div class="space-y-3">
			<Label for="peaceOrder" class="flex items-center gap-1.5 text-sm font-medium">
				Current Peace and Order Status
				<HelpTooltip content="Select the current peace and order situation in the sitio" />
			</Label>
			<Select.Root
				type="single"
				value={peaceOrder}
				onValueChange={(v) => {
					if (v) peaceOrder = v as 'stable' | 'occasional_tensions' | 'unstable';
				}}
			>
				<Select.Trigger
					id="peaceOrder"
					class={cn(
						'h-11 rounded-xl',
						peaceOrder === 'occasional_tensions' && 'border-amber-500/50 bg-amber-500/5',
						peaceOrder === 'unstable' && 'border-rose-500/50 bg-rose-500/5'
					)}
				>
					{#if peaceOrder === 'stable'}
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-emerald-500"></span>
							Stable / Peaceful
						</span>
					{:else if peaceOrder === 'occasional_tensions'}
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-amber-500"></span>
							Occasional tensions (no displacement)
						</span>
					{:else}
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-rose-500"></span>
							Unstable (periodic evacuation/displacement required)
						</span>
					{/if}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="stable">
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-emerald-500"></span>
							Stable / Peaceful
						</span>
					</Select.Item>
					<Select.Item value="occasional_tensions">
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-amber-500"></span>
							Occasional tensions (no displacement)
						</span>
					</Select.Item>
					<Select.Item value="unstable">
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-rose-500"></span>
							Unstable (periodic evacuation/displacement required)
						</span>
					</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
	</FormSection>

	<!-- Food Security Section -->
	<FormSection
		title="Food Security"
		description="Primary food security concern in the community"
		icon={UtensilsCrossed}
		variant="info"
		defaultOpen={false}
	>
		<div class="space-y-3">
			<Label for="foodSecurity" class="flex items-center gap-1.5 text-sm font-medium">
				Primary Food Security Concern
				<HelpTooltip content="Select the primary food security situation in the sitio" />
			</Label>
			<Select.Root
				type="single"
				value={foodSecurity}
				onValueChange={(v) => {
					if (v) foodSecurity = v as 'secure' | 'seasonal_scarcity' | 'critical_shortage';
				}}
			>
				<Select.Trigger
					id="foodSecurity"
					class={cn(
						'h-11 rounded-xl',
						foodSecurity === 'seasonal_scarcity' && 'border-amber-500/50 bg-amber-500/5',
						foodSecurity === 'critical_shortage' && 'border-rose-500/50 bg-rose-500/5'
					)}
				>
					{#if foodSecurity === 'secure'}
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-emerald-500"></span>
							None / Food Secure
						</span>
					{:else if foodSecurity === 'seasonal_scarcity'}
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-amber-500"></span>
							Seasonal Scarcity
						</span>
					{:else}
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-rose-500"></span>
							Chronic / Critical Shortage
						</span>
					{/if}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="secure">
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-emerald-500"></span>
							None / Food Secure
						</span>
					</Select.Item>
					<Select.Item value="seasonal_scarcity">
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-amber-500"></span>
							Seasonal Scarcity
						</span>
					</Select.Item>
					<Select.Item value="critical_shortage">
						<span class="flex items-center gap-2">
							<span class="size-2 rounded-full bg-rose-500"></span>
							Chronic / Critical Shortage
						</span>
					</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
	</FormSection>

	<!-- Priority Needs Section -->
	<FormSection
		title="Priority Interventions"
		description="Rate the priority level of each intervention type"
		icon={ListChecks}
		variant="success"
		isComplete={hasPriorities}
	>
		<div class="space-y-4">
			<div class="flex items-center gap-1.5">
				<Label class="text-sm font-medium">Intervention Priority Ratings</Label>
				<HelpTooltip
					content="Rate each intervention from 0 (Not needed) to 3 (Very urgent) based on community needs"
				/>
			</div>

			<!-- Rating Legend -->
			<div class="flex flex-wrap gap-2 text-xs">
				{#each [0, 1, 2, 3] as rating}
					{@const r = rating as PriorityRating}
					<span class={cn('rounded-full border px-2.5 py-1 font-medium', ratingLabels[r].color)}>
						{r} - {ratingLabels[r].label}
					</span>
				{/each}
			</div>

			<!-- Priority Cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each priorities as priority}
					{@const label = priorityLabels[priority.name]}
					{@const PriorityIcon = label.icon}
					<div
						class={cn(
							'rounded-xl border-2 p-4 transition-all',
							priority.rating > 0 && 'shadow-sm',
							priority.rating === 3 && 'border-rose-500/30 bg-rose-500/5',
							priority.rating === 2 && 'border-amber-500/30 bg-amber-500/5',
							priority.rating === 1 && 'border-blue-500/30 bg-blue-500/5',
							priority.rating === 0 && 'border-muted'
						)}
					>
						<div class="mb-3 flex items-center gap-2">
							<div
								class={cn(
									'flex size-8 shrink-0 items-center justify-center rounded-lg',
									priority.rating === 3 && 'bg-rose-500/20 text-rose-600',
									priority.rating === 2 && 'bg-amber-500/20 text-amber-600',
									priority.rating === 1 && 'bg-blue-500/20 text-blue-600',
									priority.rating === 0 && 'bg-muted text-muted-foreground'
								)}
							>
								<PriorityIcon class="size-4" />
							</div>
							<div class="min-w-0 flex-1">
								<Label class="text-sm font-semibold">{label.name}</Label>
								<p class="truncate text-xs text-muted-foreground">
									{label.description}
								</p>
							</div>
						</div>
						<Select.Root
							type="single"
							value={String(priority.rating)}
							onValueChange={(v) => {
								if (v) updatePriorityRating(priority.name, Number(v) as PriorityRating);
							}}
						>
							<Select.Trigger
								class={cn(
									'h-10 w-full rounded-lg',
									priority.rating === 3 && 'border-rose-500/30',
									priority.rating === 2 && 'border-amber-500/30',
									priority.rating === 1 && 'border-blue-500/30'
								)}
							>
								<span
									class={cn(
										'flex items-center gap-2 text-sm',
										priority.rating > 0 && 'font-medium'
									)}
								>
									<span
										class={cn(
											'size-2 rounded-full',
											priority.rating === 3 && 'bg-rose-500',
											priority.rating === 2 && 'bg-amber-500',
											priority.rating === 1 && 'bg-blue-500',
											priority.rating === 0 && 'bg-muted-foreground/50'
										)}
									></span>
									{ratingLabels[priority.rating].label}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each [0, 1, 2, 3] as rating}
									{@const r = rating as PriorityRating}
									<Select.Item value={String(r)}>
										<span class="flex items-center gap-2">
											<span
												class={cn(
													'size-2 rounded-full',
													r === 3 && 'bg-rose-500',
													r === 2 && 'bg-amber-500',
													r === 1 && 'bg-blue-500',
													r === 0 && 'bg-muted-foreground/50'
												)}
											></span>
											{ratingLabels[r].label}
										</span>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/each}
			</div>
		</div>
	</FormSection>
</div>
