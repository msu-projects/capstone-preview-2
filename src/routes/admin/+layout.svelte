<script lang="ts">
	import { goto } from '$app/navigation';
	import AppSidebar from '$lib/components/admin/AppSidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let isLoading = $state(true);

	onMount(() => {
		authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		isLoading = false;
	});
</script>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
			<p class="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading...</p>
		</div>
	</div>
{:else}
	<Sidebar.Provider>
		<AppSidebar />
		<Sidebar.Inset>
			<main class="flex flex-1 flex-col pt-0">
				{@render children()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
