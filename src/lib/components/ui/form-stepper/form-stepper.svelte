<script lang="ts" module>
  import type { Component } from 'svelte';

  export interface Step {
    id: string;
    label: string;
    shortLabel?: string;
    icon: Component;
    isValid?: boolean;
    hasError?: boolean;
  }
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { cn } from '$lib/utils';
  import { Check, CircleAlert, Menu, Sparkles } from '@lucide/svelte';

  let {
    steps,
    activeStep = $bindable(''),
    class: className
  }: {
    steps: Step[];
    activeStep: string;
    class?: string;
  } = $props();

  const isMobile = new IsMobile();
  let mobileMenuOpen = $state(false);

  function handleStepClick(stepId: string) {
    activeStep = stepId;
    mobileMenuOpen = false;
  }

  function getStepState(step: Step, index: number): 'active' | 'completed' | 'error' | 'pending' {
    if (step.hasError) return 'error';
    if (step.id === activeStep) return 'active';
    if (step.isValid) return 'completed';
    return 'pending';
  }

  const activeIndex = $derived(steps.findIndex((s) => s.id === activeStep));
  const activeStepData = $derived(steps.find((s) => s.id === activeStep));
  const completedCount = $derived(steps.filter((s) => s.isValid).length);
  const progressPercent = $derived(Math.round((completedCount / steps.length) * 100));
</script>

{#if isMobile.current}
  <!-- Mobile: Horizontal compact stepper with sheet for full navigation -->
  <div class={cn('relative z-0 mb-4', className)}>
    <!-- Current step indicator bar -->
    <div
      class="relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-3 shadow-sm"
    >
      <!-- Subtle gradient background based on progress -->
      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 via-primary/3 to-transparent transition-all duration-500"
        style="width: {progressPercent}%"
      ></div>

      <Sheet.Root bind:open={mobileMenuOpen}>
        <Sheet.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon"
              class="relative z-10 size-11 shrink-0 rounded-lg hover:bg-muted hover:text-black"
            >
              <Menu class="size-5" />
            </Button>
          {/snippet}
        </Sheet.Trigger>
        <Sheet.Content side="left" class="w-80 p-0">
          <Sheet.Header class="border-b bg-muted/30 p-5">
            <Sheet.Title class="flex items-center gap-2">
              <Sparkles class="size-4 text-primary" />
              Form Progress
            </Sheet.Title>
            <Sheet.Description class="text-sm">
              {completedCount} of {steps.length} sections complete
            </Sheet.Description>
            <!-- Progress bar -->
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
                style="width: {progressPercent}%"
              ></div>
            </div>
          </Sheet.Header>
          <nav class="flex flex-col gap-1 p-3">
            {#each steps as step, index (step.id)}
              {@const state = getStepState(step, index)}
              <button
                type="button"
                onclick={() => handleStepClick(step.id)}
                class={cn(
                  'group flex min-h-14 items-center gap-4 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]',
                  state === 'active' &&
                    'bg-linear-to-r from-primary/15 to-primary/5 shadow-sm ring-1 ring-primary/20',
                  state === 'completed' && 'bg-emerald-500/5 hover:bg-emerald-500/10',
                  state === 'error' && 'bg-destructive/5 hover:bg-destructive/10',
                  state === 'pending' && 'hover:bg-muted/80'
                )}
              >
                <!-- Step indicator -->
                <div
                  class={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200',
                    state === 'active' &&
                      'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30',
                    state === 'completed' &&
                      'border-emerald-500 bg-emerald-500/10 text-emerald-500',
                    state === 'error' && 'border-destructive bg-destructive/10 text-destructive',
                    state === 'pending' &&
                      'border-muted-foreground/20 bg-muted/50 text-muted-foreground'
                  )}
                >
                  {#if state === 'completed'}
                    <Check class="size-5" strokeWidth={2.5} />
                  {:else if state === 'error'}
                    <CircleAlert class="size-5" />
                  {:else}
                    <step.icon class="size-5" />
                  {/if}
                </div>

                <!-- Step label -->
                <div class="flex min-w-0 flex-1 flex-col">
                  <span
                    class={cn(
                      'text-sm font-semibold',
                      state === 'active' && 'text-primary',
                      state === 'completed' && 'text-foreground',
                      state === 'error' && 'text-destructive',
                      state === 'pending' && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    {#if state === 'completed'}
                      Completed
                    {:else if state === 'error'}
                      Needs attention
                    {:else if state === 'active'}
                      In progress
                    {:else}
                      Step {index + 1}
                    {/if}
                  </span>
                </div>

                <!-- Step number badge -->
                <div
                  class={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium',
                    state === 'active' && 'bg-primary/20 text-primary',
                    state === 'completed' && 'bg-emerald-500/20 text-emerald-600',
                    state === 'error' && 'bg-destructive/20 text-destructive',
                    state === 'pending' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>
              </button>
            {/each}
          </nav>
        </Sheet.Content>
      </Sheet.Root>

      <!-- Current step info -->
      <div class="relative z-10 flex min-w-0 flex-1 items-center gap-3">
        {#if activeStepData}
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20"
          >
            <activeStepData.icon class="size-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">{activeStepData.label}</p>
            <p class="text-xs text-muted-foreground">
              Step {activeIndex + 1} of {steps.length} · {progressPercent}% complete
            </p>
          </div>
        {/if}
      </div>

      <!-- Step dots indicator -->
      <div class="relative z-10 flex items-center gap-1.5">
        {#each steps as step, index (step.id)}
          {@const state = getStepState(step, index)}
          <button
            type="button"
            onclick={() => handleStepClick(step.id)}
            class={cn(
              'h-2 rounded-full transition-all duration-300',
              state === 'active' && 'w-6 bg-primary',
              state === 'completed' && 'w-2 bg-emerald-500',
              state === 'error' && 'w-2 bg-destructive',
              state === 'pending' && 'w-2 bg-muted-foreground/30'
            )}
            aria-label="Go to step {index + 1}: {step.label}"
          ></button>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <!-- Desktop: Vertical sidebar stepper -->
  <aside
    class={cn(
      'sticky top-28.5 h-fit w-64 shrink-0 overflow-hidden rounded-xl border bg-card shadow-sm',
      className
    )}
  >
    <!-- Header with progress -->
    <div class="border-b bg-muted/30 p-4">
      <div class="flex items-center gap-2">
        <Sparkles class="size-4 text-primary" />
        <h3 class="text-sm font-semibold text-foreground">Form Progress</h3>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">
        {completedCount} of {steps.length} sections complete
      </p>
      <!-- Progress bar -->
      <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
          style="width: {progressPercent}%"
        ></div>
      </div>
    </div>

    <!-- Steps -->
    <nav class="relative p-3">
      <!-- Connecting line - animated gradient -->
      <div
        class="absolute top-6 left-[41px] z-0 h-[calc(100%-3rem)] w-0.5 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          class="w-full bg-linear-to-b from-primary via-primary to-primary/30 transition-all duration-500"
          style="height: {activeIndex >= steps.length - 1
            ? 100
            : (activeIndex / (steps.length - 1)) * 100}%"
        ></div>
      </div>

      <div class="relative z-10 flex flex-col gap-0.5">
        {#each steps as step, index (step.id)}
          {@const state = getStepState(step, index)}
          <button
            type="button"
            onclick={() => handleStepClick(step.id)}
            class={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200',
              state === 'active' &&
                'bg-linear-to-r from-primary/10 to-transparent shadow-sm ring-1 ring-primary/10',
              state === 'completed' && 'hover:bg-emerald-500/5',
              state === 'error' && 'hover:bg-destructive/5',
              state === 'pending' && 'hover:bg-muted/50'
            )}
          >
            <!-- Step circle indicator -->
            <div
              class={cn(
                'relative flex size-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200',
                state === 'active' &&
                  'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25',
                state === 'completed' && 'border-emerald-500 bg-card text-emerald-500',
                state === 'error' && 'border-destructive bg-card text-destructive',
                state === 'pending' &&
                  'border-muted-foreground/20 bg-card text-muted-foreground group-hover:border-muted-foreground/40 group-hover:bg-card'
              )}
            >
              {#if state === 'completed'}
                <Check class="size-4" strokeWidth={2.5} />
              {:else if state === 'error'}
                <CircleAlert class="size-4" />
              {:else}
                <step.icon class="size-4" />
              {/if}
            </div>

            <!-- Step label -->
            <div class="flex min-w-0 flex-1 flex-col">
              <span
                class={cn(
                  'text-sm leading-tight font-medium transition-colors',
                  state === 'active' && 'text-primary',
                  state === 'completed' && 'text-foreground',
                  state === 'error' && 'text-destructive',
                  state === 'pending' && 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {step.shortLabel || step.label}
              </span>
              <span
                class={cn(
                  'text-xs transition-colors',
                  state === 'active' && 'text-primary/70',
                  state === 'completed' && 'text-emerald-600/70',
                  state === 'error' && 'text-destructive/70',
                  state === 'pending' && 'text-muted-foreground'
                )}
              >
                {#if state === 'completed'}
                  Completed
                {:else if state === 'error'}
                  Needs attention
                {:else if state === 'active'}
                  In progress
                {:else}
                  Step {index + 1}
                {/if}
              </span>
            </div>
          </button>
        {/each}
      </div>
    </nav>
  </aside>
{/if}
