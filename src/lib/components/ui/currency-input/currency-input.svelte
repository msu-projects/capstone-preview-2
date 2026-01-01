<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		value?: string | number;
		placeholder?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		min?: number;
		max?: number;
	}

	let {
		value = $bindable(''),
		placeholder = '₱ 0',
		id,
		required = false,
		disabled = false,
		class: className,
		min = 0,
		max
	}: Props = $props();

	// Internal display value with formatting
	let displayValue = $state('');
	let isFocused = $state(false);

	// Format number with commas
	function formatWithCommas(num: number): string {
		return num.toLocaleString('en-PH');
	}

	// Parse formatted string to number
	function parseFormattedValue(str: string): number {
		// Remove peso sign, commas, and spaces
		const cleaned = str.replace(/[₱,\s]/g, '');
		const num = parseFloat(cleaned);
		return isNaN(num) ? 0 : num;
	}

	// Update display value when value prop changes
	$effect(() => {
		if (!isFocused) {
			const numValue = typeof value === 'string' ? parseFloat(value) : value;
			if (numValue && !isNaN(numValue)) {
				displayValue = `₱ ${formatWithCommas(numValue)}`;
			} else {
				displayValue = '';
			}
		}
	});

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		let rawValue = input.value;

		// Extract only numbers from input
		const numericValue = parseFormattedValue(rawValue);

		// Apply min/max constraints
		let constrainedValue = numericValue;
		if (min !== undefined && constrainedValue < min) {
			constrainedValue = min;
		}
		if (max !== undefined && constrainedValue > max) {
			constrainedValue = max;
		}

		// Update the bound value as a number
		value = constrainedValue;

		// Update display with formatting
		if (constrainedValue === 0 && rawValue === '') {
			displayValue = '';
		} else {
			displayValue = `₱ ${formatWithCommas(constrainedValue)}`;
		}

		// Preserve cursor position
		const cursorPosition = input.selectionStart || 0;
		const previousLength = rawValue.length;
		const newLength = displayValue.length;
		const diff = newLength - previousLength;

		setTimeout(() => {
			input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
		}, 0);
	}

	function handleFocus() {
		isFocused = true;
		// Keep the formatted display when focused
	}

	function handleBlur() {
		isFocused = false;
		// Reformat on blur to ensure consistency
		const numValue = typeof value === 'string' ? parseFloat(value) : value;
		if (numValue && !isNaN(numValue)) {
			displayValue = `₱ ${formatWithCommas(numValue)}`;
		} else {
			displayValue = '';
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		const input = event.target as HTMLInputElement;
		const key = event.key;

		// Allow: backspace, delete, tab, escape, enter
		if (
			['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(key)
		) {
			return;
		}

		// Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
		if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
			return;
		}

		// Prevent if not a number or decimal point
		if (!/^\d$/.test(key) && key !== '.') {
			event.preventDefault();
		}

		// Only allow one decimal point
		if (key === '.' && input.value.includes('.')) {
			event.preventDefault();
		}
	}
</script>

<div class="relative">
	<input
		type="text"
		{id}
		{required}
		{disabled}
		{placeholder}
		value={displayValue}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeyDown}
		class={cn(
			'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
	/>
</div>
