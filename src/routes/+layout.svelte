<script lang="ts">
  import { Toaster } from '$lib/components/ui/sonner';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import '$lib/mock-data';
  import { authStore } from '$lib/stores/auth.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { onMount } from 'svelte';
  import './layout.css';

  let { children } = $props();

  onMount(() => {
    authStore.initialize();
    themeStore.initializeTheme();
  });
</script>

<Tooltip.Provider delayDuration={300}>
  {@render children()}
</Tooltip.Provider>
<Toaster />
