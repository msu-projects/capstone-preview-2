<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import type { ComparisonDiff } from '$lib/types/comparison';
  import { cn } from '$lib/utils';
  import { Minus, TrendingDown, TrendingUp } from '@lucide/svelte';

  interface Props {
    diff: ComparisonDiff | null;
    showValue?: boolean;
    showPercent?: boolean;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let {
    diff,
    showValue = false,
    showPercent = true,
    size = 'md',
    class: className = ''
  }: Props = $props();

  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-base gap-1.5'
  };

  const iconSizes = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5'
  };
</script>

{#if diff}
  <div class={cn('inline-flex items-center', sizeClasses[size], className)}>
    {#if diff.isPositive}
      <TrendingUp class={cn(iconSizes[size], 'text-emerald-600 dark:text-emerald-400')} />
    {:else if diff.change === 0}
      <Minus class={cn(iconSizes[size], 'text-muted-foreground')} />
    {:else}
      <TrendingDown class={cn(iconSizes[size], 'text-red-600 dark:text-red-400')} />
    {/if}

    {#if showPercent}
      <Badge
        variant={diff.isPositive ? 'default' : diff.change === 0 ? 'secondary' : 'destructive'}
        class={cn(
          'font-mono',
          size === 'sm' && 'px-1 py-0 text-[10px]',
          size === 'md' && 'px-1.5 py-0.5 text-xs',
          size === 'lg' && 'px-2 py-1 text-sm'
        )}
      >
        {diff.changePercent > 0 ? '+' : ''}{diff.changePercent.toFixed(1)}%
      </Badge>
    {/if}

    {#if showValue}
      <span class="text-muted-foreground">
        ({diff.change > 0 ? '+' : ''}{diff.change.toLocaleString()})
      </span>
    {/if}
  </div>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
