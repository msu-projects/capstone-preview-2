<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { FormSection } from '$lib/components/ui/form-section';
	import { HelpTooltip } from '$lib/components/ui/help-tooltip';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { LocationPicker } from '$lib/components/ui/location-picker';
	import * as Popover from '$lib/components/ui/popover';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { MUNICIPALITIES, getBarangaysForMunicipality } from '$lib/config/location-data';
	import { cn } from '$lib/utils';
	import toTitleCase from '$lib/utils/common';
	import {
		Car,
		Check,
		ChevronsUpDown,
		Footprints,
		Home,
		MapPin,
		Route,
		Sailboat,
		Tag
	} from '@lucide/svelte';

	// Props matching SitioProfile Section A
	let {
		municipality = $bindable(''),
		barangay = $bindable(''),
		sitioName = $bindable(''),
		sitioCode = $bindable(''),
		latitude = $bindable(0),
		longitude = $bindable(0),
		sitioClassification = $bindable({ gida: false, indigenous: false, conflict: false }),
		mainAccess = $bindable('')
	}: {
		municipality: string;
		barangay: string;
		sitioName: string;
		sitioCode: string;
		latitude: number;
		longitude: number;
		sitioClassification: {
			gida: boolean;
			indigenous: boolean;
			conflict: boolean;
		};
		mainAccess: string;
	} = $props();

	// Section completion checks
	const isLocationComplete = $derived(
		municipality.trim() !== '' && barangay.trim() !== '' && sitioName.trim() !== ''
	);
	const isCoordinatesComplete = $derived(latitude !== 0 || longitude !== 0);
	const hasClassification = $derived(
		sitioClassification.gida || sitioClassification.indigenous || sitioClassification.conflict
	);
	const hasAccess = $derived(mainAccess !== '');

	let municipalityPopoverOpen = $state(false);
	let barangayPopoverOpen = $state(false);
	let municipalitySearchQuery = $state('');
	let barangaySearchQuery = $state('');

	const filteredMunicipalities = $derived(
		MUNICIPALITIES.filter((m) => m.toLowerCase().includes(municipalitySearchQuery.toLowerCase()))
	);

	const availableBarangays = $derived(
		municipality ? getBarangaysForMunicipality(municipality) : []
	);

	const filteredBarangays = $derived(
		availableBarangays.filter((b) => b.toLowerCase().includes(barangaySearchQuery.toLowerCase()))
	);

	function selectMunicipality(m: string) {
		municipality = m;
		barangay = '';
		municipalityPopoverOpen = false;
		municipalitySearchQuery = '';
	}

	function selectBarangay(b: string) {
		barangay = b;
		barangayPopoverOpen = false;
		barangaySearchQuery = '';
	}
</script>

<div class="space-y-6">
	<!-- Location Section -->
	<FormSection
		title="Location Details"
		description="Municipality, barangay, and sitio identification"
		icon={MapPin}
		accent="blue"
		isComplete={isLocationComplete}
	>
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<!-- Municipality -->
			<div class="space-y-2">
				<Label for="municipality" class="flex items-center gap-1.5 text-sm font-medium">
					Municipality <span class="text-destructive">*</span>
				</Label>
				<Popover.Root bind:open={municipalityPopoverOpen}>
					<Popover.Trigger
						class={cn(
							'flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground hover:border-primary/50 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
							municipality && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
						)}
					>
						<span class={cn('truncate', !municipality && 'text-muted-foreground')}>
							{toTitleCase(municipality) || 'Select municipality...'}
						</span>
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Popover.Trigger>
					<Popover.Content class="max-w-[min(400px,calc(100vw-2rem))] p-0" align="start">
						<div class="p-2">
							<Input
								placeholder="Search municipalities..."
								bind:value={municipalitySearchQuery}
								class="h-9"
							/>
						</div>
						<div class="max-h-[300px] overflow-y-auto">
							{#if filteredMunicipalities.length === 0}
								<div class="px-2 py-6 text-center text-sm text-muted-foreground">
									No municipalities found
								</div>
							{:else}
								<div class="p-1">
									{#each filteredMunicipalities as mun}
										<button
											type="button"
											class={cn(
												'relative flex w-full cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground',
												municipality === mun && 'bg-accent'
											)}
											onclick={() => selectMunicipality(mun)}
										>
											<Check
												class={cn(
													'mr-2 size-4',
													municipality === mun ? 'opacity-100' : 'opacity-0'
												)}
											/>
											<span>{toTitleCase(mun)}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</Popover.Content>
				</Popover.Root>
			</div>

			<!-- Barangay -->
			<div class="space-y-2">
				<Label for="barangay" class="flex items-center gap-1.5 text-sm font-medium">
					Barangay <span class="text-destructive">*</span>
				</Label>
				<Popover.Root bind:open={barangayPopoverOpen}>
					<Popover.Trigger
						disabled={!municipality}
						class={cn(
							'flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground hover:border-primary/50 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
							barangay && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
						)}
					>
						<span class={cn('truncate', !barangay && 'text-muted-foreground')}>
							{toTitleCase(barangay) || 'Select barangay...'}
						</span>
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Popover.Trigger>
					<Popover.Content class="max-w-[min(400px,calc(100vw-2rem))] p-0" align="start">
						<div class="p-2">
							<Input
								placeholder="Search barangays..."
								bind:value={barangaySearchQuery}
								class="h-9"
							/>
						</div>
						<div class="max-h-[300px] overflow-y-auto">
							{#if !municipality}
								<div class="px-2 py-6 text-center text-sm text-muted-foreground">
									Please select a municipality first
								</div>
							{:else if filteredBarangays.length === 0}
								<div class="px-2 py-6 text-center text-sm text-muted-foreground">
									No barangays found
								</div>
							{:else}
								<div class="p-1">
									{#each filteredBarangays as bar}
										<button
											type="button"
											class={cn(
												'relative flex w-full cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground',
												barangay === bar && 'bg-accent'
											)}
											onclick={() => selectBarangay(bar)}
										>
											<Check
												class={cn('mr-2 size-4', barangay === bar ? 'opacity-100' : 'opacity-0')}
											/>
											<span>{toTitleCase(bar)}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</Popover.Content>
				</Popover.Root>
			</div>

			<!-- Sitio Name -->
			<div class="space-y-2">
				<Label for="sitioName" class="flex items-center gap-1.5 text-sm font-medium">
					Sitio Name
					<span class="text-destructive">*</span>
				</Label>
				<Input
					id="sitioName"
					bind:value={sitioName}
					placeholder="Enter sitio name"
					class={cn(
						'h-11 rounded-xl transition-all',
						sitioName && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
					)}
				/>
				<p class="text-xs text-muted-foreground">The name of the sitio / purok</p>
			</div>

			<!-- Sitio Code -->
			<div class="space-y-2">
				<Label for="sitioCode" class="flex items-center gap-1.5 text-sm font-medium">
					Sitio Code
					<HelpTooltip
						content="Unique identifier code assigned to this sitio for government tracking and reporting purposes"
					/>
				</Label>
				<Input
					id="sitioCode"
					bind:value={sitioCode}
					placeholder="e.g., 1-1"
					class={cn(
						'h-11 rounded-xl transition-all',
						sitioCode && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
					)}
				/>
				<p class="text-xs text-muted-foreground">Purok/Sitio Code (if available)</p>
			</div>
		</div>
	</FormSection>

	<!-- Sitio Classification -->
	<FormSection
		title="Sitio Classification"
		description="Select all classifications that apply to this sitio"
		icon={Tag}
		accent="amber"
		isComplete={hasClassification}
	>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Label
				for="gida"
				class={cn(
					'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 hover:shadow-sm',
					sitioClassification.gida &&
						'border-amber-500/50 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/20'
				)}
			>
				<Checkbox
					id="gida"
					checked={sitioClassification.gida}
					onCheckedChange={(checked) =>
						(sitioClassification = { ...sitioClassification, gida: !!checked })}
					class="size-5"
				/>
				<div>
					<p class="font-medium">GIDA</p>
					<p class="text-xs text-muted-foreground">
						Geographically Isolated and Disadvantaged Area
					</p>
				</div>
			</Label>
			<Label
				for="indigenous"
				class={cn(
					'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 hover:shadow-sm',
					sitioClassification.indigenous &&
						'border-purple-500/50 bg-purple-500/5 shadow-sm ring-1 ring-purple-500/20'
				)}
			>
				<Checkbox
					id="indigenous"
					checked={sitioClassification.indigenous}
					onCheckedChange={(checked) =>
						(sitioClassification = { ...sitioClassification, indigenous: !!checked })}
					class="size-5"
				/>
				<div>
					<p class="font-medium">Indigenous</p>
					<p class="text-xs text-muted-foreground">Indigenous Community</p>
				</div>
			</Label>
			<Label
				for="conflict"
				class={cn(
					'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 hover:shadow-sm',
					sitioClassification.conflict &&
						'border-rose-500/50 bg-rose-500/5 shadow-sm ring-1 ring-rose-500/20'
				)}
			>
				<Checkbox
					id="conflict"
					checked={sitioClassification.conflict}
					onCheckedChange={(checked) =>
						(sitioClassification = { ...sitioClassification, conflict: !!checked })}
					class="size-5"
				/>
				<div>
					<p class="font-medium">Conflict-Affected</p>
					<p class="text-xs text-muted-foreground">Area affected in past 3 years</p>
				</div>
			</Label>
		</div>
	</FormSection>

	<!-- Main Access -->
	<FormSection
		title="Main Access"
		description="Primary means of accessing the sitio"
		icon={Route}
		accent="green"
		isComplete={hasAccess}
	>
		<RadioGroup.Root bind:value={mainAccess} class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<Label
				for="pavedRoad"
				class={cn(
					'group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all hover:bg-muted/50 hover:shadow-sm',
					mainAccess === 'pavedRoad' &&
						'border-emerald-500/50 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20'
				)}
			>
				<Car
					class={cn(
						'size-6 text-muted-foreground transition-colors',
						mainAccess === 'pavedRoad' && 'text-emerald-600'
					)}
				/>
				<div class="flex items-center gap-2">
					<RadioGroup.Item id="pavedRoad" value="pavedRoad" />
					<span class="text-sm font-medium">Paved Road</span>
				</div>
			</Label>
			<Label
				for="unpavedRoad"
				class={cn(
					'group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all hover:bg-muted/50 hover:shadow-sm',
					mainAccess === 'unpavedRoad' &&
						'border-emerald-500/50 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20'
				)}
			>
				<Route
					class={cn(
						'size-6 text-muted-foreground transition-colors',
						mainAccess === 'unpavedRoad' && 'text-emerald-600'
					)}
				/>
				<div class="flex items-center gap-2">
					<RadioGroup.Item id="unpavedRoad" value="unpavedRoad" />
					<span class="text-sm font-medium">Unpaved Road</span>
				</div>
			</Label>
			<Label
				for="footpath"
				class={cn(
					'group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all hover:bg-muted/50 hover:shadow-sm',
					mainAccess === 'footpath' &&
						'border-emerald-500/50 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20'
				)}
			>
				<Footprints
					class={cn(
						'size-6 text-muted-foreground transition-colors',
						mainAccess === 'footpath' && 'text-emerald-600'
					)}
				/>
				<div class="flex items-center gap-2">
					<RadioGroup.Item id="footpath" value="footpath" />
					<span class="text-sm font-medium">Footpath</span>
				</div>
			</Label>
			<Label
				for="boat"
				class={cn(
					'group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all hover:bg-muted/50 hover:shadow-sm',
					mainAccess === 'boat' &&
						'border-emerald-500/50 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20'
				)}
			>
				<Sailboat
					class={cn(
						'size-6 text-muted-foreground transition-colors',
						mainAccess === 'boat' && 'text-emerald-600'
					)}
				/>
				<div class="flex items-center gap-2">
					<RadioGroup.Item id="boat" value="boat" />
					<span class="text-sm font-medium">Boat</span>
				</div>
			</Label>
		</RadioGroup.Root>
	</FormSection>

	<!-- Coordinates Section -->
	<FormSection
		title="Geographic Location"
		description="Map coordinates for the sitio center point"
		icon={Home}
		accent="purple"
		isComplete={isCoordinatesComplete}
	>
		<LocationPicker bind:lat={latitude} bind:lng={longitude} {municipality} {barangay} />
		<p class="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
			<strong>Tip:</strong> Click on the map or drag the marker to set the sitio location. This helps
			with mapping and geographic analysis.
		</p>
	</FormSection>
</div>
