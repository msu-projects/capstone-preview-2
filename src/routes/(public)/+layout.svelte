<script lang="ts">
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import PublicHeader from '$lib/components/public/PublicHeader.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<PublicHeader />

	<main class="flex-1">
		{@render children()}
	</main>

	<PublicFooter />
</div>
