<script lang="ts">
  import AppBreadcrumb, { type BreadcrumbItem } from '$lib/components/AppBreadcrumb.svelte';
  import { Separator } from '$lib/components/ui/separator';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description?: string;
    sticky?: boolean;
    actions?: Snippet;
    badges?: Snippet;
    breadcrumbs?: BreadcrumbItem[];
  }

  let { title, description, sticky = false, actions, badges, breadcrumbs }: Props = $props();
</script>

{#if breadcrumbs && breadcrumbs.length > 0}
  <AppBreadcrumb items={breadcrumbs} isAdminView sticky />
{/if}

{#if sticky}
  <div
    class="sticky top-0 z-20 border-b border-border bg-background shadow-sm"
    class:top-[57px]={breadcrumbs && breadcrumbs.length > 0}
  >
    <div class="flex flex-wrap items-center gap-2 p-3 sm:gap-4 sm:p-4">
      {#if !breadcrumbs || breadcrumbs.length === 0}
        <Sidebar.Trigger class="-ml-1 shrink-0" />
        <Separator orientation="vertical" class="hidden h-6 sm:block" />
      {/if}
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 class="truncate text-lg font-bold sm:text-xl md:text-2xl">{title}</h1>
          {#if badges}
            <div class="flex shrink-0 flex-wrap items-center gap-1">
              {@render badges()}
            </div>
          {/if}
        </div>
        {#if description}
          <p class="xs:block mt-1 hidden text-xs text-muted-foreground sm:text-sm">{description}</p>
        {/if}
      </div>
      {#if actions}
        <div class="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {@render actions()}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <header class="border-b bg-card">
    <div class="flex h-full flex-wrap items-center gap-2 p-4 sm:gap-4 sm:p-6">
      {#if !breadcrumbs || breadcrumbs.length === 0}
        <Sidebar.Trigger class="-ml-1 shrink-0" />
        <!-- <Separator orientation="vertical" class="hidden scale-y-185 sm:block" color="#000" /> -->
      {/if}
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 class="truncate text-xl font-bold sm:text-2xl md:text-3xl">{title}</h1>
          {#if badges}
            <div class="flex shrink-0 flex-wrap items-center gap-1">
              {@render badges()}
            </div>
          {/if}
        </div>
        {#if description}
          <p class="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>
        {/if}
      </div>
      {#if actions}
        <div class="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {@render actions()}
        </div>
      {/if}
    </div>
  </header>
{/if}
