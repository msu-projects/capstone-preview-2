<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { GripVertical, Plus, X } from '@lucide/svelte';

	interface Props {
		items: string[];
		label?: string;
		placeholder?: string;
		onUpdate: (items: string[]) => void;
		allowReorder?: boolean;
		maxItems?: number;
	}

	let {
		items = [],
		label,
		placeholder = 'Enter value',
		onUpdate,
		allowReorder = true,
		maxItems
	}: Props = $props();

	let newItem = $state('');
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function addItem() {
		if (!newItem.trim()) return;
		if (maxItems && items.length >= maxItems) return;
		if (items.includes(newItem.trim())) {
			newItem = '';
			return;
		}
		onUpdate([...items, newItem.trim()]);
		newItem = '';
	}

	function removeItem(index: number) {
		onUpdate(items.filter((_, i) => i !== index));
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addItem();
		}
	}

	// Drag and drop handlers
	function handleDragStart(e: DragEvent, index: number) {
		if (!allowReorder) return;
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', index.toString());
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		if (!allowReorder || draggedIndex === null) return;
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	function handleDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault();
		if (!allowReorder || draggedIndex === null || draggedIndex === dropIndex) {
			resetDragState();
			return;
		}

		const newItems = [...items];
		const [draggedItem] = newItems.splice(draggedIndex, 1);
		newItems.splice(dropIndex, 0, draggedItem);
		onUpdate(newItems);
		resetDragState();
	}

	function handleDragEnd() {
		resetDragState();
	}

	function resetDragState() {
		draggedIndex = null;
		dragOverIndex = null;
	}
</script>

<div class="space-y-3">
	{#if label}
		<p class="text-sm font-medium">{label}</p>
	{/if}

	<div class="flex gap-2">
		<Input
			bind:value={newItem}
			{placeholder}
			onkeydown={handleKeyDown}
			disabled={maxItems !== undefined && items.length >= maxItems}
		/>
		<Button
			variant="outline"
			size="icon"
			onclick={addItem}
			disabled={!newItem.trim() || (maxItems !== undefined && items.length >= maxItems)}
		>
			<Plus class="size-4" />
		</Button>
	</div>

	{#if items.length > 0}
		<div class="rounded-md border border-border/50">
			{#each items as item, index (item)}
				<div
					class="flex items-center gap-2 border-b border-border/50 px-3 py-2 transition-all duration-150 last:border-b-0
						{allowReorder ? 'cursor-grab active:cursor-grabbing' : ''}
						{draggedIndex === index ? 'bg-muted/50 opacity-50' : ''}
						{dragOverIndex === index && draggedIndex !== index
						? 'border-t-2 border-t-primary bg-primary/10'
						: ''}"
					draggable={allowReorder}
					ondragstart={(e) => handleDragStart(e, index)}
					ondragover={(e) => handleDragOver(e, index)}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, index)}
					ondragend={handleDragEnd}
					role="listitem"
					aria-grabbed={draggedIndex === index}
				>
					{#if allowReorder}
						<div
							class="flex items-center text-muted-foreground transition-colors hover:text-foreground"
						>
							<GripVertical class="size-4" />
						</div>
					{/if}
					<span class="flex-1 text-sm select-none">{item}</span>
					<Button
						variant="ghost"
						size="icon"
						class="size-7 shrink-0"
						onclick={() => removeItem(index)}
						draggable={false}
					>
						<X class="size-3" />
					</Button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground italic">No items added yet.</p>
	{/if}

	{#if maxItems}
		<p class="text-xs text-muted-foreground">
			{items.length} / {maxItems} items
		</p>
	{/if}
</div>
