<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import BasicInfoTab from '$lib/components/admin/sitios/BasicInfoTab.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { SitioRecord } from '$lib/types';
	import { cn } from '$lib/utils';
	import { addSitio, loadSitios } from '$lib/utils/storage';
	import { ArrowLeft, ArrowRight, Info, Loader2, MapPin, Plus, Shield, X } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// Permission check
	const canCreate = $derived(authStore.canCreateSitio());

	// State
	let isSaving = $state(false);
	let cancelDialogOpen = $state(false);
	let hasUnsavedChanges = $state(false);
	let isLoading = $state(true);

	// ===== Core Identifiers Only =====
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

	// Validation
	const isBasicInfoValid = $derived(
		municipality.trim() !== '' && barangay.trim() !== '' && sitioName.trim() !== ''
	);

	const canSave = $derived(isBasicInfoValid);

	onMount(() => {
		// Check permission
		if (!canCreate) {
			toast.error('You do not have permission to create new sitios');
			goto('/admin/sitios');
			return;
		}
		isLoading = false;
	});

	async function handleSave() {
		if (!isBasicInfoValid) {
			toast.error('Please complete required fields in Basic Information');
			return;
		}

		isSaving = true;

		// Get current year for initial data entry
		const currentYear = new Date().getFullYear();

		// Generate a new ID
		const existingSitios = loadSitios();
		const newId = existingSitios.length > 0 ? Math.max(...existingSitios.map((s) => s.id)) + 1 : 1;

		// Build main access object
		const mainAccessObj = {
			pavedRoad: mainAccess === 'pavedRoad',
			unpavedRoad: mainAccess === 'unpavedRoad',
			footpath: mainAccess === 'footpath',
			boat: mainAccess === 'boat'
		};

		// Create empty initial year data (includes core identifiers for SitioProfile type compatibility)
		const initialYearData = {
			// Core identifiers (for SitioProfile type compatibility)
			municipality,
			barangay,
			sitioName,
			sitioCode,
			latitude,
			longitude,
			sitioClassification: { ...sitioClassification },
			mainAccess: mainAccessObj,
			// Yearly data fields
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
			crops: [] as string[],
			livestock: [] as string[],
			hazards: {
				flood: { frequency: 0 },
				landslide: { frequency: 0 },
				drought: { frequency: 0 },
				earthquake: { frequency: 0 }
			},
			foodSecurity: 'secure' as const,
			priorities: [
				{ name: 'waterSystem' as const, rating: 0 as const },
				{ name: 'communityCR' as const, rating: 0 as const },
				{ name: 'solarStreetLights' as const, rating: 0 as const },
				{ name: 'roadOpening' as const, rating: 0 as const },
				{ name: 'farmTools' as const, rating: 0 as const },
				{ name: 'healthServices' as const, rating: 0 as const },
				{ name: 'educationSupport' as const, rating: 0 as const }
			],
			averageNeedScore: 0,
			recommendations: []
		};

		// Create new sitio record
		const newSitio: SitioRecord = {
			id: newId,
			municipality,
			barangay,
			sitioName,
			coding: sitioCode,
			latitude,
			longitude,
			sitioClassification: { ...sitioClassification },
			yearlyData: {
				[currentYear.toString()]: initialYearData
			},
			availableYears: [currentYear],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const success = addSitio(newSitio);

		// Simulate slight delay for UX
		await new Promise((resolve) => setTimeout(resolve, 500));

		isSaving = false;

		if (success) {
			toast.success('Sitio created successfully!', {
				description: `${sitioName} has been added. You can now add yearly data.`
			});

			// Redirect to the edit page for the new sitio to add yearly data
			goto(`/admin/sitios/${newId}/edit?year=${currentYear}`);
		} else {
			toast.error('Failed to create sitio');
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
		municipality;
		barangay;
		sitioName;
		sitioCode;
		if (municipality || barangay || sitioName) {
			hasUnsavedChanges = true;
		}
	});
</script>

<svelte:head>
	<title>Create New Sitio - Admin</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loader2 class="size-8 animate-spin text-muted-foreground" />
	</div>
{:else if !canCreate}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<Shield class="mx-auto mb-4 size-16 text-destructive/50" />
			<h1 class="mb-4 text-3xl font-bold">Access Denied</h1>
			<p class="mb-6 text-muted-foreground">
				You do not have permission to create new sitios. Only superadmins can create new sitio
				entries.
			</p>
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
			title="Create New Sitio"
			description="Register a new sitio entry"
			breadcrumbs={[{ label: 'Sitios', href: '/admin/sitios' }, { label: 'New Sitio' }]}
		>
			<!-- {#snippet badges()}
				<Badge variant="secondary" class="gap-1.5">
					<Shield class="size-3" />
					Superadmin Only
				</Badge>
			{/snippet} -->
			{#snippet actions()}
				<div class="flex items-center gap-2">
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
							<span class="hidden sm:inline">Creating...</span>
						{:else}
							<Plus class="size-4" />
							<span class="hidden sm:inline">Create Sitio</span>
						{/if}
					</Button>
				</div>
			{/snippet}
		</AdminHeader>

		<!-- Info Banner -->
		<div class="border-b border-blue-500/30 bg-blue-500/10 px-4 py-3 md:px-6">
			<div class="mx-auto max-w-7xl">
				<div class="flex items-start gap-3 text-sm">
					<Info class="mt-0.5 size-5 shrink-0 text-blue-600" />
					<div>
						<p class="font-medium text-blue-800 dark:text-blue-200">Creating a new sitio entry</p>
						<p class="mt-1 text-blue-700 dark:text-blue-300">
							Enter the core identification information for the sitio. After creating the sitio, you
							will be redirected to add yearly data (demographics, infrastructure, etc.).
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 p-4 md:p-6 lg:p-8">
			<div class="mx-auto max-w-4xl">
				<!-- Form Content -->
				<Card.Root class="gap-0 overflow-hidden border-0 py-0 shadow-xl">
					<Card.Header class="border-b bg-muted/30 p-5">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20"
							>
								<MapPin class="size-5" />
							</div>
							<div>
								<Card.Title>Core Sitio Information</Card.Title>
								<Card.Description>
									Location, classification, and identification details
								</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="p-6">
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
					</Card.Content>
				</Card.Root>

				<!-- Next Steps Info -->
				<Card.Root class="mt-6 gap-0 overflow-hidden border-emerald-500/30 py-0 shadow-lg">
					<Card.Header class="border-b border-emerald-500/20 bg-emerald-500/5 p-5">
						<div class="flex items-center gap-3">
							<ArrowRight class="size-5 text-emerald-600" />
							<div>
								<Card.Title class="text-emerald-800 dark:text-emerald-200">Next Steps</Card.Title>
								<Card.Description class="text-emerald-700 dark:text-emerald-300">
									What happens after you create the sitio
								</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="p-6">
						<ol class="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
							<li>The sitio will be created with the core information you provided above</li>
							<li>
								An empty data entry for the current year ({new Date().getFullYear()}) will be
								created
							</li>
							<li>
								You will be redirected to the edit page to fill in yearly data (demographics,
								infrastructure, priority needs, etc.)
							</li>
							<li>Regular admins can then update yearly data going forward</li>
						</ol>
					</Card.Content>
				</Card.Root>

				<!-- Action Buttons -->
				<div class="mt-6 flex items-center justify-end gap-3">
					<Button variant="outline" onclick={handleCancel} disabled={isSaving}>Cancel</Button>
					<Button
						onclick={handleSave}
						disabled={!canSave || isSaving}
						class={cn(
							'gap-2',
							canSave &&
								!isSaving &&
								'bg-linear-to-r from-primary to-primary/80 shadow-md hover:shadow-lg'
						)}
					>
						{#if isSaving}
							<Loader2 class="size-4 animate-spin" />
							Creating...
						{:else}
							<Plus class="size-4" />
							Create Sitio
						{/if}
					</Button>
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
					Are you sure you want to cancel? Any entered information will be lost.
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
{/if}
