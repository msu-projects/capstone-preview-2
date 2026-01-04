<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { cn } from '$lib/utils';
  import { MapPin, Search } from '@lucide/svelte';
  import type { Component } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    icon?: Component;
    showClearFilters?: boolean;
    onClearFilters?: () => void;
    class?: string;
  }

  let {
    title = 'No Sitios Found',
    description = 'No sitios match your current filter criteria. Try adjusting your municipality or barangay filters.',
    icon: Icon = MapPin,
    showClearFilters = true,
    onClearFilters,
    class: className
  }: Props = $props();
</script>

<Card.Root class={cn('py-12 text-center sm:py-16', className)}>
  <Card.Content>
    <div
      class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
    >
      <Icon class="size-8 text-slate-400 dark:text-slate-500" />
    </div>
    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    <p class="mx-auto mt-2 max-w-md text-slate-500 dark:text-slate-400">
      {description}
    </p>
    {#if showClearFilters && onClearFilters}
      <Button onclick={onClearFilters} class="mt-6 gap-2">
        <Search class="size-4" />
        Clear Filters
      </Button>
    {/if}
  </Card.Content>
</Card.Root>
