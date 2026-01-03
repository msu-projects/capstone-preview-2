<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { hasLocationsOverride } from '$lib/config/location-data';
	import { authStore } from '$lib/stores/auth.svelte';
	import { hasCustomFieldsOverride } from '$lib/utils/custom-fields-storage';
	import { ChevronRight, Layers, MapPin } from '@lucide/svelte';

	interface ConfigSection {
		id: string;
		title: string;
		description: string;
		icon: typeof MapPin;
		href: string;
		hasOverride: () => boolean;
		items: string[];
	}

	const configSections: ConfigSection[] = [
		{
			id: 'locations',
			title: 'Location Data',
			description: 'Municipalities and barangays in South Cotabato',
			icon: MapPin,
			href: '/admin/config/locations',
			hasOverride: hasLocationsOverride,
			items: ['Municipalities', 'Barangays']
		},
		{
			id: 'custom-fields',
			title: 'Custom Fields',
			description: 'Define supplementary data fields for sitio profiles',
			icon: Layers,
			href: '/admin/config/custom-fields',
			hasOverride: hasCustomFieldsOverride,
			items: ['Text', 'Number', 'Yes/No', 'Date']
		}
	];

	const canManageConfig = $derived(authStore.isSuperadmin);
</script>

<svelte:head>
	<title>Configuration | Admin</title>
</svelte:head>

<div class="flex flex-col">
	<AdminHeader
		title="System Configuration"
		description="Manage application settings and dropdown options"
		breadcrumbs={[{ label: 'Configuration' }]}
	/>

	<div class="flex flex-col gap-6 p-4 md:p-6">
		{#if !canManageConfig}
			<Card.Root>
				<Card.Content class="py-8 text-center">
					<p class="text-muted-foreground">
						You need superadmin privileges to manage configuration.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each configSections as section}
					<Card.Root
						class="h-full cursor-pointer transition-colors hover:border-primary/50"
						onclick={() => goto(section.href)}
					>
						<Card.Header class="pb-2">
							<div
								class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
							>
								<section.icon class="size-5" />
							</div>
							<Card.Title class="text-lg">{section.title}</Card.Title>
							<Card.Description>{section.description}</Card.Description>
						</Card.Header>
						<Card.Content class="flex-1">
							<div class="flex flex-wrap gap-1">
								{#each section.items as item}
									<Badge variant="secondary" class="text-xs">{item}</Badge>
								{/each}
							</div>
						</Card.Content>
						<Card.Footer class="pt-0">
							<Button variant="ghost" class="ml-auto gap-1">
								Configure
								<ChevronRight class="size-4" />
							</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>
