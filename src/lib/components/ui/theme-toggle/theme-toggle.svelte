<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { themeStore, type Theme } from '$lib/stores/theme.svelte';
	import { Monitor, Moon, Sun } from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		variant?: 'dropdown' | 'inline';
	}

	let { variant = 'dropdown' }: Props = $props();

	onMount(() => {
		themeStore.initializeTheme();
	});

	onDestroy(() => {
		themeStore.cleanupTheme();
	});

	function handleThemeChange(newTheme: Theme) {
		themeStore.setTheme(newTheme);
	}

	const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	];
</script>

{#if variant === 'inline'}
	<div class="flex items-center gap-1 rounded-md border bg-muted/50 p-0.5">
		{#each themes as { value, label, icon: Icon }}
			<button
				type="button"
				onclick={() => handleThemeChange(value)}
				class="flex h-7 w-7 items-center justify-center rounded transition-colors {themeStore.theme ===
				value
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				title={label}
			>
				<Icon class="size-4" />
				<span class="sr-only">{label}</span>
			</button>
		{/each}
	</div>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon" class="relative">
					<Sun class="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon
						class="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
					/>
					<span class="sr-only">Toggle theme</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			{#each themes as { value, label, icon: Icon }}
				<DropdownMenu.Item
					onclick={() => handleThemeChange(value)}
					class={themeStore.theme === value ? 'bg-accent' : ''}
				>
					<Icon class="mr-2 h-4 w-4" />
					{label}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
