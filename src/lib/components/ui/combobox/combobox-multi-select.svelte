<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Command from '$lib/components/ui/command';
  import * as Popover from '$lib/components/ui/popover';
  import { Plus, X } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    /** The currently selected values */
    values: string[];
    /** Predefined options to choose from */
    options?: string[];
    /** Placeholder text for the search input */
    placeholder?: string;
    /** Label for the add button */
    addLabel?: string;
    /** Empty state message when no items are selected */
    emptyMessage?: string;
    /** Allow custom entries not in the options list */
    allowCustom?: boolean;
    /** Display variant: 'tags' (default) or 'list' */
    variant?: 'tags' | 'list';
    /** Custom render for each tag (optional) */
    tagContent?: Snippet<[{ value: string; remove: () => void }]>;
    /** Additional class for the container */
    class?: string;
  };

  let {
    values = $bindable([]),
    options = [],
    placeholder = 'Search...',
    addLabel = 'Add',
    emptyMessage = 'No items added yet',
    allowCustom = true,
    variant = 'tags',
    tagContent,
    class: className = ''
  }: Props = $props();

  let open = $state(false);
  let search = $state('');

  // Filter available options (exclude already selected)
  const availableOptions = $derived(options.filter((o) => !values.includes(o)));

  // Filtered by search
  const filteredOptions = $derived(
    availableOptions.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
  );

  // Check if search is a custom entry
  const isCustomEntry = $derived(
    allowCustom &&
      search.trim() !== '' &&
      !options.some((o) => o.toLowerCase() === search.toLowerCase()) &&
      !values.some((v) => v.toLowerCase() === search.toLowerCase())
  );

  function addValue(value: string) {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      values = [...values, trimmed];
    }
    search = '';
    open = false;
  }

  function removeValue(value: string) {
    values = values.filter((v) => v !== value);
  }
</script>

<div class={className}>
  {#if variant === 'list'}
    <!-- List variant - vertical list with alternating background -->
    <div class="space-y-2">
      {#if values.length === 0}
        <div
          class="flex w-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
        >
          <p>{emptyMessage}</p>
        </div>
      {:else}
        <div class="rounded-lg border">
          {#each values as value, index (value)}
            <div
              class="group flex items-center justify-between gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/50 {index !==
              values.length - 1
                ? 'border-b'
                : ''}"
            >
              <span class="flex-1">{value}</span>
              <button
                type="button"
                onclick={() => removeValue(value)}
                class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove {value}"
              >
                <X class="size-4" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Tags variant (default) - horizontal wrapped tags -->
    <div class="flex flex-wrap gap-2">
      {#if values.length === 0}
        <div
          class="flex w-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
        >
          <p>{emptyMessage}</p>
        </div>
      {:else}
        {#each values as value (value)}
          {#if tagContent}
            {@render tagContent({ value, remove: () => removeValue(value) })}
          {:else}
            <div
              class="group flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pr-1 pl-3 text-sm transition-all hover:bg-muted"
            >
              <span>{value}</span>
              <button
                type="button"
                onclick={() => removeValue(value)}
                class="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove {value}"
              >
                <X class="size-3" />
              </button>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  {/if}

  <Popover.Root bind:open>
    <Popover.Trigger class="mt-3">
      <Button type="button" variant="outline" size="sm" class="gap-2">
        <Plus class="size-4" />
        <span class="hidden sm:inline">{addLabel}</span>
        <span class="sm:hidden">Add</span>
      </Button>
    </Popover.Trigger>
    <Popover.Content class="max-w-[min(280px,calc(100vw-2rem))] p-0" align="start">
      <Command.Root shouldFilter={false}>
        <Command.Input placeholder={'Add/' + placeholder} bind:value={search} />
        <Command.List>
          {#if filteredOptions.length === 0 && !isCustomEntry}
            <Command.Empty>No options found.</Command.Empty>
          {/if}
          <Command.Group>
            {#each filteredOptions as option (option)}
              <Command.Item class="cursor-pointer" value={option} onSelect={() => addValue(option)}>
                {option}
              </Command.Item>
            {/each}
            {#if isCustomEntry}
              {#if filteredOptions.length > 0}
                <Command.Separator />
              {/if}
              <Command.Item value="__custom__" onSelect={() => addValue(search)}>
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
