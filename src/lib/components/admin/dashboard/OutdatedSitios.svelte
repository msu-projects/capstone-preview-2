<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { AlertTriangle, Calendar, ExternalLink } from '@lucide/svelte';

  interface OutdatedSitio {
    id: number;
    name: string;
    municipality: string;
    barangay: string;
    lastUpdated: string;
    daysSinceUpdate: number;
  }

  interface Props {
    sitios?: OutdatedSitio[];
    isLoading?: boolean;
  }

  let { sitios = [], isLoading = false }: Props = $props();

  function getSeverityColor(days: number): 'destructive' | 'secondary' | 'outline' {
    if (days > 730) return 'destructive'; // More than 2 years
    if (days > 365) return 'outline'; // More than 1 year
    return 'secondary'; // Less than 1 year but still outdated
  }

  function formatDaysAgo(days: number) {
    if (days > 730) {
      const years = Math.floor(days / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    if (days > 365) {
      return 'Over 1 year ago';
    }
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
</script>

<Card.Root>
  <Card.Header>
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <Card.Title class="flex items-center gap-2">
          <AlertTriangle class="size-5 text-orange-500" />
          Outdated Sitios
        </Card.Title>
        <Card.Description>Sitios that haven't been updated recently</Card.Description>
      </div>
      {#if sitios.length > 0}
        <Badge variant="outline" class="gap-1.5">
          {sitios.length} sitio{sitios.length !== 1 ? 's' : ''}
        </Badge>
      {/if}
    </div>
  </Card.Header>
  <Card.Content>
    {#if isLoading}
      <div class="space-y-4">
        {#each Array(5) as _}
          <div class="flex items-start gap-3">
            <Skeleton class="size-10 shrink-0 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
            </div>
          </div>
        {/each}
      </div>
    {:else if sitios.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
          <Calendar class="size-6 text-green-600 dark:text-green-400" />
        </div>
        <p class="mt-4 text-sm font-medium text-foreground">All sitios are up to date</p>
        <p class="mt-1 text-sm text-muted-foreground">No sitios require attention at this time</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each sitios as sitio}
          <div
            class="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20"
            >
              <AlertTriangle class="size-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div class="flex-1 space-y-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-sm leading-none font-medium">{sitio.name}</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {sitio.barangay}, {sitio.municipality}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  href={`/admin/sitios/${sitio.id}`}
                >
                  <ExternalLink class="size-4" />
                </Button>
              </div>
              <div class="flex items-center gap-2">
                <Badge variant={getSeverityColor(sitio.daysSinceUpdate)} class="text-xs">
                  Last updated {formatDaysAgo(sitio.daysSinceUpdate)}
                </Badge>
                {#if sitio.daysSinceUpdate > 730}
                  <Badge variant="outline" class="text-xs text-red-600 dark:text-red-400">
                    Critical
                  </Badge>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if sitios.length >= 5}
        <div class="mt-4 text-center">
          <Button variant="ghost" size="sm" class="gap-2">
            View all outdated sitios
            <ExternalLink class="size-3" />
          </Button>
        </div>
      {/if}
    {/if}
  </Card.Content>
</Card.Root>
