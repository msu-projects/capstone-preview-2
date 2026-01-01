<script lang="ts">
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import BasicInfoTab from '$lib/components/admin/sitios/BasicInfoTab.svelte';
	import DemographicsSocialTab from '$lib/components/admin/sitios/DemographicsSocialTab.svelte';
	import InfrastructureHousingTab from '$lib/components/admin/sitios/InfrastructureHousingTab.svelte';
	import LivelihoodsEconomyTab from '$lib/components/admin/sitios/LivelihoodsEconomyTab.svelte';
	import NeedsAssessmentTab from '$lib/components/admin/sitios/NeedsAssessmentTab.svelte';
	import SitioImagesTab from '$lib/components/admin/sitios/SitioImagesTab.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { FormStepper, type Step } from '$lib/components/ui/form-stepper';
	import type { PriorityItem } from '$lib/types';
	import { cn } from '$lib/utils';
	import {
		AlertTriangle,
		ArrowLeft,
		ArrowRight,
		Building,
		CheckCircle2,
		Image,
		Loader2,
		MapPin,
		Save,
		Sparkles,
		Sprout,
		Users,
		X
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';

	// Helper type definitions for inline use
	type FacilityDetails = {
		exists: 'yes' | 'no';
		count?: number;
		distanceToNearest?: number;
		condition?: 1 | 2 | 3 | 4 | 5;
	};

	type RoadDetails = {
		exists: 'yes' | 'no';
		length?: number;
		condition?: 1 | 2 | 3 | 4 | 5;
	};

	type WaterSourceStatus = {
		exists: 'yes' | 'no';
		functioningCount?: number;
		notFunctioningCount?: number;
	};

	type HazardDetails = {
		/** Frequency description (text) */
		frequency: string;
	};

	let isSaving = $state(false);
	let activeStep = $state('basic');
	let cancelDialogOpen = $state(false);

	// ===== Section A: Basic Sitio Information =====
	let municipality = $state('');
	let barangay = $state('');
	let sitioName = $state('');
	let sitioCode = $state('');
	let latitude = $state(0);
	let longitude = $state(0);
	let sitioClassification = $state({
		gida: false,
		indigenous: false,
		conflict: false
	});
	let mainAccess = $state('');

	// ===== Section B: Population & Demographics =====
	let totalPopulation = $state(0);
	let totalHouseholds = $state(0);
	let registeredVoters = $state(0);
	let laborForceCount = $state(0);
	let schoolAgeChildren = $state(0);
	let population = $state({
		totalMale: 0,
		totalFemale: 0
	});
	let vulnerableGroups = $state({
		muslimCount: 0,
		ipCount: 0,
		seniorsCount: 0,
		laborForce60to64Count: 0,
		unemployedCount: 0,
		noBirthCertCount: 0,
		noNationalIDCount: 0,
		outOfSchoolYouth: 0
	});

	// ===== Section C: Basic Utilities & Connectivity =====
	let householdsWithToilet = $state(0);
	let householdsWithElectricity = $state(0);
	let electricitySources = $state({
		grid: 0,
		solar: 0,
		battery: 0,
		generator: 0
	});
	let mobileSignal = $state<'none' | '2g' | '3g' | '4g' | '5g'>('none');
	let householdsWithInternet = $state(0);

	// ===== Section D: Community Facilities =====
	let facilities = $state<{
		healthCenter: FacilityDetails;
		pharmacy: FacilityDetails;
		communityToilet: FacilityDetails;
		kindergarten: FacilityDetails;
		elementarySchool: FacilityDetails;
		highSchool: FacilityDetails;
		madrasah: FacilityDetails;
		market: FacilityDetails;
	}>({
		healthCenter: { exists: 'no' },
		pharmacy: { exists: 'no' },
		communityToilet: { exists: 'no' },
		kindergarten: { exists: 'no' },
		elementarySchool: { exists: 'no' },
		highSchool: { exists: 'no' },
		madrasah: { exists: 'no' },
		market: { exists: 'no' }
	});

	// ===== Section E: Roads & Internal Infrastructure =====
	let infrastructure = $state<{
		asphalt: RoadDetails;
		concrete: RoadDetails;
		gravel: RoadDetails;
		natural: RoadDetails;
	}>({
		asphalt: { exists: 'no' },
		concrete: { exists: 'no' },
		gravel: { exists: 'no' },
		natural: { exists: 'no' }
	});

	// ===== Section F: Education Status =====
	let studentsPerRoom = $state<
		'less_than_46' | '46_50' | '51_55' | 'more_than_56' | 'no_classroom'
	>('less_than_46');

	// ===== Section G: Water & Sanitation =====
	let waterSources = $state<{
		natural: WaterSourceStatus;
		level1: WaterSourceStatus;
		level2: WaterSourceStatus;
		level3: WaterSourceStatus;
	}>({
		natural: { exists: 'no' },
		level1: { exists: 'no' },
		level2: { exists: 'no' },
		level3: { exists: 'no' }
	});
	let sanitationTypes = $state({
		waterSealed: false,
		pitLatrine: false,
		communityCR: false,
		openDefecation: false
	});

	// ===== Section H: Livelihood & Agriculture =====
	let workerClass = $state({
		privateHousehold: 0,
		privateEstablishment: 0,
		government: 0,
		selfEmployed: 0,
		employer: 0,
		ofw: 0
	});
	let averageDailyIncome = $state(0);
	let agriculture = $state({
		numberOfFarmers: 0,
		numberOfAssociations: 0,
		estimatedFarmAreaHectares: 0
	});
	let crops = $state<string[]>([]);
	let livestock = $state<string[]>([]);

	// ===== Section I: Safety & Risk Context =====
	let hazards = $state<{
		flood: HazardDetails;
		landslide: HazardDetails;
		drought: HazardDetails;
		earthquake: HazardDetails;
	}>({
		flood: { frequency: '0' },
		landslide: { frequency: '0' },
		drought: { frequency: '0' },
		earthquake: { frequency: '0' }
	});
	/** Primary food security concern */
	let foodSecurity = $state<'secure' | 'seasonal_scarcity' | 'critical_shortage'>('secure');

	// ===== Section J: Sitio Priority Needs =====
	let priorities = $state<PriorityItem[]>([
		{ name: 'waterSystem', rating: 0 },
		{ name: 'communityCR', rating: 0 },
		{ name: 'solarStreetLights', rating: 0 },
		{ name: 'roadOpening', rating: 0 },
		{ name: 'farmTools', rating: 0 },
		{ name: 'healthServices', rating: 0 },
		{ name: 'educationSupport', rating: 0 }
	]);

	// ===== Images =====
	let images = $state<
		Array<{
			id: string;
			caption?: string;
			uploaded_at: string;
		}>
	>([]);

	// Validation
	const isBasicInfoValid = $derived(
		municipality.trim() !== '' && barangay.trim() !== '' && sitioName.trim() !== ''
	);

	const isDemographicsValid = $derived(totalPopulation > 0 || totalHouseholds > 0);

	const canSave = $derived(isBasicInfoValid);

	// Step configuration
	const steps: Step[] = $derived([
		{
			id: 'basic',
			label: 'Basic Information',
			shortLabel: 'Basic Info',
			icon: MapPin,
			isValid: isBasicInfoValid,
			hasError: !isBasicInfoValid && activeStep !== 'basic'
		},
		{
			id: 'demographics',
			label: 'Population & Demographics',
			shortLabel: 'Demographics',
			icon: Users,
			isValid: isDemographicsValid
		},
		{
			id: 'livelihoods',
			label: 'Livelihood & Agriculture',
			shortLabel: 'Livelihoods',
			icon: Sprout,
			isValid:
				workerClass.privateHousehold > 0 ||
				workerClass.government > 0 ||
				agriculture.numberOfFarmers > 0
		},
		{
			id: 'infrastructure',
			label: 'Infrastructure & Utilities',
			shortLabel: 'Infrastructure',
			icon: Building,
			isValid: householdsWithElectricity > 0 || householdsWithToilet > 0
		},
		{
			id: 'needs-assessment',
			label: 'Safety & Priority Needs',
			shortLabel: 'Safety & Needs',
			icon: AlertTriangle,
			isValid: priorities.some((p) => p.rating > 0)
		},
		{
			id: 'images',
			label: 'Photos & Images',
			shortLabel: 'Images',
			icon: Image,
			isValid: true
		}
	]);

	// Step navigation
	const stepOrder = [
		'basic',
		'demographics',
		'livelihoods',
		'infrastructure',
		'needs-assessment',
		'images'
	];
	const currentStepIndex = $derived(stepOrder.indexOf(activeStep));
	const canGoNext = $derived(currentStepIndex < stepOrder.length - 1);
	const canGoPrevious = $derived(currentStepIndex > 0);
	const nextStepLabel = $derived(
		canGoNext ? steps[currentStepIndex + 1]?.shortLabel || steps[currentStepIndex + 1]?.label : null
	);
	const prevStepLabel = $derived(
		canGoPrevious
			? steps[currentStepIndex - 1]?.shortLabel || steps[currentStepIndex - 1]?.label
			: null
	);

	$effect(() => {
		currentStepIndex;
		scrollTo({ top: 0, behavior: 'smooth' });
	});

	// Track transition direction for animations
	let transitionDirection = $state<'forward' | 'backward'>('forward');

	function nextStep() {
		if (canGoNext) {
			transitionDirection = 'forward';
			activeStep = stepOrder[currentStepIndex + 1];
		}
	}

	function previousStep() {
		if (canGoPrevious) {
			transitionDirection = 'backward';
			activeStep = stepOrder[currentStepIndex - 1];
		}
	}

	async function handleSave() {
		if (!isBasicInfoValid) {
			toast.error('Please complete required fields in Basic Information');
			activeStep = 'basic';
			return;
		}

		isSaving = true;

		// Simulate saving delay for design purposes
		await new Promise((resolve) => setTimeout(resolve, 1500));

		isSaving = false;

		// Show success message (design mode - no actual saving)
		toast.success('Sitio created successfully!', {
			description: `${sitioName || 'New sitio'} has been added to the database.`
		});

		// Optionally redirect back
		// goto('/admin/sitios');
	}

	function handleCancel() {
		cancelDialogOpen = true;
	}

	function confirmCancel() {
		window.location.href = '/admin/sitios';
	}
</script>

<svelte:head>
	<title>Create New Sitio - Admin</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-linear-to-b from-muted/30 via-background to-muted/20">
	<!-- Header -->
	<AdminHeader sticky title="Create New Sitio" description="Enter sitio data step by step">
		{#snippet actions()}
			<div class="flex items-center gap-2">
				<Button variant="ghost" onclick={handleCancel} disabled={isSaving} size="sm" class="gap-2">
					<X class="size-4" />
					<span class="hidden sm:inline">Cancel</span>
				</Button>
				<Button
					onclick={handleSave}
					disabled={!canSave || isSaving}
					size="sm"
					class={cn(
						'gap-2 transition-all duration-300',
						canSave &&
							!isSaving &&
							'bg-linear-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
					)}
				>
					{#if isSaving}
						<Loader2 class="size-4 animate-spin" />
						<span class="hidden sm:inline">Saving...</span>
					{:else}
						<Save class="size-4" />
						<span class="hidden sm:inline">Create Sitio</span>
					{/if}
				</Button>
			</div>
		{/snippet}
	</AdminHeader>

	<!-- Content -->
	<div class="flex-1 p-4 md:p-6 lg:p-8">
		<div class="mx-auto max-w-7xl">
			<div class="flex flex-col gap-6 lg:flex-row lg:gap-8">
				<!-- Stepper Sidebar -->
				<FormStepper {steps} bind:activeStep />

				<!-- Form Content -->
				<div class="min-w-0 flex-1">
					<!-- Section Header with Progress Indicator -->
					<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20"
							>
								{#if activeStep === 'basic'}
									<MapPin class="size-5" />
								{:else if activeStep === 'demographics'}
									<Users class="size-5" />
								{:else if activeStep === 'livelihoods'}
									<Sprout class="size-5" />
								{:else if activeStep === 'infrastructure'}
									<Building class="size-5" />
								{:else if activeStep === 'needs-assessment'}
									<AlertTriangle class="size-5" />
								{:else}
									<Image class="size-5" />
								{/if}
							</div>
							<div>
								<h2 class="text-lg font-semibold">{steps[currentStepIndex]?.label}</h2>
								<p class="text-sm text-muted-foreground">
									Step {currentStepIndex + 1} of {stepOrder.length}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2 text-sm">
							<Sparkles class="size-4 text-amber-500" />
							<span class="text-muted-foreground">
								Fields marked with <span class="font-medium text-destructive">*</span> are required
							</span>
						</div>
					</div>

					<!-- Form Content with Transitions -->
					<div class="relative min-h-125">
						{#key activeStep}
							<div
								class="animate-in duration-300 fade-in-0"
								in:fly={{ x: transitionDirection === 'forward' ? 20 : -20, duration: 200 }}
							>
								{#if activeStep === 'basic'}
									<BasicInfoTab
										bind:municipality
										bind:barangay
										bind:sitioName
										bind:sitioCode
										bind:latitude
										bind:longitude
										bind:sitioClassification
										bind:mainAccess
									/>
								{:else if activeStep === 'demographics'}
									<DemographicsSocialTab
										bind:totalPopulation
										bind:totalHouseholds
										bind:registeredVoters
										bind:laborForceCount
										bind:schoolAgeChildren
										bind:totalMale={population.totalMale}
										bind:totalFemale={population.totalFemale}
										bind:vulnerableGroups
									/>
								{:else if activeStep === 'livelihoods'}
									<LivelihoodsEconomyTab
										bind:workerClass
										bind:averageDailyIncome
										bind:agriculture
										bind:crops
										bind:livestock
									/>
								{:else if activeStep === 'infrastructure'}
									<InfrastructureHousingTab
										bind:householdsWithToilet
										bind:householdsWithElectricity
										bind:electricitySources
										bind:mobileSignal
										bind:householdsWithInternet
										bind:facilities
										bind:infrastructure
										bind:studentsPerRoom
										bind:waterSources
										bind:sanitationTypes
									/>
								{:else if activeStep === 'needs-assessment'}
									<NeedsAssessmentTab bind:hazards bind:foodSecurity bind:priorities />
								{:else if activeStep === 'images'}
									<SitioImagesTab bind:images />
								{/if}
							</div>
						{/key}
					</div>

					<!-- Navigation Buttons -->
					<Card.Root
						class="mt-6 overflow-hidden border-0 bg-linear-to-r from-card to-muted/30 py-0 shadow-lg"
					>
						<Card.Content class="p-0">
							<div class="flex items-center justify-between p-4">
								<Button
									variant="ghost"
									onclick={previousStep}
									disabled={!canGoPrevious}
									class={cn(
										'gap-2 transition-all',
										canGoPrevious && 'hover:bg-muted hover:text-foreground'
									)}
								>
									<ArrowLeft class="size-4" />
									<span class="hidden sm:inline">{prevStepLabel || 'Previous'}</span>
									<span class="sm:hidden">Back</span>
								</Button>

								<div class="flex items-center gap-3">
									<!-- Step dots for mobile -->
									<div class="flex items-center gap-1.5 lg:hidden">
										{#each steps as step, index}
											{@const isActive = index === currentStepIndex}
											{@const isCompleted = step.isValid}
											<button
												type="button"
												onclick={() => (activeStep = step.id)}
												class={cn(
													'h-2 rounded-full transition-all duration-300',
													isActive && 'w-6 bg-primary shadow-md shadow-primary/30',
													!isActive && isCompleted && 'w-2 bg-emerald-500',
													!isActive &&
														!isCompleted &&
														'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
												)}
												aria-label="Go to step {index + 1}"
											></button>
										{/each}
									</div>
									<!-- Step text for desktop -->
									<div class="hidden items-center gap-2 lg:flex">
										<div class="flex items-center gap-1">
											{#each steps as step, index}
												{@const isCompleted = step.isValid}
												{#if isCompleted}
													<CheckCircle2 class="size-4 text-emerald-500" />
												{/if}
											{/each}
										</div>
										<span class="text-sm text-muted-foreground">
											{steps.filter((s) => s.isValid).length} of {stepOrder.length} sections complete
										</span>
									</div>
								</div>

								{#if canGoNext}
									<Button
										onclick={nextStep}
										class="gap-2 bg-linear-to-r from-primary to-primary/80 shadow-md transition-all hover:shadow-lg hover:shadow-primary/20"
									>
										<span class="hidden sm:inline">{nextStepLabel || 'Next'}</span>
										<span class="sm:hidden">Next</span>
										<ArrowRight class="size-4" />
									</Button>
								{:else}
									<Button
										onclick={handleSave}
										disabled={!canSave || isSaving}
										class={cn(
											'gap-2 transition-all',
											canSave &&
												!isSaving &&
												'bg-linear-to-r from-emerald-600 to-emerald-500 shadow-md hover:shadow-lg hover:shadow-emerald-500/20'
										)}
									>
										{#if isSaving}
											<Loader2 class="size-4 animate-spin" />
										{:else}
											<Save class="size-4" />
										{/if}
										<span class="hidden sm:inline">{isSaving ? 'Saving...' : 'Create Sitio'}</span>
										<span class="sm:hidden">{isSaving ? '...' : 'Save'}</span>
									</Button>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Cancel Confirmation Dialog -->
<AlertDialog.Root bind:open={cancelDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Discard Changes</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to cancel? Any unsaved changes will be lost.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Continue Editing</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmCancel} class="bg-destructive hover:bg-destructive/60">
				Discard Changes
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
