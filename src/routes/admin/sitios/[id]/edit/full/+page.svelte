<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import BasicInfoTab from '$lib/components/admin/sitios/BasicInfoTab.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { SitioRecord } from '$lib/types';
  import { cn } from '$lib/utils';
  import { loadSitios, updateSitio } from '$lib/utils/storage';
  import { AlertTriangle, ArrowLeft, Info, Loader2, MapPin, Save, Shield, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    data: {
      id: string;
    };
  }

  let { data }: Props = $props();

  // Parse sitio ID
  const sitioId = $derived(parseInt(data.id));

  // State
  let sitio = $state<SitioRecord | null>(null);
  let isLoading = $state(true);
  let isSaving = $state(false);
  let cancelDialogOpen = $state(false);
  let saveConfirmDialogOpen = $state(false);
  let hasUnsavedChanges = $state(false);
  let changeReason = $state('');

  // Permission check
  const canEditCore = $derived(authStore.canEditCoreIdentifiers());

  // ===== Core Identifiers =====
  let municipality = $state('');
  let barangay = $state('');
  let sitioName = $state('');
  let sitioCode = $state('');
  let latitude = $state(0);
  let longitude = $state(0);
  let sitioClassification = $state({
    gida: false,
    indigenous: false,
    conflict: false
  });
  let mainAccess = $state('');

  // Validation
  const isBasicInfoValid = $derived(
    municipality.trim() !== '' && barangay.trim() !== '' && sitioName.trim() !== ''
  );

  const canSave = $derived(isBasicInfoValid && changeReason.trim() !== '');

  // Load sitio data
  onMount(() => {
    // Check permission
    if (!canEditCore) {
      toast.error('You do not have permission to edit core sitio information');
      goto(`/admin/sitios/${data.id}/edit`);
      return;
    }

    const sitios = loadSitios();
    const found = sitios.find((s) => s.id === sitioId);

    if (found) {
      sitio = found;
      // Load core identifiers
      municipality = found.municipality;
      barangay = found.barangay;
      sitioName = found.sitioName;
      sitioCode = found.coding;
      latitude = found.latitude;
      longitude = found.longitude;
      sitioClassification = { ...found.sitioClassification };

      // Load main access from latest year if available
      if (found.availableYears.length > 0) {
        const latestYear = Math.max(...found.availableYears).toString();
        const yearData = found.yearlyData[latestYear];
        if (yearData?.mainAccess) {
          if (yearData.mainAccess.pavedRoad) mainAccess = 'pavedRoad';
          else if (yearData.mainAccess.unpavedRoad) mainAccess = 'unpavedRoad';
          else if (yearData.mainAccess.footpath) mainAccess = 'footpath';
          else if (yearData.mainAccess.boat) mainAccess = 'boat';
        }
      }
    }
    isLoading = false;
  });

  function handleSaveClick() {
    if (!isBasicInfoValid) {
      toast.error('Please complete required fields');
      return;
    }
    saveConfirmDialogOpen = true;
  }

  async function handleSave() {
    if (!sitio || !isBasicInfoValid || !changeReason.trim()) {
      toast.error('Please provide a reason for changing core identifiers');
      return;
    }

    isSaving = true;
    saveConfirmDialogOpen = false;

    // Build the main access object for yearly data
    const mainAccessObj = {
      pavedRoad: mainAccess === 'pavedRoad',
      unpavedRoad: mainAccess === 'unpavedRoad',
      footpath: mainAccess === 'footpath',
      boat: mainAccess === 'boat'
    };

    // Update main access in all yearly data
    const updatedYearlyData = { ...sitio.yearlyData };
    for (const year of Object.keys(updatedYearlyData)) {
      updatedYearlyData[year] = {
        ...updatedYearlyData[year],
        mainAccess: mainAccessObj
      };
    }

    const success = updateSitio(sitio.id, {
      municipality,
      barangay,
      sitioName,
      coding: sitioCode,
      latitude,
      longitude,
      sitioClassification: { ...sitioClassification },
      yearlyData: updatedYearlyData,
      updatedAt: new Date().toISOString()
    });

    // Simulate slight delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    isSaving = false;

    if (success) {
      // Log the change reason in audit
      authStore.logAction(
        'update',
        'sitio',
        sitio.id,
        sitioName,
        `Core identifiers updated. Reason: ${changeReason}`
      );

      toast.success('Core identifiers updated successfully!', {
        description: `${sitioName} has been updated.`
      });
      hasUnsavedChanges = false;
      changeReason = '';

      // Redirect back to normal edit
      goto(`/admin/sitios/${sitio.id}/edit`);
    } else {
      toast.error('Failed to update sitio');
    }
  }

  function handleCancel() {
    if (hasUnsavedChanges) {
      cancelDialogOpen = true;
    } else {
      goto(`/admin/sitios/${data.id}/edit`);
    }
  }

  function confirmCancel() {
    goto(`/admin/sitios/${data.id}/edit`);
  }

  // Track changes
  $effect(() => {
    municipality;
    barangay;
    sitioName;
    sitioCode;
    latitude;
    longitude;
    if (sitio) {
      hasUnsavedChanges = true;
    }
  });
</script>

<svelte:head>
  <title>Full Edit {sitio?.sitioName || 'Sitio'} - Admin</title>
</svelte:head>

{#if isLoading}
  <div class="flex min-h-screen items-center justify-center">
    <Loader2 class="size-8 animate-spin text-muted-foreground" />
  </div>
{:else if !canEditCore}
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <Shield class="mx-auto mb-4 size-16 text-destructive/50" />
      <h1 class="mb-4 text-3xl font-bold">Access Denied</h1>
      <p class="mb-6 text-muted-foreground">
        You do not have permission to edit core sitio information.
      </p>
      <Button href="/admin/sitios/{data.id}/edit">
        <ArrowLeft class="mr-2" />
        Back to Edit
      </Button>
    </div>
  </div>
{:else if !sitio}
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="mb-4 text-3xl font-bold">Sitio Not Found</h1>
      <p class="mb-6 text-muted-foreground">The sitio you're looking for doesn't exist.</p>
      <Button href="/admin/sitios">
        <ArrowLeft class="mr-2" />
        Back to Sitios
      </Button>
    </div>
  </div>
{:else}
  <div class="flex min-h-screen flex-col bg-linear-to-b from-muted/30 via-background to-muted/20">
    <!-- Header -->
    <AdminHeader
      sticky
      title="Full Edit Mode"
      description="Edit core identifiers for {sitio.sitioName}"
      breadcrumbs={[
        { label: 'Sitios', href: '/admin/sitios' },
        { label: sitio.sitioName, href: `/admin/sitios/${sitio.id}/edit` },
        { label: 'Full Edit' }
      ]}
    >
      <!-- {#snippet badges()}
				<Badge variant="destructive" class="gap-1.5">
					<Shield class="size-3" />
					Superadmin Only
				</Badge>
			{/snippet} -->
      {#snippet actions()}
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            onclick={handleCancel}
            disabled={isSaving}
            size="sm"
            class="gap-2"
          >
            <X class="size-4" />
            <span class="hidden sm:inline">Cancel</span>
          </Button>
          <Button
            onclick={handleSaveClick}
            disabled={!isBasicInfoValid || isSaving}
            size="sm"
            class={cn(
              'gap-2 transition-all duration-300',
              isBasicInfoValid &&
                !isSaving &&
                'bg-linear-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
            )}
          >
            {#if isSaving}
              <Loader2 class="size-4 animate-spin" />
              <span class="hidden sm:inline">Saving...</span>
            {:else}
              <Save class="size-4" />
              <span class="hidden sm:inline">Save Changes</span>
            {/if}
          </Button>
        </div>
      {/snippet}
    </AdminHeader>

    <!-- Warning Banner -->
    <div class="hidden border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 md:px-6">
      <div class="mx-auto max-w-7xl">
        <div class="flex items-start gap-3 text-sm">
          <AlertTriangle class="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p class="font-medium text-amber-800 dark:text-amber-200">
              You are editing core identifiers
            </p>
            <p class="mt-1 text-amber-700 dark:text-amber-300">
              These fields define the sitio's identity and are permanent across all years. Changes
              here affect the entire sitio record and require a documented reason for audit
              purposes.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 md:p-6 lg:p-8">
      <div class="mx-auto max-w-4xl">
        <!-- Form Content -->
        <Card.Root class="overflow-hidden border-0 shadow-xl">
          <Card.Header class="border-b bg-muted/30">
            <div class="flex items-center gap-3">
              <div
                class="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <MapPin class="size-5" />
              </div>
              <div>
                <Card.Title>Core Sitio Information</Card.Title>
                <Card.Description>
                  Location, classification, and identification details
                </Card.Description>
              </div>
            </div>
          </Card.Header>
          <Card.Content class="p-6">
            <BasicInfoTab
              bind:municipality
              bind:barangay
              bind:sitioName
              bind:sitioCode
              bind:latitude
              bind:longitude
              bind:sitioClassification
              bind:mainAccess
            />
          </Card.Content>
        </Card.Root>

        <!-- Change Reason Section -->
        <Card.Root class="mt-6 hidden overflow-hidden border-amber-500/30 shadow-lg">
          <Card.Header class="border-b border-amber-500/20 bg-amber-500/5">
            <div class="flex items-center gap-3">
              <Info class="size-5 text-amber-600" />
              <div>
                <Card.Title class="text-amber-800 dark:text-amber-200"
                  >Reason for Changes</Card.Title
                >
                <Card.Description class="text-amber-700 dark:text-amber-300">
                  Required for audit trail documentation
                </Card.Description>
              </div>
            </div>
          </Card.Header>
          <Card.Content class="p-6">
            <div class="space-y-2">
              <Label for="changeReason" class="flex items-center gap-1.5">
                Change Reason <span class="text-destructive">*</span>
              </Label>
              <Textarea
                id="changeReason"
                bind:value={changeReason}
                placeholder="Please explain why you are changing the core identifiers (e.g., correction of spelling error, administrative boundary change, etc.)"
                rows={3}
                class={cn(
                  'transition-all',
                  changeReason && 'border-amber-500/30 bg-amber-500/5 ring-1 ring-amber-500/20'
                )}
              />
              <p class="text-xs text-muted-foreground">
                This reason will be recorded in the audit log for compliance purposes.
              </p>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Action Buttons -->
        <div class="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onclick={handleCancel} disabled={isSaving}>Cancel</Button>
          <Button
            onclick={handleSaveClick}
            disabled={!canSave || isSaving}
            class={cn(
              'gap-2',
              canSave &&
                !isSaving &&
                'bg-linear-to-r from-primary to-primary/80 shadow-md hover:shadow-lg'
            )}
          >
            {#if isSaving}
              <Loader2 class="size-4 animate-spin" />
              Saving...
            {:else}
              <Save class="size-4" />
              Save Core Changes
            {/if}
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- Cancel Confirmation Dialog -->
  <AlertDialog.Root bind:open={cancelDialogOpen}>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Discard Changes</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to cancel? Any unsaved changes will be lost.
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Continue Editing</AlertDialog.Cancel>
        <AlertDialog.Action onclick={confirmCancel} class="bg-destructive hover:bg-destructive/60">
          Discard Changes
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>

  <!-- Save Confirmation Dialog -->
  <AlertDialog.Root bind:open={saveConfirmDialogOpen}>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Confirm Core Changes</AlertDialog.Title>
        <AlertDialog.Description>
          You are about to update core identifiers for <strong>{sitio.sitioName}</strong>. These
          changes will affect the entire sitio record across all years.
        </AlertDialog.Description>
      </AlertDialog.Header>
      {#if !changeReason.trim()}
        <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p class="text-sm text-destructive">
            Please provide a reason for your changes before saving.
          </p>
        </div>
      {:else}
        <div class="rounded-lg border bg-muted/50 p-3">
          <p class="text-xs font-medium text-muted-foreground">Change Reason:</p>
          <p class="mt-1 text-sm">{changeReason}</p>
        </div>
      {/if}
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action
          onclick={handleSave}
          disabled={!changeReason.trim()}
          class={cn(!changeReason.trim() && 'cursor-not-allowed opacity-50')}
        >
          Confirm & Save
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/if}
