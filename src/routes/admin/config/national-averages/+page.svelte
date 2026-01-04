<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import ConfigResetDialog from '$lib/components/admin/config/ConfigResetDialog.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    getLaborEmploymentAverages,
    getNationalAverages,
    hasNationalAveragesOverride,
    resetNationalAveragesConfig,
    saveNationalAveragesConfig
  } from '$lib/config/national-averages';
  import { authStore } from '$lib/stores/auth.svelte';
  import type {
    LaborEmploymentAveragesConfig,
    NationalAveragesConfig
  } from '$lib/utils/config-storage';
  import { ArrowLeft, ChevronDown, RotateCcw, Save, TrendingUp } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  let infrastructureConfig = $state<NationalAveragesConfig | null>(null);
  let laborConfig = $state<LaborEmploymentAveragesConfig | null>(null);
  let hasChanges = $state(false);
  let hasOverride = $state(false);
  let isResetDialogOpen = $state(false);
  let openSections = $state<Record<string, boolean>>({
    infrastructure: true,
    labor: true
  });

  const canManageConfig = $derived(authStore.isSuperadmin);

  onMount(() => {
    infrastructureConfig = getNationalAverages();
    laborConfig = getLaborEmploymentAverages();
    hasOverride = hasNationalAveragesOverride();
  });

  function handleSave() {
    if (!infrastructureConfig || !laborConfig || !canManageConfig) return;

    const combined = {
      ...infrastructureConfig,
      ...laborConfig
    };

    const success = saveNationalAveragesConfig(combined, 'Updated national averages configuration');
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
    const success = resetNationalAveragesConfig();
    if (success) {
      infrastructureConfig = getNationalAverages();
      laborConfig = getLaborEmploymentAverages();
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
</script>

<svelte:head>
  <title>National Averages | Config | Admin</title>
</svelte:head>

<div class="flex flex-col">
  <AdminHeader
    title="National Averages"
    description="Philippine benchmark data for infrastructure and demographics"
    breadcrumbs={[
      { label: 'Configuration', href: '/admin/config' },
      { label: 'National Averages' }
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
    {:else if infrastructureConfig && laborConfig}
      <!-- Infrastructure & Utilities Section -->
      <Collapsible.Root bind:open={openSections.infrastructure}>
        <Card.Root>
          <Card.Header>
            <Collapsible.Trigger class="flex w-full items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <TrendingUp class="size-5" />
                </div>
                <div class="text-left">
                  <Card.Title>Infrastructure & Utilities</Card.Title>
                  <Card.Description>National averages for infrastructure access</Card.Description>
                </div>
              </div>
              <ChevronDown
                class="size-5 transition-transform {openSections.infrastructure
                  ? 'rotate-180'
                  : ''}"
              />
            </Collapsible.Trigger>
          </Card.Header>
          <Collapsible.Content>
            <Card.Content class="space-y-6">
              <!-- Electricity -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Electricity Access</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="electricity-percent">Percentage</Label>
                    <Input
                      id="electricity-percent"
                      type="number"
                      step="0.01"
                      bind:value={infrastructureConfig.electricity.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="electricity-source">Source</Label>
                    <Input
                      id="electricity-source"
                      bind:value={infrastructureConfig.electricity.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="electricity-url">URL</Label>
                    <Input
                      id="electricity-url"
                      type="url"
                      bind:value={infrastructureConfig.electricity.url}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Sanitary Toilet -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Sanitary Toilet Access</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="sanitary-percent">Percentage</Label>
                    <Input
                      id="sanitary-percent"
                      type="number"
                      step="0.01"
                      bind:value={infrastructureConfig.sanitaryToilet.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="sanitary-source">Source</Label>
                    <Input
                      id="sanitary-source"
                      bind:value={infrastructureConfig.sanitaryToilet.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="sanitary-url">URL</Label>
                    <Input
                      id="sanitary-url"
                      type="url"
                      bind:value={infrastructureConfig.sanitaryToilet.url}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Internet -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Internet Access</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="internet-percent">Percentage</Label>
                    <Input
                      id="internet-percent"
                      type="number"
                      step="0.01"
                      bind:value={infrastructureConfig.internet.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="internet-source">Source</Label>
                    <Input
                      id="internet-source"
                      bind:value={infrastructureConfig.internet.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="internet-url">URL</Label>
                    <Input
                      id="internet-url"
                      type="url"
                      bind:value={infrastructureConfig.internet.url}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Paved Roads -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Paved Roads</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="paved-percent">Percentage</Label>
                    <Input
                      id="paved-percent"
                      type="number"
                      step="0.01"
                      bind:value={infrastructureConfig.pavedRoads.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="paved-source">Source</Label>
                    <Input
                      id="paved-source"
                      bind:value={infrastructureConfig.pavedRoads.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="paved-url">URL</Label>
                    <Input
                      id="paved-url"
                      type="url"
                      bind:value={infrastructureConfig.pavedRoads.url}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Unpaved Roads -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Unpaved Roads</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="unpaved-percent">Percentage</Label>
                    <Input
                      id="unpaved-percent"
                      type="number"
                      step="0.01"
                      bind:value={infrastructureConfig.unpavedRoads.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="unpaved-source">Source</Label>
                    <Input
                      id="unpaved-source"
                      bind:value={infrastructureConfig.unpavedRoads.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="unpaved-url">URL</Label>
                    <Input
                      id="unpaved-url"
                      type="url"
                      bind:value={infrastructureConfig.unpavedRoads.url}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>
            </Card.Content>
          </Collapsible.Content>
        </Card.Root>
      </Collapsible.Root>

      <!-- Labor & Employment Section -->
      <Collapsible.Root bind:open={openSections.labor}>
        <Card.Root>
          <Card.Header>
            <Collapsible.Trigger class="flex w-full items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <TrendingUp class="size-5" />
                </div>
                <div class="text-left">
                  <Card.Title>Labor & Employment</Card.Title>
                  <Card.Description
                    >National statistics for workforce and dependency ratios</Card.Description
                  >
                </div>
              </div>
              <ChevronDown
                class="size-5 transition-transform {openSections.labor ? 'rotate-180' : ''}"
              />
            </Collapsible.Trigger>
          </Card.Header>
          <Collapsible.Content>
            <Card.Content class="space-y-6">
              <!-- Unemployment Rate -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Unemployment Rate</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="unemployment-percent">Percentage</Label>
                    <Input
                      id="unemployment-percent"
                      type="number"
                      step="0.1"
                      bind:value={laborConfig.unemploymentRate.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="unemployment-source">Source</Label>
                    <Input
                      id="unemployment-source"
                      bind:value={laborConfig.unemploymentRate.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="unemployment-url">URL</Label>
                    <Input
                      id="unemployment-url"
                      type="url"
                      bind:value={laborConfig.unemploymentRate.url}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="unemployment-description">Description</Label>
                    <Input
                      id="unemployment-description"
                      bind:value={laborConfig.unemploymentRate.description}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Age Dependency Ratio -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Age Dependency Ratio</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="age-dependency-percent">Percentage</Label>
                    <Input
                      id="age-dependency-percent"
                      type="number"
                      step="0.1"
                      bind:value={laborConfig.ageDependencyRatio.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="age-dependency-source">Source</Label>
                    <Input
                      id="age-dependency-source"
                      bind:value={laborConfig.ageDependencyRatio.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="age-dependency-url">URL</Label>
                    <Input
                      id="age-dependency-url"
                      type="url"
                      bind:value={laborConfig.ageDependencyRatio.url}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="age-dependency-description">Description</Label>
                    <Input
                      id="age-dependency-description"
                      bind:value={laborConfig.ageDependencyRatio.description}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Youth Dependency Ratio -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Youth Dependency Ratio</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="youth-dependency-percent">Percentage</Label>
                    <Input
                      id="youth-dependency-percent"
                      type="number"
                      step="0.1"
                      bind:value={laborConfig.youthDependencyRatio.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="youth-dependency-source">Source</Label>
                    <Input
                      id="youth-dependency-source"
                      bind:value={laborConfig.youthDependencyRatio.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="youth-dependency-url">URL</Label>
                    <Input
                      id="youth-dependency-url"
                      type="url"
                      bind:value={laborConfig.youthDependencyRatio.url}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="youth-dependency-description">Description</Label>
                    <Input
                      id="youth-dependency-description"
                      bind:value={laborConfig.youthDependencyRatio.description}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Old Age Dependency Ratio -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Old-Age Dependency Ratio</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="old-age-dependency-percent">Percentage</Label>
                    <Input
                      id="old-age-dependency-percent"
                      type="number"
                      step="0.1"
                      bind:value={laborConfig.oldAgeDependencyRatio.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="old-age-dependency-source">Source</Label>
                    <Input
                      id="old-age-dependency-source"
                      bind:value={laborConfig.oldAgeDependencyRatio.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="old-age-dependency-url">URL</Label>
                    <Input
                      id="old-age-dependency-url"
                      type="url"
                      bind:value={laborConfig.oldAgeDependencyRatio.url}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="old-age-dependency-description">Description</Label>
                    <Input
                      id="old-age-dependency-description"
                      bind:value={laborConfig.oldAgeDependencyRatio.description}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>

              <!-- Working Age Percent -->
              <div class="space-y-3 rounded-lg border p-4">
                <h4 class="font-semibold">Working Age Population</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="working-age-percent">Percentage</Label>
                    <Input
                      id="working-age-percent"
                      type="number"
                      step="0.1"
                      bind:value={laborConfig.workingAgePercent.percent}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="working-age-source">Source</Label>
                    <Input
                      id="working-age-source"
                      bind:value={laborConfig.workingAgePercent.source}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="working-age-url">URL</Label>
                    <Input
                      id="working-age-url"
                      type="url"
                      bind:value={laborConfig.workingAgePercent.url}
                      oninput={markChanged}
                    />
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                    <Label for="working-age-description">Description</Label>
                    <Input
                      id="working-age-description"
                      bind:value={laborConfig.workingAgePercent.description}
                      oninput={markChanged}
                    />
                  </div>
                </div>
              </div>
            </Card.Content>
          </Collapsible.Content>
        </Card.Root>
      </Collapsible.Root>
    {/if}
  </div>
</div>

<ConfigResetDialog
  bind:open={isResetDialogOpen}
  sectionName="National Averages"
  onConfirm={handleReset}
  onCancel={() => (isResetDialogOpen = false)}
/>
