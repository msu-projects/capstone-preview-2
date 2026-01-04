<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { getImage } from '$lib/utils/image-storage';
  import { ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, X } from '@lucide/svelte';

  interface Photo {
    id: string;
    filename: string;
    storage_ref: string;
    thumbnail_id?: string;
    caption?: string;
  }

  interface Props {
    photos: Photo[];
    columns?: 2 | 3 | 4;
  }

  const { photos, columns = 3 }: Props = $props();

  let lightboxOpen = $state(false);
  let currentIndex = $state(0);
  let loadedImages = $state<Record<string, string>>({});
  let loadingImages = $state<Record<string, boolean>>({});
  let loadError = $state<Record<string, boolean>>({});

  const currentPhoto = $derived(photos[currentIndex]);
  const currentImageUrl = $derived(currentPhoto ? loadedImages[currentPhoto.id] : null);

  // Load image from IndexedDB and create object URL
  async function loadImage(photo: Photo): Promise<void> {
    if (loadedImages[photo.id] || loadingImages[photo.id]) return;

    loadingImages[photo.id] = true;
    loadError[photo.id] = false;

    try {
      // Try thumbnail first for grid view
      const thumbnailId = photo.thumbnail_id || photo.storage_ref;
      const blob = await getImage(thumbnailId);

      if (blob) {
        loadedImages[photo.id] = URL.createObjectURL(blob);
      } else {
        loadError[photo.id] = true;
      }
    } catch {
      loadError[photo.id] = true;
    } finally {
      loadingImages[photo.id] = false;
    }
  }

  // Load full-size image for lightbox
  async function loadFullImage(photo: Photo): Promise<void> {
    const fullKey = `full_${photo.id}`;
    if (loadedImages[fullKey] || loadingImages[fullKey]) return;

    loadingImages[fullKey] = true;

    try {
      const blob = await getImage(photo.storage_ref);
      if (blob) {
        loadedImages[fullKey] = URL.createObjectURL(blob);
      }
    } catch {
      // Fall back to thumbnail if available
    } finally {
      loadingImages[fullKey] = false;
    }
  }

  function openLightbox(index: number) {
    currentIndex = index;
    lightboxOpen = true;
    // Load full image when opening lightbox
    if (photos[index]) {
      loadFullImage(photos[index]);
    }
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % photos.length;
    if (photos[currentIndex]) {
      loadFullImage(photos[currentIndex]);
    }
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    if (photos[currentIndex]) {
      loadFullImage(photos[currentIndex]);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!lightboxOpen) return;

    if (event.key === 'ArrowRight') {
      nextImage();
    } else if (event.key === 'ArrowLeft') {
      prevImage();
    } else if (event.key === 'Escape') {
      lightboxOpen = false;
    }
  }

  // Load thumbnails when photos change
  $effect(() => {
    for (const photo of photos) {
      loadImage(photo);
    }
  });

  // Cleanup object URLs on unmount
  $effect(() => {
    return () => {
      for (const url of Object.values(loadedImages)) {
        URL.revokeObjectURL(url);
      }
    };
  });

  const gridClass = $derived(
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
  );
</script>

<svelte:window onkeydown={handleKeydown} />

{#if photos.length === 0}
  <div
    class="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-400"
  >
    No documentation images uploaded for this month.
  </div>
{:else}
  <!-- Thumbnail Grid -->
  <div class="grid {gridClass} gap-3">
    {#each photos as photo, index}
      <button
        type="button"
        class="group relative aspect-video cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-all hover:border-blue-300 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        onclick={() => openLightbox(index)}
      >
        {#if loadingImages[photo.id]}
          <div class="flex size-full items-center justify-center">
            <Loader2 class="size-6 animate-spin text-slate-400" />
          </div>
        {:else if loadError[photo.id] || !loadedImages[photo.id]}
          <div class="flex size-full flex-col items-center justify-center text-slate-400">
            <ImageIcon class="mb-1 size-6" />
            <span class="text-xs">Image {index + 1}</span>
          </div>
        {:else}
          <img
            src={loadedImages[photo.id]}
            alt={photo.caption || `Photo ${index + 1}`}
            class="size-full object-cover transition-transform group-hover:scale-105"
          />
        {/if}

        {#if photo.caption}
          <div
            class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <p class="truncate text-xs text-white">{photo.caption}</p>
          </div>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<!-- Lightbox Dialog -->
<Dialog.Root bind:open={lightboxOpen}>
  <Dialog.Content class="max-w-4xl border-0 bg-transparent p-0 shadow-none">
    <Dialog.Title class="sr-only">Photo Viewer</Dialog.Title>
    <Dialog.Description class="sr-only">
      Viewing photo {currentIndex + 1} of {photos.length}
    </Dialog.Description>

    <div class="relative">
      <!-- Close button -->
      <button
        type="button"
        class="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        onclick={() => (lightboxOpen = false)}
      >
        <X class="size-5" />
      </button>

      <!-- Image container -->
      <div class="relative flex min-h-[60vh] items-center justify-center rounded-lg bg-black/90">
        {#if currentPhoto}
          {@const fullKey = `full_${currentPhoto.id}`}
          {#if loadingImages[fullKey] && !loadedImages[fullKey]}
            <Loader2 class="size-12 animate-spin text-white" />
          {:else if loadedImages[fullKey]}
            <img
              src={loadedImages[fullKey]}
              alt={currentPhoto.caption || `Photo ${currentIndex + 1}`}
              class="max-h-[80vh] max-w-full object-contain"
            />
          {:else if loadedImages[currentPhoto.id]}
            <!-- Fall back to thumbnail -->
            <img
              src={loadedImages[currentPhoto.id]}
              alt={currentPhoto.caption || `Photo ${currentIndex + 1}`}
              class="max-h-[80vh] max-w-full object-contain"
            />
          {:else}
            <div class="flex flex-col items-center text-white">
              <ImageIcon class="mb-2 size-12" />
              <span>Unable to load image</span>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Navigation arrows -->
      {#if photos.length > 1}
        <button
          type="button"
          class="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          onclick={prevImage}
        >
          <ChevronLeft class="size-6" />
        </button>
        <button
          type="button"
          class="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          onclick={nextImage}
        >
          <ChevronRight class="size-6" />
        </button>
      {/if}

      <!-- Caption and counter -->
      <div class="mt-4 text-center text-white">
        {#if currentPhoto?.caption}
          <p class="mb-2 text-sm">{currentPhoto.caption}</p>
        {/if}
        <p class="text-xs text-white/70">
          {currentIndex + 1} of {photos.length}
        </p>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
