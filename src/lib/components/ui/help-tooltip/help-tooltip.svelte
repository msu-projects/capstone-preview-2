<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import { CircleHelp } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		content?: string;
		side?: 'top' | 'bottom' | 'left' | 'right';
		class?: string;
		children?: Snippet;
	}

	let { content, side = 'top', class: className, children }: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger
		class={cn(
			'inline-flex size-4 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground',
			className
		)}
	>
		<CircleHelp class="size-3.5" />
	</Tooltip.Trigger>
	<Tooltip.Content {side} class="max-w-70 text-pretty">
		{#if children}
			{@render children()}
		{:else}
			{content}
		{/if}
	</Tooltip.Content>
</Tooltip.Root>
