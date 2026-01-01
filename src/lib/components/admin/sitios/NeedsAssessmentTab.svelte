<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FormSection } from '$lib/components/ui/form-section';
	import { HelpTooltip } from '$lib/components/ui/help-tooltip';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { NumberInput } from '$lib/components/ui/number-input';
	import * as Select from '$lib/components/ui/select';
	import { cn } from '$lib/utils';
	import {
		AlertTriangle,
		ArrowDown,
		ArrowUp,
		CloudRain,
		Flame,
		ListChecks,
		Mountain,
		Plus,
		Shield,
		Swords,
		Trash2,
		UtensilsCrossed,
		Waves
	} from '@lucide/svelte';

	// Helper type for hazard details
	type HazardDetails = {
		/**
		 * Number of times this hazard occurred in the past 12 months.
		 */
		frequency: number;
	};

	// Props matching SitioProfile Sections I and J
	let {
		// Section I - Safety & Risk Context
		hazards = $bindable<{
			flood: HazardDetails;
			landslide: HazardDetails;
			drought: HazardDetails;
			seaLevelRise: HazardDetails;
			earthquake: HazardDetails;
			armedConflict: HazardDetails;
		}>({
			flood: { frequency: 0 },
			landslide: { frequency: 0 },
			drought: { frequency: 0 },
			seaLevelRise: { frequency: 0 },
			earthquake: { frequency: 0 },
			armedConflict: { frequency: 0 }
		}),
		/** Current Peace and Order Status */
		peaceOrder = $bindable<'stable' | 'occasional_tensions' | 'unstable'>('stable'),
		/** Primary food security concern */
		foodSecurity = $bindable<'secure' | 'seasonal_scarcity' | 'critical_shortage'>('secure'),

		// Section J - Sitio Priority Needs
		priorities = $bindable<
			Array<{
				rank: number;
				need: string;
			}>
		>([])
	}: {
		hazards: {
			flood: HazardDetails;
			landslide: HazardDetails;
			drought: HazardDetails;
			seaLevelRise: HazardDetails;
			earthquake: HazardDetails;
			armedConflict: HazardDetails;
		};
		peaceOrder: 'stable' | 'occasional_tensions' | 'unstable';
		foodSecurity: 'secure' | 'seasonal_scarcity' | 'critical_shortage';
		priorities: Array<{
			rank: number;
			need: string;
		}>;
	} = $props();

	// Hazard labels for display
	const hazardLabels: Record<keyof typeof hazards, { name: string; icon: typeof CloudRain }> = {
		flood: { name: 'Flood', icon: CloudRain },
		landslide: { name: 'Landslide', icon: Mountain },
		drought: { name: 'Drought', icon: Flame },
		seaLevelRise: { name: 'Sea Level Rise', icon: Waves },
		earthquake: { name: 'Earthquake', icon: AlertTriangle },
		armedConflict: { name: 'Armed Conflict', icon: Swords }
	};

	// Section completion checks
	const hasHazards = $derived(Object.values(hazards).some((h) => h.frequency > 0));
	const hasPriorities = $derived(priorities.length > 0);

	// Priority management
	function addPriority() {
		const nextRank = priorities.length > 0 ? Math.max(...priorities.map((p) => p.rank)) + 1 : 1;
		priorities = [...priorities, { rank: nextRank, need: '' }];
	}

	function removePriority(index: number) {
		priorities = priorities.filter((_, i) => i !== index);
		// Re-rank remaining priorities
		priorities = priorities.map((p, i) => ({ ...p, rank: i + 1 }));
	}

	function movePriorityUp(index: number) {
		if (index > 0) {
			const newPriorities = [...priorities];
			[newPriorities[index - 1], newPriorities[index]] = [
				newPriorities[index],
				newPriorities[index - 1]
			];
			priorities = newPriorities.map((p, i) => ({ ...p, rank: i + 1 }));
		}
	}

	function movePriorityDown(index: number) {
		if (index < priorities.length - 1) {
			const newPriorities = [...priorities];
			[newPriorities[index], newPriorities[index + 1]] = [
				newPriorities[index + 1],
				newPriorities[index]
			];
			priorities = newPriorities.map((p, i) => ({ ...p, rank: i + 1 }));
		}
	}
</script>

<div class="space-y-6">
	<!-- Hazards Section -->
	<FormSection
		title="Hazards & Risks"
		description="Identify natural and human-made hazards affecting the sitio"
		icon={AlertTriangle}
		variant="rose"
		isComplete={hasHazards}
	>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Object.entries(hazards) as [key, hazard]}
				{@const k = key as keyof typeof hazards}
				{@const HazardIcon = hazardLabels[k].icon}
				<div
					class={cn(
						'rounded-xl border-2 p-4 transition-all',
						hazards[k].frequency > 0 && 'border-rose-500/30 bg-rose-500/5 shadow-sm'
					)}
				>
					<div class="mb-3 flex items-center gap-2">
						<div
							class={cn(
								'flex size-8 items-center justify-center rounded-lg',
								hazards[k].frequency > 0
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
						<Label class="text-xs text-muted-foreground">Occurrences in past 12 months</Label>
						<NumberInput
							id={`hazard-${k}`}
							bind:value={hazards[k].frequency}
							placeholder="0"
							min={0}
							class={cn(
								'h-11 rounded-lg',
								hazards[k].frequency > 0 && 'border-rose-500/30 bg-rose-500/5'
							)}
						/>
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
		title="Priority Needs"
		description="Ranked list of sitio's most pressing needs"
		icon={ListChecks}
		variant="success"
		isComplete={hasPriorities}
	>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Label class="flex items-center gap-1.5 text-sm font-medium">
					Sitio Priorities
					<HelpTooltip content="List the top priority needs of this sitio in order of importance" />
				</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={addPriority}
					class="h-9 gap-2 rounded-lg"
				>
					<Plus class="size-4" />
					Add Priority
				</Button>
			</div>

			{#if priorities.length === 0}
				<div
					class="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed py-10 text-center"
				>
					<div class="flex size-12 items-center justify-center rounded-full bg-muted">
						<ListChecks class="size-6 text-muted-foreground" />
					</div>
					<div>
						<p class="font-medium text-muted-foreground">No priorities added yet</p>
						<p class="mt-1 text-sm text-muted-foreground/75">
							Add the community's most pressing needs
						</p>
					</div>
					<Button variant="outline" size="sm" onclick={addPriority} class="mt-2 gap-2">
						<Plus class="size-4" />
						Add First Priority
					</Button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each priorities as priority, i (i)}
						<div
							class={cn(
								'group flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
								priority.need.trim() !== ''
									? 'border-emerald-500/30 bg-emerald-500/5 shadow-sm'
									: 'border-muted'
							)}
						>
							<!-- Rank Badge -->
							<div
								class={cn(
									'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors',
									priority.need.trim() !== ''
										? 'bg-emerald-500/20 text-emerald-600'
										: 'bg-muted text-muted-foreground'
								)}
							>
								#{priority.rank}
							</div>

							<!-- Input -->
							<Input
								bind:value={priority.need}
								placeholder="Enter priority need (e.g., Clean water access, Health center, Road improvement)"
								class="h-11 flex-1 rounded-lg"
							/>

							<!-- Actions -->
							<div class="flex shrink-0 items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-9 rounded-lg"
									onclick={() => movePriorityUp(i)}
									disabled={i === 0}
								>
									<ArrowUp class="size-4" />
									<span class="sr-only">Move up</span>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-9 rounded-lg"
									onclick={() => movePriorityDown(i)}
									disabled={i === priorities.length - 1}
								>
									<ArrowDown class="size-4" />
									<span class="sr-only">Move down</span>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
									onclick={() => removePriority(i)}
								>
									<Trash2 class="size-4" />
									<span class="sr-only">Remove</span>
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</FormSection>
</div>
