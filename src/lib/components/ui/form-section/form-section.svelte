<script lang="ts">
	import { cn } from '$lib/utils';
	import { Check, ChevronDown } from '@lucide/svelte';
	import type { Component, Snippet } from 'svelte';

	type Variant =
		| 'default'
		| 'success'
		| 'warning'
		| 'info'
		| 'blue'
		| 'green'
		| 'amber'
		| 'purple'
		| 'rose';

	interface Props {
		title: string;
		description?: string;
		icon?: Component;
		variant?: Variant;
		/** @deprecated Use variant instead */
		accent?: Variant;
		collapsible?: boolean;
		defaultOpen?: boolean;
		isComplete?: boolean;
		class?: string;
		children: Snippet;
		actions?: Snippet;
	}

	let {
		title,
		description,
		icon: Icon,
		variant: variantProp,
		accent,
		collapsible = true,
		defaultOpen = true,
		isComplete = false,
		class: className,
		children,
		actions
	}: Props = $props();

	// Support both variant and accent (deprecated) props
	const effectiveVariant = $derived(variantProp ?? accent ?? 'default');

	let isOpen = $state(true);

	const variantColors: Record<Variant, string> = {
		default: 'border-l-muted-foreground/30',
		success: 'border-l-emerald-500',
		green: 'border-l-emerald-500',
		warning: 'border-l-amber-500',
		amber: 'border-l-amber-500',
		info: 'border-l-blue-500',
		blue: 'border-l-blue-500',
		purple: 'border-l-purple-500',
		rose: 'border-l-rose-500'
	};

	const variantBg: Record<Variant, string> = {
		default: 'bg-muted/30',
		success: 'bg-emerald-500/5',
		green: 'bg-emerald-500/5',
		warning: 'bg-amber-500/5',
		amber: 'bg-amber-500/5',
		info: 'bg-blue-500/5',
		blue: 'bg-blue-500/5',
		purple: 'bg-purple-500/5',
		rose: 'bg-rose-500/5'
	};

	const variantIcon: Record<Variant, string> = {
		default: 'text-muted-foreground',
		success: 'text-emerald-500',
		green: 'text-emerald-500',
		warning: 'text-amber-500',
		amber: 'text-amber-500',
		info: 'text-blue-500',
		blue: 'text-blue-500',
		purple: 'text-purple-500',
		rose: 'text-rose-500'
	};

	function toggle() {
		if (collapsible) {
			isOpen = !isOpen;
		}
	}
</script>

<div
	class={cn(
		'relative rounded-lg border border-l-4 bg-card transition-all duration-200',
		variantColors[effectiveVariant],
		isComplete && 'ring-1 ring-emerald-500/20',
		className
	)}
>
	<!-- Header -->
	<button
		type="button"
		onclick={toggle}
		disabled={!collapsible}
		class={cn(
			'flex w-full items-center gap-3 p-4 text-left transition-colors',
			collapsible && 'cursor-pointer hover:bg-muted/50',
			!collapsible && 'cursor-default',
			variantBg[effectiveVariant]
		)}
	>
		<!-- Icon -->
		{#if Icon}
			<div
				class={cn(
					'flex size-9 shrink-0 items-center justify-center rounded-lg',
					variantBg[effectiveVariant],
					variantIcon[effectiveVariant]
				)}
			>
				<Icon class="size-5" />
			</div>
		{/if}

		<!-- Title & Description -->
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-foreground">{title}</h3>
				{#if isComplete}
					<div
						class="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
					>
						<Check class="size-3" />
					</div>
				{/if}
			</div>
			{#if description}
				<p class="mt-0.5 text-sm text-muted-foreground">{description}</p>
			{/if}
		</div>

		<!-- Actions Slot -->
		{#if actions}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="shrink-0" onclick={(e) => e.stopPropagation()}>
				{@render actions()}
			</div>
		{/if}

		<!-- Collapse Indicator -->
		{#if collapsible}
			<div
				class={cn(
					'shrink-0 text-muted-foreground transition-transform duration-200',
					isOpen && 'rotate-180'
				)}
			>
				<ChevronDown class="size-5" />
			</div>
		{/if}
	</button>

	<!-- Content -->
	<div
		class={cn(
			'grid transition-all duration-200 ease-out',
			isOpen ? 'grid-rows-[1fr] py-4 opacity-100' : 'grid-rows-[0fr] opacity-0'
		)}
	>
		<div class="overflow-hidden">
			<div class="space-y-4 p-4 pt-0">
				{@render children()}
			</div>
		</div>
	</div>
</div>
