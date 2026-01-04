<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
  import SitioListDisplay from '$lib/components/sitios/SitioListDisplay.svelte';
  import SitioListFilters from '$lib/components/sitios/SitioListFilters.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import type { SitioRecord } from '$lib/types';
  import {
    buildURLWithConfig,
    hasActiveFilters as checkHasActiveFilters,
    parseListConfigFromURL,
    prepareSitiosForSort,
    processSitios
  } from '$lib/utils/sitio-sorting';
  import { loadSitios } from '$lib/utils/storage';
  import { ArrowLeft, MapPin } from '@lucide/svelte';
  import { onMount } from 'svelte';
  ('svelte');

  let sitios = $state<SitioRecord[]>([]);
  let isLoading = $state(true);
  let currentPage = $state(1);
  const itemsPerPage = 12;

  // Parse list config from URL
  const listConfig = $derived.by(() => {
    return parseListConfigFromURL($page.url.searchParams);
  });

  // Prepare sitios with profile data
  const sitiosWithProfile = $derived(prepareSitiosForSort(sitios, 'latest'));

  // Process sitios (filter + sort)
  const processedSitios = $derived(processSitios(sitiosWithProfile, listConfig));

  // Pagination
  const totalPages = $derived(Math.ceil(processedSitios.length / itemsPerPage));
  const paginatedSitios = $derived(
    processedSitios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  );

  // Check if filters are active
  const hasActiveFilters = $derived(checkHasActiveFilters(listConfig));

  onMount(() => {
    sitios = loadSitios();
    isLoading = false;
  });

  function handleConfigChange(newConfig: typeof listConfig) {
    goto(buildURLWithConfig('/sitios/list', newConfig));
  }
</script>

<svelte:head>
  <title>All Sitios - South Cotabato Data Bank</title>
  <meta
    name="description"
    content="Browse all sitio profiles and community data across South Cotabato"
  />
</svelte:head>

<div
  class="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20"
>
  <!-- Breadcrumb -->
  <AppBreadcrumb
    items={[{ label: 'Sitios Dashboard', href: '/sitios' }, { label: 'All Sitios' }]}
  />

  <!-- Header -->
  <section class="border-b bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
    <div class="container mx-auto px-4">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <Button href="/sitios" variant="ghost" size="icon" class="shrink-0">
            <ArrowLeft class="size-5" />
          </Button>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h1
                class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100"
              >
                All Sitios
              </h1>
              <Badge variant="secondary" class="gap-1">
                <MapPin class="size-3" />
                {processedSitios.length}
                {processedSitios.length === 1 ? 'sitio' : 'sitios'}
              </Badge>
            </div>
            <p class="mt-1 text-slate-600 dark:text-slate-400">
              Browse and search through all registered sitios in South Cotabato
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Filters & Display -->
  <section class="container mx-auto space-y-6 px-4 py-6">
    <!-- Loading State -->
    {#if isLoading}
      <!-- Skeleton for filters -->
      <Card.Root class="shadow-sm">
        <Card.Content>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton class="h-10 w-full sm:max-w-xs" />
            <div class="flex flex-wrap gap-2">
              <Skeleton class="h-10 w-40" />
              <Skeleton class="h-10 w-40" />
              <Skeleton class="h-10 w-40" />
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Skeleton for grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {#each Array(8) as _}
          <Card.Root class="overflow-hidden">
            <Card.Content class="p-0">
              <div
                class="flex items-start justify-between border-b border-slate-100 p-4 dark:border-slate-800"
              >
                <div class="flex-1 space-y-2">
                  <Skeleton class="h-5 w-32" />
                  <Skeleton class="h-4 w-40" />
                </div>
                <Skeleton class="h-6 w-10 rounded-full" />
              </div>
              <div class="grid grid-cols-2 gap-3 p-4">
                <Skeleton class="h-24 w-full rounded-lg" />
                <Skeleton class="h-24 w-full rounded-lg" />
              </div>
              <div class="space-y-2 border-t border-slate-100 px-4 pt-3 pb-2 dark:border-slate-800">
                <Skeleton class="h-4 w-full" />
                <Skeleton class="h-4 w-full" />
              </div>
              <div class="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                <Skeleton class="h-5 w-24" />
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {:else}
      <!-- Filters and Sort -->
      <SitioListFilters
        config={listConfig}
        onConfigChange={handleConfigChange}
        basePath="/sitios/list"
        mode="public"
      />

      <!-- Sitios Display -->
      <SitioListDisplay
        sitios={paginatedSitios}
        totalCount={processedSitios.length}
        bind:currentPage
        {itemsPerPage}
        {totalPages}
        selectedIndicators={listConfig.sortIndicators}
        mode="public"
        {hasActiveFilters}
        onClearFilters={() =>
          handleConfigChange({
            filters: {
              searchQuery: '',
              municipality: 'all',
              barangay: 'all',
              classifications: { gida: null, indigenous: null, conflict: null }
            },
            sortIndicators: [{ key: 'totalPopulation', order: 'desc' }],
            year: 'latest'
          })}
      />
    {/if}
  </section>
</div>
