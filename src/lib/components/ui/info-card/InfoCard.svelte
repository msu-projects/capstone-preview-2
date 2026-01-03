<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import type { Icon as IconType } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Card title displayed in the header */
		title: string;
		/** Optional description below the title */
		description?: string;
		/** Icon to display in the header */
		icon?: typeof IconType;
		/** Icon background color class (e.g., 'bg-blue-100') */
		iconBgColor?: string;
		/** Icon text color class (e.g., 'text-blue-600') */
		iconTextColor?: string;
		/** Header background color class (e.g., 'bg-blue-50/50') */
		headerBgColor?: string;
		/** Optional badge text to show in header */
		badgeText?: string;
		/** Badge variant */
		badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
		/** Badge custom class for styling */
		badgeClass?: string;
		/** Additional class names for the card root */
		class?: string;
		/** Content padding class (defaults to 'py-6') */
		contentPadding?: string;
		/** Whether to remove content padding (p-0) */
		noPadding?: boolean;
		/** Whether to show border between header and content */
		showHeaderBorder?: boolean;
		/** Additional header class names */
		headerClass?: string;
		/** Children content */
		children?: Snippet;
		/** Optional header action slot (e.g., for trend buttons) */
		headerAction?: Snippet;
	}

	const {
		title,
		description,
		icon: Icon,
		iconBgColor = 'bg-slate-100',
		iconTextColor = 'text-slate-600',
		headerBgColor = 'bg-slate-50/50',
		badgeText,
		badgeVariant = 'outline',
		badgeClass = '',
		class: className = '',
		contentPadding = 'py-6',
		noPadding = false,
		showHeaderBorder = true,
		headerClass = '',
		children,
		headerAction
	}: Props = $props();

	const headerBorderClass = $derived(showHeaderBorder ? 'border-b' : '');
	const finalContentPadding = $derived(noPadding ? 'p-0' : contentPadding);
</script>

<Card.Root class="gap-0 py-0 shadow-sm {className}">
	<Card.Header
		class={cn(
			'p-6 dark:border-slate-700 dark:bg-slate-800/50',
			headerBgColor,
			headerBorderClass,
			headerClass
		)}
	>
		<div class="flex items-start justify-between">
			<div class="flex items-center gap-2">
				{#if Icon}
					<div
						class="rounded-lg {iconBgColor} dark:bg-opacity-30 p-1.5 dark:ring-1 dark:ring-white/10"
					>
						<Icon class="size-4 {iconTextColor} dark:opacity-90" />
					</div>
				{/if}
				<div>
					<Card.Title class="text-lg dark:text-slate-100">{title}</Card.Title>
					{#if description}
						<Card.Description class="dark:text-slate-400">{description}</Card.Description>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if headerAction}
					{@render headerAction()}
				{/if}
				{#if badgeText}
					<Badge variant={badgeVariant} class={badgeClass}>
						{badgeText}
					</Badge>
				{/if}
			</div>
		</div>
	</Card.Header>
	<Card.Content class={finalContentPadding}>
		{#if children}
			{@render children()}
		{/if}
	</Card.Content>
</Card.Root>
