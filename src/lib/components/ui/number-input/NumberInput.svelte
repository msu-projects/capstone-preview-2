<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'files'> {
    value?: number;
    clearZeroOnFocus?: boolean;
    onvaluechange?: (value: number) => void;
  }

  let {
    value = $bindable(0),
    clearZeroOnFocus = true,
    onvaluechange,
    class: className,
    onfocus,
    onblur,
    oninput,
    ...restProps
  }: Props = $props();

  let displayValue = $state(formatNumber(value));

  // Format number with commas
  function formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  // Remove commas and parse number
  function parseNumber(str: string): number {
    const cleaned = str.replace(/,/g, '');
    return parseFloat(cleaned);
  }

  function handleFocus(e: FocusEvent & { currentTarget: HTMLInputElement }) {
    const input = e.currentTarget;
    if (clearZeroOnFocus && value === 0) {
      displayValue = '';
      input.value = '';
    }
    onfocus?.(e);
  }

  function handleBlur(e: FocusEvent & { currentTarget: HTMLInputElement }) {
    const input = e.currentTarget;
    if (input.value === '' || input.value === '-') {
      value = 0;
      displayValue = '0';
    } else {
      // Reformat with commas on blur
      displayValue = formatNumber(value);
    }
    onblur?.(e);
  }

  function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
    const input = e.currentTarget;
    const rawValue = input.value;

    // Allow only numbers, commas, minus sign, and decimal point
    const filtered = rawValue.replace(/[^\d,.-]/g, '');

    if (filtered !== rawValue) {
      input.value = filtered;
      displayValue = filtered;
      return;
    }

    displayValue = filtered;
    const numValue = parseNumber(filtered);

    if (!isNaN(numValue)) {
      value = numValue;
      onvaluechange?.(numValue);
    } else if (filtered === '' || filtered === '-') {
      // Allow empty or just minus sign during typing
      value = 0;
      onvaluechange?.(0);
    }

    oninput?.(e);
  }

  // Update display value when value prop changes externally
  $effect(() => {
    displayValue = formatNumber(value);
  });
</script>

<Input
  type="text"
  value={displayValue}
  onfocus={handleFocus}
  onblur={handleBlur}
  oninput={handleInput}
  class={className}
  {...restProps}
/>
