<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Empty from '$lib/components/ui/empty';
  import * as Table from '$lib/components/ui/table';
  import { INDICATORS_MAP } from '$lib/config/sitio-indicators';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { formatNumber } from '$lib/utils/formatters';
  import type { SitioWithProfile, SortConfig } from '$lib/utils/sitio-sorting';
  import { getIndicatorDisplayValues } from '$lib/utils/sitio-sorting';
  import {
    ArrowDown,
    ArrowUp,
    Calendar,
    Download,
    EllipsisVertical,
    Eye,
    FilterX,
    Home,
    MapPin,
    Plus,
    RefreshCw,
    SquarePen,
    Trash2,
    Upload,
    Users
  } from '@lucide/svelte';

  const isMobile = new IsMobile();

  interface Props {
    /** Sitios to display (already sorted/filtered) */
    sitios: SitioWithProfile[];
    /** Total count (for pagination) */
    totalCount: number;
    /** Current page number */
    currentPage: number;
    /** Items per page */
    itemsPerPage: number;
    /** Total pages */
    totalPages: number;
    /** Selected sort indicators to display as columns */
    selectedIndicators: SortConfig[];
    /** Display mode */
    mode: 'admin' | 'public';
    /** Whether filters are active */
    hasActiveFilters?: boolean;
    /** Called when refresh is requested */
    onRefresh?: () => void;
    /** Called when delete is requested (admin mode) */
    onDelete?: (id: number) => void;
    /** Called when edit is requested (admin mode) */
    onEdit?: (id: number) => void;
    /** Called when manage years is requested (admin mode) */
    onManageYears?: (id: number) => void;
    /** Called when download PDF is requested */
    onDownloadPDF?: (id: number) => void;
    /** Called when clear filters is requested */
    onClearFilters?: () => void;
    /** Called when page changes */
    onPageChange?: (page: number) => void;
  }

  let {
    sitios,
    totalCount,
    currentPage = $bindable(),
    itemsPerPage,
    totalPages,
    selectedIndicators,
    mode,
    hasActiveFilters = false,
    onRefresh,
    onDelete,
    onEdit,
    onManageYears,
    onDownloadPDF,
    onClearFilters,
    onPageChange
  }: Props = $props();

  const isAdmin = $derived(mode === 'admin');
  const basePath = $derived(isAdmin ? '/admin/sitios' : '/sitios');

  // Get indicator columns to show (limit to prevent overflow)
  const displayIndicators = $derived(selectedIndicators.slice(0, isMobile.current ? 2 : 5));

  function handlePageChange(page: number) {
    currentPage = page;
    onPageChange?.(page);
  }

  function navigateToSitio(id: number) {
    goto(`${basePath}/${id}`);
  }

  function getIndicatorValues(sitio: SitioWithProfile) {
    return getIndicatorDisplayValues(
      sitio,
      displayIndicators.map((i) => i.key)
    );
  }

  function getSortDirectionIcon(key: string) {
    const indicator = selectedIndicators.find((i) => i.key === key);
    return indicator?.order === 'desc' ? ArrowDown : ArrowUp;
  }

  function getSortPriority(key: string): number | null {
    const index = selectedIndicators.findIndex((i) => i.key === key);
    return index >= 0 ? index + 1 : null;
  }
</script>

<Card.Card class="gap-4 shadow-sm transition-shadow hover:shadow-md">
  <Card.CardHeader>
    <div class="flex items-center justify-between">
      <div>
        <Card.CardTitle class="text-xl font-semibold">
          {isAdmin ? 'All Sitios' : 'Sitio Directory'}
          <span class="ml-2 text-base font-normal text-muted-foreground">
            ({totalCount})
          </span>
        </Card.CardTitle>
        {#if selectedIndicators.length > 0}
          <p class="mt-1 text-sm text-muted-foreground">
            Sorted by: {selectedIndicators
              .map((i) => INDICATORS_MAP.get(i.key)?.shortLabel)
              .join(' → ')}
          </p>
        {/if}
      </div>
      {#if onRefresh}
        <Button variant="ghost" size="icon" onclick={onRefresh}>
          <RefreshCw class="size-4" />
        </Button>
      {/if}
    </div>
  </Card.CardHeader>

  <Card.CardContent>
    <!-- Mobile Card View -->
    {#if isMobile.current}
      <div class="space-y-3">
        {#if sitios.length === 0}
          <Empty.Root class="border-none py-8">
            <Empty.Media>
              <MapPin class="size-12 text-muted-foreground/50" />
            </Empty.Media>
            <Empty.Header>
              <Empty.Title>
                {hasActiveFilters ? 'No matching sitios' : 'No sitios found'}
              </Empty.Title>
              <Empty.Description>
                {#if hasActiveFilters}
                  Try adjusting your search or filters to find what you're looking for.
                {:else if isAdmin}
                  Get started by adding your first sitio or importing data from a CSV file.
                {:else}
                  No sitio data is currently available.
                {/if}
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <div class="flex flex-col gap-2 sm:flex-row">
                {#if hasActiveFilters && onClearFilters}
                  <Button variant="outline" size="sm" onclick={onClearFilters}>
                    <FilterX class="mr-2 size-4" />
                    Clear Filters
                  </Button>
                {/if}
                {#if isAdmin}
                  <Button variant="outline" size="sm" onclick={() => goto('/admin/import')}>
                    <Upload class="mr-2 size-4" />
                    Import Data
                  </Button>
                  <Button size="sm" onclick={() => goto('/admin/sitios/new')}>
                    <Plus class="mr-2 size-4" />
                    Add Sitio
                  </Button>
                {/if}
              </div>
            </Empty.Content>
          </Empty.Root>
        {:else}
          {#each sitios as sitio, index (sitio.id)}
            {@const indicatorValues = getIndicatorValues(sitio)}
            <button
              type="button"
              class="block w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-md focus:ring-2 focus:ring-primary/20 focus:outline-none"
              onclick={() => navigateToSitio(sitio.id)}
            >
              <!-- Rank badge if sorted -->
              {#if selectedIndicators.length > 0}
                <div class="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" class="text-xs">
                    #{(currentPage - 1) * itemsPerPage + index + 1}
                  </Badge>
                  {#if sitio.profile.sitioClassification.gida}
                    <Badge
                      variant="outline"
                      class="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    >
                      GIDA
                    </Badge>
                  {/if}
                </div>
              {/if}

              <!-- Header: Name & Location -->
              <div class="mb-3 flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <h3 class="truncate font-semibold text-foreground">
                    {sitio.sitioName}
                  </h3>
                  <p class="mt-0.5 truncate text-sm text-muted-foreground">
                    {sitio.barangay}, {sitio.municipality}
                  </p>
                </div>

                <!-- Actions Dropdown -->
                {#if isAdmin}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-8 shrink-0"
                        onclick={(e) => e.stopPropagation()}
                      >
                        <EllipsisVertical class="size-4" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item
                        onclick={(e) => {
                          e.stopPropagation();
                          navigateToSitio(sitio.id);
                        }}
                      >
                        <Eye class="mr-2 size-4" />
                        View Details
                      </DropdownMenu.Item>
                      {#if onEdit}
                        <DropdownMenu.Item
                          onclick={(e) => {
                            e.stopPropagation();
                            onEdit(sitio.id);
                          }}
                        >
                          <SquarePen class="mr-2 size-4" />
                          Edit Sitio
                        </DropdownMenu.Item>
                      {/if}
                      {#if onManageYears}
                        <DropdownMenu.Item
                          onclick={(e) => {
                            e.stopPropagation();
                            onManageYears(sitio.id);
                          }}
                        >
                          <Calendar class="mr-2 size-4" />
                          Manage Years
                        </DropdownMenu.Item>
                      {/if}
                      <DropdownMenu.Separator />
                      {#if onDownloadPDF}
                        <DropdownMenu.Item
                          onclick={(e) => {
                            e.stopPropagation();
                            onDownloadPDF(sitio.id);
                          }}
                        >
                          <Download class="mr-2 size-4" />
                          Download PDF
                        </DropdownMenu.Item>
                      {/if}
                      {#if onDelete}
                        <DropdownMenu.Item
                          onclick={(e) => {
                            e.stopPropagation();
                            onDelete(sitio.id);
                          }}
                          class="text-destructive"
                        >
                          <Trash2 class="mr-2 size-4" />
                          Delete
                        </DropdownMenu.Item>
                      {/if}
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                {/if}
              </div>

              <!-- Default Stats (if no indicators selected) -->
              {#if indicatorValues.length === 0}
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <Users class="size-4 text-muted-foreground" />
                    <div>
                      <p class="text-xs text-muted-foreground">Population</p>
                      <p class="text-sm font-medium">
                        {formatNumber(sitio.profile.totalPopulation ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <Home class="size-4 text-muted-foreground" />
                    <div>
                      <p class="text-xs text-muted-foreground">Households</p>
                      <p class="text-sm font-medium">
                        {formatNumber(sitio.profile.totalHouseholds ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              {:else}
                <!-- Selected Indicator Values -->
                <div class="grid grid-cols-2 gap-2">
                  {#each indicatorValues as indicator (indicator.key)}
                    <div class="rounded-md bg-muted/50 px-3 py-2">
                      <p class="truncate text-xs text-muted-foreground">
                        {indicator.label}
                      </p>
                      <p class="text-sm font-medium">{indicator.value}</p>
                    </div>
                  {/each}
                </div>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    {:else}
      <!-- Desktop Table View -->
      <div class="overflow-x-auto rounded-md border">
        <Table.Table>
          <Table.TableHeader>
            <Table.TableRow>
              <!-- Rank Column -->
              {#if selectedIndicators.length > 0}
                <Table.TableHead class="w-16 text-center">#</Table.TableHead>
              {/if}

              <!-- Sitio Name Column -->
              <Table.TableHead class="min-w-45">Sitio</Table.TableHead>

              <!-- Location Column -->
              <Table.TableHead class="min-w-50">Location</Table.TableHead>

              <!-- Dynamic Indicator Columns -->
              {#each displayIndicators as indicator (indicator.key)}
                {@const meta = INDICATORS_MAP.get(indicator.key)}
                {@const SortIcon = getSortDirectionIcon(indicator.key)}
                {@const priority = getSortPriority(indicator.key)}
                <Table.TableHead class="min-w-25 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <span class="truncate" title={meta?.label}>
                      {meta?.shortLabel || indicator.key}
                    </span>
                    {#if priority}
                      <Badge variant="secondary" class="ml-1 size-5 justify-center p-0 text-xs">
                        {priority}
                      </Badge>
                    {/if}
                    <SortIcon class="size-3 text-muted-foreground" />
                  </div>
                </Table.TableHead>
              {/each}

              <!-- Default columns if no indicators -->
              {#if displayIndicators.length === 0}
                <Table.TableHead class="w-28 text-right">Population</Table.TableHead>
                <Table.TableHead class="w-28 text-right">Households</Table.TableHead>
              {/if}

              <!-- Actions Column -->
              <Table.TableHead class="w-24 text-right">Actions</Table.TableHead>
            </Table.TableRow>
          </Table.TableHeader>

          <Table.TableBody>
            {#if sitios.length === 0}
              <Table.TableRow>
                <Table.TableCell
                  colspan={4 + displayIndicators.length + (displayIndicators.length === 0 ? 2 : 0)}
                  class="h-64"
                >
                  <Empty.Root class="border-none">
                    <Empty.Media>
                      <MapPin class="size-12 text-muted-foreground/50" />
                    </Empty.Media>
                    <Empty.Header>
                      <Empty.Title>
                        {hasActiveFilters ? 'No matching sitios' : 'No sitios found'}
                      </Empty.Title>
                      <Empty.Description>
                        {#if hasActiveFilters}
                          Try adjusting your search or filters to find what you're looking for.
                        {:else if isAdmin}
                          Get started by adding your first sitio or importing data from a CSV file.
                        {:else}
                          No sitio data is currently available.
                        {/if}
                      </Empty.Description>
                    </Empty.Header>
                    <Empty.Content>
                      <div class="flex flex-wrap justify-center gap-2">
                        {#if hasActiveFilters && onClearFilters}
                          <Button variant="outline" size="sm" onclick={onClearFilters}>
                            <FilterX class="mr-2 size-4" />
                            Clear Filters
                          </Button>
                        {/if}
                        {#if isAdmin}
                          <Button variant="outline" size="sm" onclick={() => goto('/admin/import')}>
                            <Upload class="mr-2 size-4" />
                            Import Data
                          </Button>
                          <Button size="sm" onclick={() => goto('/admin/sitios/new')}>
                            <Plus class="mr-2 size-4" />
                            Add Sitio
                          </Button>
                        {/if}
                      </div>
                    </Empty.Content>
                  </Empty.Root>
                </Table.TableCell>
              </Table.TableRow>
            {:else}
              {#each sitios as sitio, index (sitio.id)}
                {@const indicatorValues = getIndicatorValues(sitio)}
                <Table.TableRow
                  class="cursor-pointer transition-colors hover:bg-accent/10"
                  onclick={() => navigateToSitio(sitio.id)}
                >
                  <!-- Rank -->
                  {#if selectedIndicators.length > 0}
                    <Table.TableCell class="text-center">
                      <Badge variant="outline" class="font-mono">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </Badge>
                    </Table.TableCell>
                  {/if}

                  <!-- Sitio Name -->
                  <Table.TableCell>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{sitio.sitioName}</span>
                      {#if sitio.profile.sitioClassification.gida}
                        <Badge
                          variant="outline"
                          class="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        >
                          GIDA
                        </Badge>
                      {/if}
                      {#if sitio.profile.sitioClassification.indigenous}
                        <Badge
                          variant="outline"
                          class="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        >
                          IP
                        </Badge>
                      {/if}
                    </div>
                  </Table.TableCell>

                  <!-- Location -->
                  <Table.TableCell>
                    <div class="text-sm text-muted-foreground">
                      {sitio.barangay}, {sitio.municipality}
                    </div>
                  </Table.TableCell>

                  <!-- Dynamic Indicator Values -->
                  {#each indicatorValues as indicator (indicator.key)}
                    <Table.TableCell class="text-right font-medium tabular-nums">
                      {indicator.value}
                    </Table.TableCell>
                  {/each}

                  <!-- Default columns if no indicators -->
                  {#if displayIndicators.length === 0}
                    <Table.TableCell class="text-right font-medium tabular-nums">
                      {formatNumber(sitio.profile.totalPopulation ?? 0)}
                    </Table.TableCell>
                    <Table.TableCell class="text-right font-medium tabular-nums">
                      {formatNumber(sitio.profile.totalHouseholds ?? 0)}
                    </Table.TableCell>
                  {/if}

                  <!-- Actions -->
                  <Table.TableCell class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      {#if isAdmin && onEdit}
                        <Button
                          variant="ghost"
                          size="icon"
                          onclick={(e) => {
                            e.stopPropagation();
                            onEdit(sitio.id);
                          }}
                        >
                          <SquarePen class="size-4" />
                        </Button>
                      {/if}

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          <Button variant="ghost" size="icon" onclick={(e) => e.stopPropagation()}>
                            <EllipsisVertical class="size-4" />
                          </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Item
                            onclick={(e) => {
                              e.stopPropagation();
                              navigateToSitio(sitio.id);
                            }}
                          >
                            <Eye class="mr-2 size-4" />
                            View Details
                          </DropdownMenu.Item>

                          {#if isAdmin && onEdit}
                            <DropdownMenu.Item
                              onclick={(e) => {
                                e.stopPropagation();
                                onEdit(sitio.id);
                              }}
                            >
                              <SquarePen class="mr-2 size-4" />
                              Edit Sitio
                            </DropdownMenu.Item>
                          {/if}

                          {#if isAdmin && onManageYears}
                            <DropdownMenu.Item
                              onclick={(e) => {
                                e.stopPropagation();
                                onManageYears(sitio.id);
                              }}
                            >
                              <Calendar class="mr-2 size-4" />
                              Manage Years
                            </DropdownMenu.Item>
                          {/if}

                          <DropdownMenu.Separator />

                          {#if onDownloadPDF}
                            <DropdownMenu.Item
                              onclick={(e) => {
                                e.stopPropagation();
                                onDownloadPDF(sitio.id);
                              }}
                            >
                              <Download class="mr-2 size-4" />
                              Download PDF
                            </DropdownMenu.Item>
                          {/if}

                          {#if isAdmin && onDelete}
                            <DropdownMenu.Item
                              onclick={(e) => {
                                e.stopPropagation();
                                onDelete(sitio.id);
                              }}
                              class="text-destructive"
                            >
                              <Trash2 class="mr-2 size-4" />
                              Delete
                            </DropdownMenu.Item>
                          {/if}
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                  </Table.TableCell>
                </Table.TableRow>
              {/each}
            {/if}
          </Table.TableBody>
        </Table.Table>
      </div>
    {/if}
  </Card.CardContent>

  <!-- Pagination -->
  {#if totalPages > 1}
    <Card.CardFooter class="flex flex-col gap-3 sm:flex-row sm:justify-between">
      <div class="text-center text-sm text-muted-foreground sm:text-left">
        {#if isMobile.current}
          Page {currentPage} of {totalPages}
        {:else}
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
            currentPage * itemsPerPage,
            totalCount
          )} of {totalCount} sitios
        {/if}
      </div>
      <div class="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onclick={() => handlePageChange(Math.max(1, currentPage - 1))}
        >
          Previous
        </Button>
        {#if !isMobile.current}
          <div class="flex items-center gap-1">
            {#each Array(totalPages) as _, i (i)}
              {#if i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
                <Button
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onclick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              {:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
                <span class="px-2">...</span>
              {/if}
            {/each}
          </div>
        {/if}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onclick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
        </Button>
      </div>
    </Card.CardFooter>
  {/if}
</Card.Card>
