<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import { NumberInput } from '$lib/components/ui/number-input';
	import * as Popover from '$lib/components/ui/popover';
	import { Plus, Trash2 } from '@lucide/svelte';
	import type { Component, Snippet } from 'svelte';

	type Item = {
		type: string;
		count: number;
	};

	type Props = {
		/** The currently selected items with counts */
		items: Item[];
		/** Predefined options to choose from */
		options?: string[];
		/** Placeholder text for the search input */
		placeholder?: string;
		/** Label for the add button */
		addLabel?: string;
		/** Empty state message when no items are added */
		emptyMessage?: string;
		/** Icon for empty state */
		emptyIcon?: Component;
		/** Allow custom entries not in the options list */
		allowCustom?: boolean;
		/** Additional class for the container */
		class?: string;
		/** Label snippet */
		label?: Snippet;
	};

	let {
		items = $bindable([]),
		options = [],
		placeholder = 'Search...',
		addLabel = 'Add',
		emptyMessage = 'No items added yet',
		emptyIcon,
		allowCustom = true,
		class: className = '',
		label
	}: Props = $props();

	let open = $state(false);
	let search = $state('');

	// Filter available options (exclude already selected types)
	const selectedTypes = $derived(items.map((i) => i.type));
	const availableOptions = $derived(options.filter((o) => !selectedTypes.includes(o)));

	// Filtered by search
	const filteredOptions = $derived(
		availableOptions.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
	);

	// Check if search is a custom entry
	const isCustomEntry = $derived(
		allowCustom &&
			search.trim() !== '' &&
			!options.some((o) => o.toLowerCase() === search.toLowerCase()) &&
			!selectedTypes.some((t) => t.toLowerCase() === search.toLowerCase())
	);

	function addItem(type: string) {
		const trimmed = type.trim();
		if (trimmed && !selectedTypes.includes(trimmed)) {
			items = [...items, { type: trimmed, count: 0 }];
		}
		search = '';
		open = false;
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}
</script>

<div class={className}>
	<div class="flex items-center justify-between">
		{#if label}
			{@render label()}
		{/if}
		<Popover.Root bind:open>
			<Popover.Trigger>
				<Button type="button" variant="outline" size="sm" class="h-8 gap-1.5">
					<Plus class="size-3.5" />
					{addLabel}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="max-w-[min(280px,calc(100vw-2rem))] p-0" align="end">
				<Command.Root shouldFilter={false}>
					<Command.Input {placeholder} bind:value={search} />
					<Command.List>
						{#if filteredOptions.length === 0 && !isCustomEntry}
							<Command.Empty>No options found.</Command.Empty>
						{/if}
						<Command.Group>
							{#each filteredOptions as option (option)}
								<Command.Item
									value={option}
									onSelect={() => addItem(option)}
									class="cursor-pointer"
								>
									{option}
								</Command.Item>
							{/each}
							{#if isCustomEntry}
								{#if filteredOptions.length > 0}
									<Command.Separator />
								{/if}
								<Command.Item value="__custom__" onSelect={() => addItem(search)}>
									<Plus class="mr-2 size-4" />
									Add "{search}"
								</Command.Item>
							{/if}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if items.length === 0}
		<div
			class="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center"
		>
			{#if emptyIcon}
				{@const Icon = emptyIcon}
				<Icon class="size-8 text-muted-foreground/50" />
			{/if}
			<p class="text-sm text-muted-foreground">{emptyMessage}</p>
		</div>
	{:else}
		<div class="mt-3 rounded-lg border">
			<table class="w-full">
				<thead>
					<tr class="border-b bg-muted/30">
						<th class="px-3 py-2 text-left text-sm font-medium">Type</th>
						<th class="w-32 px-3 py-2 text-left text-sm font-medium">Count</th>
						<th class="w-10"></th>
					</tr>
				</thead>
				<tbody>
					{#each items as item, i (item.type)}
						<tr class="border-b last:border-0">
							<td class="px-3 py-2 text-sm">{item.type}</td>
							<td class="px-3 py-2">
								<NumberInput
									id="item_count_{i}"
									bind:value={items[i].count}
									placeholder="0"
									min={0}
								/>
							</td>
							<td class="px-1 py-2">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
									onclick={() => removeItem(i)}
								>
									<Trash2 class="size-4" />
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
