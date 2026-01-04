<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { CurrencyInput } from '$lib/components/ui/currency-input';
  import { FormSection } from '$lib/components/ui/form-section';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { LocationPicker } from '$lib/components/ui/location-picker';
  import { SitioMultiSelect } from '$lib/components/ui/sitio-multi-select';
  import { Textarea } from '$lib/components/ui/textarea';
  import { authStore } from '$lib/stores/auth.svelte';
  import { validateImageFile } from '$lib/utils/image-utils';
  import { addProject } from '$lib/utils/project-storage';
  import { ArrowLeft, FileText, ImagePlus, Loader2, MapPin, Save, Trash2, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  // Permission check
  const canCreate = $derived(authStore.canCreateSitio());

  // State
  let isSaving = $state(false);
  let cancelDialogOpen = $state(false);
  let hasUnsavedChanges = $state(false);
  let isLoading = $state(true);

  // Form data
  let title = $state('');
  let description = $state('');
  let latitude = $state(0);
  let longitude = $state(0);
  let sitioIds = $state<number[]>([]);
  let cost = $state(0);
  let projectDate = $state('');
  let images = $state<string[]>([]);

  // Image upload state
  let imageUploadError = $state('');
  let isUploadingImage = $state(false);

  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB per image

  // Validation
  const isTitleValid = $derived(title.trim().length >= 3);
  const isDescriptionValid = $derived(description.trim().length >= 10);
  const isLocationValid = $derived(latitude !== 0 && longitude !== 0);
  const hasSitios = $derived(sitioIds.length > 0);
  const hasCost = $derived(cost > 0);
  const hasProjectDate = $derived(projectDate !== '');

  const isBasicInfoComplete = $derived(isTitleValid && isDescriptionValid && hasProjectDate);
  const isLocationComplete = $derived(isLocationValid && hasSitios);

  const canSave = $derived(isBasicInfoComplete && isLocationComplete && hasCost);

  onMount(() => {
    if (!canCreate) {
      toast.error('You do not have permission to create projects');
      goto('/admin/projects');
      return;
    }
    isLoading = false;
  });

  // Track changes
  $effect(() => {
    if (
      title ||
      description ||
      latitude ||
      longitude ||
      sitioIds.length > 0 ||
      cost > 0 ||
      projectDate ||
      images.length > 0
    ) {
      hasUnsavedChanges = true;
    }
  });

  async function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    isUploadingImage = true;
    imageUploadError = '';

    const file = input.files[0];
    const validation = validateImageFile(file, MAX_IMAGE_SIZE);

    if (!validation.valid) {
      imageUploadError = validation.error || 'Invalid image';
      isUploadingImage = false;
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      // Compress image
      const compressed = await compressImage(base64, 800, 0.7);
      images = [...images, compressed];
      toast.success('Image added successfully');
    } catch (error) {
      imageUploadError = 'Failed to process image';
      console.error('Image upload error:', error);
    } finally {
      isUploadingImage = false;
      input.value = '';
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function compressImage(base64: string, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = base64;
    });
  }

  function removeImage(index: number) {
    images = images.filter((_, i) => i !== index);
  }

  async function handleSave() {
    if (!canSave) {
      toast.error('Please complete all required fields');
      return;
    }

    isSaving = true;

    try {
      const project = addProject({
        title: title.trim(),
        description: description.trim(),
        location: { latitude, longitude },
        sitioIds,
        cost,
        projectDate,
        images
      });

      if (project) {
        toast.success('Project created successfully!', {
          description: `"${title}" has been added.`
        });
        hasUnsavedChanges = false;
        goto('/admin/projects');
      } else {
        toast.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to create project');
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    if (hasUnsavedChanges) {
      cancelDialogOpen = true;
    } else {
      goto('/admin/projects');
    }
  }

  function confirmCancel() {
    hasUnsavedChanges = false;
    goto('/admin/projects');
  }
</script>

<svelte:head>
  <title>Add Project - Admin | CATCH-UP Data Bank</title>
</svelte:head>

<AdminHeader title="Add New Project" description="Create a new implemented project record">
  {#snippet actions()}
    <Button variant="outline" onclick={handleCancel}>
      <X class="mr-2 size-4" />
      Cancel
    </Button>
    <Button onclick={handleSave} disabled={!canSave || isSaving}>
      {#if isSaving}
        <Loader2 class="mr-2 size-4 animate-spin" />
        Saving...
      {:else}
        <Save class="mr-2 size-4" />
        Save Project
      {/if}
    </Button>
  {/snippet}
</AdminHeader>

{#if isLoading}
  <div class="flex h-64 items-center justify-center">
    <Loader2 class="size-8 animate-spin text-muted-foreground" />
  </div>
{:else}
  <div class="space-y-6 p-6">
    <!-- Back Button -->
    <Button variant="ghost" size="sm" href="/admin/projects" class="gap-2">
      <ArrowLeft class="size-4" />
      Back to Projects
    </Button>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main Form -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Basic Information -->
        <FormSection
          title="Basic Information"
          description="Project title and description"
          icon={FileText}
          variant="blue"
          isComplete={isBasicInfoComplete}
        >
          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="title">Project Title <span class="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="Enter project title"
                bind:value={title}
                class={!isTitleValid && title ? 'border-destructive' : ''}
              />
              {#if !isTitleValid && title}
                <p class="text-xs text-destructive">Title must be at least 3 characters</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="description"
                >Project Description <span class="text-destructive">*</span></Label
              >
              <Textarea
                id="description"
                placeholder="Describe the project in detail..."
                rows={4}
                bind:value={description}
                class={!isDescriptionValid && description ? 'border-destructive' : ''}
              />
              {#if !isDescriptionValid && description}
                <p class="text-xs text-destructive">Description must be at least 10 characters</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="cost">Project Cost (PHP) <span class="text-destructive">*</span></Label>
              <CurrencyInput bind:value={cost} placeholder="0.00" />
              {#if !hasCost && cost === 0}
                <p class="text-xs text-muted-foreground">Enter the total project cost</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="projectDate">Project Date <span class="text-destructive">*</span></Label>
              <Input
                id="projectDate"
                type="date"
                bind:value={projectDate}
                class={!hasProjectDate && projectDate === '' ? '' : ''}
              />
              <p class="text-xs text-muted-foreground">When was this project implemented?</p>
            </div>
          </div>
        </FormSection>

        <!-- Location & Sitios -->
        <FormSection
          title="Location & Sitios"
          description="Project location and involved sitios"
          icon={MapPin}
          variant="green"
          isComplete={isLocationComplete}
        >
          <div class="space-y-6">
            <div class="space-y-2">
              <Label>Project Location <span class="text-destructive">*</span></Label>
              <p class="text-sm text-muted-foreground">
                Click on the map or enter coordinates to set the project location
              </p>
              <LocationPicker bind:lat={latitude} bind:lng={longitude} />
            </div>

            <div class="space-y-2">
              <Label>Sitios Involved <span class="text-destructive">*</span></Label>
              <p class="text-sm text-muted-foreground">
                Select the sitios that are part of this project
              </p>
              <SitioMultiSelect bind:value={sitioIds} placeholder="Select sitios..." />
            </div>
          </div>
        </FormSection>

        <!-- Images -->
        <FormSection
          title="Project Images"
          description="Add up to 5 images of the project"
          icon={ImagePlus}
          variant="purple"
        >
          <div class="space-y-4">
            <!-- Image Grid -->
            {#if images.length > 0}
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {#each images as image, index (index)}
                  <div class="group relative aspect-square overflow-hidden rounded-lg border">
                    <img
                      src={image}
                      alt="Project image {index + 1}"
                      class="size-full object-cover"
                    />
                    <button
                      type="button"
                      class="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onclick={() => removeImage(index)}
                    >
                      <Trash2 class="size-4" />
                    </button>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Upload Button -->
            {#if images.length < MAX_IMAGES}
              <div
                class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6"
              >
                <input
                  type="file"
                  id="image-upload"
                  class="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onchange={handleImageUpload}
                  disabled={isUploadingImage}
                />
                <label
                  for="image-upload"
                  class="flex cursor-pointer flex-col items-center gap-2 text-center"
                >
                  {#if isUploadingImage}
                    <Loader2 class="size-8 animate-spin text-muted-foreground" />
                    <span class="text-sm text-muted-foreground">Processing...</span>
                  {:else}
                    <ImagePlus class="size-8 text-muted-foreground" />
                    <span class="text-sm font-medium">Click to upload image</span>
                    <span class="text-xs text-muted-foreground">
                      {images.length}/{MAX_IMAGES} images • Max 2MB each
                    </span>
                  {/if}
                </label>
              </div>
            {/if}

            {#if imageUploadError}
              <p class="text-sm text-destructive">{imageUploadError}</p>
            {/if}
          </div>
        </FormSection>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Completion Status -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">Completion Status</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span>Basic Information</span>
              <span
                class={isBasicInfoComplete
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'}
              >
                {isBasicInfoComplete ? '✓ Complete' : 'Incomplete'}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Project Date</span>
              <span
                class={hasProjectDate
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'}
              >
                {hasProjectDate ? '✓ Complete' : 'Incomplete'}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Location & Sitios</span>
              <span
                class={isLocationComplete
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'}
              >
                {isLocationComplete ? '✓ Complete' : 'Incomplete'}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Project Cost</span>
              <span
                class={hasCost ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}
              >
                {hasCost ? '✓ Complete' : 'Incomplete'}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Images (Optional)</span>
              <span class="text-muted-foreground">
                {images.length}/{MAX_IMAGES}
              </span>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Quick Tips -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">Quick Tips</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-2 text-sm text-muted-foreground">
            <p>• Add a descriptive title that identifies the project</p>
            <p>• Include details about project objectives and outcomes</p>
            <p>• Set the location where the project is primarily located</p>
            <p>• Select all sitios that benefit from this project</p>
            <p>• Add images to document the project (optional)</p>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  </div>
{/if}

<!-- Cancel Confirmation Dialog -->
<AlertDialog.Root bind:open={cancelDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Discard Changes?</AlertDialog.Title>
      <AlertDialog.Description>
        You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Continue Editing</AlertDialog.Cancel>
      <AlertDialog.Action
        class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
        onclick={confirmCancel}
      >
        Discard Changes
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
