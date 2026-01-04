<script lang="ts">
  import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
</script>

<svelte:head>
  <title>Sitio Recommendations - South Cotabato Data Bank</title>
</svelte:head>

<!-- Breadcrumb -->
<AppBreadcrumb
  items={[{ label: 'Sitios Dashboard', href: '/sitios' }, { label: 'Recommendations' }]}
/>

<div class="container mx-auto p-6">
  <!-- <SitioRecommendations isAdminView={false} /> -->
</div>
