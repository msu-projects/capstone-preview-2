<script lang="ts">
	import { FormSection } from '$lib/components/ui/form-section';
	import { HelpTooltip } from '$lib/components/ui/help-tooltip';
	import { Label } from '$lib/components/ui/label';
	import { NumberInput } from '$lib/components/ui/number-input';
	import { cn } from '$lib/utils';
	import {
		AlertCircle,
		Baby,
		Briefcase,
		CheckCircle2,
		GraduationCap,
		IdCard,
		ShieldAlert,
		UserRoundX,
		Users,
		Vote
	} from '@lucide/svelte';

	// Props matching SitioProfile Section B - Population & Demographics
	let {
		totalPopulation = $bindable(0),
		totalHouseholds = $bindable(0),
		registeredVoters = $bindable(0),
		laborForceCount = $bindable(0),
		schoolAgeChildren = $bindable(0),
		totalMale = $bindable(0),
		totalFemale = $bindable(0),
		vulnerableGroups = $bindable({
			muslimCount: 0,
			ipCount: 0,
			seniorsCount: 0,
			laborForce60to64Count: 0,
			unemployedCount: 0,
			noBirthCertCount: 0,
			noNationalIDCount: 0,
			outOfSchoolYouth: 0
		})
	}: {
		totalPopulation: number;
		totalHouseholds: number;
		registeredVoters: number;
		laborForceCount: number;
		schoolAgeChildren: number;
		totalMale: number;
		totalFemale: number;
		vulnerableGroups: {
			muslimCount: number;
			ipCount: number;
			seniorsCount: number;
			laborForce60to64Count: number;
			unemployedCount: number;
			noBirthCertCount: number;
			noNationalIDCount: number;
			outOfSchoolYouth: number;
		};
	} = $props();

	// Computed totals
	const genderTotal = $derived(totalMale + totalFemale);
	const hasGenderData = $derived(totalMale > 0 || totalFemale > 0);
	const hasPopulation = $derived(totalPopulation > 0);

	// Validation
	const isGenderValid = $derived(
		!hasPopulation || !hasGenderData || genderTotal === totalPopulation
	);

	// Section completion checks
	const isPopulationComplete = $derived(totalPopulation > 0 || totalHouseholds > 0);
	const isGenderComplete = $derived(hasGenderData && isGenderValid);
	const isVoterDataComplete = $derived(registeredVoters > 0);
	const isVulnerableComplete = $derived(
		vulnerableGroups.seniorsCount > 0 ||
			vulnerableGroups.muslimCount > 0 ||
			vulnerableGroups.ipCount > 0 ||
			vulnerableGroups.unemployedCount > 0
	);
</script>

<div class="space-y-6">
	<!-- Population & Household Counts -->
	<FormSection
		title="Population & Households"
		description="Basic population and household counts"
		icon={Users}
		accent="blue"
		isComplete={isPopulationComplete}
	>
		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			<div class="space-y-2">
				<Label for="totalPopulation" class="flex items-center gap-1.5 text-sm font-medium">
					Total Population
					<HelpTooltip content="Total number of individuals residing in this sitio" />
				</Label>
				<NumberInput
					id="totalPopulation"
					bind:value={totalPopulation}
					placeholder="0"
					min={0}
					class={cn(
						'h-11 rounded-xl',
						totalPopulation > 0 && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
					)}
				/>
			</div>
			<div class="space-y-2">
				<Label for="totalHouseholds" class="flex items-center gap-1.5 text-sm font-medium">
					Total Households
					<HelpTooltip content="Total number of households in this sitio" />
				</Label>
				<NumberInput
					id="totalHouseholds"
					bind:value={totalHouseholds}
					placeholder="0"
					min={0}
					class={cn(
						'h-11 rounded-xl',
						totalHouseholds > 0 && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
					)}
				/>
			</div>
			<div class="space-y-2">
				<Label for="schoolAgeChildren" class="flex items-center gap-1.5 text-sm font-medium">
					<GraduationCap class="size-4 text-muted-foreground" />
					School-Age Children
					<HelpTooltip content="Number of children in school age (5-17 years)" />
				</Label>
				<NumberInput
					id="schoolAgeChildren"
					bind:value={schoolAgeChildren}
					placeholder="0"
					min={0}
					class={cn(
						'h-11 rounded-xl',
						schoolAgeChildren > 0 && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
					)}
				/>
			</div>
		</div>

		<!-- Quick Stats -->
		{#if totalPopulation > 0 && totalHouseholds > 0}
			<div class="mt-4 rounded-xl border bg-muted/30 p-4">
				<div class="flex flex-wrap items-center justify-center gap-6 text-center">
					<div>
						<p class="text-2xl font-bold text-primary">
							{(totalPopulation / totalHouseholds).toFixed(1)}
						</p>
						<p class="text-xs text-muted-foreground">Avg. household size</p>
					</div>
					{#if schoolAgeChildren > 0}
						<div class="h-8 w-px bg-border"></div>
						<div>
							<p class="text-2xl font-bold text-primary">
								{((schoolAgeChildren / totalPopulation) * 100).toFixed(0)}%
							</p>
							<p class="text-xs text-muted-foreground">School-age population</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</FormSection>

	<!-- Gender Distribution -->
	<FormSection
		title="Gender Distribution"
		description="Breakdown of population by gender"
		icon={Users}
		accent="purple"
		isComplete={isGenderComplete}
	>
		{#snippet actions()}
			{#if hasGenderData && hasPopulation}
				{#if isGenderValid}
					<div
						class="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600"
					>
						<CheckCircle2 class="size-3.5" />
						<span class="hidden sm:inline">Matches population</span>
						<span class="sm:hidden">Valid</span>
					</div>
				{:else}
					<div
						class="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
					>
						<AlertCircle class="size-3.5" />
						<span class="hidden sm:inline">Should equal {totalPopulation.toLocaleString()}</span>
						<span class="sm:hidden">Mismatch</span>
					</div>
				{/if}
			{/if}
		{/snippet}

		<!-- Compact table layout for gender -->
		<div class="overflow-hidden rounded-xl border-2">
			<div class="grid grid-cols-3 divide-x bg-muted/50">
				<div class="p-3 text-center">
					<Label
						for="totalMale"
						class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Male</Label
					>
				</div>
				<div class="p-3 text-center">
					<Label
						for="totalFemale"
						class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
						>Female</Label
					>
				</div>
				<div class="p-3 text-center">
					<Label class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
						>Total</Label
					>
				</div>
			</div>
			<div class="grid grid-cols-3 divide-x">
				<div class="p-3">
					<NumberInput
						id="totalMale"
						bind:value={totalMale}
						placeholder="0"
						min={0}
						class={cn(
							'h-11 rounded-lg text-center',
							totalMale > 0 && 'border-blue-500/30 bg-blue-500/5'
						)}
					/>
				</div>
				<div class="p-3">
					<NumberInput
						id="totalFemale"
						bind:value={totalFemale}
						placeholder="0"
						min={0}
						class={cn(
							'h-11 rounded-lg text-center',
							totalFemale > 0 && 'border-pink-500/30 bg-pink-500/5'
						)}
					/>
				</div>
				<div class="p-3">
					<NumberInput
						value={genderTotal}
						placeholder="0"
						disabled
						class="h-11 rounded-lg bg-muted/50 text-center font-semibold"
					/>
				</div>
			</div>
		</div>

		{#if hasGenderData && hasPopulation && !isGenderValid}
			<div
				class="mt-4 flex items-start gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4"
			>
				<AlertCircle class="mt-0.5 size-5 shrink-0 text-destructive" />
				<div class="text-sm">
					<p class="font-semibold text-destructive">Gender distribution must equal population</p>
					<p class="mt-1 text-muted-foreground">
						Male ({totalMale.toLocaleString()}) + Female ({totalFemale.toLocaleString()}) = {genderTotal.toLocaleString()},
						but Population is {totalPopulation.toLocaleString()}
					</p>
				</div>
			</div>
		{/if}
	</FormSection>

	<!-- Voter & Labor Force -->
	<FormSection
		title="Voter & Labor Data"
		description="Registered voters and labor force information"
		icon={Vote}
		accent="green"
		isComplete={isVoterDataComplete}
	>
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<div class="space-y-2">
				<Label for="registeredVoters" class="flex items-center gap-1.5 text-sm font-medium">
					<Vote class="size-4 text-muted-foreground" />
					Registered Voters
					<HelpTooltip content="Number of individuals registered to vote" />
				</Label>
				<NumberInput
					id="registeredVoters"
					bind:value={registeredVoters}
					placeholder="0"
					min={0}
					class={cn(
						'h-11 rounded-xl',
						registeredVoters > 0 && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
					)}
				/>
			</div>
			<div class="space-y-2">
				<Label for="laborForceCount" class="flex items-center gap-1.5 text-sm font-medium">
					<Briefcase class="size-4 text-muted-foreground" />
					Labor Force Count
					<HelpTooltip content="Number of working-age (15-64) individuals in the labor force" />
				</Label>
				<NumberInput
					id="laborForceCount"
					bind:value={laborForceCount}
					placeholder="0"
					min={0}
					class={cn(
						'h-11 rounded-xl',
						laborForceCount > 0 && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
					)}
				/>
			</div>
		</div>
	</FormSection>

	<!-- Vulnerable Groups -->
	<FormSection
		title="Vulnerable Groups"
		description="Population breakdown by vulnerable categories"
		icon={ShieldAlert}
		accent="amber"
		isComplete={isVulnerableComplete}
		defaultOpen={false}
	>
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
			<div class="space-y-2">
				<Label for="muslimCount" class="flex items-center gap-1.5 text-sm font-medium">
					Muslim Population
					<HelpTooltip content="Estimated Muslim population" />
				</Label>
				<NumberInput
					id="muslimCount"
					bind:value={vulnerableGroups.muslimCount}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
			<div class="space-y-2">
				<Label for="ipCount" class="flex items-center gap-1.5 text-sm font-medium">
					Indigenous Peoples (IP)
					<HelpTooltip content="Estimated Indigenous Peoples population" />
				</Label>
				<NumberInput
					id="ipCount"
					bind:value={vulnerableGroups.ipCount}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
			<div class="space-y-2">
				<Label for="seniorsCount" class="flex items-center gap-1.5 text-sm font-medium">
					Seniors (60+)
					<HelpTooltip content="Individuals 60 years old and above" />
				</Label>
				<NumberInput
					id="seniorsCount"
					bind:value={vulnerableGroups.seniorsCount}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
			<div class="space-y-2">
				<Label for="laborForce60to64Count" class="flex items-center gap-1.5 text-sm font-medium">
					Labor Force (60-64)
					<HelpTooltip content="Working seniors aged 60-64 years" />
				</Label>
				<NumberInput
					id="laborForce60to64Count"
					bind:value={vulnerableGroups.laborForce60to64Count}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
			<div class="space-y-2">
				<Label for="unemployedCount" class="flex items-center gap-1.5 text-sm font-medium">
					<UserRoundX class="size-4 text-muted-foreground" />
					Unemployed
					<HelpTooltip content="Estimated unemployed persons" />
				</Label>
				<NumberInput
					id="unemployedCount"
					bind:value={vulnerableGroups.unemployedCount}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
			<div class="space-y-2">
				<Label for="noBirthCertCount" class="flex items-center gap-1.5 text-sm font-medium">
					<Baby class="size-4 text-muted-foreground" />
					No Birth Certificate
					<HelpTooltip content="Individuals without birth certificates" />
				</Label>
				<NumberInput
					id="noBirthCertCount"
					bind:value={vulnerableGroups.noBirthCertCount}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
			<div class="space-y-2">
				<Label for="noNationalIDCount" class="flex items-center gap-1.5 text-sm font-medium">
					<IdCard class="size-4 text-muted-foreground" />
					No National ID
					<HelpTooltip content="Individuals without National ID / PhilSys ID" />
				</Label>
				<NumberInput
					id="noNationalIDCount"
					bind:value={vulnerableGroups.noNationalIDCount}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
			<div class="space-y-2">
				<Label for="outOfSchoolYouth" class="flex items-center gap-1.5 text-sm font-medium">
					<GraduationCap class="size-4 text-muted-foreground" />
					Out-of-School Youth
					<HelpTooltip content="Number of school-age children (5-17) not attending school" />
				</Label>
				<NumberInput
					id="outOfSchoolYouth"
					bind:value={vulnerableGroups.outOfSchoolYouth}
					placeholder="0"
					min={0}
					class="h-11 rounded-xl"
				/>
			</div>
		</div>
	</FormSection>
</div>
