<script lang="ts">
  import { cn } from '$lib/utils';
  import { Check, ChevronDown } from '@lucide/svelte';

  type Props = {
    value?: string;
    placeholder?: string;
    options: { value: string; label: string }[];
    class?: string;
  };

  let {
    value = $bindable(''),
    placeholder = 'Select...',
    options,
    class: className
  }: Props = $props();

  let isOpen = $state(false);
  let buttonRef: HTMLButtonElement | null = $state(null);

  function toggle() {
    isOpen = !isOpen;
  }

  function selectOption(optionValue: string) {
    value = optionValue;
    isOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (buttonRef && !buttonRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });

  const selectedLabel = $derived(options.find((opt) => opt.value === value)?.label || placeholder);
</script>

<div class="relative">
  <button
    bind:this={buttonRef}
    type="button"
    onclick={toggle}
    class={cn(
      'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      !value && 'text-muted-foreground',
      className
    )}
  >
    <span class="truncate">{selectedLabel}</span>
    <ChevronDown class="h-4 w-4 opacity-50" />
  </button>

  {#if isOpen}
    <div
      class="absolute z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {#each options as option (option.value)}
        <button
          type="button"
          onclick={() => selectOption(option.value)}
          class={cn(
            'relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground',
            value === option.value && 'bg-accent'
          )}
        >
          <Check class={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
