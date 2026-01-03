<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import { TrendingDown, TrendingUp } from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		icon: Component;
		trend?: { value: number; label: string; isPositive?: boolean };
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
		class?: string;
	}

	let {
		title,
		value,
		subtitle,
		icon: Icon,
		trend,
		variant = 'default',
		class: className
	}: Props = $props();

	const variantStyles = {
		default: {
			bg: 'bg-slate-100 dark:bg-slate-800',
			icon: 'text-slate-600 dark:text-slate-400',
			accent: 'bg-slate-500'
		},
		primary: {
			bg: 'bg-blue-100 dark:bg-blue-900/30',
			icon: 'text-blue-600 dark:text-blue-400',
			accent: 'bg-blue-500'
		},
		success: {
			bg: 'bg-emerald-100 dark:bg-emerald-900/30',
			icon: 'text-emerald-600 dark:text-emerald-400',
			accent: 'bg-emerald-500'
		},
		warning: {
			bg: 'bg-amber-100 dark:bg-amber-900/30',
			icon: 'text-amber-600 dark:text-amber-400',
			accent: 'bg-amber-500'
		},
		danger: {
			bg: 'bg-rose-100 dark:bg-rose-900/30',
			icon: 'text-rose-600 dark:text-rose-400',
			accent: 'bg-rose-500'
		}
	};

	const styles = $derived(variantStyles[variant]);

	// Determine if trend is positive based on isPositive flag (if provided) or value
	const trendIsPositive = $derived(
		trend ? (trend.isPositive !== undefined ? trend.isPositive : trend.value >= 0) : false
	);
</script>

<Card.Root class={cn('relative overflow-hidden py-0', className)}>
	<div class="absolute top-0 right-0 h-1 w-full {styles.accent} opacity-80"></div>
	<Card.Content class="p-5 sm:p-7">
		<div class="flex items-start justify-between gap-4">
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
				<p class="mt-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">
					{typeof value === 'number' ? value.toLocaleString() : value}
				</p>
				{#if subtitle}
					<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
				{/if}
				{#if trend}
					<p
						class="mt-2 flex items-center gap-1 text-sm font-medium {trendIsPositive
							? 'text-emerald-600 dark:text-emerald-400'
							: 'text-rose-600 dark:text-rose-400'}"
					>
						{#if trend.value >= 0}
							<TrendingUp class="size-4" />
						{:else}
							<TrendingDown class="size-4" />
						{/if}
						{Math.abs(trend.value)}% {trend.label}
					</p>
				{/if}
			</div>
			<div class="shrink-0 rounded-xl p-3 {styles.bg}">
				<Icon class="size-6 {styles.icon}" />
			</div>
		</div>
	</Card.Content>
</Card.Root>
