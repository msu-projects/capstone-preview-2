<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { ChevronLeft, ChevronRight, X } from '@lucide/svelte';

	interface Props {
		images: string[];
		columns?: 2 | 3 | 4;
	}

	const { images, columns = 3 }: Props = $props();

	let lightboxOpen = $state(false);
	let currentIndex = $state(0);

	const currentImage = $derived(images[currentIndex]);

	function openLightbox(index: number): void {
		currentIndex = index;
		lightboxOpen = true;
	}

	function closeLightbox(): void {
		lightboxOpen = false;
	}

	function goToPrevious(): void {
		currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
	}

	function goToNext(): void {
		currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (!lightboxOpen) return;

		switch (event.key) {
			case 'ArrowLeft':
				goToPrevious();
				break;
			case 'ArrowRight':
				goToNext();
				break;
			case 'Escape':
				closeLightbox();
				break;
		}
	}

	const gridClass = $derived(
		columns === 2
			? 'grid-cols-2'
			: columns === 3
				? 'grid-cols-2 sm:grid-cols-3'
				: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if images.length > 0}
	<div class="grid {gridClass} gap-2">
		{#each images as image, i}
			<button
				type="button"
				class="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
				onclick={() => openLightbox(i)}
			>
				<img
					src={image}
					alt="Image {i + 1}"
					class="size-full object-cover transition-transform duration-200 group-hover:scale-105"
				/>
				<div
					class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20"
				>
					<span
						class="rounded-full bg-white/90 px-2 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
					>
						View
					</span>
				</div>
			</button>
		{/each}
	</div>
{:else}
	<div class="flex aspect-video items-center justify-center rounded-lg bg-muted">
		<p class="text-sm text-muted-foreground">No images available</p>
	</div>
{/if}

<!-- Lightbox Dialog -->
<Dialog.Root bind:open={lightboxOpen}>
	<Dialog.Content
		class="h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] border-none bg-black/95 p-0 sm:h-[90vh] sm:w-[90vw] sm:max-w-[90vw]"
	>
		<Dialog.Title class="sr-only">Image {currentIndex + 1} of {images.length}</Dialog.Title>
		<Dialog.Description class="sr-only">
			Viewing image {currentIndex + 1} of {images.length}. Use arrow keys to navigate.
		</Dialog.Description>

		<!-- Close Button -->
		<button
			type="button"
			class="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
			onclick={closeLightbox}
		>
			<X class="size-6" />
		</button>

		<!-- Navigation Buttons -->
		{#if images.length > 1}
			<button
				type="button"
				class="absolute top-1/2 left-4 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
				onclick={goToPrevious}
			>
				<ChevronLeft class="size-8" />
			</button>

			<button
				type="button"
				class="absolute top-1/2 right-4 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
				onclick={goToNext}
			>
				<ChevronRight class="size-8" />
			</button>
		{/if}

		<!-- Image -->
		<div class="flex size-full items-center justify-center p-4">
			{#if currentImage}
				<img
					src={currentImage}
					alt="Image {currentIndex + 1}"
					class="max-h-full max-w-full object-contain"
				/>
			{/if}
		</div>

		<!-- Counter -->
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2">
			<span class="text-sm text-white">
				{currentIndex + 1} / {images.length}
			</span>
		</div>
	</Dialog.Content>
</Dialog.Root>
