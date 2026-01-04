<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import ConfigResetDialog from '$lib/components/admin/config/ConfigResetDialog.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    getPovertyThresholds,
    hasPovertyThresholdsOverride,
    INCOME_CLUSTER_MULTIPLIERS,
    INCOME_CLUSTERS_ORDERED,
    resetPovertyThresholdsConfig,
    savePovertyThresholdsConfig
  } from '$lib/config/poverty-thresholds';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { PovertyThresholdsConfig } from '$lib/utils/config-storage';
  import { ArrowLeft, Banknote, Info, RotateCcw, Save } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  let config = $state<PovertyThresholdsConfig | null>(null);
  let hasChanges = $state(false);
  let hasOverride = $state(false);
  let isResetDialogOpen = $state(false);

  const canManageConfig = $derived(authStore.isSuperadmin);
  const dailyThreshold = $derived(config ? config.monthlyThreshold / 30 : 0);

  onMount(() => {
    config = getPovertyThresholds();
    hasOverride = hasPovertyThresholdsOverride();
  });

  function handleSave() {
    if (!config || !canManageConfig) return;

    const success = savePovertyThresholdsConfig(
      config,
      `Updated poverty threshold to ₱${config.monthlyThreshold.toLocaleString()}/month`
    );
    if (success) {
      toast.success('Configuration saved successfully');
      hasChanges = false;
      hasOverride = true;
    } else {
      toast.error('Failed to save configuration');
    }
  }

  function handleReset() {
    if (!canManageConfig) return;
    const success = resetPovertyThresholdsConfig();
    if (success) {
      config = getPovertyThresholds();
      hasChanges = false;
      hasOverride = false;
      isResetDialogOpen = false;
      toast.success('Configuration reset to defaults');
    } else {
      toast.error('Failed to reset configuration');
    }
  }

  function markChanged() {
    hasChanges = true;
  }

  function getClusterRange(cluster: keyof typeof INCOME_CLUSTER_MULTIPLIERS) {
    const multipliers = INCOME_CLUSTER_MULTIPLIERS[cluster];
    const daily = dailyThreshold;

    if ('min' in multipliers && 'max' in multipliers) {
      return `₱${(daily * multipliers.min).toFixed(2)} – ₱${(daily * multipliers.max).toFixed(2)}/day`;
    } else if ('max' in multipliers) {
      return `< ₱${(daily * multipliers.max).toFixed(2)}/day`;
    } else if ('min' in multipliers) {
      return `≥ ₱${(daily * multipliers.min).toFixed(2)}/day`;
    }
    return '';
  }
</script>

<svelte:head>
  <title>Poverty Thresholds | Config | Admin</title>
</svelte:head>

<div class="flex flex-col">
  <AdminHeader
    title="Poverty Thresholds"
    description="Income classification thresholds and poverty line definitions"
    breadcrumbs={[
      { label: 'Configuration', href: '/admin/config' },
      { label: 'Poverty Thresholds' }
    ]}
  >
    {#snippet actions()}
      {#if hasOverride}
        <Badge variant="secondary" class="gap-1">
          <div class="size-1.5 rounded-full bg-orange-500"></div>
          Customized
        </Badge>
      {/if}
      <Button variant="outline" size="sm" onclick={() => goto('/admin/config')}>
        <ArrowLeft class="size-4" />
        Back
      </Button>
      {#if canManageConfig}
        <Button
          variant="outline"
          size="sm"
          onclick={() => (isResetDialogOpen = true)}
          disabled={!hasOverride}
        >
          <RotateCcw class="size-4" />
          Reset
        </Button>
        <Button size="sm" onclick={handleSave} disabled={!hasChanges}>
          <Save class="size-4" />
          Save Changes
        </Button>
      {/if}
    {/snippet}
  </AdminHeader>

  <div class="flex flex-col gap-6 p-4 md:p-6">
    {#if !canManageConfig}
      <Card.Root>
        <Card.Content class="py-8 text-center">
          <p class="text-muted-foreground">
            You need superadmin privileges to manage configuration.
          </p>
        </Card.Content>
      </Card.Root>
    {:else if config}
      <!-- Threshold Configuration -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <Banknote class="size-5" />
            </div>
            <div>
              <Card.Title>Poverty Line Threshold</Card.Title>
              <Card.Description
                >Official poverty threshold for income classification</Card.Description
              >
            </div>
          </div>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div
            class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30"
          >
            <div class="flex gap-2">
              <Info class="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div class="space-y-1 text-sm text-blue-900 dark:text-blue-100">
                <p class="font-medium">Monthly threshold is the primary value</p>
                <p class="text-blue-700 dark:text-blue-300">
                  Daily threshold is automatically calculated by dividing the monthly threshold by
                  30. Income cluster ranges are based on fixed multipliers (1x, 2x, 4x, 7x, 12x,
                  20x) of the daily threshold.
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="monthly-threshold">Monthly Threshold (₱)</Label>
              <Input
                id="monthly-threshold"
                type="number"
                step="100"
                bind:value={config.monthlyThreshold}
                oninput={markChanged}
              />
              <p class="text-xs text-muted-foreground">
                Official monthly poverty line for a {config.description.toLowerCase()}
              </p>
            </div>

            <div class="space-y-2">
              <Label for="daily-threshold">Daily Threshold (₱)</Label>
              <Input
                id="daily-threshold"
                type="number"
                value={dailyThreshold.toFixed(2)}
                disabled
                class="bg-muted"
              />
              <p class="text-xs text-muted-foreground">Calculated automatically (monthly ÷ 30)</p>
            </div>

            <div class="space-y-2">
              <Label for="reference-year">Reference Year</Label>
              <Input
                id="reference-year"
                type="number"
                bind:value={config.referenceYear}
                oninput={markChanged}
              />
            </div>

            <div class="space-y-2">
              <Label for="source">Source</Label>
              <Input
                id="source"
                bind:value={config.source}
                oninput={markChanged}
                placeholder="e.g., DEPDev, PSA"
              />
            </div>

            <div class="space-y-2 sm:col-span-2">
              <Label for="description">Description</Label>
              <Input
                id="description"
                bind:value={config.description}
                oninput={markChanged}
                placeholder="e.g., Poverty threshold for a family of 5"
              />
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Income Cluster Preview -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Income Cluster Ranges (Preview)</Card.Title>
          <Card.Description>
            How income clusters are calculated based on the current threshold
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div
            class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
          >
            <div class="flex gap-2">
              <Info class="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div class="space-y-1 text-sm text-amber-900 dark:text-amber-100">
                <p class="font-medium">Cluster ranges based on research</p>
                <p class="text-amber-700 dark:text-amber-300">
                  The income cluster multipliers (1x, 2x, 4x, 7x, 12x, 20x) are derived from:
                  Defining and Profiling the Middle Class. Philippine Institute for Development
                  Studies.
                  <a
                    href="https://pidswebs.pids.gov.ph/CDN/PUBLICATIONS/pidspn1818.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline hover:text-amber-900 dark:hover:text-amber-100"
                    >https://pidswebs.pids.gov.ph/CDN/PUBLICATIONS/pidspn1818.pdf</a
                  >
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            {#each INCOME_CLUSTERS_ORDERED as cluster}
              {@const multipliers = INCOME_CLUSTER_MULTIPLIERS[cluster]}
              {@const multiplierText =
                'min' in multipliers && 'max' in multipliers
                  ? `${multipliers.min}x – ${multipliers.max}x`
                  : 'max' in multipliers
                    ? `< ${multipliers.max}x`
                    : `≥ ${multipliers.min}x`}
              <div class="flex items-center justify-between rounded-lg border p-3">
                <div class="space-y-1">
                  <p class="font-medium capitalize">{cluster.replace('_', ' ')}</p>
                  <p class="text-sm text-muted-foreground">
                    {multiplierText} poverty line
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-mono text-sm font-medium">
                    {getClusterRange(cluster)}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</div>

<ConfigResetDialog
  bind:open={isResetDialogOpen}
  sectionName="Poverty Thresholds"
  onConfirm={handleReset}
  onCancel={() => (isResetDialogOpen = false)}
/>
