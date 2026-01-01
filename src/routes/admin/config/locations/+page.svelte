<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import ConfigResetDialog from '$lib/components/admin/config/ConfigResetDialog.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import {
		getLocationsConfig,
		hasLocationsOverride,
		resetLocationsConfig,
		saveLocationsConfig
	} from '$lib/config/location-data';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { LocationsConfig } from '$lib/utils/config-storage';
	import { ArrowLeft, ChevronDown, MapPin, Plus, RotateCcw, Save, Trash2, X } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let config = $state<LocationsConfig | null>(null);
	let hasChanges = $state(false);
	let hasOverride = $state(false);
	let isResetDialogOpen = $state(false);
	let newMunicipality = $state('');
	let newBarangays = $state<Record<string, string>>({});

	const canManageConfig = $derived(authStore.isSuperadmin);

	onMount(() => {
		config = getLocationsConfig();
		hasOverride = hasLocationsOverride();
	});

	function getMunicipalityIndex(name: string): number {
		if (!config) return -1;
		return config.municipalities.findIndex((m) => m.name === name);
	}

	function addMunicipality() {
		if (!config || !newMunicipality.trim()) return;
		const exists = config.municipalities.some((m) => m.name === newMunicipality.trim());
		if (exists) {
			toast.error('Municipality already exists');
			return;
		}
		config = {
			...config,
			municipalities: [
				...config.municipalities,
				{ name: newMunicipality.trim(), barangays: [] }
			].sort((a, b) => a.name.localeCompare(b.name))
		};
		newMunicipality = '';
		hasChanges = true;
	}

	function removeMunicipality(name: string) {
		if (!config) return;
		config = {
			...config,
			municipalities: config.municipalities.filter((m) => m.name !== name)
		};
		hasChanges = true;
	}

	function addBarangay(municipality: string) {
		if (!config) return;
		const name = newBarangays[municipality]?.trim();
		if (!name) return;
		const idx = getMunicipalityIndex(municipality);
		if (idx === -1) return;
		if (config.municipalities[idx].barangays.includes(name)) {
			toast.error('Barangay already exists');
			return;
		}
		const updatedMunicipalities = [...config.municipalities];
		updatedMunicipalities[idx] = {
			...updatedMunicipalities[idx],
			barangays: [...updatedMunicipalities[idx].barangays, name].sort()
		};
		config = { ...config, municipalities: updatedMunicipalities };
		newBarangays = { ...newBarangays, [municipality]: '' };
		hasChanges = true;
	}

	function removeBarangay(municipality: string, barangay: string) {
		if (!config) return;
		const idx = getMunicipalityIndex(municipality);
		if (idx === -1) return;
		const updatedMunicipalities = [...config.municipalities];
		updatedMunicipalities[idx] = {
			...updatedMunicipalities[idx],
			barangays: updatedMunicipalities[idx].barangays.filter((b) => b !== barangay)
		};
		config = { ...config, municipalities: updatedMunicipalities };
		hasChanges = true;
	}

	function handleSave() {
		if (!config) return;
		const success = saveLocationsConfig(config, 'Updated location data');
		if (success) {
			toast.success('Configuration saved successfully');
			hasChanges = false;
			hasOverride = true;
		} else {
			toast.error('Failed to save configuration');
		}
	}

	function handleReset() {
		const success = resetLocationsConfig();
		if (success) {
			config = getLocationsConfig();
			toast.success('Configuration reset to defaults');
			hasChanges = false;
			hasOverride = false;
		} else {
			toast.error('Failed to reset configuration');
		}
		isResetDialogOpen = false;
	}

	const totalBarangays = $derived(
		config ? config.municipalities.reduce((sum, m) => sum + m.barangays.length, 0) : 0
	);
</script>

<svelte:head>
	<title>Location Data | Configuration</title>
</svelte:head>

<div class="flex flex-col">
	<AdminHeader
		title="Location Data"
		description="Configure municipalities and barangays in South Cotabato"
		breadcrumbs={[{ label: 'Configuration', href: '/admin/config' }, { label: 'Locations' }]}
	>
		{#snippet actions()}
			<Button variant="ghost" size="sm" onclick={() => goto('/admin/config')}>
				<ArrowLeft class="size-4 sm:mr-2" />
				<span class="hidden sm:inline">Back</span>
			</Button>
			{#if hasOverride}
				<Button variant="outline" size="sm" onclick={() => (isResetDialogOpen = true)}>
					<RotateCcw class="size-4 sm:mr-2" />
					<span class="hidden sm:inline">Reset</span>
				</Button>
			{/if}
			<Button size="sm" onclick={handleSave} disabled={!hasChanges || !canManageConfig}>
				<Save class="size-4 sm:mr-2" />
				<span class="hidden sm:inline">Save Changes</span>
			</Button>
		{/snippet}
		{#snippet badges()}
			{#if hasOverride}
				<Badge variant="outline" class="text-amber-600 dark:text-amber-400">Customized</Badge>
			{/if}
			{#if hasChanges}
				<Badge variant="outline" class="text-blue-600 dark:text-blue-400">Unsaved Changes</Badge>
			{/if}
		{/snippet}
	</AdminHeader>

	<div class="flex flex-col gap-6 p-4 md:p-6">
		{#if !canManageConfig}
			<Card.Root>
				<Card.Content class="py-8 text-center">
					<p class="text-muted-foreground">
						You need superadmin privileges to manage configuration.
					</p>
				</Card.Content>
			</Card.Root>
		{:else if config}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card.Root>
					<Card.Content class="flex items-center gap-3 p-4">
						<div
							class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<MapPin class="size-5" />
						</div>
						<div>
							<p class="text-2xl font-bold">{config.municipalities.length}</p>
							<p class="text-sm text-muted-foreground">Municipalities</p>
						</div>
					</Card.Content>
				</Card.Root>
				<Card.Root>
					<Card.Content class="flex items-center gap-3 p-4">
						<div
							class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<MapPin class="size-5" />
						</div>
						<div>
							<p class="text-2xl font-bold">{totalBarangays}</p>
							<p class="text-sm text-muted-foreground">Barangays</p>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<Card.Root>
				<Card.Header>
					<Card.Title>Add Municipality</Card.Title>
					<Card.Description>Add a new municipality to the list</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col gap-2 sm:flex-row">
						<Input
							bind:value={newMunicipality}
							placeholder="Enter municipality name..."
							onkeydown={(e) => e.key === 'Enter' && addMunicipality()}
							class="flex-1"
						/>
						<Button
							onclick={addMunicipality}
							disabled={!newMunicipality.trim()}
							class="w-full sm:w-auto"
						>
							<Plus class="mr-2 size-4" />
							Add
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Municipalities & Barangays</Card.Title>
					<Card.Description>
						Manage barangays within each municipality. Click on a municipality to expand.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if config.municipalities.length === 0}
						<p class="py-8 text-center text-muted-foreground">No municipalities added yet.</p>
					{:else}
						<div class="space-y-2">
							{#each config.municipalities as municipality (municipality.name)}
								<Collapsible.Root class="rounded-md border border-border/50">
									<Collapsible.Trigger
										class="flex w-full items-center justify-between p-3 hover:bg-muted/50"
									>
										<div class="flex items-center gap-2">
											<MapPin class="size-4 text-muted-foreground" />
											<span class="font-medium">{municipality.name}</span>
											<Badge variant="secondary">{municipality.barangays.length} barangays</Badge>
										</div>
										<ChevronDown
											class="size-4 text-muted-foreground transition-transform in-data-[state=open]:rotate-180"
										/>
									</Collapsible.Trigger>
									<Collapsible.Content>
										<div class="space-y-3 border-t p-3">
											<div class="flex flex-col gap-2 sm:flex-row">
												<Input
													bind:value={newBarangays[municipality.name]}
													placeholder="Add barangay..."
													onkeydown={(e) => e.key === 'Enter' && addBarangay(municipality.name)}
													class="flex-1"
												/>
												<Button
													size="sm"
													variant="outline"
													onclick={() => addBarangay(municipality.name)}
													disabled={!newBarangays[municipality.name]?.trim()}
													class="w-full sm:w-auto"
												>
													<Plus class="size-4 sm:mr-2" />
													<span class="sm:inline">Add</span>
												</Button>
											</div>
											{#if municipality.barangays.length > 0}
												<div class="rounded-md border border-border/50">
													{#each municipality.barangays.toSorted() as barangay (barangay)}
														<div
															class="flex items-center justify-between border-b border-border/50 px-3 py-2 last:border-b-0"
														>
															<span class="text-sm">{barangay}</span>
															<Button
																variant="ghost"
																size="icon"
																class="size-7"
																onclick={() => removeBarangay(municipality.name, barangay)}
															>
																<X class="size-3" />
															</Button>
														</div>
													{/each}
												</div>
											{:else}
												<p class="text-sm text-muted-foreground italic">No barangays yet.</p>
											{/if}
											<div class="border-t pt-3">
												<Button
													variant="destructive"
													size="sm"
													onclick={() => removeMunicipality(municipality.name)}
												>
													<Trash2 class="mr-2 size-4" />
													Remove Municipality
												</Button>
											</div>
										</div>
									</Collapsible.Content>
								</Collapsible.Root>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root>
				<Card.Content class="py-8 text-center">
					<p class="text-muted-foreground">Loading configuration...</p>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>

<ConfigResetDialog
	bind:open={isResetDialogOpen}
	sectionName="Location Data"
	onConfirm={handleReset}
	onCancel={() => (isResetDialogOpen = false)}
/>
