<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FormSection } from '$lib/components/ui/form-section';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { cn } from '$lib/utils';
	import { deleteImage, getImage, saveImage } from '$lib/utils/image-storage';
	import { Camera, Image, ImagePlus, Trash2, Upload } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	interface SitioImage {
		id: string;
		caption?: string;
		uploaded_at: string;
		preview?: string;
	}

	let {
		images = $bindable<
			Array<{
				id: string;
				caption?: string;
				uploaded_at: string;
			}>
		>([])
	} = $props();

	let imagesList = $state<SitioImage[]>([...images]);

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);

	onMount(async () => {
		// Load preview URLs for existing images
		for (const img of imagesList) {
			if (!img.preview) {
				const blob = await getImage(img.id);
				if (blob) {
					img.preview = URL.createObjectURL(blob);
				}
			}
		}
	});

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) return;

		isUploading = true;

		try {
			for (const file of Array.from(files)) {
				// Validate file type
				if (!file.type.startsWith('image/')) {
					toast.error(`${file.name} is not a valid image file`);
					continue;
				}

				// Validate file size (max 5MB)
				const maxSize = 5 * 1024 * 1024;
				if (file.size > maxSize) {
					toast.error(`${file.name} exceeds 5MB size limit`);
					continue;
				}

				// Generate unique ID
				const imageId = `sitio-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				// Save to IndexedDB
				await saveImage(file, imageId);

				// Create preview URL
				const preview = URL.createObjectURL(file);

				// Add to list
				imagesList.push({
					id: imageId,
					caption: '',
					uploaded_at: new Date().toISOString(),
					preview
				});

				toast.success(`${file.name} uploaded successfully`);
			}
		} catch (error) {
			toast.error('Failed to upload image(s)');
			console.error('Upload error:', error);
		} finally {
			isUploading = false;
			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}
		}
	}

	async function removeImage(imageId: string) {
		try {
			// Delete from IndexedDB
			await deleteImage(imageId);

			// Remove from list
			const index = imagesList.findIndex((img) => img.id === imageId);
			if (index >= 0) {
				// Revoke preview URL
				if (imagesList[index].preview) {
					URL.revokeObjectURL(imagesList[index].preview!);
				}
				imagesList.splice(index, 1);
			}

			toast.success('Image removed');
		} catch (error) {
			toast.error('Failed to remove image');
			console.error('Delete error:', error);
		}
	}

	function updateCaption(imageId: string, caption: string) {
		const image = imagesList.find((img) => img.id === imageId);
		if (image) {
			image.caption = caption;
		}
	}

	// Sync back to parent binding
	$effect(() => {
		images = imagesList.map((img) => ({
			id: img.id,
			caption: img.caption,
			uploaded_at: img.uploaded_at
		}));
	});
</script>

<FormSection
	title="Sitio Photos & Images"
	description="Add photos of the sitio community for documentation and reference"
	icon={Camera}
	variant="info"
	collapsible={false}
>
	<!-- Upload Section -->
	<div class="space-y-6">
		<div
			class={cn(
				'group relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
				'hover:border-primary/50 hover:bg-primary/5',
				isUploading && 'pointer-events-none opacity-60'
			)}
			onclick={() => fileInput?.click()}
			onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
			role="button"
			tabindex="0"
		>
			<input
				bind:this={fileInput}
				type="file"
				multiple
				accept="image/*"
				class="hidden"
				onchange={handleFileSelect}
				disabled={isUploading}
			/>
			<div
				class="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110"
			>
				<ImagePlus class="size-8" />
			</div>
			<p class="mb-2 text-base font-semibold">
				{isUploading ? 'Uploading...' : 'Drop images here or click to upload'}
			</p>
			<p class="text-sm text-muted-foreground">Supports JPG, PNG, WebP up to 5MB each</p>
			<div class="mt-4">
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="gap-2 rounded-lg"
					disabled={isUploading}
					onclick={(e) => {
						e.stopPropagation();
						fileInput?.click();
					}}
				>
					<Upload class="size-4" />
					Browse Files
				</Button>
			</div>
		</div>

		<!-- Images Grid -->
		{#if imagesList.length > 0}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<p class="text-sm font-semibold">
						Uploaded Images
						<span class="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
							{imagesList.length}
						</span>
					</p>
				</div>

				<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{#each imagesList as image (image.id)}
						<div
							class="group relative overflow-hidden rounded-xl border-2 bg-card transition-all hover:border-primary/30 hover:shadow-lg"
						>
							<!-- Image Preview -->
							<div class="relative aspect-4/3 overflow-hidden bg-muted">
								{#if image.preview}
									<img
										src={image.preview}
										alt={image.caption || 'Sitio image'}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								{:else}
									<div class="flex h-full items-center justify-center">
										<Image class="size-10 text-muted-foreground/30" />
									</div>
								{/if}

								<!-- Overlay on hover -->
								<div
									class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										class="gap-2"
										onclick={() => removeImage(image.id)}
									>
										<Trash2 class="size-4" />
										Remove
									</Button>
								</div>
							</div>

							<!-- Caption & Date -->
							<div class="p-4">
								<div class="space-y-2">
									<Label class="text-xs font-medium text-muted-foreground">Caption (optional)</Label
									>
									<Textarea
										placeholder="Add a description..."
										value={image.caption || ''}
										onchange={(e) =>
											updateCaption(image.id, (e.target as HTMLTextAreaElement).value)}
										class="min-h-20 resize-none rounded-lg text-sm"
									/>
								</div>
								<p class="mt-3 text-xs text-muted-foreground">
									Uploaded {new Date(image.uploaded_at).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric'
									})}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div
				class="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed py-12 text-center"
			>
				<div class="flex size-12 items-center justify-center rounded-full bg-muted">
					<Image class="size-6 text-muted-foreground" />
				</div>
				<div>
					<p class="font-medium text-muted-foreground">No images uploaded yet</p>
					<p class="mt-1 text-sm text-muted-foreground/75">
						Upload images to document the sitio community
					</p>
				</div>
			</div>
		{/if}
	</div>
</FormSection>
