<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { Check, ChevronsUpDown, Plus } from '@lucide/svelte';

	type Props = {
		/** The currently selected value */
		value: string;
		/** Predefined options to choose from */
		options?: string[];
		/** Placeholder text when no value is selected */
		placeholder?: string;
		/** Placeholder text for the search input */
		searchPlaceholder?: string;
		/** Allow custom entries not in the options list */
		allowCustom?: boolean;
		/** Additional class for the trigger button */
		class?: string;
		/** Disabled state */
		disabled?: boolean;
	};

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select...',
		searchPlaceholder = 'Add/Search...',
		allowCustom = true,
		class: className = '',
		disabled = false
	}: Props = $props();

	let open = $state(false);
	let search = $state('');

	let legitSearchPlaceholder = $derived('Add/' + searchPlaceholder);

	// Filtered by search
	const filteredOptions = $derived(
		options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
	);

	// Check if search is a custom entry
	const isCustomEntry = $derived(
		allowCustom &&
			search.trim() !== '' &&
			!options.some((o) => o.toLowerCase() === search.toLowerCase())
	);

	function selectValue(newValue: string) {
		value = newValue.trim();
		search = '';
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger {disabled} class="w-full">
		<Button
			type="button"
			variant="outline"
			role="combobox"
			aria-expanded={open}
			class={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
			{disabled}
		>
			<span class="truncate">{value || placeholder}</span>
			<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[--radix-popover-trigger-width] p-0" align="start">
		<Command.Root shouldFilter={false}>
			<Command.Input placeholder={legitSearchPlaceholder} bind:value={search} />
			<Command.List>
				{#if filteredOptions.length === 0 && !isCustomEntry}
					<Command.Empty class="py-3">No options found.</Command.Empty>
				{/if}
				<Command.Group>
					{#each filteredOptions as option (option)}
						<Command.Item
							value={option}
							onSelect={() => selectValue(option)}
							class="cursor-pointer"
						>
							<Check class={cn('mr-2 size-4', value === option ? 'opacity-100' : 'opacity-0')} />
							{option}
						</Command.Item>
					{/each}
					{#if isCustomEntry}
						{#if filteredOptions.length > 0}
							<Command.Separator />
						{/if}
						<Command.Item value="__custom__" onSelect={() => selectValue(search)}>
							<Plus class="mr-2 size-4" />
							Add "{search}"
						</Command.Item>
					{/if}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
