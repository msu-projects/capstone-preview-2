<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import * as Select from '$lib/components/ui/select';
	import { getBarangaysForMunicipality, getMunicipalities } from '$lib/config/location-data';
	import type { SitioRecord } from '$lib/types';
	import { cn } from '$lib/utils';
	import { loadSitios } from '$lib/utils/storage';
	import { Check, ChevronsUpDown, MapPin, Plus, X } from '@lucide/svelte';

	type Props = {
		/** The currently selected sitio IDs */
		value: number[];
		/** Placeholder text when no sitios are selected */
		placeholder?: string;
		/** Additional class for the trigger button */
		class?: string;
		/** Disabled state */
		disabled?: boolean;
	};

	let {
		value = $bindable([]),
		placeholder = 'Select sitios...',
		class: className = '',
		disabled = false
	}: Props = $props();

	let open = $state(false);
	let search = $state('');
	let municipalityFilter = $state<string>('');
	let barangayFilter = $state<string>('');

	// Load data
	const sitios = $derived(loadSitios());
	const municipalities = $derived(getMunicipalities());
	const barangays = $derived(
		municipalityFilter ? getBarangaysForMunicipality(municipalityFilter) : []
	);

	// Create sitio map for quick lookup
	const sitioMap = $derived(() => {
		const map = new Map<number, SitioRecord>();
		sitios.forEach((sitio) => map.set(sitio.id, sitio));
		return map;
	});

	// Filter sitios based on search and location filters
	const filteredSitios = $derived(() => {
		let filtered = sitios;

		// Apply municipality filter
		if (municipalityFilter) {
			filtered = filtered.filter((s) => s.municipality === municipalityFilter);
		}

		// Apply barangay filter
		if (barangayFilter) {
			filtered = filtered.filter((s) => s.barangay === barangayFilter);
		}

		// Apply search filter
		if (search.trim()) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(s) =>
					s.sitioName.toLowerCase().includes(searchLower) ||
					s.barangay.toLowerCase().includes(searchLower) ||
					s.municipality.toLowerCase().includes(searchLower)
			);
		}

		return filtered;
	});

	// Get selected sitio details
	const selectedSitios = $derived(() => {
		const map = sitioMap();
		return value.map((id) => map.get(id)).filter((s): s is SitioRecord => s !== undefined);
	});

	function toggleSitio(id: number) {
		if (value.includes(id)) {
			value = value.filter((v) => v !== id);
		} else {
			value = [...value, id];
		}
	}

	function removeSitio(id: number) {
		value = value.filter((v) => v !== id);
	}

	function clearFilters() {
		municipalityFilter = '';
		barangayFilter = '';
		search = '';
	}

	// Reset barangay when municipality changes
	$effect(() => {
		if (municipalityFilter === '') {
			barangayFilter = '';
		}
	});
</script>

<div class={cn('space-y-3', className)}>
	<!-- Selected Sitios Tags -->
	<div class="flex flex-wrap gap-2">
		{#if selectedSitios().length === 0}
			<div
				class="flex w-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
			>
				<p>No sitios selected</p>
			</div>
		{:else}
			{#each selectedSitios() as sitio (sitio.id)}
				<div
					class="group flex items-center gap-1.5 rounded-full border bg-primary/10 py-1 pr-1 pl-3 text-sm transition-all hover:bg-primary/20"
				>
					<MapPin class="size-3 text-primary" />
					<span class="max-w-37.5 truncate font-medium">{sitio.sitioName}</span>
					<span class="hidden text-muted-foreground sm:inline"
						>- {sitio.barangay}, {sitio.municipality}</span
					>
					<button
						type="button"
						onclick={() => removeSitio(sitio.id)}
						class="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
						aria-label="Remove {sitio.sitioName}"
					>
						<X class="size-3" />
					</button>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Multi-select Popover -->
	<Popover.Root bind:open>
		<Popover.Trigger {disabled} class="w-full">
			<Button
				type="button"
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class={cn('w-full justify-between font-normal', className)}
				{disabled}
			>
				<span class="flex items-center gap-2">
					<Plus class="size-4" />
					<span>{value.length > 0 ? `${value.length} sitio(s) selected` : placeholder}</span>
				</span>
				<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-[min(400px,calc(100vw-2rem))] p-0" align="start">
			<div class="border-b p-3">
				<!-- Location Filters -->
				<div class="mb-3 flex flex-col gap-2 sm:flex-row">
					<Select.Root type="single" bind:value={municipalityFilter}>
						<Select.Trigger class="h-8 flex-1 text-xs">
							{municipalityFilter || 'All Municipalities'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Municipalities</Select.Item>
							{#each municipalities as mun}
								<Select.Item value={mun}>{mun}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					<Select.Root type="single" bind:value={barangayFilter} disabled={!municipalityFilter}>
						<Select.Trigger class="h-8 flex-1 text-xs">
							{barangayFilter || 'All Barangays'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Barangays</Select.Item>
							{#each barangays as brgy}
								<Select.Item value={brgy}>{brgy}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					{#if municipalityFilter || barangayFilter}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="h-8 px-2 text-xs"
							onclick={clearFilters}
						>
							Clear
						</Button>
					{/if}
				</div>
			</div>

			<Command.Root shouldFilter={false}>
				<Command.Input placeholder="Search sitios..." bind:value={search} />
				<Command.List class="max-h-62.5">
					{#if filteredSitios().length === 0}
						<Command.Empty class="py-4 text-center text-sm text-muted-foreground">
							No sitios found.
						</Command.Empty>
					{:else}
						<Command.Group>
							{#each filteredSitios() as sitio (sitio.id)}
								{@const isSelected = value.includes(sitio.id)}
								<Command.Item
									value={sitio.id.toString()}
									onSelect={() => toggleSitio(sitio.id)}
									class="cursor-pointer"
								>
									<div
										class={cn(
											'mr-2 flex size-4 items-center justify-center rounded border',
											isSelected
												? 'border-primary bg-primary text-primary-foreground'
												: 'border-muted-foreground/30'
										)}
									>
										{#if isSelected}
											<Check class="size-3" />
										{/if}
									</div>
									<div class="flex flex-col">
										<span class="font-medium">{sitio.sitioName}</span>
										<span class="text-xs text-muted-foreground">
											{sitio.barangay}, {sitio.municipality}
										</span>
									</div>
								</Command.Item>
							{/each}
						</Command.Group>
					{/if}
				</Command.List>
			</Command.Root>

			{#if value.length > 0}
				<div class="border-t p-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						class="w-full text-xs text-muted-foreground"
						onclick={() => (value = [])}
					>
						Clear all selections
					</Button>
				</div>
			{/if}
		</Popover.Content>
	</Popover.Root>
</div>
