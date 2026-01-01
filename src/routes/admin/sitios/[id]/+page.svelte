<script lang="ts">
	// import { SitioProfileView } from '$lib/components/sitios/profile';
	import { Button } from '$lib/components/ui/button';
	import { loadSitios } from '$lib/utils/storage';
	import { ArrowLeft } from '@lucide/svelte';

	const { data } = $props<{ data: { id: string } }>();
	const sitioId = $derived(parseInt(data?.id || '0'));
	const sitio = $derived(loadSitios().find((s) => s.id === sitioId));
</script>

<svelte:head>
	<title>{sitio ? sitio.sitioName : 'Sitio Details'} - South Cotabato Data Bank</title>
</svelte:head>

{#if !sitio}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="mb-4 text-3xl font-bold">Sitio Not Found</h1>
			<p class="mb-6 text-muted-foreground">The sitio you're looking for doesn't exist.</p>
			<Button href="/admin/sitios">
				<ArrowLeft class="mr-2" />
				Back to Sitios
			</Button>
		</div>
	</div>
{:else}
	<!-- <SitioProfileView {sitio} isAdminView={true} /> -->
{/if}
