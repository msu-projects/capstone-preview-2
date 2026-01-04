<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
  import { FileDown } from '@lucide/svelte';

  interface Props {
    currentStep: string;
    progress: number;
  }

  let { currentStep, progress }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-6 py-12">
  <div class="relative">
    <div class="h-20 w-20 rounded-full border-4 border-muted">
      <div
        class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
        style="transform: rotate({progress * 3.6}deg)"
      ></div>
    </div>
    <div class="absolute inset-0 flex items-center justify-center">
      <FileDown class="h-8 w-8 animate-pulse text-primary" />
    </div>
  </div>

  <div class="space-y-2 text-center">
    <h3 class="text-lg font-medium">Generating Report</h3>
    <p class="text-sm text-muted-foreground">{currentStep}</p>
  </div>

  <div class="w-full max-w-xs">
    <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div class="h-full bg-primary transition-all duration-300" style="width: {progress}%"></div>
    </div>
    <p class="mt-2 text-center text-sm text-muted-foreground">{progress}% complete</p>
  </div>

  <Spinner size="sm" class="text-muted-foreground" />
</div>
