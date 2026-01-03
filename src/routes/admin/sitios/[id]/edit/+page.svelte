<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import CustomFieldsTab from '$lib/components/admin/sitios/CustomFieldsTab.svelte';
	import DemographicsSocialTab from '$lib/components/admin/sitios/DemographicsSocialTab.svelte';
	import InfrastructureHousingTab from '$lib/components/admin/sitios/InfrastructureHousingTab.svelte';
	import LivelihoodsEconomyTab from '$lib/components/admin/sitios/LivelihoodsEconomyTab.svelte';
	import NeedsAssessmentTab from '$lib/components/admin/sitios/NeedsAssessmentTab.svelte';
	import SitioImagesTab from '$lib/components/admin/sitios/SitioImagesTab.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { FormStepper, type Step } from '$lib/components/ui/form-stepper';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { PriorityItem, SitioRecord } from '$lib/types';
	import { cn } from '$lib/utils';
	import { getActiveCustomFieldDefinitions } from '$lib/utils/custom-fields-storage';
	import { loadSitios, updateSitio } from '$lib/utils/storage';
	import {
		AlertTriangle,
		ArrowLeft,
		ArrowRight,
		Building,
		Calendar,
		CheckCircle2,
		Copy,
		Image,
		Layers,
		Loader2,
		MapPin,
		Pencil,
		Plus,
		Save,
		Sparkles,
		Sprout,
		Trash2,
		Users,
		X
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
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
		frequency: number;
	};

	interface Props {
		data: {
			id: string;
			year: string;
		};
	}

	let { data }: Props = $props();

	// Parse sitio ID
	const sitioId = $derived(parseInt(data.id));

	// State
	let sitio = $state<SitioRecord | null>(null);
	let selectedYear = $state<string>('');
	let isLoading = $state(true);
	let isSaving = $state(false);
	let activeStep = $state('demographics');
	let cancelDialogOpen = $state(false);
	let addYearDialogOpen = $state(false);
	let deleteYearDialogOpen = $state(false);
	let hasUnsavedChanges = $state(false);
	let newYearInput = $state('');

	// Permission checks
	const canEditCore = $derived(authStore.canEditCoreIdentifiers());
	const canDeleteYear = $derived(authStore.canDeleteYearlyData());

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
		flood: { frequency: 0 },
		landslide: { frequency: 0 },
		drought: { frequency: 0 },
		earthquake: { frequency: 0 }
	});
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

	// ===== Section K: Recommendations =====
	let averageNeedScore = $state(0);
	let recommendations = $state<import('$lib/types').PPARecommendation[]>([]);

	// ===== Images (stored separately) =====
	let images = $state<
		Array<{
			id: string;
			caption?: string;
			uploaded_at: string;
		}>
	>([]);

	// ===== Custom Fields (Dynamic Form Builder) =====
	let customFields = $state<Record<string, unknown>>({});
	let hasActiveCustomFields = $state(false);

	// Validation
	const isDemographicsValid = $derived(totalPopulation > 0 || totalHouseholds > 0);

	const canSave = $derived(isDemographicsValid);

	// Step configuration - NO basic info for normal edit
	const steps: Step[] = $derived([
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
		// Only show custom fields tab if there are active custom field definitions
		...(hasActiveCustomFields
			? [
					{
						id: 'custom-fields',
						label: 'Custom Fields',
						shortLabel: 'Custom',
						icon: Layers,
						isValid: Object.keys(customFields).length > 0
					}
				]
			: []),
		{
			id: 'images',
			label: 'Photos & Images',
			shortLabel: 'Images',
			icon: Image,
			isValid: true
		}
	]);

	// Step navigation - dynamically include custom-fields if active
	const stepOrder = $derived([
		'demographics',
		'livelihoods',
		'infrastructure',
		'needs-assessment',
		...(hasActiveCustomFields ? ['custom-fields'] : []),
		'images'
	]);
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

	let transitionDirection = $state<'forward' | 'backward'>('forward');

	// Load sitio data
	onMount(() => {
		const sitios = loadSitios();
		const found = sitios.find((s) => s.id === sitioId);

		// Check if there are active custom fields
		hasActiveCustomFields = getActiveCustomFieldDefinitions().length > 0;

		if (found) {
			sitio = found;
			// Set selected year
			if (data.year === 'latest' && found.availableYears.length > 0) {
				selectedYear = Math.max(...found.availableYears).toString();
			} else if (found.availableYears.includes(parseInt(data.year))) {
				selectedYear = data.year;
			} else if (found.availableYears.length > 0) {
				selectedYear = Math.max(...found.availableYears).toString();
			}

			loadYearData();
		}
		isLoading = false;
	});

	function loadYearData() {
		if (!sitio || !selectedYear) return;

		const yearData = sitio.yearlyData[selectedYear];
		if (!yearData) return;

		// Load year-specific data
		totalPopulation = yearData.totalPopulation || 0;
		totalHouseholds = yearData.totalHouseholds || 0;
		registeredVoters = yearData.registeredVoters || 0;
		laborForceCount = yearData.laborForceCount || 0;
		schoolAgeChildren = yearData.schoolAgeChildren || 0;
		population = yearData.population
			? { ...yearData.population }
			: { totalMale: 0, totalFemale: 0 };
		vulnerableGroups = yearData.vulnerableGroups
			? { ...yearData.vulnerableGroups }
			: {
					muslimCount: 0,
					ipCount: 0,
					seniorsCount: 0,
					laborForce60to64Count: 0,
					unemployedCount: 0,
					noBirthCertCount: 0,
					noNationalIDCount: 0,
					outOfSchoolYouth: 0
				};

		householdsWithToilet = yearData.householdsWithToilet || 0;
		householdsWithElectricity = yearData.householdsWithElectricity || 0;
		electricitySources = yearData.electricitySources
			? { ...yearData.electricitySources }
			: { grid: 0, solar: 0, battery: 0, generator: 0 };
		mobileSignal = yearData.mobileSignal || 'none';
		householdsWithInternet = yearData.householdsWithInternet || 0;

		if (yearData.facilities) {
			facilities = JSON.parse(JSON.stringify(yearData.facilities));
		}
		if (yearData.infrastructure) {
			infrastructure = JSON.parse(JSON.stringify(yearData.infrastructure));
		}

		studentsPerRoom = yearData.studentsPerRoom || 'less_than_46';

		if (yearData.waterSources) {
			waterSources = JSON.parse(JSON.stringify(yearData.waterSources));
		}
		if (yearData.sanitationTypes) {
			sanitationTypes = { ...yearData.sanitationTypes };
		}

		workerClass = yearData.workerClass
			? { ...yearData.workerClass }
			: {
					privateHousehold: 0,
					privateEstablishment: 0,
					government: 0,
					selfEmployed: 0,
					employer: 0,
					ofw: 0
				};
		averageDailyIncome = yearData.averageDailyIncome || 0;
		agriculture = yearData.agriculture
			? { ...yearData.agriculture }
			: {
					numberOfFarmers: 0,
					numberOfAssociations: 0,
					estimatedFarmAreaHectares: 0
				};
		crops = yearData.crops ? [...yearData.crops] : [];
		livestock = yearData.livestock ? [...yearData.livestock] : [];

		if (yearData.hazards) {
			hazards = JSON.parse(JSON.stringify(yearData.hazards));
		}
		foodSecurity = yearData.foodSecurity || 'secure';

		if (yearData.priorities) {
			priorities = JSON.parse(JSON.stringify(yearData.priorities));
		}

		averageNeedScore = yearData.averageNeedScore || 0;
		recommendations = yearData.recommendations
			? JSON.parse(JSON.stringify(yearData.recommendations))
			: [];

		// Load custom fields
		customFields = yearData.customFields ? { ...yearData.customFields } : {};

		hasUnsavedChanges = false;
	}

	function handleYearChange(year: string) {
		selectedYear = year;
		loadYearData();
	}

	function handleAddYear() {
		const currentYear = new Date().getFullYear();
		newYearInput = (currentYear + 1).toString();
		addYearDialogOpen = true;
	}

	function confirmAddYear() {
		if (!sitio) return;

		const newYear = parseInt(newYearInput);

		// Validation
		if (isNaN(newYear) || newYear < 2000 || newYear > 2100) {
			toast.error('Please enter a valid year between 2000 and 2100');
			return;
		}

		if (sitio.availableYears.includes(newYear)) {
			toast.error(`Data for ${newYear} already exists. Please select it from the dropdown.`);
			return;
		}

		// Copy latest year's data as baseline
		const latestYear = Math.max(...sitio.availableYears);
		const latestData = sitio.yearlyData[latestYear.toString()];

		// Create new year data with copied values
		const newYearData = latestData
			? JSON.parse(JSON.stringify(latestData))
			: {
					totalPopulation: 0,
					totalHouseholds: 0,
					registeredVoters: 0,
					laborForceCount: 0,
					schoolAgeChildren: 0,
					population: { totalMale: 0, totalFemale: 0 },
					vulnerableGroups: {
						muslimCount: 0,
						ipCount: 0,
						seniorsCount: 0,
						laborForce60to64Count: 0,
						unemployedCount: 0,
						noBirthCertCount: 0,
						noNationalIDCount: 0,
						outOfSchoolYouth: 0
					},
					householdsWithToilet: 0,
					householdsWithElectricity: 0,
					electricitySources: { grid: 0, solar: 0, battery: 0, generator: 0 },
					mobileSignal: 'none' as const,
					householdsWithInternet: 0,
					facilities: {
						healthCenter: { exists: 'no' as const },
						pharmacy: { exists: 'no' as const },
						communityToilet: { exists: 'no' as const },
						kindergarten: { exists: 'no' as const },
						elementarySchool: { exists: 'no' as const },
						highSchool: { exists: 'no' as const },
						madrasah: { exists: 'no' as const },
						market: { exists: 'no' as const }
					},
					infrastructure: {
						asphalt: { exists: 'no' as const },
						concrete: { exists: 'no' as const },
						gravel: { exists: 'no' as const },
						natural: { exists: 'no' as const }
					},
					studentsPerRoom: 'less_than_46' as const,
					waterSources: {
						natural: { exists: 'no' as const },
						level1: { exists: 'no' as const },
						level2: { exists: 'no' as const },
						level3: { exists: 'no' as const }
					},
					sanitationTypes: {
						waterSealed: false,
						pitLatrine: false,
						communityCR: false,
						openDefecation: false
					},
					workerClass: {
						privateHousehold: 0,
						privateEstablishment: 0,
						government: 0,
						selfEmployed: 0,
						employer: 0,
						ofw: 0
					},
					averageDailyIncome: 0,
					agriculture: {
						numberOfFarmers: 0,
						numberOfAssociations: 0,
						estimatedFarmAreaHectares: 0
					},
					crops: [],
					livestock: [],
					hazards: {
						flood: { frequency: 0 },
						landslide: { frequency: 0 },
						drought: { frequency: 0 },
						earthquake: { frequency: 0 }
					},
					foodSecurity: 'secure' as const,
					priorities: [
						{ name: 'waterSystem' as const, rating: 0 },
						{ name: 'communityCR' as const, rating: 0 },
						{ name: 'solarStreetLights' as const, rating: 0 },
						{ name: 'roadOpening' as const, rating: 0 },
						{ name: 'farmTools' as const, rating: 0 },
						{ name: 'healthServices' as const, rating: 0 },
						{ name: 'educationSupport' as const, rating: 0 }
					],
					averageNeedScore: 0,
					recommendations: []
				};

		// Update sitio record
		const updatedYearlyData = {
			...sitio.yearlyData,
			[newYear.toString()]: newYearData
		};

		const newAvailableYears = [...sitio.availableYears, newYear].sort((a, b) => a - b);

		const success = updateSitio(sitio.id, {
			yearlyData: updatedYearlyData,
			availableYears: newAvailableYears,
			updatedAt: new Date().toISOString()
		});

		if (success) {
			// Refresh sitio data
			const sitios = loadSitios();
			sitio = sitios.find((s) => s.id === sitioId) || null;

			// Switch to new year
			selectedYear = newYear.toString();
			loadYearData();

			toast.success(`Added data entry for ${newYear}`, {
				description: latestData
					? `Copied baseline data from ${latestYear}`
					: 'Created with empty data'
			});
		} else {
			toast.error('Failed to add new year data');
		}

		addYearDialogOpen = false;
	}

	function handleDeleteYear() {
		if (!canDeleteYear) {
			toast.error('You do not have permission to delete year data');
			return;
		}
		deleteYearDialogOpen = true;
	}

	function confirmDeleteYear() {
		if (!sitio || !selectedYear) return;

		// Must keep at least one year
		if (sitio.availableYears.length <= 1) {
			toast.error('Cannot delete the last remaining year data');
			deleteYearDialogOpen = false;
			return;
		}

		const yearToDelete = parseInt(selectedYear);

		// Remove the year from yearlyData
		const { [selectedYear]: _, ...remainingYearlyData } = sitio.yearlyData;
		const newAvailableYears = sitio.availableYears.filter((y) => y !== yearToDelete);

		const success = updateSitio(sitio.id, {
			yearlyData: remainingYearlyData,
			availableYears: newAvailableYears,
			updatedAt: new Date().toISOString()
		});

		if (success) {
			// Refresh sitio data
			const sitios = loadSitios();
			sitio = sitios.find((s) => s.id === sitioId) || null;

			// Switch to latest available year
			if (sitio && sitio.availableYears.length > 0) {
				selectedYear = Math.max(...sitio.availableYears).toString();
				loadYearData();
			}

			toast.success(`Deleted data for ${yearToDelete}`);
		} else {
			toast.error('Failed to delete year data');
		}

		deleteYearDialogOpen = false;
	}

	$effect(() => {
		currentStepIndex;
		scrollTo({ top: 0, behavior: 'smooth' });
	});

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
		if (!sitio || !selectedYear) {
			toast.error('No sitio or year selected');
			return;
		}

		isSaving = true;

		// Get existing year data to preserve core identifiers
		const existingYearData = sitio.yearlyData[selectedYear];

		// Build the updated year data - include core identifiers from sitio record for type compatibility
		const updatedYearData = {
			// Core identifiers (from sitio record, not editable in normal mode)
			municipality: sitio.municipality,
			barangay: sitio.barangay,
			sitioName: sitio.sitioName,
			sitioCode: sitio.coding,
			latitude: sitio.latitude,
			longitude: sitio.longitude,
			sitioClassification: { ...sitio.sitioClassification },
			mainAccess: existingYearData?.mainAccess || {
				pavedRoad: false,
				unpavedRoad: false,
				footpath: false,
				boat: false
			},
			// Yearly data fields
			totalPopulation,
			totalHouseholds,
			registeredVoters,
			laborForceCount,
			schoolAgeChildren,
			population: { ...population },
			vulnerableGroups: { ...vulnerableGroups },
			householdsWithToilet,
			householdsWithElectricity,
			electricitySources: { ...electricitySources },
			mobileSignal,
			householdsWithInternet,
			facilities: JSON.parse(JSON.stringify(facilities)),
			infrastructure: JSON.parse(JSON.stringify(infrastructure)),
			studentsPerRoom,
			waterSources: JSON.parse(JSON.stringify(waterSources)),
			sanitationTypes: { ...sanitationTypes },
			workerClass: { ...workerClass },
			averageDailyIncome,
			agriculture: { ...agriculture },
			crops: [...crops],
			livestock: [...livestock],
			hazards: JSON.parse(JSON.stringify(hazards)),
			foodSecurity,
			priorities: JSON.parse(JSON.stringify(priorities)),
			averageNeedScore,
			recommendations: JSON.parse(JSON.stringify(recommendations)),
			// Custom fields from Dynamic Form Builder
			customFields: { ...customFields }
		};

		// Update only the yearly data, not the core identifiers
		const updatedYearlyData = {
			...sitio.yearlyData,
			[selectedYear]: updatedYearData
		};

		const success = updateSitio(sitio.id, {
			yearlyData: updatedYearlyData,
			updatedAt: new Date().toISOString()
		});

		// Simulate slight delay for UX
		await new Promise((resolve) => setTimeout(resolve, 500));

		isSaving = false;

		if (success) {
			toast.success('Sitio updated successfully!', {
				description: `${sitio.sitioName} (${selectedYear}) has been updated.`
			});
			hasUnsavedChanges = false;

			// Refresh sitio data
			const sitios = loadSitios();
			sitio = sitios.find((s) => s.id === sitioId) || null;
		} else {
			toast.error('Failed to update sitio');
		}
	}

	function handleCancel() {
		if (hasUnsavedChanges) {
			cancelDialogOpen = true;
		} else {
			goto('/admin/sitios');
		}
	}

	function confirmCancel() {
		goto('/admin/sitios');
	}

	// Track changes
	$effect(() => {
		// This will trigger on any form field change
		totalPopulation;
		totalHouseholds;
		if (sitio && selectedYear) {
			hasUnsavedChanges = true;
		}
	});
</script>

<svelte:head>
	<title>Edit {sitio?.sitioName || 'Sitio'} - Admin</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loader2 class="size-8 animate-spin text-muted-foreground" />
	</div>
{:else if !sitio}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="mb-4 text-3xl font-bold">Sitio Not Found</h1>
			<p class="mb-6 text-muted-foreground">The sitio you're looking for doesn't exist.</p>
			<Button href="/admin/sitios">
				<ArrowLeft class="mr-2" />
				Back to Sitios
			</Button>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen flex-col bg-linear-to-b from-muted/30 via-background to-muted/20">
		<!-- Header -->
		<AdminHeader
			sticky
			title="Edit Yearly Data"
			description="Update {sitio.sitioName} data for {selectedYear}"
			breadcrumbs={[
				{ label: 'Sitios', href: '/admin/sitios' },
				{ label: sitio.sitioName || 'Edit' }
			]}
		>
			{#snippet badges()}
				<!-- Year Selector with Add/Delete options -->
				<div class="flex items-center gap-2">
					<Select.Root type="single" value={selectedYear} onValueChange={handleYearChange}>
						<Select.Trigger class="h-8 w-28 text-xs">
							<Calendar class="mr-1.5 size-3.5" />
							{selectedYear}
						</Select.Trigger>
						<Select.Content>
							{#each [...(sitio?.availableYears ?? [])].sort((a, b) => b - a) as year}
								<Select.Item value={year.toString()}>{year}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					<Button variant="outline" size="sm" class="h-8 gap-1.5" onclick={handleAddYear}>
						<Plus class="size-3.5" />
						<span class="hidden sm:inline">Add Year</span>
					</Button>

					{#if canDeleteYear && (sitio?.availableYears?.length ?? 0) > 1}
						<Button
							variant="outline"
							size="sm"
							class="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
							onclick={handleDeleteYear}
						>
							<Trash2 class="size-3.5" />
						</Button>
					{/if}
				</div>
			{/snippet}
			{#snippet actions()}
				<div class="flex items-center gap-2">
					<!-- {#if canEditCore && sitio}
						<Button
							variant="outline"
							size="sm"
							class="gap-2"
							href="/admin/sitios/{sitio.id}/edit/full"
						>
							<Settings class="size-4" />
							<span class="hidden sm:inline">Full Edit</span>
						</Button>
					{/if} -->
					<Button
						variant="ghost"
						onclick={handleCancel}
						disabled={isSaving}
						size="sm"
						class="gap-2"
					>
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
							<span class="hidden sm:inline">Save Changes</span>
						{/if}
					</Button>
				</div>
			{/snippet}
		</AdminHeader>

		<!-- Sitio Core Info Banner (read-only) -->
		<div class="border-b bg-muted/30 px-4 py-3 md:px-6">
			<div class="mx-auto max-w-7xl">
				<div class="flex flex-wrap items-center gap-3 text-sm">
					<div class="flex items-center gap-2">
						<MapPin class="size-4 text-muted-foreground" />
						<span class="font-medium">{sitio.sitioName}</span>
						<span class="text-muted-foreground">•</span>
						<span class="text-muted-foreground">{sitio.barangay}, {sitio.municipality}</span>
					</div>
					{#if sitio.coding}
						<Badge variant="outline" class="gap-1">
							<span class="text-xs">Code: {sitio.coding}</span>
						</Badge>
					{/if}
					{#if sitio.sitioClassification.gida}
						<Badge variant="secondary" class="text-xs">GIDA</Badge>
					{/if}
					{#if sitio.sitioClassification.indigenous}
						<Badge variant="secondary" class="text-xs">IP</Badge>
					{/if}
					{#if sitio.sitioClassification.conflict}
						<Badge variant="destructive" class="text-xs">Conflict</Badge>
					{/if}
					{#if canEditCore}
						<Button
							variant="ghost"
							size="sm"
							class="h-6 gap-1 px-2 text-xs"
							href="/admin/sitios/{sitio.id}/edit/full"
						>
							<Pencil class="size-3" />
							Edit Core Info
						</Button>
					{/if}
				</div>
			</div>
		</div>

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
									{#if activeStep === 'demographics'}
										<Users class="size-5" />
									{:else if activeStep === 'livelihoods'}
										<Sprout class="size-5" />
									{:else if activeStep === 'infrastructure'}
										<Building class="size-5" />
									{:else if activeStep === 'needs-assessment'}
										<AlertTriangle class="size-5" />
									{:else if activeStep === 'custom-fields'}
										<Layers class="size-5" />
									{:else}
										<Image class="size-5" />
									{/if}
								</div>
								<div>
									<h2 class="text-lg font-semibold">{steps[currentStepIndex]?.label}</h2>
									<p class="text-sm text-muted-foreground">
										Step {currentStepIndex + 1} of {stepOrder.length} • Year {selectedYear}
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
									{#if activeStep === 'demographics'}
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
									{:else if activeStep === 'custom-fields'}
										<CustomFieldsTab bind:customFields />
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
												{#each steps as step}
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
											<span class="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span
											>
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

	<!-- Add Year Dialog -->
	<AlertDialog.Root bind:open={addYearDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Add Year Data</AlertDialog.Title>
				<AlertDialog.Description>
					Enter the year for which you want to add data. The data will be copied from the latest
					available year as a baseline.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<div class="py-4">
				<Label for="newYear">Year</Label>
				<Input
					id="newYear"
					type="number"
					bind:value={newYearInput}
					min="2000"
					max="2100"
					class="mt-2"
				/>
				<p class="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
					<Copy class="mt-0.5 size-4 shrink-0" />
					Data will be copied from {sitio?.availableYears?.length
						? Math.max(...sitio.availableYears)
						: 'empty template'} as starting point
				</p>
			</div>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action onclick={confirmAddYear}>Add Year</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<!-- Delete Year Confirmation Dialog -->
	<AlertDialog.Root bind:open={deleteYearDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete Year Data</AlertDialog.Title>
				<AlertDialog.Description>
					Are you sure you want to delete data for <strong>{selectedYear}</strong>? This action
					cannot be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action
					onclick={confirmDeleteYear}
					class="bg-destructive hover:bg-destructive/60"
				>
					Delete Year Data
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
